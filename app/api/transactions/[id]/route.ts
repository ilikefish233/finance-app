import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { transactionSchema } from "@/lib/validation";
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-response";

// 更新交易记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // 确保id是有效的
    if (!resolvedParams.id || typeof resolvedParams.id !== 'string' || resolvedParams.id.trim() === '') {
      return errorResponse("无效的交易记录ID");
    }
    
    const userId = await requireAuth(request);
    const body = await request.json();
    const validatedData = transactionSchema.parse(body);

    // 检查交易记录是否属于当前用户
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingTransaction) {
      return notFoundResponse("交易记录不存在");
    }

    if (existingTransaction.userId !== userId) {
      return forbiddenResponse("无权限修改该交易记录");
    }

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

    const updatedTransaction = await prisma.transaction.update({
      where: { id: resolvedParams.id },
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
      },
      include: {
        category: true,
      },
    });

    return successResponse(updatedTransaction, "交易记录更新成功");
  } catch (error) {
    console.error("Update transaction error:", error);
    
    if (error instanceof Error && error.message === "未授权") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.name === "ZodError") {
      console.error("Validation error details:", error);
      return validationErrorResponse(error, "交易记录更新失败");
    }

    return serverErrorResponse(error, "更新交易记录失败");
  }
}

// 删除交易记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // 确保id是有效的
    if (!resolvedParams.id || typeof resolvedParams.id !== 'string' || resolvedParams.id.trim() === '') {
      return errorResponse("无效的交易记录ID");
    }
    
    const userId = await requireAuth(request);

    // 检查交易记录是否属于当前用户
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingTransaction) {
      return notFoundResponse("交易记录不存在");
    }

    if (existingTransaction.userId !== userId) {
      return forbiddenResponse("无权限删除该交易记录");
    }

    await prisma.transaction.delete({
      where: { id: resolvedParams.id },
    });

    return successResponse(null, "交易记录删除成功");
  } catch (error) {
    if (error instanceof Error && error.message === "未授权") {
      return unauthorizedResponse();
    }

    console.error("删除交易记录错误:", error);
    return serverErrorResponse(error, "删除交易记录失败");
  }
}
