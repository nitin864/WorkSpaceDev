import { Inngest } from "inngest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });

//inngest function to save userdata to database
const syncUserCreation = inngest.createFunction(
    { id: 'sync-user-from-clerk' },
    { event: 'clerk/user.created' },
    async ({ event, step }) => {
        const { data } = event;

        await step.run("create-user-in-db", async () => {
            try {
                console.log("Creating user:", data.id);

                const user = await prisma.user.create({
                    data: {
                        id: data.id,
                        email: data?.email_addresses[0]?.email_address,
                        name: `${data?.first_name || ''} ${data?.last_name || ''}`.trim(),
                        image: data?.image_url,
                    }
                });

                console.log("User created successfully:", user);
                return user;
            } catch (error) {
                console.error("Error creating user:", error);
                throw error;
            }
        });
    }
);

//inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
    { id: 'delete-user-from-clerk' },
    { event: 'clerk/user.deleted' },
    async ({ event, step }) => {
        const { data } = event;

        await step.run("delete-user-from-db", async () => {
            try {
                console.log("Deleting user:", data.id);

                const user = await prisma.user.delete({
                    where: {
                        id: data.id,
                    }
                });

                console.log("User deleted successfully:", user);
                return user;
            } catch (error) {
                console.error("Error deleting user:", error);
                throw error;
            }
        });
    }
);

//inngest function to update user data in database
const syncUserUpdation = inngest.createFunction(
    { id: 'update-user-from-clerk' },
    { event: 'clerk/user.updated' },
    async ({ event, step }) => {
        const { data } = event;

        await step.run("update-user-in-db", async () => {
            try {
                console.log("Updating user:", data.id);

                const user = await prisma.user.update({
                    where: {
                        id: data.id,
                    },
                    data: {
                        email: data?.email_addresses[0]?.email_address,
                        name: `${data?.first_name || ''} ${data?.last_name || ''}`.trim(),
                        image: data?.image_url,
                    }
                });

                console.log("User updated successfully:", user);
                return user;
            } catch (error) {
                console.error("Error updating user:", error);
                throw error;
            }
        });
    }
);

//inngest function to save organisation to database
const SyncWorkSpacecreation = inngest.createFunction(
    { id: 'sync-WorkSpace-from-clerk' },
    { event: 'clerk/organization.created' },
    async ({ event, step }) => {  // ADDED step parameter
        const { data } = event;
        
        await step.run("create-workspace-in-db", async () => {  // ADDED step.run wrapper
            try {
                console.log("Creating workspace:", data.id);
                
                const workspace = await prisma.workspace.create({
                    data: {
                        id: data.id,
                        name: data.name,
                        slug: data.slug,
                        ownerId: data.created_by,  // FIXED: creted_by -> created_by
                        image_url: data.image_url,
                    }
                });

                // Add creator as Admin Member 
                await prisma.workspaceMember.create({
                    data: {
                        userId: data.created_by,  // FIXED: creted_by -> created_by
                        workspaceId: data.id,
                        role: "ADMIN",
                    }
                });
                
                console.log("Workspace created successfully:", workspace);
                return workspace;
            } catch (error) {
                console.error("Error creating workspace:", error);
                throw error;
            }
        });
    }
);

//inngest function to update WorkSpace data in database 
const WorkSpaceUpdateion = inngest.createFunction(
    { id: 'update-WorkSpace-from-clerk' },
    { event: 'clerk/organization.updated' },
    async ({ event, step }) => {  // ADDED step parameter
        const { data } = event;
        
        await step.run("update-workspace-in-db", async () => {  // ADDED step.run wrapper
            try {
                console.log("Updating workspace:", data.id);
                
                const workspace = await prisma.workspace.update({
                    where: {
                        id: data.id
                    },
                    data: {
                        name: data.name,
                        slug: data.slug,
                        image_url: data.image_url,
                    }
                });
                
                console.log("Workspace updated successfully:", workspace);
                return workspace;
            } catch (error) {
                console.error("Error updating workspace:", error);
                throw error;
            }
        });
    }
);

//inngest function to delete workspace from database
const syncWorkSpaceDeletion = inngest.createFunction(
    { id: 'delete-WorkSpace-from-clerk' },
    { event: 'clerk/organization.deleted' },
    async ({ event, step }) => {  // ADDED step parameter
        const { data } = event;
        
        await step.run("delete-workspace-from-db", async () => {  // ADDED step.run wrapper
            try {
                console.log("Deleting workspace:", data.id);
                
                const workspace = await prisma.workspace.delete({
                    where: {
                        id: data.id
                    }
                });
                
                console.log("Workspace deleted successfully:", workspace);
                return workspace;
            } catch (error) {
                console.error("Error deleting workspace:", error);
                throw error;
            }
        });
    }
);

// Inngest Function to save workspace member data to a database
const syncWorkspaceMemberCreation = inngest.createFunction(
    { id: "sync-workspace-member-from-clerk" },
    { event: "clerk/organizationInvitation.accepted" },
    async ({ event, step }) => {  // ADDED step parameter
        const { data } = event;

        await step.run("create-workspace-member-in-db", async () => {  // ADDED step.run wrapper
            try {
                console.log("Creating workspace member:", data.user_id);
                
                const member = await prisma.workspaceMember.create({
                    data: {
                        userId: data.user_id,
                        workspaceId: data.organization_id,
                        role: String(data.role).toUpperCase(),  // FIXED: role_name -> role
                    },
                });
                
                console.log("Workspace member created successfully:", member);
                return member;
            } catch (error) {
                console.error("Error creating workspace member:", error);
                throw error;
            }
        });
    }
);

// Export functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    SyncWorkSpacecreation,
    WorkSpaceUpdateion,
    syncWorkSpaceDeletion,
    syncWorkspaceMemberCreation
];