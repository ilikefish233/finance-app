import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";
import { successResponse, validationErrorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/api-response";

// 获取用户的所有分类
export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(categories, "获取分类列表成功");
  } catch (error) {
    if (error instanceof Error && error.message === "未授权") {
      return unauthorizedResponse();
    }

    console.error("获取分类列表错误:", error);
    return serverErrorResponse(error, "获取分类列表失败");
  }
}

// 创建新分类
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const body = await request.json();
    const validatedData = categorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        ...validatedData,
        userId,
      },
    });

    return successResponse(category, "分类创建成功", 201);
  } catch (error) {
    if (error instanceof Error && error.message === "未授权") {
      return unauthorizedResponse();
    }

    if (error instanceof Error && error.name === "ZodError") {
      return validationErrorResponse(error, "分类创建失败");
    }

    console.error("创建分类错误:", error);
    return serverErrorResponse(error, "创建分类失败");
  }
}
