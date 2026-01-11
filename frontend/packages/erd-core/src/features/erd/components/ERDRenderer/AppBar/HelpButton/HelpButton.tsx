import {
  BookText,
  CircleHelp,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  MessagesSquare,
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import type { Ref } from 'react'
import type { HelpMenuItem } from '../types'
import styles from './HelpButton.module.css'
// import { ReleaseVersion } from './ReleaseVersion'

type Props = {
  ref?: Ref<HTMLButtonElement>
  items?: HelpMenuItem[]
}

const handleSelect = (url: string) => () => {
  window.open(url, '_blank', 'noreferrer')
}

const defaultItems: HelpMenuItem[] = [
  {
    label: 'Documentation',
    url: 'https://liambx.com/docs',
    icon: <BookText />,
  },
  {
    label: 'Community Forum',
    url: 'https://github.com/liam-hq/liam/discussions',
    icon: <MessagesSquare />,
  },
]

export const HelpButton = ({ ref, items }: Props) => {
  const menuItems = items ?? defaultItems

  return (
    <DropdownMenuRoot>
      <TooltipProvider>
        <TooltipRoot>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button ref={ref} type="button" className={styles.iconWrapper}>
                <CircleHelp className={styles.icon} />
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent sideOffset={4}>Help</TooltipContent>
        </TooltipRoot>
      </TooltipProvider>

      <DropdownMenuPortal>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className={styles.menuContent}
        >
          {/* <ReleaseVersion /> */}
          {menuItems.map((item) => (
            <DropdownMenuItem
              key={item.url}
              size="sm"
              leftIcon={item.icon}
              onSelect={handleSelect(item.url)}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  )
}

HelpButton.displayName = 'HelpButton'
