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
        user: {
            name: userData.name,
            showLogout: true
        }
    };
    
    // Si plusieurs magasins, ajouter le dropdown
    if (userData.magasins && userData.magasins.length > 1) {
        config.user.customContent = createMagasinDropdown(userData);
    } else if (userData.magasin) {
        config.user.store = `Magasin ${userData.magasin}`;
    }
    
    return new AppHeader(config);
}

function createMagasinDropdown(userData) {
    const container = document.createElement('div');
    container.className = 'header-magasin-dropdown';
    container.innerHTML = '<span class="magasin-label">Magasin :</span><div id="magasinDropdown"></div>';
    
    // Créer le dropdown après insertion
    setTimeout(() => {
        new DropdownList({
            container: '#magasinDropdown',
            options: userData.magasins.map(mag => ({
                value: mag,
                label: mag,
                icon: '🏪'
            })),
            value: userData.magasin,
            searchable: userData.magasins.length > 5,
            size: 'small',
            onChange: (value) => {
                if (window.changeMagasin) {
                    window.changeMagasin(value);
                }
            }
        });
    }, 100);
    
    return container;
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