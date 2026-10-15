import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3025/api';

interface Employee {
  id: string | number;
  name: string;
  position: string;
  status: 'Active' | 'On Leave';
  salary: number;
}

interface SalaryCluster {
  group: string;
  centroid: number;
  count: number;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [name, setName] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [salary, setSalary] = useState<string>('');

  const [clusters, setClusters] = useState<SalaryCluster[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchEmployees();
    }
  }, [isLoggedIn]);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      if (Platform.OS === 'web') window.alert('กรุณากรอก Username และ Password');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setIsLoggedIn(true);
      } else {
        if (Platform.OS === 'web') window.alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      if (Platform.OS === 'web') window.alert('ไม่สามารถเชื่อมต่อ Server ได้');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setEmployees([]);
    setClusters([]);
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/employees`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setEmployees(data);
      }
    } catch (error: any) {
      console.error('Fetch Employees Error:', error);
      if (Platform.OS === 'web') {
        window.alert(`เกิดข้อผิดพลาดในการดึงข้อมูล: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!name.trim() || !position.trim() || !salary.trim()) {
      if (Platform.OS === 'web') window.alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          position: position.trim(),
          salary: Number(salary),
        }),
      });

      if (response.ok) {
        setName('');
        setPosition('');
        setSalary('');
        fetchEmployees();
        if (Platform.OS === 'web') window.alert('✨ เพิ่มพนักงานลงระบบสำเร็จ!');
      }
    } catch (error: any) {
      console.error('Add Employee Error:', error);
    }
  };

  const handleToggleStatus = async (id: string | number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}/status`, {
        method: 'PUT',
      });
      if (response.ok) fetchEmployees();
    } catch (error) {
      console.error('Toggle Error:', error);
    }
  };

  const executeDelete = async (id: string | number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) fetchEmployees();
    } catch (error) {
      console.error('Delete Error:', error);
    }
  };

  const handleDeleteEmployee = (id: string | number) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้ออกจากระบบ?');
      if (confirmed) executeDelete(id);
    } else {
      Alert.alert('ยืนยันการลบ', 'คุณแน่ใจหรือไม่ว่าต้องการลบพนักงานคนนี้?', [
        { text: 'ยกเลิก', style: 'cancel' },
        { text: 'ลบข้อมูล', style: 'destructive', onPress: () => executeDelete(id) },
      ]);
    }
  };

  const handleAnalyzeSalary = async () => {
    setLoadingAnalytics(true);
    setClusters([]);
    try {
      const response = await fetch(`${API_BASE_URL}/employees/salary-clusters`);
      const data = await response.json();
      if (data.success && Array.isArray(data.clusters)) {
        setClusters(data.clusters);
      }
    } catch (error: any) {
      console.error('Analytics Error:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // -------------------------------------------------------------
  // 🔐 SCREEN 1: DARK LOGIN UI
  // -------------------------------------------------------------
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.loginWrapper}>
        <View style={styles.loginCard}>
          <View style={styles.logoBadge}>
            <Text style={{ fontSize: 32 }}>⚡</Text>
          </View>

          <Text style={styles.loginTitle}>Nawaphat HR System</Text>
          <Text style={styles.loginSubTitle}>Sign in to access dark console</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. admin"
              placeholderTextColor="#64748B"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#64748B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loginLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loginLoading}
          >
            {loginLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryBtnText}>Authenticate</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // 📊 SCREEN 2: DARK DASHBOARD UI
  // -------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navBrand}>
          <View style={styles.navLogo}>
            <Text style={{ fontSize: 18, color: '#FFF' }}>💎</Text>
          </View>
          <View>
            <Text style={styles.navTitle}>Nawaphat_Niemsri</Text>
            <Text style={styles.navSubTitle}>HR & Salary Analytics Console</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Add Employee Form */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>➕ Add New Employee</Text>
            <Text style={styles.cardHeaderSub}>Create employee entry in MySQL database</Text>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="John Doe"
                placeholderTextColor="#64748B"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Position</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Software Engineer"
                placeholderTextColor="#64748B"
                value={position}
                onChangeText={setPosition}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Salary (THB)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="45000"
              placeholderTextColor="#64748B"
              value={salary}
              onChangeText={setSalary}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleAddEmployee}>
            <Text style={styles.primaryBtnText}>+ Save Employee Record</Text>
          </TouchableOpacity>
        </View>

        {/* Section 2: Salary Analytics (K-Means) */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderTitle}>🧮 Salary Structure Analytics</Text>
            <Text style={styles.cardHeaderSub}>1D K-Means Clustering Algorithm Analysis</Text>
          </View>

          <TouchableOpacity style={styles.analyticsBtn} onPress={handleAnalyzeSalary}>
            <Text style={styles.analyticsBtnText}>⚡ Run K-Means Analysis</Text>
          </TouchableOpacity>

          {loadingAnalytics && (
            <View style={styles.loaderBox}>
              <ActivityIndicator size="large" color="#8B5CF6" />
              <Text style={styles.loaderText}>Processing clustering algorithms...</Text>
            </View>
          )}

          {clusters.length > 0 && (
            <View style={styles.clusterGrid}>
              {clusters.map((tier, idx) => (
                <View key={idx} style={[styles.clusterBox, { borderLeftColor: getTierColor(idx) }]}>
                  <View style={styles.clusterHeader}>
                    <Text style={[styles.clusterTierName, { color: getTierColor(idx) }]}>{tier.group}</Text>
                    <View style={styles.badgeCount}>
                      <Text style={styles.badgeCountText}>{tier.count} Staffs</Text>
                    </View>
                  </View>

                  <Text style={styles.clusterCentroidLabel}>Centroid / Avg Base Salary</Text>
                  <Text style={styles.clusterCentroidValue}>฿{tier.centroid.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 3: Employee Directory */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.sectionTitle}>Employee Directory</Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{employees.length} Records</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#8B5CF6" />
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>👥</Text>
            <Text style={styles.emptyText}>No records found in MySQL database</Text>
          </View>
        ) : (
          employees.map((emp) => {
            const isActive = emp.status === 'Active';
            return (
              <View key={emp.id} style={styles.empCard}>
                <View style={styles.empAvatar}>
                  <Text style={styles.avatarText}>{emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}</Text>
                </View>

                <View style={styles.empInfo}>
                  <Text style={styles.empName}>{emp.name}</Text>
                  <Text style={styles.empPos}>{emp.position}</Text>
                  <Text style={styles.empSalary}>฿{Number(emp.salary).toLocaleString()}</Text>

                  <View style={[styles.statusPill, isActive ? styles.statusActive : styles.statusLeave]}>
                    <View style={[styles.statusDot, { backgroundColor: isActive ? '#10B981' : '#F59E0B' }]} />
                    <Text style={[styles.statusText, { color: isActive ? '#34D399' : '#FBBF24' }]}>
                      {emp.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionCol}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.toggleBtn]}
                    onPress={() => handleToggleStatus(emp.id)}
                  >
                    <Text style={styles.toggleBtnText}>Toggle</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteEmployee(emp.id)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getTierColor(index: number) {
  const colors = ['#10B981', '#3B82F6', '#8B5CF6'];
  return colors[index % colors.length];
}

// -------------------------------------------------------------
// 🎨 DARK THEME STYLESHEET
// -------------------------------------------------------------
const styles = StyleSheet.create({
  loginWrapper: {
    flex: 1,
    backgroundColor: '#090D16',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loginCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#312E81',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 6,
  },
  loginSubTitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 28,
  },

  // Main Layout
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  navbar: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  navSubTitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  logoutButton: {
    backgroundColor: '#991B1B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FECACA',
    fontSize: 12,
    fontWeight: '700',
  },

  mainContent: {
    padding: 20,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  cardHeaderSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Form
  formRow: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#F8FAFC',
  },
  primaryBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Analytics K-Means
  analyticsBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  analyticsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  loaderBox: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 8,
    fontSize: 13,
    color: '#94A3B8',
  },
  clusterGrid: {
    marginTop: 16,
    gap: 10,
  },
  clusterBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 5,
  },
  clusterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  clusterTierName: {
    fontSize: 15,
    fontWeight: '800',
  },
  badgeCount: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  clusterCentroidLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  clusterCentroidValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },

  // Directory List
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  totalBadge: {
    backgroundColor: '#312E81',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C7D2FE',
  },

  empCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  empAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#312E81',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#A5B4FC',
  },
  empInfo: {
    flex: 1,
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  empPos: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  empSalary: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34D399',
    marginBottom: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  statusLeave: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Action Buttons
  actionCol: {
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleBtn: {
    backgroundColor: '#334155',
  },
  toggleBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteBtnText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});