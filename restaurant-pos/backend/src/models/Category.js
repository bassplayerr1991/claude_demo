/**
 * Category Model
 * Represents a menu category
 */
class Category {
  constructor(data) {
    this.id = data.id || this.generateId();
    this.name = data.name;
    this.description = data.description || '';
    this.displayOrder = data.displayOrder || 0;
    this.icon = data.icon || '';
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.createdAt || new Date();
  }

  generateId() {
    return 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      displayOrder: this.displayOrder,
      icon: this.icon,
      active: this.active,
      createdAt: this.createdAt
    };
  }
}

module.exports = Category;
