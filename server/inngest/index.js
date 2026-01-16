import "dotenv/config";
import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import sendEmail from "../configs/nodeMailer.js";

/**
 * Inngest client
 */
export const inngest = new Inngest({
  id: "workspace-sync",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

/* ======================================================
   USER SYNC FUNCTIONS
====================================================== */

export const syncUser = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    const user = await step.run("upsert-user", async () => {
      return prisma.user.upsert({
        where: { id },
        create: {
          id,
          email: email_addresses?.[0]?.email_address,
          name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || "User",
          image: image_url || "",
        },
        update: {
          email: email_addresses?.[0]?.email_address,
          name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || "User",
          image: image_url || "",
        },
      });
    });

    return { userId: user.id };
  }
);

export const updateUser = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event, step }) => {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    await step.run("update-user", async () => {
      return prisma.user.update({
        where: { id },
        data: {
          email: email_addresses?.[0]?.email_address,
          name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || "User",
          image: image_url || "",
        },
      });
    });

    return { userId: id };
  }
);

export const deleteUser = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event, step }) => {
    await step.run("delete-user", async () => {
      return prisma.user.delete({ where: { id: event.data.id } });
    });

    return { deleted: true };
  }
);

/* ======================================================
   WORKSPACE / ORGANIZATION
====================================================== */

export const syncWorkspace = inngest.createFunction(
  { id: "sync-workspace-from-clerk" },
  { event: "clerk/organization.created" },
  async ({ event, step }) => {
    const { id, name, slug, image_url, created_by } = event.data;

    const creator = await prisma.user.findUnique({
      where: { id: created_by },
    });

    if (!creator) throw new Error(`Creator ${created_by} not found`);

    const workspace = await step.run("create-workspace", async () => {
      return prisma.workspace.create({
        data: {
          id,
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
          description: `${name} workspace`,
          ownerId: created_by,
          image_url: image_url || "",
          settings: {},
        },
      });
    });

    await step.run("add-admin-member", async () => {
      return prisma.workspaceMember.create({
        data: {
          userId: created_by,
          workspaceId: workspace.id,
          role: "ADMIN",
        },
      });
    });

    return { workspaceId: workspace.id };
  }
);

export const updateWorkspace = inngest.createFunction(
  { id: "update-workspace-from-clerk" },
  { event: "clerk/organization.updated" },
  async ({ event, step }) => {
    await step.run("update-workspace", async () => {
      return prisma.workspace.update({
        where: { id: event.data.id },
        data: {
          name: event.data.name,
          slug:
            event.data.slug ||
            event.data.name.toLowerCase().replace(/\s+/g, "-"),
          image_url: event.data.image_url || "",
        },
      });
    });

    return { updated: true };
  }
);

export const deleteWorkspace = inngest.createFunction(
  { id: "delete-workspace-from-clerk" },
  { event: "clerk/organization.deleted" },
  async ({ event, step }) => {
    await step.run("delete-workspace", async () => {
      return prisma.workspace.delete({ where: { id: event.data.id } });
    });

    return { deleted: true };
  }
);

/* ======================================================
   INVITATION ACCEPTED → MEMBER SYNC
====================================================== */

export const syncWorkspaceMember = inngest.createFunction(
  { id: "sync-workspace-member-from-clerk" },
  { event: "clerk/organizationInvitation.accepted" },
  async ({ event, step }) => {
    const { organization, public_user_data, role } = event.data;

    const member = await step.run("add-member", async () => {
      return prisma.workspaceMember.create({
        data: {
          userId: public_user_data.user_id,
          workspaceId: organization.id,
          role: role === "org:admin" ? "ADMIN" : "MEMBER",
        },
      });
    });

    return { memberId: member.id };
  }
);

/* ======================================================
   TASK ASSIGNMENT EMAIL (STEP 3 + 4 FIXED)
====================================================== */

export const sendTaskAssignmentEmail = inngest.createFunction(
  { id: "send-task-assignment-email" },
  { event: "app/task.assigned" },
  async ({ event, step }) => {
    const { taskId, origin } = event.data;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, project: true },
    });

    if (!task || !task.assignee?.email) return;

    // ✅ Safe task link (OPTIONAL)
    const taskLink =
      origin && typeof origin === "string"
        ? `${origin}/tasks/${taskId}`
        : null;

    const ctaHtml = taskLink
      ? `
        <div style="margin:24px 0;text-align:center">
          <a href="${taskLink}"
             style="background:#007bff;color:#fff;padding:12px 28px;
                    border-radius:6px;text-decoration:none;font-weight:600">
            View Task →
          </a>
        </div>
      `
      : `
        <p style="text-align:center;font-size:13px;color:#6b7280">
          Open the application to view this task.
        </p>
      `;

    await step.run("send-assignment-email", async () => {
      return sendEmail({
        to: task.assignee.email,
        subject: `New Task Assignment in ${task.project.name}`,
        body: `
          <div style="font-family:Segoe UI, Arial, sans-serif">
            <h2>Hi ${task.assignee.name} 👋</h2>
            <p>You have been assigned a new task:</p>
            <p><strong>${task.title}</strong></p>
            ${ctaHtml}
          </div>
        `,
      });
    });

    if (!task.due_date) return;

    await step.sleepUntil("wait-for-due-date", new Date(task.due_date));

    const latest = await prisma.task.findUnique({ where: { id: taskId } });

    if (latest && latest.status !== "DONE") {
      await step.run("send-reminder-email", async () => {
        return sendEmail({
          to: task.assignee.email,
          subject: `Reminder: ${task.title}`,
          body: `
            <div style="font-family:Segoe UI, Arial, sans-serif">
              <p>This task is still pending.</p>
              ${ctaHtml}
            </div>
          `,
        });
      });
    }
  }
);

/* ======================================================
   EXPORT FUNCTIONS
====================================================== */

export const functions = [
  syncUser,
  updateUser,
  deleteUser,
  syncWorkspace,
  updateWorkspace,
  deleteWorkspace,
  syncWorkspaceMember,
  sendTaskAssignmentEmail,
];
