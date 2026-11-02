// src/navigation/SocialStack.js
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import SocialScreen from '../screens/SocialScreen'
import GroupDetailScreen from '../screens/GroupDetailScreen'

const Stack = createNativeStackNavigator()

export default function SocialStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SocialList" component={SocialScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
    </Stack.Navigator>
  )
}
