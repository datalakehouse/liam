import {
  Megaphone,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import type { FC } from 'react'
import styles from './ReleaseNoteButton.module.css'

type Props = {
  url?: string
}

export const ReleaseNoteButton: FC<Props> = ({
  url = 'https://github.com/liam-hq/liam/releases',
}) => {
  return (
    <TooltipProvider>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className={styles.iconWrapper}
          >
            <Megaphone className={styles.icon} />
          </a>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent sideOffset={4}>Announcements</TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </TooltipProvider>
  )
}
