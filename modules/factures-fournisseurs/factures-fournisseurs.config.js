// ========================================
// FACTURES-FOURNISSEURS.CONFIG.JS - Configuration UI locale du module
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.config.js
//
// DESCRIPTION:
// Configuration UI complète pour le module factures fournisseurs
// Factories pour créer tous les composants UI
// AUCUN composant n'importe un autre composant
//
// ARCHITECTURE:
// - Ce fichier crée les factories pour tous les composants
// - Les orchestrateurs utiliseront ces factories
// - Communication uniquement par callbacks
//
// DÉPENDANCES:
// - Import depuis components/index.js uniquement
// - Aucun import direct de composants
// ========================================

import { 
    Button,
    Badge,
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
    notify,
    DropZone
} from '../../src/components/index.js';

// Import des modules DataTable
import { DataTableSort } from '../../src/components/ui/datatable/datatable.sort.js';
import { DataTableExport } from '../../src/components/ui/datatable/datatable.export.js';
import { DataTablePagination } from '../../src/components/ui/datatable/datatable.pagination.js';
import { DataTableResize } from '../../src/components/ui/datatable/datatable.resize.js';

// ========================================
// FACTORY : HEADER DU MODULE
// ========================================

export function createFacturesHeader(userData) {
    return new AppHeader({
        container: 'body',
        title: '📑 Factures Fournisseurs',
        subtitle: 'Gestion des factures à payer',
        backUrl: window.location.origin + '/Orixis-pwa/modules/home/home.html',
        user: userData,
        // Classes pour les boutons
        buttonClasses: {
            back: 'btn on-dark btn-pill',
            logout: 'btn btn-danger btn-sm text-white',
            userSection: 'header-user-section'
        },
        onLogout: async () => {
            console.log('🔴 Bouton déconnexion cliqué !');
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

export function createFacturesTable(container, options = {}) {
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
            noData: 'Aucune facture trouvée',
            loading: 'Chargement des factures...',
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

export function createFacturesFilters(container, filters, onFilter) {
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

export function createFacturesStatsCards(container, cards, onClick) {
    return new StatsCards({
        container,
        cards,
        animated: true,
        onClick
    });
}

// ========================================
// FACTORY : TIMELINE FACTURE
// ========================================

export function createFactureTimeline(container, items, options = {}) {
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
// FACTORY : DROPZONE DOCUMENTS
// ========================================

export function createFactureDropzone(container, options = {}) {
    return new DropZone({
        container,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFiles: 10,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        showPreview: true,
        previewSize: 'medium',
        messages: {
            drop: '📁 Glissez vos factures ici',
            browse: 'ou cliquez pour parcourir',
            typeError: 'Seuls les PDF et images (JPG, PNG) sont acceptés',
            sizeError: 'Fichier trop volumineux (max 10MB)',
            maxFilesError: 'Maximum 10 fichiers autorisés'
        },
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
        
        // Boutons spécifiques factures
        newFacture: {
            text: 'Nouvelle facture',
            variant: 'primary',
            pill: true,
            icon: '➕'
        },
        marquerPayee: {
            text: 'Marquer comme payée',
            variant: 'success',
            icon: '💰'
        },
        pointer: {
            text: 'Pointer',
            variant: 'info',
            icon: '🔍'
        },
        enRetard: {
            text: 'En retard',
            variant: 'warning',
            icon: '⚠️'
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
        size: 'table',
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
    // Template pour montants
    montant: (value) => `
        <span class="montant-value">
            ${value.toLocaleString('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
            })}
        </span>
    `,
    
    // Template pour fournisseur
    fournisseur: (fournisseur) => `
        <div class="fournisseur-info">
            <span class="fournisseur-nom">${fournisseur.nom || '-'}</span>
            ${fournisseur.categorie ? `
                <span class="fournisseur-categorie text-muted">
                    (${fournisseur.categorie})
                </span>
            ` : ''}
        </div>
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
    `,
    
    // Template pour échéance
    echeance: (date, statut) => {
        if (!date) return '-';
        
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        const aujourd = new Date();
        const diff = Math.floor((dateObj - aujourd) / (1000 * 60 * 60 * 24));
        
        let classe = '';
        let texte = dateObj.toLocaleDateString('fr-FR');
        
        if (statut === 'a_payer') {
            if (diff < 0) {
                classe = 'echeance-depassee';
                texte += ` (${Math.abs(diff)} jours de retard)`;
            } else if (diff <= 7) {
                classe = 'echeance-proche';
                texte += ` (dans ${diff} jours)`;
            }
        }
        
        return `<span class="echeance ${classe}">${texte}</span>`;
    }
};

// ========================================
// CONFIG : MODALES DU MODULE
// ========================================

export function registerFacturesModals() {
    const modalsConfig = [
        { id: 'modalNouvelleFacture', options: { closeOnOverlayClick: false, closeOnEscape: true } },
        { id: 'modalDetailFacture', options: { closeOnOverlayClick: false, closeOnEscape: true } }
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
    createFacturesHeader,
    createFacturesTable,
    createFacturesFilters,
    createFacturesStatsCards,
    createFactureTimeline,
    createDropdown,
    createSearchDropdown,
    createFactureDropzone,
    createButton,
    createBadge,
    
    // Configs
    BUTTON_CLASSES,
    HTML_TEMPLATES,
    registerFacturesModals,
    
    // Components directs (pour injection)
    Button,
    Badge,
    Modal,
    Dialog,
    notify,
    modalManager
};

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création initiale
   - Architecture IoC stricte respectée
   - Aucun composant n'importe un autre
   - Toutes les factories créées
   - Communication par callbacks uniquement
   
   NOTES POUR REPRISES FUTURES:
   - Ce fichier ne doit JAMAIS importer de composants directement
   - Toujours passer par les factories
   - Les orchestrateurs utilisent config.createXXX()
   ======================================== */