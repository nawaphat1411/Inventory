const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3025;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// 🛢️ Connection Pool เชื่อมต่อ DB ip_std6730202254 ตาม phpMyAdmin มหาวิทยาลัย
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'std6730202254',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ip_std6730202254',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ==========================================
// 🔐 1. AUTHENTICATION SYSTEM (ตาราง Nawaphat_Niemsri_users)
// ==========================================
const handleLogin = async (req, res) => {
  try {
    const { username, password } = req.body || {};
    console.log('🔑 Login Attempt:', { username, password });

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอก Username และ Password' });
    }

    // Query ตรวจสอบกับตาราง Nawaphat_Niemsri_users ใน phpMyAdmin
    const sql = 'SELECT * FROM Nawaphat_Niemsri_users WHERE username = ? AND password = ?';
    const [rows] = await pool.query(sql, [username.trim(), password.trim()]);

    if (rows.length > 0) {
      const user = rows[0];
      return res.status(200).json({
        success: true,
        message: 'เข้าสู่ระบบสำเร็จ',
        user: {
          id: user.user_id,
          username: user.username,
          role: user.role,
        },
        token: 'mock-jwt-token',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 👥 2. HR SYSTEM / EMPLOYEES (ตาราง Nawaphat_Niemsri_employees)
// ==========================================

// ดึงพนักงานทั้งหมด
const getEmployees = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Nawaphat_Niemsri_employees ORDER BY id DESC');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Fetch Employees Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// เพิ่มพนักงานใหม่
const addEmployee = async (req, res) => {
  try {
    const { name, position, salary } = req.body;
    if (!name || !position || salary === undefined || salary === null || salary === '') {
      return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const sql = 'INSERT INTO Nawaphat_Niemsri_employees (name, position, status, salary) VALUES (?, ?, ?, ?)';
    const [result] = await pool.query(sql, [name.trim(), position.trim(), 'Active', Number(salary)]);

    res.status(201).json({
      success: true,
      employee: { id: result.insertId, name, position, status: 'Active', salary: Number(salary) },
    });
  } catch (error) {
    console.error('Add Employee Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// สลับสถานะพนักงาน (Active / On Leave)
const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT status FROM Nawaphat_Niemsri_employees WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบพนักงาน' });
    }

    const newStatus = rows[0].status === 'Active' ? 'On Leave' : 'Active';
    await pool.query('UPDATE Nawaphat_Niemsri_employees SET status = ? WHERE id = ?', [newStatus, id]);

    res.status(200).json({ success: true, newStatus });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ลบพนักงานออกจาก MySQL จริง
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM Nawaphat_Niemsri_employees WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลพนักงานที่ต้องการลบ' });
    }

    res.status(200).json({ success: true, message: 'ลบพนักงานสำเร็จ' });
  } catch (error) {
    console.error('Delete Employee Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 🧮 3. SALARY ANALYTICS (1D K-Means Clustering)
// ==========================================
function kmeans1D(data, k = 3, maxIterations = 100) {
  if (data.length === 0) return [];
  if (data.length <= k) {
    return data.map((val, idx) => ({ group: `Tier ${idx + 1}`, centroid: val, count: 1 }));
  }

  const sorted = [...data].sort((a, b) => a - b);
  let centroids = [sorted[0], sorted[Math.floor(sorted.length / 2)], sorted[sorted.length - 1]];
  let clusters = Array.from({ length: k }, () => []);

  for (let iter = 0; iter < maxIterations; iter++) {
    clusters = Array.from({ length: k }, () => []);
    data.forEach((val) => {
      let minDistance = Infinity;
      let clusterIndex = 0;
      centroids.forEach((c, idx) => {
        const dist = Math.abs(val - c);
        if (dist < minDistance) {
          minDistance = dist;
          clusterIndex = idx;
        }
      });
      clusters[clusterIndex].push(val);
    });

    let newCentroids = clusters.map((cluster, idx) => {
      if (cluster.length === 0) return centroids[idx];
      const sum = cluster.reduce((acc, curr) => acc + curr, 0);
      return sum / cluster.length;
    });

    let isConverged = centroids.every((c, idx) => c === newCentroids[idx]);
    centroids = newCentroids;
    if (isConverged) break;
  }

  return clusters
    .map((cluster, idx) => ({
      centroid: Math.round(centroids[idx]),
      count: cluster.length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => a.centroid - b.centroid)
    .map((item, idx) => ({
      group: `Tier ${idx + 1}`,
      centroid: item.centroid,
      count: item.count,
    }));
}

const getClusters = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT salary FROM Nawaphat_Niemsri_employees');
    const salaries = rows.map((emp) => Number(emp.salary));
    const clusters = kmeans1D(salaries, 3);

    res.status(200).json({ success: true, clusters });
  } catch (error) {
    console.error('Cluster Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 📌 4. ROUTE MAPPINGS (รองรับทั้ง / และ /api/)
// ==========================================

// Login Routes
app.post('/login', handleLogin);
app.post('/api/login', handleLogin);

// Employee Routes (HR)
app.get('/employees', getEmployees);
app.get('/api/employees', getEmployees);

app.post('/employees', addEmployee);
app.post('/api/employees', addEmployee);

app.put('/employees/:id/status', toggleStatus);
app.put('/api/employees/:id/status', toggleStatus);

app.delete('/employees/:id', deleteEmployee);
app.delete('/api/employees/:id', deleteEmployee);

// Analytics Routes
app.get('/employees/salary-clusters', getClusters);
app.get('/api/employees/salary-clusters', getClusters);

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});