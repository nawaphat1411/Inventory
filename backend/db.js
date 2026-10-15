const mysql = require('mysql2/promise');
require('dotenv').config();

// สร้าง Connection Pool เชื่อมต่อ MySQL มหาวิทยาลัย
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'std6730202254',
  password: process.env.DB_PASSWORD || '', // หากอาจารย์มีกำหนด password ให้ใส่ในเครื่องหมายคำพูด
  database: process.env.DB_NAME || 'ip_std6730202254',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;