import { Response } from 'express'
import { prisma } from '../../utils/prisma'
import { ok, created, notFound, serverError } from '../../utils/response'
import { AuthRequest } from '../../middleware/auth'

export async function listTemplates(req: AuthRequest, res: Response): Promise<void> {
  try {
    const items = await prisma.simulationTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    })
    ok(res, items)
  } catch {
    serverError(res)
  }
}

export async function createTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, type, description, defaultDelay } = req.body
    const template = await prisma.simulationTemplate.create({
      data: { name, type, description, defaultDelay: defaultDelay ?? 0 },
    })
    await prisma.adminLog.create({
      data: {
        actorId: req.user!.sub,
        action: 'CREATE_TEMPLATE',
        targetType: 'SimulationTemplate',
        targetId: template.id,
      },
    })
    created(res, template)
  } catch {
    serverError(res)
  }
}

export async function updateTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, type, description, defaultDelay, isActive } = req.body
    const template = await prisma.simulationTemplate.update({
      where: { id: req.params.id },
      data: { name, type, description, defaultDelay, isActive },
    })
    ok(res, template)
  } catch {
    serverError(res)
  }
}

export async function deleteTemplate(req: AuthRequest, res: Response): Promise<void> {
  try {
    await prisma.simulationTemplate.update({
      where: { id: req.params.id },
      data: { isActive: false },
    })
    ok(res, null, 'Template deactivated')
  } catch {
    serverError(res)
  }
}
