# Restaurant POS System

A comprehensive, modern Restaurant Point-of-Sale system with digital menu display, inventory management, kitchen management, reporting analytics, and hardware integration.

## Features

### 📱 Digital Menu System (Dijital Menü)
- **Responsive Design**: Works seamlessly on smartphones, tablets, and desktop browsers
- **QR Code Access**: Generate QR codes for customers to view the menu on their devices
- **Category Organization**: Menu items organized by categories (Appetizers, Main Courses, Desserts, Beverages)
- **Real-time Updates**: Menu updates from management console reflect immediately
- **Offline Support**: Local caching ensures menu is viewable even without internet connection
- **Detailed Item View**: Click any item to see full details, ingredients, allergens, and preparation time

### 📦 Stock and Cost Management (Stok ve Maliyet Yönetimi)
- **Inventory Tracking**: Monitor stock levels for all ingredients and supplies
- **Automatic Stock Updates**: Inventory automatically reduces when orders are placed
- **Cost of Goods Sold (COGS)**: Calculate costs for each order based on ingredient usage
- **Reorder Alerts**: Automatic notifications when stock falls below threshold
- **Manual Adjustments**: API endpoints to manually add, reduce, or set stock levels
- **Supplier Management**: Track suppliers for each inventory item
- **Transaction History**: Complete audit trail of all inventory changes
- **Summary Reports**: Generate comprehensive inventory and cost reports

### 🍳 Kitchen Management (Mutfak Yönetimi)
- **Order Routing**: Automatically route orders to appropriate kitchen stations
- **Kitchen Display System**: Real-time display of pending, preparing, and ready orders
- **Status Management**: Update order status (pending → preparing → ready → completed)
- **Station Management**: Track workload and capacity across multiple cooking stations
- **Ingredient Modifications**: Display special instructions and modifications for each item
- **Notifications**: Alert front-of-house or delivery system when orders are ready
- **Queue Management**: Efficiently manage order queue and preparation times
- **Performance Metrics**: Track preparation times and station utilization

### 📊 Reporting and Analytics (Raporlama ve Analiz)
- **Sales Reports**: Daily, weekly, and monthly sales summaries
- **Inventory Reports**: Stock levels, low-stock alerts, and inventory value
- **Employee Performance**: Track orders processed and sales per employee
- **Multiple Export Formats**:
  - JSON for data integration
  - CSV for spreadsheet analysis
- **Chart Generation**:
  - Bar charts for order type distribution
  - Line charts for sales trends
- **Dashboard Summaries**: Quick overview of key metrics
- **Trend Analysis**: Track growth and performance over time

### 🖨️ Hardware Integration (Donanım)
- **Receipt Printers**: Print customer receipts and kitchen tickets
- **Cash Drawers**: Programmatically open cash register drawers
- **Barcode Scanners**: Scan product barcodes for quick item lookup
- **Device Management**: Register, configure, and monitor hardware devices
- **Error Handling**: Robust error handling and connection management
- **Multiple Device Support**: Connect and manage multiple devices simultaneously
- **Device Configuration**: Customize settings for each hardware device

## Architecture

### Backend Modules
```
backend/
├── src/
│   ├── models/
│   │   ├── MenuItem.js         # Menu item data model
│   │   ├── Category.js         # Category data model
│   │   ├── InventoryItem.js    # Inventory item model
│   │   └── Order.js            # Order data model
│   ├── modules/
│   │   ├── menu/
│   │   │   └── MenuManager.js          # Menu management logic
│   │   ├── inventory/
│   │   │   └── InventoryManager.js     # Inventory management
│   │   ├── kitchen/
│   │   │   └── KitchenManager.js       # Kitchen operations
│   │   ├── reporting/
│   │   │   └── ReportingEngine.js      # Reports and analytics
│   │   └── hardware/
│   │       └── HardwareManager.js      # Hardware abstraction
│   └── server.js               # Express server and API routes
```

### Frontend
```
frontend/
├── menu-display/               # Digital menu for customers
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── admin/                      # Admin console (to be expanded)
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd restaurant-pos
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

4. **Access the application**
- API Server: `http://localhost:3000`
- Digital Menu: `http://localhost:3000/menu`
- Admin Console: `http://localhost:3000/admin`

## API Documentation

### Menu Endpoints

#### Get Full Menu
```
GET /api/menu
```
Returns complete menu with all categories and items.

#### Get Categories
```
GET /api/menu/categories
```
Returns all menu categories.

#### Create Menu Item
```
POST /api/menu/items
Content-Type: application/json

{
  "name": "Grilled Chicken",
  "description": "Tender grilled chicken breast",
  "price": 18.99,
  "category": "cat_123",
  "preparationTime": 20,
  "ingredients": ["chicken", "herbs", "olive oil"]
}
```

#### Update Menu Item
```
PUT /api/menu/items/:id
Content-Type: application/json

{
  "price": 19.99,
  "available": true
}
```

#### Generate QR Code
```
GET /api/menu/qrcode?baseUrl=http://yourserver.com
```

### Inventory Endpoints

#### Get All Inventory
```
GET /api/inventory
```

#### Add Stock
```
POST /api/inventory/:id/add-stock
Content-Type: application/json

{
  "quantity": 50,
  "notes": "Weekly restock"
}
```

#### Reduce Stock
```
POST /api/inventory/:id/reduce-stock
Content-Type: application/json

{
  "quantity": 10,
  "notes": "Daily usage"
}
```

#### Get Reorder Alerts
```
GET /api/inventory/alerts
```

### Kitchen Endpoints

#### Create Order
```
POST /api/kitchen/orders
Content-Type: application/json

{
  "items": [
    {
      "menuItemId": "item_123",
      "name": "Grilled Salmon",
      "quantity": 2,
      "price": 24.99,
      "modifications": ["no garlic"]
    }
  ],
  "orderType": "dine-in",
  "tableNumber": "12"
}
```

#### Get Kitchen Display
```
GET /api/kitchen/display
```

#### Update Order Status
```
PUT /api/kitchen/orders/:id/status
Content-Type: application/json

{
  "status": "preparing"
}
```

### Reporting Endpoints

#### Sales Report
```
GET /api/reports/sales?period=weekly
```

#### Export to CSV
```
GET /api/reports/export/csv?type=sales
```

#### Generate Sales Chart
```
GET /api/reports/charts/sales?period=weekly
```
Returns PNG image.

### Hardware Endpoints

#### Register Device
```
POST /api/hardware/devices
Content-Type: application/json

{
  "deviceId": "printer_1",
  "deviceType": "printer",
  "config": {
    "paperWidth": 80
  }
}
```

#### Print Receipt
```
POST /api/hardware/printers/:id/receipt
Content-Type: application/json

{
  "orderNumber": "20231115001",
  "items": [...],
  "totalAmount": 45.99
}
```

#### Open Cash Drawer
```
POST /api/hardware/cash-drawer/:id/open
```

## Usage Examples

### Example 1: Creating a Complete Menu

```javascript
// 1. Create a category
const category = await fetch('/api/menu/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Appetizers',
    description: 'Start your meal',
    icon: '🥗'
  })
});

// 2. Add menu items
const item = await fetch('/api/menu/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Caesar Salad',
    description: 'Fresh romaine with parmesan',
    price: 8.99,
    category: categoryId,
    ingredients: ['lettuce', 'parmesan', 'dressing']
  })
});
```

### Example 2: Processing an Order

```javascript
// Create order in kitchen
const order = await fetch('/api/kitchen/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [
      { name: 'Grilled Salmon', quantity: 1, price: 24.99 }
    ],
    orderType: 'dine-in',
    tableNumber: '5'
  })
});

// Update status as kitchen prepares
await fetch(`/api/kitchen/orders/${orderId}/status`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'preparing' })
});

// Mark as ready
await fetch(`/api/kitchen/orders/${orderId}/ready`, {
  method: 'POST'
});
```

### Example 3: Generating Reports

```javascript
// Get daily summary
const summary = await fetch('/api/reports/daily-summary');

// Export sales to CSV
window.location.href = '/api/reports/export/csv?type=sales';

// Display sales chart
const chartImg = document.getElementById('salesChart');
chartImg.src = '/api/reports/charts/sales?period=weekly';
```

## Mobile Responsiveness

The digital menu is fully responsive and optimized for:
- **Smartphones** (320px - 767px): Single column layout
- **Tablets** (768px - 1024px): Two-column grid
- **Desktop** (1024px+): Multi-column responsive grid

## Offline Support

The digital menu includes offline functionality:
- Automatic caching of menu data in localStorage
- 5-minute cache duration for optimal performance
- Fallback to cached data when server is unavailable
- Visual indicator when viewing offline data

## Development

### Project Structure
- `backend/src/models/` - Data models and schemas
- `backend/src/modules/` - Business logic modules
- `backend/src/server.js` - Express server configuration
- `frontend/menu-display/` - Customer-facing digital menu
- `frontend/admin/` - Management console

### Adding New Features

1. **New Menu Category**: Use POST `/api/menu/categories`
2. **New Inventory Item**: Use POST `/api/inventory`
3. **Custom Report**: Extend `ReportingEngine.js`
4. **New Hardware Device**: Add to `HardwareManager.js`

## Testing

```bash
npm test
```

## Dependencies

### Production
- **express**: Web server framework
- **cors**: Cross-origin resource sharing
- **qrcode**: QR code generation
- **node-cache**: In-memory caching
- **chart.js**: Chart generation
- **canvas**: Server-side canvas for charts
- **json2csv**: CSV export functionality

### Development
- **nodemon**: Auto-reload during development
- **jest**: Testing framework

## License

MIT

## Support

For issues, questions, or contributions, please visit the GitHub repository.

---

**Built with ❤️ for restaurant management**
