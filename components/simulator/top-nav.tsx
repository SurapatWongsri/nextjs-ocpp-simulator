'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ArrowSquareOut, MoonIcon } from '@phosphor-icons/react'
import { Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import Image from 'next/image'

export function TopNav() {
  const { theme, setTheme } = useTheme()

  return (
    <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-400 mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Image
            src="https://onecharge-bucket-dev.s3.ap-southeast-2.amazonaws.com/uploads/auth/20260120125625-logo-v2.png"
            alt="OneCharge Logo"
            width={150}
            height={150}
            className="object-contain"
            priority
          />
          <Separator orientation="vertical" className="h-auto" />
          <div className="flex items-baseline gap-2">
            <h1 className=" font-bold tracking-wide text-foreground">
              OCPP-SIMULATOR
            </h1>
            <Badge variant="secondary" className=" text-[10px] ">
              v1.6
            </Badge>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="hidden sm:flex text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <a
                    href="https://api-ocpp.bs-group.tech/docs/api-ocpp"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowSquareOut weight="fill" className="size-3.5" />
                    API Docs
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>OCPP Swagger API Docs</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator
            orientation="vertical"
            className="h-auto hidden sm:block"
          />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="Toggle theme"
                >
                  <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <MoonIcon
                    weight="fill"
                    className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </nav>
  )
}
