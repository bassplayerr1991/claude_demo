/**
 * MenuManager Module
 * Manages menu items, categories, and digital menu display
 */
const MenuItem = require('../../models/MenuItem');
const Category = require('../../models/Category');
const NodeCache = require('node-cache');
const QRCode = require('qrcode');

class MenuManager {
  constructor() {
    this.menuItems = new Map();
    this.categories = new Map();
    this.cache = new NodeCache({ stdTTL: 300 }); // 5 minutes cache
    this.initializeSampleData();
  }

  // Initialize with sample data
  initializeSampleData() {
    // Sample categories
    const categories = [
      { name: 'Appetizers', description: 'Start your meal', displayOrder: 1, icon: '🥗' },
      { name: 'Main Courses', description: 'Our signature dishes', displayOrder: 2, icon: '🍽️' },
      { name: 'Desserts', description: 'Sweet endings', displayOrder: 3, icon: '🍰' },
      { name: 'Beverages', description: 'Drinks & refreshments', displayOrder: 4, icon: '🥤' }
    ];

    categories.forEach(cat => {
      const category = new Category(cat);
      this.categories.set(category.id, category);
    });

    // Sample menu items
    const appetizersId = Array.from(this.categories.values()).find(c => c.name === 'Appetizers').id;
    const mainCoursesId = Array.from(this.categories.values()).find(c => c.name === 'Main Courses').id;
    const dessertsId = Array.from(this.categories.values()).find(c => c.name === 'Desserts').id;
    const beveragesId = Array.from(this.categories.values()).find(c => c.name === 'Beverages').id;

    const items = [
      { name: 'Caesar Salad', description: 'Fresh romaine lettuce with parmesan', price: 8.99, category: appetizersId, preparationTime: 10, ingredients: ['lettuce', 'parmesan', 'dressing'] },
      { name: 'Bruschetta', description: 'Toasted bread with tomatoes and basil', price: 6.99, category: appetizersId, preparationTime: 8, ingredients: ['bread', 'tomatoes', 'basil'] },
      { name: 'Grilled Salmon', description: 'Fresh Atlantic salmon with vegetables', price: 24.99, category: mainCoursesId, preparationTime: 20, ingredients: ['salmon', 'vegetables', 'lemon'] },
      { name: 'Ribeye Steak', description: 'Premium cut with mashed potatoes', price: 32.99, category: mainCoursesId, preparationTime: 25, ingredients: ['beef', 'potatoes', 'butter'] },
      { name: 'Vegetarian Pasta', description: 'Penne with seasonal vegetables', price: 16.99, category: mainCoursesId, preparationTime: 15, ingredients: ['pasta', 'vegetables', 'olive oil'] },
      { name: 'Tiramisu', description: 'Classic Italian dessert', price: 7.99, category: dessertsId, preparationTime: 5, ingredients: ['mascarpone', 'coffee', 'cocoa'] },
      { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with ice cream', price: 8.99, category: dessertsId, preparationTime: 12, ingredients: ['chocolate', 'flour', 'ice cream'] },
      { name: 'Fresh Lemonade', description: 'Homemade lemonade', price: 3.99, category: beveragesId, preparationTime: 3, ingredients: ['lemon', 'sugar', 'water'] },
      { name: 'Espresso', description: 'Strong Italian coffee', price: 2.99, category: beveragesId, preparationTime: 2, ingredients: ['coffee beans'] }
    ];

    items.forEach(item => {
      const menuItem = new MenuItem(item);
      this.menuItems.set(menuItem.id, menuItem);
    });
  }

  // Category Management
  createCategory(data) {
    const category = new Category(data);
    this.categories.set(category.id, category);
    this.clearCache();
    return category;
  }

  updateCategory(id, data) {
    const category = this.categories.get(id);
    if (!category) throw new Error('Category not found');
    Object.assign(category, data);
    this.clearCache();
    return category;
  }

  deleteCategory(id) {
    const result = this.categories.delete(id);
    if (result) this.clearCache();
    return result;
  }

  getAllCategories() {
    return Array.from(this.categories.values())
      .filter(cat => cat.active)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  // Menu Item Management
  createMenuItem(data) {
    const menuItem = new MenuItem(data);
    this.menuItems.set(menuItem.id, menuItem);
    this.clearCache();
    return menuItem;
  }

  updateMenuItem(id, data) {
    const menuItem = this.menuItems.get(id);
    if (!menuItem) throw new Error('Menu item not found');
    menuItem.update(data);
    this.clearCache();
    return menuItem;
  }

  deleteMenuItem(id) {
    const result = this.menuItems.delete(id);
    if (result) this.clearCache();
    return result;
  }

  getMenuItem(id) {
    return this.menuItems.get(id);
  }

  getAllMenuItems() {
    return Array.from(this.menuItems.values()).filter(item => item.available);
  }

  getMenuItemsByCategory(categoryId) {
    return Array.from(this.menuItems.values())
      .filter(item => item.category === categoryId && item.available);
  }

  searchMenuItems(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.menuItems.values())
      .filter(item =>
        item.available && (
          item.name.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery)
        )
      );
  }

  // Digital Menu Display
  getFullMenu() {
    const cached = this.cache.get('fullMenu');
    if (cached) return cached;

    const categories = this.getAllCategories();
    const menu = categories.map(category => ({
      ...category.toJSON(),
      items: this.getMenuItemsByCategory(category.id).map(item => item.toJSON())
    }));

    this.cache.set('fullMenu', menu);
    return menu;
  }

  // QR Code Generation
  async generateMenuQRCode(baseUrl) {
    const menuUrl = `${baseUrl}/menu`;
    try {
      const qrCode = await QRCode.toDataURL(menuUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return {
        url: menuUrl,
        qrCode: qrCode
      };
    } catch (error) {
      throw new Error('Failed to generate QR code: ' + error.message);
    }
  }

  // Cache Management
  clearCache() {
    this.cache.flushAll();
  }

  // Offline Data Export
  exportMenuData() {
    return {
      categories: Array.from(this.categories.values()).map(c => c.toJSON()),
      menuItems: Array.from(this.menuItems.values()).map(m => m.toJSON()),
      exportedAt: new Date()
    };
  }

  // Import Menu Data (for offline sync)
  importMenuData(data) {
    if (data.categories) {
      this.categories.clear();
      data.categories.forEach(cat => {
        const category = new Category(cat);
        this.categories.set(category.id, category);
      });
    }

    if (data.menuItems) {
      this.menuItems.clear();
      data.menuItems.forEach(item => {
        const menuItem = new MenuItem(item);
        this.menuItems.set(menuItem.id, menuItem);
      });
    }

    this.clearCache();
  }
}

module.exports = MenuManager;
