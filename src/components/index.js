// ========================================
// INDEX.JS - Exports centralisés des composants UI
// Chemin: src/components/index.js
//
// DESCRIPTION:
// Point d'entrée unique pour tous les composants UI
// Tous les composants sont maintenant 100% autonomes
//
// MODIFIÉ le 01/02/2025:
// - Suppression de l'export generateId
// - Tous les composants génèrent leur ID de manière autonome
// - Architecture 100% découplée
// - Ajout de l'export confirmerAction depuis modal.component.js
// ========================================

// ========================================
// COMPOSANTS UI RÉUTILISABLES
// ========================================

// Composants de base
export { AppHeader } from './ui/app-header/app-header.component.js';
export { SearchDropdown } from './ui/search-dropdown/search-dropdown.component.js';
export { Button } from './ui/button/button.component.js';
export { Badge } from './ui/badge/badge.component.js';

// Modal - Import spécial car confirmerAction est dans l'export par défaut
export { Modal, modalManager } from './ui/modal/modal.component.js';
import ModalDefaults from './ui/modal/modal.component.js';
export const confirmerAction = ModalDefaults.confirmerAction;

export { default as Dialog } from './ui/dialog/dialog.component.js';
export { default as notify } from './ui/notification/notification.component.js';
export { DropdownList } from './ui/dropdown-list/dropdown-list.component.js';
export { Timeline } from './ui/timeline/timeline.component.js';
export { Stepper } from './ui/stepper/stepper.component.js';
export { StatsCards } from './ui/stats-cards/stats-cards.component.js';
export { Numpad } from './ui/numpad/numpad.component.js';

// Composants DataTable
export { DataTable } from './ui/datatable/datatable.component.js';
export { DataTableFilters } from './ui/datatable-filters/datatable-filters.component.js';

// Loading
export { LoadingOverlay, loader } from './ui/loading-overlay/loading-overlay.component.js';

// DropZone
export { DropZone } from './ui/dropzone/dropzone.component.js';

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Formater une date
 * @param {Date|string} date - La date à formater
 * @param {string} format - Le format souhaité ('short', 'long', 'time')
 * @returns {string} La date formatée
 */
export function formatDate(date, format = 'short') {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    
    if (format === 'short') {
        return d.toLocaleDateString('fr-FR');
    } else if (format === 'long') {
        return d.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } else if (format === 'time') {
        return d.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (format === 'DD/MM/YYYY') {
        // Format spécifique pour DataTable
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } else if (format === 'YYYY-MM-DD') {
        // Format ISO pour les exports
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${year}-${month}-${day}`;
    }
    return d.toLocaleDateString('fr-FR');
}

/**
 * Débounce une fonction
 * @param {Function} func - La fonction à débouncer
 * @param {number} wait - Le délai en millisecondes
 * @returns {Function} La fonction débouncée
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Deep clone d'un objet
 * @param {Object} obj - L'objet à cloner
 * @returns {Object} Le clone de l'objet
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Formater un montant en euros
 * @param {number} amount - Le montant
 * @returns {string} Le montant formaté
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

/**
 * Capitaliser la première lettre
 * @param {string} str - La chaîne à capitaliser
 * @returns {string} La chaîne capitalisée
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Tronquer un texte
 * @param {string} text - Le texte à tronquer
 * @param {number} maxLength - La longueur maximale
 * @param {string} suffix - Le suffixe à ajouter
 * @returns {string} Le texte tronqué
 */
export function truncate(text, maxLength = 50, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + suffix;
}

/**
 * Générer un ID unique simple (pour compatibilité)
 * @param {string} prefix - Le préfixe de l'ID
 * @returns {string} L'ID généré
 */
export function simpleId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
}

// ========================================
// HELPERS POUR COMPOSANTS
// ========================================

/**
 * Créer un header d'application rapidement
 */
export function createAppHeader(config) {
    return new AppHeader(config);
}

/**
 * Créer une DataTable rapidement
 */
export function createDataTable(config) {
    return new DataTable(config);
}

/**
 * Afficher une notification rapidement
 */
export function showNotification(type, message, title = '') {
    return notify[type](message, title);
}

// ========================================
// EXPORT DE CONFIGURATION
// ========================================

export const componentDefaults = {
    theme: 'default',
    animationDuration: 300,
    debounceDelay: 300,
    locale: 'fr-FR'
};

// ========================================
// NOTE D'ARCHITECTURE
// ========================================
/*
 * Tous les composants sont maintenant 100% autonomes :
 * - Chaque composant génère son propre ID unique
 * - Aucune dépendance entre composants UI
 * - Communication uniquement par callbacks
 * - L'orchestrateur injecte les dépendances nécessaires
 * 
 * Exemple d'orchestration :
 * 
 * import { DataTable, DataTableFilters, DropdownList } from './components/index.js';
 * 
 * const filters = new DataTableFilters({
 *     DropdownClass: DropdownList,  // Injection de dépendance
 *     onFilter: (values) => table.refresh(values)
 * });
 * 
 * const table = new DataTable({
 *     data: myData
 * });
 */