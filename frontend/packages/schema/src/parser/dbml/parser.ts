import { Parser } from '@dbml/core'
import type {
  Columns,
  Constraints,
  Enums,
  ForeignKeyConstraintReferenceOption,
  Indexes,
  Tables,
} from '../../schema/index.js'
import { aColumn, anEnum, anIndex, aTable } from '../../schema/index.js'
import type { Processor, ProcessResult } from '../types.js'

type DbmlField = {
  name: string
  type: {
    type_name: string
    args?: string
    schemaName?: string
  }
  unique: boolean
  pk: boolean
  not_null: boolean
  note: string
  dbdefault: {
    type: string
    value: string | number | boolean
  } | null
  increment: boolean
}

type DbmlIndexColumn = {
  type: string
  value: string
}

type DbmlIndex = {
  columns: DbmlIndexColumn[]
  name: string
  type: string
  unique: boolean
  pk: string
  note: string
}

type DbmlTable = {
  name: string
  alias: string
  note: string
  fields: DbmlField[]
  indexes: DbmlIndex[]
}

type DbmlEnumValue = {
  name: string
  note: string
}

type DbmlEnum = {
  name: string
  note: string
  values: DbmlEnumValue[]
}

type DbmlEndpoint = {
  schemaName: string
  tableName: string
  fieldNames: string[]
  relation: string
}

type DbmlRef = {
  name: string
  onDelete: string | null
  onUpdate: string | null
  endpoints: DbmlEndpoint[]
}

type DbmlSchema = {
  name: string
  tables: DbmlTable[]
  enums: DbmlEnum[]
  refs: DbmlRef[]
}

type DbmlExport = {
  schemas: DbmlSchema[]
}

function normalizeConstraintAction(
  action: string | null,
): ForeignKeyConstraintReferenceOption {
  if (!action) {
    return 'NO_ACTION'
  }

  const normalizedAction = action.toLowerCase().replace(/\s+/g, '_')

  switch (normalizedAction) {
    case 'cascade':
      return 'CASCADE'
    case 'restrict':
      return 'RESTRICT'
    case 'set_null':
    case 'set null':
      return 'SET_NULL'
    case 'set_default':
    case 'set default':
      return 'SET_DEFAULT'
    default:
      return 'NO_ACTION'
  }
}

function extractDefaultValue(
  dbdefault: DbmlField['dbdefault'],
): Columns[string]['default'] {
  if (dbdefault === null || dbdefault === undefined) {
    return null
  }

  const { value } = dbdefault

  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    if (!Number.isNaN(Number(value))) {
      return Number(value)
    }

    if (value.toLowerCase() === 'true') {
      return true
    }
    if (value.toLowerCase() === 'false') {
      return false
    }

    return value
  }

  return null
}

function getColumnType(type: DbmlField['type']): string {
  if (!type) {
    return 'unknown'
  }

  const typeName = type.type_name || 'unknown'

  if (type.args && !typeName.includes('(')) {
    return `${typeName}(${type.args})`
  }

  return typeName
}

function processColumns(dbmlFields: DbmlField[]): Columns {
  const columns: Columns = {}

  for (const field of dbmlFields) {
    const defaultValue = extractDefaultValue(field.dbdefault)

    columns[field.name] = aColumn({
      name: field.name,
      type: getColumnType(field.type),
      notNull: field.not_null === true || field.pk === true,
      default: defaultValue,
      comment: field.note || null,
    })
  }

  return columns
}

function processIndexes(dbmlIndexes: DbmlIndex[]): Indexes {
  const indexes: Indexes = {}

  for (const dbmlIndex of dbmlIndexes) {
    if (dbmlIndex.pk) {
      continue
    }

    const indexName =
      dbmlIndex.name || `idx_${dbmlIndex.columns.map((c) => c.value).join('_')}`

    const columnNames = dbmlIndex.columns
      .filter((col) => col.type === 'column')
      .map((col) => col.value)

    indexes[indexName] = anIndex({
      name: indexName,
      columns: columnNames,
      unique: dbmlIndex.unique || false,
      type: dbmlIndex.type || '',
    })
  }

  return indexes
}

function processPrimaryKeyConstraint(
  tableName: string,
  dbmlFields: DbmlField[],
  dbmlIndexes: DbmlIndex[],
): Constraints {
  const constraints: Constraints = {}

  const pkFields = dbmlFields.filter((f) => f.pk).map((f) => f.name)

  const pkIndex = dbmlIndexes.find((idx) => idx.pk)
  if (pkIndex) {
    const pkColumns = pkIndex.columns
      .filter((col) => col.type === 'column')
      .map((col) => col.value)
    pkFields.push(...pkColumns.filter((col) => !pkFields.includes(col)))
  }

  if (pkFields.length > 0) {
    const pkName = `${tableName}_pkey`
    constraints[pkName] = {
      type: 'PRIMARY KEY',
      name: pkName,
      columnNames: pkFields,
    }
  }

  return constraints
}

function processUniqueConstraints(
  tableName: string,
  dbmlFields: DbmlField[],
  dbmlIndexes: DbmlIndex[],
): Constraints {
  const constraints: Constraints = {}

  for (const field of dbmlFields) {
    if (field.unique && !field.pk) {
      const constraintName = `${tableName}_${field.name}_unique`
      constraints[constraintName] = {
        type: 'UNIQUE',
        name: constraintName,
        columnNames: [field.name],
      }
    }
  }

  for (const dbmlIndex of dbmlIndexes) {
    if (dbmlIndex.unique && !dbmlIndex.pk) {
      const columnNames = dbmlIndex.columns
        .filter((col) => col.type === 'column')
        .map((col) => col.value)

      const constraintName =
        dbmlIndex.name || `${tableName}_${columnNames.join('_')}_unique`

      if (!constraints[constraintName]) {
        constraints[constraintName] = {
          type: 'UNIQUE',
          name: constraintName,
          columnNames,
        }
      }
    }
  }

  return constraints
}

function processTable(dbmlTable: DbmlTable): [string, Tables[string]] {
  const columns = processColumns(dbmlTable.fields)
  const indexes = processIndexes(dbmlTable.indexes)

  const pkConstraints = processPrimaryKeyConstraint(
    dbmlTable.name,
    dbmlTable.fields,
    dbmlTable.indexes,
  )

  const uniqueConstraints = processUniqueConstraints(
    dbmlTable.name,
    dbmlTable.fields,
    dbmlTable.indexes,
  )

  const constraints: Constraints = {
    ...pkConstraints,
    ...uniqueConstraints,
  }

  return [
    dbmlTable.name,
    aTable({
      name: dbmlTable.name,
      columns,
      indexes,
      constraints,
      comment: dbmlTable.note || null,
    }),
  ]
}

function isSourceRelation(relation: string): boolean {
  return relation === '>' || relation === '*'
}

function isTargetRelation(relation: string): boolean {
  return relation === '<' || relation === '1'
}

function determineEndpoints(
  endpoint1: DbmlEndpoint,
  endpoint2: DbmlEndpoint,
): { source: DbmlEndpoint; target: DbmlEndpoint } {
  if (isSourceRelation(endpoint1.relation)) {
    return { source: endpoint1, target: endpoint2 }
  }
  if (isSourceRelation(endpoint2.relation)) {
    return { source: endpoint2, target: endpoint1 }
  }
  if (isTargetRelation(endpoint1.relation)) {
    return { source: endpoint2, target: endpoint1 }
  }
  if (isTargetRelation(endpoint2.relation)) {
    return { source: endpoint1, target: endpoint2 }
  }
  return { source: endpoint1, target: endpoint2 }
}

function processForeignKeyConstraints(refs: DbmlRef[], tables: Tables): void {
  for (const ref of refs) {
    if (ref.endpoints.length !== 2) {
      continue
    }

    const endpoint1 = ref.endpoints[0]
    const endpoint2 = ref.endpoints[1]

    if (!endpoint1 || !endpoint2) {
      continue
    }

    const { source: sourceEndpoint, target: targetEndpoint } =
      determineEndpoints(endpoint1, endpoint2)

    const sourceTable = tables[sourceEndpoint.tableName]
    if (!sourceTable) {
      continue
    }

    const constraintName =
      ref.name ||
      `fk_${sourceEndpoint.tableName}_${sourceEndpoint.fieldNames.join('_')}_${targetEndpoint.tableName}`

    sourceTable.constraints[constraintName] = {
      type: 'FOREIGN KEY',
      name: constraintName,
      columnNames: sourceEndpoint.fieldNames,
      targetTableName: targetEndpoint.tableName,
      targetColumnNames: targetEndpoint.fieldNames,
      updateConstraint: normalizeConstraintAction(ref.onUpdate),
      deleteConstraint: normalizeConstraintAction(ref.onDelete),
    }
  }
}

function processEnums(dbmlEnums: DbmlEnum[]): Enums {
  const enums: Enums = {}

  for (const dbmlEnum of dbmlEnums) {
    const enumName = dbmlEnum.name.includes('.')
      ? dbmlEnum.name.substring(dbmlEnum.name.lastIndexOf('.') + 1)
      : dbmlEnum.name

    enums[enumName] = anEnum({
      name: enumName,
      values: dbmlEnum.values.map((v) => v.name),
      comment: dbmlEnum.note || null,
    })
  }

  return enums
}

async function parseDbmlSchema(schemaString: string): Promise<ProcessResult> {
  const errors: Error[] = []

  try {
    const parser = new Parser()
    const database = parser.parse(schemaString, 'dbml')

    const exported: DbmlExport = database.export()

    const tables: Tables = {}
    const enums: Enums = {}
    const allRefs: DbmlRef[] = []

    for (const schema of exported.schemas) {
      for (const dbmlTable of schema.tables) {
        const [tableName, tableObj] = processTable(dbmlTable)
        tables[tableName] = tableObj
      }

      const schemaEnums = processEnums(schema.enums)
      Object.assign(enums, schemaEnums)

      allRefs.push(...schema.refs)
    }

    processForeignKeyConstraints(allRefs, tables)

    return {
      value: {
        tables,
        enums,
        extensions: {},
      },
      errors,
    }
  } catch (error) {
    return {
      value: {
        tables: {},
        enums: {},
        extensions: {},
      },
      errors: [
        error instanceof Error
          ? error
          : new Error(`Failed to parse DBML: ${String(error)}`),
      ],
    }
  }
}

export const processor: Processor = (str) => parseDbmlSchema(str)
