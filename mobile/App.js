// App.js
import AppNavigator from './src/navigation/AppNavigator'
import { usePushToken } from './src/hooks/usePushToken'
import { useEffect } from 'react'
import { startPaymentListener } from './src/services/paymentListener'

export default function App() {
  usePushToken()

  useEffect(() => {
    startPaymentListener()
  }, [])

  return <AppNavigator />
}