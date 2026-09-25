"use strict";

/*
 * Utilidades generales del proyecto.
 * Toda la información persistente se almacena en localStorage.
 */

const CafeUtils = (() => {
    const STORAGE_KEYS = {
        products: "aromaCafe_products",
        cart: "aromaCafe_cart",
        order: "aromaCafe_lastOrder",
        coupon: "aromaCafe_coupon"
    };

    function getStorage(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);

            if (value === null) {
                return defaultValue;
            }

            return JSON.parse(value);
        } catch (error) {
            console.error(`Error leyendo localStorage (${key}):`, error);
            return defaultValue;
        }
    }

    function setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error guardando localStorage (${key}):`, error);
            return false;
        }
    }

    function removeStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Error eliminando localStorage (${key}):`, error);
        }
    }

    function formatPrice(value) {
        return new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            minimumFractionDigits: 2
        }).format(Number(value) || 0);
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function showToast(message, type = "success") {
        const container = document.getElementById("toast-container");

        if (!container) {
            return;
        }

        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;

        const icon = type === "success" ? "✓" : "!";
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span>${escapeHTML(message)}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("toast-hide");

            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2800);
    }

    function generateOrderNumber() {
        const date = new Date();

        const datePart = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("");

        const timePart = [
            String(date.getHours()).padStart(2, "0"),
            String(date.getMinutes()).padStart(2, "0"),
            String(date.getSeconds()).padStart(2, "0")
        ].join("");

        const randomPart = Math.floor(100 + Math.random() * 900);

        return `AC-${datePart}-${timePart}-${randomPart}`;
    }

    function getTodayISO() {
        return new Date().toISOString().split("T")[0];
    }

    return {
        STORAGE_KEYS,
        getStorage,
        setStorage,
        removeStorage,
        formatPrice,
        escapeHTML,
        showToast,
        generateOrderNumber,
        getTodayISO
    };
})();