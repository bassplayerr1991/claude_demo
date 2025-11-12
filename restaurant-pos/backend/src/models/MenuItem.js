/**
 * MenuItem Model
 * Represents a menu item with all its properties
 */
class MenuItem {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.description = data.description || '';
    this.price = parseFloat(data.price);
    this.category = data.category;
    this.image = data.image || '';
    this.available = data.available !== undefined ? data.available : true;
    this.allergens = data.allergens || [];
    this.preparationTime = data.preparationTime || 15; // minutes
    this.ingredients = data.ingredients || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  generateId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  update(data) {
    Object.keys(data).forEach(key => {
      if (key !== 'id' && this.hasOwnProperty(key)) {
        this[key] = data[key];
      }
    });
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      category: this.category,
      image: this.image,
      available: this.available,
      allergens: this.allergens,
      preparationTime: this.preparationTime,
      ingredients: this.ingredients,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = MenuItem;
