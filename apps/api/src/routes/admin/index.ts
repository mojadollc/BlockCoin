import { Router } from 'express'
import { authenticate, requireRole, requirePermission } from '../../middleware/auth'
import { getDashboard } from '../../controllers/admin/dashboard.controller'
import {
  listUsers, getUser, createUser, updateUser,
  suspendUser, activateUser, resetUserPassword,
} from '../../controllers/admin/users.controller'
import {
  listWallets, adjustBalance, suspendWallet, activateWallet,
} from '../../controllers/admin/wallets.controller'
import { listTransactions, listLedgerEntries } from '../../controllers/admin/transactions.controller'
import { listTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../controllers/admin/templates.controller'
import { listAuditLogs } from '../../controllers/admin/audit.controller'
import { getSettings, upsertSetting, getEnvKeys, updateEnvKey, updateUIFlag, getSecurityReports } from '../../controllers/admin/settings.controller'
import { getUIFlags } from '../../controllers/admin/settings.controller'
import {
  listScenarios, runScenario, getReport, listReports, deleteReport,
} from '../../controllers/admin/security.controller'
import {
  adminListSimulations, adminGetSimulation, adminCreateSimulation,
  adminCancelSim, adminForceStatus,
} from '../../controllers/admin/simulations.controller'
import { getSubAdminPermissions, setSubAdminPermissions, getMyPermissions } from '../../controllers/admin/permissions.controller'
import { adminListDeposits, approveDeposit, rejectDeposit, setDepositStatus } from '../../controllers/admin/deposits.controller'
import { validate } from '../../middleware/validate'
import { AdjustBalanceSchema, CreateTemplateSchema, CreateSimulationSchema } from '@blockcoin/validation'
import { z } from 'zod'

const router = Router()

// All admin routes require authentication + ADMIN or SUB_ADMIN role
router.use(authenticate, requireRole('ADMIN', 'SUB_ADMIN'))

// Dashboard — all admin/sub-admin can see
router.get('/dashboard', getDashboard)

// Users — feature: users
router.get('/users', requirePermission('users', 'READ'), listUsers)
router.get('/users/:id', requirePermission('users', 'READ'), getUser)
router.post('/users', requireRole('ADMIN'), validate(z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'SUB_ADMIN', 'USER']).optional(),
})), createUser)
router.put('/users/:id', requirePermission('users', 'WRITE'), validate(z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'SUB_ADMIN', 'USER']).optional(),
  isActive: z.boolean().optional(),
})), updateUser)
router.post('/users/:id/suspend', requirePermission('users', 'WRITE'), suspendUser)
router.post('/users/:id/activate', requirePermission('users', 'WRITE'), activateUser)
router.post('/users/:id/reset-password', requirePermission('users', 'WRITE'), resetUserPassword)

// My own permissions — SUB_ADMIN can fetch their own (used by sidebar)
router.get('/me/permissions', getMyPermissions)

// Sub-admin permissions — ADMIN only (to manage other users)
router.get('/users/:id/permissions', requireRole('ADMIN'), getSubAdminPermissions)
router.post('/users/:id/permissions', requireRole('ADMIN'), setSubAdminPermissions)

// Wallets — feature: wallets
router.get('/wallets', requirePermission('wallets', 'READ'), listWallets)
router.post('/wallets/:id/adjust', requirePermission('wallets', 'WRITE'), validate(AdjustBalanceSchema), adjustBalance)
router.post('/wallets/:id/suspend', requirePermission('wallets', 'WRITE'), suspendWallet)
router.post('/wallets/:id/activate', requirePermission('wallets', 'WRITE'), activateWallet)

// Transactions — feature: transactions
router.get('/transactions', requirePermission('transactions', 'READ'), listTransactions)
router.get('/ledger', requirePermission('transactions', 'READ'), listLedgerEntries)

// Templates — feature: templates
router.get('/templates', requirePermission('templates', 'READ'), listTemplates)
router.post('/templates', requirePermission('templates', 'WRITE'), validate(CreateTemplateSchema), createTemplate)
router.put('/templates/:id', requirePermission('templates', 'WRITE'), updateTemplate)
router.delete('/templates/:id', requirePermission('templates', 'WRITE'), deleteTemplate)

// Audit logs — feature: audit_logs
router.get('/audit-logs', requirePermission('audit_logs', 'READ'), listAuditLogs)

// Settings — feature: settings (ADMIN only for writes)
router.get('/settings', requirePermission('settings', 'READ'), getSettings)
router.post('/settings', requirePermission('settings', 'WRITE'), upsertSetting)
router.get('/env-keys', requireRole('ADMIN'), getEnvKeys)
router.post('/env-keys', requireRole('ADMIN'), updateEnvKey)
router.post('/ui-flags', requirePermission('settings', 'WRITE'), updateUIFlag)

// Payments/Simulations — feature: payments
router.get('/simulations', requirePermission('payments', 'READ'), adminListSimulations)
router.post('/simulations', requirePermission('payments', 'WRITE'), validate(CreateSimulationSchema), adminCreateSimulation)
router.get('/simulations/:id', requirePermission('payments', 'READ'), adminGetSimulation)
router.post('/simulations/:id/cancel', requirePermission('payments', 'WRITE'), adminCancelSim)
router.post('/simulations/:id/force-status', requirePermission('payments', 'WRITE'), adminForceStatus)

// Security — feature: security
router.get('/security/scenarios', requirePermission('security', 'READ'), listScenarios)
router.post('/security/run', requirePermission('security', 'WRITE'), runScenario)
router.get('/security/reports', requirePermission('security', 'READ'), listReports)
router.get('/security/reports/:id', requirePermission('security', 'READ'), getReport)
router.delete('/security/reports/:id', requirePermission('security', 'WRITE'), deleteReport)
router.get('/security-reports', requirePermission('security', 'READ'), getSecurityReports)

// Deposits — feature: deposits
router.get('/deposits', requirePermission('deposits', 'READ'), adminListDeposits)
router.post('/deposits/:id/approve', requirePermission('deposits', 'WRITE'), approveDeposit)
router.post('/deposits/:id/reject', requirePermission('deposits', 'WRITE'), rejectDeposit)
router.post('/deposits/:id/status', requirePermission('deposits', 'WRITE'), setDepositStatus)

export default router
