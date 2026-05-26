// src/navigation/AppNavigator.js
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import DashboardScreen from '../screens/DashboardScreen'
import UploadScreen from '../screens/UploadScreen'
import RecommendScreen from '../screens/RecommendScreen'
import SimulationScreen from '../screens/SimulationScreen'
import MyPageScreen from '../screens/MyPageScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: '대시보드' }} />
      <Tab.Screen name="Upload" component={UploadScreen} options={{ title: 'CSV 업로드' }} />
      <Tab.Screen name="Simulation" component={SimulationScreen} options={{ title: '결제 입력' }} />
      <Tab.Screen name="Recommend" component={RecommendScreen} options={{ title: '친환경 추천' }} />
      <Tab.Screen name="MyPage" component={MyPageScreen} options={{ title: '마이페이지' }} />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => {
      setIsLoggedIn(!!token)
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoggedIn ? (
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}