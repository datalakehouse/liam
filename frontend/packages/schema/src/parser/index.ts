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
 * Type guard to check if a value is a non-null object
 */
const isNonNullObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

/**
 * Detect JSON schema format by examining the content structure.
 * TBLS format uses arrays for tables/enums, while Liam format uses objects.
 */
const detectJsonFormat = (str: string): 'tbls' | 'liam' | null => {
  try {
    const parsed: unknown = JSON.parse(str)
    if (!isNonNullObject(parsed)) {
      return null
    }

    // Check if 'tables' exists and determine its type
    if ('tables' in parsed) {
      const tables = parsed['tables']
      // TBLS format: tables is an array
      if (Array.isArray(tables)) {
        return 'tbls'
      }
      // Liam format: tables is an object (record)
      if (isNonNullObject(tables)) {
        return 'liam'
      }
    }

    // If no tables field, check for other TBLS-specific fields
    if ('relations' in parsed || 'driver' in parsed || 'viewpoints' in parsed) {
      return 'tbls'
    }

    // If has extensions field (Liam-specific), it's Liam format
    if ('extensions' in parsed) {
      return 'liam'
    }

    // Default to tbls for backwards compatibility
    return 'tbls'
  } catch {
    return null
  }
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
  let format: SupportedFormat | undefined = isSupportedFormat(formatOrPath)
    ? formatOrPath
    : detectFormat(formatOrPath)

  // For JSON files, we need to examine the content to distinguish between TBLS and Liam formats
  // since both use .json extension but have different structures
  if (format === 'tbls') {
    const detectedJsonFormat = detectJsonFormat(str)
    if (detectedJsonFormat) {
      format = detectedJsonFormat
    }
  }

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
