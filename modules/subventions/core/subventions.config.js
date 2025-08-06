// ========================================
// SUBVENTIONS.CONFIG.JS - Configuration minimale
// Chemin: modules/subventions/core/subventions.config.js
// ========================================

// IMPORTER LES COMPOSANTS COMME FACTURES
import { AppHeader } from '../../../src/components/ui/app-header/app-header.component.js';
import { Button } from '../../../src/components/ui/button/button.component.js';
import { Modal, modalManager } from '../../../src/components/ui/modal/modal.component.js';
import { Dialog } from '../../../src/components/ui/dialog/dialog.component.js';
import { notify } from '../../../src/components/ui/notification/notification.component.js';
import { SearchDropdown } from '../../../src/components/ui/search-dropdown/search-dropdown.component.js';

export function createSubventionsHeader(userData) {
    return new AppHeader({
        // Container
        container: 'body',
        position: 'prepend',
        
        // Contenu
        title: '📋 Gestion des Subventions',
        subtitle: 'Suivi MDPH et AGEFIPH',
        theme: 'default',
        
        // Navigation
        backUrl: window.location.origin + '/Orixis-pwa/modules/home/home.html',
        
        // Utilisateur
        user: userData,
        showMagasinDropdown: false,
        showLogout: true,
        
        // Classes CSS (COMME FACTURES)
        buttonClasses: {
            back: 'btn on-dark btn-pill',
            logout: 'btn btn-danger btn-sm on-dark text-white',
            userSection: 'header-user-section'
        },
        
        // Callbacks
        onLogout: async () => {
            localStorage.removeItem('sav_auth');
            window.location.href = '../../../index.html';
        }
    });
}

// AJOUTER Button DANS L'EXPORT COMME FACTURES
export default {
    createSubventionsHeader,
    
    // Components directs
    Button,
    Modal,
    Dialog,
    notify,
    modalManager,
    SearchDropdown
};