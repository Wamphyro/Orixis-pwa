// ========================================
// HOME.HEADER.JS - Gestion du header
// Chemin: modules/home/home.header.js
//
// DESCRIPTION:
// Gère l'initialisation et les actions du header
// ========================================

import config from './home.config.js';

// ========================================
// INITIALISATION HEADER
// ========================================

export async function initHeader() {
    const userData = getUserData();
    
    // Créer le header
    const appHeader = config.createHomeHeader(userData);
    
    // Définir les callbacks
    appHeader.onLogout = handleLogout;
    
    return appHeader;
}

// ========================================
// DONNÉES UTILISATEUR
// ========================================

function getUserData() {
    const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
    const permissions = JSON.parse(localStorage.getItem('sav_user_permissions') || '{}');
    
    if (!auth.collaborateur) {
        return {
            name: 'Utilisateur',
            magasin: 'Non défini',
            magasins: []
        };
    }
    
    // Récupérer les magasins autorisés
    let magasins = auth.magasins || [];
    
    if (permissions.autorisations) {
        const magasinsAutorises = Object.keys(permissions.autorisations)
            .filter(mag => permissions.autorisations[mag]?.acces === true);
        
        if (magasinsAutorises.length > 0) {
            magasins = magasinsAutorises;
        }
    }
    
    return {
        name: `${auth.collaborateur.prenom} ${auth.collaborateur.nom}`,
        magasin: auth.magasin || magasins[0] || 'Non défini',
        magasins: magasins,
        role: auth.collaborateur.role || 'technicien'
    };
}

// ========================================
// ACTIONS
// ========================================

async function handleLogout() {
    const confirmed = await config.Dialog.confirm(
        'Voulez-vous vraiment vous déconnecter ?',
        'Déconnexion'
    );
    
    if (confirmed) {
        localStorage.removeItem('sav_auth');
        localStorage.removeItem('sav_user_permissions');
        
        config.notify.success('Déconnexion réussie');
        
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 1000);
    }
}