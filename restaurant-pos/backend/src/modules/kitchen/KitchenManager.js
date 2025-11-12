/**
 * KitchenManager Module
 * Manages kitchen display system, order routing, and status updates
 */
const Order = require('../../models/Order');
const EventEmitter = require('events');

class KitchenManager extends EventEmitter {
  constructor() {
    super();
    this.orderQueue = [];
    this.activeOrders = new Map();
    this.completedOrders = new Map();
    this.stations = new Map(); // cooking stations
    this.initializeStations();
  }

  // Initialize cooking stations
  initializeStations() {
    const stations = [
      { id: 'grill', name: 'Grill Station', capacity: 5, currentLoad: 0 },
      { id: 'pasta', name: 'Pasta Station', capacity: 4, currentLoad: 0 },
      { id: 'salad', name: 'Salad Station', capacity: 6, currentLoad: 0 },
      { id: 'dessert', name: 'Dessert Station', capacity: 4, currentLoad: 0 },
      { id: 'beverage', name: 'Beverage Station', capacity: 8, currentLoad: 0 }
    ];

    stations.forEach(station => {
      this.stations.set(station.id, station);
    });
  }

  // Order Reception
  receiveOrder(orderData) {
    const order = new Order(orderData);
    this.orderQueue.push(order);
    this.activeOrders.set(order.id, order);

    this.emit('newOrder', order.toJSON());
    this.routeOrderToStation(order);

    return order;
  }

  // Route order to appropriate station
  routeOrderToStation(order) {
    const routingInfo = [];

    order.items.forEach(item => {
      const station = this.determineStation(item.name);
      if (station) {
        routingInfo.push({
          itemName: item.name,
          station: station.name,
          stationId: station.id
        });
        station.currentLoad++;
      }
    });

    this.emit('orderRouted', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      routing: routingInfo
    });

    return routingInfo;
  }

  // Determine which station handles which item
  determineStation(itemName) {
    const name = itemName.toLowerCase();

    if (name.includes('steak') || name.includes('salmon') || name.includes('grilled')) {
      return this.stations.get('grill');
    } else if (name.includes('pasta') || name.includes('penne')) {
      return this.stations.get('pasta');
    } else if (name.includes('salad') || name.includes('bruschetta')) {
      return this.stations.get('salad');
    } else if (name.includes('cake') || name.includes('tiramisu') || name.includes('dessert')) {
      return this.stations.get('dessert');
    } else if (name.includes('coffee') || name.includes('lemonade') || name.includes('beverage')) {
      return this.stations.get('beverage');
    }

    return this.stations.get('grill'); // default
  }

  // Order Status Management
  updateOrderStatus(orderId, newStatus) {
    const order = this.activeOrders.get(orderId);
    if (!order) throw new Error('Order not found in active orders');

    const previousStatus = order.status;
    order.updateStatus(newStatus);

    this.emit('orderStatusUpdated', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus: previousStatus,
      newStatus: newStatus,
      timestamp: new Date()
    });

    // If order is completed, move it to completed orders
    if (newStatus === 'completed') {
      this.completeOrder(orderId);
    }

    return order;
  }

  startPreparation(orderId) {
    return this.updateOrderStatus(orderId, 'preparing');
  }

  markOrderReady(orderId) {
    return this.updateOrderStatus(orderId, 'ready');
  }

  completeOrder(orderId) {
    const order = this.activeOrders.get(orderId);
    if (!order) throw new Error('Order not found');

    order.updateStatus('completed');
    this.completedOrders.set(orderId, order);
    this.activeOrders.delete(orderId);

    // Remove from queue
    this.orderQueue = this.orderQueue.filter(o => o.id !== orderId);

    // Reduce station load
    order.items.forEach(item => {
      const station = this.determineStation(item.name);
      if (station && station.currentLoad > 0) {
        station.currentLoad--;
      }
    });

    this.emit('orderCompleted', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      completedAt: order.completedAt
    });

    return order;
  }

  cancelOrder(orderId, reason = '') {
    const order = this.activeOrders.get(orderId);
    if (!order) throw new Error('Order not found');

    order.updateStatus('cancelled');
    this.activeOrders.delete(orderId);
    this.orderQueue = this.orderQueue.filter(o => o.id !== orderId);

    // Reduce station load
    order.items.forEach(item => {
      const station = this.determineStation(item.name);
      if (station && station.currentLoad > 0) {
        station.currentLoad--;
      }
    });

    this.emit('orderCancelled', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      reason: reason
    });

    return order;
  }

  // Queue Management
  getOrderQueue() {
    return this.orderQueue.map(order => ({
      ...order.toJSON(),
      estimatedTime: this.estimatePreparationTime(order)
    }));
  }

  getPendingOrders() {
    return Array.from(this.activeOrders.values())
      .filter(order => order.status === 'pending')
      .map(order => order.toJSON());
  }

  getPreparingOrders() {
    return Array.from(this.activeOrders.values())
      .filter(order => order.status === 'preparing')
      .map(order => order.toJSON());
  }

  getReadyOrders() {
    return Array.from(this.activeOrders.values())
      .filter(order => order.status === 'ready')
      .map(order => order.toJSON());
  }

  getOrderById(orderId) {
    return this.activeOrders.get(orderId) || this.completedOrders.get(orderId);
  }

  // Display Management
  getKitchenDisplay() {
    return {
      pending: this.getPendingOrders(),
      preparing: this.getPreparingOrders(),
      ready: this.getReadyOrders(),
      stations: this.getStationStatus(),
      timestamp: new Date()
    };
  }

  getStationStatus() {
    return Array.from(this.stations.values()).map(station => ({
      id: station.id,
      name: station.name,
      capacity: station.capacity,
      currentLoad: station.currentLoad,
      utilizationPercentage: ((station.currentLoad / station.capacity) * 100).toFixed(1)
    }));
  }

  // Estimated Time
  estimatePreparationTime(order) {
    let maxTime = 0;

    order.items.forEach(item => {
      const prepTime = item.preparationTime || 15;
      if (prepTime > maxTime) {
        maxTime = prepTime;
      }
    });

    return maxTime;
  }

  // Item Modifications
  addItemModification(orderId, itemIndex, modification) {
    const order = this.activeOrders.get(orderId);
    if (!order) throw new Error('Order not found');

    if (!order.items[itemIndex]) throw new Error('Item not found in order');

    if (!order.items[itemIndex].modifications) {
      order.items[itemIndex].modifications = [];
    }

    order.items[itemIndex].modifications.push(modification);
    order.updatedAt = new Date();

    this.emit('itemModified', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      itemIndex: itemIndex,
      modification: modification
    });

    return order;
  }

  getItemModifications(orderId, itemIndex) {
    const order = this.activeOrders.get(orderId);
    if (!order) throw new Error('Order not found');

    return order.items[itemIndex]?.modifications || [];
  }

  // Statistics
  getKitchenStats(timeframe = 'today') {
    const now = new Date();
    let startTime;

    if (timeframe === 'today') {
      startTime = new Date(now.setHours(0, 0, 0, 0));
    } else if (timeframe === 'week') {
      startTime = new Date(now.setDate(now.getDate() - 7));
    } else if (timeframe === 'month') {
      startTime = new Date(now.setMonth(now.getMonth() - 1));
    }

    const relevantOrders = Array.from(this.completedOrders.values())
      .filter(order => new Date(order.completedAt) >= startTime);

    const totalOrders = relevantOrders.length;
    const avgPreparationTime = totalOrders > 0
      ? relevantOrders.reduce((sum, order) => {
          const prepTime = (new Date(order.completedAt) - new Date(order.createdAt)) / 1000 / 60;
          return sum + prepTime;
        }, 0) / totalOrders
      : 0;

    return {
      activeOrders: this.activeOrders.size,
      completedOrders: totalOrders,
      averagePreparationTime: avgPreparationTime.toFixed(2) + ' minutes',
      stationUtilization: this.getStationStatus(),
      pendingCount: this.getPendingOrders().length,
      preparingCount: this.getPreparingOrders().length,
      readyCount: this.getReadyOrders().length
    };
  }

  // Notifications
  notifyFrontOfHouse(orderId) {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    const notification = {
      type: 'order_ready',
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      orderType: order.orderType,
      timestamp: new Date()
    };

    this.emit('notifyFrontOfHouse', notification);
    return notification;
  }

  notifyDeliverySystem(orderId) {
    const order = this.getOrderById(orderId);
    if (!order) throw new Error('Order not found');

    if (order.orderType !== 'delivery') {
      throw new Error('Order is not a delivery order');
    }

    const notification = {
      type: 'delivery_ready',
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      timestamp: new Date()
    };

    this.emit('notifyDelivery', notification);
    return notification;
  }
}

module.exports = KitchenManager;
