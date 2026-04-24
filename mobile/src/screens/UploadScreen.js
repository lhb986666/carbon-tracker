  // src/screens/UploadScreen.js
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { useState } from 'react'
import { uploadCSV } from '../api/upload'

export default function UploadScreen() {
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
      Alert.alert('완료', '분석이 완료됐어요!')
    } catch (e) {
      Alert.alert('오류', '업로드 중 문제가 발생했어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>카드 내역 업로드</Text>
      <Text style={styles.desc}>카드사에서 다운받은 CSV 파일을 선택해주세요</Text>
      <TouchableOpacity style={styles.pickBtn} onPress={pickFile}>
        <Text style={styles.pickText}>{file ? file.name : 'CSV 파일 선택'}</Text>
      </TouchableOpacity>
      {loading
        ? <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 24 }} />
        : <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
            <Text style={styles.uploadText}>분석 시작</Text>
          </TouchableOpacity>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '600', color: '#16a34a', marginBottom: 8, marginTop: 40 },
  desc: { fontSize: 14, color: '#64748b', marginBottom: 32 },
  pickBtn: { borderWidth: 1.5, borderColor: '#16a34a', borderStyle: 'dashed', borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 16 },
  pickText: { fontSize: 14, color: '#16a34a', fontWeight: '500' },
  uploadBtn: { backgroundColor: '#16a34a', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  uploadText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
