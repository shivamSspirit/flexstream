"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/70 backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "duration-200",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // ═══════════════════════════════════════════════════════════════════════
        // BASE STYLES — Shared across all breakpoints
        // ═══════════════════════════════════════════════════════════════════════
        "fixed z-50 w-full bg-background shadow-2xl outline-none",
        "overflow-hidden overflow-y-auto",

        // ═══════════════════════════════════════════════════════════════════════
        // MOBILE FIRST (< 640px): Bottom sheet anchored to bottom
        // Uses inset for positioning, no transforms needed
        // ═══════════════════════════════════════════════════════════════════════
        "inset-x-0 bottom-0 top-auto",
        "max-h-[90dvh]",
        "rounded-t-[24px]",

        // Mobile animation - slide up from bottom
        "data-[state=open]:animate-slide-up-sheet",
        "data-[state=closed]:animate-slide-down-sheet",

        // ═══════════════════════════════════════════════════════════════════════
        // TABLET+ (>= 640px): Centered modal with fixed dimensions
        // Uses margin: auto trick for perfect centering without transforms
        // ═══════════════════════════════════════════════════════════════════════
        "sm:inset-0 sm:m-auto",
        "sm:w-[400px] sm:max-w-[calc(100vw-48px)]",
        "sm:h-fit sm:max-h-[85vh]",
        "sm:rounded-2xl",

        // Tablet/Desktop animation - fade + scale (no transform conflicts)
        "sm:data-[state=open]:animate-modal-enter",
        "sm:data-[state=closed]:animate-modal-exit",

        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={cn(
          "absolute z-20 rounded-full transition-all duration-200",
          "text-white/30 hover:text-white/60 hover:bg-white/10",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
          // Mobile: smaller, tighter position
          "right-3 top-3 p-1.5",
          // Tablet+: slightly larger
          "sm:right-4 sm:top-4 sm:p-2"
        )}
      >
        <X className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
