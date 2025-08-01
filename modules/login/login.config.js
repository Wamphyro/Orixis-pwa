// ========================================
// LOGIN.CONFIG.JS - Configuration locale du module login
// Chemin: modules/login/login.config.js
//
// DESCRIPTION:
// Configuration et factories pour le module login
// ========================================

import { 
    DropdownList,
    Numpad,
    notify
} from '../../src/components/index.js';

// ========================================
// FACTORY : DROPDOWN UTILISATEURS
// ========================================

export function createUserDropdown(container, options = {}) {
    return new DropdownList({
        container,
        placeholder: '-- Choisir un utilisateur --',
        searchable: true,
        showIcons: true,
        keepPlaceholder: false,
        ...options
    });
}

// ========================================
// FACTORY : NUMPAD
// ========================================

export function createLoginNumpad(container, options = {}) {
    return new Numpad({
        container,
        title: '',
        maxLength: 4,
        allowDecimal: false,
        allowNegative: false,
        showDisplay: false,
        showCancel: false,
        showSubmit: false,
        showClear: true,
        autoSubmitLength: 4,
        theme: 'default',
        ...options
    });
}

// ========================================
// CONFIGURATION
// ========================================

export const LOGIN_CONFIG = {
    maxAttempts: 3,
    lockDuration: 3 * 60 * 1000, // 3 minutes
    rememberDays: 30,
    successRedirect: '../home/home.html',
    
    messages: {
        loading: 'Chargement des utilisateurs...',
        selectUser: 'Veuillez sélectionner votre nom',
        invalidCode: 'Code incorrect',
        attemptsRemaining: (remaining) => `${remaining} tentative${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`,
        tooManyAttempts: 'Trop de tentatives. Veuillez attendre 3 minutes.',
        success: 'Connexion réussie ! Redirection...',
        error: 'Erreur lors de la connexion',
        noUsers: 'Aucun utilisateur trouvé'
    }
};

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    createUserDropdown,
    createLoginNumpad,
    LOGIN_CONFIG,
    notify
};