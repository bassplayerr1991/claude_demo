/**
 * InventoryManager Module
 * Manages stock levels, cost tracking, and reorder alerts
 */
const InventoryItem = require('../../models/InventoryItem');
const EventEmitter = require('events');

class InventoryManager extends EventEmitter {
  constructor() {
    super();
    this.inventory = new Map();
    this.transactions = [];
    this.initializeSampleData();
  }

  // Initialize with sample data
  initializeSampleData() {
    const items = [
      { name: 'Lettuce', sku: 'VEG001', currentStock: 50, unit: 'kg', reorderThreshold: 10, reorderQuantity: 30, costPerUnit: 2.50, supplier: 'Fresh Farms', category: 'vegetables' },
      { name: 'Tomatoes', sku: 'VEG002', currentStock: 45, unit: 'kg', reorderThreshold: 15, reorderQuantity: 40, costPerUnit: 3.00, supplier: 'Fresh Farms', category: 'vegetables' },
      { name: 'Salmon Fillet', sku: 'FISH001', currentStock: 20, unit: 'kg', reorderThreshold: 5, reorderQuantity: 15, costPerUnit: 18.00, supplier: 'Ocean Fresh', category: 'seafood' },
      { name: 'Ribeye Steak', sku: 'MEAT001', currentStock: 25, unit: 'kg', reorderThreshold: 8, reorderQuantity: 20, costPerUnit: 28.00, supplier: 'Prime Meats', category: 'meat' },
      { name: 'Pasta', sku: 'DRY001', currentStock: 100, unit: 'kg', reorderThreshold: 20, reorderQuantity: 50, costPerUnit: 1.50, supplier: 'Italian Imports', category: 'dry goods' },
      { name: 'Olive Oil', sku: 'OIL001', currentStock: 30, unit: 'l', reorderThreshold: 10, reorderQuantity: 25, costPerUnit: 8.00, supplier: 'Mediterranean Oils', category: 'oils' },
      { name: 'Parmesan Cheese', sku: 'DAIRY001', currentStock: 15, unit: 'kg', reorderThreshold: 5, reorderQuantity: 10, costPerUnit: 12.00, supplier: 'Cheese Co', category: 'dairy' },
      { name: 'Coffee Beans', sku: 'BEV001', currentStock: 40, unit: 'kg', reorderThreshold: 10, reorderQuantity: 30, costPerUnit: 15.00, supplier: 'Coffee Masters', category: 'beverages' },
      { name: 'Chocolate', sku: 'BAK001', currentStock: 8, unit: 'kg', reorderThreshold: 5, reorderQuantity: 15, costPerUnit: 10.00, supplier: 'Sweet Supply', category: 'baking' }
    ];

    items.forEach(item => {
      const inventoryItem = new InventoryItem(item);
      this.inventory.set(inventoryItem.id, inventoryItem);
    });

    // Check for items needing reorder
    this.checkReorderAlerts();
  }

  // Inventory Management
  createItem(data) {
    const item = new InventoryItem(data);
    this.inventory.set(item.id, item);
    this.logTransaction(item.id, 'created', item.currentStock, 'Initial stock');
    return item;
  }

  updateItem(id, data) {
    const item = this.inventory.get(id);
    if (!item) throw new Error('Inventory item not found');

    Object.assign(item, data);
    item.updatedAt = new Date();
    this.logTransaction(id, 'updated', item.currentStock, 'Item updated');

    if (item.needsReorder()) {
      this.emitReorderAlert(item);
    }

    return item;
  }

  deleteItem(id) {
    const item = this.inventory.get(id);
    if (item) {
      this.logTransaction(id, 'deleted', 0, 'Item deleted');
    }
    return this.inventory.delete(id);
  }

  getItem(id) {
    return this.inventory.get(id);
  }

  getAllItems() {
    return Array.from(this.inventory.values());
  }

  getItemsBySKU(sku) {
    return Array.from(this.inventory.values()).filter(item => item.sku === sku);
  }

  getItemsByCategory(category) {
    return Array.from(this.inventory.values()).filter(item => item.category === category);
  }

  // Stock Operations
  addStock(id, quantity, notes = '') {
    const item = this.inventory.get(id);
    if (!item) throw new Error('Inventory item not found');

    const previousStock = item.currentStock;
    item.updateStock(quantity, 'add');

    this.logTransaction(id, 'stock_added', quantity, notes, previousStock, item.currentStock);

    return item;
  }

  reduceStock(id, quantity, notes = '') {
    const item = this.inventory.get(id);
    if (!item) throw new Error('Inventory item not found');

    const previousStock = item.currentStock;
    item.updateStock(quantity, 'subtract');

    this.logTransaction(id, 'stock_reduced', quantity, notes, previousStock, item.currentStock);

    if (item.needsReorder()) {
      this.emitReorderAlert(item);
    }

    return item;
  }

  setStock(id, quantity, notes = '') {
    const item = this.inventory.get(id);
    if (!item) throw new Error('Inventory item not found');

    const previousStock = item.currentStock;
    item.updateStock(quantity, 'set');

    this.logTransaction(id, 'stock_set', quantity, notes, previousStock, item.currentStock);

    if (item.needsReorder()) {
      this.emitReorderAlert(item);
    }

    return item;
  }

  // Process order stock reduction
  processOrderStockUpdate(orderItems) {
    const results = [];

    orderItems.forEach(orderItem => {
      if (orderItem.ingredients && Array.isArray(orderItem.ingredients)) {
        orderItem.ingredients.forEach(ingredient => {
          const item = this.findItemByName(ingredient.name);
          if (item) {
            const quantity = ingredient.quantity || 0;
            this.reduceStock(item.id, quantity, `Order: ${orderItem.name}`);
            results.push({ itemId: item.id, name: item.name, reduced: quantity });
          }
        });
      }
    });

    return results;
  }

  findItemByName(name) {
    return Array.from(this.inventory.values())
      .find(item => item.name.toLowerCase() === name.toLowerCase());
  }

  // Cost Calculations
  calculateCOGS(orderItems) {
    let totalCost = 0;
    const breakdown = [];

    orderItems.forEach(orderItem => {
      if (orderItem.ingredients && Array.isArray(orderItem.ingredients)) {
        orderItem.ingredients.forEach(ingredient => {
          const item = this.findItemByName(ingredient.name);
          if (item) {
            const quantity = ingredient.quantity || 0;
            const cost = quantity * item.costPerUnit;
            totalCost += cost;
            breakdown.push({
              ingredient: item.name,
              quantity: quantity,
              unit: item.unit,
              costPerUnit: item.costPerUnit,
              totalCost: cost
            });
          }
        });
      }
    });

    return {
      totalCOGS: totalCost,
      breakdown: breakdown
    };
  }

  getTotalInventoryValue() {
    return Array.from(this.inventory.values())
      .reduce((sum, item) => sum + item.getTotalValue(), 0);
  }

  getInventoryValueByCategory() {
    const categoryValues = {};

    Array.from(this.inventory.values()).forEach(item => {
      if (!categoryValues[item.category]) {
        categoryValues[item.category] = 0;
      }
      categoryValues[item.category] += item.getTotalValue();
    });

    return categoryValues;
  }

  // Reorder Management
  checkReorderAlerts() {
    const alerts = [];

    Array.from(this.inventory.values()).forEach(item => {
      if (item.needsReorder()) {
        alerts.push({
          id: item.id,
          name: item.name,
          sku: item.sku,
          currentStock: item.currentStock,
          reorderThreshold: item.reorderThreshold,
          reorderQuantity: item.reorderQuantity,
          supplier: item.supplier
        });
      }
    });

    return alerts;
  }

  emitReorderAlert(item) {
    const alert = {
      id: item.id,
      name: item.name,
      sku: item.sku,
      currentStock: item.currentStock,
      reorderThreshold: item.reorderThreshold,
      reorderQuantity: item.reorderQuantity,
      supplier: item.supplier,
      timestamp: new Date()
    };

    this.emit('reorderAlert', alert);
    return alert;
  }

  setReorderThreshold(id, threshold) {
    const item = this.inventory.get(id);
    if (!item) throw new Error('Inventory item not found');

    item.reorderThreshold = threshold;
    item.updatedAt = new Date();

    if (item.needsReorder()) {
      this.emitReorderAlert(item);
    }

    return item;
  }

  // Transaction Logging
  logTransaction(itemId, type, quantity, notes = '', previousStock = null, newStock = null) {
    const transaction = {
      id: 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      itemId: itemId,
      type: type,
      quantity: quantity,
      notes: notes,
      previousStock: previousStock,
      newStock: newStock,
      timestamp: new Date()
    };

    this.transactions.push(transaction);
    return transaction;
  }

  getTransactionHistory(itemId = null, limit = 100) {
    let filtered = this.transactions;

    if (itemId) {
      filtered = filtered.filter(t => t.itemId === itemId);
    }

    return filtered.slice(-limit).reverse();
  }

  // Reports
  generateStockSummary() {
    const items = Array.from(this.inventory.values());

    return {
      totalItems: items.length,
      totalValue: this.getTotalInventoryValue(),
      lowStockItems: items.filter(item => item.needsReorder()).length,
      byCategory: this.getInventoryValueByCategory(),
      reorderAlerts: this.checkReorderAlerts(),
      generatedAt: new Date()
    };
  }

  generateStockReport() {
    return {
      summary: this.generateStockSummary(),
      items: Array.from(this.inventory.values()).map(item => item.toJSON()),
      recentTransactions: this.getTransactionHistory(null, 50)
    };
  }
}

module.exports = InventoryManager;
