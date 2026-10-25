import { z } from 'zod'

const email = z.string().trim().toLowerCase().email('请输入有效的邮箱地址').max(160)
const password = z
  .string()
  .min(8, '密码至少 8 位')
  .max(72, '密码最多 72 位')
  .regex(/[A-Za-z]/, '密码至少包含一个字母')
  .regex(/\d/, '密码至少包含一个数字')
const username = z
  .string()
  .trim()
  .min(2, '用户名至少 2 个字')
  .max(24, '用户名最多 24 个字')
  .refine((value) => !/^[\s]+$/.test(value), '用户名不能为空')

export const codeRequestSchema = z.object({
  email,
  purpose: z.enum(['register', 'reset']),
})

export const registerSchema = z.object({
  email,
  username,
  password,
  code: z.string().regex(/^\d{6}$/, '验证码为 6 位数字'),
})

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, '请输入邮箱或用户名').max(160),
  password: z.string().min(1, '请输入密码').max(72),
  remember: z.boolean().default(false),
})

export const resetPasswordSchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/, '验证码为 6 位数字'),
  password,
})

export const profileUpdateSchema = z.object({
  username: username.optional(),
  bio: z.string().trim().max(160, '介绍最多 160 个字').optional(),
  location: z.string().trim().max(40, '城市最多 40 个字').optional(),
  github: z
    .string()
    .trim()
    .max(160)
    .refine(
      (value) => !value || /^(https?:\/\/)?(www\.)?github\.com\/[^\s]+$/i.test(value),
      'GitHub 地址格式不正确',
    )
    .optional(),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, '颜色格式不正确').optional(),
  avatarUrl: z.string().max(2_000_000).optional().nullable(),
})

const cover = z.enum(['store', 'chair', 'walk', 'receipt', 'desk', 'book', 'ice', 'bus', 'map'])

export const postCreateSchema = z.object({
  title: z.string().trim().max(80, '标题最多 80 个字').default(''),
  excerpt: z.string().trim().min(8, '摘要至少 8 个字').max(200, '摘要最多 200 个字'),
  body: z.string().min(20, '正文至少 20 个字').max(50000),
  content: z.array(z.unknown()).min(1, '正文不能为空').max(300),
  category: z.string().trim().min(1).max(24),
  tags: z.array(z.string().trim().min(1).max(24)).max(4).default([]),
  cover,
})

export const postUpdateSchema = postCreateSchema.partial()

export const reviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().trim().max(200).optional(),
})

export const githubToolSchema = z.object({
  url: z.string().trim().min(10).max(300),
  description: z.string().trim().min(2).max(240),
  experience: z.string().trim().max(600).optional().default(''),
  categoryId: z.string().uuid().nullable().optional(),
})

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(24),
})

export const githubToolCategorySchema = z.object({
  name: z.string().trim().min(1).max(24),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type PostCreateInput = z.infer<typeof postCreateSchema>
export type PostUpdateInput = z.infer<typeof postUpdateSchema>
