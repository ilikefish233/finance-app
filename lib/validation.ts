import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码长度至少为6位'),
  name: z.string().min(1, '姓名长度至少为1位').optional().or(z.literal('')),
})

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '请输入密码'),
})

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('金额必须大于0'),
  categoryId: z.string().min(1, '请选择分类'),
  description: z.string().optional(),
  date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, '无效的日期格式'),
})

export const categorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空'),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
})

export const budgetSchema = z.object({
  amount: z.number().positive('预算金额必须大于0'),
  month: z.number().min(1).max(12, '月份必须在1-12之间'),
  year: z.number().min(2000).max(2100, '年份必须在2000-2100之间'),
  categoryId: z.string().optional(),
})
