"use client";

import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Category } from "@/types/index";
import { ApiResponse } from "@/types/api";

// 本地预算设置类型
interface LocalBudgetSetting {
  amount: number;
  isInfinite: boolean;
}

export default function BudgetsPage() {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    amount: "",
    isInfinite: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({
    amount: "",
    submit: "",
  });
  const [successMessage, setSuccessMessage] = useState<string>("");



  // 从本地存储加载预算设置
  useEffect(() => {
    const savedBudget = localStorage.getItem('monthlyBudget');
    if (savedBudget) {
      try {
        const parsedBudget = JSON.parse(savedBudget) as LocalBudgetSetting;
        setFormData({
          amount: parsedBudget.isInfinite ? "" : parsedBudget.amount.toString(),
          isInfinite: parsedBudget.isInfinite,
        });
      } catch (error) {
        console.error("解析本地预算设置失败:", error);
      }
    }
  }, []);

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ amount: "", submit: "" });
    setSuccessMessage("");
    
    // 表单验证
    if (!formData.isInfinite && !formData.amount) {
      setErrors(prev => ({ ...prev, amount: "请选择无限预算或输入预算金额" }));
      return;
    }
    
    if (!formData.isInfinite && parseFloat(formData.amount) <= 0) {
      setErrors(prev => ({ ...prev, amount: "预算金额必须大于0" }));
      return;
    }
    
    try {
      const budgetSetting: LocalBudgetSetting = {
        amount: formData.isInfinite ? 0 : parseFloat(formData.amount),
        isInfinite: formData.isInfinite,
      };
      
      // 保存到本地存储
      localStorage.setItem('monthlyBudget', JSON.stringify(budgetSetting));
      
      setSuccessMessage("预算设置保存成功");
      setShowForm(false);
    } catch (error) {
      console.error("保存预算设置错误:", error);
      setErrors(prev => ({ ...prev, submit: "保存失败，请稍后重试" }));
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">预算管理</h1>
            <p className="mt-2 text-gray-600">
              设置您的月度预算告警
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "取消" : "设置预算"}
          </Button>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
            {successMessage}
          </div>
        )}

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {errors.submit}
          </div>
        )}

        {/* 预算设置表单 */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              设置月度预算告警
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预算金额</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  error={errors.amount}
                  disabled={formData.isInfinite}
                  className="w-full"
                  placeholder="请输入预算金额"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isInfinite"
                  checked={formData.isInfinite}
                  onChange={(e) => setFormData(prev => ({ ...prev, isInfinite: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isInfinite" className="ml-2 block text-sm text-gray-700">
                  无限预算
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => {
                  setShowForm(false);
                  setFormData({
                    categoryId: "",
                    amount: "",
                    isInfinite: false,
                  });
                }}>
                  取消
                </Button>
                <Button type="submit">
                  保存预算
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 当前预算设置 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">当前预算设置</h2>
          </div>
          <div className="p-6">
            {localStorage.getItem('monthlyBudget') ? (
              <div className="space-y-4">
                {(() => {
                  const savedBudget = JSON.parse(localStorage.getItem('monthlyBudget') || '') as LocalBudgetSetting;
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">预算类型:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${savedBudget.isInfinite ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {savedBudget.isInfinite ? '无限' : '有限'}
                        </span>
                      </div>
                      {!savedBudget.isInfinite && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">预算金额:</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("zh-CN", {
                              style: "currency",
                              currency: "CNY",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(savedBudget.amount)}
                          </span>
                        </div>
                      )}

                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                暂无预算设置
                <div className="mt-2">
                  <Button size="sm" onClick={() => setShowForm(true)}>
                    立即设置
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}