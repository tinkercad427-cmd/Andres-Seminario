"use strict";

/*
 * Gestión del carrito, cupones, checkout y confirmación.
 */

const COUPONS = [
    {
        code: "CAFE10",
        discount: 10,
        minAmount: 10000,
        expires: "2027-12-31"
    },
    {
        code: "AROMA15",
        discount: 15,
        minAmount: 18000,
        expires: "2027-06-30"
    },
    {
        code: "BIENVENIDO",
        discount: 20,
        minAmount: 25000,
        expires: "2026-12-31"
    }
];

function getCart() {
    return CafeUtils.getStorage(
        CafeUtils.STORAGE_KEYS.cart,
        []
    );
}

function saveCart(cart) {
    CafeUtils.setStorage(
        CafeUtils.STORAGE_KEYS.cart,
        cart
    );
}

function getCartCount() {
    return getCart().reduce(
        (total, item) => total + Number(item.quantity),
        0
    );
}

function updateCartBadge() {
    const badge = document.getElementById("cart-count");

    if (!badge) {
        return;
    }

    badge.textContent = getCartCount();
}

function addToCart(productId) {
    const product = getProductById(productId);

    if (!product) {
        CafeUtils.showToast("El producto no existe.", "error");
        return;
    }

    if (product.stock <= 0) {
        CafeUtils.showToast("Este producto no tiene stock.", "error");
        return;
    }

    const cart = getCart();
    const existingItem = cart.find(
        item => Number(item.productId) === Number(productId)
    );

    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            CafeUtils.showToast(
                `No podés agregar más de ${product.stock} unidades.`,
                "error"
            );
            return;
        }

        existingItem.quantity += 1;
    } else {
        cart.push({
            productId: product.id,
            quantity: 1
        });
    }

    saveCart(cart);
    updateCartBadge();

    if (typeof renderCart === "function") {
        renderCart();
    }

    CafeUtils.showToast(`${product.name} agregado al carrito.`);
}

function removeFromCart(productId) {
    const cart = getCart().filter(
        item => Number(item.productId) !== Number(productId)
    );

    saveCart(cart);
    updateCartBadge();

    if (typeof renderCart === "function") {
        renderCart();
    }
}

function changeCartQuantity(productId, change) {
    const cart = getCart();
    const item = cart.find(
        cartItem => Number(cartItem.productId) === Number(productId)
    );

    if (!item) {
        return;
    }

    const product = getProductById(productId);

    if (!product) {
        removeFromCart(productId);
        return;
    }

    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > product.stock) {
        CafeUtils.showToast(
            `Solo quedan ${product.stock} unidades disponibles.`,
            "error"
        );
        return;
    }

    item.quantity = newQuantity;

    saveCart(cart);
    updateCartBadge();

    if (typeof renderCart === "function") {
        renderCart();
    }
}

function getCartDetailedItems() {
    const cart = getCart();

    return cart
        .map(item => {
            const product = getProductById(item.productId);

            if (!product) {
                return null;
            }

            return {
                ...product,
                quantity: Number(item.quantity),
                subtotal: Number(item.quantity) * Number(product.price)
            };
        })
        .filter(Boolean);
}

function calculateSubtotal(items = getCartDetailedItems()) {
    return items.reduce(
        (total, item) => total + item.subtotal,
        0
    );
}

function getCouponFromStorage() {
    return CafeUtils.getStorage(
        CafeUtils.STORAGE_KEYS.coupon,
        null
    );
}

function saveCoupon(coupon) {
    CafeUtils.setStorage(
        CafeUtils.STORAGE_KEYS.coupon,
        coupon
    );
}

function clearCoupon() {
    CafeUtils.removeStorage(
        CafeUtils.STORAGE_KEYS.coupon
    );
}

function findCoupon(code) {
    return COUPONS.find(
        coupon => coupon.code === code.toUpperCase()
    );
}

function validateCoupon(code, subtotal) {
    const normalizedCode = code.trim().toUpperCase();

    if (!normalizedCode) {
        return {
            valid: false,
            message: "Ingresá un código de cupón."
        };
    }

    const coupon = findCoupon(normalizedCode);

    if (!coupon) {
        return {
            valid: false,
            message: "El cupón ingresado no existe."
        };
    }

    if (CafeUtils.getTodayISO() > coupon.expires) {
        return {
            valid: false,
            message: "El cupón está vencido."
        };
    }

    if (subtotal < coupon.minAmount) {
        return {
            valid: false,
            message:
                `El cupón requiere una compra mínima de ${CafeUtils.formatPrice(coupon.minAmount)}.`
        };
    }

    const discountAmount =
        Math.round(subtotal * coupon.discount) / 100;

    return {
        valid: true,
        coupon,
        discountAmount,
        finalTotal: subtotal - discountAmount,
        message:
            `Cupón aplicado: ${coupon.discount}% de descuento.`
    };
}

function getCurrentTotals() {
    const items = getCartDetailedItems();
    const subtotal = calculateSubtotal(items);
    const storedCoupon = getCouponFromStorage();

    let discount = 0;
    let coupon = null;

    if (storedCoupon) {
        const validation = validateCoupon(
            storedCoupon.code,
            subtotal
        );

        if (validation.valid) {
            discount = validation.discountAmount;
            coupon = validation.coupon;
        } else {
            clearCoupon();
        }
    }

    return {
        items,
        subtotal,
        discount,
        total: subtotal - discount,
        coupon
    };
}

function renderCart() {
    const cartContent = document.getElementById("cart-content");
    const cartEmpty = document.getElementById("cart-empty");
    const cartItems = document.getElementById("cart-items");

    if (!cartContent || !cartEmpty || !cartItems) {
        return;
    }

    const totals = getCurrentTotals();

    updateCartBadge();

    if (totals.items.length === 0) {
        cartContent.classList.add("hidden");
        cartEmpty.classList.remove("hidden");
        return;
    }

    cartContent.classList.remove("hidden");
    cartEmpty.classList.add("hidden");

    cartItems.innerHTML = totals.items
        .map(item => `
            <article class="cart-item">
                <div class="cart-product-image">
                    <img
                        src="${item.image}"
                        alt="${CafeUtils.escapeHTML(item.name)}"
                    >
                </div>

                <div class="cart-item-main">
                    <span class="cart-item-category">
                        ${CafeUtils.escapeHTML(item.category)}
                    </span>

                    <h3>${CafeUtils.escapeHTML(item.name)}</h3>

                    <span class="unit-price">
                        ${CafeUtils.formatPrice(item.price)} c/u
                    </span>

                    <div class="quantity-controls">
                        <button
                            type="button"
                            class="quantity-btn"
                            data-action="decrease"
                            data-id="${item.id}"
                            aria-label="Disminuir cantidad"
                        >−</button>

                        <span>${item.quantity}</span>

                        <button
                            type="button"
                            class="quantity-btn"
                            data-action="increase"
                            data-id="${item.id}"
                            aria-label="Aumentar cantidad"
                            ${item.quantity >= item.stock ? "disabled" : ""}
                        >+</button>
                    </div>
                </div>

                <div class="cart-item-end">
                    <strong>${CafeUtils.formatPrice(item.subtotal)}</strong>

                    <button
                        type="button"
                        class="remove-btn"
                        data-action="remove"
                        data-id="${item.id}"
                    >
                        Eliminar
                    </button>
                </div>
            </article>
        `)
        .join("");

    cartItems.querySelectorAll("[data-action]").forEach(button => {
        button.addEventListener("click", () => {
            const id = Number(button.dataset.id);
            const action = button.dataset.action;

            if (action === "increase") {
                changeCartQuantity(id, 1);
            }

            if (action === "decrease") {
                changeCartQuantity(id, -1);
            }

            if (action === "remove") {
                removeFromCart(id);
            }
        });
    });

    renderTotals(totals);
}

function renderTotals(totals = getCurrentTotals()) {
    const subtotalElement = document.getElementById("summary-subtotal");
    const discountElement = document.getElementById("summary-discount");
    const discountRow = document.getElementById("discount-row");
    const totalElement = document.getElementById("summary-total");

    if (subtotalElement) {
        subtotalElement.textContent =
            CafeUtils.formatPrice(totals.subtotal);
    }

    if (discountElement) {
        discountElement.textContent =
            `-${CafeUtils.formatPrice(totals.discount)}`;
    }

    if (discountRow) {
        discountRow.classList.toggle(
            "hidden",
            totals.discount <= 0
        );
    }

    if (totalElement) {
        totalElement.textContent =
            CafeUtils.formatPrice(totals.total);
    }

    const storedCoupon = getCouponFromStorage();
    const couponMessage = document.getElementById("coupon-message");
    const couponInput = document.getElementById("coupon-input");

    if (storedCoupon && totals.coupon) {
        if (couponInput) {
            couponInput.value = storedCoupon.code;
        }

        if (couponMessage) {
            couponMessage.textContent =
                `✓ ${totals.coupon.discount}% de descuento aplicado.`;
            couponMessage.className =
                "coupon-message coupon-success";
        }
    }
}

function handleCoupon() {
    const input = document.getElementById("coupon-input");
    const message = document.getElementById("coupon-message");

    if (!input || !message) {
        return;
    }

    const code = input.value.trim();
    const subtotal = calculateSubtotal();

    if (subtotal <= 0) {
        message.textContent =
            "Agregá productos antes de aplicar un cupón.";
        message.className =
            "coupon-message coupon-error";
        return;
    }

    const validation = validateCoupon(code, subtotal);

    if (!validation.valid) {
        clearCoupon();
        message.textContent = validation.message;
        message.className =
            "coupon-message coupon-error";

        renderTotals();

        return;
    }

    saveCoupon({
        code: validation.coupon.code
    });

    message.textContent = `✓ ${validation.message}`;
    message.className =
        "coupon-message coupon-success";

    renderTotals();
}

function setupDeliveryForm() {
    const deliveryInputs =
        document.querySelectorAll('input[name="delivery"]');

    const addressGroup =
        document.getElementById("address-group");

    const addressInput =
        document.getElementById("customer-address");

    if (!deliveryInputs.length || !addressGroup) {
        return;
    }

    deliveryInputs.forEach(input => {
        input.addEventListener("change", () => {
            const isDelivery =
                input.value === "Delivery" && input.checked;

            addressGroup.classList.toggle(
                "hidden",
                !isDelivery
            );

            if (!isDelivery && addressInput) {
                addressInput.value = "";
                clearFieldError(addressInput);
            }
        });
    });
}

function setFieldError(input, errorElement, message) {
    input.classList.add("input-error");

    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearFieldError(input) {
    if (!input) {
        return;
    }

    input.classList.remove("input-error");

    const errorId = `${input.id}-error`;
    const errorElement = document.getElementById(errorId);

    if (errorElement) {
        errorElement.textContent = "";
    }
}

function validateCheckoutForm() {
    const nameInput =
        document.getElementById("customer-name");

    const phoneInput =
        document.getElementById("customer-phone");

    const addressInput =
        document.getElementById("customer-address");

    const nameError =
        document.getElementById("name-error");

    const phoneError =
        document.getElementById("phone-error");

    const addressError =
        document.getElementById("address-error");

    const selectedDelivery =
        document.querySelector('input[name="delivery"]:checked');

    let valid = true;

    clearFieldError(nameInput);
    clearFieldError(phoneInput);
    clearFieldError(addressInput);

    if (!nameInput.value.trim()) {
        setFieldError(
            nameInput,
            nameError,
            "El nombre es obligatorio."
        );
        valid = false;
    } else if (nameInput.value.trim().length < 3) {
        setFieldError(
            nameInput,
            nameError,
            "Ingresá un nombre válido."
        );
        valid = false;
    }

    const phone = phoneInput.value.trim();
    const phoneRegex = /^[0-9+()\s-]{8,20}$/;

    if (!phone) {
        setFieldError(
            phoneInput,
            phoneError,
            "El teléfono es obligatorio."
        );
        valid = false;
    } else if (!phoneRegex.test(phone)) {
        setFieldError(
            phoneInput,
            phoneError,
            "Ingresá un teléfono válido."
        );
        valid = false;
    }

    const isDelivery =
        selectedDelivery &&
        selectedDelivery.value === "Delivery";

    if (isDelivery && !addressInput.value.trim()) {
        setFieldError(
            addressInput,
            addressError,
            "La dirección es obligatoria para Delivery."
        );
        valid = false;
    }

    return {
        valid,
        data: {
            name: nameInput.value.trim(),
            phone,
            delivery: selectedDelivery
                ? selectedDelivery.value
                : "Retiro en local",
            address: isDelivery
                ? addressInput.value.trim()
                : ""
        }
    };
}

function confirmOrder(event) {
    event.preventDefault();

    const cartItems = getCartDetailedItems();

    if (cartItems.length === 0) {
        CafeUtils.showToast(
            "No hay productos en el carrito.",
            "error"
        );
        return;
    }

    /*
     * Se vuelve a comprobar el stock justo antes de confirmar.
     * Esto evita confirmar cantidades que ya no estén disponibles.
     */
    for (const item of cartItems) {
        const currentProduct = getProductById(item.id);

        if (!currentProduct || item.quantity > currentProduct.stock) {
            CafeUtils.showToast(
                `El stock de "${item.name}" cambió. Revisá tu carrito.`,
                "error"
            );

            renderCart();
            return;
        }
    }

    const checkout = validateCheckoutForm();

    if (!checkout.valid) {
        CafeUtils.showToast(
            "Completá correctamente los campos requeridos.",
            "error"
        );
        return;
    }

    const totals = getCurrentTotals();

    const orderNumber = CafeUtils.generateOrderNumber();

    /*
     * Descontar stock.
     */
    const products = getProducts();

    cartItems.forEach(item => {
        const product = products.find(
            productItem => Number(productItem.id) === Number(item.id)
        );

        if (product) {
            product.stock -= item.quantity;
        }
    });

    saveProducts(products);

    /*
     * Guardar el pedido completo.
     */
    const order = {
        orderNumber,
        createdAt: new Date().toISOString(),

        customer: {
            name: checkout.data.name,
            phone: checkout.data.phone,
            delivery: checkout.data.delivery,
            address: checkout.data.address
        },

        items: cartItems.map(item => ({
            productId: item.id,
            name: item.name,
            category: item.category,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            image: item.image
        })),

        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,

        coupon: totals.coupon
            ? {
                code: totals.coupon.code,
                discount: totals.coupon.discount
            }
            : null
    };

    CafeUtils.setStorage(
        CafeUtils.STORAGE_KEYS.order,
        order
    );

    /*
     * Vaciar carrito y cupón.
     */
    saveCart([]);
    clearCoupon();

    /*
     * Redirigir a confirmación.
     */
    window.location.href = "confirmacion.html";
}

function initCartPage() {
    const cartItems = document.getElementById("cart-items");

    if (!cartItems) {
        return;
    }

    updateCartBadge();
    renderCart();
    setupDeliveryForm();

    const couponButton =
        document.getElementById("coupon-btn");

    const couponInput =
        document.getElementById("coupon-input");

    couponButton?.addEventListener(
        "click",
        handleCoupon
    );

    couponInput?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleCoupon();
        }
    });

    const checkoutForm =
        document.getElementById("checkout-form");

    checkoutForm?.addEventListener(
        "submit",
        confirmOrder
    );
}

function renderConfirmation() {
    const order = CafeUtils.getStorage(
        CafeUtils.STORAGE_KEYS.order,
        null
    );

    /*
     * No existe pedido confirmado:
     * acceso directo no permitido.
     */
    if (!order || !order.orderNumber || !Array.isArray(order.items)) {
        window.location.replace("catalogo.html");
        return;
    }

    const orderNumber =
        document.getElementById("order-number");

    const confirmationItems =
        document.getElementById("confirmation-items");

    const customerName =
        document.getElementById("customer-name-confirmation");

    const customerPhone =
        document.getElementById("customer-phone-confirmation");

    const delivery =
        document.getElementById("delivery-confirmation");

    const addressRow =
        document.getElementById("address-confirmation-row");

    const address =
        document.getElementById("address-confirmation");

    const subtotal =
        document.getElementById("confirmation-subtotal");

    const discount =
        document.getElementById("confirmation-discount");

    const discountRow =
        document.getElementById("confirmation-discount-row");

    const total =
        document.getElementById("confirmation-total");

    if (orderNumber) {
        orderNumber.textContent = order.orderNumber;
    }

    if (confirmationItems) {
        confirmationItems.innerHTML = order.items
            .map(item => `
                <div class="confirmed-item">
                    <div class="confirmed-item-image">
                        <img
                            src="${item.image}"
                            alt="${CafeUtils.escapeHTML(item.name)}"
                        >
                    </div>

                    <div class="confirmed-item-info">
                        <strong>${CafeUtils.escapeHTML(item.name)}</strong>
                        <span>
                            ${item.quantity} × ${CafeUtils.formatPrice(item.price)}
                        </span>
                    </div>

                    <strong class="confirmed-item-subtotal">
                        ${CafeUtils.formatPrice(item.subtotal)}
                    </strong>
                </div>
            `)
            .join("");
    }

    if (customerName) {
        customerName.textContent = order.customer.name;
    }

    if (customerPhone) {
        customerPhone.textContent = order.customer.phone;
    }

    if (delivery) {
        delivery.textContent = order.customer.delivery;
    }

    if (order.customer.delivery === "Delivery") {
        if (addressRow) {
            addressRow.classList.remove("hidden");
        }

        if (address) {
            address.textContent = order.customer.address;
        }
    } else if (addressRow) {
        addressRow.classList.add("hidden");
    }

    if (subtotal) {
        subtotal.textContent =
            CafeUtils.formatPrice(order.subtotal);
    }

    if (order.discount > 0) {
        discountRow?.classList.remove("hidden");

        if (discount) {
            discount.textContent =
                `-${CafeUtils.formatPrice(order.discount)}`;
        }
    } else {
        discountRow?.classList.add("hidden");
    }

    if (total) {
        total.textContent =
            CafeUtils.formatPrice(order.total);
    }

    updateCartBadge();
}

document.addEventListener("DOMContentLoaded", () => {
    initCartPage();

    if (document.getElementById("order-number")) {
        renderConfirmation();
    }
});