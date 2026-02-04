"use client";

interface BudgetProgressProps {
  budget: number;
  used: number;
  categoryName?: string;
  className?: string;
}

export default function BudgetProgress({ budget, used, categoryName, className = "" }: BudgetProgressProps) {
  // 计算预算使用百分比
  const percentage = Math.min((used / budget) * 100, 100);
  
  // 计算剩余预算
  const remaining = budget - used;
  
  // 根据使用百分比确定进度条颜色
  const getProgressColor = () => {
    if (percentage < 70) return "bg-green-500";
    if (percentage < 90) return "bg-yellow-500";
    return "bg-red-500";
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
    <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {categoryName && (
        <div className="text-sm font-medium text-gray-700 mb-2">
          {categoryName}
        </div>
      )}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">已使用</span>
          <span className="text-sm font-medium">{formatAmount(used)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">总预算</span>
          <span className="text-sm font-medium">{formatAmount(budget)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">剩余预算</span>
          <span className={`text-sm font-medium ${remaining < 0 ? "text-red-600" : "text-green-600"}`}>
            {formatAmount(remaining)}
          </span>
        </div>
        
        {/* 预算进度条 */}
        <div className="mt-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${getProgressColor()} transition-all duration-300 ease-in-out`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="mt-1 text-xs text-gray-500 text-right">
            {percentage.toFixed(1)}%
          </div>
        </div>
        
        {/* 预算状态提示 */}
        {percentage >= 100 && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md">
            ⚠️ 预算已超支 {formatAmount(used - budget)}
          </div>
        )}
        {percentage >= 90 && percentage < 100 && (
          <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded-md">
            ⚠️ 预算已使用90%以上，请合理消费
          </div>
        )}
      </div>
    </div>
  );
}
