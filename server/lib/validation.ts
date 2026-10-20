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
  mode: z.enum(['session', 'jwt']).default('session'),
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
  website: z
    .string()
    .trim()
    .max(120)
    .refine((value) => !value || /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/i.test(value), '网址格式不正确')
    .optional(),
  avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, '颜色格式不正确').optional(),
  avatarUrl: z.string().max(2_000_000).optional().nullable(),
})

const cover = z.enum(['store', 'chair', 'walk', 'receipt', 'desk', 'book', 'ice', 'bus', 'map'])

export const postCreateSchema = z.object({
  title: z.string().trim().min(2, '标题至少 2 个字').max(80, '标题最多 80 个字'),
  excerpt: z.string().trim().min(8, '摘要至少 8 个字').max(200, '摘要最多 200 个字'),
  body: z.string().min(20, '正文至少 20 个字').max(50000),
  content: z.array(z.unknown()).min(1, '正文不能为空').max(300),
  category: z.string().trim().min(1).max(24),
  tags: z.array(z.string().trim().min(1).max(24)).max(4).default([]),
  cover,
  status: z.enum(['draft', 'published']).default('published'),
})

export const postUpdateSchema = postCreateSchema.partial()

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type PostCreateInput = z.infer<typeof postCreateSchema>
export type PostUpdateInput = z.infer<typeof postUpdateSchema>
