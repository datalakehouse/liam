import { NuqsAdapter } from 'nuqs/adapters/react'
import type { FC, PropsWithChildren } from 'react'
import type { ShowMode } from '../schemas'
import {
  type ColorMode,
  SchemaProvider,
  type SchemaProviderValue,
  ThemeProvider,
} from '../stores'
import { UserEditingProvider } from '../stores/userEditing'

type Props = {
  schema: SchemaProviderValue
  showDiff?: boolean
  defaultShowMode?: ShowMode
  colorMode?: ColorMode
}

export const ErdRendererProvider: FC<PropsWithChildren<Props>> = ({
  schema,
  showDiff,
  defaultShowMode,
  colorMode = 'system',
  children,
}) => {
  return (
    <NuqsAdapter>
      <ThemeProvider colorMode={colorMode}>
        <UserEditingProvider
          showDiff={showDiff}
          defaultShowMode={defaultShowMode}
        >
          <SchemaProvider {...schema}>{children}</SchemaProvider>
        </UserEditingProvider>
      </ThemeProvider>
    </NuqsAdapter>
  )
}
