"use client";

import { useState, useCallback } from "react";
import Layout from "@/components/layout/Layout";
import ImportFileUpload from "@/components/ImportFileUpload";
import { parseWeChatBill } from "@/lib/import/wechat";
import { parseAppExportCSV } from "@/lib/import/app";
import { ApiResponse } from "@/types/api";

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  failed: number;
  errors?: string[];
}

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileSelected = useCallback((file: File) => {
    if (file && file.name) {
      setSelectedFile(file);
      setResult(null);
    } else {
      setSelectedFile(null);
    }
  }, []);

  // 检测文件类型
  const detectFileType = useCallback((file: File): Promise<'wechat' | 'app-export'> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          
          // 检查是否包含程序导出的表头
          if (content.includes('日期,类型,金额,分类,描述,创建时间')) {
            resolve('app-export');
          } else if (content.includes('交易时间') && content.includes('交易类型') && content.includes('交易对方')) {
            resolve('wechat');
          } else {
            // 尝试解析前几行，检查是否符合程序导出格式
            const lines = content.split('\n');
            if (lines.length > 0) {
              const firstLine = lines[0].trim();
              if (firstLine.includes('日期') && firstLine.includes('类型') && firstLine.includes('金额')) {
                resolve('app-export');
              } else {
                resolve('wechat');
              }
            } else {
              reject(new Error('无法识别文件格式'));
            }
          }
        } catch (error) {
          reject(new Error('检测文件类型失败'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('读取文件失败'));
      };
      
      // 读取文件前1000字节进行检测
      reader.readAsText(file.slice(0, 1000));
    });
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedFile) return;
    
    setImporting(true);
    setResult(null);
    
    try {
      // 检测文件类型
      console.log("开始检测文件类型:", selectedFile.name);
      const fileType = await detectFileType(selectedFile);
      console.log("文件类型检测结果:", fileType);
      
      // 解析文件
      let transactions;
      if (fileType === 'app-export') {
        console.log("使用程序导出CSV解析器");
        transactions = await parseAppExportCSV(selectedFile);
      } else {
        console.log("使用微信账单解析器");
        transactions = await parseWeChatBill(selectedFile);
      }
      
      console.log("解析完成，交易记录数量:", transactions.length);
      
      // 保存到数据库
      console.log("开始保存到数据库");
      const response = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactions }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse<ImportResult> = await response.json();
      console.log("保存完成，结果:", data);
      
      if (data.success) {
        setResult(data.data);
      } else {
        throw new Error(data.error || "导入失败");
      }
    } catch (error) {
      console.error("导入错误:", error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "导入失败，请检查文件格式是否正确",
        imported: 0,
        failed: 0,
        errors: error instanceof Error ? [error.message] : undefined,
      });
    } finally {
      setImporting(false);
    }
  }, [selectedFile, detectFileType]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">导入数据</h1>
          <p className="mt-2 text-gray-600">
            导入微信支付账单，批量添加交易记录
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            数据导入
          </h2>
          <div className="space-y-4">
            <ImportFileUpload
              onFileSelected={handleFileSelected}
              onImport={handleImport}
              disabled={importing}
            />
            
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
              <h3 className="text-sm font-medium">支持的文件类型：</h3>
              <ul className="mt-2 text-sm space-y-1">
                <li>• 微信支付导出的CSV或XLSX格式账单</li>
                <li>• 本程序导出的CSV格式交易记录</li>
              </ul>
              
              <h3 className="text-sm font-medium mt-3">注意事项：</h3>
              <ul className="mt-2 text-sm space-y-1">
                <li>• 微信账单导出时请选择'仅导出本设备的账单记录'</li>
                <li>• 导入过程可能需要一些时间，请耐心等待</li>
                <li>• 导入完成后会显示成功和失败的记录数</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 导入结果 */}
        {result && (
          <div className={`bg-white p-6 rounded-lg shadow-sm border ${result.success ? 'border-green-200' : 'border-red-200'}`}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">导入结果</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-xl ${result.success ? 'text-green-500' : 'text-red-500'}`}>
                  {result.success ? '✅' : '❌'}
                </span>
                <span className="text-lg font-medium">{result.message}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">成功导入</div>
                  <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">导入失败</div>
                  <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                </div>
              </div>
              
              {result.errors && result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium mb-2">错误详情：</h3>
                  <ul className="text-sm space-y-1">
                    {result.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li>• ...还有 {result.errors.length - 5} 个错误</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}