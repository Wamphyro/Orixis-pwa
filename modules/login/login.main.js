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
import config from './login.config.js';

// ========================================
// VARIABLES GLOBALES
// ========================================

export const state = {
    isLoading: false,
    attempts: 0,
    isLocked: false
};

// ========================================
// INITIALISATION
// ========================================

window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation module login');
    
    try {
        // Vérifier si déjà connecté
        if (checkExistingAuth()) {
            console.log('✅ Déjà authentifié, redirection...');
            window.location.href = config.LOGIN_CONFIG.successRedirect;
            return;
        }
        
        // Afficher le loading
        showLoading(true);
        
        // Initialiser Firebase
        await initFirebase();
        console.log('✅ Firebase initialisé');
        
        // Initialiser l'interface
        await initLoginUI();
        console.log('✅ Interface initialisée');
        
        // Masquer le loading avec délai pour transition
        setTimeout(() => {
            showLoading(false);
            // Ajouter animation d'entrée
            document.querySelector('.login-container').classList.add('fade-in');
        }, 500);
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        config.notify.error('Erreur lors du chargement');
        showLoading(false);
    }
});

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

export function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
    }
    state.isLoading = show;
}

// ========================================
// GESTION DES TENTATIVES
// ========================================

export function incrementAttempts() {
    state.attempts++;
    
    if (state.attempts >= config.LOGIN_CONFIG.maxAttempts) {
        state.isLocked = true;
        // Déverrouiller après le délai
        setTimeout(() => {
            state.attempts = 0;
            state.isLocked = false;
            console.log('🔓 Déverrouillé après délai');
        }, config.LOGIN_CONFIG.lockDuration);
    }
}

export function resetAttempts() {
    state.attempts = 0;
    state.isLocked = false;
}

// ========================================
// ANIMATIONS
// ========================================

export function animateSuccess() {
    const container = document.querySelector('.login-container');
    container.classList.add('success');
}

export function animateError() {
    const container = document.querySelector('.login-container');
    container.classList.add('shake');
    setTimeout(() => {
        container.classList.remove('shake');
    }, 500);
}