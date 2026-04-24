// src/screens/LoginScreen.js
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useState } from 'react'
import { login } from '../api/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    try {
      const data = await login(email, password)
      await AsyncStorage.setItem('token', data.access_token)
      navigation.replace('Main')
    } catch (e) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요')
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>탄소발자국 추적기</Text>
      <Text style={styles.subtitle}>소비 내역 기반 탄소 배출량 분석</Text>

      <TextInput style={styles.input} placeholder="이메일"
        value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="비밀번호"
        value={password} onChangeText={setPassword} secureTextEntry />

      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>로그인</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerText}>계정이 없어요 → 회원가입</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#16a34a', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 40 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 15 },
  btn: { backgroundColor: '#16a34a', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  registerText: { fontSize: 14, color: '#16a34a' },
})