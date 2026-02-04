"use client";

import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CategoryDistribution } from '@/lib/statistics';

interface PieChartProps {
  data: CategoryDistribution[];
  height?: number;
  type?: 'income' | 'expense';
}

export default function PieChart({ data, height = 300, type = 'expense' }: PieChartProps) {
  // 过滤指定类型的数据
  const filteredData = data.filter(item => item.type === type);

  // 如果没有数据，显示占位符
  if (filteredData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-gray-500 text-center">
          <p className="text-lg font-medium">暂无{type === 'income' ? '收入' : '支出'}数据</p>
          <p className="text-sm mt-1">开始记录{type === 'income' ? '收入' : '支出'}后，这里将显示分类占比</p>
        </div>
      </div>
    );
  }

  // 设置默认颜色
  const defaultColors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#06B6D4', '#14B8A6', '#F97316', '#84CC16',
    '#6366F1', '#EC4899', '#0EA5E9', '#10B981', '#F59E0B'
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RePieChart>
        <Pie
          data={filteredData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percent, payload }) => `${payload.categoryName} ${((percent || 0) * 100).toFixed(1)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="amount"
          strokeWidth={2}
          stroke="white"
          nameKey="categoryName"
        >
          {filteredData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || defaultColors[index % defaultColors.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value, name, props) => [
            `¥${Number(value).toFixed(2)}`, 
            `${props.payload.categoryName} (${props.payload.percentage.toFixed(1)}%)`
          ]}
          contentStyle={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend 
          iconType="circle"
          formatter={(value) => {
            const item = filteredData.find(d => d.categoryName === value);
            return item ? `${item.categoryName} ${item.icon}` : value;
          }}
          wrapperStyle={{ paddingTop: 10 }}
        />
      </RePieChart>
    </ResponsiveContainer>
  );
}
