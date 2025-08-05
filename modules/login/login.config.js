// ========================================
// LOGIN.CONFIG.JS - Configuration locale
// Chemin: modules/login/login.config.js
// ========================================

import DropdownList from '../../src/components/ui/dropdown-list/dropdown-list.component.js';
import notify from '../../src/components/ui/notification/notification.component.js';

// ========================================
// FACTORIES
// ========================================

export function createUserDropdown(container, options = {}) {
    return new DropdownList({
        container,
        placeholder: '-- Choisir un utilisateur --',
        searchable: true,
        showIcons: true,
        size: 'large',
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
        enterPin: 'Veuillez entrer votre code PIN',
        invalidCode: 'Code incorrect',
        attemptsRemaining: (n) => `${n} tentative${n > 1 ? 's' : ''} restante${n > 1 ? 's' : ''}`,
        tooManyAttempts: 'Trop de tentatives. Veuillez attendre 3 minutes.',
        success: 'Connexion réussie ! Redirection...',
        error: 'Erreur lors de la connexion',
        noUsers: 'Aucun utilisateur trouvé'
    }
};

// ========================================
// EXPORT
// ========================================

export default {
    createUserDropdown,
    LOGIN_CONFIG,
    notify
};