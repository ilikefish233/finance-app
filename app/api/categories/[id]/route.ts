import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse, serverErrorResponse } from "@/lib/api-response";

// 更新分类
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // 确保id是有效的
    if (!resolvedParams.id || typeof resolvedParams.id !== 'string' || resolvedParams.id.trim() === '') {
      return errorResponse("无效的分类ID");
    }
    
    const userId = await requireAuth(request);
    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    // 检查分类是否属于当前用户
    const existingCategory = await prisma.category.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingCategory) {
      return notFoundResponse("分类不存在");
    }

    if (existingCategory.userId !== userId) {
      return forbiddenResponse("无权限修改该分类");
    }

    const updatedCategory = await prisma.category.update({
      where: { id: resolvedParams.id },
      data: validatedData,
    });

    return successResponse(updatedCategory, "分类更新成功");
  } catch (error) {
    if (error instanceof Error && error.message === "未授权") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.name === "ZodError") {
      console.error("Validation error details:", error);
      return validationErrorResponse(error, "分类更新失败");
    }

    console.error("更新分类错误:", error);
    return serverErrorResponse(error, "更新分类失败");
  }
}

// 删除分类
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    // 确保id是有效的
    if (!resolvedParams.id || typeof resolvedParams.id !== 'string' || resolvedParams.id.trim() === '') {
      return errorResponse("无效的分类ID");
    }
    
    const userId = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    
    // 获取处理关联交易记录的方式
    // delete: 删除关联的交易记录
    // nullify: 将关联交易记录的categoryId设为null
    // move: 将关联交易记录移动到指定的分类
    const action = searchParams.get("action") || "nullify";
    const targetCategoryId = searchParams.get("targetCategoryId");

    // 检查分类是否属于当前用户
    const existingCategory = await prisma.category.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingCategory) {
      return notFoundResponse("分类不存在");
    }

    if (existingCategory.userId !== userId) {
      return forbiddenResponse("无权限删除该分类");
    }

    // 检查该分类是否有关联的交易记录
    const hasTransactions = await prisma.transaction.findFirst({
      where: { categoryId: resolvedParams.id },
    });

    if (hasTransactions) {
      // 根据用户选择的方式处理关联交易记录
      switch (action) {
        case "delete":
          // 删除关联的交易记录
          await prisma.transaction.deleteMany({
            where: { categoryId: resolvedParams.id },
          });
          break;
        
        case "nullify":
          // 将关联交易记录的categoryId设为null
          await prisma.transaction.updateMany({
            where: { categoryId: resolvedParams.id },
            data: { categoryId: null },
          });
          break;
        
        case "move":
          // 将关联交易记录移动到指定的分类
          if (!targetCategoryId) {
            return errorResponse("移动分类时必须指定目标分类ID");
          }
          
          // 检查目标分类是否存在且属于当前用户
          const targetCategory = await prisma.category.findUnique({
            where: { id: targetCategoryId },
          });
          
          if (!targetCategory) {
            return notFoundResponse("目标分类不存在");
          }
          
          if (targetCategory.userId !== userId) {
            return forbiddenResponse("无权限使用目标分类");
          }
          
          // 检查目标分类类型与当前分类类型是否匹配
          if (targetCategory.type !== existingCategory.type) {
            return errorResponse("目标分类类型与当前分类类型不匹配");
          }
          
          // 移动交易记录
          await prisma.transaction.updateMany({
            where: { categoryId: resolvedParams.id },
            data: { categoryId: targetCategoryId },
          });
          break;
        
        default:
          return errorResponse("无效的处理方式");
      }
    }

    // 删除分类
    await prisma.category.delete({
      where: { id: resolvedParams.id },
    });

    return successResponse(null, "分类删除成功");
  } catch (error) {
    if (error instanceof Error && error.message === "未授权") {
      return unauthorizedResponse();
    }

    console.error("删除分类错误:", error);
    return serverErrorResponse(error, "删除分类失败");
  }
}
