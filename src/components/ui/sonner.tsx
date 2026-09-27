"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-brand-primary" />
        ),
        info: (
          <InfoIcon className="size-4 text-brand-text-accent" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-red-600" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-brand-primary" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--brand-border-primary)",
          "--success-bg": "var(--brand-bg-highlight)",
          "--success-border": "var(--brand-border-primary)",
          "--success-text": "var(--brand-text-primary)",
          "--error-bg": "#fef2f2",
          "--error-border": "#fecaca",
          "--error-text": "#991b1b",
          "--warning-bg": "#fffbeb",
          "--warning-border": "#fde68a",
          "--warning-text": "#92400e",
          "--info-bg": "var(--brand-bg-highlight)",
          "--info-border": "var(--brand-border-primary)",
          "--info-text": "var(--brand-text-primary)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          title: "cn-toast-title",
          description: "cn-toast-description",
          closeButton: "cn-toast-close",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
