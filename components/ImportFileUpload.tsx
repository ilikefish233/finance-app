"use client";

import React, { useState } from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";

interface ImportFileUploadProps {
  onFileSelected: (file: File) => void;
  onImport: () => void;
  disabled?: boolean;
}

export default function ImportFileUpload({ onFileSelected, onImport, disabled = false }: ImportFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    
    if (file) {
      // 检查文件类型
      const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");
      const isXLSX = file.type.includes("excel") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
      
      if (!isCSV && !isXLSX) {
        setError("请选择CSV或XLSX格式的文件");
        setSelectedFile(null);
        return;
      }
      
      // 检查文件大小（限制为10MB）
      if (file.size > 10 * 1024 * 1024) {
        setError("文件大小不能超过10MB");
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      onFileSelected?.(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onImport?.();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">微信支付账单</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              error={error}
              className="w-full"
              disabled={disabled}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={disabled || !selectedFile}
          >
            {disabled ? "导入中..." : "导入数据"}
          </Button>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
      {selectedFile && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
          <p className="text-sm">已选择文件: {selectedFile.name}</p>
          <p className="text-xs mt-1">文件大小: {(selectedFile.size / 1024).toFixed(2)} KB</p>
        </div>
      )}
    </div>
  );
}