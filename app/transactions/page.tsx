"use client";

import { useState, useEffect, useCallback } from "react";

import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Transaction, Category, TransactionType } from "@/types/index";
import { ApiResponse } from "@/types/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<{
    type: TransactionType;
    amount: string;
    categoryId: string;
    description: string;
    date: string;
  }>({
    type: "expense" as TransactionType,
    amount: "",
    categoryId: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({
    amount: "",
    categoryId: "",
    description: "",
    date: "",
    submit: "",
  });
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [filters, setFilters] = useState({  type: "" as TransactionType | "",  categoryId: "",  startDate: "",  endDate: "",});

  // 用于确认删除的状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    transactionId: string | null;
  }>({
    show: false,
    transactionId: null,
  });

  // 用于确认一键分类的状态
  const [autoCategorizeConfirm, setAutoCategorizeConfirm] = useState<{
    show: boolean;
  }>({
    show: false,
  });

  const fetchData = useCallback(async () => {
    try {
      // 获取交易记录
      const params = new URLSearchParams();
      if (filters.type) params.append("type", filters.type);
      if (filters.categoryId) params.append("categoryId", filters.categoryId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const transactionsResponse = await fetch(
        `/api/transactions?${params.toString()}`
      );
      const transactionsData: ApiResponse<Transaction[]> = await transactionsResponse.json();

      if (transactionsData.success) {
        setTransactions(transactionsData.data || []);
      } else {
        console.error("获取交易记录失败:", transactionsData.error);
      }

      // 获取分类列表
      const categoriesResponse = await fetch("/api/categories");
      const categoriesData: ApiResponse<Category[]> = await categoriesResponse.json();

      if (categoriesData.success) {
        setCategories(categoriesData.data || []);
      } else {
        console.error("获取分类列表失败:", categoriesData.error);
      }
    } catch (error) {
      console.error("获取数据错误:", error);
    } finally {
        setLoading(false);
      }
    }, [filters]);

  // 获取交易记录和分类列表
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    // 客户端验证
    const newErrors: Record<string, string> = {};
    
    // 验证金额
    const amount = parseFloat(formData.amount);
    if (!formData.amount.trim()) {
      newErrors.amount = "金额不能为空";
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = "请输入有效的金额（必须大于0）";
    } else if (amount > 1000000) {
      newErrors.amount = "金额不能超过1,000,000";
    }
    
    // 验证分类
    if (!formData.categoryId || formData.categoryId.trim() === "") {
      newErrors.categoryId = "请选择分类";
    }
    
    // 验证描述
    if (formData.description && formData.description.length > 50) {
      newErrors.description = "描述不能超过50个字符";
    }
    
    // 验证日期
    if (!formData.date) {
      newErrors.date = "日期不能为空";
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      // 不允许选择未来日期
      if (selectedDate > today) {
        newErrors.date = "不能选择未来日期";
      }
      // 不允许选择超过3年前的日期
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(today.getFullYear() - 3);
      if (selectedDate < threeYearsAgo) {
        newErrors.date = "不能选择超过3年前的日期";
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingTransaction
        ? `/api/transactions/${editingTransaction.id}`
        : "/api/transactions";
      const method = editingTransaction ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          amount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(
          editingTransaction ? "交易记录更新成功" : "交易记录创建成功"
        );
        setShowAddForm(false);
        setEditingTransaction(null);
        setFormData({
          type: "expense",
          amount: "",
          categoryId: "",
          description: "",
          date: new Date().toISOString().split("T")[0],
        });
        fetchData();
      } else {
        setErrors({ submit: data.error });
      }
    } catch {
      setErrors({ submit: "网络错误，请稍后重试" });
    }
  };

  // 开始编辑交易记录
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      categoryId: transaction.categoryId || "",
      description: transaction.description || "",
      date: new Date(transaction.date).toISOString().split("T")[0],
    });
    setShowAddForm(true);
  };

  // 取消编辑
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingTransaction(null);
    setFormData({
      type: "expense",
      amount: "",
      categoryId: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  // 打开删除确认对话框
  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({
      show: true,
      transactionId: id,
    });
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!deleteConfirm.transactionId) return;

    try {
      const response = await fetch(`/api/transactions/${deleteConfirm.transactionId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();

      if (data.success) {
        setSuccessMessage("交易记录删除成功");
        fetchData();
      } else {
        setErrors({ submit: data.error });
      }
    } catch {
      setErrors({ submit: "网络错误，请稍后重试" });
    } finally {
      // 关闭确认对话框
      setDeleteConfirm({
        show: false,
        transactionId: null,
      });
    }
  };

  // 取消删除
  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      transactionId: null,
    });
  };

  // 处理一键分类按钮点击
  const handleAutoCategorize = () => {
    setAutoCategorizeConfirm({
      show: true,
    });
  };

  // 确认一键分类
  const confirmAutoCategorize = async () => {
    try {
      const response = await fetch("/api/transactions/auto-categorize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("一键分类成功");
        fetchData();
      } else {
        setErrors({ submit: data.error });
      }
    } catch (error) {
      console.error("一键分类错误:", error);
      setErrors({ submit: "一键分类失败，请稍后重试" });
    } finally {
      setAutoCategorizeConfirm({
        show: false,
      });
    }
  };

  // 取消一键分类
  const cancelAutoCategorize = () => {
    setAutoCategorizeConfirm({
      show: false,
    });
  };

  // 处理筛选条件变化
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // 重置筛选条件
  const handleResetFilters = () => {
    setFilters({
      type: "",
      categoryId: "",
      startDate: "",
      endDate: "",
    });
  };

  // 获取筛选后的分类选项
  const filteredCategoryOptions = categories.filter(
    (category) => !filters.type || category.type === filters.type
  );

  // 格式化金额
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount);
  };

  // 格式化日期
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("zh-CN");
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">加载中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">收支记录</h1>
            <p className="mt-2 text-gray-600">
              管理您的收入和支出记录
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={handleAutoCategorize} 
              variant="secondary"
            >
              一键分类
            </Button>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "取消" : "添加交易"}
            </Button>
          </div>
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

        {/* 添加/编辑交易记录表单 */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingTransaction ? "编辑交易记录" : "添加交易记录"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  交易类型
                </label>
                <Select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as TransactionType })
                  }
                  options={[
                    { value: "income", label: "收入" },
                    { value: "expense", label: "支出" },
                  ]}
                />
              </div>

              <Input
                label="金额"
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                error={errors.amount}
                placeholder="请输入金额"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <Select
                  value={formData.categoryId}
                  onChange={(e) => {
                    setFormData({ ...formData, categoryId: e.target.value });
                  }}
                  options={[
                    { value: "", label: "请选择分类" },
                    ...categories
                      .filter((category) => category.type === formData.type)
                      .map((category) => ({
                        value: category.id,
                        label: category.name,
                      }))
                  ]}
                  placeholder="请选择分类"
                  required
                />
                {errors.categoryId && (
                  <p className="text-red-600 text-sm mt-1">{errors.categoryId}</p>
                )}
              </div>

              <Input
                label="描述"
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="请输入描述（可选）"
              />

              <Input
                label="日期"
                type="date"
                required
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />

              <div className="flex space-x-3">
                <Button type="submit">
                  {editingTransaction ? "更新" : "添加"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  取消
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 筛选条件 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">筛选条件</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易类型
              </label>
              <Select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                options={[
                  { value: "", label: "全部" },
                  { value: "income", label: "收入" },
                  { value: "expense", label: "支出" },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分类
              </label>
              <Select
                name="categoryId"
                value={filters.categoryId}
                onChange={handleFilterChange}
                options={[
                  { value: "", label: "全部" },
                  ...filteredCategoryOptions.map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                开始日期
              </label>
              <Input
                name="startDate"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                结束日期
              </label>
              <Input
                name="endDate"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <Button type="button" variant="outline" onClick={handleResetFilters}>
              重置筛选
            </Button>
          </div>
        </div>

        {/* 交易记录列表 */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">交易记录列表</h3>
          {transactions.length === 0 ? (
            <div className="text-gray-500">暂无交易记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分类
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      金额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      描述
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.type === "income"
                              ? "bg-red-100 text-red-800"
                              : transaction.type === "neutral"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {transaction.type === "income" ? "收入" : transaction.type === "neutral" ? "中性" : "支出"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {categories.find(c => c.id === transaction.categoryId)?.name || "未分类"}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap font-medium ${
                          transaction.type === "income"
                            ? "text-red-600"
                            : transaction.type === "neutral"
                            ? "text-gray-600"
                            : "text-green-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : transaction.type === "neutral" ? "" : "-"}{" "}
                        {formatAmount(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                          >
                            编辑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(transaction.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 删除确认对话框 */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0" 
            onClick={cancelDelete}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
          />
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg relative z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认删除</h3>
            <p className="text-gray-700 mb-6">确定要删除这个交易记录吗？此操作不可撤销。</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={cancelDelete}
              >
                取消
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
              >
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 一键分类确认对话框 */}
      {autoCategorizeConfirm.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div 
            className="absolute inset-0" 
            onClick={cancelAutoCategorize}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
          />
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg relative z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认一键分类</h3>
            <p className="text-gray-700 mb-6">确定要对所有交易记录进行自动分类吗？这将根据交易描述和金额重新分配分类。</p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={cancelAutoCategorize}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={confirmAutoCategorize}
              >
                确认分类
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
