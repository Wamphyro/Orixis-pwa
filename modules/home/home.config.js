// ========================================
// HOME.CONFIG.JS - Configuration locale du module home
// Chemin: modules/home/home.config.js
//
// DESCRIPTION:
// Configuration et factories pour le module home
// ========================================

import { AppHeader } from '../../src/components/ui/app-header/app-header.component.js';
import { DropdownList } from '../../src/components/ui/dropdown-list/dropdown-list.component.js';
import { Button } from '../../src/components/ui/button/button.component.js';
import { Dialog } from '../../src/components/ui/dialog/dialog.component.js';
import { notify } from '../../src/components/ui/notification/notification.component.js';

// ========================================
// FACTORY : HEADER HOME
// ========================================

export function createHomeHeader(userData) {
    const config = {
        title: '📊 Dashboard',
        subtitle: 'Système de Gestion',
        showBack: false,
        theme: 'gradient',
        user: userData,
        showMagasinDropdown: userData.magasins && userData.magasins.length > 1,
        // Ajouter les classes pour les boutons
        buttonClasses: {
            back: 'btn on-dark btn-pill',
            logout: 'btn btn-danger btn-sm text-white',
            userSection: 'header-user-section'
        },
        // Ajouter le callback onLogout
        onLogout: async () => {
            const confirme = await Dialog.confirm(
                'Voulez-vous vraiment vous déconnecter ?',
                'Déconnexion'
            );
            if (confirme) {
                localStorage.removeItem('sav_auth');
                localStorage.removeItem('sav_user_permissions');
                window.location.href = '../../index.html';
            }
        }
    };
    
    // Si un seul magasin, l'afficher directement
    if (userData.magasins && userData.magasins.length === 1) {
        config.user.store = `Magasin ${userData.magasin}`;
    }
    // Si plusieurs magasins, on va ajouter le dropdown après
    
    return new AppHeader(config);
}

// ========================================
// CONFIGURATION MENU
// ========================================

export const MENU_ITEMS = [
    {
        href: '../intervention/intervention.html',
        icon: '📝',
        title: 'Nouvelle Intervention',
        description: 'Créer une fiche d\'intervention pour un client',
        permissions: ['intervention.create']
    },
    {
        href: '../commandes/commandes.html',
        icon: '📦',
        title: 'Commandes',
        description: 'Gérer les commandes d\'appareils et accessoires',
        permissions: ['commandes.view']
    },
    {
        href: '../decompte-mutuelle/decompte-mutuelle.html',
        icon: '💳',
        title: 'Décompte Mutuelle',
        description: 'Gérer les décomptes mutuelles et remboursements',
        permissions: ['mutuelle.view']
    },
    {
        href: '../decompte-secu/decompte-secu.html',
        icon: '🏥',
        title: 'Sécurité Sociale',
        description: 'Gérer les décomptes sécurité sociale',
        permissions: ['secu.view'],
        disabled: false
    },
    {
        href: '../operations-bancaires/operations-bancaires.html',
        icon: '🏦',
        title: 'Opérations Bancaires',
        description: 'Importer et gérer les opérations bancaires',
        permissions: ['banque.view'],
        disabled: false
    },
    {
        href: '../factures-fournisseurs/factures-fournisseurs.html',
        icon: '📄',
        title: 'Factures Fournisseurs',
        description: 'Gérer les factures fournisseurs',
        permissions: ['factures.view'],
        disabled: false
    },
    {
        href: '../subventions/ui/subventions.html',  // ✅ CHEMIN CORRECT
        icon: '🗃️',
        title: 'Dossiers de subvention',
        description: 'Gérer les dossiers de subvention MDPH et AGEFIPH',
        permissions: ['subventions.view'],
        disabled: false
    },
    {
        href: '/modules/test/test-widgets.html',
        icon: '🧪',
        title: 'TEST PAGE WIDGETS',
        description: 'Environnement de test pour les nouveaux widgets',
        permissions: ['clients.view'],
        disabled: false  // Activé pour les tests
    },
        {
        href: '../gmail/gmail.html',
        icon: '📧',
        title: 'MailBox & Chat',
        description: 'Gérer les emails et les conversations',
        permissions: ['gmail.view'],
        disabled: false
    },
    {
        href: '../guide/guide.html',
        icon: '📚',
        title: 'Guide SAV',
        description: 'Consulter les procédures et protocoles'
    },
    {
        href: '/module/contact/contact.html',
        icon: '📞',
        title: 'Contacts SAV',
        description: 'Numéros et contacts importants'
    },
    {
        href: '../compte/compte.html',
        icon: '👤',
        title: 'Mon Compte',
        description: 'Gérer mon profil, mes groupes et permissions'
    },
    {
        href: '../admin/admin.html',
        icon: '👑',
        title: 'Administration',
        description: 'Gérer les utilisateurs, groupes et permissions',
        permissions: ['admin.access'],
        requiresAdmin: true
    }
];

// ========================================
// FORCER LE CHARGEMENT DES STYLES
// ========================================

// Charger les styles du composant Button
const initButtonStyles = () => {
    const temp = new Button({ text: '' });
    temp.destroy();
};
initButtonStyles();

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    createHomeHeader,
    MENU_ITEMS,
    Dialog,
    notify,
    Button
};