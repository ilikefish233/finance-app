import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST() {
  try {
    await deleteSession();

    return NextResponse.json(
      {
        success: true,
        message: "登出成功",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("登出错误:", error);
    return NextResponse.json(
      { success: false, error: "登出失败" },
      { status: 500 }
    );
  }
}
