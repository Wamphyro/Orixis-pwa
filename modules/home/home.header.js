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

    // Si plusieurs magasins, ajouter le dropdown après
    if (userData.magasins && userData.magasins.length > 1) {
        // Attendre que le header soit rendu
        setTimeout(() => {
            addMagasinDropdown(userData);
        }, 100);
    }
    
    return appHeader;
}

// Fonction pour ajouter le dropdown
function addMagasinDropdown(userData) {
    const userSection = document.querySelector('.header-user-section');
    if (!userSection) return;
    
    // Créer le conteneur pour le dropdown
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'header-magasin-section';
    dropdownContainer.innerHTML = `
        <span class="magasin-label">Magasin :</span>
        <div id="magasinDropdownHeader"></div>
    `;
    
    // Insérer avant le bouton déconnexion
    const logoutBtn = userSection.querySelector('.header-logout-button');
    if (logoutBtn) {
        userSection.insertBefore(dropdownContainer, logoutBtn);
    } else {
        userSection.appendChild(dropdownContainer);
    }
    
    // Créer le dropdown
    new DropdownList({
        container: '#magasinDropdownHeader',
        options: userData.magasins.map(mag => ({
            value: mag,
            label: mag,
            icon: '🏪'
        })),
        value: userData.magasin,
        searchable: userData.magasins.length > 5,
        size: 'small',
        theme: 'compact',
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