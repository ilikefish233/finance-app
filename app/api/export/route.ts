import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response';
import { exportToCSV, generateExportFilename } from '@/lib/export';

/**
 * 数据导出API
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    // 解析请求参数
    const { startDate, endDate, categoryId, format = 'csv' } = await request.json();

    // 构建查询条件
    const whereCondition: any = {
      userId
    };

    // 添加日期范围筛选
    if (startDate || endDate) {
      whereCondition.date = {};
      if (startDate) {
        whereCondition.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereCondition.date.lte = new Date(endDate);
      }
    }

    // 添加分类筛选
    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    // 获取交易数据（包含分类信息）
    const transactions = await prisma.transaction.findMany({
      where: whereCondition,
      include: {
        category: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    if (transactions.length === 0) {
      return successResponse(null, '没有符合条件的交易记录');
    }

    // 准备导出数据
    const exportData = transactions.map(transaction => ({
      ...transaction,
      categoryName: transaction.category?.name || '未分类'
    }));

    // 生成导出内容
    let exportContent: string;
    let mimeType: string;

    if (format === 'csv') {
      // 转换为CSV格式
      exportContent = generateCSVContent(exportData);
      mimeType = 'text/csv;charset=utf-8;';
    } else {
      return errorResponse('不支持的导出格式', 400);
    }

    // 生成文件名
    const filename = generateExportFilename(format as 'csv');

    // 返回导出数据
    return new Response(exportContent, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('导出错误:', error);

    if (error instanceof Error && error.message === '未授权') {
      return errorResponse('未授权', 401);
    }

    return serverErrorResponse(error, '导出失败');
  }
}

/**
 * 生成CSV格式内容
 * @param transactions 交易数据（包含分类信息）
 * @returns CSV格式字符串
 */
function generateCSVContent(transactions: any[]): string {
  // CSV表头
  const headers = [
    'ID',
    '日期',
    '类型',
    '金额',
    '分类',
    '描述',
    '创建时间'
  ];

  // 转换交易数据为CSV行
  const rows = transactions.map(transaction => [
    transaction.id,
    transaction.date.toISOString().split('T')[0],
    transaction.type === 'income' ? '收入' : '支出',
    transaction.amount.toString(),
    transaction.categoryName,
    transaction.description || '',
    transaction.createdAt.toISOString().split('T')[0]
  ]);

  // 组合表头和数据行
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // 添加UTF-8 BOM以解决Excel乱码问题
  return '\ufeff' + csvContent;
}
