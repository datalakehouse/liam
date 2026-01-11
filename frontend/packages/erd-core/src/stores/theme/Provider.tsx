'use client'

import { type FC, type PropsWithChildren, useMemo } from 'react'
import { type ColorMode, ThemeContext } from './context'

type Props = PropsWithChildren<{
  colorMode?: ColorMode
}>

export const ThemeProvider: FC<Props> = ({
  children,
  colorMode = 'system',
}) => {
  const value = useMemo(
    () => ({
      colorMode,
    }),
    [colorMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
