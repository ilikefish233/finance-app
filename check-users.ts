import { prisma } from "./lib/db";
import { hashPassword } from "./lib/auth";
import { User } from "./types/index";

async function checkUsersData() {
  try {
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    users.forEach((user: User & { password?: string }) => {
      console.log("\nUser details:");
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Password: ${user.password}`);
      console.log(`  Created At: ${user.createdAt}`);
    });

    // 如果没有用户，创建一个测试用户
    if (users.length === 0) {
      const testPassword = "password123";
      const hashedPassword = await hashPassword(testPassword);
      
      await prisma.user.create({
        data: {
          email: "test@163.com",
          password: hashedPassword,
          name: "Test User",
        },
      });

      console.log("\nCreated test user:");
      console.log(`  Email: test@163.com`);
      console.log(`  Password: password123`);
    } else if (!users[0].password) {
      // 如果第一个用户没有密码，设置密码
      const testPassword = "password123";
      const hashedPassword = await hashPassword(testPassword);
      
      await prisma.user.update({
        where: { id: users[0].id },
        data: { password: hashedPassword },
      });

      console.log("\nUpdated password for user:");
      console.log(`  Email: ${users[0].email}`);
      console.log(`  New Password: password123`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsersData();
