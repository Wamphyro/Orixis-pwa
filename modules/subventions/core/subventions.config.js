// ========================================
// SUBVENTIONS.CONFIG.JS - Configuration UI locale du module
// Chemin: modules/subventions/core/subventions.config.js
// ========================================

// ========================================
// IMPORTS DIRECTS DES COMPOSANTS UI
// ========================================

// Composants de base
import { Button } from '../../../src/components/ui/button/button.component.js';
import { Badge } from '../../../src/components/ui/badge/badge.component.js';
import { AppHeader } from '../../../src/components/ui/app-header/app-header.component.js';

// Composants de données
import { DataTable } from '../../../src/components/ui/datatable/datatable.component.js';
import { DataTableFilters } from '../../../src/components/ui/datatable-filters/datatable-filters.component.js';
import { StatsCards } from '../../../src/components/ui/stats-cards/stats-cards.component.js';

// Composants d'affichage
import { Timeline } from '../../../src/components/ui/timeline/timeline.component.js';

// Composants de sélection
import { DropdownList } from '../../../src/components/ui/dropdown-list/dropdown-list.component.js';
import { SearchDropdown } from '../../../src/components/ui/search-dropdown/search-dropdown.component.js';

// Composants de feedback
import { Modal, modalManager } from '../../../src/components/ui/modal/modal.component.js';
import { Dialog } from '../../../src/components/ui/dialog/dialog.component.js';
import { notify } from '../../../src/components/ui/notification/notification.component.js';

// Composants d'upload
import { DropZone } from '../../../src/components/ui/dropzone/dropzone.component.js';

// Modules DataTable
import { DataTableSort } from '../../../src/components/ui/datatable/datatable.sort.js';
import { DataTableExport } from '../../../src/components/ui/datatable/datatable.export.js';
import { DataTablePagination } from '../../../src/components/ui/datatable/datatable.pagination.js';
import { DataTableResize } from '../../../src/components/ui/datatable/datatable.resize.js';

// Composants spécifiques subventions
import { ProgressTimeline } from '../../../src/components/ui/progress-timeline/progress-timeline.component.js';
import { ProgressOverview } from '../../../src/components/ui/progress-overview/progress-overview.component.js';
import { DelayTracker } from '../../../src/components/ui/delay-tracker/delay-tracker.component.js';

// ========================================
// FACTORIES - Signatures préservées
// ========================================

export function createSubventionsHeader(config) {
    return new AppHeader(config);
}

export function createSubventionsTable(container, options = {}) {
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
            noData: 'Aucun dossier trouvé',
            loading: 'Chargement des dossiers...',
            itemsPerPage: 'Éléments par page',
            page: 'Page',
            of: 'sur',
            items: 'éléments'
        },
        ...options
    });
}

export function createSubventionsFilters(container, filters, onFilter) {
    return new DataTableFilters({
        container,
        filters,
        DropdownClass: DropdownList,
        onFilter
    });
}

export function createSubventionsStatsCards(container, cards, onClick) {
    return new StatsCards({
        container,
        cards,
        animated: true,
        onClick
    });
}

export function createProgressTimeline(config) {
    return new ProgressTimeline(config);
}

export function createProgressOverview(config) {
    return new ProgressOverview(config);
}

export function createDelayTracker(config) {
    return new DelayTracker(config);
}

export function createDropdown(container, options) {
    return new DropdownList({
        container,
        ...options
    });
}

export function createSearchDropdown(container, options) {
    // COMME DANS COMMANDES - Un seul objet config
    const searchDropdown = new SearchDropdown({
        container: container,
        minLength: options.minChars || 2,
        noResultsText: 'Aucun résultat trouvé',
        loadingText: 'Recherche en cours...',
        placeholder: options.placeholder,
        onSearch: options.searchFunction || options.onSearch,  // Support both names
        onSelect: options.onSelect,
        renderItem: options.displayFormat || options.renderItem,  // Support both names
        debounceTime: options.debounceTime || 300
    });
    
    // Initialiser le composant
    searchDropdown.init();
    
    return searchDropdown;
}

export function createSubventionsDropzone(container, options = {}) {
    return new DropZone({
        container,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFiles: 10,
        maxFileSize: 10 * 1024 * 1024,
        multiple: true,
        showPreview: true,
        previewSize: 'medium',
        messages: {
            drop: '📁 Glissez vos documents ici (jusqu\'à 10 fichiers)',
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
    patient: (patient) => `
        <div class="patient-info">
            <span class="patient-nom">${patient.nom} ${patient.prenom}</span>
            <span class="patient-telephone text-muted">${patient.telephone || '-'}</span>
        </div>
    `,
    
    statut: (statut, label) => `
        <span class="badge badge-${statut.replace(/_/g, '-')}">
            ${label}
        </span>
    `,
    
    progression: (mdph, agefiph) => `
        <div class="progression-double">
            <div class="progression-item">
                <span class="label">MDPH:</span>
                <div class="progress-bar mini">
                    <div class="progress-fill" style="width: ${mdph}%"></div>
                </div>
                <span class="value">${mdph}%</span>
            </div>
            <div class="progression-item">
                <span class="label">AGEF:</span>
                <div class="progress-bar mini">
                    <div class="progress-fill agefiph" style="width: ${agefiph}%"></div>
                </div>
                <span class="value">${agefiph}%</span>
            </div>
        </div>
    `,
    
    montant: (value) => `
        <span class="montant-value">
            ${value.toLocaleString('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
            })}
        </span>
    `
};

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    // Factories
    createSubventionsHeader,
    createSubventionsTable,
    createSubventionsFilters,
    createSubventionsStatsCards,
    createProgressTimeline,
    createProgressOverview,
    createDelayTracker,
    createDropdown,
    createSearchDropdown,
    createSubventionsDropzone,
    createButton,
    createBadge,
    
    // Templates
    HTML_TEMPLATES,
    
    // Components directs
    Button,
    Badge,
    Modal,
    Dialog,
    notify,
    modalManager,
    DropdownList,
    DataTable,
    StatsCards,
    ProgressTimeline,
    ProgressOverview,
    DelayTracker
};