"use client";

import { useState, useEffect } from "react";

import Layout from "@/components/layout/Layout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Category, TransactionType } from "@/types/index";
import { ApiResponse } from "@/types/api";

// 预定义图标选项
const iconOptions = [
  { value: "💰", label: "💰 货币" },
  { value: "💼", label: "💼 工作" },
  { value: "🏠", label: "🏠 住房" },
  { value: "🍔", label: "🍔 餐饮" },
  { value: "🚗", label: "🚗 交通" },
  { value: "🎓", label: "🎓 教育" },
  { value: "🏥", label: "🏥 医疗" },
  { value: "🎮", label: "🎮 娱乐" },
  { value: "🛍️", label: "🛍️ 购物" },
  { value: "📱", label: "📱 通讯" },
];

// 预定义颜色选项
const colorOptions = [
  { value: "#EF4444", label: "红色" },
  { value: "#F59E0B", label: "橙色" },
  { value: "#10B981", label: "绿色" },
  { value: "#3B82F6", label: "蓝色" },
  { value: "#8B5CF6", label: "紫色" },
  { value: "#EC4899", label: "粉色" },
  { value: "#6B7280", label: "灰色" },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<{name: string; type: TransactionType; icon: string; color: string}>({
    name: "",
    type: "expense" as TransactionType,
    icon: "💰",
    color: "#EF4444",
  });
  const [errors, setErrors] = useState<Record<string, string>>({
    name: "",
    submit: "",
  });
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // 删除确认状态已移除，直接执行删除操作

  // 获取分类列表
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log("开始获取分类列表...");
      const response = await fetch("/api/categories", {
        credentials: "include", // 确保携带认证cookie
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("响应状态:", response.status);
      console.log("响应头:", response.headers);
      
      if (!response.ok) {
        if (response.status === 401) {
          // 认证失败，重定向到登录页面
          console.warn("认证失败，重定向到登录页面");
          window.location.href = "/login";
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log("开始解析响应...");
      const data: ApiResponse<Category[]> = await response.json();
      console.log("响应数据:", data);

      if (data.success) {
        console.log("获取分类列表成功:", data.data);
        setCategories(data.data || []);
      } else {
        console.error("获取分类列表失败:", data.error);
        setErrors({ submit: data.error || "获取分类列表失败" });
      }
    } catch (error) {
      console.error("获取分类列表错误:", error);
      setErrors({ submit: "网络错误，请检查您的网络连接" });
    } finally {
      console.log("获取分类列表完成");
      setLoading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage("");

    // 客户端验证
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "分类名称不能为空";
    } else if (formData.name.length < 2) {
      newErrors.name = "分类名称至少需要2个字符";
    } else if (formData.name.length > 20) {
      newErrors.name = "分类名称不能超过20个字符";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(
          editingCategory ? "分类更新成功" : "分类创建成功"
        );
        setShowAddForm(false);
        setEditingCategory(null);
        setFormData({
          name: "",
          type: "expense",
          icon: "💰",
          color: "#EF4444",
        });
        fetchCategories();
      } else {
        setErrors({ submit: data.error });
      }
    } catch {
      setErrors({ submit: "网络错误，请稍后重试" });
    }
  };

  // 开始编辑分类
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon || "💰",
      color: category.color || "#EF4444",
    });
    setShowAddForm(true);
  };

  // 取消编辑
  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      type: "expense",
      icon: "💰",
      color: "#EF4444",
    });
  };

  // 删除分类（直接执行，不显示确认对话框）
  const handleDelete = async (id: string) => {
    try {
      console.log("开始删除分类:", id);
      // 构建查询参数，直接使用nullify操作
      const params = new URLSearchParams();
      params.append('action', 'nullify');

      const response = await fetch(`/api/categories/${id}?${params.toString()}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("删除响应状态:", response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          // 认证失败，重定向到登录页面
          console.warn("认证失败，重定向到登录页面");
          window.location.href = "/login";
          return;
        }
        // 尝试获取错误响应内容
        try {
          const errorData = await response.json();
          console.error("删除分类API错误:", errorData);
          setErrors({ submit: errorData.error || `HTTP错误: ${response.status}` });
        } catch (parseError) {
          setErrors({ submit: `HTTP错误: ${response.status}` });
        }
        return;
      }

      console.log("开始解析删除响应...");
      const data = await response.json();
      console.log("删除响应数据:", data);

      if (data.success) {
        console.log("分类删除成功");
        setSuccessMessage("分类删除成功，关联交易已设为未分类");
        fetchCategories();
      } else {
        console.error("删除分类失败:", data.error);
        setErrors({ submit: data.error || "删除分类失败" });
      }
    } catch (error) {
      console.error("删除分类错误:", error);
      setErrors({ submit: error instanceof Error ? error.message : "网络错误，删除分类失败，请稍后重试" });
    } finally {
      console.log("删除分类操作完成");
    }
  };

  // 分类类型筛选
  const filteredCategories = {
    income: categories.filter((c) => c.type === "income"),
    expense: categories.filter((c) => c.type === "expense"),
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
            <h1 className="text-3xl font-bold text-gray-900">分类管理</h1>
            <p className="mt-2 text-gray-600">
              管理您的收入和支出分类
            </p>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "取消" : "添加分类"}
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

        {/* 添加/编辑分类表单 */}
        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingCategory ? "编辑分类" : "添加分类"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="分类名称"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={errors.name}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类类型
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  图标
                </label>
                <Select
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData({ ...formData, icon: e.target.value })
                  }
                  options={iconOptions}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  颜色
                </label>
                <Select
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  options={colorOptions}
                />
              </div>

              <div className="flex space-x-3">
                <Button type="submit">
                  {editingCategory ? "更新" : "添加"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  取消
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 分类列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 收入分类 */}
          <div>
            <h3 className="text-lg font-medium text-green-600 mb-4">收入分类</h3>
            {filteredCategories.income.length === 0 ? (
              <div className="text-gray-500">暂无收入分类</div>
            ) : (
              <div className="space-y-3">
                {filteredCategories.income.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color || "#10B981" }}
                      >
                        <span className="text-white text-lg">{category.icon || "💰"}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          收入
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 支出分类 */}
          <div>
            <h3 className="text-lg font-medium text-red-600 mb-4">支出分类</h3>
            {filteredCategories.expense.length === 0 ? (
              <div className="text-gray-500">暂无支出分类</div>
            ) : (
              <div className="space-y-3">
                {filteredCategories.expense.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color || "#EF4444" }}
                      >
                        <span className="text-white text-lg">{category.icon || "💰"}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          支出
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
