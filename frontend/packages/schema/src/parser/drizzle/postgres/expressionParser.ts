/**
 * Expression parsing utilities for Drizzle ORM schema parsing
 */

import type { Expression, ObjectExpression } from '@babel/types'
import {
  getIdentifierName,
  getStringValue,
  isArrayExpression,
  isIdentifier,
  isMemberExpression,
} from './astUtils.js'
import { getPropertyValue, hasProperty, isObject } from './types.js'

/**
 * Parse default value from expression (Babel uses 'name' instead of 'value' for identifiers)
 */
export const parseDefaultValue = (expr: Expression): unknown => {
  switch (expr.type) {
    case 'StringLiteral':
      return expr.value
    case 'NumericLiteral':
      return expr.value
    case 'BooleanLiteral':
      return expr.value
    case 'NullLiteral':
      return null
    case 'Identifier':
      // Handle special cases like defaultRandom, defaultNow
      switch (expr.name) {
        case 'defaultRandom':
          return 'defaultRandom'
        case 'defaultNow':
          return 'now()'
        default:
          return expr.name
      }
    case 'CallExpression':
      // Handle function calls like defaultNow()
      if (expr.callee.type === 'Identifier') {
        switch (expr.callee.name) {
          case 'defaultNow':
            return 'now()'
          case 'defaultRandom':
            return 'defaultRandom'
          default:
            return expr.callee.name
        }
      }
      return undefined
    default:
      return undefined
  }
}

/**
 * Parse object expression to plain object (Babel uses 'ObjectProperty' instead of 'KeyValueProperty')
 */
export const parseObjectExpression = (
  obj: ObjectExpression,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {}

  for (const prop of obj.properties) {
    if (prop.type === 'ObjectProperty') {
      const key =
        prop.key.type === 'Identifier'
          ? getIdentifierName(prop.key)
          : prop.key.type === 'StringLiteral'
            ? getStringValue(prop.key)
            : null
      if (key) {
        result[key] = parsePropertyValue(prop.value)
      }
    }
  }

  return result
}

/**
 * Type guard for expression-like objects
 */
const isExpressionLike = (value: unknown): value is Expression => {
  return (
    isObject(value) &&
    hasProperty(value, 'type') &&
    typeof getPropertyValue(value, 'type') === 'string'
  )
}

/**
 * Safe parser for unknown values as expressions
 */
const parseUnknownValue = (value: unknown): unknown => {
  if (isExpressionLike(value)) {
    return parseDefaultValue(value)
  }
  return value
}

/**
 * Parse property value (including arrays)
 */
const parsePropertyValue = (expr: unknown): unknown => {
  if (isArrayExpression(expr)) {
    const result: unknown[] = []
    for (const element of expr.elements) {
      if (!element) continue
      // In Babel, array elements are directly expressions (not wrapped)
      // Filter out SpreadElement types
      if (
        typeof element === 'object' &&
        'type' in element &&
        element.type === 'SpreadElement'
      )
        continue

      if (
        isMemberExpression(element) &&
        isIdentifier(element.object) &&
        isIdentifier(element.property)
      ) {
        // For table.columnName references, use the property name
        result.push(element.property.name)
      } else {
        const parsed = parseUnknownValue(element)
        result.push(parsed)
      }
    }
    return result
  }
  return parseUnknownValue(expr)
}
