/**
 * User Model
 * Represents a user (Garson or Yönetici) in the system
 */
class User {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.username = data.username;
    this.password = data.password; // In production, use hashed passwords
    this.fullName = data.fullName;
    this.role = data.role; // 'garson' or 'yönetici'
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.createdAt || new Date();
    this.lastLogin = data.lastLogin || null;
  }

  generateId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Check if user has permission to access a resource
  hasPermission(resource) {
    const permissions = {
      'garson': [
        'menu:read',
        'orders:create',
        'orders:read',
        'kitchen:read',
        'tables:read',
        'tables:update'
      ],
      'yönetici': [
        'menu:read',
        'menu:write',
        'orders:create',
        'orders:read',
        'orders:write',
        'kitchen:read',
        'kitchen:write',
        'inventory:read',
        'inventory:write',
        'reports:read',
        'reports:write',
        'tables:read',
        'tables:write',
        'users:read',
        'users:write'
      ]
    };

    return permissions[this.role]?.includes(resource) || false;
  }

  updateLastLogin() {
    this.lastLogin = new Date();
  }

  toJSON(includePassword = false) {
    const data = {
      id: this.id,
      username: this.username,
      fullName: this.fullName,
      role: this.role,
      active: this.active,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin
    };

    if (includePassword) {
      data.password = this.password;
    }

    return data;
  }
}

module.exports = User;
