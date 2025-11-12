/**
 * Restaurant POS System - Main Server
 * Integrates all modules and provides REST API
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

// Event listeners
inventoryManager.on('reorderAlert', (alert) => {
  console.log('🔔 Reorder Alert:', alert.name, '- Current stock:', alert.currentStock);
});

kitchenManager.on('newOrder', (order) => {
  console.log('🍽️ New Order:', order.orderNumber);
});

kitchenManager.on('orderCompleted', (data) => {
  console.log('✅ Order Completed:', data.orderNumber);
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

// Get all inventory items
app.get('/api/inventory', (req, res) => {
  try {
    const items = inventoryManager.getAllItems();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create inventory item
app.post('/api/inventory', (req, res) => {
  try {
    const item = inventoryManager.createItem(req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update inventory item
app.put('/api/inventory/:id', (req, res) => {
  try {
    const item = inventoryManager.updateItem(req.params.id, req.body);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Add stock
app.post('/api/inventory/:id/add-stock', (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const item = inventoryManager.addStock(req.params.id, quantity, notes);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Reduce stock
app.post('/api/inventory/:id/reduce-stock', (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const item = inventoryManager.reduceStock(req.params.id, quantity, notes);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Set stock level
app.post('/api/inventory/:id/set-stock', (req, res) => {
  try {
    const { quantity, notes } = req.body;
    const item = inventoryManager.setStock(req.params.id, quantity, notes);
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Check reorder alerts
app.get('/api/inventory/alerts', (req, res) => {
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

// Create new order
app.post('/api/kitchen/orders', (req, res) => {
  try {
    const order = kitchenManager.receiveOrder(req.body);

    // Update inventory
    if (req.body.items) {
      inventoryManager.processOrderStockUpdate(req.body.items);
    }

    res.json({ success: true, data: order.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get kitchen display
app.get('/api/kitchen/display', (req, res) => {
  try {
    const display = kitchenManager.getKitchenDisplay();
    res.json({ success: true, data: display });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status
app.put('/api/kitchen/orders/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const order = kitchenManager.updateOrderStatus(req.params.id, status);
    res.json({ success: true, data: order.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Start preparing order
app.post('/api/kitchen/orders/:id/start', (req, res) => {
  try {
    const order = kitchenManager.startPreparation(req.params.id);
    res.json({ success: true, data: order.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Mark order as ready
app.post('/api/kitchen/orders/:id/ready', (req, res) => {
  try {
    const order = kitchenManager.markOrderReady(req.params.id);
    res.json({ success: true, data: order.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Complete order
app.post('/api/kitchen/orders/:id/complete', (req, res) => {
  try {
    const order = kitchenManager.completeOrder(req.params.id);
    res.json({ success: true, data: order.toJSON() });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get kitchen stats
app.get('/api/kitchen/stats', (req, res) => {
  try {
    const timeframe = req.query.timeframe || 'today';
    const stats = kitchenManager.getKitchenStats(timeframe);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== REPORTING API ROUTES ====================

// Generate sales report
app.get('/api/reports/sales', (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const report = reportingEngine.generateSalesReport(period, startDate, endDate);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate inventory report
app.get('/api/reports/inventory', (req, res) => {
  try {
    const report = reportingEngine.generateInventoryReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate employee performance report
app.get('/api/reports/employees', (req, res) => {
  try {
    const report = reportingEngine.generateEmployeePerformanceReport();
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Daily summary
app.get('/api/reports/daily-summary', (req, res) => {
  try {
    const summary = reportingEngine.generateDailySummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export reports as CSV
app.get('/api/reports/export/csv', (req, res) => {
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
app.get('/api/reports/charts/sales', (req, res) => {
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
app.post('/api/hardware/devices', (req, res) => {
  try {
    const { deviceId, deviceType, config } = req.body;
    const device = hardwareManager.registerDevice(deviceId, deviceType, config);
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get all devices
app.get('/api/hardware/devices', (req, res) => {
  try {
    const devices = hardwareManager.getAllDeviceStatuses();
    res.json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Connect device
app.post('/api/hardware/devices/:id/connect', async (req, res) => {
  try {
    const result = await hardwareManager.connectDevice(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Print receipt
app.post('/api/hardware/printers/:id/receipt', async (req, res) => {
  try {
    const result = await hardwareManager.printReceipt(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Open cash drawer
app.post('/api/hardware/cash-drawer/:id/open', async (req, res) => {
  try {
    const result = await hardwareManager.openCashDrawer(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ==================== FRONTEND ROUTES ====================

// Digital menu display
app.get('/menu', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/menu-display/index.html'));
});

// Admin console
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/admin/index.html'));
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Restaurant POS System API',
    version: '1.0.0',
    endpoints: {
      menu: '/api/menu',
      inventory: '/api/inventory',
      kitchen: '/api/kitchen',
      reports: '/api/reports',
      hardware: '/api/hardware'
    }
  });
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
