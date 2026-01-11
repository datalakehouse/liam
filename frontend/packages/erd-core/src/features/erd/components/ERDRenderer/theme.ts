export type ERDTheme = {
  colors?: {
    primary?: string
    primaryHover?: string
    relationshipLine?: string
    relationshipLineHighlight?: string
    primaryKeyIcon?: string
    notNullIcon?: string
    tableBackground?: string
    tableBorder?: string
    tableHeaderBackground?: string
    sidebarBackground?: string
    sidebarText?: string
    detailsPaneBackground?: string
  }
  typography?: {
    sidebarTableNameSize?: string
    sidebarColumnNameSize?: string
    detailsPaneHeadingSize?: string
    detailsPaneTextSize?: string
  }
}

const colorPropertyMap: Record<keyof NonNullable<ERDTheme['colors']>, string> =
  {
    primary: '--erd-primary-color',
    primaryHover: '--erd-primary-hover',
    relationshipLine: '--erd-relationship-line',
    relationshipLineHighlight: '--erd-relationship-line-highlight',
    primaryKeyIcon: '--erd-primary-key-icon',
    notNullIcon: '--erd-not-null-icon',
    tableBackground: '--erd-table-background',
    tableBorder: '--erd-table-border',
    tableHeaderBackground: '--erd-table-header-background',
    sidebarBackground: '--erd-sidebar-background',
    sidebarText: '--erd-sidebar-text',
    detailsPaneBackground: '--erd-details-pane-background',
  }

const typographyPropertyMap: Record<
  keyof NonNullable<ERDTheme['typography']>,
  string
> = {
  sidebarTableNameSize: '--erd-sidebar-table-name-size',
  sidebarColumnNameSize: '--erd-sidebar-column-name-size',
  detailsPaneHeadingSize: '--erd-details-pane-heading-size',
  detailsPaneTextSize: '--erd-details-pane-text-size',
}

const setPropertyIfDefined = (
  root: HTMLElement,
  cssProperty: string,
  value: string | undefined,
): void => {
  if (value) {
    root.style.setProperty(cssProperty, value)
  }
}

export const applyTheme = (theme: ERDTheme): void => {
  const root = document.documentElement
  const colors = theme.colors
  const typography = theme.typography

  if (colors) {
    setPropertyIfDefined(root, colorPropertyMap.primary, colors.primary)
    setPropertyIfDefined(
      root,
      colorPropertyMap.primaryHover,
      colors.primaryHover,
    )
    setPropertyIfDefined(
      root,
      colorPropertyMap.relationshipLine,
      colors.relationshipLine,
    )
    setPropertyIfDefined(
      root,
      colorPropertyMap.relationshipLineHighlight,
      colors.relationshipLineHighlight,
    )
    setPropertyIfDefined(
      root,
      colorPropertyMap.primaryKeyIcon,
      colors.primaryKeyIcon,
    )
    setPropertyIfDefined(root, colorPropertyMap.notNullIcon, colors.notNullIcon)
    setPropertyIfDefined(
      root,
      colorPropertyMap.tableBackground,
      colors.tableBackground,
    )
    setPropertyIfDefined(root, colorPropertyMap.tableBorder, colors.tableBorder)
    setPropertyIfDefined(
      root,
      colorPropertyMap.tableHeaderBackground,
      colors.tableHeaderBackground,
    )
    setPropertyIfDefined(
      root,
      colorPropertyMap.sidebarBackground,
      colors.sidebarBackground,
    )
    setPropertyIfDefined(root, colorPropertyMap.sidebarText, colors.sidebarText)
    setPropertyIfDefined(
      root,
      colorPropertyMap.detailsPaneBackground,
      colors.detailsPaneBackground,
    )
  }

  if (typography) {
    setPropertyIfDefined(
      root,
      typographyPropertyMap.sidebarTableNameSize,
      typography.sidebarTableNameSize,
    )
    setPropertyIfDefined(
      root,
      typographyPropertyMap.sidebarColumnNameSize,
      typography.sidebarColumnNameSize,
    )
    setPropertyIfDefined(
      root,
      typographyPropertyMap.detailsPaneHeadingSize,
      typography.detailsPaneHeadingSize,
    )
    setPropertyIfDefined(
      root,
      typographyPropertyMap.detailsPaneTextSize,
      typography.detailsPaneTextSize,
    )
  }
}

export const clearTheme = (): void => {
  const root = document.documentElement
  const properties = [
    '--erd-primary-color',
    '--erd-primary-hover',
    '--erd-relationship-line',
    '--erd-relationship-line-highlight',
    '--erd-primary-key-icon',
    '--erd-not-null-icon',
    '--erd-table-background',
    '--erd-table-border',
    '--erd-table-header-background',
    '--erd-sidebar-background',
    '--erd-sidebar-text',
    '--erd-details-pane-background',
    '--erd-sidebar-table-name-size',
    '--erd-sidebar-column-name-size',
    '--erd-details-pane-heading-size',
    '--erd-details-pane-text-size',
  ]

  for (const prop of properties) {
    root.style.removeProperty(prop)
  }
}
