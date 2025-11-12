/**
 * ReportingEngine Module
 * Generates sales, inventory, and employee performance reports
 * Supports JSON, CSV export and chart generation
 */
const { Parser } = require('json2csv');
const { createCanvas } = require('canvas');

class ReportingEngine {
  constructor(menuManager, inventoryManager, kitchenManager) {
    this.menuManager = menuManager;
    this.inventoryManager = inventoryManager;
    this.kitchenManager = kitchenManager;
    this.salesData = [];
    this.employeeData = new Map();
    this.initializeSampleData();
  }

  // Initialize sample data
  initializeSampleData() {
    // Sample sales data for the past 30 days
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const dailySales = Math.floor(Math.random() * 20) + 10; // 10-30 orders
      for (let j = 0; j < dailySales; j++) {
        this.salesData.push({
          id: `sale_${i}_${j}`,
          date: date,
          orderNumber: `ORD${i}${j}`,
          totalAmount: (Math.random() * 100 + 20).toFixed(2),
          items: Math.floor(Math.random() * 5) + 1,
          orderType: ['dine-in', 'takeaway', 'delivery'][Math.floor(Math.random() * 3)],
          employeeId: 'emp_' + (Math.floor(Math.random() * 5) + 1)
        });
      }
    }

    // Sample employee data
    for (let i = 1; i <= 5; i++) {
      this.employeeData.set(`emp_${i}`, {
        id: `emp_${i}`,
        name: `Employee ${i}`,
        role: ['Waiter', 'Cashier', 'Manager'][Math.floor(Math.random() * 3)],
        ordersProcessed: 0,
        totalSales: 0,
        avgOrderValue: 0
      });
    }

    this.calculateEmployeePerformance();
  }

  // Sales Reports
  generateSalesReport(period = 'daily', startDate = null, endDate = null) {
    const now = new Date();
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = now;
      if (period === 'daily') {
        start = new Date(now.setHours(0, 0, 0, 0));
      } else if (period === 'weekly') {
        start = new Date(now.setDate(now.getDate() - 7));
      } else if (period === 'monthly') {
        start = new Date(now.setMonth(now.getMonth() - 1));
      }
    }

    const filteredSales = this.salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= start && saleDate <= end;
    });

    const totalSales = filteredSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
    const totalOrders = filteredSales.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const byOrderType = this.groupByOrderType(filteredSales);
    const dailyBreakdown = this.groupByDate(filteredSales);

    return {
      period: period,
      startDate: start,
      endDate: end,
      summary: {
        totalSales: totalSales.toFixed(2),
        totalOrders: totalOrders,
        averageOrderValue: avgOrderValue.toFixed(2)
      },
      byOrderType: byOrderType,
      dailyBreakdown: dailyBreakdown,
      generatedAt: new Date()
    };
  }

  groupByOrderType(sales) {
    const grouped = {};

    sales.forEach(sale => {
      if (!grouped[sale.orderType]) {
        grouped[sale.orderType] = {
          count: 0,
          total: 0
        };
      }
      grouped[sale.orderType].count++;
      grouped[sale.orderType].total += parseFloat(sale.totalAmount);
    });

    return grouped;
  }

  groupByDate(sales) {
    const grouped = {};

    sales.forEach(sale => {
      const dateKey = new Date(sale.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          orders: 0,
          revenue: 0
        };
      }
      grouped[dateKey].orders++;
      grouped[dateKey].revenue += parseFloat(sale.totalAmount);
    });

    return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Inventory Reports
  generateInventoryReport() {
    return this.inventoryManager.generateStockReport();
  }

  // Employee Performance Reports
  calculateEmployeePerformance() {
    this.salesData.forEach(sale => {
      const employee = this.employeeData.get(sale.employeeId);
      if (employee) {
        employee.ordersProcessed++;
        employee.totalSales += parseFloat(sale.totalAmount);
      }
    });

    this.employeeData.forEach(employee => {
      if (employee.ordersProcessed > 0) {
        employee.avgOrderValue = (employee.totalSales / employee.ordersProcessed).toFixed(2);
      }
    });
  }

  generateEmployeePerformanceReport(startDate = null, endDate = null) {
    const employees = Array.from(this.employeeData.values());

    return {
      employees: employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        role: emp.role,
        ordersProcessed: emp.ordersProcessed,
        totalSales: emp.totalSales.toFixed(2),
        averageOrderValue: emp.avgOrderValue
      })),
      topPerformer: employees.reduce((top, emp) =>
        emp.totalSales > (top?.totalSales || 0) ? emp : top, null
      ),
      generatedAt: new Date()
    };
  }

  // Summary Reports
  generateDailySummary() {
    const salesReport = this.generateSalesReport('daily');
    const inventoryAlerts = this.inventoryManager.checkReorderAlerts();
    const kitchenStats = this.kitchenManager.getKitchenStats('today');

    return {
      sales: salesReport,
      inventory: {
        lowStockAlerts: inventoryAlerts.length,
        alerts: inventoryAlerts
      },
      kitchen: kitchenStats,
      generatedAt: new Date()
    };
  }

  generateWeeklySummary() {
    const salesReport = this.generateSalesReport('weekly');
    const inventoryReport = this.generateInventoryReport();
    const employeeReport = this.generateEmployeePerformanceReport();

    return {
      sales: salesReport,
      inventory: inventoryReport.summary,
      employees: employeeReport,
      generatedAt: new Date()
    };
  }

  generateMonthlySummary() {
    const salesReport = this.generateSalesReport('monthly');
    const inventoryReport = this.generateInventoryReport();
    const employeeReport = this.generateEmployeePerformanceReport();

    return {
      sales: salesReport,
      inventory: inventoryReport.summary,
      employees: employeeReport,
      trends: this.calculateTrends(),
      generatedAt: new Date()
    };
  }

  calculateTrends() {
    const lastMonth = this.generateSalesReport('monthly');
    const now = new Date();
    const previousStart = new Date(now.setMonth(now.getMonth() - 2));
    const previousEnd = new Date(now.setMonth(now.getMonth() - 1));
    const previousMonth = this.generateSalesReport('monthly', previousStart, previousEnd);

    const salesGrowth = previousMonth.summary.totalSales > 0
      ? (((lastMonth.summary.totalSales - previousMonth.summary.totalSales) / previousMonth.summary.totalSales) * 100).toFixed(2)
      : 0;

    return {
      salesGrowth: salesGrowth + '%',
      orderGrowth: ((lastMonth.summary.totalOrders - previousMonth.summary.totalOrders) / previousMonth.summary.totalOrders * 100).toFixed(2) + '%'
    };
  }

  // Export Functions
  exportToJSON(reportData) {
    return JSON.stringify(reportData, null, 2);
  }

  exportToCSV(reportData, type = 'sales') {
    let fields, data;

    if (type === 'sales') {
      if (reportData.dailyBreakdown) {
        fields = ['date', 'orders', 'revenue'];
        data = reportData.dailyBreakdown;
      } else {
        fields = ['id', 'orderNumber', 'date', 'totalAmount', 'items', 'orderType'];
        data = this.salesData;
      }
    } else if (type === 'inventory') {
      fields = ['id', 'name', 'sku', 'currentStock', 'unit', 'reorderThreshold', 'costPerUnit', 'totalValue'];
      data = reportData.items || this.inventoryManager.getAllItems();
    } else if (type === 'employees') {
      fields = ['id', 'name', 'role', 'ordersProcessed', 'totalSales', 'averageOrderValue'];
      data = reportData.employees || Array.from(this.employeeData.values());
    }

    try {
      const parser = new Parser({ fields });
      return parser.parse(data);
    } catch (error) {
      throw new Error('Failed to generate CSV: ' + error.message);
    }
  }

  // Chart Generation
  generateBarChart(data, options = {}) {
    const width = options.width || 800;
    const height = options.height || 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(options.title || 'Bar Chart', width / 2, 30);

    // Chart area
    const chartMargin = 60;
    const chartWidth = width - chartMargin * 2;
    const chartHeight = height - chartMargin * 2 - 40;
    const barWidth = chartWidth / data.length - 10;

    // Find max value
    const maxValue = Math.max(...data.map(d => d.value));

    // Draw bars
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = chartMargin + index * (barWidth + 10);
      const y = height - chartMargin - barHeight - 20;

      // Bar
      ctx.fillStyle = options.barColor || '#4CAF50';
      ctx.fillRect(x, y, barWidth, barHeight);

      // Label
      ctx.fillStyle = '#333333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, height - chartMargin);

      // Value
      ctx.fillText(item.value.toFixed(0), x + barWidth / 2, y - 5);
    });

    return canvas.toBuffer('image/png');
  }

  generateLineChart(data, options = {}) {
    const width = options.width || 800;
    const height = options.height || 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(options.title || 'Line Chart', width / 2, 30);

    // Chart area
    const chartMargin = 60;
    const chartWidth = width - chartMargin * 2;
    const chartHeight = height - chartMargin * 2 - 40;

    // Find max value
    const maxValue = Math.max(...data.map(d => d.value));

    // Calculate points
    const points = data.map((item, index) => {
      const x = chartMargin + (index / (data.length - 1)) * chartWidth;
      const y = height - chartMargin - 20 - (item.value / maxValue) * chartHeight;
      return { x, y, label: item.label, value: item.value };
    });

    // Draw line
    ctx.strokeStyle = options.lineColor || '#2196F3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();

    // Draw points and labels
    points.forEach(point => {
      // Point
      ctx.fillStyle = options.pointColor || '#2196F3';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#333333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.label, point.x, height - chartMargin);
      ctx.fillText(point.value.toFixed(0), point.x, point.y - 10);
    });

    return canvas.toBuffer('image/png');
  }

  // Dashboard Charts
  generateSalesChart(period = 'weekly') {
    const salesReport = this.generateSalesReport(period);
    const data = salesReport.dailyBreakdown.map(day => ({
      label: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: parseFloat(day.revenue)
    }));

    return this.generateLineChart(data, {
      title: `Sales Report - ${period.charAt(0).toUpperCase() + period.slice(1)}`,
      lineColor: '#4CAF50'
    });
  }

  generateOrderTypeChart() {
    const salesReport = this.generateSalesReport('weekly');
    const data = Object.keys(salesReport.byOrderType).map(type => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: salesReport.byOrderType[type].count
    }));

    return this.generateBarChart(data, {
      title: 'Orders by Type - Weekly',
      barColor: '#2196F3'
    });
  }
}

module.exports = ReportingEngine;
