import type { Table } from '@liam-hq/schema'
import { Rows3 as Rows3Icon } from '@liam-hq/ui'
import type { FC } from 'react'
import { getTableColumnElementId } from '../../../../../../utils/url/getTableColumnElementId'
import { CollapsibleHeader } from '../CollapsibleHeader'
import { ColumnsItem, ColumnsItemCompact } from './ColumnsItem'

type Props = {
  table: Table
  compactMode?: boolean
  onColumnClick?: (columnName: string) => void
}

export const Columns: FC<Props> = ({
  table,
  compactMode = true,
  onColumnClick,
}) => {
  const handleColumnClick = (columnName: string) => {
    const elementId = getTableColumnElementId(table.name, columnName)
    // Set the URL hash to focus on the element (this triggers focusedElementId update via hashchange event)
    window.location.hash = elementId
    onColumnClick?.(columnName)
  }

  const contentMaxHeight = compactMode
    ? Object.keys(table.columns).length * 40
    : Object.keys(table.columns).length * 300

  return (
    <CollapsibleHeader
      title="Columns"
      icon={<Rows3Icon width={12} />}
      isContentVisible={true}
      stickyTopHeight={0}
      contentMaxHeight={contentMaxHeight}
    >
      {Object.entries(table.columns).map(([key, column]) =>
        compactMode ? (
          <ColumnsItemCompact
            key={key}
            tableId={table.name}
            column={column}
            constraints={table.constraints}
            onClick={() => handleColumnClick(column.name)}
          />
        ) : (
          <ColumnsItem
            key={key}
            tableId={table.name}
            column={column}
            constraints={table.constraints}
          />
        ),
      )}
    </CollapsibleHeader>
  )
}
