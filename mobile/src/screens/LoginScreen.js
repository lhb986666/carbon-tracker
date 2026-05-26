// src/screens/LoginScreen.js
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { useState } from 'react'
import { login } from '../api/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function LoginScreen({ navigation, setIsLoggedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    try {
      const data = await login(email, password)
      await AsyncStorage.setItem('token', data.access_token)
      setIsLoggedIn(true)
    } catch (e) {
      Alert.alert('로그인 실패', '이메일 또는 비밀번호를 확인해주세요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.logoArea}>
          <Text style={styles.logoIcon}>🌿</Text>
          <Text style={styles.title}>탄소발자국 추적기</Text>
          <Text style={styles.subtitle}>소비 내역 기반 탄소 배출량 분석</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            style={styles.input}
            placeholder="이메일 입력"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호 입력"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? '로그인 중...' : '로그인'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerText}>계정이 없어요 → <Text style={styles.registerLink}>회원가입</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f0fdf4' },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#14532d', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  formCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    marginBottom: 16,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#d1fae5', borderRadius: 10,
    padding: 14, marginBottom: 4, fontSize: 15,
    backgroundColor: '#f0fdf4', color: '#14532d',
  },
  btn: {
    backgroundColor: '#16a34a', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 20,
    shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { backgroundColor: '#86efac' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerBtn: { padding: 12, alignItems: 'center' },
  registerText: { fontSize: 14, color: '#6b7280' },
  registerLink: { color: '#16a34a', fontWeight: '600' },
})