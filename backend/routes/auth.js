// ===== AUTHENTICATION ROUTES =====
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { dbRouter } = require('../server');

// ===== LOGIN =====
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập và mật khẩu không được để trống'
      });
    }
    
    // Tìm user trong tất cả databases
    let user = null;
    const allDatabases = dbRouter.getAllDatabases();
    
    for (const db of allDatabases) {
      try {
        const [users] = await db.execute(
          'SELECT * FROM users WHERE username = ?',
          [username]
        );
        
        if (users.length > 0) {
          user = users[0];
          break;
        }
      } catch (error) {
        console.error(`Error finding user in database:`, error);
      }
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }
    
    // Kiểm tra mật khẩu
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng'
      });
    }
    
    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        region: user.region
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          region: user.region
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi đăng nhập',
      error: error.message 
    });
  }
});

// ===== REGISTER =====
router.post('/register', async (req, res) => {
  try {
    const { username, password, role = 'staff', region = 'hanoi' } = req.body;
    
    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập và mật khẩu không được để trống'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }
    
    // Kiểm tra username đã tồn tại chưa
    const allDatabases = dbRouter.getAllDatabases();
    let existingUser = null;
    
    for (const db of allDatabases) {
      try {
        const [users] = await db.execute(
          'SELECT id FROM users WHERE username = ?',
          [username]
        );
        
        if (users.length > 0) {
          existingUser = users[0];
          break;
        }
      } catch (error) {
        console.error(`Error checking username in database:`, error);
      }
    }
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập đã tồn tại'
      });
    }
    
    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Xác định database theo region
    const db = dbRouter.getDatabaseByRegion(region);
    
    // Tạo user mới
    const [result] = await db.execute(`
      INSERT INTO users (username, password, role, region)
      VALUES (?, ?, ?, ?)
    `, [username, hashedPassword, role, region]);
    
    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: result.insertId, 
        username, 
        role,
        region
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        token,
        user: {
          id: result.insertId,
          username,
          role,
          region
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi đăng ký',
      error: error.message 
    });
  }
});

// ===== GET PROFILE =====
router.get('/profile', async (req, res) => {
  try {
    const user = req.user; // Từ middleware authenticateToken
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        region: user.region
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thông tin profile',
      error: error.message 
    });
  }
});

// ===== UPDATE PROFILE =====
router.put('/profile', async (req, res) => {
  try {
    const { username, role, region } = req.body;
    const userId = req.user.id;
    
    // Tìm user trong tất cả databases
    let user = null;
    let targetDb = null;
    const allDatabases = dbRouter.getAllDatabases();
    
    for (const db of allDatabases) {
      try {
        const [users] = await db.execute(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        );
        
        if (users.length > 0) {
          user = users[0];
          targetDb = db;
          break;
        }
      } catch (error) {
        console.error(`Error finding user in database:`, error);
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    
    // Cập nhật thông tin
    const updateFields = [];
    const updateValues = [];
    
    if (username && username !== user.username) {
      // Kiểm tra username mới có bị trùng không
      let usernameExists = false;
      for (const db of allDatabases) {
        try {
          const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?',
            [username, userId]
          );
          
          if (existingUsers.length > 0) {
            usernameExists = true;
            break;
          }
        } catch (error) {
          console.error(`Error checking username in database:`, error);
        }
      }
      
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Tên đăng nhập đã tồn tại'
        });
      }
      
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    
    if (role && role !== user.role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    
    if (region && region !== user.region) {
      updateFields.push('region = ?');
      updateValues.push(region);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Không có dữ liệu để cập nhật'
      });
    }
    
    updateValues.push(userId);
    
    await targetDb.execute(
      `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );
    
    // Lấy thông tin user đã cập nhật
    const [updatedUser] = await targetDb.execute(
      'SELECT id, username, role, region FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({
      success: true,
      message: 'Cập nhật profile thành công',
      data: updatedUser[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi cập nhật profile',
      error: error.message 
    });
  }
});

// ===== CHANGE PASSWORD =====
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại và mật khẩu mới không được để trống'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }
    
    // Tìm user trong tất cả databases
    let user = null;
    let targetDb = null;
    const allDatabases = dbRouter.getAllDatabases();
    
    for (const db of allDatabases) {
      try {
        const [users] = await db.execute(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        );
        
        if (users.length > 0) {
          user = users[0];
          targetDb = db;
          break;
        }
      } catch (error) {
        console.error(`Error finding user in database:`, error);
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy user'
      });
    }
    
    // Kiểm tra mật khẩu hiện tại
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng'
      });
    }
    
    // Mã hóa mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    // Cập nhật mật khẩu
    await targetDb.execute(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedNewPassword, userId]
    );
    
    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi đổi mật khẩu',
      error: error.message 
    });
  }
});

// ===== LOGOUT =====
router.post('/logout', (req, res) => {
  // Với JWT, logout chỉ cần xóa token ở client
  // Server không cần làm gì đặc biệt
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

// ===== VERIFY TOKEN =====
router.get('/verify', async (req, res) => {
  try {
    const user = req.user; // Từ middleware authenticateToken
    
    res.json({
      success: true,
      message: 'Token hợp lệ',
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        region: user.region
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi xác thực token',
      error: error.message 
    });
  }
});

module.exports = router;