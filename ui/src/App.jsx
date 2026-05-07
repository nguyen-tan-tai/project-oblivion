import { useEffect, useState } from 'react'
import CreateMessagePage from './pages/CreateMessagePage'
import DecryptPage from './pages/DecryptPage'
import './App.css'

function getRouteState() {
  return {
    pathname: window.location.pathname,
    hash: window.location.hash,
  }
}

function getMessageId(pathname) {
  const match = pathname.match(/^\/message\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : ''
}

function App() {
  const [routeState, setRouteState] = useState(() => getRouteState())

  useEffect(() => {
    function syncRouteState() {
      setRouteState(getRouteState())
    }

    window.addEventListener('popstate', syncRouteState)
    window.addEventListener('hashchange', syncRouteState)

    return () => {
      window.removeEventListener('popstate', syncRouteState)
      window.removeEventListener('hashchange', syncRouteState)
    }
  }, [])

  const messageId = getMessageId(routeState.pathname)

  if (messageId) {
    return <DecryptPage messageId={messageId} hashFragment={routeState.hash} />
  }

  return <CreateMessagePage />
}

export default App
