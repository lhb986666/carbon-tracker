 // src/screens/RegisterScreen.js
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { useState } from 'react'
import { register } from '../api/auth'

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [ageGroup, setAgeGroup] = useState('')
  const [region, setRegion] = useState('')

  const handleRegister = async () => {
    if (!email || !password || !passwordConfirm) {
      return Alert.alert('오류', '이메일과 비밀번호를 입력해주세요')
    }
    if (password !== passwordConfirm) {
      return Alert.alert('오류', '비밀번호가 일치하지 않습니다')
    }
    try {
      await register(email, password, ageGroup, region)
      Alert.alert('완료', '회원가입이 완료됐어요! 로그인해주세요', [
        { text: '확인', onPress: () => navigation.replace('Login') }
      ])
    } catch (e) {
      Alert.alert('오류', '이미 사용 중인 이메일이에요')
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>회원가입</Text>
      <Text style={styles.subtitle}>탄소발자국 추적기</Text>

      <Text style={styles.label}>이메일 *</Text>
      <TextInput style={styles.input} placeholder="이메일 입력"
        value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none" />

      <Text style={styles.label}>비밀번호 *</Text>
      <TextInput style={styles.input} placeholder="비밀번호 입력"
        value={password} onChangeText={setPassword} secureTextEntry />

      <Text style={styles.label}>비밀번호 확인 *</Text>
      <TextInput style={styles.input} placeholder="비밀번호 재입력"
        value={passwordConfirm} onChangeText={setPasswordConfirm} secureTextEntry />

      <Text style={styles.label}>연령대</Text>
      <TextInput style={styles.input} placeholder="예: 20대, 30대"
        value={ageGroup} onChangeText={setAgeGroup} />

      <Text style={styles.label}>지역</Text>
      <TextInput style={styles.input} placeholder="예: 서울, 부산"
        value={region} onChangeText={setRegion} />

      <TouchableOpacity style={styles.btn} onPress={handleRegister}>
        <Text style={styles.btnText}>회원가입</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.replace('Login')}>
        <Text style={styles.loginText}>이미 계정이 있어요 → 로그인</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#16a34a', textAlign: 'center', marginTop: 60, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 14, marginBottom: 4, fontSize: 15 },
  btn: { backgroundColor: '#16a34a', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loginBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  loginText: { fontSize: 14, color: '#16a34a' },
})
