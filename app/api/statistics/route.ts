import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getStatistics } from "@/lib/statistics";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const searchParams = request.nextUrl.searchParams;
    
    // 获取日期参数
    const startDate = searchParams.get("startDate") 
      ? new Date(searchParams.get("startDate")!) 
      : undefined;
    
    const endDate = searchParams.get("endDate") 
      ? new Date(searchParams.get("endDate")!) 
      : undefined;

    // 验证日期格式
    if ((startDate && isNaN(startDate.getTime())) || (endDate && isNaN(endDate.getTime()))) {
      return errorResponse("无效的日期格式");
    }

    // 获取统计数据
    const statistics = await getStatistics(userId, startDate, endDate);

    return successResponse(statistics, "获取统计数据成功");
  } catch (error) {
    console.error("获取统计数据错误:", error);
    
    if (error instanceof Error && error.message === "未授权") {
      return errorResponse("未授权", 401);
    }

    return serverErrorResponse(error, "获取统计数据失败");
  }
}
