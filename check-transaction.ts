import { prisma } from "./lib/db";
import { Transaction } from "./types/index";

async function checkTransactionData() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("No users found");
      return;
    }

    console.log("Found user:", user.email);

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: { category: true },
    });

    console.log(`Found ${transactions.length} transactions:`);
    transactions.forEach((transaction: Transaction & { category?: { id: string; name: string; type: string } }) => {
      console.log("\nTransaction details:");
      console.log(`  ID: ${transaction.id}`);
      console.log(`  Type: ${transaction.type}`);
      console.log(`  Amount: ${transaction.amount}`);
      console.log(`  Category ID: ${transaction.categoryId}`);
      console.log(`  Category: ${transaction.category?.name}`);
      console.log(`  Description: ${transaction.description}`);
      console.log(`  Date: ${transaction.date}`);
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactionData();
