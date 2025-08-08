// ========================================
// WIDGET-STYLES-LOADER.JS - Chargeur de styles communs
// Chemin: /src/utils/widget-styles-loader.js
//
// DESCRIPTION:
// Charge automatiquement tous les styles CSS communs nécessaires aux widgets
// (buttons, badges, modal-base, etc.)
//
// UTILISATION:
// import { loadWidgetStyles } from '/src/utils/widget-styles-loader.js';
// loadWidgetStyles(); // Dans le loadCSS() du widget
// ========================================

/**
 * Charge tous les styles communs pour les widgets
 */
export function loadWidgetStyles() {
    const styles = [
        { 
            id: 'buttons-css', 
            href: '/src/css/components/buttons.css',
            description: 'Styles des boutons'
        },
        { 
            id: 'badges-css', 
            href: '/src/css/components/badges.css',
            description: 'Styles des badges'
        },
        { 
            id: 'modal-base-css', 
            href: '/src/css/components/modal-base.css',
            description: 'Styles de base des modals'
        }
    ];
    
    styles.forEach(style => {
        if (!document.getElementById(style.id)) {
            const link = document.createElement('link');
            link.id = style.id;
            link.rel = 'stylesheet';
            link.href = `${style.href}?v=${Date.now()}`;
            document.head.appendChild(link);
            console.log(`✅ Style chargé: ${style.description}`);
        }
    });
}

/**
 * Référence rapide des classes CSS disponibles
 */
export const WIDGET_STYLES = {
    // ========== BOUTONS ==========
    buttons: {
        // Icônes d'action
        view: 'btn btn-view-icon',
        delete: 'btn btn-delete-icon', 
        edit: 'btn btn-edit-icon',
        
        // Glass fond clair
        glassBlue: 'btn btn-glass-blue',
        glassRed: 'btn btn-glass-red',
        glassGreen: 'btn btn-glass-green',
        glassOrange: 'btn btn-glass-orange',
        glassPurple: 'btn btn-glass-purple',
        
        // Glass solid (plus opaque)
        solidBlue: 'btn btn-glass-solid-blue',
        solidRed: 'btn btn-glass-solid-red',
        solidGreen: 'btn btn-glass-solid-green',
        
        // Tailles
        small: 'btn-sm',
        large: 'btn-lg',
        
        // Combinaisons courantes
        saveButton: 'btn btn-glass-blue btn-lg',
        cancelButton: 'btn btn-glass-red',
        primaryButton: 'btn btn-glass-solid-blue btn-lg',
        dangerButton: 'btn btn-glass-solid-red',
        logoutButton: 'btn btn-logout-user'
    },
    
    // ========== BADGES ==========
    badges: {
        success: 'badge badge-success',
        danger: 'badge badge-danger',
        warning: 'badge badge-warning',
        info: 'badge badge-info',
        primary: 'badge badge-primary',
        secondary: 'badge badge-secondary',
        
        // Tailles
        small: 'badge-sm',
        large: 'badge-lg',
        pill: 'badge-pill'
    },
    
    // ========== MODALS ==========
    modals: {
        overlay: 'modal-overlay',
        overlayActive: 'modal-overlay active',
        container: 'modal-container',
        
        // Tailles modal
        small: 'modal-small',
        medium: 'modal-medium',
        large: 'modal-large',
        
        // Sections
        header: 'modal-header',
        body: 'modal-body',
        footer: 'modal-footer'
    }
};

/**
 * Helper pour créer un bouton
 */
export function createButton(type, text = '', additionalClasses = '') {
    const baseClass = WIDGET_STYLES.buttons[type] || 'btn';
    return `<button class="${baseClass} ${additionalClasses}">${text}</button>`;
}

/**
 * Helper pour créer un badge
 */
export function createBadge(type, text, additionalClasses = '') {
    const baseClass = WIDGET_STYLES.badges[type] || 'badge';
    return `<span class="${baseClass} ${additionalClasses}">${text}</span>`;
}

// Export par défaut
export default {
    loadWidgetStyles,
    WIDGET_STYLES,
    createButton,
    createBadge
};