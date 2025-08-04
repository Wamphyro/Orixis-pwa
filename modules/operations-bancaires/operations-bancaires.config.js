// ========================================
// OPERATIONS-BANCAIRES.CONFIG.JS - Configuration UI locale du module
// Chemin: modules/operations-bancaires/operations-bancaires.config.js
//
// DESCRIPTION:
// Configuration UI complète pour le module opérations bancaires
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

export function createOperationsHeader(userData) {
    return new AppHeader({
        container: 'body',
        title: '🏦 Opérations Bancaires',
        subtitle: 'Suivi des mouvements bancaires',
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

export function createOperationsTable(container, options = {}) {
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
            selection: true,  // Pour sélection multiple
            pagination: true
        },
        pagination: {
            itemsPerPage: 50,  // Plus d'opérations par page
            pageSizeOptions: [20, 50, 100, 200]
        },
        messages: {
            noData: 'Aucune opération trouvée',
            loading: 'Chargement des opérations...',
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

export function createOperationsFilters(container, filters, onFilter) {
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

export function createOperationsStatsCards(container, cards, onClick) {
    return new StatsCards({
        container,
        cards,
        animated: true,
        onClick
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
// FACTORY : DROPZONE IMPORT CSV
// ========================================

export function createImportDropzone(container, options = {}) {
    return new DropZone({
        container,
        acceptedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        maxFiles: 10,  // Multi-import jusqu'à 10 fichiers
        maxFileSize: 5 * 1024 * 1024, // 5MB par fichier
        multiple: true,  // Activer la sélection multiple
        showPreview: false,
        messages: {
            drop: '📊 Glissez vos relevés bancaires ici (jusqu\'à 10 fichiers)',
            browse: 'ou cliquez pour parcourir',
            typeError: 'Seuls les fichiers CSV et Excel sont acceptés',
            sizeError: 'Fichier trop volumineux (max 5MB)',
            maxFilesError: 'Maximum 10 fichiers à la fois'
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
        
        // Boutons spécifiques opérations
        importCSV: {
            text: 'Importer CSV',
            variant: 'primary',
            pill: true,
            icon: '📥'
        },
        categoriser: {
            text: 'Catégoriser',
            variant: 'info',
            icon: '🏷️'
        },
        rapprocher: {
            text: 'Pointer',
            variant: 'success',
            icon: '✓'
        },
        export: {
            text: 'Exporter',
            variant: 'secondary',
            icon: '📤'
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
    // Template pour montants avec couleur
    montant: (value) => {
        const montant = parseFloat(value) || 0;
        const couleur = montant >= 0 ? '#28a745' : '#dc3545';
        const signe = montant >= 0 ? '+' : '';
        
        return `
            <span class="montant-value" style="color: ${couleur}; font-weight: 600;">
                ${signe}${montant.toLocaleString('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                })}
            </span>
        `;
    },
    
    // Template pour type opération
    typeOperation: (type) => {
        const config = type === 'credit' ? 
            { icon: '➕', couleur: '#d1e7dd', label: 'Crédit' } : 
            { icon: '➖', couleur: '#f8d7da', label: 'Débit' };
        
        return `
            <span class="type-operation" style="background: ${config.couleur}; padding: 2px 8px; border-radius: 4px;">
                ${config.icon} ${config.label}
            </span>
        `;
    },
    
    // Template pour catégorie
    categorie: (categorie, icon = '📌') => `
        <span class="categorie-badge">
            ${icon} ${categorie}
        </span>
    `,
    
    // Template pour compte bancaire
    compteBancaire: (compte) => {
        if (!compte) return '-';
        return `
            <span class="compte-bancaire">
                🏦 ${compte.masque || compte}
            </span>
        `;
    },
    
    // Template pour checkbox
    checkbox: (id, checked = false) => `
        <input type="checkbox" 
               class="operation-checkbox" 
               data-id="${id}" 
               ${checked ? 'checked' : ''}>
    `
};

// ========================================
// CONFIG : MODALES DU MODULE
// ========================================

export function registerOperationsModals() {
    const modalsConfig = [
        { id: 'modalImportCSV', options: { closeOnOverlayClick: false, closeOnEscape: true } },
        { id: 'modalDetailOperation', options: { closeOnOverlayClick: true, closeOnEscape: true } },
        { id: 'modalCategoriser', options: { closeOnOverlayClick: false, closeOnEscape: true } }
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
    createOperationsHeader,
    createOperationsTable,
    createOperationsFilters,
    createOperationsStatsCards,
    createDropdown,
    createSearchDropdown,
    createImportDropzone,
    createButton,
    createBadge,
    
    // Configs
    BUTTON_CLASSES,
    HTML_TEMPLATES,
    registerOperationsModals,
    
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
   
   [03/02/2025] - Création basée sur decompte-mutuelle
   - Adaptation pour opérations bancaires
   - Ajout DropZone pour import CSV
   - Templates montants avec couleurs
   - Support sélection multiple
   
   NOTES POUR REPRISES FUTURES:
   - Ce fichier ne doit JAMAIS importer de composants directement
   - Toujours passer par les factories
   - Les orchestrateurs utilisent config.createXXX()
   ======================================== */