import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, created, badRequest, notFound, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'
import { runSecurityScenario, getScenarioDefinitions } from '../../services/security-simulator.service'
import { z } from 'zod'

const RunSchema = z.object({
  scenarioId: z.string().min(1),
  walletId: z.string().min(1),
  amountDisplay: z.string().regex(/^\d+(\.\d{1,6})?$/),
})

export async function listScenarios(_req: AuthRequest, res: Response): Promise<void> {
  ok(res, getScenarioDefinitions())
}

export async function runScenario(req: AuthRequest, res: Response): Promise<void> {
  const parsed = RunSchema.safeParse(req.body)
  if (!parsed.success) {
    badRequest(res, parsed.error.errors.map(e => e.message).join(', '))
    return
  }

  try {
    const result = await runSecurityScenario(prisma, {
      ...parsed.data,
      adminId: req.user!.sub,
    })
    created(res, result)
  } catch (e: unknown) {
    badRequest(res, e instanceof Error ? e.message : 'Scenario failed')
  }
}

export async function getReport(req: AuthRequest, res: Response): Promise<void> {
  try {
    const report = await prisma.securityReport.findUnique({ where: { id: req.params.id } })
    if (!report) { notFound(res); return }
    ok(res, report)
  } catch {
    serverError(res)
  }
}

export async function listReports(req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)))
    const passed = req.query.passed

    const where: Record<string, unknown> = {}
    if (passed === 'true') where.passed = true
    if (passed === 'false') where.passed = false

    const [items, total] = await Promise.all([
      prisma.securityReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.securityReport.count({ where }),
    ])

    ok(res, { items, total, page, limit })
  } catch {
    serverError(res)
  }
}

export async function deleteReport(req: AuthRequest, res: Response): Promise<void> {
  try {
    await prisma.securityReport.delete({ where: { id: req.params.id } })
    ok(res, null, 'Report deleted')
  } catch {
    serverError(res)
  }
}
