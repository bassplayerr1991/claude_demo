/**
 * InventoryItem Model
 * Represents an inventory item with stock tracking
 */
class InventoryItem {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.sku = data.sku || '';
    this.currentStock = parseFloat(data.currentStock) || 0;
    this.unit = data.unit || 'unit'; // unit, kg, g, l, ml, etc.
    this.reorderThreshold = parseFloat(data.reorderThreshold) || 10;
    this.reorderQuantity = parseFloat(data.reorderQuantity) || 50;
    this.costPerUnit = parseFloat(data.costPerUnit) || 0;
    this.supplier = data.supplier || '';
    this.category = data.category || 'general';
    this.lastRestocked = data.lastRestocked || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  generateId() {
    return 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  updateStock(quantity, operation = 'add') {
    if (operation === 'add') {
      this.currentStock += quantity;
      this.lastRestocked = new Date();
    } else if (operation === 'subtract') {
      this.currentStock = Math.max(0, this.currentStock - quantity);
    } else if (operation === 'set') {
      this.currentStock = quantity;
    }
    this.updatedAt = new Date();
  }

  needsReorder() {
    return this.currentStock <= this.reorderThreshold;
  }

  getTotalValue() {
    return this.currentStock * this.costPerUnit;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      sku: this.sku,
      currentStock: this.currentStock,
      unit: this.unit,
      reorderThreshold: this.reorderThreshold,
      reorderQuantity: this.reorderQuantity,
      costPerUnit: this.costPerUnit,
      supplier: this.supplier,
      category: this.category,
      lastRestocked: this.lastRestocked,
      needsReorder: this.needsReorder(),
      totalValue: this.getTotalValue(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = InventoryItem;
