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
  user_id?: number;
  username: string;
  role?: string;
}

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);

  // ระบบเข้าสู่ระบบ (ตรงตามข้อสอบ Phase 1)
  const handleLogin = async () => {
    const trimmedUsername = usernameInput.trim();
    const trimmedPassword = passwordInput.trim();

    if (!trimmedUsername || !trimmedPassword) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password: trimmedPassword }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        Alert.alert('Success', 'Login successful');
        onLoginSuccess(
          data.token || 'mock-jwt-token',
          data.user || { username: trimmedUsername, role: 'admin' }
        );
      } else {
        Alert.alert('Login Failed', data.message || data.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Cannot connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <View style={styles.loginBox}>
        <Text style={styles.loginIcon}>👥</Text>
        <Text style={styles.loginTitle}>HR Manager System</Text>
        <Text style={styles.loginSubTitle}>Please login to continue</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="admin"
          value={usernameInput}
          onChangeText={setUsernameInput}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="password123"
          value={passwordInput}
          onChangeText={setPasswordInput}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.mainBtn}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.mainBtnText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa' },
  loginBox: { width: '85%', maxWidth: 360, backgroundColor: '#ffffff', padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#dee2e6', elevation: 3 },
  loginIcon: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
  loginTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#343a40' },
  loginSubTitle: { fontSize: 13, textAlign: 'center', color: '#6c757d', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#495057', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ced4da', borderRadius: 6, padding: 10, marginBottom: 14, fontSize: 14 },
  mainBtn: { backgroundColor: '#007bff', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  mainBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
});