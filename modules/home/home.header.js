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
    const container = document.getElementById(dropdownId);
    if (!container) return;
    
    // Créer un dropdown HTML simple et élégant
    container.innerHTML = `
        <div class="simple-dropdown">
            <button class="simple-dropdown-trigger" type="button">
                <span class="dropdown-value">${userData.magasin}</span>
                <span class="dropdown-arrow">▼</span>
            </button>
            <div class="simple-dropdown-menu">
                ${userData.magasins.map(mag => `
                    <div class="dropdown-option ${mag === userData.magasin ? 'selected' : ''}" 
                         data-value="${mag}">
                        🏪 ${mag}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Gestion simple des événements
    const trigger = container.querySelector('.simple-dropdown-trigger');
    const menu = container.querySelector('.simple-dropdown-menu');
    
    trigger.addEventListener('click', () => {
        menu.classList.toggle('show');
    });
    
    container.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            if (window.changeMagasin) {
                window.changeMagasin(value);
            }
        });
    });
    
    // Fermer au clic extérieur
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            menu.classList.remove('show');
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