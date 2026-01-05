import 'dotenv/config'; // Load env vars first
import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";

export const inngest = new Inngest({ 
  id: "workspace-sync",
  eventKey: process.env.INNGEST_EVENT_KEY 
});

// Sync user from Clerk
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

    return { user };
  }
);

// Sync organization/workspace from Clerk
const syncOrganization = inngest.createFunction(
  { id: "sync-organization-from-clerk" },
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

// Handle organization membership
const syncOrganizationMembership = inngest.createFunction(
  { id: "sync-organization-membership" },
  { event: "clerk/organizationMembership.created" },
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

    return { member };
  }
);

export const functions = [
  syncUser,
  syncOrganization,
  syncOrganizationMembership,
];