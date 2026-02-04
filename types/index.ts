// 交易类型
export type TransactionType = 'income' | 'expense' | 'neutral';

// 分类类型
export type CategoryType = 'income' | 'expense';

// 交易状态
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

// 用户信息
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 分类信息
export interface Category {
  id: string;
  userId: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 交易信息
export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
}

// 预算信息
export interface Budget {
  id: string;
  userId: string;
  categoryId?: string;
  amount: number;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
