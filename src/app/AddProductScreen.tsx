import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from 'react-native';

const API_URL = 'http://119.59.102.161:3025/api/products';

interface AddProductScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddProductScreen({ onSuccess, onCancel }: AddProductScreenProps) {
  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Active');
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ส่งข้อมูลสินค้าใหม่ไปยัง Backend API (ตาม Slide 7)
  const handleAddProduct = async () => {
    if (!name.trim()) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อสินค้า');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          stock: Number(stock) || 0,
          category: category.trim() || 'ทั่วไป',
          location: location.trim() || 'คลังสินค้าหลัก',
          status: status,
          image: image.trim() || 'https://via.placeholder.com/150',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('สำเร็จ', `เพิ่มสินค้าเรียบร้อยแล้ว (ID: ${data.productId})`);
        if (onSuccess) onSuccess();
      } else {
        Alert.alert('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถเพิ่มสินค้าได้');
      }
    } catch (error) {
      console.error('Add product error:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับ Server ได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.title}>เพิ่มสินค้าใหม่</Text>

        <Text style={styles.label}>ชื่อสินค้า *</Text>
        <TextInput
          style={styles.input}
          placeholder="ระบุชื่อสินค้า"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>จำนวนสต็อก</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          keyboardType="numeric"
          value={stock}
          onChangeText={setStock}
        />

        <Text style={styles.label}>หมวดหมู่</Text>
        <TextInput
          style={styles.input}
          placeholder="เช่น Gaming Chair"
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.label}>สถานที่จัดเก็บ</Text>
        <TextInput
          style={styles.input}
          placeholder="เช่น คลัง A-01"
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>สถานะ</Text>
        <TextInput
          style={styles.input}
          placeholder="Active / Inactive"
          value={status}
          onChangeText={setStatus}
        />

        <Text style={styles.label}>URL รูปภาพ</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          value={image}
          onChangeText={setImage}
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleAddProduct}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>บันทึกสินค้า</Text>
          )}
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>ยกเลิก</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
  },
});