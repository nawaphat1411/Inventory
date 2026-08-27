// HomeScreen.tsx
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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

interface HomeScreenProps {
  products: Product[];
  onNavigateToProducts: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectCategory?: (category: string) => void;
}

export default function HomeScreen({
  products,
  onNavigateToProducts,
  onSelectProduct,
  onAddToCart,
  onSelectCategory,
}: HomeScreenProps) {
  // สุ่ม/คัดเลือกสินค้าแนะนำ 4 รายการแรก
  const featuredProducts = products.slice(0, 4);

  const categories = [
    { id: '1', name: 'เก้าอี้ทำงาน', icon: '🪑', count: '12 รายการ' },
    { id: '2', name: 'เก้าอี้เกมมิ่ง', icon: '🎮', count: '8 รายการ' },
    { id: '3', name: 'เก้าอี้โซฟา', icon: '🛋️', count: '6 รายการ' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        
        {/* 🌟 1. Hero Banner Header */}
        <View style={styles.heroSection}>
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTag}>🔥 ส่วนลดต้อนรับสมาชิกใหม่ 15%</Text>
            <Text style={styles.heroTitle}>เก้าอี้เพื่อสุขภาพ{'\n'}นั่งสบาย ไร้ความเมื่อยล้า</Text>
            <Text style={styles.heroSubtitle}>
              ออกแบบตามหลัก Ergonomics ช่วยปรับสรีระและเพิ่มประสิทธิภาพการทำงาน
            </Text>
            <TouchableOpacity style={styles.heroBtn} onPress={onNavigateToProducts}>
              <Text style={styles.heroBtnText}>ช้อปเลย ตอนนี้ ➔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🚀 2. จุดเด่นของร้าน (Highlights) */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🚚</Text>
            <Text style={styles.featureTitle}>ส่งฟรีทั่วไทย</Text>
            <Text style={styles.featureDesc}>เมื่อช้อปครบ 1,500.-</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🛡️</Text>
            <Text style={styles.featureTitle}>ประกัน 3 ปี</Text>
            <Text style={styles.featureDesc}>ดูแลโครงสร้างฟรี</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💳</Text>
            <Text style={styles.featureTitle}>ผ่อน 0%</Text>
            <Text style={styles.featureDesc}>นานสูงสุด 10 เดือน</Text>
          </View>
        </View>

        {/* 🏷️ 3. หมวดหมู่สินค้ายอดนิยม */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>หมวดหมู่สินค้ายอดนิยม</Text>
        </View>
        <View style={styles.categoryGrid}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.categoryCard}
              onPress={() => {
                if (onSelectCategory) onSelectCategory(item.name);
                onNavigateToProducts();
              }}
            >
              <Text style={styles.categoryIcon}>{item.icon}</Text>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Text style={styles.categoryCount}>{item.count}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 🛍️ 4. สินค้าแนะนำประจำสัปดาห์ */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.sectionTitle}>🔥 สินค้าแนะนำประจำสัปดาห์</Text>
          <TouchableOpacity onPress={onNavigateToProducts}>
            <Text style={styles.seeAllText}>ดูทั้งหมด ➔</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.featuredCard}
                onPress={() => onSelectProduct(product)}
              >
                <Image
                  source={{ uri: product.image || 'https://via.placeholder.com/150' }}
                  style={styles.featuredImage}
                />
                <View style={styles.featuredBody}>
                  <Text style={styles.featuredCategory}>{product.category || 'เก้าอี้'}</Text>
                  <Text style={styles.featuredName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.featuredPrice}>
                    ฿{Number(product.price || 0).toLocaleString()}
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.quickCartBtn, product.stock <= 0 && styles.disabledBtn]}
                    onPress={() => onAddToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    <Text style={styles.quickCartText}>
                      {product.stock > 0 ? '+ ใส่ตะกร้า' : 'สินค้าหมด'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>กำลังโหลดข้อมูลสินค้าแนะนำ...</Text>
          )}
        </ScrollView>

        {/* 🎁 5. Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTag}>SPECIAL OFFER</Text>
            <Text style={styles.promoTitle}>ทดลองนั่งฟรี 14 วัน!</Text>
            <Text style={styles.promoDesc}>ไม่พอใจยินดีคืนเงินเต็มจำนวน เปลี่ยนแปลงเพื่อสุขภาพที่ดีกว่าได้วันนี้</Text>
          </View>
          <Text style={styles.promoEmoji}>✨</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Hero Section
  heroSection: {
    backgroundColor: '#0f172a',
    padding: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
  },
  heroTextContainer: { alignItems: 'flex-start' },
  heroTag: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 32,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  heroBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

  // Features Highlight
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  featureItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  featureIcon: { fontSize: 24, marginBottom: 4 },
  featureTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  featureDesc: { fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'center' },

  // Categories
  sectionHeader: { paddingHorizontal: 16, marginBottom: 10 },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a' },
  seeAllText: { fontSize: 13, color: '#2563eb', fontWeight: '600' },

  categoryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryIcon: { fontSize: 28, marginBottom: 6 },
  categoryName: { fontSize: 12, fontWeight: 'bold', color: '#1e293b' },
  categoryCount: { fontSize: 10, color: '#94a3b8', marginTop: 2 },

  // Horizontal Scroll Products
  horizontalScroll: { paddingLeft: 16, paddingRight: 8 },
  featuredCard: {
    width: 160,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 10,
  },
  featuredImage: { width: '100%', height: 130, backgroundColor: '#f1f5f9' },
  featuredBody: { padding: 10 },
  featuredCategory: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  featuredName: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginVertical: 2 },
  featuredPrice: { fontSize: 15, fontWeight: 'bold', color: '#2563eb', marginBottom: 8 },
  quickCartBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  disabledBtn: { backgroundColor: '#cbd5e1' },
  quickCartText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  emptyText: { color: '#94a3b8', padding: 16 },

  // Promo Banner
  promoBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoTag: { fontSize: 10, fontWeight: 'bold', color: '#2563eb' },
  promoTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', marginVertical: 2 },
  promoDesc: { fontSize: 11, color: '#3b82f6' },
  promoEmoji: { fontSize: 40, marginLeft: 10 },
});