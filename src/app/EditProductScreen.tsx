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

export interface EditableProduct {
  id: number;
  name: string;
  stock: number;
  category: string;
  location: string;
  status: string;
  image: string;
}

interface EditProductScreenProps {
  product: EditableProduct;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditProductScreen({
  product,
  onSuccess,
  onCancel,
}: EditProductScreenProps) {
  const [name, setName] = useState(product.name);
  const [stock, setStock] = useState(String(product.stock));
  const [category, setCategory] = useState(product.category || '');
  const [location, setLocation] = useState(product.location || '');
  const [status, setStatus] = useState(product.status || 'Active');
  const [image, setImage] = useState(product.image || '');
  const [submitting, setSubmitting] = useState(false);

  // อัปเดตข้อมูลสินค้าไปยัง Backend API (ตาม Slide 8)
  const handleEditProduct = async () => {
    if (!name.trim()) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อสินค้า');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          stock: Number(stock) || 0,
          category: category.trim(),
          location: location.trim(),
          status: status,
          image: image.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('สำเร็จ', 'แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว');
        if (onSuccess) onSuccess();
      } else {
        Alert.alert('เกิดข้อผิดพลาด', data.error || 'ไม่สามารถอัปเดตข้อมูลได้');
      }
    } catch (error) {
      console.error('Edit product error:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับ Server ได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.formContainer}>
        <Text style={styles.title}>แก้ไขสินค้า (ID: {product.id})</Text>

        <Text style={styles.label}>ชื่อสินค้า *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>จำนวนสต็อก</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={stock}
          onChangeText={setStock}
        />

        <Text style={styles.label}>หมวดหมู่</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.label}>สถานที่จัดเก็บ</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={styles.label}>สถานะ</Text>
        <TextInput
          style={styles.input}
          value={status}
          onChangeText={setStatus}
        />

        <Text style={styles.label}>URL รูปภาพ</Text>
        <TextInput
          style={styles.input}
          value={image}
          onChangeText={setImage}
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleEditProduct}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>อัปเดตข้อมูล</Text>
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
    backgroundColor: '#16a34a',
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