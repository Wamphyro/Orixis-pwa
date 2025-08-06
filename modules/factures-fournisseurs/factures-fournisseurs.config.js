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

// ========================================
// IMPORTS DIRECTS DES COMPOSANTS UI
// ========================================

// Composants de base
import { Button } from '../../src/components/ui/button/button.component.js';
import { Badge } from '../../src/components/ui/badge/badge.component.js';
import { AppHeader } from '../../src/components/ui/app-header/app-header.component.js';

// Composants de données
import { DataTable } from '../../src/components/ui/datatable/datatable.component.js';
import { DataTableFilters } from '../../src/components/ui/datatable-filters/datatable-filters.component.js';
import { StatsCards } from '../../src/components/ui/stats-cards/stats-cards.component.js';

// Composants d'affichage
import { Timeline } from '../../src/components/ui/timeline/timeline.component.js';

// Composants de sélection
import { DropdownList } from '../../src/components/ui/dropdown-list/dropdown-list.component.js';
import { SearchDropdown } from '../../src/components/ui/search-dropdown/search-dropdown.component.js';

// Composants de feedback
import { Modal, modalManager } from '../../src/components/ui/modal/modal.component.js';
import { Dialog } from '../../src/components/ui/dialog/dialog.component.js';
import { notify } from '../../src/components/ui/notification/notification.component.js';

// Composants d'upload
import { DropZone } from '../../src/components/ui/dropzone/dropzone.component.js';

// Modules DataTable
import { DataTableSort } from '../../src/components/ui/datatable/datatable.sort.js';
import { DataTableExport } from '../../src/components/ui/datatable/datatable.export.js';
import { DataTablePagination } from '../../src/components/ui/datatable/datatable.pagination.js';
import { DataTableResize } from '../../src/components/ui/datatable/datatable.resize.js';

// ========================================
// FACTORIES - Signatures d'origine préservées
// ========================================

export function createFacturesHeader(config) {
    return new AppHeader(config);
}

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

export function createFacturesFilters(container, filters, onFilter) {
    return new DataTableFilters({
        container,
        filters,
        DropdownClass: DropdownList,
        onFilter
    });
}

export function createFacturesStatsCards(container, cards, onClick) {
    return new StatsCards({
        container,
        cards,
        animated: true,
        onClick
    });
}

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

export function createFactureDropzone(container, options = {}) {
    return new DropZone({
        container,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFiles: 10,
        maxFileSize: 10 * 1024 * 1024,
        multiple: true,
        showPreview: true,
        previewSize: 'medium',
        messages: {
            drop: '📁 Glissez vos factures ici (jusqu\'à 10 fichiers)',
            browse: 'ou cliquez pour parcourir',
            typeError: 'Seuls les PDF et images (JPG, PNG) sont acceptés',
            sizeError: 'Fichier trop volumineux (max 10MB)',
            maxFilesError: 'Maximum 10 fichiers autorisés'
        },
        ...options
    });
}

export function createButton(config) {
    return new Button(config);
}

export function createBadge(text, options = {}) {
    return new Badge({
        text,
        size: 'table',
        ...options
    });
}

// ========================================
// CONFIG : TEMPLATES HTML
// ========================================

export const HTML_TEMPLATES = {
    montant: (value) => `
        <span class="montant-value">
            ${value.toLocaleString('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
            })}
        </span>
    `,
    
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
    
    statut: (config) => `
        <span class="statut-icon-wrapper">
            <span class="statut-icon">${config.icon}</span>
            <span class="statut-tooltip">${config.label}</span>
        </span>
    `,
    
    badge: (value, label, icon = '') => `
        <span class="badge badge-${value.replace(/_/g, '-')}">
            ${icon} ${label}
        </span>
    `,
    
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
    
    // Templates
    HTML_TEMPLATES,
    registerFacturesModals,
    
    // Components directs
    Button,
    Badge,
    Modal,
    Dialog,
    notify,
    modalManager,
    DropdownList
};