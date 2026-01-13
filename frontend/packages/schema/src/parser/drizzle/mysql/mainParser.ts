/**
 * Main orchestrator for Drizzle ORM MySQL schema parsing
 */

import { parse } from '@babel/parser'
import type { File, VariableDeclarator } from '@babel/types'
import type { Processor, ProcessResult } from '../../types.js'
import {
  isMysqlSchemaCall,
  isMysqlTableCall,
  isSchemaTableCall,
} from './astUtils.js'
import {
  convertDrizzleEnumsToInternal,
  convertDrizzleTablesToInternal,
} from './converter.js'
import { parseMysqlEnumCall } from './enumParser.js'
import { parseMysqlSchemaCall } from './schemaParser.js'
import {
  parseMysqlTableCall,
  parseMysqlTableWithComment,
  parseSchemaTableCall,
} from './tableParser.js'
import type {
  DrizzleEnumDefinition,
  DrizzleSchemaDefinition,
  DrizzleTableDefinition,
} from './types.js'

/**
 * Parse Drizzle TypeScript schema to extract table definitions using Babel AST
 */
const parseDrizzleSchema = (
  sourceCode: string,
): {
  tables: Record<string, DrizzleTableDefinition>
  enums: Record<string, DrizzleEnumDefinition>
  schemas: Record<string, DrizzleSchemaDefinition>
  variableToTableMapping: Record<string, string>
} => {
  // Parse TypeScript code into AST
  const ast = parse(sourceCode, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  const tables: Record<string, DrizzleTableDefinition> = {}
  const enums: Record<string, DrizzleEnumDefinition> = {}
  const schemas: Record<string, DrizzleSchemaDefinition> = {}
  const variableToTableMapping: Record<string, string> = {}

  // Traverse the AST to find mysqlTable, mysqlSchema calls
  visitFile(ast, tables, enums, schemas, variableToTableMapping)

  return { tables, enums, schemas, variableToTableMapping }
}

/**
 * Visit and traverse the file AST
 */
const visitFile = (
  file: File,
  tables: Record<string, DrizzleTableDefinition>,
  enums: Record<string, DrizzleEnumDefinition>,
  schemas: Record<string, DrizzleSchemaDefinition>,
  variableToTableMapping: Record<string, string>,
) => {
  for (const item of file.program.body) {
    if (item.type === 'VariableDeclaration') {
      for (const declarator of item.declarations) {
        visitVariableDeclarator(
          declarator,
          tables,
          enums,
          schemas,
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
          schemas,
          variableToTableMapping,
        )
      }
    }
  }
}

/**
 * Visit variable declarator to find mysqlTable, mysqlEnum, mysqlSchema, or relations calls
 */
const visitVariableDeclarator = (
  declarator: VariableDeclarator,
  tables: Record<string, DrizzleTableDefinition>,
  enums: Record<string, DrizzleEnumDefinition>,
  schemas: Record<string, DrizzleSchemaDefinition>,
  variableToTableMapping: Record<string, string>,
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
) => {
  if (!declarator.init || declarator.init.type !== 'CallExpression') return

  const callExpr = declarator.init

  if (isMysqlTableCall(callExpr)) {
    const table = parseMysqlTableCall(callExpr, enums)
    if (table && declarator.id.type === 'Identifier') {
      tables[table.name] = table
      // Map variable name to table name
      variableToTableMapping[declarator.id.name] = table.name
    }
  } else if (isSchemaTableCall(callExpr)) {
    const table = parseSchemaTableCall(callExpr, enums)
    if (table && declarator.id.type === 'Identifier') {
      tables[table.name] = table
      // Map variable name to table name
      variableToTableMapping[declarator.id.name] = table.name
    }
  } else if (
    declarator.init.type === 'CallExpression' &&
    declarator.init.callee.type === 'MemberExpression' &&
    declarator.init.callee.property.type === 'Identifier' &&
    declarator.init.callee.property.name === '$comment'
  ) {
    // Handle table comments: mysqlTable(...).comment(...)
    const table = parseMysqlTableWithComment(declarator.init, enums)
    if (table && declarator.id.type === 'Identifier') {
      tables[table.name] = table
      // Map variable name to table name
      variableToTableMapping[declarator.id.name] = table.name
    }
  } else if (
    callExpr.callee.type === 'Identifier' &&
    callExpr.callee.name === 'mysqlEnum'
  ) {
    const enumDef = parseMysqlEnumCall(callExpr)
    if (enumDef && declarator.id.type === 'Identifier') {
      enums[declarator.id.name] = enumDef
    }
  } else if (isMysqlSchemaCall(callExpr)) {
    const schemaDef = parseMysqlSchemaCall(callExpr)
    if (schemaDef && declarator.id.type === 'Identifier') {
      schemas[declarator.id.name] = schemaDef
    }
  }
}

/**
 * Main processor function for Drizzle MySQL schemas
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
          `Error parsing Drizzle MySQL schema: ${error instanceof Error ? error.message : String(error)}`,
        ),
      ],
    })
  }
}

export const processor: Processor = parseDrizzleSchemaString
