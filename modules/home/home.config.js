// ========================================
// HOME.CONFIG.JS - Configuration locale du module home
// Chemin: modules/home/home.config.js
//
// DESCRIPTION:
// Configuration et factories pour le module home
// ========================================

import { 
    AppHeader,
    DropdownList,
    Dialog,
    notify
} from '../../src/components/index.js';

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
        // Ajouter les classes pour les boutons
        buttonClasses: {
            back: 'btn on-dark btn-pill',
            logout: 'btn btn-danger btn-sm',  // ← Classes pour le bouton rouge
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
        href: '#',
        icon: '🏥',
        title: 'Sécurité Sociale',
        description: 'Gérer les décomptes sécurité sociale',
        permissions: ['secu.view'],
        disabled: true
    },
    {
        href: '#',
        icon: '🏦',
        title: 'Compte en Banque',
        description: 'Consulter les comptes bancaires',
        permissions: ['banque.view'],
        disabled: true
    },
    {
        href: '#',
        icon: '📄',
        title: 'Factures Fournisseur',
        description: 'Gérer les factures fournisseurs',
        permissions: ['factures.view'],
        disabled: true
    },
    {
        href: '#',
        icon: '👥',
        title: 'Comptes Clients',
        description: 'Gérer les comptes clients',
        permissions: ['clients.view'],
        disabled: true
    },
    {
        href: '../../pages/guide.html',
        icon: '📚',
        title: 'Guide SAV',
        description: 'Consulter les procédures et protocoles'
    },
    {
        href: '../../pages/contacts.html',
        icon: '📞',
        title: 'Contacts SAV',
        description: 'Numéros et contacts importants'
    },
    {
        href: '../../pages/compte.html',
        icon: '⚙️',
        title: 'Mon Compte',
        description: 'Gérer mes informations personnelles'
    }
];

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    createHomeHeader,
    MENU_ITEMS,
    Dialog,
    notify
};