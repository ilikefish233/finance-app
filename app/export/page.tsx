"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from "@/components/layout/Layout";
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Loading from '@/components/ui/Loading';

const ExportPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  // 获取用户分类
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCategories(data.data || []);
          }
        }
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    };

    fetchCategories();
  }, []);

  // 处理导出
  const handleExport = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: dateRange.start,
          endDate: dateRange.end,
          categoryId: categoryId || undefined,
          format: exportFormat
        })
      });

      if (response.ok) {
        // 处理下载
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 从响应头获取文件名
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'transactions.csv';
        
        if (contentDisposition) {
          const matches = /filename="([^"]+)"/.exec(contentDisposition);
          if (matches && matches[1]) {
            filename = matches[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        alert(`导出失败: ${errorData.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('导出错误:', error);
      alert('导出失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理日期输入变化
  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">数据导出</h1>
          <p className="mt-2 text-gray-600">
            导出您的交易记录，方便在其他应用中查看和分析
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            导出设置
          </h2>
          
          <div className="space-y-4">
            {/* 导出格式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                导出格式
              </label>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full"
                options={[
                  { value: "csv", label: "CSV (逗号分隔值)" }
                  // 后续可以添加Excel格式支持
                ]}
              />
            </div>

            {/* 日期范围 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日期范围
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">开始日期</label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">结束日期</label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 分类筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类筛选 (可选)
              </label>
              <Select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full"
                options={[
                  { value: "", label: "全部分类" },
                  ...categories.map(category => ({
                    value: category.id,
                    label: `${category.name} (${category.type === 'income' ? '收入' : '支出'})`
                  }))
                ]}
              />
            </div>
          </div>
        </div>

        {/* 导出按钮 */}
        <div className="flex justify-center">
          <Button
            onClick={handleExport}
            disabled={isLoading}
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <Loading size="small" className="mr-2" />
                导出中...
              </>
            ) : (
              '开始导出'
            )}
          </Button>
        </div>

        {/* 导出说明 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">导出说明</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 导出文件包含交易日期、类型、金额、分类、描述等信息</li>
            <li>• CSV格式可在Excel、Numbers等电子表格软件中打开</li>
            <li>• 如需导出特定时间段的交易，请设置日期范围</li>
            <li>• 可选择特定分类进行导出，不选择则导出所有分类</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default ExportPage;
