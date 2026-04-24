import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const BASE_URL = __DEV__
  ? 'http://192.168.2.35:8080'
  : 'http://54.116.69.43:8080'

const client = axios.create({ baseURL: BASE_URL })

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default client