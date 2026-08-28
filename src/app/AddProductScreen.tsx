import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL = 'http://119.59.102.161:3025/api/products';

interface AddProductModalProps {
  visible?: boolean;
  token?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORIES = ['เก้าอี้ทำงาน', 'เก้าอี้เกมมิ่ง', 'เก้าอี้โซฟา'];

export default function AddProductModal({ visible = true, token, onSuccess, onCancel }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [category, setCategory] = useState('เก้าอี้ทำงาน');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 📁 ฟังก์ชันเลือกรูปจากเครื่อง
  const handlePickLocalImage = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              setImage(reader.result.toString());
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert('แจ้งเตือน', 'กรุณาใช้งานบน Web Browser เพื่อเลือกไฟล์รูปภาพ');
    }
  };

  // 📦 บันทึกสินค้า
  const handleAddProduct = async () => {
    if (!name.trim()) {
      const msg = 'กรุณากรอกชื่อสินค้า';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('ข้อผิดพลาด', msg);
      return;
    }

    setSubmitting(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          price: parseFloat(price) || 0,
          stock: Number(stock) || 0,
          category: category.trim() || 'เก้าอี้ทำงาน',
          location: description.trim() || '',
          status: status,
          image: image.trim() || 'https://via.placeholder.com/150',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const successMsg = `เพิ่มสินค้าเรียบร้อยแล้ว`;
        if (Platform.OS === 'web') window.alert(successMsg);
        else Alert.alert('สำเร็จ', successMsg);

        if (onSuccess) onSuccess();
      } else {
        const errorMsg = data.message || data.error || 'ไม่สามารถเพิ่มสินค้าได้';
        if (Platform.OS === 'web') window.alert(errorMsg);
        else Alert.alert('เกิดข้อผิดพลาด', errorMsg);
      }
    } catch (error) {
      console.error('Add product error:', error);
      const connMsg = 'ไม่สามารถเชื่อมต่อกับ Server ได้';
      if (Platform.OS === 'web') window.alert(connMsg);
      else Alert.alert('เกิดข้อผิดพลาด', connMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <Text style={styles.title}>➕ เพิ่มสินค้าใหม่</Text>

          <Text style={styles.label}>ชื่อสินค้า *</Text>
          <TextInput
            style={styles.input}
            placeholder="เช่น เก้าอี้สุขภาพ Ergonomic"
            value={name}
            onChangeText={setName}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>จำนวนสต็อก *</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>ราคา (บาท) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          <Text style={styles.label}>หมวดหมู่</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.categoryChip, category === item && styles.categoryChipActive]}
                onPress={() => setCategory(item)}
              >
                <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>รายละเอียด/คำอธิบายสินค้า</Text>
          <TextInput
            style={styles.input}
            placeholder="ระบุฟังก์ชันหรือสเปคเบื้องต้น"
            value={description}
            onChangeText={setDescription}
          />

          {/* 🖼️ ส่วนจัดการรูปภาพ */}
          <Text style={styles.label}>รูปภาพสินค้า</Text>

          {image ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImage('')}>
                <Text style={styles.removeImageText}>✕ ลบรูปภาพ</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ปุ่มเลือกรูปภาพจากคอมพิวเตอร์ */}
          <TouchableOpacity style={styles.pickImageButton} onPress={handlePickLocalImage}>
            <Text style={styles.pickImageButtonText}>📁 เลือกไฟล์รูปภาพจากเครื่อง</Text>
          </TouchableOpacity>

          <Text style={styles.subLabel}>หรือระบุ URL รูปภาพ:</Text>
          <TextInput
            style={styles.input}
            placeholder="https://example.com/image.jpg"
            value={image}
            onChangeText={setImage}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleAddProduct} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>บันทึกสินค้าใหม่</Text>
            )}
          </TouchableOpacity>

          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>ยกเลิก</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  formContainer: { padding: 24, maxWidth: 800, width: '100%', alignSelf: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  subLabel: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 16,
  },
  categoryContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  categoryChipActive: { backgroundColor: '#2563eb' },
  categoryText: { fontSize: 13, color: '#475569' },
  categoryTextActive: { color: '#ffffff', fontWeight: 'bold' },
  pickImageButton: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#38bdf8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  pickImageButtonText: { color: '#0284c7', fontSize: 14, fontWeight: 'bold' },
  imagePreviewContainer: { alignItems: 'center', marginBottom: 12 },
  imagePreview: { width: 120, height: 120, borderRadius: 8, backgroundColor: '#f1f5f9' },
  removeImageBtn: { marginTop: 6, backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  removeImageText: { color: '#ef4444', fontSize: 12, fontWeight: 'bold' },
  submitButton: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  cancelButton: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { color: '#64748b', fontSize: 14, fontWeight: '500' },
});