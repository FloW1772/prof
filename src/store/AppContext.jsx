import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [sessionsRefreshToken, setSessionsRefreshToken] = useState(0)

  const notifySessionsChanged = useCallback(() => {
    setSessionsRefreshToken((previous) => previous + 1)
  }, [])

  const value = useMemo(
    () => ({
      selectedSubject,
      setSelectedSubject,
      sessionsRefreshToken,
      notifySessionsChanged,
    }),
    [notifySessionsChanged, selectedSubject, sessionsRefreshToken]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export function useAppContext() {
  const context = useContext(AppContext)

  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider.')
  }

  return context
}
