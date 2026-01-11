import type { Column, Constraints } from '@liam-hq/schema'
import { DiamondFillIcon, KeyRound } from '@liam-hq/ui'
import clsx from 'clsx'
import { type FC, useMemo } from 'react'
import {
  useSchemaOrThrow,
  useUserEditingOrThrow,
} from '../../../../../../../../../stores'
import { useDiffStyle } from '../../../../../../../../diff/hooks/useDiffStyle'
import { getTableColumnElementId } from '../../../../../../../utils/url/getTableColumnElementId'
import { DetailItem } from '../../CollapsibleHeader'
import styles from './ColumnsItemCompact.module.css'
import { getChangeStatus } from './getChangeStatus'

type Props = {
  tableId: string
  column: Column
  constraints: Constraints
  onClick?: () => void
}

export const ColumnsItemCompact: FC<Props> = ({
  tableId,
  column,
  constraints,
  onClick,
}) => {
  const elementId = getTableColumnElementId(tableId, column.name)

  const { operations } = useSchemaOrThrow()
  const { showDiff, focusedElementId } = useUserEditingOrThrow()

  const changeStatus = useMemo(() => {
    if (!showDiff) return undefined
    return getChangeStatus({
      tableId,
      operations: operations ?? [],
      columnId: column.name,
    })
  }, [showDiff, tableId, operations, column.name])

  const diffStyle = useDiffStyle(showDiff, changeStatus)

  const isPrimaryKey = useMemo(
    () =>
      Object.values(constraints).some(
        (constraint) =>
          constraint.type === 'PRIMARY KEY' &&
          constraint.columnNames.includes(column.name),
      ),
    [constraints, column.name],
  )

  const isFocused = focusedElementId === elementId

  return (
    <DetailItem
      id={elementId}
      className={clsx(diffStyle, styles.compactItem)}
      isFocused={isFocused}
      onClick={onClick}
    >
      <div className={styles.compactRow}>
        <span className={styles.columnName}>{column.name}</span>
        <span className={styles.columnType}>({column.type})</span>
        {isPrimaryKey && (
          <KeyRound
            className={styles.primaryKeyIcon}
            aria-label="Primary Key"
          />
        )}
        {column.notNull && (
          <DiamondFillIcon
            className={styles.notNullIcon}
            aria-label="Not Null"
          />
        )}
      </div>
    </DetailItem>
  )
}
