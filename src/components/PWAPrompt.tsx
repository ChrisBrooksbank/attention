import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import './PWAPrompt.css'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000)
      }
    },
  })

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setShowInstallBanner(false)
    }
    setInstallPrompt(null)
  }

  const dismissInstall = () => setShowInstallBanner(false)
  const dismissUpdate = () => setNeedRefresh(false)

  if (!showInstallBanner && !needRefresh) return null

  return (
    <div className="pwa-prompt" role="alert">
      {needRefresh ? (
        <>
          <span className="pwa-prompt__text">A new version is available.</span>
          <div className="pwa-prompt__actions">
            <button className="pwa-prompt__btn pwa-prompt__btn--primary" onClick={() => updateServiceWorker(true)}>
              Update
            </button>
            <button className="pwa-prompt__btn" onClick={dismissUpdate}>
              Later
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="pwa-prompt__text">Install Attention Trainer for offline use?</span>
          <div className="pwa-prompt__actions">
            <button className="pwa-prompt__btn pwa-prompt__btn--primary" onClick={handleInstall}>
              Install
            </button>
            <button className="pwa-prompt__btn" onClick={dismissInstall}>
              Not now
            </button>
          </div>
        </>
      )}
    </div>
  )
}
