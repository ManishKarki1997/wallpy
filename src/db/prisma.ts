import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv';

dotenv.config()

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    },
  },
  // datasources: {
  //   db: {
  //     url: "postgresql://blackfeather247:blackfeather247@db:5432/wally_db?schema=public&connect_timeout=300" 
  //   },
  // },
})
