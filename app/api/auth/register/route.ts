import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("注册请求数据:", body);
    
    const validatedData = registerSchema.parse(body);
    console.log("验证后的数据:", validatedData);

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    // 加密密码
    const hashedPassword = await hashPassword(validatedData.password);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
    console.log("用户创建成功:", user);

    // 创建响应并设置cookie
    const response = NextResponse.json(
      {
        success: true,
        data: user,
        message: "注册成功",
      },
      { status: 201 }
    );
    
    // 设置认证cookie
    setAuthCookie(response, user.id);
    
    return response;
  } catch (error) {
    console.error("注册错误详情:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "输入数据验证失败", details: error },
        { status: 400 }
      );
    }

    console.error("注册错误:", error);
    return NextResponse.json(
      { success: false, error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
