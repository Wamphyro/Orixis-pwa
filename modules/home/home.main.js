// ========================================
// HOME.MAIN.JS - Point d'entrée principal
// Chemin: modules/home/home.main.js
//
// DESCRIPTION:
// Gère l'initialisation et coordonne les modules
// ========================================

import config from './home.config.js';
import { initHeader } from './home.header.js';

// ========================================
// VARIABLES GLOBALES
// ========================================

let appHeader = null;

// ========================================
// INITIALISATION
// ========================================

window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation module home');
    
    // Vérifier l'authentification
    if (!checkAuth()) {
        window.location.href = '../../index.html';
        return;
    }
    
    try {
        // Initialiser le header
        appHeader = await initHeader();
        
        // Créer le menu
        createMenu();
        
        // Animations
        initAnimations();
        
        console.log('✅ Module home initialisé');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        config.notify.error('Erreur lors du chargement');
    }
});

// ========================================
// AUTHENTIFICATION
// ========================================

function checkAuth() {
    const auth = localStorage.getItem('sav_auth');
    if (!auth) return false;
    
    try {
        const authData = JSON.parse(auth);
        const now = Date.now();
        
        if (now - authData.timestamp > authData.expiry) {
            localStorage.removeItem('sav_auth');
            localStorage.removeItem('sav_user_permissions');
            return false;
        }
        
        return authData.authenticated;
    } catch {
        return false;
    }
}

// ========================================
// CRÉATION DU MENU
// ========================================

function createMenu() {
    const container = document.querySelector('.menu-grid');
    if (!container) return;
    
    const permissions = getPermissions();
    
    container.innerHTML = config.MENU_ITEMS
        .filter(item => checkMenuPermission(item, permissions))
        .map(item => createMenuCard(item))
        .join('');
}

function getPermissions() {
    try {
        return JSON.parse(localStorage.getItem('sav_user_permissions') || '{}');
    } catch {
        return {};
    }
}

function checkMenuPermission(item, permissions) {
    // Si pas de permissions requises, toujours afficher
    if (!item.permissions || item.permissions.length === 0) {
        return true;
    }
    
    // Vérifier si l'utilisateur a au moins une des permissions
    return item.permissions.some(perm => {
        const [module, action] = perm.split('.');
        return permissions.autorisations?.[module]?.[action] !== false;
    });
}

function createMenuCard(item) {
    const disabledClass = item.disabled ? 'disabled' : '';
    const href = item.disabled ? '#' : item.href;
    
    return `
        <a href="${href}" class="menu-card fade-in ${disabledClass}" 
           ${item.disabled ? 'onclick="return false;"' : ''}>
            <span class="icon">${item.icon}</span>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            ${item.disabled ? '<span class="badge badge-soon">Bientôt disponible</span>' : ''}
        </a>
    `;
}

// ========================================
// ANIMATIONS
// ========================================

function initAnimations() {
    const cards = document.querySelectorAll('.menu-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}

// ========================================
// GESTION DU MAGASIN
// ========================================

window.changeMagasin = function(nouveauMagasin) {
    const auth = JSON.parse(localStorage.getItem('sav_auth'));
    const permissions = JSON.parse(localStorage.getItem('sav_user_permissions') || '{}');
    
    if (nouveauMagasin === auth.magasin) return;
    
    // Vérifier les permissions
    if (permissions.autorisations?.[nouveauMagasin]?.acces === true ||
        auth.magasins?.includes(nouveauMagasin)) {
        
        auth.magasin = nouveauMagasin;
        localStorage.setItem('sav_auth', JSON.stringify(auth));
        
        config.notify.success(`Magasin changé : ${nouveauMagasin}`);
        
        setTimeout(() => {
            location.reload();
        }, 1000);
    } else {
        config.notify.error('Vous n\'avez pas accès à ce magasin');
    }
};

// ========================================
// CLEANUP
// ========================================

window.addEventListener('beforeunload', () => {
    if (appHeader) {
        appHeader.destroy();
    }
});