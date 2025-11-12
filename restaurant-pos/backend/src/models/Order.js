/**
 * Order Model
 * Represents a customer order
 */
class Order {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.orderNumber = data.orderNumber || this.generateOrderNumber();
    this.items = data.items || []; // Array of { menuItemId, name, quantity, price, modifications }
    this.status = data.status || 'pending'; // pending, preparing, ready, completed, cancelled
    this.orderType = data.orderType || 'dine-in'; // dine-in, takeaway, delivery
    this.tableNumber = data.tableNumber || null;
    this.customerName = data.customerName || '';
    this.customerPhone = data.customerPhone || '';
    this.specialInstructions = data.specialInstructions || '';
    this.totalAmount = data.totalAmount || 0;
    this.taxAmount = data.taxAmount || 0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.completedAt = data.completedAt || null;
  }

  generateId() {
    return 'ord_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateOrderNumber() {
    const date = new Date();
    const dateStr = date.getFullYear().toString().substr(2) +
                   (date.getMonth() + 1).toString().padStart(2, '0') +
                   date.getDate().toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return dateStr + randomNum;
  }

  calculateTotal() {
    this.totalAmount = this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    this.taxAmount = this.totalAmount * 0.1; // 10% tax
    this.updatedAt = new Date();
  }

  updateStatus(newStatus) {
    this.status = newStatus;
    this.updatedAt = new Date();
    if (newStatus === 'completed') {
      this.completedAt = new Date();
    }
  }

  addItem(item) {
    this.items.push(item);
    this.calculateTotal();
  }

  removeItem(itemIndex) {
    this.items.splice(itemIndex, 1);
    this.calculateTotal();
  }

  toJSON() {
    return {
      id: this.id,
      orderNumber: this.orderNumber,
      items: this.items,
      status: this.status,
      orderType: this.orderType,
      tableNumber: this.tableNumber,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      specialInstructions: this.specialInstructions,
      totalAmount: this.totalAmount,
      taxAmount: this.taxAmount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt
    };
  }
}

module.exports = Order;
