// ========================================
// INDEX.JS - Point d'entrée centralisé pour les composants
// ========================================
// Chemin: src/components/index.js
//
// MODIFICATIONS:
// [01/02/2025] - Correction de tous les chemins d'import
// ========================================

// ========================================
// COMPOSANTS UI
// ========================================

// 🆕 Header d'application réutilisable
import { AppHeader } from './ui/app-header/app-header.component.js';
export { AppHeader };

// Dialog (remplace alert, confirm, prompt)
import DialogComponent from './ui/dialog/dialog.component.js';
export const Dialog = DialogComponent;

// Notifications toast
import { notify } from './ui/notification/notification.component.js';
export { notify };

// Table
import { DataTable } from './ui/datatable/datatable.component.js';
export { DataTable };

// Filtres pour DataTable
import { DataTableFilters } from './ui/datatable-filters/datatable-filters.component.js';
export { DataTableFilters };

// Cartes de statistiques
import { StatsCards } from './ui/stats-cards/stats-cards.component.js';
export { StatsCards };

// Modal
import { 
    Modal, 
    ModalManager, 
    modalManager, 
    confirmerAction 
} from './ui/modal/modal.component.js';

export { 
    Modal, 
    ModalManager, 
    modalManager, 
    confirmerAction 
};

// Timeline
import Timeline, { createTimeline, createOrderTimeline } from './ui/timeline/timeline.component.js';
export { Timeline, createTimeline, createOrderTimeline };

// Search Dropdown
import SearchDropdown from './ui/search-dropdown/search-dropdown.component.js';
export { SearchDropdown };

// Dropdown list
import DropdownList from './ui/dropdown-list/dropdown-list.component.js';
export { DropdownList };

// 🆕 Stepper
import { Stepper } from './ui/stepper/stepper.component.js';
export { Stepper };

// 🆕 Numpad
import { NumpadComponent } from './ui/numpad/numpad.component.js';
export { NumpadComponent };

// ========================================
// UTILITAIRES
// ========================================

// Formatage des dates
export const formatDate = (date, format = 'DD/MM/YYYY') => {
    if (!date) return '-';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '-';
    
    const pad = (n) => String(n).padStart(2, '0');
    
    const formats = {
        'DD/MM/YYYY': `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
        'YYYY-MM-DD': `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        'DD/MM/YYYY HH:mm': `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
        'HH:mm': `${pad(d.getHours())}:${pad(d.getMinutes())}`
    };
    
    return formats[format] || formats['DD/MM/YYYY'];
};

// Formatage monétaire
export const formatMoney = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
    }).format(amount || 0);
};

// Validation email
export const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// Validation téléphone
export const isValidPhone = (phone) => {
    const cleaned = phone.replace(/\s/g, '');
    const regex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return regex.test(cleaned);
};

// Debounce
export const debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Deep clone
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
};

// Générer un ID unique
export const generateId = (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};

// Capitaliser
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Tronquer un texte
export const truncate = (str, length = 50, suffix = '...') => {
    if (!str || str.length <= length) return str;
    return str.substr(0, length - suffix.length) + suffix;
};

// Storage helpers avec expiration
export const storage = {
    set: (key, value, expiryMinutes = null) => {
        const item = {
            value: value,
            timestamp: Date.now()
        };
        
        if (expiryMinutes) {
            item.expiry = Date.now() + (expiryMinutes * 60 * 1000);
        }
        
        try {
            localStorage.setItem(key, JSON.stringify(item));
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },
    
    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            
            // Vérifier l'expiration
            if (parsed.expiry && Date.now() > parsed.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return parsed.value;
        } catch (e) {
            console.error('Storage error:', e);
            return null;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('Storage error:', e);
            return false;
        }
    }
};

// Gestion des query params
export const queryParams = {
    get: (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },
    
    getAll: () => {
        const urlParams = new URLSearchParams(window.location.search);
        const params = {};
        for (const [key, value] of urlParams) {
            params[key] = value;
        }
        return params;
    },
    
    set: (params) => {
        const urlParams = new URLSearchParams(window.location.search);
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined) {
                urlParams.delete(key);
            } else {
                urlParams.set(key, params[key]);
            }
        });
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
        window.history.pushState({}, '', newUrl);
    }
};

// Sleep helper
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry helper
export const retry = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        await sleep(delay);
        return retry(fn, retries - 1, delay * 2);
    }
};

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    // UI Components
    AppHeader: AppHeader,
    Dialog: Dialog,
    notify: notify,
    Modal: Modal,
    modalManager: modalManager,
    confirmerAction: confirmerAction,
    Timeline: Timeline,
    createTimeline: createTimeline,
    createOrderTimeline: createOrderTimeline,
    SearchDropdown: SearchDropdown,
    DataTable,
    DataTableFilters,
    StatsCards,
    Stepper,
    DropdownList,
    NumpadComponent,
    
    // Utils
    formatDate,
    formatMoney,
    isValidEmail,
    isValidPhone,
    debounce,
    deepClone,
    generateId,
    capitalize,
    truncate,
    storage,
    queryParams,
    sleep,
    retry
};

// ========================================
// HISTORIQUE DES DIFFICULTÉS
//
// [01/02/2025] - Correction de tous les chemins
// - Tous les composants sont dans des sous-dossiers
// - Ajout de NumpadComponent
// - Correction du chemin du fichier lui-même
// ========================================