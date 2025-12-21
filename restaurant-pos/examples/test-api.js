/**
 * API Test Examples
 * Demonstrates how to use the Restaurant POS API
 */

const API_BASE = 'http://localhost:3000/api';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(API_BASE + endpoint, options);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ============ MENU TESTS ============

async function testMenu() {
    console.log('🍽️ Testing Menu API...\n');

    // Get full menu
    console.log('1. Getting full menu:');
    const menu = await apiCall('/menu');
    console.log(`   Found ${menu.data.length} categories`);

    // Create a new category
    console.log('\n2. Creating new category:');
    const newCategory = await apiCall('/menu/categories', 'POST', {
        name: 'Test Category',
        description: 'Test category for API testing',
        icon: '🧪'
    });
    console.log('   Created:', newCategory.data.name);

    // Create a new menu item
    console.log('\n3. Creating new menu item:');
    const newItem = await apiCall('/menu/items', 'POST', {
        name: 'Test Dish',
        description: 'A delicious test dish',
        price: 12.99,
        category: newCategory.data.id,
        preparationTime: 15,
        ingredients: ['ingredient1', 'ingredient2']
    });
    console.log('   Created:', newItem.data.name, '-', '$' + newItem.data.price);

    // Generate QR Code
    console.log('\n4. Generating QR Code:');
    const qr = await apiCall('/menu/qrcode');
    console.log('   QR Code URL:', qr.data.url);
    console.log('   QR Code generated successfully');

    console.log('\n✅ Menu tests completed!\n');
}

// ============ INVENTORY TESTS ============

async function testInventory() {
    console.log('📦 Testing Inventory API...\n');

    // Get all inventory
    console.log('1. Getting inventory:');
    const inventory = await apiCall('/inventory');
    console.log(`   Found ${inventory.data.length} inventory items`);

    // Get reorder alerts
    console.log('\n2. Checking reorder alerts:');
    const alerts = await apiCall('/inventory/alerts');
    console.log(`   ${alerts.data.length} items need reordering`);
    if (alerts.data.length > 0) {
        console.log('   First alert:', alerts.data[0].name);
    }

    // Add stock to first item
    if (inventory.data.length > 0) {
        const firstItem = inventory.data[0];
        console.log(`\n3. Adding stock to ${firstItem.name}:`);
        const result = await apiCall(`/inventory/${firstItem.id}/add-stock`, 'POST', {
            quantity: 25,
            notes: 'Test stock addition'
        });
        console.log(`   Previous: ${firstItem.currentStock}${firstItem.unit}`);
        console.log(`   New: ${result.data.currentStock}${result.data.unit}`);
    }

    // Get inventory summary
    console.log('\n4. Getting inventory summary:');
    const summary = await apiCall('/inventory/summary');
    console.log('   Total Items:', summary.data.totalItems);
    console.log('   Total Value: $' + summary.data.totalValue.toFixed(2));
    console.log('   Low Stock Items:', summary.data.lowStockItems);

    console.log('\n✅ Inventory tests completed!\n');
}

// ============ KITCHEN TESTS ============

async function testKitchen() {
    console.log('🍳 Testing Kitchen API...\n');

    // Create a test order
    console.log('1. Creating test order:');
    const order = await apiCall('/kitchen/orders', 'POST', {
        items: [
            {
                menuItemId: 'item_test',
                name: 'Grilled Salmon',
                quantity: 2,
                price: 24.99,
                modifications: ['no garlic', 'extra lemon']
            },
            {
                menuItemId: 'item_test_2',
                name: 'Caesar Salad',
                quantity: 1,
                price: 8.99
            }
        ],
        orderType: 'dine-in',
        tableNumber: '5',
        specialInstructions: 'Customer has nut allergy'
    });
    console.log('   Order Number:', order.data.orderNumber);
    console.log('   Order ID:', order.data.id);
    console.log('   Status:', order.data.status);

    const orderId = order.data.id;

    // Get kitchen display
    console.log('\n2. Getting kitchen display:');
    const display = await apiCall('/kitchen/display');
    console.log('   Pending Orders:', display.data.pending.length);
    console.log('   Preparing Orders:', display.data.preparing.length);
    console.log('   Ready Orders:', display.data.ready.length);

    // Start preparation
    console.log('\n3. Starting order preparation:');
    const started = await apiCall(`/kitchen/orders/${orderId}/start`, 'POST');
    console.log('   Status changed to:', started.data.status);

    // Mark as ready
    console.log('\n4. Marking order as ready:');
    const ready = await apiCall(`/kitchen/orders/${orderId}/ready`, 'POST');
    console.log('   Status changed to:', ready.data.status);

    // Get kitchen stats
    console.log('\n5. Getting kitchen stats:');
    const stats = await apiCall('/kitchen/stats?timeframe=today');
    console.log('   Active Orders:', stats.data.activeOrders);
    console.log('   Completed Today:', stats.data.completedOrders);

    console.log('\n✅ Kitchen tests completed!\n');
}

// ============ REPORTING TESTS ============

async function testReporting() {
    console.log('📊 Testing Reporting API...\n');

    // Daily summary
    console.log('1. Getting daily summary:');
    const daily = await apiCall('/reports/daily-summary');
    console.log('   Sales Today:', daily.data.sales.summary.totalOrders, 'orders');
    console.log('   Revenue: $' + daily.data.sales.summary.totalSales);
    console.log('   Low Stock Alerts:', daily.data.inventory.lowStockAlerts);

    // Sales report
    console.log('\n2. Getting weekly sales report:');
    const sales = await apiCall('/reports/sales?period=weekly');
    console.log('   Total Sales: $' + sales.data.summary.totalSales);
    console.log('   Total Orders:', sales.data.summary.totalOrders);
    console.log('   Avg Order Value: $' + sales.data.summary.averageOrderValue);

    // Employee performance
    console.log('\n3. Getting employee performance:');
    const employees = await apiCall('/reports/employees');
    console.log(`   Tracked Employees: ${employees.data.employees.length}`);
    if (employees.data.topPerformer) {
        console.log('   Top Performer:', employees.data.topPerformer.name);
        console.log('   Sales: $' + employees.data.topPerformer.totalSales.toFixed(2));
    }

    console.log('\n✅ Reporting tests completed!\n');
}

// ============ HARDWARE TESTS ============

async function testHardware() {
    console.log('🖨️ Testing Hardware API...\n');

    // Register a printer
    console.log('1. Registering printer:');
    const printer = await apiCall('/hardware/devices', 'POST', {
        deviceId: 'printer_test_1',
        deviceType: 'printer',
        config: {
            paperWidth: 80,
            encoding: 'UTF-8'
        }
    });
    console.log('   Registered:', printer.data.id);

    // Connect device
    console.log('\n2. Connecting printer:');
    const connected = await apiCall('/hardware/devices/printer_test_1/connect', 'POST');
    console.log('   Connection:', connected.data.message);

    // Print a test receipt
    console.log('\n3. Printing test receipt:');
    const receipt = await apiCall('/hardware/printers/printer_test_1/receipt', 'POST', {
        orderNumber: 'TEST001',
        date: new Date(),
        tableNumber: '5',
        items: [
            { name: 'Grilled Salmon', quantity: 1, price: 24.99 },
            { name: 'Caesar Salad', quantity: 1, price: 8.99 }
        ],
        totalAmount: 33.98,
        taxAmount: 3.40
    });
    console.log('   Print Status:', receipt.data.message);
    console.log('\n   Receipt Preview:');
    console.log('   ' + receipt.data.receipt.split('\n').join('\n   '));

    // Register cash drawer
    console.log('\n4. Registering cash drawer:');
    const drawer = await apiCall('/hardware/devices', 'POST', {
        deviceId: 'drawer_test_1',
        deviceType: 'cash_drawer'
    });
    console.log('   Registered:', drawer.data.id);

    // Connect and open drawer
    await apiCall('/hardware/devices/drawer_test_1/connect', 'POST');
    console.log('\n5. Opening cash drawer:');
    const opened = await apiCall('/hardware/cash-drawer/drawer_test_1/open', 'POST');
    console.log('   Drawer Status:', opened.data.message);

    // Get all devices
    console.log('\n6. Getting all devices:');
    const devices = await apiCall('/hardware/devices');
    console.log(`   Total Devices: ${devices.data.length}`);
    devices.data.forEach(device => {
        console.log(`   - ${device.type}: ${device.id} (${device.connected ? 'connected' : 'disconnected'})`);
    });

    console.log('\n✅ Hardware tests completed!\n');
}

// ============ RUN ALL TESTS ============

async function runAllTests() {
    console.log('\n');
    console.log('═══════════════════════════════════════════');
    console.log('  Restaurant POS System - API Test Suite');
    console.log('═══════════════════════════════════════════');
    console.log('\n');

    try {
        await testMenu();
        await testInventory();
        await testKitchen();
        await testReporting();
        await testHardware();

        console.log('═══════════════════════════════════════════');
        console.log('  ✅ All tests completed successfully!');
        console.log('═══════════════════════════════════════════\n');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\nMake sure the server is running on http://localhost:3000\n');
    }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    global.fetch = fetch;
    runAllTests();
} else {
    // Browser environment
    console.log('Run runAllTests() to execute all API tests');
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testMenu,
        testInventory,
        testKitchen,
        testReporting,
        testHardware,
        runAllTests
    };
}
