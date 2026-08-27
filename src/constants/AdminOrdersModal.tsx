import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3025/api';

interface AdminOrdersModalProps {
  visible: boolean;
  onClose: () => void;
  userToken: string;
}

interface OrderItem {
  id?: number;
  name: string;
  price: number;
  cartQuantity: number;
}

interface Order {
  id: number;
  userId: number;
  customerName: string;
  phone: string;
  address: string;
  slipImage: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function AdminOrdersModal({ visible, onClose, userToken }: AdminOrdersModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);

  const fetchAdminOrders = () => {
    setLoading(true);
    fetch(`${API_BASE_URL}/orders`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลรายการสั่งซื้อได้');
        return res.json();
      })
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch Admin Orders Error:', err);
        setOrders([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (visible) {
      fetchAdminOrders();
    }
  }, [visible]);

  // ✏️ อัปเดตสถานะแบบวนลูปเช็ก Endpoint ยอดนิยมเพื่อแก้ 404
  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    // 1. Optimistic Update เปลี่ยน UI ทันที
    setOrders((prevOrders) =>
      prevOrders.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );

    // รายการ Endpoint ที่ฝั่ง Backend มักใช้งาน
    const targets = [
      { url: `${API_BASE_URL}/orders/${orderId}`, method: 'PUT', body: { status: newStatus } },
      { url: `${API_BASE_URL}/orders/${orderId}`, method: 'PATCH', body: { status: newStatus } },
      { url: `${API_BASE_URL}/admin/orders/${orderId}`, method: 'PUT', body: { status: newStatus } },
      { url: `${API_BASE_URL}/admin/orders/${orderId}`, method: 'PATCH', body: { status: newStatus } },
      { url: `${API_BASE_URL}/orders/${orderId}/status`, method: 'PATCH', body: { status: newStatus } },
      { url: `${API_BASE_URL}/orders/status`, method: 'POST', body: { orderId, status: newStatus } },
      { url: `${API_BASE_URL}/orders/update-status`, method: 'POST', body: { orderId, status: newStatus } },
    ];

    let isSuccess = false;
    let errorMessage = '';

    for (const target of targets) {
      try {
        const res = await fetch(target.url, {
          method: target.method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(target.body),
        });

        if (res.ok) {
          isSuccess = true;
          break;
        } else if (res.status !== 404) {
          // หากพบ Endpoint แล้วแต่ติด Error อื่น (เช่น 400 หรือ 500)
          const data = await res.json().catch(() => ({}));
          errorMessage = data.message || `HTTP Code ${res.status}`;
          break;
        }
      } catch (err) {
        // ลอง Endpoint ถัดไป
      }
    }

    if (isSuccess) {
      showAlert('สำเร็จ', `อัปเดตสถานะเป็น "${newStatus}" เรียบร้อยแล้ว`);
    } else {
      showAlert(
        'ข้อผิดพลาด',
        errorMessage
          ? `อัปเดตไม่สำเร็จ: ${errorMessage}`
          : 'ไม่พบ URL สำหรับอัปเดตสถานะบน Server (HTTP 404) กรุณาตรวจสอบ Route ใน Backend'
      );
      fetchAdminOrders();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>👑 รายการจัดการคำสั่งซื้อ (Admin)</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>ปิด</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={{ marginTop: 10, color: '#64748b' }}>กำลังโหลดคำสั่งซื้อ...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>ยังไม่มีคำสั่งซื้อในระบบ</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchAdminOrders}>
              <Text style={styles.refreshBtnText}>🔄 รีเฟรชข้อมูล</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 20 }}>
            {orders.map((order) => (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.orderId}>คำสั่งซื้อ #{order.id}</Text>
                  <Text style={styles.statusBadge}>{order.status || 'รอการตรวจสอบ'}</Text>
                </View>

                <Text style={styles.infoText}>👤 ผู้สั่งซื้อ: {order.customerName}</Text>
                <Text style={styles.infoText}>📞 เบอร์โทร: {order.phone}</Text>
                <Text style={styles.infoText}>📍 ที่อยู่: {order.address}</Text>

                <View style={styles.itemsBox}>
                  <Text style={styles.itemsTitle}>รายการสินค้า:</Text>
                  {order.items?.map((item, idx) => (
                    <Text key={idx} style={styles.itemRow}>
                      • {item.name} x {item.cartQuantity} ชิ้น (฿{Number(item.price * item.cartQuantity).toLocaleString()})
                    </Text>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  {order.slipImage ? (
                    <TouchableOpacity onPress={() => setSelectedSlip(order.slipImage)}>
                      <Text style={styles.slipLink}>🖼️ ดูสลิปโอนเงิน</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={{ color: '#94a3b8', fontSize: 13 }}>ไม่มีสลิป</Text>
                  )}
                  <Text style={styles.totalAmount}>ยอดรวม: ฿{Number(order.totalAmount || 0).toLocaleString()}</Text>
                </View>

                {/* ปุ่มจัดการสถานะ */}
                <View style={styles.actionGroup}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
                    onPress={() => handleUpdateStatus(order.id, 'ชำระเงินแล้ว')}
                  >
                    <Text style={styles.actionBtnText}>✓ ชำระแล้ว</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#0284c7' }]}
                    onPress={() => handleUpdateStatus(order.id, 'จัดส่งแล้ว')}
                  >
                    <Text style={styles.actionBtnText}>🚚 จัดส่งแล้ว</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#dc2626' }]}
                    onPress={() => handleUpdateStatus(order.id, 'ยกเลิก')}
                  >
                    <Text style={styles.actionBtnText}>✕ ยกเลิก</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Modal ดูรูปสลิป */}
        <Modal visible={!!selectedSlip} transparent={true} animationType="fade">
          <View style={styles.slipOverlay}>
            <TouchableOpacity style={styles.closeSlipBtn} onPress={() => setSelectedSlip(null)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>✕ ปิดภาพ</Text>
            </TouchableOpacity>
            {selectedSlip && <Image source={{ uri: selectedSlip }} style={styles.fullSlipImage} resizeMode="contain" />}
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#334155', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  closeBtn: { backgroundColor: '#ef4444', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  closeBtnText: { color: '#ffffff', fontWeight: 'bold' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 16, marginBottom: 12 },
  refreshBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  refreshBtnText: { color: '#ffffff', fontWeight: 'bold' },

  body: { flex: 1, padding: 12 },
  card: { backgroundColor: '#ffffff', borderRadius: 10, padding: 14, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  statusBadge: { backgroundColor: '#fef3c7', color: '#b45309', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, fontSize: 12, fontWeight: 'bold' },
  infoText: { fontSize: 13, color: '#334155', marginBottom: 2 },
  itemsBox: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 6, marginVertical: 8 },
  itemsTitle: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 4 },
  itemRow: { fontSize: 12, color: '#334155' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  slipLink: { color: '#2563eb', fontWeight: 'bold', fontSize: 13 },
  totalAmount: { fontSize: 16, fontWeight: 'bold', color: '#16a34a' },

  actionGroup: { flexDirection: 'row', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  actionBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },

  slipOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeSlipBtn: { position: 'absolute', top: 40, right: 20, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 20 },
  fullSlipImage: { width: '90%', height: '75%' },
});