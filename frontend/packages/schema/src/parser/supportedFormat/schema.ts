import * as v from 'valibot'

export const supportedFormatSchema = v.picklist([
  'schemarb',
  'postgres',
  'prisma',
  'drizzle',
  'tbls',
  'liam',
  'dbml',
])

export type SupportedFormat = v.InferOutput<typeof supportedFormatSchema>
