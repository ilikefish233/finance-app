import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { transactionSchema } from "@/lib/validation";
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-response";

// 获取用户的所有交易记录
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    
    // 获取查询参数
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 构建查询条件
    const where: { userId: string; type?: 'income' | 'expense'; categoryId?: string; date?: { gte: Date; lte: Date } } = { userId };
    
    if (type && (type === 'income' || type === 'expense')) {
      where.type = type;
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { date: "desc" },
    });

    return successResponse(transactions, "获取交易记录成功");
  } catch (error) {
    if (error instanceof Error && error.message === "未授权") {
      return unauthorizedResponse();
    }

    console.error("获取交易记录错误:", error);
    return serverErrorResponse(error, "获取交易记录失败");
  }
}

// 创建新交易记录
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const body = await request.json();
    const validatedData = transactionSchema.parse(body);

    // 检查分类是否属于当前用户
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category) {
        return notFoundResponse("分类不存在");
      }

      if (category.userId !== userId) {
        return forbiddenResponse("无权限使用该分类");
      }

      // 检查分类类型与交易类型是否匹配
      if (category.type !== validatedData.type) {
        return errorResponse("分类类型与交易类型不匹配");
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...validatedData,
        userId,
        date: new Date(validatedData.date),
      },
      include: {
        category: true,
      },
    });

    return successResponse(transaction, "交易记录创建成功", 201);
  } catch (error) {
    if (error instanceof Error && error.message === "未授权") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.name === "ZodError") {
      return validationErrorResponse(error, "创建交易记录失败");
    }

    console.error("创建交易记录错误:", error);
    return serverErrorResponse(error, "创建交易记录失败");
  }
}
