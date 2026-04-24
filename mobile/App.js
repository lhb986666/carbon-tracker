// App.js
import AppNavigator from './src/navigation/AppNavigator'
import { usePushToken } from './src/hooks/usePushToken'

export default function App() {
  usePushToken()
  return <AppNavigator />
}