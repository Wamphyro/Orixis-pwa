// ========================================
// COMMANDES.CONFIG.JS - Configuration UI locale du module
// Chemin: modules/commandes/commandes.config.js
//
// DESCRIPTION:
// Configuration UI complète pour le module commandes
// Remplace toute référence à ui.config.js
// ========================================

import { Button } from '../../src/components/ui/button/button.component.js';
import { Badge } from '../../src/components/ui/badge/badge.component.js';
import { COMMANDES_CONFIG } from './commandes.data.js';
import { AppHeader } from '../../src/components/ui/app-header/app-header.component.js';
import { DataTable } from '../../src/components/ui/datatable/datatable.component.js';
import { DataTableFilters } from '../../src/components/ui/datatable-filters/datatable-filters.component.js';
import { StatsCards } from '../../src/components/ui/stats-cards/stats-cards.component.js';
import { Timeline } from '../../src/components/ui/timeline/timeline.component.js';
import { DropdownList } from '../../src/components/ui/dropdown-list/dropdown-list.component.js';
import { SearchDropdown } from '../../src/components/ui/search-dropdown/search-dropdown.component.js';
import { Modal, modalManager } from '../../src/components/ui/modal/modal.component.js';
import Dialog from '../../src/components/ui/dialog/dialog.component.js';
import notify from '../../src/components/ui/notification/notification.component.js';

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
        backUrl: window.location.origin + '/Orixis-pwa/modules/home/home.html',
        user: userData,
        // Ajouter les classes pour les boutons
        buttonClasses: {
            back: 'btn on-dark btn-pill',
            logout: 'btn btn-danger btn-sm text-white',
            userSection: 'header-user-section'
        },
        onLogout: async () => {
            console.log('🔴 Bouton déconnexion cliqué !');  // AJOUTER CETTE LIGNE
            const confirme = await Dialog.confirm(
                'Voulez-vous vraiment vous déconnecter ?',
                'Déconnexion'
            );
            if (confirme) {
                localStorage.removeItem('sav_auth');
                // Utiliser un chemin relatif comme pour le bouton retour
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
// FACTORY : TIMELINE ORDRE (pour le détail)
// ========================================

export function createOrderTimeline(container, commande, options = {}) {
    // Configuration de la séquence des statuts
    const sequence = [
        'nouvelle',
        'preparation', 
        'terminee',
        'expediee',
        'receptionnee',
        'livree'
    ];
    
    // Mapping des dates
    const dateFields = {
        'nouvelle': 'dates.commande',
        'preparation': 'dates.preparationDebut',
        'terminee': 'dates.preparationFin',
        'expediee': 'dates.expeditionValidee',
        'receptionnee': 'dates.receptionValidee',
        'livree': 'dates.livraisonClient'
    };
    
    // Créer les items de la timeline
    const items = sequence.map(statutKey => {
        const statutConfig = COMMANDES_CONFIG.STATUTS[statutKey];
        const dateField = dateFields[statutKey];
        
        let status = 'pending';
        if (commande.statut === statutKey) {
            status = 'active';
        } else if (sequence.indexOf(commande.statut) > sequence.indexOf(statutKey)) {
            status = 'completed';
        }
        
        // Récupérer la date si elle existe
        let date = null;
        if (dateField) {
            const parts = dateField.split('.');
            let value = commande;
            for (const part of parts) {
                value = value?.[part];
            }
            if (value) {
                date = value.toDate ? value.toDate() : new Date(value);
            }
        }
        
        return {
            id: statutKey,
            label: statutConfig.label,
            icon: statutConfig.icon,
            status: status,
            date: date
        };
    });
    
    // Gérer le cas annulé
    if (commande.statut === 'annulee') {
        const indexAnnule = sequence.indexOf(commande.annulation?.etapeAuMomentAnnulation || 'nouvelle');
        items.forEach((item, index) => {
            if (index <= indexAnnule) {
                item.status = 'completed';
            } else {
                item.status = 'cancelled';
            }
        });
        
        // Ajouter l'étape annulée
        const annuleItem = {
            id: 'annulee',
            label: 'Annulée',
            icon: '❌',
            status: 'error',
            date: commande.annulation?.date?.toDate?.() || null
        };
        
        if (indexAnnule >= 0 && indexAnnule < items.length - 1) {
            items.splice(indexAnnule + 1, 0, annuleItem);
        } else {
            items.push(annuleItem);
        }
    }
    
    // Créer la timeline
    return new Timeline({
        container,
        items,
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
// FACTORY : BADGES DU MODULE
// ========================================

export function createBadge(text, options = {}) {
    return new Badge({
        text,
        size: 'table',  // Taille harmonisée pour les tableaux
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
    // Vérifier l'existence de chaque modal avant de l'enregistrer
    const modalsConfig = [
        { id: 'modalNouvelleCommande', options: { closeOnOverlayClick: false, closeOnEscape: true } },
        { id: 'modalDetailCommande', options: { closeOnOverlayClick: false, closeOnEscape: true } },
        { id: 'modalNouveauClient', options: { closeOnOverlayClick: false, closeOnEscape: true } },
        { id: 'modalNumerosSerie', options: { closeOnOverlayClick: false, closeOnEscape: true } }
    ];
    
    modalsConfig.forEach(({ id, options }) => {
        const modalElement = document.getElementById(id);
        if (modalElement) {
            modalManager.register(id, options);
        } else {
            console.warn(`⚠️ Modal "${id}" non trouvé, enregistrement ignoré`);
        }
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
    createOrderTimeline,
    createDropdown,
    createSearchDropdown,
    createButton,
    createBadge,
    
    // Configs
    BUTTON_CLASSES,
    HTML_TEMPLATES,
    registerCommandesModals,
    
    // Components directs (pour injection)
    Button,
    Badge,
    Modal,
    Dialog,
    notify,
    modalManager
};