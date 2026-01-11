import {
  LiamLogoMark,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@liam-hq/ui'
import type { FC } from 'react'
import { CommandPaletteTriggerButton } from '../CommandPalette'
import styles from './AppBar.module.css'
import { CopyLinkButton } from './CopyLinkButton'
import { ExportDropdown } from './ExportDropdown'
import { GithubButton } from './GithubButton'
import { HelpButton } from './HelpButton'
import { MenuButton } from './MenuButton'
import { ReleaseNoteButton } from './ReleaseNoteButton'
import type { AppBarConfig } from './types'

type Props = {
  config?: AppBarConfig
}

export const AppBar: FC<Props> = ({ config }) => {
  if (config?.show === false) {
    return null
  }

  const logoUrl = config?.logo?.url ?? 'https://liambx.com'
  const logoImgUrl = config?.logo?.imgUrl ?? ''
  const logoImgHeight = config?.logo?.imgHeight ?? ''
  const logoText = config?.logo?.text ?? 'Liam ERD'
  const showLogoText = config?.logo?.showText !== false
  const showSearch = config?.search?.show !== false
  const showGithub = config?.github?.show !== false
  const githubUrl = config?.github?.url ?? 'https://github.com/liam-hq/liam'
  const showAnnouncements = config?.announcements?.show !== false
  const announcementsUrl =
    config?.announcements?.url ?? 'https://github.com/liam-hq/liam/releases'
  const showHelp = config?.help?.show !== false
  const helpItems = config?.help?.items
  const showExport = config?.export?.show !== false
  const showCopyLink = config?.copyLink?.show !== false
  const copyLinkValue = config?.copyLink?.value

  return (
    <header className={styles.wrapper}>
      <div className={styles.menuButtonWrapper}>
        <MenuButton />
      </div>
      <div className={styles.logoWrapper}>
        <TooltipProvider>
          <TooltipRoot>
            <TooltipTrigger asChild>
              <a
                href={logoUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.iconWrapper}
              >
                {config?.logo?.imgUrl ? (
                  <img src={logoImgUrl} alt="logo" height={logoImgHeight} />
                ) : (
                  <LiamLogoMark className={styles.logo} />
                )}
              </a>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent sideOffset={4}>Home</TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </TooltipProvider>
      </div>

      {showLogoText && <h1 className={styles.title}>{logoText}</h1>}

      <div className={styles.rightSide}>
        <div className={styles.iconButtonGroup}>
          {showSearch && <CommandPaletteTriggerButton />}
          {showGithub && <GithubButton url={githubUrl} />}
          {showAnnouncements && <ReleaseNoteButton url={announcementsUrl} />}
          {showHelp && (
            <HelpButton {...(helpItems ? { items: helpItems } : {})} />
          )}
        </div>
        {showExport && <ExportDropdown />}
        {showCopyLink && (
          <CopyLinkButton
            {...(copyLinkValue ? { value: copyLinkValue } : {})}
          />
        )}
      </div>
    </header>
  )
}
