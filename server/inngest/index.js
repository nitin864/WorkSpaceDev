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
                        image: data?.image_url, // Changed from Image to image
                    }
                });
                
                console.log("User created successfully:", user);
                return user;
            } catch (error) {
                console.error("Error creating user:", error);
                throw error; // This will trigger Inngest retry
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
                        image: data?.image_url, // Changed from Image to image
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

// Export functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation
];