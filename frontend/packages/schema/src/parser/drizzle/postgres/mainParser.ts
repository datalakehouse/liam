/**
 * Main orchestrator for Drizzle ORM schema parsing
 */

import { parse } from '@babel/parser'
import type { CallExpression, File, VariableDeclarator } from '@babel/types'
import type { Processor, ProcessResult } from '../../types.js'
import { extractPgTableFromChain, isSchemaTableCall } from './astUtils.js'
import {
  convertDrizzleEnumsToInternal,
  convertDrizzleTablesToInternal,
} from './converter.js'
import { parsePgEnumCall } from './enumParser.js'
import {
  parsePgTableCall,
  parsePgTableWithComment,
  parseSchemaTableCall,
} from './tableParser.js'
import type { DrizzleEnumDefinition, DrizzleTableDefinition } from './types.js'

/**
 * Parse Drizzle TypeScript schema to extract table definitions using Babel AST
 */
const parseDrizzleSchema = (
  sourceCode: string,
): {
  tables: Record<string, DrizzleTableDefinition>
  enums: Record<string, DrizzleEnumDefinition>
  variableToTableMapping: Record<string, string>
} => {
  // Parse TypeScript code into AST
  const ast = parse(sourceCode, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  const tables: Record<string, DrizzleTableDefinition> = {}
  const enums: Record<string, DrizzleEnumDefinition> = {}
  const variableToTableMapping: Record<string, string> = {}

  // Traverse the AST to find pgTable calls
  visitFile(ast, tables, enums, variableToTableMapping)

  return { tables, enums, variableToTableMapping }
}

/**
 * Visit and traverse the file AST
 */
const visitFile = (
  file: File,
  tables: Record<string, DrizzleTableDefinition>,
  enums: Record<string, DrizzleEnumDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  for (const item of file.program.body) {
    if (item.type === 'VariableDeclaration') {
      for (const declarator of item.declarations) {
        visitVariableDeclarator(
          declarator,
          tables,
          enums,
          variableToTableMapping,
        )
      }
    } else if (
      item.type === 'ExportNamedDeclaration' &&
      item.declaration?.type === 'VariableDeclaration'
    ) {
      for (const declarator of item.declaration.declarations) {
        visitVariableDeclarator(
          declarator,
          tables,
          enums,
          variableToTableMapping,
        )
      }
    }
  }
}

/**
 * Check if the call expression is a comment call
 */
const isCommentCall = (callExpr: CallExpression): boolean => {
  return (
    callExpr.type === 'CallExpression' &&
    callExpr.callee.type === 'MemberExpression' &&
    callExpr.callee.property.type === 'Identifier' &&
    callExpr.callee.property.name === '$comment'
  )
}

/**
 * Check if the call expression is a pgEnum call
 */
const isPgEnumCall = (callExpr: CallExpression): boolean => {
  return (
    callExpr.callee.type === 'Identifier' && callExpr.callee.name === 'pgEnum'
  )
}

/**
 * Handle comment calls
 */
const handleCommentCall = (
  declarator: VariableDeclarator,
  tables: Record<string, DrizzleTableDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  if (declarator.init?.type !== 'CallExpression') return

  const table = parsePgTableWithComment(declarator.init)
  if (table && declarator.id.type === 'Identifier') {
    tables[table.name] = table
    variableToTableMapping[declarator.id.name] = table.name
  }
}

/**
 * Handle schema table calls
 */
const handleSchemaTableCall = (
  declarator: VariableDeclarator,
  callExpr: CallExpression,
  tables: Record<string, DrizzleTableDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  const table = parseSchemaTableCall(callExpr)
  if (table && declarator.id.type === 'Identifier') {
    tables[table.name] = table
    variableToTableMapping[declarator.id.name] = table.name
  }
}

/**
 * Handle pgEnum calls
 */
const handlePgEnumCall = (
  declarator: VariableDeclarator,
  callExpr: CallExpression,
  enums: Record<string, DrizzleEnumDefinition>,
) => {
  const enumDef = parsePgEnumCall(callExpr)
  if (enumDef && declarator.id.type === 'Identifier') {
    const variableName = declarator.id.name
    // Only store by variable name to avoid conflicts between actual name and variable name
    enums[variableName] = enumDef
  }
}

/**
 * Handle pgTable calls (direct or method chained)
 */
const handlePgTableCall = (
  declarator: VariableDeclarator,
  callExpr: CallExpression,
  tables: Record<string, DrizzleTableDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  const basePgTableCall = extractPgTableFromChain(callExpr)
  if (basePgTableCall) {
    const table = parsePgTableCall(basePgTableCall)
    if (table && declarator.id.type === 'Identifier') {
      tables[table.name] = table
      variableToTableMapping[declarator.id.name] = table.name
    }
  }
}

/**
 * Visit variable declarator to find pgTable, pgEnum, or relations calls
 */
const visitVariableDeclarator = (
  declarator: VariableDeclarator,
  tables: Record<string, DrizzleTableDefinition>,
  enums: Record<string, DrizzleEnumDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  if (!declarator.init || declarator.init.type !== 'CallExpression') {
    return
  }

  const callExpr = declarator.init

  // Handle different types of call expressions
  if (isCommentCall(declarator.init)) {
    handleCommentCall(declarator, tables, variableToTableMapping)
  } else if (isSchemaTableCall(callExpr)) {
    handleSchemaTableCall(declarator, callExpr, tables, variableToTableMapping)
  } else if (isPgEnumCall(callExpr)) {
    handlePgEnumCall(declarator, callExpr, enums)
  } else {
    handlePgTableCall(declarator, callExpr, tables, variableToTableMapping)
  }
}

/**
 * Main processor function for Drizzle schemas
 */
const parseDrizzleSchemaString = (
  schemaString: string,
): Promise<ProcessResult> => {
  try {
    const {
      tables: drizzleTables,
      enums,
      variableToTableMapping,
    } = parseDrizzleSchema(schemaString)
    const { tables, errors } = convertDrizzleTablesToInternal(
      drizzleTables,
      enums,
      variableToTableMapping,
    )
    const convertedEnums = convertDrizzleEnumsToInternal(enums)

    return Promise.resolve({
      value: { tables, enums: convertedEnums, extensions: {} },
      errors,
    })
  } catch (error) {
    return Promise.resolve({
      value: { tables: {}, enums: {}, extensions: {} },
      errors: [
        new Error(
          `Error parsing Drizzle schema: ${error instanceof Error ? error.message : String(error)}`,
        ),
      ],
    })
  }
}

export const processor: Processor = parseDrizzleSchemaString
