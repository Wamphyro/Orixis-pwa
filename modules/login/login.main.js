// ========================================
// LOGIN.MAIN.JS - Point d'entrée principal
// Chemin: modules/login/login.main.js
//
// DESCRIPTION:
// Gère l'initialisation et coordonne les modules
// ========================================

import { initFirebase } from '../../src/services/firebase.service.js';
import { initLoginUI } from './login.ui.js';
import { checkExistingAuth } from './login.auth.js';
import { loader } from '../../src/components/index.js';
import config from './login.config.js';

// ========================================
// ÉTAT GLOBAL
// ========================================

export const state = {
    isLoading: false,
    attempts: 0,
    isLocked: false,
    lockTimeout: null
};

// ========================================
// INITIALISATION
// ========================================

window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation module login');
    
    try {
        // Vérifier l'authentification existante
        if (checkExistingAuth()) {
            console.log('✅ Déjà authentifié, redirection...');
            window.location.href = config.LOGIN_CONFIG.successRedirect;
            return;
        }
        
        // Afficher le loader
        showLoading(true, 'Initialisation...');
        
        // Initialiser Firebase
        await initFirebase();
        console.log('✅ Firebase initialisé');
        
        // Mettre à jour le message
        loader.update('Chargement des utilisateurs...');
        
        // Initialiser l'interface
        await initLoginUI();
        console.log('✅ Interface initialisée');
        
        // Masquer le loader avec animation
        setTimeout(() => {
            showLoading(false);
        }, 500);
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        config.notify.error('Erreur lors du chargement');
        showLoading(false);
    }
});

// ========================================
// GESTION DU LOADING
// ========================================

export function showLoading(show, message = 'Chargement...') {
    if (show) {
        loader.show(message);
    } else {
        loader.hide();
    }
    state.isLoading = show;
}

// ========================================
// GESTION DES TENTATIVES
// ========================================

export function incrementAttempts() {
    state.attempts++;
    
    if (state.attempts >= config.LOGIN_CONFIG.maxAttempts) {
        lockLogin();
    }
    
    return config.LOGIN_CONFIG.maxAttempts - state.attempts;
}

export function lockLogin() {
    state.isLocked = true;
    
    // Clear existing timeout
    if (state.lockTimeout) {
        clearTimeout(state.lockTimeout);
    }
    
    // Set unlock timeout
    state.lockTimeout = setTimeout(() => {
        unlockLogin();
    }, config.LOGIN_CONFIG.lockDuration);
}

export function unlockLogin() {
    state.attempts = 0;
    state.isLocked = false;
    state.lockTimeout = null;
    console.log('🔓 Login déverrouillé');
    config.notify.info('Vous pouvez réessayer');
}

// ========================================
// ANIMATIONS
// ========================================

export function animateSuccess() {
    const container = document.querySelector('.login-container');
    if (container) {
        container.classList.add('success');
    }
}

export function animateError() {
    const container = document.querySelector('.login-container');
    if (container) {
        container.classList.add('shake');
        setTimeout(() => {
            container.classList.remove('shake');
        }, 500);
    }
}

// ========================================
// CLEANUP
// ========================================

window.addEventListener('beforeunload', () => {
    if (state.lockTimeout) {
        clearTimeout(state.lockTimeout);
    }
});