import type { ReactNode } from 'react'

export type HelpMenuItem = {
  label: string
  url: string
  icon?: ReactNode
}

export type AppBarConfig = {
  logo?: {
    element?: ReactNode
    text?: string
    showText?: boolean
    url?: string
    imgUrl?: string
    imgHeight?: string
  }
  search?: {
    show?: boolean
  }
  github?: {
    show?: boolean
    url?: string
  }
  announcements?: {
    show?: boolean
    url?: string
  }
  help?: {
    show?: boolean
    items?: HelpMenuItem[]
  }
  export?: {
    show?: boolean
  }
  copyLink?: {
    show?: boolean
    value?: string
  }
  show?: boolean
}
