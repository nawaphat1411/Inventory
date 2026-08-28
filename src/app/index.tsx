import { useEffect, useState } from 'react';
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

import AdminOrdersModal from '../constants/AdminOrdersModal';
import CheckoutModal from '../constants/CheckoutModal';
import HomeScreen from './HomeScreen';
import LoginScreen from './LoginScreen';

const API_BASE_URL = 'http://119.59.102.161:3025/api';

interface User {
  user_id: number;
  username: string;
  role: 'admin' | 'user';
}

interface Product {
  id: number;
  name: string;
  stock: number;
  price: number;
  category: string;
  location: string;
  status: string;
  image: string;
}

interface CartItem extends Product {
  cartQuantity: number;
}

interface Order {
  id: number;
  userId: number;
  customerName: string;
  phone: string;
  address: string;
  slipImage: string;
  items: CartItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

const CATEGORIES = ['ทั้งหมด', 'เก้าอี้ทำงาน', 'เก้าอี้เกมมิ่ง', 'เก้าอี้โซฟา'];

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');

  // Navigation: 'home' | 'inventory' | 'orders'
  const [activeTab, setActiveTab] = useState<string>('home');

  // Cart & Orders State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartModalVisible, setCartModalVisible] = useState<boolean>(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(false);

  // Admin Modal States
  const [adminOrdersVisible, setAdminOrdersVisible] = useState<boolean>(false);

  // Modals & Image Zoom States
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);

  // Admin Product Modal States
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('เก้าอี้ทำงาน');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('Active');
  const [image, setImage] = useState('');

  const handleLoginSuccess = (userToken: string, userData: User) => {
    setToken(userToken);
    setUser(userData);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCart([]);
  };

  const fetchProducts = (query: string = '') => {
    setLoading(true);
    const url = query.trim()
      ? `${API_BASE_URL}/products?q=${encodeURIComponent(query.trim())}`
      : `${API_BASE_URL}/products`;

    fetch(url)
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Fetch Error:', error);
        setLoading(false);
      });
  };

  // ดึงรายการสั่งซื้อ
  const fetchOrders = () => {
    if (!user) return;
    setLoadingOrders(true);
    const url = user.role === 'admin' ? `${API_BASE_URL}/orders` : `${API_BASE_URL}/orders?userId=${user.user_id}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          setOrders([]);
        }
        setLoadingOrders(false);
      })
      .catch((err) => {
        console.error(err);
        setOrders([]);
        setLoadingOrders(false);
      });
  };

  useEffect(() => {
    if (token) {
      const timer = setTimeout(() => fetchProducts(searchQuery), 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, token]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const filteredProducts = products.filter((product) => {
    if (selectedCategory === 'ทั้งหมด') return true;
    return product.category?.trim() === selectedCategory;
  });

  // ระบบตะกร้าสินค้า
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('สินค้าหมด', 'ขออภัย สินค้ารุ่นนี้หมดชั่วคราว');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= product.stock) {
          Alert.alert('แจ้งเตือน', 'จำนวนสินค้าในตะกร้าเกินสต็อกที่มี');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, cartQuantity: 1 }];
    });
    Alert.alert('สำเร็จ', `เพิ่ม "${product.name}" ลงในตะกร้าแล้ว`);
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + Number(item.price || 0) * item.cartQuantity, 0);
  };

  const handleOrderSuccess = () => {
    setCart([]);
    setCartModalVisible(false);
    fetchProducts();
    setActiveTab('orders');
  };

  // Admin Actions: บันทึกข้อมูลสินค้า (เพิ่ม/แก้ไข)
  const handleSaveProduct = () => {
    if (!name.trim() || !stock.trim() || !price.trim()) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบถ้วน', 'ชื่อสินค้า, สต็อก และราคา จำเป็นต้องกรอก');
      return;
    }

    const payload = {
      name: name.trim(),
      stock: parseInt(stock, 10) || 0,
      price: parseFloat(price) || 0,
      category,
      location: location.trim(),
      status,
      image: image.trim(),
    };

    const method = isEditMode ? 'PUT' : 'POST';
    const url = isEditMode ? `${API_BASE_URL}/products/${editingId}` : `${API_BASE_URL}/products`;

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        return res.json();
      })
      .then(() => {
        Alert.alert('สำเร็จ', isEditMode ? 'อัปเดตข้อมูลเรียบร้อยแล้ว' : 'เพิ่มสินค้าเรียบร้อยแล้ว');
        setModalVisible(false);
        fetchProducts(searchQuery);
      })
      .catch((err) => {
        Alert.alert('ข้อผิดพลาด', err.message);
      });
  };

  // 🛠️ Admin Actions: ลบสินค้า (รองรับทั้ง Web และ Mobile)
  const executeDelete = (id: number) => {
    fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || 'ไม่สามารถลบข้อมูลได้ สินค้าอาจผูกอยู่กับออเดอร์');
        }
        return res.status !== 204 ? res.json().catch(() => ({})) : {};
      })
      .then(() => {
        if (Platform.OS === 'web') {
          window.alert('ลบสินค้าเรียบร้อยแล้ว');
        } else {
          Alert.alert('สำเร็จ', 'ลบสินค้าเรียบร้อยแล้ว');
        }
        setModalVisible(false);
        fetchProducts(searchQuery);
      })
      .catch((err) => {
        if (Platform.OS === 'web') {
          window.alert(err.message);
        } else {
          Alert.alert('ข้อผิดพลาด', err.message);
        }
      });
  };

  const handleDeleteProduct = (id: number) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?');
      if (confirmed) {
        executeDelete(id);
      }
    } else {
      Alert.alert('ยืนยันการลบ', 'คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้?', [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบข้อมูล',
          style: 'destructive',
          onPress: () => executeDelete(id),
        },
      ]);
    }
  };

  // Modals Controller
  const openDetailModal = (product: Product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setName('');
    setStock('');
    setPrice('');
    setCategory('เก้าอี้ทำงาน');
    setLocation('');
    setStatus('Active');
    setImage('');
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setIsEditMode(true);
    setEditingId(product.id);
    setName(product.name);
    setStock(String(product.stock));
    setPrice(String(product.price || 0));
    setCategory(product.category || 'เก้าอี้ทำงาน');
    setLocation(product.location || '');
    setStatus(product.status || 'Active');
    setImage(product.image || '');
    setModalVisible(true);
  };
  // 📁 ฟังก์ชันเลือกรูปจากเครื่อง (สำหรับ Web Browser)
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
      Alert.alert('แจ้งเตือน', 'กรุณาเปิดผ่าน Web Browser เพื่อเลือกรูปภาพจากเครื่อง');
    }
  };

  if (!token) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = user?.role === 'admin';
  const totalCartCount = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>ร้านขายเก้าอี้ออนไลน์</Text>
          <Text style={styles.headerTitle}>CHAIR SHOP</Text>
        </View>

        <View style={[styles.profileBadge, isAdmin ? styles.badgeAdmin : styles.badgeUser]}>
          <Text style={[styles.profileText, isAdmin ? styles.profileTextAdmin : styles.profileTextUser]}>
            👤 {user?.username} ({user?.role?.toUpperCase()})
          </Text>
        </View>
      </View>

      {/* สลับมุมมองตาม activeTab */}
      {activeTab === 'home' && (
        <HomeScreen
          products={products}
          onNavigateToProducts={() => setActiveTab('inventory')}
          onSelectProduct={openDetailModal}
          onAddToCart={addToCart}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
      )}

      {activeTab === 'inventory' && (
        <>
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="ค้นหาเก้าอี้..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.actionButtonGroup}>
              {!isAdmin && (
                <TouchableOpacity style={styles.cartInlineBtn} onPress={() => setCartModalVisible(true)}>
                  <Text style={styles.cartInlineBtnText}>🛒 ({totalCartCount})</Text>
                </TouchableOpacity>
              )}

              {isAdmin && (
                <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                  <Text style={styles.addButtonText}>+ เพิ่ม</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.logoutBtnInline} onPress={handleLogout}>
                <Text style={styles.logoutBtnInlineText}>🚪 ออก</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.categoryFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>ไม่พบเก้าอี้ในหมวดหมู่นี้</Text>
            </View>
          ) : (
            <ScrollView style={styles.productsList} contentContainerStyle={{ paddingBottom: 20 }}>
              {filteredProducts.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.productIdTag}>#{product.id}</Text>
                    <View style={[styles.statusBadge, product.stock > 0 ? styles.statusActive : styles.statusOut]}>
                      <Text style={styles.statusText}>{product.stock > 0 ? `คงเหลือ ${product.stock}` : 'สินค้าหมด'}</Text>
                    </View>
                  </View>

                  <View style={styles.productMainInfo}>
                    <TouchableOpacity onPress={() => setZoomedImageUrl(product.image || 'https://via.placeholder.com/300')}>
                      <Image
                        source={{ uri: product.image || 'https://via.placeholder.com/150' }}
                        style={styles.productImage}
                      />
                    </TouchableOpacity>

                    <View style={styles.productDetails}>
                      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                      <Text style={styles.priceText}>฿{Number(product.price || 0).toLocaleString()}</Text>
                      <Text style={styles.subText}>📦 สต็อก: <Text style={styles.highlightText}>{product.stock}</Text> ชิ้น</Text>
                      <Text style={styles.subText}>🏷️ หมวดหมู่: {product.category || '-'}</Text>
                      <Text style={styles.subText} numberOfLines={1}>ℹ️ ข้อมูลสินค้า: {product.location || '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.actionRow}>
                    {isAdmin ? (
                      <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(product)}>
                        <Text style={styles.editBtnText}>✏️ แก้ไขข้อมูล</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity style={styles.detailBtn} onPress={() => openDetailModal(product)}>
                          <Text style={styles.detailBtnText}>👁️ รายละเอียด</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.buyBtn, product.stock <= 0 && styles.disabledBtn]}
                          onPress={() => addToCart(product)}
                          disabled={product.stock <= 0}
                        >
                          <Text style={styles.buyBtnText}>🛒 ใส่ตะกร้า</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}

      {/* 📋 หน้าสั่งซื้อ (Orders Tab) */}
      {activeTab === 'orders' && (
        <View style={{ flex: 1, padding: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>
              📋 รายการสั่งซื้อ {isAdmin ? '(ทั้งหมด)' : 'ของคุณ'}
            </Text>

            {/* 👑 ปุ่มเปิด Modal Admin จัดการคำสั่งซื้อ */}
            {isAdmin && (
              <TouchableOpacity 
                style={styles.adminOrdersBtn} 
                onPress={() => setAdminOrdersVisible(true)}
              >
                <Text style={styles.adminOrdersBtnText}>👑 จัดการคำสั่งซื้อ</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingOrders ? (
            <ActivityIndicator size="large" color="#2563eb" />
          ) : !Array.isArray(orders) || orders.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={{ fontSize: 40 }}>🧾</Text>
              <Text style={{ color: '#64748b', marginTop: 8 }}>ยังไม่มีประวัติการสั่งซื้อ</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>คำสั่งซื้อ #{order.id}</Text>
                    <Text style={styles.orderStatus}>{order.status}</Text>
                  </View>

                  <Text style={styles.orderDetailText}>👤 ผู้รับ: {order.customerName} ({order.phone})</Text>
                  <Text style={styles.orderDetailText}>📍 ที่อยู่: {order.address}</Text>

                  <View style={styles.orderItemsList}>
                    {order.items?.map((it, idx) => (
                      <Text key={idx} style={{ fontSize: 13, color: '#334155' }}>
                        • {it.name} x {it.cartQuantity} ชิ้น (฿{(it.price * it.cartQuantity).toLocaleString()})
                      </Text>
                    ))}
                  </View>

                  <View style={styles.orderFooter}>
                    <TouchableOpacity onPress={() => setZoomedImageUrl(order.slipImage)}>
                      <Text style={{ color: '#2563eb', fontWeight: 'bold', fontSize: 13 }}>🖼️ ดูสลิปโอนเงิน</Text>
                    </TouchableOpacity>
                    <Text style={styles.orderTotal}>ยอดรวม: ฿{order.totalAmount?.toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* 🛠️ Modal เพิ่ม/แก้ไขสินค้า (สำหรับ Admin) */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{isEditMode ? '✏️ แก้ไขสินค้า' : '➕ เพิ่มสินค้าใหม่'}</Text>

            <Text style={styles.inputLabel}>ชื่อสินค้า *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="เช่น เก้าอี้สุขภาพ Ergonomic" />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>จำนวนสต็อก *</Text>
                <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>ราคา (บาท) *</Text>
                <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0.00" />
              </View>
            </View>

            <Text style={styles.inputLabel}>หมวดหมู่</Text>
            <View style={styles.categorySelectRow}>
              {CATEGORIES.filter((c) => c !== 'ทั้งหมด').map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.miniChip, category === cat && styles.miniChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.miniChipText, category === cat && styles.miniChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>รายละเอียด/คำอธิบายสินค้า</Text>
            <TextInput style={[styles.input, { height: 60 }]} value={location} onChangeText={setLocation} multiline placeholder="ระบุฟังก์ชันหรือสเปคเบื้องต้น" />
{/* 🖼️ แสดงตัวอย่างรูปภาพเมื่อเลือกแล้ว */}
            {image ? (
              <View style={{ alignItems: 'center', marginBottom: 10 }}>
                <Image source={{ uri: image }} style={{ width: 100, height: 100, borderRadius: 8, marginBottom: 6 }} />
                <TouchableOpacity 
                  style={{ backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }} 
                  onPress={() => setImage('')}
                >
                  <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>✕ ลบรูปภาพ</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* 📁 ปุ่มเลือกไฟล์จากเครื่อง */}
            <TouchableOpacity 
              style={{
                backgroundColor: '#e0f2fe',
                borderColor: '#38bdf8',
                borderWidth: 1,
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: 12
              }} 
              onPress={handlePickLocalImage}
            >
              <Text style={{ color: '#0284c7', fontWeight: 'bold', fontSize: 13 }}>📁 เลือกไฟล์รูปภาพจากเครื่อง</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>หรือใส่ URL รูปภาพ</Text>
            <TextInput style={styles.input} value={image} onChangeText={setImage} placeholder="https://example.com/image.jpg" />
            

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
              <Text style={styles.saveButtonText}>{isEditMode ? 'อัปเดตข้อมูล' : 'บันทึกสินค้าใหม่'}</Text>
            </TouchableOpacity>

            {/* 🗑️ ปุ่มลบสินค้า (แก้ไขให้กดแล้วลบแน่นอน) */}
            {isEditMode && editingId !== null && (
              <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteProduct(editingId)}>
                <Text style={styles.deleteButtonText}>🗑️ ลบสินค้านี้</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* 👁️ Modal รายละเอียดสินค้า (สำหรับ User) */}
      <Modal visible={detailModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedProduct && (
              <>
                <Image source={{ uri: selectedProduct.image || 'https://via.placeholder.com/300' }} style={styles.detailImage} />
                <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                <Text style={styles.detailPrice}>฿{Number(selectedProduct.price || 0).toLocaleString()}</Text>

                <View style={styles.detailInfoBox}>
                  <Text style={styles.detailInfoText}>🏷️ หมวดหมู่: {selectedProduct.category}</Text>
                  <Text style={styles.detailInfoText}>📦 คงเหลือ: {selectedProduct.stock} ชิ้น</Text>
                  <Text style={styles.detailInfoText}>ℹ️ รายละเอียด: {selectedProduct.location || 'ไม่มีข้อมูลเพิ่มเติม'}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.saveButton, selectedProduct.stock <= 0 && styles.disabledBtn]}
                  disabled={selectedProduct.stock <= 0}
                  onPress={() => {
                    addToCart(selectedProduct);
                    setDetailModalVisible(false);
                  }}
                >
                  <Text style={styles.saveButtonText}>🛒 เพิ่มลงตะกร้า</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={() => setDetailModalVisible(false)}>
                  <Text style={styles.cancelText}>ปิดหน้าต่าง</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* 🛒 Modal ตะกร้าสินค้า */}
      <Modal visible={cartModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🛒 ตะกร้าสินค้าของคุณ</Text>
            {cart.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#64748b', marginVertical: 20 }}>ยังไม่มีสินค้าในตะกร้า</Text>
            ) : (
              <ScrollView style={{ maxHeight: 250 }}>
                {cart.map((item) => (
                  <View key={item.id} style={styles.cartRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.name}</Text>
                      <Text style={{ color: '#2563eb' }}>
                        ฿{Number(item.price).toLocaleString()} x {item.cartQuantity}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                      <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>ลบ</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.totalRow}>
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>ราคารวมทั้งหมด:</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#16a34a' }}>
                ฿{calculateTotal().toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, cart.length === 0 && styles.disabledBtn]}
              disabled={cart.length === 0}
              onPress={() => setCheckoutModalVisible(true)}
            >
              <Text style={styles.saveButtonText}>ไปที่การชำระเงิน ➔</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setCartModalVisible(false)}>
              <Text style={styles.cancelText}>ปิดหน้าต่าง</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 📦 Modal ชำระเงิน & ยืนยันคำสั่งซื้อ */}
      <CheckoutModal
        visible={checkoutModalVisible}
        onClose={() => setCheckoutModalVisible(false)}
        cartItems={cart}
        totalAmount={calculateTotal()}
        userToken={token || ''}
        onSuccess={handleOrderSuccess}
      />

      {/* 👑 Modal จัดการคำสั่งซื้อ (สำหรับ Admin) */}
      <AdminOrdersModal
        visible={adminOrdersVisible}
        onClose={() => {
          setAdminOrdersVisible(false);
          fetchOrders();
        }}
        userToken={token || ''}
      />

      {/* 🔍 Modal ดูภาพขยายใหญ่ */}
      <Modal visible={!!zoomedImageUrl} animationType="fade" transparent={true}>
        <TouchableOpacity style={styles.fullScreenOverlay} activeOpacity={1} onPress={() => setZoomedImageUrl(null)}>
          <TouchableOpacity style={styles.closeZoomBtn} onPress={() => setZoomedImageUrl(null)}>
            <Text style={styles.closeZoomBtnText}>✕ ปิดหน้าต่าง</Text>
          </TouchableOpacity>
          {zoomedImageUrl && (
            <Image source={{ uri: zoomedImageUrl }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Modal>

      {/* 🧭 Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Text style={[styles.navIcon, activeTab === 'home' && styles.navIconActive]}>🏠</Text>
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>หน้าหลัก</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('inventory')}>
          <Text style={[styles.navIcon, activeTab === 'inventory' && styles.navIconActive]}>📦</Text>
          <Text style={[styles.navLabel, activeTab === 'inventory' && styles.navLabelActive]}>สินค้า</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('orders')}>
          <Text style={[styles.navIcon, activeTab === 'orders' && styles.navIconActive]}>📋</Text>
          <Text style={[styles.navLabel, activeTab === 'orders' && styles.navLabelActive]}>ออเดอร์</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
          <Text style={styles.navIcon}>🚪</Text>
          <Text style={styles.navLabel}>ออกจากระบบ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#0f172a', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSubtitle: { color: '#94a3b8', fontSize: 12 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  profileBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeAdmin: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#f59e0b' },
  badgeUser: { backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#38bdf8' },
  profileText: { fontSize: 11, fontWeight: 'bold' },
  profileTextAdmin: { color: '#b45309' },
  profileTextUser: { color: '#0369a1' },

  searchSection: { flexDirection: 'row', padding: 12, backgroundColor: '#1e293b', alignItems: 'center' },
  searchBar: { flex: 1, flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 10, alignItems: 'center', marginRight: 8 },
  searchIcon: { fontSize: 14, marginRight: 6 },
  searchInput: { flex: 1, color: '#ffffff', paddingVertical: 8, fontSize: 14 },
  clearSearchIcon: { color: '#94a3b8', fontSize: 16, paddingHorizontal: 4 },

  actionButtonGroup: { flexDirection: 'row', alignItems: 'center' },
  cartInlineBtn: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 9, borderRadius: 8, marginRight: 6 },
  cartInlineBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  addButton: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, marginRight: 6 },
  addButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  logoutBtnInline: { backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8 },
  logoutBtnInlineText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

  categoryFilterContainer: { backgroundColor: '#ffffff', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  categoryScroll: { paddingHorizontal: 12 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', marginRight: 8 },
  categoryChipActive: { backgroundColor: '#2563eb' },
  categoryChipText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  categoryChipTextActive: { color: '#ffffff' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { color: '#64748b', fontSize: 15 },
  productsList: { flex: 1, padding: 12 },
  productCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productIdTag: { fontSize: 12, fontWeight: 'bold', color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusActive: { backgroundColor: '#dcfce7' },
  statusOut: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 11, fontWeight: 'bold', color: '#166534' },
  productMainInfo: { flexDirection: 'row', alignItems: 'center' },
  productImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f1f5f9' },
  productDetails: { flex: 1, marginLeft: 12 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  priceText: { fontSize: 17, fontWeight: 'bold', color: '#2563eb', marginVertical: 2 },
  subText: { fontSize: 12, color: '#475569' },
  highlightText: { fontWeight: 'bold', color: '#0f172a' },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  editBtn: { backgroundColor: '#e0f2fe', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, flex: 1, alignItems: 'center' },
  editBtnText: { color: '#0369a1', fontWeight: 'bold', fontSize: 13 },
  detailBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginRight: 8, flex: 1, alignItems: 'center' },
  detailBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 13 },
  buyBtn: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, flex: 1, alignItems: 'center' },
  buyBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  disabledBtn: { backgroundColor: '#cbd5e1' },

  adminOrdersBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  adminOrdersBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },

  orderCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { fontWeight: 'bold', fontSize: 14, color: '#0f172a' },
  orderStatus: { color: '#16a34a', fontWeight: 'bold', fontSize: 13 },
  orderDetailText: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  orderItemsList: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, marginVertical: 6 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  orderTotal: { fontWeight: 'bold', color: '#0f172a', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContainer: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, textAlign: 'center' },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginTop: 8, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 8, fontSize: 14, backgroundColor: '#f8fafc' },
  categorySelectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  miniChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#f1f5f9' },
  miniChipActive: { backgroundColor: '#2563eb' },
  miniChipText: { fontSize: 12, color: '#475569' },
  miniChipTextActive: { color: '#ffffff' },
  saveButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  saveButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  deleteButton: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  deleteButtonText: { color: '#ef4444', fontWeight: 'bold', fontSize: 14 },
  cancelButton: { padding: 12, alignItems: 'center', marginTop: 4 },
  cancelText: { color: '#64748b', fontWeight: 'bold' },

  detailImage: { width: '100%', height: 180, borderRadius: 8, marginBottom: 12, resizeMode: 'cover' },
  detailPrice: { fontSize: 22, fontWeight: 'bold', color: '#2563eb', textAlign: 'center', marginBottom: 12 },
  detailInfoBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginBottom: 8 },
  detailInfoText: { fontSize: 13, color: '#334155', marginBottom: 4 },

  cartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },

  fullScreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '90%', height: '70%' },
  closeZoomBtn: { position: 'absolute', top: 40, right: 20, backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, zIndex: 10 },
  closeZoomBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 12 },

  bottomNav: { flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 8 },
  navItem: { flex: 1, alignItems: 'center' },
  navIcon: { fontSize: 18, opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  navLabelActive: { color: '#2563eb', fontWeight: 'bold' },
});