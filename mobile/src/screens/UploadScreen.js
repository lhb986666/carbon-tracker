// src/screens/UploadScreen.js
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { useState } from 'react'
import { uploadCSV } from '../api/upload'

export default function UploadScreen({ navigation }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'text/csv',
      copyToCacheDirectory: true,
    })
    if (!result.canceled) {
      setFile(result.assets[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return Alert.alert('파일을 먼저 선택해주세요')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: 'text/csv',
      })
      await uploadCSV(formData)
      Alert.alert('완료', '분석이 완료됐어요!', [
        { text: '확인', onPress: () => navigation.navigate('Dashboard') }
      ])
    } catch (e) {
      Alert.alert('오류', '업로드 중 문제가 발생했어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📂 카드 내역 업로드</Text>
        <Text style={styles.headerSub}>카드사에서 다운받은 CSV 파일을 분석해드려요</Text>
      </View>

      {/* 안내 카드 */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📋 지원 카드사</Text>
        <View style={styles.cardTagRow}>
          {['신한카드', 'KB국민', '삼성카드', '현대카드', '롯데카드', '우리카드'].map(c => (
            <View key={c} style={styles.cardTag}>
              <Text style={styles.cardTagText}>{c}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CSV 형식 안내 */}
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>💡 CSV 형식 안내</Text>
        <Text style={styles.guideText}>이용일자, 가맹점명, 이용금액 컬럼이 포함된 파일을 업로드해주세요</Text>
        <View style={styles.guideExample}>
          <Text style={styles.guideExampleText}>예) 2024-01-15, 스타벅스, 6500</Text>
        </View>
      </View>

      {/* 파일 선택 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>파일 선택</Text>
        <TouchableOpacity style={[styles.pickBtn, file && styles.pickBtnSelected]} onPress={pickFile}>
          <Text style={styles.pickIcon}>{file ? '✅' : '📁'}</Text>
          <Text style={[styles.pickText, file && styles.pickTextSelected]} numberOfLines={1}>
            {file ? file.name : 'CSV 파일을 선택하세요'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 업로드 버튼 */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>분석 중...</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadBtn, !file && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={!file}
        >
          <Text style={styles.uploadText}>🔍 분석 시작</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#14532d' },
  headerSub: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  infoCard: {
    margin: 16, marginTop: 0, padding: 16,
    backgroundColor: '#fff', borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  infoTitle: { fontSize: 14, fontWeight: '600', color: '#14532d', marginBottom: 10 },
  cardTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardTag: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  cardTagText: { fontSize: 12, color: '#16a34a', fontWeight: '500' },
  guideCard: {
    marginHorizontal: 16, marginBottom: 16, padding: 16,
    backgroundColor: '#fffbeb', borderRadius: 16,
    borderWidth: 1, borderColor: '#fde68a',
  },
  guideTitle: { fontSize: 14, fontWeight: '600', color: '#92400e', marginBottom: 6 },
  guideText: { fontSize: 13, color: '#78350f', lineHeight: 20 },
  guideExample: {
    marginTop: 8, backgroundColor: '#fef3c7',
    borderRadius: 8, padding: 10,
  },
  guideExampleText: { fontSize: 12, color: '#92400e', fontFamily: 'monospace' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#14532d', marginBottom: 10 },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 2, borderColor: '#16a34a', borderStyle: 'dashed',
    borderRadius: 14, padding: 20,
    backgroundColor: '#fff',
  },
  pickBtnSelected: { borderStyle: 'solid', backgroundColor: '#f0fdf4' },
  pickIcon: { fontSize: 24 },
  pickText: { fontSize: 14, color: '#16a34a', fontWeight: '500', flex: 1 },
  pickTextSelected: { color: '#14532d' },
  loadingBox: { alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 8, color: '#16a34a', fontSize: 14 },
  uploadBtn: {
    marginHorizontal: 16, padding: 18,
    backgroundColor: '#16a34a', borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#16a34a', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  uploadBtnDisabled: { backgroundColor: '#86efac' },
  uploadText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})