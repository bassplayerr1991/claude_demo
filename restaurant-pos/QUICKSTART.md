# Quick Start Guide

Get the Restaurant POS System up and running in 5 minutes!

## Installation

```bash
cd restaurant-pos
npm install
```

## Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000`

## Access the Applications

### 1. Digital Menu (Customer View)
```
http://localhost:3000/menu
```
- Responsive design works on any device
- View menu categories and items
- Click items for detailed information
- Cached for offline access

### 2. API Explorer
```
http://localhost:3000/
```
View all available API endpoints

### 3. Generate QR Code
```
http://localhost:3000/api/menu/qrcode
```
Get a QR code that customers can scan to access the menu

## Quick API Tests

### View Current Menu
```bash
curl http://localhost:3000/api/menu
```

### Check Inventory
```bash
curl http://localhost:3000/api/inventory
```

### Get Kitchen Display
```bash
curl http://localhost:3000/api/kitchen/display
```

### Daily Summary
```bash
curl http://localhost:3000/api/reports/daily-summary
```

## Create a Test Order

```bash
curl -X POST http://localhost:3000/api/kitchen/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "name": "Grilled Salmon",
        "quantity": 1,
        "price": 24.99
      }
    ],
    "orderType": "dine-in",
    "tableNumber": "5"
  }'
```

## Run Automated Tests

```bash
cd examples
node test-api.js
```

This will test all API endpoints and display results.

## Sample Data

The system comes pre-loaded with:
- **4 Categories**: Appetizers, Main Courses, Desserts, Beverages
- **9 Menu Items**: Various dishes with prices and descriptions
- **9 Inventory Items**: Ingredients with stock levels
- **Sample Sales Data**: 30 days of sales history
- **5 Employees**: For performance tracking

## Common Tasks

### Add a New Menu Item

```javascript
fetch('http://localhost:3000/api/menu/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "New Dish",
    description: "Delicious new dish",
    price: 15.99,
    category: "cat_id_here",
    preparationTime: 20
  })
})
```

### Update Inventory Stock

```javascript
fetch('http://localhost:3000/api/inventory/inv_id/add-stock', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    quantity: 50,
    notes: "Weekly restock"
  })
})
```

### Export Sales Report

```
http://localhost:3000/api/reports/export/csv?type=sales
```

Downloads a CSV file with sales data.

## Next Steps

1. **Customize the Menu**: Add your restaurant's categories and items
2. **Configure Inventory**: Set up your ingredients and stock levels
3. **Connect Hardware**: Register printers and cash drawers
4. **View Reports**: Check sales and inventory analytics
5. **Generate QR Codes**: Print QR codes for customers to scan

## Development Mode

For auto-reload during development:

```bash
npm run dev
```

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Run `npm install` to ensure dependencies are installed

### Menu not loading
- Verify the server is running
- Check browser console for errors
- Clear browser cache and localStorage

### API returns errors
- Check request format matches documentation
- Verify required fields are provided
- Check server console for error details

## Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Review [examples/test-api.js](examples/test-api.js) for code samples
- Inspect the browser's Network tab for API debugging

---

**Ready to customize? Start by exploring the API endpoints!**
