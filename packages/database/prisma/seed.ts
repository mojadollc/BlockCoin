import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@blockcoin.lab'
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@BlockCoin2024!'

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Admin already exists, skipping seed.')
    return
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id })

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'BlockCoin',
      role: 'ADMIN',
    },
  })

  console.log(`Admin user created: ${email}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
