import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';

const API_URL = 'http://119.59.102.161:3025/api/products';

export interface EditableProduct {
  id: number;
  name: string;
  price?: number;
  stock: number;
  category: string;
  location: string;
  status: string;
  image: string;
}

interface EditProductScreenProps {
  product: EditableProduct;
  token?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditProductScreen({
  product,
  token,
  onSuccess,
  onCancel,
}: EditProductScreenProps) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price || 0));
  const [stock, setStock] = useState(String(product.stock));
  const [category, setCategory] = useState(product.category || '');
  const [location, setLocation] = useState(product.location || '');
  const [status, setStatus] = useState(product.status || 'Active');
  const [image, setImage] = useState(product.image || '');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ✏️ ฟังก์ชันอัปเดตข้อมูลสินค้า (PUT)
  const handleEditProduct = async () => {
    if (!name.trim()) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อสินค้า');
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

      const response = await fetch(`${API_URL}/${product.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          price: parseFloat(price) || 0,
          stock: parseInt(stock, 10) || 0,
          category: category.trim(),
          location: location.trim(),
          status: status,
          image: image.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        Alert.alert('สำเร็จ', 'แก้ไขข้อมูลสินค้าเรียบร้อยแล้ว');
        if (onSuccess) onSuccess();
      } else {
        Alert.alert('เกิดข้อผิดพลาด', data.message || data.error || 'ไม่สามารถอัปเดตข้อมูลได้');
      }
    } catch (error) {
      console.error('Edit product error:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับ Server ได้');
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ ฟังก์ชันลบสินค้า (DELETE)
  const handleDeleteProduct = () => {
    Alert.alert('ยืนยันการลบ', `คุณแน่ใจหรือไม่ว่าต้องการลบ "${product.name}"?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบข้อมูล',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const headers: Record<string, string> = {};
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/${product.id}`, {
              method: 'DELETE',
              headers,
            });

            if (response.ok) {
              Alert.alert('สำเร็จ', 'ลบสินค้าเรียบร้อยแล้ว');
              if (onSuccess) onSuccess();
            } else {
              const errorData = await response.json().catch(() => ({}));
              Alert.alert(
                'เกิดข้อผิดพลาด',
                errorData.message || 'ไม่สามารถลบข้อมูลได้ สินค้าอาจผูกอยู่กับออเดอร์'
              );
            }
          } catch (error) {
            console.error('Delete product error:', error);
            Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับ Server ได้');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
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
          placeholder="กรอกชื่อสินค้า"
        />

        <Text style={styles.label}>ราคา (บาท)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
          placeholder="0.00"
        />

        <Text style={styles.label}>จำนวนสต็อก</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={stock}
          onChangeText={setStock}
          placeholder="0"
        />

        <Text style={styles.label}>หมวดหมู่</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="เช่น เก้าอี้ทำงาน"
        />

        <Text style={styles.label}>รายละเอียด / คำอธิบาย</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="ระบุสเปคหรือสถานที่จัดเก็บ"
        />

        <Text style={styles.label}>สถานะ</Text>
        <TextInput
          style={styles.input}
          value={status}
          onChangeText={setStatus}
          placeholder="Active"
        />

        <Text style={styles.label}>URL รูปภาพ</Text>
        <TextInput
          style={styles.input}
          value={image}
          onChangeText={setImage}
          placeholder="https://..."
        />

        {/* ปุ่มอัปเดตข้อมูล */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleEditProduct}
          disabled={submitting || deleting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>อัปเดตข้อมูล</Text>
          )}
        </TouchableOpacity>

        {/* 🗑️ ปุ่มลบสินค้า */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteProduct}
          disabled={submitting || deleting}
        >
          {deleting ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text style={styles.deleteButtonText}>🗑️ ลบสินค้านี้</Text>
          )}
        </TouchableOpacity>

        {/* ปุ่มยกเลิก */}
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={submitting || deleting}
          >
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
  deleteButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 14,
  },
});