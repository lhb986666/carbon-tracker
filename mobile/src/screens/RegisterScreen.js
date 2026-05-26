// src/screens/RegisterScreen.js
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useState } from 'react'
import { register } from '../api/auth'

const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대 이상']
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']

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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.logoIcon}>🌿</Text>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>탄소발자국 추적기</Text>
        </View>

        {/* 폼 카드 */}
        <View style={styles.formCard}>

          <Text style={styles.label}>이메일 *</Text>
          <TextInput
            style={styles.input}
            placeholder="이메일 입력"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>비밀번호 *</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호 입력"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>비밀번호 확인 *</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호 재입력"
            placeholderTextColor="#9ca3af"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry
          />

          {/* 연령대 선택 */}
          <Text style={styles.label}>연령대</Text>
          <View style={styles.selectRow}>
            {AGE_GROUPS.map(age => (
              <TouchableOpacity
                key={age}
                style={[styles.selectBtn, ageGroup === age && styles.selectBtnActive]}
                onPress={() => setAgeGroup(age)}
              >
                <Text style={[styles.selectText, ageGroup === age && styles.selectTextActive]}>
                  {age}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 지역 선택 */}
          <Text style={styles.label}>지역</Text>
          <View style={styles.selectRow}>
            {REGIONS.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.selectBtn, region === r && styles.selectBtnActive]}
                onPress={() => setRegion(r)}
              >
                <Text style={[styles.selectText, region === r && styles.selectTextActive]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleRegister}>
            <Text style={styles.btnText}>회원가입</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.loginText}>이미 계정이 있어요 → <Text style={styles.loginLink}>로그인</Text></Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24 },
  logoIcon: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#14532d', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  formCard: {
    marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    marginBottom: 16,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: '#d1fae5', borderRadius: 10,
    padding: 14, fontSize: 15,
    backgroundColor: '#f0fdf4', color: '#14532d',
  },
  selectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#d1fae5',
    backgroundColor: '#f0fdf4',
  },
  selectBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  selectText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  selectTextActive: { color: '#fff', fontWeight: '700' },
  btn: {
    backgroundColor: '#16a34a', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 24,
    shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginBtn: { padding: 12, alignItems: 'center' },
  loginText: { fontSize: 14, color: '#6b7280' },
  loginLink: { color: '#16a34a', fontWeight: '600' },
})