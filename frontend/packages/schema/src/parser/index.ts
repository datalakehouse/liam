import type { SupportedFormat } from './supportedFormat/index.js'
import { detectFormat } from './supportedFormat/index.js'
import type { ProcessResult } from './types.js'

export { ProcessError } from './errors.js'
export { setPrismWasmUrl } from './schemarb/index.js'
export {
  detectFormat,
  type SupportedFormat,
  supportedFormatSchema,
} from './supportedFormat/index.js'

// List of valid supported formats for quick lookup
const SUPPORTED_FORMATS: readonly string[] = [
  'schemarb',
  'postgres',
  'drizzle',
  'tbls',
  'liam',
  'dbml',
]

/**
 * Type guard to check if a string is a valid SupportedFormat
 */
const isSupportedFormat = (value: string): value is SupportedFormat => {
  return SUPPORTED_FORMATS.includes(value)
}

/**
 * Parse a schema string into a structured format.
 *
 * @param str - The schema content to parse
 * @param formatOrPath - Either a SupportedFormat ('schemarb', 'postgres', 'drizzle', 'tbls', 'liam', 'dbml')
 *                       or a file path/name from which the format will be auto-detected
 * @returns The parsed schema result
 *
 * @example
 * // Using a format directly
 * const result = await parse(schemaContent, 'postgres')
 *
 * @example
 * // Using a file path (format auto-detected from extension)
 * const result = await parse(schemaContent, 'schema.sql')
 * const result = await parse(schemaContent, '/path/to/schema.ts')
 */
export const parse = async (
  str: string,
  formatOrPath: SupportedFormat | string,
): Promise<ProcessResult> => {
  // Check if formatOrPath is a valid SupportedFormat directly, otherwise try to detect from path
  const format: SupportedFormat | undefined = isSupportedFormat(formatOrPath)
    ? formatOrPath
    : detectFormat(formatOrPath)

  if (!format) {
    return {
      value: {
        tables: {},
        enums: {},
        extensions: {},
      },
      errors: [
        {
          name: 'UnsupportedFormatError',
          message: `Could not determine schema format from "${formatOrPath}". Supported formats: schemarb, postgres, drizzle, tbls, liam, dbml. Supported extensions: .rb, .sql, .ts, .js, .json, .dbml`,
        },
      ],
    }
  }

  switch (format) {
    case 'schemarb': {
      const { processor } = await import('./schemarb/index.js')
      return processor(str)
    }
    case 'postgres': {
      const { processor } = await import('./sql/index.js')
      return processor(str)
    }
    case 'drizzle': {
      const { processor } = await import('./drizzle/index.js')
      return processor(str)
    }
    case 'tbls': {
      const { processor } = await import('./tbls/index.js')
      return processor(str)
    }
    case 'liam': {
      const { processor } = await import('./liam/index.js')
      return processor(str)
    }
    case 'dbml': {
      const { processor } = await import('./dbml/index.js')
      return processor(str)
    }
  }
}
