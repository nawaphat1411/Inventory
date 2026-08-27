import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const API_BASE_URL = 'http://119.59.102.161:3025/api';

interface User {
  user_id: number;
  username: string;
  role: 'admin' | 'user';
}

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isRegisterMode, setIsRegisterMode] = useState(false); // สลับหน้า เข้าสู่ระบบ / สมัครสมาชิก
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // ระบบ เข้าสู่ระบบ
  const handleLogin = async () => {
    if (!usernameInput.trim() || !passwordInput.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอก Username และ Password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim(), password: passwordInput.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        Alert.alert('ยินดีต้อนรับ', `เข้าสู่ระบบสำเร็จ (${data.user.role})`);
        onLoginSuccess(data.token, data.user);
      } else {
        Alert.alert('เข้าสู่ระบบล้มเหลว', data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับ Server ได้');
    } finally {
      setLoading(false);
    }
  };

  // ระบบ สมัครสมาชิก (ลูกค้าใหม่)
  const handleRegister = async () => {
    if (!usernameInput.trim() || !passwordInput.trim() || !confirmPassword.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    if (passwordInput !== confirmPassword) {
      Alert.alert('แจ้งเตือน', 'รหัสผ่านยืนยันไม่ตรงกัน');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput.trim(), password: passwordInput.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        Alert.alert('สำเร็จ', 'สมัครสมาชิกเรียบร้อยแล้ว สามารถเข้าสู่ระบบได้ทันที');
        setIsRegisterMode(false);
        setPasswordInput('');
        setConfirmPassword('');
      } else {
        Alert.alert('สมัครสมาชิกล้มเหลว', data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อกับ Server ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <View style={styles.loginBox}>
        <Text style={styles.loginIcon}>🪑</Text>
        <Text style={styles.loginTitle}>CHAIR SHOP</Text>
        <Text style={styles.loginSubTitle}>
          {isRegisterMode ? 'สมัครสมาชิกใหม่สำหรับลูกค้า' : 'เข้าสู่ระบบร้านขายเก้าอี้'}
        </Text>

        <Text style={styles.label}>ชื่อผู้ใช้งาน</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={usernameInput}
          onChangeText={setUsernameInput}
          autoCapitalize="none"
        />

        <Text style={styles.label}>รหัสผ่าน</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={passwordInput}
          onChangeText={setPasswordInput}
          secureTextEntry
        />

        {/* ช่องยืนยันรหัสผ่าน (แสดงเฉพาะตอนกดสมัครสมาชิก) */}
        {isRegisterMode && (
          <>
            <Text style={styles.label}>ยืนยันรหัสผ่าน</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </>
        )}

        {/* ปุ่มหลัก */}
        <TouchableOpacity
          style={[styles.mainBtn, isRegisterMode && styles.registerBtnColor]}
          onPress={isRegisterMode ? handleRegister : handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.mainBtnText}>{isRegisterMode ? 'ยืนยันการสมัครสมาชิก' : 'เข้าสู่ระบบ'}</Text>
          )}
        </TouchableOpacity>

        {/* ปุ่มสลับโหมด เข้าสู่ระบบ / สมัครสมาชิก */}
        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => {
            setIsRegisterMode(!isRegisterMode);
            setConfirmPassword('');
          }}
        >
          <Text style={styles.switchBtnText}>
            {isRegisterMode ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'ยังไม่มีบัญชี? สมัครสมาชิกที่นี่'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loginBox: { width: '85%', maxWidth: 360, backgroundColor: '#ffffff', padding: 24, borderRadius: 16, elevation: 5 },
  loginIcon: { fontSize: 48, textAlign: 'center', marginBottom: 4 },
  loginTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#0f172a', letterSpacing: 1 },
  loginSubTitle: { fontSize: 13, textAlign: 'center', color: '#64748b', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#475569', marginBottom: 4 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 14 },
  mainBtn: { backgroundColor: '#2563eb', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  registerBtnColor: { backgroundColor: '#16a34a' },
  mainBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  switchBtn: { marginTop: 14, alignItems: 'center' },
  switchBtnText: { color: '#2563eb', fontSize: 13, fontWeight: '600' },
});