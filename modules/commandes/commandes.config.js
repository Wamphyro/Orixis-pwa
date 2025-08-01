// ========================================
// COMMANDES.CONFIG.JS - Configuration UI locale du module
// Chemin: modules/commandes/commandes.config.js
//
// DESCRIPTION:
// Configuration UI complète pour le module commandes
// Remplace toute référence à ui.config.js
// ========================================

import { 
    Button,
    AppHeader,
    DataTable,
    DataTableFilters,
    StatsCards,
    Timeline,
    DropdownList,
    SearchDropdown,
    Modal,
    modalManager,
    Dialog,
    notify
} from '../../src/components/index.js';

// Import des modules DataTable
import { DataTableSort } from '../../src/components/ui/datatable/datatable.sort.js';
import { DataTableExport } from '../../src/components/ui/datatable/datatable.export.js';
import { DataTablePagination } from '../../src/components/ui/datatable/datatable.pagination.js';
import { DataTableResize } from '../../src/components/ui/datatable/datatable.resize.js';

// ========================================
// FACTORY : HEADER DU MODULE
// ========================================

export function createCommandesHeader(userData) {
    return new AppHeader({
        container: 'body',
        title: '📦 Gestion des Commandes',
        subtitle: 'Commandes d\'appareils et accessoires',
        backUrl: '../../home/index.html',
        user: userData,
        onLogout: async () => {
            const confirme = await Dialog.confirm(
                'Voulez-vous vraiment vous déconnecter ?',
                'Déconnexion'
            );
            if (confirme) {
                localStorage.removeItem('sav_auth');
                window.location.href = '../../index.html';
            }
        }
    });
}

// ========================================
// FACTORY : DATATABLE DU MODULE
// ========================================

export function createCommandesTable(container, options = {}) {
    return new DataTable({
        container,
        modules: {
            SortClass: DataTableSort,
            ExportClass: DataTableExport,
            PaginationClass: DataTablePagination,
            ResizeClass: DataTableResize
        },
        features: {
            sort: true,
            resize: true,
            export: true,
            selection: false,
            pagination: true
        },
        pagination: {
            itemsPerPage: 20,
            pageSizeOptions: [10, 20, 50, 100]
        },
        messages: {
            noData: 'Aucune commande trouvée',
            loading: 'Chargement des commandes...',
            itemsPerPage: 'Éléments par page',
            page: 'Page',
            of: 'sur',
            items: 'éléments'
        },
        ...options
    });
}

// ========================================
// FACTORY : FILTRES DU MODULE
// ========================================

export function createCommandesFilters(container, filters, onFilter) {
    return new DataTableFilters({
        container,
        filters,
        DropdownClass: DropdownList,
        onFilter
    });
}

// ========================================
// FACTORY : STATS CARDS DU MODULE
// ========================================

export function createCommandesStatsCards(container, cards, onClick) {
    return new StatsCards({
        container,
        cards,
        animated: true,
        onClick
    });
}

// ========================================
// FACTORY : TIMELINE COMMANDE
// ========================================

export function createCommandeTimeline(container, items, options = {}) {
    return new Timeline({
        container,
        items,
        theme: 'colorful',
        orientation: 'horizontal',
        animated: true,
        showDates: true,
        showLabels: true,
        clickable: false,
        ...options
    });
}

// ========================================
// FACTORY : DROPDOWNS DU MODULE
// ========================================

export function createDropdown(container, options) {
    return new DropdownList({
        container,
        ...options
    });
}

export function createSearchDropdown(container, options) {
    return new SearchDropdown({
        container,
        minLength: 2,
        noResultsText: 'Aucun résultat trouvé',
        loadingText: 'Recherche en cours...',
        ...options
    });
}

// ========================================
// FACTORY : BOUTONS DU MODULE
// ========================================

export function createButton(type, options = {}) {
    const configs = {
        // Boutons de base
        primary: {
            variant: 'primary',
            pill: true
        },
        save: {
            text: 'Enregistrer',
            variant: 'success',
            pill: true,
            icon: '💾'
        },
        cancel: {
            text: 'Annuler',
            variant: 'ghost',
            pill: true
        },
        delete: {
            text: 'Supprimer',
            variant: 'danger',
            size: 'sm',
            icon: '🗑️'
        },
        
        // Boutons d'action
        action: {
            variant: 'action',
            size: 'sm'
        },
        view: {
            variant: 'action',
            size: 'sm',
            icon: '👁️'
        },
        edit: {
            variant: 'action',
            size: 'sm',
            icon: '✏️'
        },
        
        // Boutons spécifiques commandes
        newOrder: {
            text: 'Nouvelle commande',
            variant: 'primary',
            pill: true,
            icon: '➕'
        },
        validate: {
            text: 'Valider',
            variant: 'success',
            pill: true,
            icon: '✅'
        },
        ship: {
            text: 'Expédier',
            variant: 'primary',
            icon: '📦'
        },
        receive: {
            text: 'Réceptionner',
            variant: 'info',
            icon: '📥'
        }
    };
    
    const config = configs[type] || configs.primary;
    
    return new Button({
        ...config,
        ...options
    });
}

// ========================================
// CONFIG : BOUTONS HTML (pour compatibilité)
// ========================================

export const BUTTON_CLASSES = {
    primary: 'btn btn-primary btn-pill',
    save: 'btn btn-success btn-pill',
    cancel: 'btn btn-ghost btn-pill',
    delete: 'btn btn-danger btn-sm',
    action: 'btn-action'
};

// ========================================
// CONFIG : TEMPLATES HTML
// ========================================

export const HTML_TEMPLATES = {
    // Template pour urgence
    urgence: (config) => `
        <span class="urgence-icon-wrapper">
            <span class="urgence-icon">${config.icon}</span>
            <span class="urgence-tooltip">${config.label} (${config.delai})</span>
        </span>
    `,
    
    // Template pour statut
    statut: (config) => `
        <span class="statut-icon-wrapper">
            <span class="statut-icon">${config.icon}</span>
            <span class="statut-tooltip">${config.label}</span>
        </span>
    `,
    
    // Template pour badge
    badge: (value, label, icon = '') => `
        <span class="badge badge-${value.replace(/_/g, '-')}">
            ${icon} ${label}
        </span>
    `
};

// ========================================
// CONFIG : MODALES DU MODULE
// ========================================

export function registerCommandesModals() {
    // Modal nouvelle commande
    modalManager.register('modalNouvelleCommande', {
        closeOnOverlayClick: false,
        closeOnEscape: true
    });
    
    // Modal détail commande
    modalManager.register('modalDetailCommande', {
        closeOnOverlayClick: false,
        closeOnEscape: true
    });
    
    // Modal nouveau client
    modalManager.register('modalNouveauClient', {
        closeOnOverlayClick: false,
        closeOnEscape: true
    });
    
    // Modal numéros de série
    modalManager.register('modalNumerosSerie', {
        closeOnOverlayClick: false,
        closeOnEscape: true
    });
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    // Factories
    createCommandesHeader,
    createCommandesTable,
    createCommandesFilters,
    createCommandesStatsCards,
    createCommandeTimeline,
    createDropdown,
    createSearchDropdown,
    createButton,
    
    // Configs
    BUTTON_CLASSES,
    HTML_TEMPLATES,
    registerCommandesModals,
    
    // Components directs (pour injection)
    Button,
    Modal,
    Dialog,
    notify
};