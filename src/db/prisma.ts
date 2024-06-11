import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://blackfeather247:blackfeather247@db:5432/wally_db?schema=public&connect_timeout=300" 
    },
  },
})