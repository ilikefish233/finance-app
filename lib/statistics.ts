import { prisma } from "@/lib/db";
import { TransactionType, Transaction } from "@/types/index";

// 预算预警信息
export interface BudgetAlert {
  categoryId?: string;
  categoryName: string;
  budget: number;
  used: number;
  percentage: number;
  status: "safe" | "warning" | "danger";
}

// 统计数据类型
export interface StatisticsData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryDistribution: CategoryDistribution[];
  monthlyTrends: MonthlyTrend[];
  recentTransactions: RecentTransaction[];
  budgetAlerts: BudgetAlert[];
}

export interface CategoryDistribution {
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  amount: number;
  percentage: number;
  icon?: string;
  color?: string;
  [key: string]: string | number | TransactionType | undefined;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

export interface RecentTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryName: string;
  description?: string;
  date: Date;
  icon?: string;
  color?: string;
}

/**
 * 获取用户的统计数据
 * @param userId 用户ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 */
export async function getStatistics(
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  // 设置默认日期范围为最近30天
  if (!startDate) {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
  }
  if (!endDate) {
    endDate = new Date();
  }

  // 获取总收入和总支出
  const [totalIncome, totalExpense] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: "income",
        date: { gte: startDate, lte: endDate },
      },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: "expense",
        date: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  // 获取分类分布数据
  const categoryDistribution = await getCategoryDistribution(
    userId,
    startDate,
    endDate
  );

  // 获取月度趋势数据
  const monthlyTrends = await getMonthlyTrends(userId, startDate, endDate);

  // 获取最近交易记录
  const recentTransactions = await getRecentTransactions(
    userId,
    startDate,
    endDate
  );

  // 获取预算预警信息 - 不传入日期参数，因为预算告警只负责计算本月支出
  const budgetAlerts = await getBudgetAlerts(userId);

  return {
    totalIncome: totalIncome._sum.amount || 0,
    totalExpense: totalExpense._sum.amount || 0,
    balance: (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0),
    categoryDistribution,
    monthlyTrends,
    recentTransactions,
    budgetAlerts,
  };
}

/**
 * 获取预算预警信息
 * @param userId 用户ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 */
async function getBudgetAlerts(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<BudgetAlert[]> {
  // 预算告警只负责计算本月支出，所以总是使用当前月份的日期范围
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  // 强制使用当前月份
  const effectiveStartDate = new Date(currentYear, currentMonth - 1, 1);
  const effectiveEndDate = new Date(currentYear, currentMonth, 0);
  
  // 获取指定日期范围内的所有支出
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: "expense",
      date: {
        gte: effectiveStartDate,
        lte: effectiveEndDate,
      },
    },
    include: {
      category: true,
    },
  });
  
  // 计算总支出
  const totalSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  
  // 这里我们暂时返回一个简单的预算告警对象
  // 实际的预算设置从前端localStorage获取，并在前端计算告警状态
  return [
    {
      categoryName: "月度预算",
      budget: 0, // 实际值从前端获取
      used: totalSpent,
      percentage: 0, // 实际值从前端计算
      status: "safe", // 实际值从前端计算
    }
  ];
}

/**
 * 获取分类分布数据
 * @param userId 用户ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 */
async function getCategoryDistribution(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CategoryDistribution[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      category: true,
    },
  });

  // 按分类和类型分组，排除中性交易
  const groupedData = transactions.reduce((acc: Record<string, CategoryDistribution>, transaction: { id: string; type: TransactionType; categoryId: string | null; amount: number; category: { id: string; name: string; icon?: string; color?: string } | null }) => {
    // 排除中性交易
    if (transaction.type === 'neutral') {
      return acc;
    }
    
    const key = `${transaction.type}-${transaction.categoryId || 'unclassified'}`;
    if (!acc[key]) {
      acc[key] = {
        categoryId: transaction.categoryId || 'unclassified',
        categoryName: transaction.category?.name || '未分类',
        type: transaction.type,
        amount: 0,
        percentage: 0,
        icon: transaction.category?.icon,
        color: transaction.category?.color,
      };
    }
    acc[key].amount += transaction.amount;
    return acc;
  }, {} as Record<string, CategoryDistribution>);

  const distribution = Object.values(groupedData) as CategoryDistribution[];

  // 计算每个分类的百分比
  const totalByType = distribution.reduce((acc: Record<TransactionType, number>, item: CategoryDistribution) => {
    acc[item.type] = (acc[item.type] || 0) + item.amount;
    return acc;
  }, {} as Record<TransactionType, number>);

  return distribution.map((item) => ({
    ...item,
    percentage: totalByType[item.type] > 0
      ? (item.amount / totalByType[item.type]) * 100
      : 0,
  }));
}

/**
 * 获取月度趋势数据
 * @param userId 用户ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 */
async function getMonthlyTrends(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<MonthlyTrend[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    select: {
      type: true,
      amount: true,
      date: true,
    },
  });

  // 计算时间范围的天数差
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 根据时间范围决定分组方式
  const isShortPeriod = daysDiff <= 31;
  
  // 按天或按月分组
  const groupedData = transactions.reduce((acc: Record<string, MonthlyTrend>, transaction: { type: TransactionType; amount: number; date: Date }) => {
    const date = new Date(transaction.date);
    let key: string;
    
    if (isShortPeriod) {
      // 按天分组
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    } else {
      // 按月分组
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    
    if (!acc[key]) {
      acc[key] = {
        month: key,
        income: 0,
        expense: 0,
      };
    }
    
    if (transaction.type === "income") {
      acc[key].income += transaction.amount;
    } else if (transaction.type === "expense") {
      acc[key].expense += transaction.amount;
    }
    // 中性交易不统计
    
    return acc;
  }, {} as Record<string, MonthlyTrend>);

  // 转换为数组并排序
  return (Object.values(groupedData) as MonthlyTrend[]).sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * 获取最近的交易记录
 * @param userId 用户ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param limit 限制条数
 */
async function getRecentTransactions(
  userId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 5
): Promise<RecentTransaction[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    include: {
      category: true,
    },
    orderBy: {
      date: "desc",
    },
    take: limit,
  });

  return transactions.map((transaction: { id: string; type: TransactionType; amount: number; categoryId: string | null; description?: string; date: Date; category: { id: string; name: string; icon?: string; color?: string } | null }) => ({
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    categoryName: transaction.category?.name || '未分类',
    description: transaction.description,
    date: transaction.date,
    icon: transaction.category?.icon,
    color: transaction.category?.color,
  }));
}
