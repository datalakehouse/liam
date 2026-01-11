import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from './context'

export const useColorMode = (): ThemeContextValue['colorMode'] => {
  const theme = useContext(ThemeContext)
  if (!theme) {
    return 'system'
  }
  return theme.colorMode
}
