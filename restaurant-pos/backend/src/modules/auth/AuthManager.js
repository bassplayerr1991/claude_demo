/**
 * AuthManager Module
 * Handles user authentication and authorization
 */
const User = require('../../models/User');

class AuthManager {
  constructor() {
    this.users = new Map();
    this.sessions = new Map(); // sessionToken -> userId
    this.initializeDefaultUsers();
  }

  // Initialize default users
  initializeDefaultUsers() {
    const defaultUsers = [
      {
        username: 'yonetici',
        password: 'admin123', // In production, use hashed passwords
        fullName: 'Yönetici',
        role: 'yönetici'
      },
      {
        username: 'garson1',
        password: 'garson123',
        fullName: 'Ahmet Yılmaz',
        role: 'garson'
      },
      {
        username: 'garson2',
        password: 'garson123',
        fullName: 'Ayşe Demir',
        role: 'garson'
      },
      {
        username: 'garson3',
        password: 'garson123',
        fullName: 'Mehmet Kaya',
        role: 'garson'
      }
    ];

    defaultUsers.forEach(userData => {
      const user = new User(userData);
      this.users.set(user.id, user);
    });
  }

  // Login
  login(username, password) {
    // Find user by username
    const user = Array.from(this.users.values()).find(
      u => u.username === username && u.active
    );

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Check password (in production, compare hashed passwords)
    if (user.password !== password) {
      throw new Error('Şifre hatalı');
    }

    // Update last login
    user.updateLastLogin();

    // Generate session token
    const sessionToken = this.generateSessionToken();
    this.sessions.set(sessionToken, user.id);

    return {
      token: sessionToken,
      user: user.toJSON(false),
      expiresIn: 8 * 60 * 60 // 8 hours
    };
  }

  // Logout
  logout(sessionToken) {
    this.sessions.delete(sessionToken);
    return { success: true, message: 'Çıkış yapıldı' };
  }

  // Verify session token
  verifyToken(sessionToken) {
    const userId = this.sessions.get(sessionToken);
    if (!userId) {
      return null;
    }

    const user = this.users.get(userId);
    return user?.active ? user : null;
  }

  // Generate session token
  generateSessionToken() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
  }

  // Check permission
  checkPermission(sessionToken, permission) {
    const user = this.verifyToken(sessionToken);
    if (!user) {
      throw new Error('Oturum geçersiz');
    }

    if (!user.hasPermission(permission)) {
      throw new Error('Bu işlem için yetkiniz yok');
    }

    return user;
  }

  // User Management (only for yönetici)
  createUser(sessionToken, userData) {
    const admin = this.checkPermission(sessionToken, 'users:write');

    // Check if username already exists
    const exists = Array.from(this.users.values()).some(
      u => u.username === userData.username
    );

    if (exists) {
      throw new Error('Bu kullanıcı adı zaten kullanılıyor');
    }

    const user = new User(userData);
    this.users.set(user.id, user);
    return user.toJSON(false);
  }

  updateUser(sessionToken, userId, updates) {
    this.checkPermission(sessionToken, 'users:write');

    const user = this.users.get(userId);
    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    Object.assign(user, updates);
    return user.toJSON(false);
  }

  deleteUser(sessionToken, userId) {
    this.checkPermission(sessionToken, 'users:write');

    const user = this.users.get(userId);
    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    user.active = false;
    return { success: true, message: 'Kullanıcı silindi' };
  }

  getAllUsers(sessionToken) {
    this.checkPermission(sessionToken, 'users:read');

    return Array.from(this.users.values())
      .filter(u => u.active)
      .map(u => u.toJSON(false));
  }

  getUsersByRole(role) {
    return Array.from(this.users.values())
      .filter(u => u.role === role && u.active)
      .map(u => u.toJSON(false));
  }

  // Get all garson (waiters)
  getAllWaiters() {
    return this.getUsersByRole('garson');
  }

  // Change password
  changePassword(sessionToken, oldPassword, newPassword) {
    const user = this.verifyToken(sessionToken);
    if (!user) {
      throw new Error('Oturum geçersiz');
    }

    if (user.password !== oldPassword) {
      throw new Error('Mevcut şifre hatalı');
    }

    user.password = newPassword;
    return { success: true, message: 'Şifre değiştirildi' };
  }

  // Get current user info
  getCurrentUser(sessionToken) {
    const user = this.verifyToken(sessionToken);
    if (!user) {
      throw new Error('Oturum geçersiz');
    }
    return user.toJSON(false);
  }
}

module.exports = AuthManager;
