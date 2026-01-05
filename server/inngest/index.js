import 'dotenv/config';
import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

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
];