import 'dotenv/config';
import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import sendEmail from '../configs/nodeMailer.js';

export const inngest = new Inngest({
  id: "workspace-sync",
  eventKey: process.env.INNGEST_EVENT_KEY
});

// ============================================
// USER FUNCTIONS
// ============================================

// Sync user from Clerk (CREATE)
const syncUser = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    const user = await step.run("create-user", async () => {
      return await prisma.user.upsert({
        where: { id },
        create: {
          id,
          email: email_addresses[0].email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
          image: image_url || '',
        },
        update: {
          email: email_addresses[0].email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
          image: image_url || '',
        },
      });
    });

    console.log('✅ User synced:', user.id);
    return { user };
  }
);

// Update user from Clerk (UPDATE)
const updateUser = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event, step }) => {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    const user = await step.run("update-user", async () => {
      return await prisma.user.update({
        where: { id },
        data: {
          email: email_addresses[0].email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
          image: image_url || '',
        },
      });
    });

    console.log('✅ User updated:', user.id);
    return { user };
  }
);

// Delete user from Clerk (DELETE)
const deleteUser = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event, step }) => {
    const { id } = event.data;

    await step.run("delete-user", async () => {
      return await prisma.user.delete({
        where: { id }
      });
    });

    console.log('✅ User deleted:', id);
    return { deleted: true, userId: id };
  }
);

// ============================================
// WORKSPACE/ORGANIZATION FUNCTIONS
// ============================================

// Sync workspace from Clerk (CREATE)
const syncWorkspace = inngest.createFunction(
  { id: "sync-workspace-from-clerk" },
  { event: "clerk/organization.created" },
  async ({ event, step }) => {
    const { id, name, slug, image_url, created_by } = event.data;

    console.log('📦 Syncing organization:', { id, name, created_by });

    // Step 1: Ensure creator exists
    const creator = await step.run("ensure-creator-exists", async () => {
      return await prisma.user.findUnique({
        where: { id: created_by }
      });
    });

    if (!creator) {
      console.error('❌ Creator not found:', created_by);
      throw new Error(`Creator user ${created_by} not found`);
    }

    // Step 2: Create workspace
    const workspace = await step.run("create-workspace", async () => {
      return await prisma.workspace.create({
        data: {
          id,
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          description: `${name} workspace`,
          ownerId: created_by,
          image_url: image_url || '',
          settings: {},
        },
      });
    });

    // Step 3: Add creator as admin member
    const member = await step.run("add-creator-as-admin", async () => {
      return await prisma.workspaceMember.create({
        data: {
          userId: created_by,
          workspaceId: workspace.id,
          role: 'ADMIN',
        },
      });
    });

    console.log('✅ Workspace synced:', workspace.id);
    console.log('✅ Admin member added:', member.id);

    return { workspace, member };
  }
);

// Update workspace from Clerk (UPDATE)
const updateWorkspace = inngest.createFunction(
  { id: "update-workspace-from-clerk" },
  { event: "clerk/organization.updated" },
  async ({ event, step }) => {
    const { id, name, slug, image_url } = event.data;

    const workspace = await step.run("update-workspace", async () => {
      return await prisma.workspace.update({
        where: { id },
        data: {
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          image_url: image_url || '',
        },
      });
    });

    console.log('✅ Workspace updated:', workspace.id);
    return { workspace };
  }
);

// Delete workspace from Clerk (DELETE)
const deleteWorkspace = inngest.createFunction(
  { id: "delete-workspace-from-clerk" },
  { event: "clerk/organization.deleted" },
  async ({ event, step }) => {
    const { id } = event.data;

    await step.run("delete-workspace", async () => {
      return await prisma.workspace.delete({
        where: { id }
      });
    });

    console.log('✅ Workspace deleted:', id);
    return { deleted: true, workspaceId: id };
  }
);

// ============================================
// WORKSPACE MEMBERSHIP FUNCTIONS
// ============================================

// Handle organization membership created/accepted
const syncWorkspaceMember = inngest.createFunction(
  { id: "sync-workspace-member-from-clerk" },
  { event: "clerk/organizationInvitation.accepted" },
  async ({ event, step }) => {
    const { organization, public_user_data } = event.data;

    const member = await step.run("add-workspace-member", async () => {
      return await prisma.workspaceMember.create({
        data: {
          userId: public_user_data.user_id,
          workspaceId: organization.id,
          role: event.data.role === 'org:admin' ? 'ADMIN' : 'MEMBER',
        },
      });
    });

    console.log('✅ Workspace member added:', member.id);
    return { member };
  }
);

//send funtion to send email on task creation

const sendTaskAssignmentEmail = inngest.createFunction(
  { id: "send-task-assignment-email " },
  { event: "app/task.assigned" },
  async ({ event, step }) => {
    const { taskId, origin } = event.data;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, project: true }
    })

    await sendEmail({
      to: task.assignee.email,
      subject: `New Task Assignment in ${task.project.name}`,
      body: `<body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Segoe UI, Roboto, Arial, sans-serif;">
  <div style="max-width:620px; margin:40px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,0.06);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #007bff, #00c6ff); padding:28px 24px; color:#ffffff;">
      <h2 style="margin:0; font-size:22px;">
        Hi ${task.assignee.name} 👋
      </h2>
      <p style="margin:8px 0 0; font-size:15px; opacity:0.95;">
        You’ve been assigned a new task
      </p>
    </div>

    <!-- Body -->
    <div style="padding:28px 24px; color:#2c3e50;">

      <!-- Task Title -->
      <h3 style="margin:0 0 12px; font-size:20px; color:#007bff;">
        ${task.title}
      </h3>

      <!-- Info Card -->
      <div style="background:#f8fafc; border:1px solid #e6ecf2; border-radius:10px; padding:16px 18px; margin-bottom:24px;">
        <p style="margin:0 0 10px; font-size:14px;">
          <strong>Description</strong>
        </p>
        <p style="margin:0 0 14px; font-size:14px; line-height:1.6; color:#4b5563;">
          ${task.description}
        </p>

        <p style="margin:0; font-size:14px;">
          <strong>Due Date:</strong>
          <span style="color:#e63946; font-weight:600;">
            ${new Date(task.due_date).toLocaleDateString()}
          </span>
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center; margin-bottom:24px;">
        <a href="${origin}"
           style="display:inline-block; background:#007bff; color:#ffffff; padding:14px 32px;
                  border-radius:8px; font-size:16px; font-weight:600;
                  text-decoration:none; box-shadow:0 6px 16px rgba(0,123,255,0.3);">
          View Task →
        </a>
      </div>

      <!-- Footer Note -->
      <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">
        Please review and complete this task before the due date.<br/>
        If you have any questions, feel free to reach out.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f1f5f9; padding:14px 20px; text-align:center; font-size:12px; color:#94a3b8;">
      © ${new Date().getFullYear()} Task Management System
    </div>

  </div>
</body>
`
    })

    if (new Date(task.due_date).toLocaleDateString() !== new Date().toDateString()) {
      await step.sleepUntil('wait=for-the-due-date', new Date(task.due_date));

      await step.run('check-if-task-is-completed', async () => {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          include: { assignee: true, project: true }
        })

        if (!task) return;

        if (task.status !== "DONE") {
          await step.run('send-task-reminder-mail', async () => {
            await sendEmail({
              to: task.assignee.email,
              subject: `Reminder for ${task.project.name}`,
              body: `
<div style="
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
  background-color: #ffffff;
  font-family: 'Segoe UI', system-ui, Arial, sans-serif;
  color: #1f2937;
">

  <!-- Greeting -->
  <h2 style="
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 600;
  ">
    Hi ${task.assignee.name} 👋
  </h2>

  <!-- Project Info -->
  <p style="
    font-size: 15px;
    margin: 0 0 6px;
    color: #374151;
  ">
    You have a task due in
    <strong>${task.project.name}</strong>
  </p>

  <!-- Task Title -->
  <p style="
    font-size: 19px;
    font-weight: 700;
    color: #007bff;
    margin: 6px 0 16px;
  ">
    ${task.title}
  </p>

  <!-- Task Card -->
  <div style="
    border: 1px solid #e5e7eb;
    background-color: #f9fafb;
    padding: 16px 18px;
    border-radius: 8px;
    margin-bottom: 28px;
  ">
    <p style="
      margin: 0 0 10px;
      font-size: 14px;
      line-height: 1.6;
    ">
      <strong>Description</strong><br/>
      <span style="color:#4b5563;">
        ${task.description}
      </span>
    </p>

    <p style="
      margin: 0;
      font-size: 14px;
    ">
      <strong>Due Date:</strong>
      <span style="color:#dc2626; font-weight:600;">
        ${new Date(task.due_date).toLocaleDateString()}
      </span>
    </p>
  </div>

  <!-- CTA Button -->
  <a href="${origin}"
     style="
       display: inline-block;
       background-color: #007bff;
       padding: 12px 26px;
       border-radius: 6px;
       color: #ffffff;
       font-weight: 600;
       font-size: 15px;
       text-decoration: none;
       box-shadow: 0 4px 12px rgba(0,123,255,0.25);
     ">
    View Task →
  </a>

  <!-- Footer Note -->
  <p style="
    margin-top: 20px;
    font-size: 13px;
    color: #6b7280;
  ">
    Please make sure to review and complete it before the due date.
  </p>

</div>
`

            })
          })
        }
      })
    }
  }
)

// Export all functions
export const functions = [
  // User functions
  syncUser,
  updateUser,
  deleteUser,

  // Workspace functions
  syncWorkspace,
  updateWorkspace,
  deleteWorkspace,

  // Membership functions
  syncWorkspaceMember,

  //Emails sending funtion
  sendTaskAssignmentEmail
];


