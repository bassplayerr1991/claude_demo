/**
 * TableManager Module
 * Manages restaurant tables and their status
 */
const Table = require('../../models/Table');
const EventEmitter = require('events');

class TableManager extends EventEmitter {
  constructor() {
    super();
    this.tables = new Map();
    this.initializeTables();
  }

  // Initialize restaurant tables
  initializeTables() {
    const sections = [
      { section: 'main', count: 15, capacity: 4 },
      { section: 'outdoor', count: 8, capacity: 4 },
      { section: 'vip', count: 3, capacity: 6 }
    ];

    let tableNumber = 1;

    sections.forEach(({ section, count, capacity }) => {
      for (let i = 0; i < count; i++) {
        const table = new Table({
          tableNumber: tableNumber++,
          capacity: capacity,
          section: section,
          status: 'available'
        });
        this.tables.set(table.id, table);
      }
    });

    console.log(`✅ ${this.tables.size} masa oluşturuldu`);
  }

  // Get all tables
  getAllTables() {
    return Array.from(this.tables.values()).map(t => t.toJSON());
  }

  // Get table by ID
  getTable(tableId) {
    const table = this.tables.get(tableId);
    if (!table) throw new Error('Masa bulunamadı');
    return table;
  }

  // Get table by number
  getTableByNumber(tableNumber) {
    return Array.from(this.tables.values()).find(
      t => t.tableNumber === parseInt(tableNumber)
    );
  }

  // Get tables by section
  getTablesBySection(section) {
    return Array.from(this.tables.values())
      .filter(t => t.section === section)
      .map(t => t.toJSON());
  }

  // Get tables by status
  getTablesByStatus(status) {
    return Array.from(this.tables.values())
      .filter(t => t.status === status)
      .map(t => t.toJSON());
  }

  // Get available tables
  getAvailableTables() {
    return this.getTablesByStatus('available');
  }

  // Get occupied tables
  getOccupiedTables() {
    return this.getTablesByStatus('occupied');
  }

  // Occupy table (assign order to table)
  occupyTable(tableId, orderId, waiterId) {
    const table = this.getTable(tableId);

    if (!table.isAvailable() && table.status !== 'reserved') {
      throw new Error('Bu masa müsait değil');
    }

    table.occupy(orderId, waiterId);

    this.emit('tableOccupied', {
      tableId: table.id,
      tableNumber: table.tableNumber,
      orderId: orderId,
      waiterId: waiterId,
      timestamp: new Date()
    });

    return table.toJSON();
  }

  // Reserve table
  reserveTable(tableId, waiterId) {
    const table = this.getTable(tableId);

    if (!table.isAvailable()) {
      throw new Error('Bu masa müsait değil');
    }

    table.reserve(waiterId);

    this.emit('tableReserved', {
      tableId: table.id,
      tableNumber: table.tableNumber,
      waiterId: waiterId,
      timestamp: new Date()
    });

    return table.toJSON();
  }

  // Free table (mark for cleaning)
  freeTable(tableId) {
    const table = this.getTable(tableId);

    if (table.status !== 'occupied') {
      throw new Error('Bu masa zaten boş');
    }

    const orderId = table.currentOrder;
    table.startCleaning();

    this.emit('tableFreed', {
      tableId: table.id,
      tableNumber: table.tableNumber,
      orderId: orderId,
      timestamp: new Date()
    });

    return table.toJSON();
  }

  // Clean table (mark as available after cleaning)
  cleanTable(tableId) {
    const table = this.getTable(tableId);

    if (table.status !== 'cleaning') {
      throw new Error('Bu masa temizlenme durumunda değil');
    }

    table.makeAvailable();

    this.emit('tableCleaned', {
      tableId: table.id,
      tableNumber: table.tableNumber,
      timestamp: new Date()
    });

    return table.toJSON();
  }

  // Update table assignment
  reassignWaiter(tableId, newWaiterId) {
    const table = this.getTable(tableId);

    if (table.status === 'available') {
      throw new Error('Boş masaya garson atanamaz');
    }

    const oldWaiterId = table.assignedWaiter;
    table.assignedWaiter = newWaiterId;
    table.lastUpdated = new Date();

    this.emit('waiterReassigned', {
      tableId: table.id,
      tableNumber: table.tableNumber,
      oldWaiterId: oldWaiterId,
      newWaiterId: newWaiterId,
      timestamp: new Date()
    });

    return table.toJSON();
  }

  // Get tables assigned to a waiter
  getWaiterTables(waiterId) {
    return Array.from(this.tables.values())
      .filter(t => t.assignedWaiter === waiterId)
      .map(t => t.toJSON());
  }

  // Get table statistics
  getTableStats() {
    const tables = Array.from(this.tables.values());

    const stats = {
      total: tables.length,
      available: 0,
      occupied: 0,
      reserved: 0,
      cleaning: 0,
      bySection: {}
    };

    tables.forEach(table => {
      stats[table.status]++;

      if (!stats.bySection[table.section]) {
        stats.bySection[table.section] = {
          total: 0,
          available: 0,
          occupied: 0,
          reserved: 0,
          cleaning: 0
        };
      }

      stats.bySection[table.section].total++;
      stats.bySection[table.section][table.status]++;
    });

    stats.occupancyRate = ((stats.occupied / stats.total) * 100).toFixed(1) + '%';

    return stats;
  }

  // Get table layout for display
  getTableLayout() {
    const sections = {};

    Array.from(this.tables.values()).forEach(table => {
      if (!sections[table.section]) {
        sections[table.section] = [];
      }
      sections[table.section].push(table.toJSON());
    });

    // Sort tables by number in each section
    Object.keys(sections).forEach(section => {
      sections[section].sort((a, b) => a.tableNumber - b.tableNumber);
    });

    return sections;
  }

  // Update table details
  updateTable(tableId, updates) {
    const table = this.getTable(tableId);

    if (updates.capacity) table.capacity = updates.capacity;
    if (updates.section) table.section = updates.section;
    table.lastUpdated = new Date();

    return table.toJSON();
  }

  // Create new table
  createTable(tableData) {
    const table = new Table(tableData);
    this.tables.set(table.id, table);
    return table.toJSON();
  }

  // Delete table
  deleteTable(tableId) {
    const table = this.getTable(tableId);

    if (table.status !== 'available') {
      throw new Error('Sadece boş masalar silinebilir');
    }

    this.tables.delete(tableId);
    return { success: true, message: 'Masa silindi' };
  }

  // Bulk status update for multiple tables
  bulkStatusUpdate(tableIds, status) {
    const results = [];

    tableIds.forEach(tableId => {
      try {
        const table = this.getTable(tableId);

        if (status === 'available') {
          table.makeAvailable();
        } else {
          table.status = status;
          table.lastUpdated = new Date();
        }

        results.push({ tableId, success: true });
      } catch (error) {
        results.push({ tableId, success: false, error: error.message });
      }
    });

    return results;
  }
}

module.exports = TableManager;
