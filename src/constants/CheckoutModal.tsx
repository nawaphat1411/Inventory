import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface CartItem {
  id: number;
  name: string;
  price: number;
  cartQuantity: number;
}

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  totalAmount: number;
  userToken: string;
  onSuccess: () => void;
}

export default function CheckoutModal({
  visible,
  onClose,
  cartItems,
  totalAmount,
  userToken,
  onSuccess,
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [slipBase64, setSlipBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 📸 เลือกรูปสลิปจาก Gallery
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      if (Platform.OS === 'web') {
        window.alert('กรุณายินยอมให้เข้าถึงรูปภาพเพื่อแนบสลิป');
      } else {
        Alert.alert('การเข้าถึงถูกปฏิเสธ', 'กรุณายินยอมให้เข้าถึงรูปภาพเพื่อแนบสลิป');
      }
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setSlipBase64(base64Image);
    }
  };

  // 🚀 ยืนยันคำสั่งซื้อ (ยิง API ไปที่ server.js ของคุณ)
  const handleConfirmOrder = async () => {
    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      const msg = 'กรุณากรอก ชื่อ, เบอร์โทร และที่อยู่จัดส่งให้ครบถ้วน';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('ข้อมูลไม่ครบถ้วน', msg);
      return;
    }

    if (!slipBase64) {
      const msg = 'กรุณาแนบหลักฐานการชำระเงิน (สลิปโอนเงิน)';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('กรุณาแนบสลิป', msg);
      return;
    }

    if (!userToken) {
      const msg = 'กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('ข้อผิดพลาด', msg);
      return;
    }

    setLoading(true);

    try {
      // 🔗 ยิงไปที่ API /api/orders ของ server.js
      const response = await fetch('http://119.59.102.161:3025/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`, // 🔑 ส่ง Token ให้ authenticateToken middleware
        },
        body: JSON.stringify({
          customerName,
          phone,
          address,
          totalAmount,
          slipImage: slipBase64,
          items: cartItems, // 📦 ส่งรายการสินค้าตรงตามโครงสร้างที่ server.js ต้องการ
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (Platform.OS === 'web') {
          window.alert('สั่งซื้อสำเร็จและตัดสต๊อกเรียบร้อยแล้ว!');
          resetFormAndClose();
        } else {
          Alert.alert('สำเร็จ', 'สั่งซื้อสำเร็จและตัดสต๊อกเรียบร้อยแล้ว!', [
            { text: 'ตกลง', onPress: resetFormAndClose },
          ]);
        }
      } else {
        throw new Error(data.error || data.message || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
      }
    } catch (error: any) {
      console.error('Order Error:', error);
      const errorMsg = error.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
      Platform.OS === 'web' ? window.alert(errorMsg) : Alert.alert('สั่งซื้อไม่สำเร็จ', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetFormAndClose = () => {
    setCustomerName('');
    setPhone('');
    setAddress('');
    setSlipBase64(null);
    onSuccess(); // ล้างตะกร้าสินค้าในหน้าหลัก
    onClose();   // ปิด Modal
  };

  const promptPayQrUrl = `https://promptpay.io/0806361170/${totalAmount}.png`;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>ชำระเงิน & ยืนยันคำสั่งซื้อ</Text>

            <View style={styles.qrContainer}>
              <Text style={styles.qrHeader}>สแกนจ่ายผ่าน PromptPay</Text>
              <Image source={{ uri: promptPayQrUrl }} style={styles.qrCode} />
              <Text style={styles.phoneText}>เบอร์พร้อมเพย์: 080-636-1170</Text>
              <Text style={styles.totalText}>ยอดชำระ: ฿{totalAmount.toLocaleString()}</Text>
            </View>

            <Text style={styles.sectionTitle}>ข้อมูลการจัดส่ง</Text>
            <TextInput
              style={styles.input}
              placeholder="ชื่อ-นามสกุล ผู้รับ"
              value={customerName}
              onChangeText={setCustomerName}
            />
            <TextInput
              style={styles.input}
              placeholder="เบอร์โทรศัพท์"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="ที่อยู่จัดส่งโดยละเอียด"
              multiline
              numberOfLines={3}
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.sectionTitle}>หลักฐานการชำระเงิน</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
              <Text style={styles.uploadBtnText}>
                {slipBase64 ? '📷 เปลี่ยนรูปสลิป' : '📁 เลือกรูปสลิปจากในเครื่อง'}
              </Text>
            </TouchableOpacity>

            {slipBase64 && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: slipBase64 }} style={styles.slipPreview} />
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.cancelBtnText}>ยกเลิก</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmOrder} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmBtnText}>ยืนยันสั่งซื้อ</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '90%' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, color: '#333' },
  qrContainer: { alignItems: 'center', backgroundColor: '#f8f9fa', padding: 16, borderRadius: 12, marginBottom: 16 },
  qrHeader: { fontSize: 16, fontWeight: '600', color: '#004085', marginBottom: 8 },
  qrCode: { width: 180, height: 180, borderRadius: 8, marginBottom: 8 },
  phoneText: { fontSize: 14, color: '#495057', fontWeight: '500' },
  totalText: { fontSize: 18, fontWeight: 'bold', color: '#e63946', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#444', marginBottom: 8, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 14 },
  textArea: { height: 70, textAlignVertical: 'top' },
  uploadBtn: { backgroundColor: '#e9ecef', borderWidth: 1, borderColor: '#adb5bd', borderStyle: 'dashed', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  uploadBtnText: { color: '#495057', fontSize: 14, fontWeight: '600' },
  previewContainer: { alignItems: 'center', marginBottom: 16 },
  slipPreview: { width: 150, height: 200, borderRadius: 8, resizeMode: 'contain' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#6c757d', alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: 'bold' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#28a745', alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },
});