const express = require('express');
const cors = require('cors');
const db = require('./db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3025;
const JWT_SECRET = process.env.JWT_SECRET || 'my_super_secret_key_1234';

// ⚙️ ตั้งค่า CORS และรองรับไฟล์ขนาดใหญ่ (รูปสลิป Base64)
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// 🛡️ MIDDLEWARES
// ==========================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, error: 'Permission denied: Admins only' });
  }
};

// ==========================================
// 🔐 AUTH ROUTES
// ==========================================

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'กรุณากรอก Username และ Password ให้ครบถ้วน' });
    }

    const [existingUser] = await db.query('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว' });
    }

    const sql = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
    await db.query(sql, [username.trim(), password.trim(), 'user']);

    res.status(201).json({ success: true, message: 'สมัครสมาชิกสำเร็จ' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'กรุณากรอก Username และ Password' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE username = ? AND password = ?', [
      username.trim(),
      password.trim(),
    ]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = rows[0];
    const userId = user.user_id || user.id;

    const token = jwt.sign(
      { user_id: userId, id: userId, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: {
        user_id: userId,
        id: userId,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// ==========================================
// 📦 PRODUCT ROUTES
// ==========================================

app.get('/api/products', async (req, res) => {
  try {
    const { q } = req.query;
    let sql = 'SELECT * FROM inventory';
    let params = [];

    if (q && q.trim() !== '') {
      sql += ' WHERE name LIKE ? OR category LIKE ? OR location LIKE ?';
      const searchTerm = `%${q.trim()}%`;
      params = [searchTerm, searchTerm, searchTerm];
    }

    sql += ' ORDER BY id ASC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM inventory WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, stock, price, category, location, status, image } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const sql = `INSERT INTO inventory (name, stock, price, category, location, status, image) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await db.query(sql, [
      name,
      Number(stock) || 0,
      Number(price) || 0,
      category || null,
      location || null,
      status || 'Active',
      image || null,
    ]);

    res.status(201).json({ success: true, productId: result.insertId });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, stock, price, category, location, status, image } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });

    const sql = `UPDATE inventory SET name = ?, stock = ?, price = ?, category = ?, location = ?, status = ?, image = ? WHERE id = ?`;
    const [result] = await db.query(sql, [
      name,
      Number(stock) || 0,
      Number(price) || 0,
      category || null,
      location || null,
      status || 'Active',
      image || null,
      id,
    ]);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM inventory WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==========================================
// 🛒 ORDER ROUTES (สั่งซื้อ & ตัดสต๊อกจริง)
// ==========================================

app.post('/api/orders', authenticateToken, async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { customerName, phone, address, slipImage, items, totalAmount } = req.body;
    const userId = req.user.user_id || req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'ไม่มีสินค้าในตะกร้า' });
    }

    await connection.beginTransaction();

    for (const item of items) {
      const [rows] = await connection.query('SELECT stock, name FROM inventory WHERE id = ?', [item.id]);
      if (rows.length === 0) {
        await connection.rollback();
        return res.status(404).json({ success: false, error: `ไม่พบสินค้า ID: ${item.id}` });
      }

      const currentStock = rows[0].stock;
      if (currentStock < item.cartQuantity) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          error: `สินค้า "${rows[0].name}" มีสต๊อกไม่พอ (เหลือ ${currentStock} ชิ้น)`,
        });
      }
    }

    const orderSql = `
      INSERT INTO orders (user_id, customer_name, phone, address, slip_image, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'รอการตรวจสอบ')
    `;
    const [orderResult] = await connection.query(orderSql, [
      userId,
      customerName.trim(),
      phone.trim(),
      address.trim(),
      slipImage || null,
      Number(totalAmount) || 0,
    ]);

    const orderId = orderResult.insertId;

    for (const item of items) {
      const itemSql = `
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
        VALUES (?, ?, ?, ?, ?)
      `;
      await connection.query(itemSql, [
        orderId,
        item.id,
        item.name,
        Number(item.price) || 0,
        item.cartQuantity,
      ]);

      const updateStockSql = `UPDATE inventory SET stock = stock - ? WHERE id = ?`;
      await connection.query(updateStockSql, [item.cartQuantity, item.id]);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'สั่งซื้อสำเร็จและตัดสต๊อกเรียบร้อยแล้ว',
      orderId,
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create Order Error:', error);
    res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ' });
  } finally {
    connection.release();
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    let ordersSql = `
      SELECT o.id, o.user_id, o.customer_name AS customerName, o.phone, o.address, 
             o.slip_image AS slipImage, o.total_amount AS totalAmount, o.status, o.created_at AS createdAt
      FROM orders o
    `;
    let params = [];

    // ✏️ เช็ก role และกรองเฉพาะ user_id ของผู้ใช้ที่ล็อกอินอยู่
    if (req.user.role !== 'admin') {
      const currentUserId = req.user.user_id || req.user.id;
      ordersSql += ` WHERE o.user_id = ?`;
      params.push(currentUserId);
    }

    ordersSql += ` ORDER BY o.id DESC`;

    const [orders] = await db.query(ordersSql, params);

    for (let order of orders) {
      const [items] = await db.query(
        `SELECT product_id AS id, product_name AS name, price, quantity AS cartQuantity FROM order_items WHERE order_id = ?`,
        [order.id]
      );
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    console.error('Fetch Orders Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

// ==========================================
// 🛠️ ADMIN ORDER STATUS UPDATE
// ==========================================

app.put('/api/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'กรุณาระบุสถานะ' });
    }

    const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'ไม่พบคำสั่งซื้อนี้' });
    }

    res.json({ success: true, message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ', orderId: Number(id), status });
  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
  }
});

app.patch('/api/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'กรุณาระบุสถานะ' });
    }

    const [result] = await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'ไม่พบคำสั่งซื้อนี้' });
    }

    res.json({ success: true, message: 'อัปเดตสถานะคำสั่งซื้อสำเร็จ', orderId: Number(id), status });
  } catch (error) {
    console.error('Patch Order Status Error:', error);
    res.status(500).json({ success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
  }
});

// ==========================================
// 🚀 LISTEN
// ==========================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});