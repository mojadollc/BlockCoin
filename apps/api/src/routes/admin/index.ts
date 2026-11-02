import { Router } from 'express'
import { authenticate, requireRole } from '../../middleware/auth'
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
import { validate } from '../../middleware/validate'
import { AdjustBalanceSchema, CreateTemplateSchema, CreateSimulationSchema } from '@blockcoin/validation'
import { z } from 'zod'

const router = Router()
router.use(authenticate, requireRole('ADMIN'))

// Dashboard
router.get('/dashboard', getDashboard)

// Users
router.get('/users', listUsers)
router.get('/users/:id', getUser)
router.post('/users', validate(z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'USER']).optional(),
})), createUser)
router.put('/users/:id', validate(z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
  isActive: z.boolean().optional(),
})), updateUser)
router.post('/users/:id/suspend', suspendUser)
router.post('/users/:id/activate', activateUser)
router.post('/users/:id/reset-password', resetUserPassword)

// Wallets
router.get('/wallets', listWallets)
router.post('/wallets/:id/adjust', validate(AdjustBalanceSchema), adjustBalance)
router.post('/wallets/:id/suspend', suspendWallet)
router.post('/wallets/:id/activate', activateWallet)

// Transactions
router.get('/transactions', listTransactions)
router.get('/ledger', listLedgerEntries)

// Templates
router.get('/templates', listTemplates)
router.post('/templates', validate(CreateTemplateSchema), createTemplate)
router.put('/templates/:id', updateTemplate)
router.delete('/templates/:id', deleteTemplate)

// Audit logs
router.get('/audit-logs', listAuditLogs)

// Settings
router.get('/settings', getSettings)
router.post('/settings', upsertSetting)

// Env key management
router.get('/env-keys', getEnvKeys)
router.post('/env-keys', updateEnvKey)

// UI flags (write only — read is on public route)
router.post('/ui-flags', updateUIFlag)

// Simulations
router.get('/simulations', adminListSimulations)
router.post('/simulations', validate(CreateSimulationSchema), adminCreateSimulation)
router.get('/simulations/:id', adminGetSimulation)
router.post('/simulations/:id/cancel', adminCancelSim)
router.post('/simulations/:id/force-status', adminForceStatus)

// Security simulator
router.get('/security/scenarios', listScenarios)
router.post('/security/run', runScenario)
router.get('/security/reports', listReports)
router.get('/security/reports/:id', getReport)
router.delete('/security/reports/:id', deleteReport)

// Security reports (legacy)
router.get('/security-reports', getSecurityReports)

export default router
