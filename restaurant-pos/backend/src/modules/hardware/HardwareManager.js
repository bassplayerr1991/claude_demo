/**
 * HardwareManager Module
 * Abstraction layer for POS hardware devices
 * Supports printers, cash registers, and barcode scanners
 * SUNLUX RP8020 Thermal Printer support added
 */
const EventEmitter = require('events');
const SunluxRP8020Printer = require('./SunluxRP8020Printer');

class HardwareManager extends EventEmitter {
  constructor() {
    super();
    this.devices = new Map();
    this.printers = new Map();
    this.cashDrawers = new Map();
    this.barcodeScanner = null;
    this.initializeSunluxPrinter();
  }

  // Initialize Sunlux RP8020 printer by default
  initializeSunluxPrinter() {
    const sunluxConfig = {
      paperWidth: 80,
      encoding: 'UTF-8',
      baudRate: 9600,
      cutPaper: true,
      buzzer: true
    };

    this.registerDevice('sunlux_rp8020', 'sunlux_printer', sunluxConfig);
    console.log('✅ Sunlux RP8020 yazıcı hazır');
  }

  // Device Registration
  registerDevice(deviceId, deviceType, config = {}) {
    const device = {
      id: deviceId,
      type: deviceType,
      config: config,
      connected: false,
      lastConnected: null,
      errors: []
    };

    this.devices.set(deviceId, device);

    if (deviceType === 'sunlux_printer') {
      this.printers.set(deviceId, new SunluxRP8020Printer(deviceId, config));
    } else if (deviceType === 'printer') {
      this.printers.set(deviceId, new ReceiptPrinter(deviceId, config));
    } else if (deviceType === 'cash_drawer') {
      this.cashDrawers.set(deviceId, new CashDrawer(deviceId, config));
    } else if (deviceType === 'barcode_scanner') {
      this.barcodeScanner = new BarcodeScanner(deviceId, config);
    }

    return device;
  }

  unregisterDevice(deviceId) {
    this.devices.delete(deviceId);
    this.printers.delete(deviceId);
    this.cashDrawers.delete(deviceId);
    return true;
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  getAllDevices() {
    return Array.from(this.devices.values());
  }

  // Connection Management
  async connectDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error('Device not found');

    try {
      // Simulate connection
      device.connected = true;
      device.lastConnected = new Date();

      this.emit('deviceConnected', {
        deviceId: deviceId,
        type: device.type,
        timestamp: new Date()
      });

      return { success: true, message: 'Device connected successfully' };
    } catch (error) {
      device.errors.push({
        message: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  disconnectDevice(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error('Device not found');

    device.connected = false;

    this.emit('deviceDisconnected', {
      deviceId: deviceId,
      type: device.type,
      timestamp: new Date()
    });

    return { success: true, message: 'Device disconnected' };
  }

  // Printer Operations
  async printReceipt(printerId, receiptData) {
    const printer = this.printers.get(printerId);
    if (!printer) throw new Error('Printer not found');

    const device = this.devices.get(printerId);
    if (!device.connected) throw new Error('Printer not connected');

    return await printer.printReceipt(receiptData);
  }

  async printKitchenTicket(printerId, orderData) {
    const printer = this.printers.get(printerId);
    if (!printer) throw new Error('Printer not found');

    return await printer.printKitchenTicket(orderData);
  }

  // Cash Drawer Operations
  async openCashDrawer(drawerId) {
    const drawer = this.cashDrawers.get(drawerId);
    if (!drawer) throw new Error('Cash drawer not found');

    const device = this.devices.get(drawerId);
    if (!device.connected) throw new Error('Cash drawer not connected');

    return await drawer.open();
  }

  // Barcode Scanner Operations
  async startScanning() {
    if (!this.barcodeScanner) throw new Error('Barcode scanner not registered');

    this.barcodeScanner.on('scan', (data) => {
      this.emit('barcodeScanned', data);
    });

    return this.barcodeScanner.startScanning();
  }

  stopScanning() {
    if (!this.barcodeScanner) throw new Error('Barcode scanner not registered');
    return this.barcodeScanner.stopScanning();
  }

  // Device Status
  getDeviceStatus(deviceId) {
    const device = this.devices.get(deviceId);
    if (!device) throw new Error('Device not found');

    return {
      id: device.id,
      type: device.type,
      connected: device.connected,
      lastConnected: device.lastConnected,
      errors: device.errors,
      config: device.config
    };
  }

  getAllDeviceStatuses() {
    return Array.from(this.devices.values()).map(device => ({
      id: device.id,
      type: device.type,
      connected: device.connected,
      lastConnected: device.lastConnected,
      errorCount: device.errors.length
    }));
  }
}

/**
 * ReceiptPrinter Class
 * Handles receipt printing operations
 */
class ReceiptPrinter extends EventEmitter {
  constructor(id, config) {
    super();
    this.id = id;
    this.config = {
      paperWidth: config.paperWidth || 80, // mm
      encoding: config.encoding || 'UTF-8',
      cutPaper: config.cutPaper !== false,
      ...config
    };
  }

  async printReceipt(receiptData) {
    try {
      const receipt = this.formatReceipt(receiptData);

      // Simulate printing delay
      await this.simulatePrinting();

      this.emit('printed', {
        type: 'receipt',
        orderId: receiptData.orderId,
        timestamp: new Date()
      });

      return {
        success: true,
        receipt: receipt,
        message: 'Receipt printed successfully'
      };
    } catch (error) {
      throw new Error('Print failed: ' + error.message);
    }
  }

  async printKitchenTicket(orderData) {
    try {
      const ticket = this.formatKitchenTicket(orderData);

      await this.simulatePrinting();

      this.emit('printed', {
        type: 'kitchen_ticket',
        orderId: orderData.id,
        timestamp: new Date()
      });

      return {
        success: true,
        ticket: ticket,
        message: 'Kitchen ticket printed successfully'
      };
    } catch (error) {
      throw new Error('Print failed: ' + error.message);
    }
  }

  formatReceipt(data) {
    const lines = [];
    const width = this.config.paperWidth === 80 ? 48 : 32;

    // Header
    lines.push(this.centerText('RESTAURANT POS', width));
    lines.push(this.centerText('123 Main Street', width));
    lines.push(this.centerText('Phone: (555) 123-4567', width));
    lines.push(this.line('-', width));

    // Order Info
    lines.push(`Order #: ${data.orderNumber}`);
    lines.push(`Date: ${new Date(data.date || new Date()).toLocaleString()}`);
    lines.push(`Table: ${data.tableNumber || 'N/A'}`);
    lines.push(this.line('-', width));

    // Items
    data.items.forEach(item => {
      const name = item.name.substring(0, width - 15);
      const qty = `${item.quantity}x`;
      const price = `$${(item.price * item.quantity).toFixed(2)}`;
      lines.push(`${name.padEnd(width - 12)} ${qty.padStart(4)} ${price.padStart(8)}`);

      if (item.modifications && item.modifications.length > 0) {
        item.modifications.forEach(mod => {
          lines.push(`  * ${mod}`);
        });
      }
    });

    lines.push(this.line('-', width));

    // Totals
    lines.push(`${'Subtotal:'.padEnd(width - 10)} $${data.subtotal || data.totalAmount}`);
    if (data.taxAmount) {
      lines.push(`${'Tax:'.padEnd(width - 10)} $${data.taxAmount}`);
    }
    lines.push(`${'TOTAL:'.padEnd(width - 10)} $${data.totalAmount}`);

    lines.push(this.line('=', width));
    lines.push(this.centerText('Thank you for your visit!', width));

    if (this.config.cutPaper) {
      lines.push('\n[CUT]\n');
    }

    return lines.join('\n');
  }

  formatKitchenTicket(orderData) {
    const lines = [];
    const width = 40;

    lines.push(this.centerText('*** KITCHEN TICKET ***', width));
    lines.push(this.line('=', width));

    lines.push(`Order #: ${orderData.orderNumber}`);
    lines.push(`Time: ${new Date().toLocaleTimeString()}`);
    lines.push(`Type: ${orderData.orderType}`);
    if (orderData.tableNumber) {
      lines.push(`Table: ${orderData.tableNumber}`);
    }
    lines.push(this.line('-', width));

    // Items
    orderData.items.forEach(item => {
      lines.push(`${item.quantity}x ${item.name}`);

      if (item.modifications && item.modifications.length > 0) {
        item.modifications.forEach(mod => {
          lines.push(`   ** ${mod.toUpperCase()} **`);
        });
      }
      lines.push('');
    });

    if (orderData.specialInstructions) {
      lines.push(this.line('-', width));
      lines.push('SPECIAL INSTRUCTIONS:');
      lines.push(orderData.specialInstructions);
    }

    lines.push(this.line('=', width));

    if (this.config.cutPaper) {
      lines.push('\n[CUT]\n');
    }

    return lines.join('\n');
  }

  centerText(text, width) {
    const padding = Math.floor((width - text.length) / 2);
    return ' '.repeat(padding) + text;
  }

  line(char, width) {
    return char.repeat(width);
  }

  async simulatePrinting() {
    return new Promise(resolve => setTimeout(resolve, 500));
  }
}

/**
 * CashDrawer Class
 * Handles cash drawer operations
 */
class CashDrawer extends EventEmitter {
  constructor(id, config) {
    super();
    this.id = id;
    this.config = config;
    this.isOpen = false;
  }

  async open() {
    try {
      // Simulate opening delay
      await new Promise(resolve => setTimeout(resolve, 200));

      this.isOpen = true;

      this.emit('opened', {
        drawerId: this.id,
        timestamp: new Date()
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        this.isOpen = false;
        this.emit('closed', {
          drawerId: this.id,
          timestamp: new Date()
        });
      }, 5000);

      return {
        success: true,
        message: 'Cash drawer opened'
      };
    } catch (error) {
      throw new Error('Failed to open cash drawer: ' + error.message);
    }
  }

  getStatus() {
    return {
      id: this.id,
      isOpen: this.isOpen
    };
  }
}

/**
 * BarcodeScanner Class
 * Handles barcode scanning operations
 */
class BarcodeScanner extends EventEmitter {
  constructor(id, config) {
    super();
    this.id = id;
    this.config = config;
    this.scanning = false;
  }

  startScanning() {
    this.scanning = true;

    this.emit('scanningStarted', {
      scannerId: this.id,
      timestamp: new Date()
    });

    return {
      success: true,
      message: 'Barcode scanning started'
    };
  }

  stopScanning() {
    this.scanning = false;

    this.emit('scanningStopped', {
      scannerId: this.id,
      timestamp: new Date()
    });

    return {
      success: true,
      message: 'Barcode scanning stopped'
    };
  }

  // Simulate a scan (would be triggered by actual hardware)
  simulateScan(barcode) {
    if (!this.scanning) {
      throw new Error('Scanner is not active');
    }

    const scanData = {
      barcode: barcode,
      scannerId: this.id,
      timestamp: new Date()
    };

    this.emit('scan', scanData);

    return scanData;
  }

  getStatus() {
    return {
      id: this.id,
      scanning: this.scanning
    };
  }
}

module.exports = HardwareManager;
