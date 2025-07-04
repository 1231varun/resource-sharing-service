/* eslint-disable no-console */
import { db } from '@/infrastructure/database';

async function seed(): Promise<void> {
  console.log('Starting database seeding...');

  try {
    // Create sample users
    const users = await Promise.all([
      db.user.create({
        data: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
      }),
      db.user.create({
        data: {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
        },
      }),
      db.user.create({
        data: {
          name: 'Bob Johnson',
          email: 'bob.johnson@example.com',
        },
      }),
      db.user.create({
        data: {
          name: 'Alice Brown',
          email: 'alice.brown@example.com',
        },
      }),
    ]);

    console.log(`Created ${users.length} users`);

    // Create sample groups
    const groups = await Promise.all([
      db.group.create({
        data: {
          name: 'Developers',
          description: 'Software development team',
        },
      }),
      db.group.create({
        data: {
          name: 'Managers',
          description: 'Management team',
        },
      }),
      db.group.create({
        data: {
          name: 'Administrators',
          description: 'System administrators',
        },
      }),
    ]);

    console.log(`Created ${groups.length} groups`);

    // Add users to groups
    const [john, jane, bob, alice] = users;
    const [developers, managers, administrators] = groups;

    await Promise.all([
      // John and Jane are developers
      db.userGroup.create({
        data: { userId: john.id, groupId: developers.id },
      }),
      db.userGroup.create({
        data: { userId: jane.id, groupId: developers.id },
      }),
      // Bob is a manager
      db.userGroup.create({
        data: { userId: bob.id, groupId: managers.id },
      }),
      // Alice is an administrator and also a manager
      db.userGroup.create({
        data: { userId: alice.id, groupId: administrators.id },
      }),
      db.userGroup.create({
        data: { userId: alice.id, groupId: managers.id },
      }),
    ]);

    console.log('Added users to groups');

    // Create sample resources
    const resources = await Promise.all([
      db.resource.create({
        data: {
          name: 'Company Handbook',
          description: 'Employee handbook and policies',
          isGlobal: true,
        },
      }),
      db.resource.create({
        data: {
          name: 'Development Tools',
          description: 'Software development tools and access',
          isGlobal: false,
        },
      }),
      db.resource.create({
        data: {
          name: 'Financial Reports',
          description: 'Monthly and quarterly financial reports',
          isGlobal: false,
        },
      }),
      db.resource.create({
        data: {
          name: 'Admin Panel',
          description: 'System administration panel',
          isGlobal: false,
        },
      }),
      db.resource.create({
        data: {
          name: 'Project Documentation',
          description: 'Project documentation and specifications',
          isGlobal: false,
        },
      }),
    ]);

    console.log(`Created ${resources.length} resources`);

    // Create resource shares
    const [, devTools, financialReports, adminPanel, projectDocs] = resources;

    await Promise.all([
      // Development Tools shared with Developers group
      db.resourceShare.create({
        data: {
          resourceId: devTools.id,
          shareType: 'group',
          targetId: developers.id,
        },
      }),
      // Financial Reports shared with Managers group
      db.resourceShare.create({
        data: {
          resourceId: financialReports.id,
          shareType: 'group',
          targetId: managers.id,
        },
      }),
      // Admin Panel shared with Administrators group
      db.resourceShare.create({
        data: {
          resourceId: adminPanel.id,
          shareType: 'group',
          targetId: administrators.id,
        },
      }),
      // Project Documentation shared directly with John
      db.resourceShare.create({
        data: {
          resourceId: projectDocs.id,
          shareType: 'user',
          targetId: john.id,
        },
      }),
      // Project Documentation also shared directly with Jane
      db.resourceShare.create({
        data: {
          resourceId: projectDocs.id,
          shareType: 'user',
          targetId: jane.id,
        },
      }),
    ]);

    console.log('Created resource shares');

    console.log('Database seeding completed successfully!');
    console.log('\nSample data summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Groups: ${groups.length}`);
    console.log(`- Resources: ${resources.length} (1 global, 4 specific)`);
    console.log('- User group memberships: 5');
    console.log('- Resource shares: 5');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seed };
