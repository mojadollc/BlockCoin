import { z } from 'zod'

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const CreateWalletSchema = z.object({
  label: z.string().min(1).max(100),
})

export const AdjustBalanceSchema = z.object({
  amountDisplay: z.string().regex(/^\d+(\.\d{1,6})?$/),
  type: z.enum(['CREDIT', 'DEBIT', 'ADJUSTMENT']),
  description: z.string().min(1).max(500),
})

export const CreateSimulationSchema = z.object({
  walletId: z.string().min(1),
  type: z.enum(['CREDIT', 'DEBIT', 'TRANSFER']),
  amountDisplay: z.string().regex(/^\d+(\.\d{1,6})?$/),
  description: z.string().max(500).optional(),
  processingDelay: z.number().int().min(0).max(3600).default(0),
  expiresInSeconds: z.number().int().min(0).optional(),
  templateId: z.string().min(1).optional(),
})

export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['CREDIT', 'DEBIT', 'TRANSFER']),
  description: z.string().max(500).optional(),
  defaultDelay: z.number().int().min(0).default(0),
})

export { z }
