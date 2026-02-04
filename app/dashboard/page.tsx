"use client";

import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/layout/Layout";
import { useRouter } from "next/navigation";
import LineChart from "@/components/charts/LineChart";
import PieChart from "@/components/charts/PieChart";
import BarChart from "@/components/charts/BarChart";
import { StatisticsData } from "@/lib/statistics";

export default function DashboardPage() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // 本地预算设置类型
  interface LocalBudgetSetting {
    amount: number;
    isInfinite: boolean;
  }

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 构建查询参数
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const response = await fetch(`/api/statistics?${params.toString()}`);
      const data = await response.json();
      
      if (!data.success) {
        if (data.error === "未授权") {
          router.push("/login");
          return;
        }
        throw new Error(data.error || "获取统计数据失败");
      }
      
      // 从localStorage获取预算设置
      const savedBudget = localStorage.getItem('monthlyBudget');
      let budgetSetting: LocalBudgetSetting | null = null;
      
      if (savedBudget) {
        try {
          budgetSetting = JSON.parse(savedBudget) as LocalBudgetSetting;
        } catch (error) {
          console.error("解析预算设置失败:", error);
        }
      }
      
      // 计算预算告警
      if (budgetSetting && data.data.budgetAlerts.length > 0) {
        // 更新预算告警数据
        data.data.budgetAlerts[0].budget = budgetSetting.isInfinite ? 0 : budgetSetting.amount;
        
        // 计算预算使用百分比
        if (budgetSetting.isInfinite) {
          data.data.budgetAlerts[0].percentage = 0;
          data.data.budgetAlerts[0].status = "safe";
        } else {
          data.data.budgetAlerts[0].percentage = (data.data.budgetAlerts[0].used / budgetSetting.amount) * 100;
          
          // 确定预算告警状态
          if (data.data.budgetAlerts[0].percentage >= 100) {
            data.data.budgetAlerts[0].status = "danger";
          } else if (data.data.budgetAlerts[0].percentage >= 80) {
            data.data.budgetAlerts[0].status = "warning";
          } else {
            data.data.budgetAlerts[0].status = "safe";
          }
        }
      }
      
      setStatistics(data.data);
    } catch (err) {
      console.error("获取统计数据错误:", err);
      setError(err instanceof Error ? err.message : "获取统计数据失败");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, router]);

  // 设置默认日期范围为最近7天
  useEffect(() => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    setStartDate(formatDate(sevenDaysAgo));
    setEndDate(formatDate(today));
  }, []);

  // 当日期变化时重新获取数据
  useEffect(() => {
    if (startDate && endDate) {
      fetchStatistics();
    }
  }, [startDate, endDate, fetchStatistics]);

  // 格式化日期为YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // 设置预设日期范围
  const setPresetDateRange = (days: number) => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - days);
    
    setStartDate(formatDate(pastDate));
    setEndDate(formatDate(today));
  };
  
  // 设置最近半年
  const setLastSixMonths = () => {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    setStartDate(formatDate(sixMonthsAgo));
    setEndDate(formatDate(today));
  };
  
  // 设置最近一年
  const setLastYear = () => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    setStartDate(formatDate(oneYearAgo));
    setEndDate(formatDate(today));
  };

  // 设置本月
  const setThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(today));
  };

  // 设置上月
  const setLastMonth = () => {
    const today = new Date();
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    
    setStartDate(formatDate(firstDayLastMonth));
    setEndDate(formatDate(lastDayLastMonth));
  };

  // 格式化金额显示
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
          <p className="mt-2 text-gray-600">
            欢迎回来！这里是您的财务概览。
          </p>
        </div>

        {/* 日期范围选择 */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row items-end gap-4">
            {/* 预设日期范围 */}
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setPresetDateRange(7)} 
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
              >
                最近7天
              </button>
              <button 
                onClick={setThisMonth} 
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
              >
                本月
              </button>
              <button 
                onClick={setLastMonth} 
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
              >
                上月
              </button>
              <button 
                onClick={() => setPresetDateRange(90)} 
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
              >
                最近3个月
              </button>
              <button 
                onClick={setLastSixMonths} 
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
              >
                最近半年
              </button>
              <button 
                onClick={setLastYear} 
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
              >
                最近一年
              </button>
            </div>

            {/* 自定义日期范围 */}
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  max={endDate}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={startDate}
                  max={formatDate(new Date())} // 不能选择未来日期
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
            <button 
              onClick={fetchStatistics} 
              className="ml-2 text-sm font-medium text-red-600 hover:underline"
            >
              重试
            </button>
          </div>
        ) : statistics ? (
          <>
            {/* 数据卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-medium text-gray-500">总收入</h3>
                <p className="mt-2 text-2xl font-bold text-red-600">
                  {formatAmount(statistics.totalIncome)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-medium text-gray-500">总支出</h3>
                <p className="mt-2 text-2xl font-bold text-green-600">
                  {formatAmount(statistics.totalExpense)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-medium text-gray-500">余额</h3>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatAmount(statistics.balance)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <h3 className="text-sm font-medium text-gray-500">本月预算</h3>
                <p className="mt-2 text-2xl font-bold text-blue-600">
                  {statistics.budgetAlerts.length > 0 ? (
                    statistics.budgetAlerts[0].budget > 0 ? 
                    formatAmount(statistics.budgetAlerts[0].budget) : 
                    '无限'
                  ) : '¥0.00'}
                </p>
                {statistics.budgetAlerts.length > 0 && statistics.budgetAlerts[0].budget > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    使用了 {statistics.budgetAlerts[0].percentage.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>

            {/* 预算预警 */}
            {statistics.budgetAlerts.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">预算预警</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statistics.budgetAlerts.map((alert, index) => {
                    const isInfinite = alert.budget === 0;
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${alert.status === 'danger' ? 'border-red-200 bg-red-50' : alert.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{alert.categoryName}</span>
                          <span className="text-sm font-semibold">
                            {formatAmount(alert.used)}/{isInfinite ? '无限' : formatAmount(alert.budget)}
                          </span>
                        </div>
                        {!isInfinite && (
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                            <div 
                              className={`h-2.5 rounded-full ${alert.status === 'danger' ? 'bg-red-500' : alert.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                            ></div>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs">
                          {!isInfinite && (
                            <span className="text-gray-500">{alert.percentage.toFixed(1)}% 使用</span>
                          )}
                          <span className={`font-medium ${alert.status === 'danger' ? 'text-red-600' : alert.status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
                            {isInfinite ? '✅ 无限预算' : 
                             alert.status === 'danger' ? '⚠️ 预算不足' : 
                             alert.status === 'warning' ? '⚠️ 接近预算' : '✅ 预算充足'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 收支趋势图 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">收支趋势</h2>
                {loading ? (
                  <div className="w-full h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <LineChart data={statistics.monthlyTrends} />
                )}
              </div>

              {/* 分类占比图 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">支出分类占比</h2>
                {loading ? (
                  <div className="w-full h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <PieChart data={statistics.categoryDistribution} type="expense" />
                )}
              </div>
            </div>

            {/* 月度统计 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">月度收支统计</h2>
              {loading ? (
                <div className="w-full h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <BarChart data={statistics.monthlyTrends} />
              )}
            </div>

            {/* 最近交易记录 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">最近交易</h2>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                        <div className="space-y-2">
                          <div className="w-24 h-4 bg-gray-300 rounded"></div>
                          <div className="w-16 h-3 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="w-16 h-4 bg-gray-300 rounded"></div>
                        <div className="w-16 h-3 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : statistics.recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>暂无交易记录</p>
                  <p className="text-sm mt-1">开始记录您的收支吧！</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {statistics.recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: transaction.color || (transaction.type === 'income' ? '#EF4444' : '#10B981') }}
                        >
                          {transaction.icon || (transaction.type === 'income' ? '💰' : '💸')}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.categoryName}</div>
                          <div className="text-sm text-gray-500">
                            {transaction.description || (transaction.type === 'income' ? '收入' : '支出')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${transaction.type === 'income' ? 'text-red-600' : 'text-green-600'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Layout>
  );
}
