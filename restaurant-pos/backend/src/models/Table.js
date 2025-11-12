/**
 * Table Model
 * Represents a restaurant table
 */
class Table {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.tableNumber = data.tableNumber;
    this.capacity = data.capacity || 4;
    this.status = data.status || 'available'; // available, occupied, reserved, cleaning
    this.currentOrder = data.currentOrder || null; // Order ID if occupied
    this.assignedWaiter = data.assignedWaiter || null; // User ID of assigned garson
    this.section = data.section || 'main'; // main, outdoor, vip, etc.
    this.lastUpdated = data.lastUpdated || new Date();
    this.createdAt = data.createdAt || new Date();
  }

  generateId() {
    return 'table_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  occupy(orderId, waiterId) {
    this.status = 'occupied';
    this.currentOrder = orderId;
    this.assignedWaiter = waiterId;
    this.lastUpdated = new Date();
  }

  reserve(waiterId) {
    this.status = 'reserved';
    this.assignedWaiter = waiterId;
    this.lastUpdated = new Date();
  }

  startCleaning() {
    this.status = 'cleaning';
    this.currentOrder = null;
    this.lastUpdated = new Date();
  }

  makeAvailable() {
    this.status = 'available';
    this.currentOrder = null;
    this.assignedWaiter = null;
    this.lastUpdated = new Date();
  }

  isAvailable() {
    return this.status === 'available';
  }

  toJSON() {
    return {
      id: this.id,
      tableNumber: this.tableNumber,
      capacity: this.capacity,
      status: this.status,
      currentOrder: this.currentOrder,
      assignedWaiter: this.assignedWaiter,
      section: this.section,
      lastUpdated: this.lastUpdated,
      createdAt: this.createdAt
    };
  }
}

module.exports = Table;
