import { Inngest } from "inngest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });

/* ───────────────────────────────── USER EVENTS ───────────────────────────────── */

// USER CREATED
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    const { data } = event;

    await step.run("upsert-user", async () => {
      console.log("👤 USER CREATED:", data.id);

      return prisma.user.upsert({
        where: { id: data.id },
        update: {
          email: data?.email_addresses[0]?.email_address,
          name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
          image: data?.image_url || "",
        },
        create: {
          id: data.id,
          email: data?.email_addresses[0]?.email_address || "",
          name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
          image: data?.image_url || "",
        },
      });
    });
  }
);

// USER UPDATED
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event, step }) => {
    const { data } = event;

    await step.run("update-user", async () => {
      console.log("👤 USER UPDATED:", data.id);

      return prisma.user.update({
        where: { id: data.id },
        data: {
          email: data?.email_addresses[0]?.email_address,
          name: `${data?.first_name || ""} ${data?.last_name || ""}`.trim(),
          image: data?.image_url || "",
        },
      });
    });
  }
);

// USER DELETED
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event, step }) => {
    const { data } = event;

    await step.run("delete-user", async () => {
      console.log("👤 USER DELETED:", data.id);
      return prisma.user.delete({ where: { id: data.id } });
    });
  }
);

/* ─────────────────────────────── WORKSPACE EVENTS ─────────────────────────────── */

// ORGANIZATION CREATED
const SyncWorkSpacecreation = inngest.createFunction(
  { id: "sync-workspace-from-clerk" },
  { event: "clerk/organization.created" },
  async ({ event, step }) => {
    const { data } = event;

    console.log("🏢 ORG CREATED EVENT RECEIVED:", {
      orgId: data.id,
      owner: data.created_by,
    });

    await step.run("create-workspace-and-owner", async () => {
      // 1️⃣ ENSURE USER EXISTS (CRITICAL FIX)
      await prisma.user.upsert({
        where: { id: data.created_by },
        update: {},
        create: {
          id: data.created_by,
          email: "",
          name: "Workspace Owner",
          image: "",
        },
      });

      // 2️⃣ UPSERT WORKSPACE
      const workspace = await prisma.workspace.upsert({
        where: { id: data.id },
        update: {
          name: data.name,
          slug: data.slug,
          image_url: data.image_url || "",
        },
        create: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          ownerId: data.created_by,
          image_url: data.image_url || "",
        },
      });

      // 3️⃣ ADD OWNER AS ADMIN
      await prisma.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: data.created_by,
            workspaceId: data.id,
          },
        },
        update: { role: "ADMIN" },
        create: {
          userId: data.created_by,
          workspaceId: data.id,
          role: "ADMIN",
        },
      });

      console.log("✅ WORKSPACE CREATED:", workspace.id);
      return workspace;
    });
  }
);

// ORGANIZATION UPDATED
const WorkSpaceUpdateion = inngest.createFunction(
  { id: "update-workspace-from-clerk" },
  { event: "clerk/organization.updated" },
  async ({ event, step }) => {
    const { data } = event;

    await step.run("update-workspace", async () => {
      console.log("🏢 WORKSPACE UPDATED:", data.id);

      return prisma.workspace.update({
        where: { id: data.id },
        data: {
          name: data.name,
          slug: data.slug,
          image_url: data.image_url || "",
        },
      });
    });
  }
);

// ORGANIZATION DELETED
const syncWorkSpaceDeletion = inngest.createFunction(
  { id: "delete-workspace-from-clerk" },
  { event: "clerk/organization.deleted" },
  async ({ event, step }) => {
    const { data } = event;

    await step.run("delete-workspace", async () => {
      console.log("🏢 WORKSPACE DELETED:", data.id);
      return prisma.workspace.delete({ where: { id: data.id } });
    });
  }
);

/* ───────────────────────────── WORKSPACE MEMBER EVENTS ─────────────────────────── */

// MEMBER INVITE ACCEPTED
const syncWorkspaceMemberCreation = inngest.createFunction(
  { id: "sync-workspace-member-from-clerk" },
  { event: "clerk/organizationInvitation.accepted" },
  async ({ event, step }) => {
    const { data } = event;

    await step.run("add-workspace-member", async () => {
      console.log("👥 MEMBER ADDED:", data.user_id);

      // ensure user exists
      await prisma.user.upsert({
        where: { id: data.user_id },
        update: {},
        create: {
          id: data.user_id,
          email: "",
          name: "Invited User",
          image: "",
        },
      });

      return prisma.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: data.user_id,
            workspaceId: data.organization_id,
          },
        },
        update: {
          role: String(data.role).toUpperCase(),
        },
        create: {
          userId: data.user_id,
          workspaceId: data.organization_id,
          role: String(data.role).toUpperCase(),
        },
      });
    });
  }
);

/* ───────────────────────────────── EXPORTS ───────────────────────────────── */

export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  SyncWorkSpacecreation,
  WorkSpaceUpdateion,
  syncWorkSpaceDeletion,
  syncWorkspaceMemberCreation,
];
