"use client"

import EnhancedInstallPrompt from "./enhanced-install-prompt"
import InstallSuccessCelebration from "./install-success-celebration"

export default function PWAInstallPrompt() {
  return (
    <>
      <EnhancedInstallPrompt />
      <InstallSuccessCelebration />
    </>
  )
}
