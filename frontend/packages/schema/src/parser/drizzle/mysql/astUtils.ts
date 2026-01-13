/**
 * AST manipulation utilities for Drizzle ORM MySQL schema parsing
 */

import type {
  ArgumentPlaceholder,
  CallExpression,
  Expression,
  JSXNamespacedName,
  ObjectExpression,
  SpreadElement,
  V8IntrinsicIdentifier,
} from '@babel/types'
import { getPropertyValue, hasProperty, isObject } from './types.js'

/**
 * Babel argument type (union of possible argument types)
 */
export type BabelArgument =
  | Expression
  | SpreadElement
  | ArgumentPlaceholder
  | JSXNamespacedName

/**
 * Type guard to check if argument is an Expression (not SpreadElement, ArgumentPlaceholder, or JSXNamespacedName)
 */
const isExpression = (arg: BabelArgument): arg is Expression => {
  return (
    arg.type !== 'SpreadElement' &&
    arg.type !== 'ArgumentPlaceholder' &&
    arg.type !== 'JSXNamespacedName'
  )
}

/**
 * Extract expression from Babel argument (Babel doesn't wrap arguments like SWC)
 */
export const getArgumentExpression = (
  arg: BabelArgument | null | undefined,
): Expression | null => {
  if (!arg) return null
  // In Babel, arguments are directly expressions (not wrapped)
  // Filter out non-expression types using type guard
  if (isExpression(arg)) {
    return arg
  }
  return null
}

/**
 * Type guard for string literal expressions
 */
export const isStringLiteral = (
  expr: unknown,
): expr is { type: 'StringLiteral'; value: string } => {
  return (
    isObject(expr) &&
    getPropertyValue(expr, 'type') === 'StringLiteral' &&
    hasProperty(expr, 'value') &&
    typeof getPropertyValue(expr, 'value') === 'string'
  )
}

/**
 * Type guard for object expressions
 */
export const isObjectExpression = (expr: unknown): expr is ObjectExpression => {
  return isObject(expr) && getPropertyValue(expr, 'type') === 'ObjectExpression'
}

/**
 * Type guard for array expressions
 */
export const isArrayExpression = (
  expr: unknown,
): expr is { type: 'ArrayExpression'; elements: unknown[] } => {
  return (
    isObject(expr) &&
    getPropertyValue(expr, 'type') === 'ArrayExpression' &&
    hasProperty(expr, 'elements') &&
    Array.isArray(getPropertyValue(expr, 'elements'))
  )
}

/**
 * Type guard for identifier nodes (Babel uses 'name' instead of 'value')
 */
export const isIdentifier = (
  node: unknown,
): node is { type: 'Identifier'; name: string } => {
  return (
    isObject(node) &&
    getPropertyValue(node, 'type') === 'Identifier' &&
    hasProperty(node, 'name') &&
    typeof getPropertyValue(node, 'name') === 'string'
  )
}

/**
 * Check if a node is an identifier with a specific name
 */
const isIdentifierWithName = (
  node: Expression | V8IntrinsicIdentifier,
  name: string,
): boolean => {
  return isIdentifier(node) && node.name === name
}

/**
 * Type guard for member expressions (Babel uses 'name' instead of 'value' for identifiers)
 */
export const isMemberExpression = (
  node: unknown,
): node is {
  type: 'MemberExpression'
  object: { type: string; name?: string }
  property: { type: string; name?: string }
} => {
  return (
    isObject(node) &&
    getPropertyValue(node, 'type') === 'MemberExpression' &&
    hasProperty(node, 'object') &&
    hasProperty(node, 'property') &&
    typeof getPropertyValue(node, 'object') === 'object' &&
    typeof getPropertyValue(node, 'property') === 'object'
  )
}

/**
 * Check if a call expression is a mysqlTable call
 */
export const isMysqlTableCall = (callExpr: CallExpression): boolean => {
  return isIdentifierWithName(callExpr.callee, 'mysqlTable')
}

/**
 * Check if a call expression is a mysqlSchema call
 */
export const isMysqlSchemaCall = (callExpr: CallExpression): boolean => {
  return isIdentifierWithName(callExpr.callee, 'mysqlSchema')
}

/**
 * Check if a call expression is a schema.table() call
 */
export const isSchemaTableCall = (callExpr: CallExpression): boolean => {
  return (
    isMemberExpression(callExpr.callee) &&
    isIdentifier(callExpr.callee.property) &&
    callExpr.callee.property.name === 'table'
  )
}

/**
 * Extract string value from a string literal
 */
export const getStringValue = (node: Expression): string | null => {
  if (node.type === 'StringLiteral') {
    return node.value
  }
  return null
}

/**
 * Extract identifier name (Babel uses 'name' instead of 'value')
 */
export const getIdentifierName = (node: Expression): string | null => {
  if (isIdentifier(node)) {
    return node.name
  }
  return null
}

/**
 * Parse method call chain from a call expression
 */
export const parseMethodChain = (
  expr: Expression,
): Array<{ name: string; args: BabelArgument[] }> => {
  const methods: Array<{ name: string; args: BabelArgument[] }> = []
  let current = expr

  while (current.type === 'CallExpression') {
    if (
      current.callee.type === 'MemberExpression' &&
      current.callee.property.type === 'Identifier'
    ) {
      methods.unshift({
        name: current.callee.property.name,
        args: current.arguments,
      })
      current = current.callee.object
    } else {
      break
    }
  }

  return methods
}
