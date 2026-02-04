"use client";

import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyTrend } from '@/lib/statistics';

interface LineChartProps {
  data: MonthlyTrend[];
  height?: number;
}

export default function LineChart({ data, height = 300 }: LineChartProps) {
  // 如果没有数据，显示占位符
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-gray-500 text-center">
          <p className="text-lg font-medium">暂无收支趋势数据</p>
          <p className="text-sm mt-1">选择不同的日期范围，或者开始记录您的收支吧！</p>
        </div>
      </div>
    );
  }

  // 格式化月份显示
  const formattedData = data.map(item => ({
    ...item,
    month: formatMonth(item.month)
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart
        data={formattedData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="month" 
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `¥${value.toFixed(0)}`}
        />
        <Tooltip 
          formatter={(value) => [`¥${Number(value).toFixed(2)}`, '金额']}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          labelStyle={{ color: '#374151', fontWeight: 500 }}
        />
        <Legend 
          wrapperStyle={{ paddingTop: 10 }}
          iconType="circle"
        />
        <Line 
          type="monotone" 
          dataKey="income" 
          stroke="#EF4444" 
          strokeWidth={2}
          activeDot={{ r: 8 }}
          name="收入"
        />
        <Line 
          type="monotone" 
          dataKey="expense" 
          stroke="#10B981" 
          strokeWidth={2}
          activeDot={{ r: 8 }}
          name="支出"
        />
      </ReLineChart>
    </ResponsiveContainer>
  );
}

// 格式化月份或日期显示 (YYYY-MM -> MM月, YYYY-MM-DD -> MM/DD)
function formatMonth(monthString: string) {
  const parts = monthString.split('-');
  if (parts.length === 3) {
    // 日度数据 (YYYY-MM-DD)
    const [, month, day] = parts;
    return `${month}/${day}`;
  } else if (parts.length === 2) {
    // 月度数据 (YYYY-MM)
    const [, month] = parts;
    return `${month}月`;
  }
  return monthString;
}
