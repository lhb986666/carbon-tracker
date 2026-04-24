// src/screens/SimulationScreen.js
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native'
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
        amount: parseInt(amount)
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>결제 시뮬레이션</Text>
      <Text style={styles.desc}>결제 정보를 입력하면 탄소 배출량을 즉시 계산하고 알림을 보내드려요</Text>

      <Text style={styles.label}>가맹점명</Text>
      <TextInput style={styles.input} placeholder="예: 스타벅스, GS칼텍스"
        value={merchant} onChangeText={setMerchant} />

      <Text style={styles.label}>결제 금액 (원)</Text>
      <TextInput style={styles.input} placeholder="예: 6500"
        value={amount} onChangeText={setAmount} keyboardType="numeric" />

      {loading
        ? <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 24 }} />
        : <TouchableOpacity style={styles.btn} onPress={handleSimulate}>
            <Text style={styles.btnText}>탄소 계산하기</Text>
          </TouchableOpacity>
      }

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>분석 결과</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>가맹점</Text>
            <Text style={styles.resultValue}>{result.merchant_name}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>업종</Text>
            <Text style={styles.resultValue}>{result.category}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>결제 금액</Text>
            <Text style={styles.resultValue}>{result.amount.toLocaleString()}원</Text>
          </View>
          <View style={[styles.resultRow, styles.carbonRow]}>
            <Text style={styles.resultLabel}>탄소 배출량</Text>
            <Text style={styles.carbonValue}>{result.carbon_kg} kg CO₂</Text>
          </View>
          <Text style={styles.tip}>대시보드에 반영됐어요!</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>다시 입력하기</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: '600', padding: 20, paddingBottom: 4 },
  desc: { fontSize: 13, color: '#64748b', paddingHorizontal: 20, marginBottom: 20, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151', marginBottom: 6, marginHorizontal: 20 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 15, marginHorizontal: 20, backgroundColor: '#fff' },
  btn: { backgroundColor: '#16a34a', borderRadius: 8, padding: 16, alignItems: 'center', marginHorizontal: 20, marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultCard: { margin: 20, padding: 20, backgroundColor: '#fff', borderRadius: 12, borderWidth: 0.5, borderColor: '#e2e8f0' },
  resultTitle: { fontSize: 16, fontWeight: '600', color: '#16a34a', marginBottom: 16 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9' },
  carbonRow: { borderBottomWidth: 0, marginTop: 4 },
  resultLabel: { fontSize: 13, color: '#64748b' },
  resultValue: { fontSize: 13, fontWeight: '500', color: '#1e293b' },
  carbonValue: { fontSize: 18, fontWeight: '700', color: '#16a34a' },
  tip: { fontSize: 12, color: '#16a34a', backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8, marginTop: 12, textAlign: 'center' },
  resetBtn: { padding: 12, alignItems: 'center', marginTop: 8 },
  resetText: { fontSize: 14, color: '#64748b' },
}) 
