// src/screens/SimulationScreen.js
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useState } from 'react'
import client from '../api/client'

export default function SimulationScreen() {
  const [merchant, setMerchant] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSimulate = async () => {
    if (!merchant || !amount) {
      return Alert.alert('오류', '가맹점명과 금액을 입력해주세요')
    }
    setLoading(true)
    try {
      const res = await client.post('/api/simulation', {
        merchant_name: merchant,
        amount: parseInt(amount),
        source: 'simulation',
      })
      setResult(res.data)
    } catch (e) {
      Alert.alert('오류', '결제 시뮬레이션 중 문제가 발생했어요')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setMerchant('')
    setAmount('')
    setResult(null)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>💳 결제 시뮬레이션</Text>
          <Text style={styles.headerSub}>결제 정보를 입력하면 탄소 배출량을 즉시 계산해드려요</Text>
        </View>

        {/* 안내 카드 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>💡 카드 결제 알림을 자동으로 감지하거나, 직접 입력해서 탄소 배출량을 확인할 수 있어요</Text>
        </View>

        {/* 입력 폼 */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>결제 정보 입력</Text>

          <Text style={styles.label}>가맹점명</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 스타벅스, GS칼텍스"
            placeholderTextColor="#9ca3af"
            value={merchant}
            onChangeText={setMerchant}
          />

          <Text style={styles.label}>결제 금액 (원)</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 6500"
            placeholderTextColor="#9ca3af"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          {/* 빠른 입력 버튼 */}
          <Text style={styles.quickLabel}>빠른 금액 선택</Text>
          <View style={styles.quickRow}>
            {['5000', '10000', '15000', '30000'].map(q => (
              <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => setAmount(q)}>
                <Text style={styles.quickText}>{Number(q).toLocaleString()}원</Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#16a34a" />
              <Text style={styles.loadingText}>계산 중...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.btn, (!merchant || !amount) && styles.btnDisabled]}
              onPress={handleSimulate}
              disabled={!merchant || !amount}
            >
              <Text style={styles.btnText}>🔍 탄소 계산하기</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 결과 카드 */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>✅ 분석 결과</Text>

            <View style={styles.carbonBig}>
              <Text style={styles.carbonBigNum}>{result.carbon_kg}</Text>
              <Text style={styles.carbonBigUnit}>kg CO₂</Text>
            </View>

            <View style={styles.resultList}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🏪 가맹점</Text>
                <Text style={styles.resultValue}>{result.merchant_name}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>🏷️ 업종</Text>
                <Text style={styles.resultValue}>{result.category}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>💰 결제 금액</Text>
                <Text style={styles.resultValue}>{result.amount.toLocaleString()}원</Text>
              </View>
            </View>

            <View style={styles.tipBox}>
              <Text style={styles.tipText}>📊 대시보드에 자동 반영됐어요!</Text>
            </View>

            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetText}>다시 입력하기</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#14532d' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  infoCard: {
    marginHorizontal: 16, marginBottom: 16, padding: 14,
    backgroundColor: '#fffbeb', borderRadius: 14,
    borderWidth: 1, borderColor: '#fde68a',
  },
  infoText: { fontSize: 13, color: '#92400e', lineHeight: 20 },
  formCard: {
    marginHorizontal: 16, marginBottom: 16, padding: 20,
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  formTitle: { fontSize: 16, fontWeight: '600', color: '#14532d', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#d1fae5', borderRadius: 10,
    padding: 14, marginBottom: 16, fontSize: 15,
    backgroundColor: '#f0fdf4', color: '#14532d',
  },
  quickLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: {
    flex: 1, padding: 8, backgroundColor: '#dcfce7',
    borderRadius: 8, alignItems: 'center',
  },
  quickText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  loadingBox: { alignItems: 'center', padding: 16 },
  loadingText: { marginTop: 8, color: '#16a34a', fontSize: 14 },
  btn: {
    backgroundColor: '#16a34a', borderRadius: 12,
    padding: 16, alignItems: 'center',
    shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { backgroundColor: '#86efac' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard: {
    marginHorizontal: 16, marginBottom: 16, padding: 20,
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  resultTitle: { fontSize: 16, fontWeight: '600', color: '#14532d', marginBottom: 16 },
  carbonBig: { alignItems: 'center', paddingVertical: 20, backgroundColor: '#f0fdf4', borderRadius: 12, marginBottom: 16 },
  carbonBigNum: { fontSize: 48, fontWeight: '800', color: '#16a34a' },
  carbonBigUnit: { fontSize: 16, color: '#6b7280', marginTop: 4 },
  resultList: { marginBottom: 12 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  resultLabel: { fontSize: 13, color: '#6b7280' },
  resultValue: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  tipBox: { backgroundColor: '#dcfce7', borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 12 },
  tipText: { fontSize: 13, color: '#16a34a', fontWeight: '500' },
  resetBtn: { padding: 12, alignItems: 'center' },
  resetText: { fontSize: 14, color: '#6b7280' },
})