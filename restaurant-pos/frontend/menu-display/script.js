/**
 * Digital Menu Display - Client-side JavaScript
 * Handles menu loading, caching, and display
 */

const API_BASE_URL = window.location.origin + '/api';
const CACHE_KEY = 'menuData';
const CACHE_EXPIRY_KEY = 'menuDataExpiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let menuData = [];
let selectedCategory = 'all';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    setupModal();
});

// Load menu data
async function loadMenu() {
    try {
        // Try to fetch from server
        const response = await fetch(`${API_BASE_URL}/menu`);

        if (response.ok) {
            const result = await response.json();
            menuData = result.data;

            // Cache the data
            cacheMenuData(menuData);

            // Hide offline notice
            document.getElementById('offlineNotice').style.display = 'none';
        } else {
            throw new Error('Failed to fetch menu');
        }
    } catch (error) {
        console.error('Error loading menu:', error);

        // Try to load from cache
        const cachedData = getCachedMenuData();
        if (cachedData) {
            menuData = cachedData;
            document.getElementById('offlineNotice').style.display = 'block';
        } else {
            showError('Unable to load menu. Please check your connection.');
        }
    }

    renderMenu();
}

// Cache menu data in localStorage
function cacheMenuData(data) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_EXPIRY_KEY, Date.now() + CACHE_DURATION);
    } catch (error) {
        console.error('Failed to cache menu data:', error);
    }
}

// Get cached menu data
function getCachedMenuData() {
    try {
        const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
        if (expiry && Date.now() < parseInt(expiry)) {
            const data = localStorage.getItem(CACHE_KEY);
            return data ? JSON.parse(data) : null;
        }
    } catch (error) {
        console.error('Failed to load cached data:', error);
    }
    return null;
}

// Render menu
function renderMenu() {
    document.getElementById('loading').style.display = 'none';

    // Render categories
    renderCategories();

    // Render menu items
    renderMenuItems();
}

// Render category navigation
function renderCategories() {
    const categoryNav = document.getElementById('categoryNav');
    categoryNav.innerHTML = '';

    // Add "All" button
    const allBtn = createCategoryButton({
        id: 'all',
        name: 'All',
        icon: '🍽️'
    }, true);
    categoryNav.appendChild(allBtn);

    // Add category buttons
    menuData.forEach(category => {
        const btn = createCategoryButton(category, false);
        categoryNav.appendChild(btn);
    });
}

// Create category button
function createCategoryButton(category, isActive) {
    const btn = document.createElement('button');
    btn.className = 'category-btn' + (isActive ? ' active' : '');
    btn.innerHTML = `${category.icon} ${category.name}`;
    btn.onclick = () => selectCategory(category.id);
    return btn;
}

// Select category
function selectCategory(categoryId) {
    selectedCategory = categoryId;

    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Render filtered items
    renderMenuItems();
}

// Render menu items
function renderMenuItems() {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';

    let items = [];

    if (selectedCategory === 'all') {
        menuData.forEach(category => {
            items = items.concat(category.items || []);
        });
    } else {
        const category = menuData.find(cat => cat.id === selectedCategory);
        items = category ? category.items : [];
    }

    if (items.length === 0) {
        menuGrid.innerHTML = '<p style="text-align: center; color: #718096; padding: 40px;">No items available</p>';
        return;
    }

    items.forEach(item => {
        const itemCard = createMenuItem(item);
        menuGrid.appendChild(itemCard);
    });
}

// Create menu item card
function createMenuItem(item) {
    const card = document.createElement('div');
    card.className = 'menu-item';
    card.onclick = () => showItemDetail(item);

    const imageEmoji = getItemEmoji(item.name);

    card.innerHTML = `
        <div class="item-image">
            ${item.image ? `<img src="${item.image}" alt="${item.name}">` : imageEmoji}
        </div>
        <div class="item-content">
            <h3 class="item-name">${item.name}</h3>
            <p class="item-description">${item.description}</p>
            <div class="item-footer">
                <span class="item-price">$${item.price.toFixed(2)}</span>
                <span class="prep-time">⏱️ ${item.preparationTime} min</span>
            </div>
            ${item.allergens && item.allergens.length > 0 ?
                `<div class="allergen-tag">Contains: ${item.allergens.join(', ')}</div>` : ''}
        </div>
    `;

    return card;
}

// Get emoji for item
function getItemEmoji(itemName) {
    const name = itemName.toLowerCase();
    if (name.includes('salad')) return '🥗';
    if (name.includes('steak') || name.includes('beef')) return '🥩';
    if (name.includes('salmon') || name.includes('fish')) return '🐟';
    if (name.includes('pasta')) return '🍝';
    if (name.includes('cake') || name.includes('dessert')) return '🍰';
    if (name.includes('coffee') || name.includes('espresso')) return '☕';
    if (name.includes('lemonade') || name.includes('drink')) return '🥤';
    if (name.includes('pizza')) return '🍕';
    if (name.includes('burger')) return '🍔';
    if (name.includes('soup')) return '🍲';
    return '🍽️';
}

// Show item detail modal
function showItemDetail(item) {
    const modal = document.getElementById('itemModal');
    const itemDetail = document.getElementById('itemDetail');

    const imageEmoji = getItemEmoji(item.name);

    itemDetail.innerHTML = `
        <div class="item-detail-image">
            ${item.image ? `<img src="${item.image}" alt="${item.name}">` : imageEmoji}
        </div>
        <div class="item-detail-content">
            <h2 class="item-detail-name">${item.name}</h2>
            <p class="item-detail-description">${item.description}</p>
            <div class="item-detail-price">$${item.price.toFixed(2)}</div>

            <div class="item-details-section">
                <h3>⏱️ Preparation Time</h3>
                <p>${item.preparationTime} minutes</p>
            </div>

            ${item.ingredients && item.ingredients.length > 0 ? `
                <div class="item-details-section">
                    <h3>🥘 Ingredients</h3>
                    <ul>
                        ${item.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            ${item.allergens && item.allergens.length > 0 ? `
                <div class="item-details-section">
                    <h3>⚠️ Allergen Information</h3>
                    <ul>
                        ${item.allergens.map(allergen => `<li>${allergen}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;

    modal.style.display = 'block';
}

// Setup modal
function setupModal() {
    const modal = document.getElementById('itemModal');
    const closeBtn = document.querySelector('.close');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Show error message
function showError(message) {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e53e3e;">
            <h3>⚠️ Error</h3>
            <p>${message}</p>
        </div>
    `;
    document.getElementById('loading').style.display = 'none';
}

// Service Worker for offline support (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
        console.log('Service Worker registration failed');
    });
}
