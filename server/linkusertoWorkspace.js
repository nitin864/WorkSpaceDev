import 'dotenv/config';
import prisma from './configs/prisma.js';

async function linkUserToWorkspaces() {
  const userId = 'user_37e83iXeeCVHBR4sjI3380UW8bp';
  const userEmail = 'rajnitin7930@gmail.com';

  try {
    console.log('🔗 Linking user to workspaces...');
    console.log('User ID:', userId);

    // Step 1: Ensure user exists in database
    const user = await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: userEmail,
        name: 'Raj Nitin',
        image: '',
      },
      update: {
        email: userEmail,
      },
    });
    console.log('✅ User exists:', user.id);

    // Step 2: Get all workspaces
    const workspaces = await prisma.workspace.findMany();
    console.log(`📦 Found ${workspaces.length} workspaces`);

    // Step 3: Link user to all workspaces as ADMIN
    let linked = 0;
    let skipped = 0;

    for (const workspace of workspaces) {
      try {
        await prisma.workspaceMember.create({
          data: {
            userId: user.id,
            workspaceId: workspace.id,
            role: 'ADMIN',
          },
        });
        console.log(`✅ Linked to: ${workspace.name}`);
        linked++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⏭️  Already linked to: ${workspace.name}`);
          skipped++;
        } else {
          console.error(`❌ Failed to link to ${workspace.name}:`, error.message);
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Newly linked: ${linked}`);
    console.log(`⏭️  Already linked: ${skipped}`);
    console.log(`📦 Total workspaces: ${workspaces.length}`);

    // Step 4: Verify by fetching user's workspaces
    const userWorkspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId: user.id },
        },
      },
      include: {
        members: {
          where: { userId: user.id }
        }
      }
    });

    console.log('\n✅ User now has access to:');
    userWorkspaces.forEach(ws => {
      console.log(`  - ${ws.name} (${ws.members[0].role})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkUserToWorkspaces();