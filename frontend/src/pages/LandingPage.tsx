import { useEffect } from 'react'

export default function LandingPage() {
  useEffect(() => {
    window.location.replace('/index-landing.html')
  }, [])

  return null
}
