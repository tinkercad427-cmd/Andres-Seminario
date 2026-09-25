"use strict";

/*
 * Catálogo inicial de productos.
 *
 * Las imágenes se generan como SVG embebidos para que el proyecto
 * funcione sin dependencias ni imágenes externas.
 */

const INITIAL_PRODUCTS = [
    {
        id: 1,
        name: "Espresso",
        category: "Café",
        price: 1800,
        stock: 15,
        color: "#6f422b",
        emoji: "☕"
    },
    {
        id: 2,
        name: "Cappuccino",
        category: "Café",
        price: 2800,
        stock: 12,
        color: "#a96538",
        emoji: "☕"
    },
    {
        id: 3,
        name: "Latte Vainilla",
        category: "Café",
        price: 3200,
        stock: 8,
        color: "#c78b55",
        emoji: "☕"
    },
    {
        id: 4,
        name: "Mocha",
        category: "Café",
        price: 3400,
        stock: 7,
        color: "#7b4229",
        emoji: "☕"
    },
    {
        id: 5,
        name: "Té Chai",
        category: "Té",
        price: 2500,
        stock: 10,
        color: "#a56b43",
        emoji: "🍵"
    },
    {
        id: 6,
        name: "Té Verde",
        category: "Té",
        price: 2200,
        stock: 6,
        color: "#728b4a",
        emoji: "🍵"
    },
    {
        id: 7,
        name: "Medialuna",
        category: "Pastelería",
        price: 1500,
        stock: 20,
        color: "#d59a45",
        emoji: "🥐"
    },
    {
        id: 8,
        name: "Muffin de Chocolate",
        category: "Pastelería",
        price: 2400,
        stock: 10,
        color: "#70402c",
        emoji: "🧁"
    },
    {
        id: 9,
        name: "Cheesecake",
        category: "Pastelería",
        price: 3900,
        stock: 5,
        color: "#d4a66a",
        emoji: "🍰"
    },
    {
        id: 10,
        name: "Tostado Completo",
        category: "Salado",
        price: 4500,
        stock: 8,
        color: "#c68c4b",
        emoji: "🥪"
    },
    {
        id: 11,
        name: "Avocado Toast",
        category: "Salado",
        price: 5200,
        stock: 4,
        color: "#69834a",
        emoji: "🥑"
    },
    {
        id: 12,
        name: "Cookie de Chocolate",
        category: "Pastelería",
        price: 1900,
        stock: 0,
        color: "#8b542e",
        emoji: "🍪"
    }
];

function createProductImage(product) {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
            <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="${product.color}"/>
                    <stop offset="100%" stop-color="#2b211d"/>
                </linearGradient>
            </defs>

            <rect width="600" height="420" fill="url(#bg)"/>

            <circle cx="510" cy="75" r="100"
                    fill="#ffffff" opacity=".08"/>
            <circle cx="80" cy="350" r="130"
                    fill="#ffffff" opacity=".05"/>

            <text x="300" y="245"
                  text-anchor="middle"
                  font-size="125"
                  font-family="Arial, sans-serif">
                ${product.emoji}
            </text>

            <text x="300" y="345"
                  text-anchor="middle"
                  fill="#ffffff"
                  font-size="28"
                  font-family="Arial, sans-serif"
                  font-weight="bold">
                AROMA CAFÉ
            </text>
        </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function initializeProducts() {
    const savedProducts = CafeUtils.getStorage(
        CafeUtils.STORAGE_KEYS.products,
        null
    );

    if (!Array.isArray(savedProducts) || savedProducts.length === 0) {
        const products = INITIAL_PRODUCTS.map(product => ({
            ...product,
            image: createProductImage(product)
        }));

        CafeUtils.setStorage(
            CafeUtils.STORAGE_KEYS.products,
            products
        );

        return products;
    }

    return savedProducts;
}

function getProducts() {
    return CafeUtils.getStorage(
        CafeUtils.STORAGE_KEYS.products,
        []
    );
}

function saveProducts(products) {
    CafeUtils.setStorage(
        CafeUtils.STORAGE_KEYS.products,
        products
    );
}

function getProductById(id) {
    const products = getProducts();

    return products.find(product => Number(product.id) === Number(id)) || null;
}

function getCategories() {
    return [...new Set(getProducts().map(product => product.category))];
}

function renderCategories() {
    const select = document.getElementById("category-filter");

    if (!select) {
        return;
    }

    getCategories().forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
}

function renderProducts() {
    const grid = document.getElementById("products-grid");
    const emptyResults = document.getElementById("empty-results");
    const searchInput = document.getElementById("search-input");
    const categoryFilter = document.getElementById("category-filter");
    const summary = document.getElementById("products-summary");

    if (!grid) {
        return;
    }

    const search = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const category = categoryFilter
        ? categoryFilter.value
        : "todos";

    const products = getProducts();

    const filteredProducts = products.filter(product => {
        const matchesName = product.name
            .toLowerCase()
            .includes(search);

        const matchesCategory =
            category === "todos" ||
            product.category === category;

        return matchesName && matchesCategory;
    });

    grid.innerHTML = "";

    if (summary) {
        summary.textContent =
            `${filteredProducts.length} producto${filteredProducts.length === 1 ? "" : "s"}`;
    }

    if (filteredProducts.length === 0) {
        emptyResults?.classList.remove("hidden");
        return;
    }

    emptyResults?.classList.add("hidden");

    filteredProducts.forEach(product => {
        const card = document.createElement("article");
        card.className = "product-card";

        const isOutOfStock = product.stock <= 0;
        const stockClass =
            product.stock <= 3 && product.stock > 0
                ? "low-stock"
                : "";

        card.innerHTML = `
            <div class="product-image-wrapper">
                <img
                    class="product-image"
                    src="${product.image}"
                    alt="${CafeUtils.escapeHTML(product.name)}"
                >

                <span class="category-badge">
                    ${CafeUtils.escapeHTML(product.category)}
                </span>
            </div>

            <div class="product-info">
                <div class="product-title-row">
                    <h3>${CafeUtils.escapeHTML(product.name)}</h3>
                    <span class="product-price">
                        ${CafeUtils.formatPrice(product.price)}
                    </span>
                </div>

                <div class="stock-row ${stockClass}">
                    <span class="stock-dot"></span>
                    ${
                        isOutOfStock
                            ? "Sin stock"
                            : `Stock disponible: <strong>${product.stock}</strong>`
                    }
                </div>

                <button
                    type="button"
                    class="btn btn-primary btn-full add-to-cart-btn"
                    data-product-id="${product.id}"
                    ${isOutOfStock ? "disabled" : ""}
                >
                    ${isOutOfStock ? "Sin stock" : "Agregar al carrito"}
                </button>
            </div>
        `;

        grid.appendChild(card);
    });

    grid.querySelectorAll(".add-to-cart-btn").forEach(button => {
        button.addEventListener("click", () => {
            const productId = Number(button.dataset.productId);

            if (typeof addToCart === "function") {
                addToCart(productId);
            }
        });
    });
}

function initCatalog() {
    initializeProducts();

    renderCategories();
    renderProducts();

    const searchInput = document.getElementById("search-input");
    const categoryFilter = document.getElementById("category-filter");

    searchInput?.addEventListener("input", renderProducts);
    categoryFilter?.addEventListener("change", renderProducts);
}

document.addEventListener("DOMContentLoaded", initCatalog);