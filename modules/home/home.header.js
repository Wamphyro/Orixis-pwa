// ========================================
// HOME.HEADER.JS - Gestion du header
// Chemin: modules/home/home.header.js
//
// DESCRIPTION:
// Gère l'initialisation et les actions du header
// ========================================

import config from './home.config.js';
import { DropdownList } from '../../src/components/index.js';

// ========================================
// INITIALISATION HEADER
// ========================================

export async function initHeader() {
    const userData = getUserData();
    
    // Créer le header
    const appHeader = config.createHomeHeader(userData);

    // Si plusieurs magasins ET que le dropdown est activé, le créer
    if (userData.magasins && userData.magasins.length > 1 && appHeader.getMagasinDropdownId()) {
        createMagasinDropdown(appHeader.getMagasinDropdownId(), userData);
    }
    
    return appHeader;
}

// Fonction pour créer le dropdown
function createMagasinDropdown(dropdownId, userData) {
    // Créer le dropdown
    new DropdownList({
        container: `#${dropdownId}`,
        options: userData.magasins.map(mag => ({
            value: mag,
            label: mag,
            icon: '🏪'
        })),
        value: userData.magasin,
        searchable: userData.magasins.length > 5,
        size: 'small',
        theme: '',            // PAS de thème, on utilise juste notre classe
        className: 'dropdown-header-transparent', // Classe custom
        width: '140px',       // Largeur fixe
        onChange: (value) => {
            if (window.changeMagasin) {
                window.changeMagasin(value);
            }
        }
    });
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