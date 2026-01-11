import { createContext } from 'react'

export type ColorMode = 'dark' | 'light' | 'system'

export type ThemeContextValue = {
  colorMode: ColorMode
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
