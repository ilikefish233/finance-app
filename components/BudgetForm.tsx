"use client";

import React from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import { Category } from "@/types/index";

// 月份选项
const monthOptions = [
  { value: "1", label: "一月" },
  { value: "2", label: "二月" },
  { value: "3", label: "三月" },
  { value: "4", label: "四月" },
  { value: "5", label: "五月" },
  { value: "6", label: "六月" },
  { value: "7", label: "七月" },
  { value: "8", label: "八月" },
  { value: "9", label: "九月" },
  { value: "10", label: "十月" },
  { value: "11", label: "十一月" },
  { value: "12", label: "十二月" },
];

// 年份选项（最近5年）
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => ({
  value: year.toString(),
  label: year.toString(),
}));

interface BudgetFormProps {
  formData: {
    categoryId: string;
    amount: string;
    month: number;
    year: number;
  };
  errors: Record<string, string>;
  categories: Category[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function BudgetForm({ 
  formData, 
  errors, 
  categories, 
  onSubmit, 
  onCancel, 
  isEditing = false 
}: BudgetFormProps) {
  // 处理表单字段变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "month") {
      formData.month = parseInt(value);
    } else if (name === "year") {
      formData.year = parseInt(value);
    } else if (name === "amount") {
      formData.amount = value;
    } else if (name === "categoryId") {
      formData.categoryId = value;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {isEditing ? "编辑预算" : "添加预算"}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">月份</label>
            <Select
              name="month"
              value={formData.month.toString()}
              onChange={handleChange}
              options={monthOptions}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">年份</label>
            <Select
              name="year"
              value={formData.year.toString()}
              onChange={handleChange}
              options={yearOptions}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <Select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              options={[
                { value: "", label: "全部分类" },
                ...categories.filter(c => c.type === "expense").map(c => ({
                  value: c.id,
                  label: c.name,
                })),
              ]}
              placeholder="选择分类"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预算金额</label>
            <Input
              type="number"
              step="0.01"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              error={errors.amount}
              className="w-full"
              placeholder="请输入预算金额"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit">
            {isEditing ? "更新预算" : "创建预算"}
          </Button>
        </div>
      </form>
    </div>
  );
}
