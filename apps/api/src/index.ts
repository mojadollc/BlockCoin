import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketServer } from 'socket.io'

import authRoutes from './routes/auth.routes'
import profileRoutes from './routes/profile.routes'
import adminRoutes from './routes/admin/index'
import walletRoutes from './routes/wallets.routes'
import transactionRoutes from './routes/transactions.routes'
import simulationRoutes from './routes/simulations.routes'
import testnetRoutes from './routes/testnet.routes'
import { getUIFlags } from './controllers/admin/settings.controller'

const app = express()
const httpServer = createServer(app)

export const io = new SocketServer(httpServer, {
  cors: { origin: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000', credentials: true },
})

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000', credentials: true }))
app.use(cookieParser())
app.use(express.json())

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }))

// Public — no auth required
app.get('/api/v1/ui-flags', getUIFlags)

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/profile', profileRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/wallets', walletRoutes)
app.use('/api/v1/transactions', transactionRoutes)
app.use('/api/v1/simulations', simulationRoutes)
app.use('/api/v1/testnet', testnetRoutes)

app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }))

io.on('connection', (socket) => {
  socket.on('join:wallet', (walletId: string) => socket.join(`wallet:${walletId}`))
  socket.on('join:user', (userId: string) => socket.join(`user:${userId}`))
})

const PORT = Number(process.env.API_PORT ?? 4000)
httpServer.listen(PORT, () => console.log(`BlockCoin API running on port ${PORT}`))

export default app
