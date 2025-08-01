// ========================================
// UI.CONFIG.JS - Configuration globale de l'interface
// Chemin: src/config/ui.config.js
//
// DESCRIPTION:
// Centralise toutes les configurations UI pour l'ensemble du site
// ========================================

// ========================================
// CONFIGURATION DES BOUTONS
// ========================================
export const BUTTON_STYLES = {
    // === BOUTONS PRINCIPAUX ===
    primary: 'btn btn-primary',
    primaryPill: 'btn btn-primary btn-pill',
    primaryLarge: 'btn btn-primary btn-lg',
    primarySmall: 'btn btn-primary btn-sm',
    
    // === BOUTONS SECONDAIRES ===
    secondary: 'btn btn-secondary',
    secondaryPill: 'btn btn-secondary btn-pill',
    
    // === BOUTONS DANGER ===
    danger: 'btn btn-danger',
    dangerPill: 'btn btn-danger btn-pill',
    dangerSmall: 'btn btn-danger btn-sm',
    
    // === BOUTONS SUCCESS ===
    success: 'btn btn-success',
    successPill: 'btn btn-success btn-pill',
    
    // === BOUTONS GHOST ===
    ghost: 'btn btn-ghost',
    ghostPill: 'btn btn-ghost btn-pill',
    
    // === BOUTONS ACTION (Tableaux) ===
    action: 'btn-action',
    actionDanger: 'btn-action btn-action-danger',
    
    // === BOUTONS SPÉCIAUX ===
    export: 'btn btn-export btn-pill btn-sm',
    reset: 'btn btn-reset btn-pill btn-sm',
    
    // === BOUTONS HEADER ===
    headerBack: 'btn btn-ghost btn-pill on-dark',
    headerLogout: 'btn btn-danger btn-pill btn-sm',
    
    // === BOUTONS PAGINATION ===
    pagination: 'btn btn-ghost btn-sm',
    paginationActive: 'btn btn-primary btn-sm',
    
    // === BOUTONS MODAL ===
    modalPrimary: 'btn btn-primary btn-pill',
    modalSecondary: 'btn btn-secondary btn-pill',
    modalCancel: 'btn btn-ghost btn-pill',
    
    // === BOUTONS ICÔNE ===
    iconCircle: 'btn btn-circle',
    iconCircleSmall: 'btn btn-circle btn-sm',
    iconCirclePrimary: 'btn btn-primary btn-circle'
};

// ========================================
// CONFIGURATION PAR MODULE
// ========================================
export const MODULE_BUTTONS = {
    // Module Commandes
    commandes: {
        create: BUTTON_STYLES.primaryPill,
        save: BUTTON_STYLES.successPill,
        cancel: BUTTON_STYLES.ghostPill,
        delete: BUTTON_STYLES.dangerSmall,
        edit: BUTTON_STYLES.action,
        view: BUTTON_STYLES.action,
        export: BUTTON_STYLES.export,
        reset: BUTTON_STYLES.reset
    },
    
    // Module Intervention
    intervention: {
        start: BUTTON_STYLES.primaryLarge,
        stop: BUTTON_STYLES.dangerPill,
        validate: BUTTON_STYLES.successPill,
        addPhoto: BUTTON_STYLES.iconCircle,
        signature: BUTTON_STYLES.primaryPill
    },
    
    // Module Décompte Mutuelle
    decompte: {
        calculate: BUTTON_STYLES.primaryPill,
        generate: BUTTON_STYLES.successPill,
        print: BUTTON_STYLES.secondaryPill,
        reset: BUTTON_STYLES.reset
    },
    
    // Login
    login: {
        submit: BUTTON_STYLES.primaryLarge,
        forgotPassword: BUTTON_STYLES.ghost
    }
};

// ========================================
// CONFIGURATION DES COMPOSANTS UI
// ========================================
export const COMPONENT_CONFIG = {
    // DataTable
    dataTable: {
        buttonClasses: {
            export: BUTTON_STYLES.export,
            action: BUTTON_STYLES.action,
            actionDanger: BUTTON_STYLES.actionDanger,
            pagination: BUTTON_STYLES.pagination,
            paginationActive: BUTTON_STYLES.paginationActive
        }
    },
    
    // DataTableFilters
    dataTableFilters: {
        buttonClasses: {
            reset: BUTTON_STYLES.reset,
            apply: BUTTON_STYLES.primarySmall
        }
    },
    
    // AppHeader
    appHeader: {
        buttonClasses: {
            back: BUTTON_STYLES.headerBack,
            logout: BUTTON_STYLES.headerLogout,
            userSection: 'header-user-section' // Classe spéciale
        }
    },
    
    // Modal
    modal: {
        buttonClasses: {
            close: BUTTON_STYLES.iconCircleSmall,
            primary: BUTTON_STYLES.modalPrimary,
            secondary: BUTTON_STYLES.modalSecondary,
            cancel: BUTTON_STYLES.modalCancel
        }
    },
    
    // Dialog
    dialog: {
        buttonClasses: {
            confirm: BUTTON_STYLES.primaryPill,
            cancel: BUTTON_STYLES.ghostPill,
            danger: BUTTON_STYLES.dangerPill
        }
    }
};

// ========================================
// THÈMES GLASSMORPHISM
// ========================================
export const GLASS_THEMES = {
    default: {
        background: 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.2)',
        blur: '10px'
    },
    dark: {
        background: 'rgba(0, 0, 0, 0.2)',
        border: 'rgba(255, 255, 255, 0.1)',
        blur: '15px'
    },
    colored: {
        primary: {
            background: 'rgba(102, 126, 234, 0.15)',
            border: 'rgba(102, 126, 234, 0.3)',
            blur: '12px'
        },
        danger: {
            background: 'rgba(220, 53, 69, 0.15)',
            border: 'rgba(220, 53, 69, 0.3)',
            blur: '12px'
        }
    }
};

// ========================================
// HELPERS
// ========================================

/**
 * Obtenir les classes de boutons pour un module
 * @param {string} module - Nom du module
 * @param {string} action - Action du bouton
 * @returns {string} Classes CSS
 */
export function getButtonClass(module, action) {
    return MODULE_BUTTONS[module]?.[action] || BUTTON_STYLES.primary;
}

/**
 * Obtenir la config d'un composant
 * @param {string} component - Nom du composant
 * @returns {Object} Configuration
 */
export function getComponentConfig(component) {
    return COMPONENT_CONFIG[component] || {};
}

// Export par défaut
export default {
    BUTTON_STYLES,
    MODULE_BUTTONS,
    COMPONENT_CONFIG,
    GLASS_THEMES,
    getButtonClass,
    getComponentConfig
};