/**
 * Restaurant POS System - Main Server
 * Integrates all modules and provides REST API
 * WITH AUTHENTICATION AND TABLE MANAGEMENT
 */
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import modules
const MenuManager = require('./modules/menu/MenuManager');
const InventoryManager = require('./modules/inventory/InventoryManager');
const KitchenManager = require('./modules/kitchen/KitchenManager');
const ReportingEngine = require('./modules/reporting/ReportingEngine');
const HardwareManager = require('./modules/hardware/HardwareManager');
const AuthManager = require('./modules/auth/AuthManager');
const TableManager = require('./modules/tables/TableManager');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../frontend')));

// Initialize modules
const menuManager = new MenuManager();
const inventoryManager = new InventoryManager();
const kitchenManager = new KitchenManager();
const reportingEngine = new ReportingEngine(menuManager, inventoryManager, kitchenManager);
const hardwareManager = new HardwareManager();
const authManager = new AuthManager();
const tableManager = new TableManager();

// Authentication Middleware
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, error: 'Oturum gerekli' });
  }

  const user = authManager.verifyToken(token);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Geçersiz oturum' });
  }

  req.user = user;
  next();
}

// Permission Middleware
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        error: 'Bu işlem için yetkiniz yok'
      });
    }
    next();
  };
}

// Event listeners
inventoryManager.on('reorderAlert', (alert) => {
  console.log('🔔 Stok Uyarısı:', alert.name, '- Mevcut stok:', alert.currentStock);
});

kitchenManager.on('newOrder', (order) => {
  console.log('🍽️ Yeni Sipariş:', order.orderNumber);
});

kitchenManager.on('orderCompleted', (data) => {
  console.log('✅ Sipariş Tamamlandı:', data.orderNumber);
});

tableManager.on('tableOccupied', (data) => {
  console.log('🪑 Masa Dolu:', data.tableNumber);
});

tableManager.on('tableCleaned', (data) => {
  console.log('✨ Masa Temizlendi:', data.tableNumber);
});

// ==================== AUTH API ROUTES ====================

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const result = authManager.login(username, password);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

// Logout
app.post('/api/auth/logout', requireAuth, (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const result = authManager.logout(token);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get current user
app.get('/api/auth/me', requireAuth, (req, res) => {
  try {
    res.json({ success: true, data: req.user.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all users (yönetici only)
app.get('/api/auth/users', requireAuth, requirePermission('users:read'), (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const users = authManager.getAllUsers(token);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all waiters (garson listesi)
app.get('/api/auth/waiters', requireAuth, (req, res) => {
  try {
    const waiters = authManager.getAllWaiters();
    res.json({ success: true, data: waiters });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== TABLE MANAGEMENT API ROUTES ====================

// Get all tables
app.get('/api/tables', requireAuth, (req, res) => {
  try {
    const tables = tableManager.getAllTables();
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get table layout
app.get('/api/tables/layout', requireAuth, (req, res) => {
  try {
    const layout = tableManager.getTableLayout();
    res.json({ success: true, data: layout });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get table statistics
app.get('/api/tables/stats', requireAuth, (req, res) => {
  try {
    const stats = tableManager.getTableStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available tables
app.get('/api/tables/available', requireAuth, (req, res) => {
  try {
    const tables = tableManager.getAvailableTables();
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get waiter's tables
app.get('/api/tables/my-tables', requireAuth, (req, res) => {
  try {
    const tables = tableManager.getWaiterTables(req.user.id);
    res.json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Occupy table
app.post('/api/tables/:id/occupy', requireAuth, (req, res) => {
  try {
    const { orderId } = req.body;
    const table = tableManager.occupyTable(req.params.id, orderId, req.user.id);
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Reserve table
app.post('/api/tables/:id/reserve', requireAuth, (req, res) => {
  try {
    const table = tableManager.reserveTable(req.params.id, req.user.id);
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Free table (start cleaning)
app.post('/api/tables/:id/free', requireAuth, (req, res) => {
  try {
    const table = tableManager.freeTable(req.params.id);
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Clean table (make available)
app.post('/api/tables/:id/clean', requireAuth, (req, res) => {
  try {
    const table = tableManager.cleanTable(req.params.id);
    res.json({ success: true, data: table });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== MENU API ROUTES ====================

// Get full menu
app.get('/api/menu', (req, res) => {
  try {
    const menu = menuManager.getFullMenu();
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all categories
app.get('/api/menu/categories', (req, res) => {
  try {
    const categories = menuManager.getAllCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create category
app.post('/api/menu/categories', (req, res) => {
  try {
    const category = menuManager.createCategory(req.body);
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get menu items by category
app.get('/api/menu/categories/:categoryId/items', (req, res) => {
  try {
    const items = menuManager.getMenuItemsByCategory(req.params.categoryId);
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create menu item
app.post('/api/menu/items', (req, res) => {
  try {
    const item = menuManager.createMenuItem(req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update menu item
app.put('/api/menu/items/:id', (req, res) => {
  try {
    const item = menuManager.updateMenuItem(req.params.id, req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete menu item
app.delete('/api/menu/items/:id', (req, res) => {
  try {
    menuManager.deleteMenuItem(req.params.id);
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Generate QR code for menu
app.get('/api/menu/qrcode', async (req, res) => {
  try {
    const baseUrl = req.query.baseUrl || `http://localhost:${PORT}`;
    const qrData = await menuManager.generateMenuQRCode(baseUrl);
    res.json({ success: true, data: qrData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export menu data (for offline access)
app.get('/api/menu/export', (req, res) => {
  try {
    const data = menuManager.exportMenuData();
    res.json({ success: true, data: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== INVENTORY API ROUTES ====================
// Only Yönetici can access inventory management

// Get all inventory items
app.get('/api/inventory', requireAuth, requirePermission('inventory:read'), (req, res) => {
  try {
    const items = inventoryManager.getAllItems();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create inventory item
app.post('/api/inventory', requireAuth, requirePermission('inventory:write'), (req, res) => {
  try {
    const item = inventoryManager.createItem(req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update inventory item
app.put('/api/inventory/:id', requireAuth, requirePermission('inventory:write'), (req, res) => {
  try {
    const item = inventoryManager.updateItem(req.params.id, req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Add stock
app.post('/api/inventory/:id/add-stock', requireAuth, requirePermission('inventory:write'), (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const item = inventoryManager.addStock(req.params.id, quantity, notes);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Reduce stock
app.post('/api/inventory/:id/reduce-stock', requireAuth, requirePermission('inventory:write'), (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const item = inventoryManager.reduceStock(req.params.id, quantity, notes);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Set stock level
app.post('/api/inventory/:id/set-stock', requireAuth, requirePermission('inventory:write'), (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const item = inventoryManager.setStock(req.params.id, quantity, notes);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Check reorder alerts
app.get('/api/inventory/alerts', requireAuth, requirePermission('inventory:read'), (req, res) => {
  try {
    const alerts = inventoryManager.checkReorderAlerts();
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get inventory summary
app.get('/api/inventory/summary', (req, res) => {
  try {
    const summary = inventoryManager.generateStockSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== KITCHEN API ROUTES ====================

// Create new order (with automatic Sunlux printing)
app.post('/api/kitchen/orders', requireAuth, async (req, res) => {
  try {
    // Add waiter info to order
    const orderData = {
      ...req.body,
      waiterId: req.user.id,
      waiterName: req.user.fullName
    };

    const order = kitchenManager.receiveOrder(orderData);

    // Update inventory
    if (req.body.items) {
      inventoryManager.processOrderStockUpdate(req.body.items);
    }

    // Auto-print kitchen ticket on Sunlux RP8020
    try {
      const printer = hardwareManager.printers.get('sunlux_rp8020');
      if (printer) {
        await printer.printKitchenTicket({
          ...order.toJSON(),
          waiterName: req.user.fullName
        });
        console.log('✅ Mutfak fişi yazdırıldı:', order.orderNumber);
      }
    } catch (printError) {
      console.error('⚠️ Yazdırma hatası:', printError.message);
      // Continue even if printing fails
    }

    res.json({ success: true, data: order.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get kitchen display
app.get('/api/kitchen/display', requireAuth, (req, res) => {
  try {
    const display = kitchenManager.getKitchenDisplay();
    res.json({ success: true, data: display });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status
app.put('/api/kitchen/orders/:id/status', requireAuth, (req, res) => {
  try {
    const { status } = req.body;
    const order = kitchenManager.updateOrderStatus(req.params.id, status);
    res.json({ success: true, data: order.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Start preparing order
app.post('/api/kitchen/orders/:id/start', requireAuth, (req, res) => {
  try {
    const order = kitchenManager.startPreparation(req.params.id);
    res.json({ success: true, data: order.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Mark order as ready
app.post('/api/kitchen/orders/:id/ready', requireAuth, (req, res) => {
  try {
    const order = kitchenManager.markOrderReady(req.params.id);
    res.json({ success: true, data: order.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Complete order
app.post('/api/kitchen/orders/:id/complete', requireAuth, async (req, res) => {
  try {
    const order = kitchenManager.completeOrder(req.params.id);

    // Auto-print customer receipt on Sunlux RP8020
    if (req.body.printReceipt !== false) {
      try {
        const printer = hardwareManager.printers.get('sunlux_rp8020');
        if (printer) {
          await printer.printOrderTicket(order.toJSON());
          console.log('✅ Müşteri fişi yazdırıldı:', order.orderNumber);
        }
      } catch (printError) {
        console.error('⚠️ Yazdırma hatası:', printError.message);
      }
    }

    res.json({ success: true, data: order.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get kitchen stats
app.get('/api/kitchen/stats', requireAuth, (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'today';
    const stats = kitchenManager.getKitchenStats(timeframe);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== REPORTING API ROUTES ====================
// Only Yönetici can access reports

// Generate sales report
app.get('/api/reports/sales', requireAuth, requirePermission('reports:read'), (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const report = reportingEngine.generateSalesReport(period, startDate, endDate);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate inventory report
app.get('/api/reports/inventory', requireAuth, requirePermission('reports:read'), (req, res) => {
  try {
    const report = reportingEngine.generateInventoryReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate employee performance report
app.get('/api/reports/employees', requireAuth, requirePermission('reports:read'), (req, res) => {
  try {
    const report = reportingEngine.generateEmployeePerformanceReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Daily summary
app.get('/api/reports/daily-summary', requireAuth, requirePermission('reports:read'), (req, res) => {
  try {
    const summary = reportingEngine.generateDailySummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export reports as CSV
app.get('/api/reports/export/csv', requireAuth, requirePermission('reports:read'), (req, res) => {
  try {
    const { type } = req.query;
    let report;

    if (type === 'sales') {
      report = reportingEngine.generateSalesReport('monthly');
    } else if (type === 'inventory') {
      report = reportingEngine.generateInventoryReport();
    } else if (type === 'employees') {
      report = reportingEngine.generateEmployeePerformanceReport();
    }

    const csv = reportingEngine.exportToCSV(report, type);
    res.header('Content-Type', 'text/csv');
    res.attachment(`${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate chart
app.get('/api/reports/charts/sales', requireAuth, requirePermission('reports:read'), (req, res) => {
  try {
    const period = req.query.period || 'weekly';
    const chart = reportingEngine.generateSalesChart(period);
    res.header('Content-Type', 'image/png');
    res.send(chart);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== HARDWARE API ROUTES ====================

// Register device
app.post('/api/hardware/devices', requireAuth, requirePermission('users:write'), (req, res) => {
  try {
    const { deviceId, deviceType, config } = req.body;
    const device = hardwareManager.registerDevice(deviceId, deviceType, config);
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all devices
app.get('/api/hardware/devices', requireAuth, (req, res) => {
  try {
    const devices = hardwareManager.getAllDeviceStatuses();
    res.json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Connect device
app.post('/api/hardware/devices/:id/connect', requireAuth, async (req, res) => {
  try {
    const result = await hardwareManager.connectDevice(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== SUNLUX RP8020 PRINTER ROUTES ====================

// Print order ticket (Customer receipt) on Sunlux RP8020
app.post('/api/hardware/sunlux/print-order', requireAuth, async (req, res) => {
  try {
    const printer = hardwareManager.printers.get('sunlux_rp8020');
    if (!printer) {
      return res.status(404).json({ success: false, error: 'Sunlux RP8020 yazıcı bulunamadı' });
    }

    const result = await printer.printOrderTicket(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Print kitchen ticket on Sunlux RP8020
app.post('/api/hardware/sunlux/print-kitchen', requireAuth, async (req, res) => {
  try {
    const printer = hardwareManager.printers.get('sunlux_rp8020');
    if (!printer) {
      return res.status(404).json({ success: false, error: 'Sunlux RP8020 yazıcı bulunamadı' });
    }

    const result = await printer.printKitchenTicket(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Test print on Sunlux RP8020
app.post('/api/hardware/sunlux/test-print', requireAuth, async (req, res) => {
  try {
    const printer = hardwareManager.printers.get('sunlux_rp8020');
    if (!printer) {
      return res.status(404).json({ success: false, error: 'Sunlux RP8020 yazıcı bulunamadı' });
    }

    const result = await printer.printTest();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Print receipt (generic)
app.post('/api/hardware/printers/:id/receipt', requireAuth, async (req, res) => {
  try {
    const result = await hardwareManager.printReceipt(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Open cash drawer
app.post('/api/hardware/cash-drawer/:id/open', requireAuth, async (req, res) => {
  try {
    const result = await hardwareManager.openCashDrawer(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== FRONTEND ROUTES ====================

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/login/index.html'));
});

// Digital menu display (public)
app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/menu-display/index.html'));
});

// Admin console (yönetici only)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/admin/index.html'));
});

// Waiter interface (garson)
app.get('/waiter', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/waiter/index.html'));
});

// Root route - redirect to login
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Restaurant POS System Started');
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🍽️  Digital Menu: http://localhost:${PORT}/menu`);
  console.log(`⚙️  Admin Console: http://localhost:${PORT}/admin`);
  console.log('');
  console.log('📊 Modules Initialized:');
  console.log('  ✓ Menu Manager');
  console.log('  ✓ Inventory Manager');
  console.log('  ✓ Kitchen Manager');
  console.log('  ✓ Reporting Engine');
  console.log('  ✓ Hardware Manager');
});

module.exports = app;
