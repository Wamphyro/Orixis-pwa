// ========================================
// LOGIN.CONFIG.JS - Configuration locale
// Chemin: modules/login/login.config.js
// ========================================

import { DropdownList } from '../../src/components/ui/dropdown-list/dropdown-list.component.js';

// ========================================
// NOTIFICATION LOCALE
// ========================================

const notify = {
    success: (message) => showNotification(message, 'success'),
    error: (message) => showNotification(message, 'error'),
    warning: (message) => showNotification(message, 'warning'),
    info: (message) => showNotification(message, 'info')
};

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `login-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Suppression après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
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