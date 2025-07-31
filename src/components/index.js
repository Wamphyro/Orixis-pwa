// ========================================
// INDEX.JS - Exports centralisés des composants UI
// Chemin: src/components/index.js
//
// MODIFIÉ le 01/02/2025:
// - Suppression de l'export generateId
// - Tous les composants sont maintenant 100% autonomes
// ========================================

// ========================================
// COMPOSANTS UI AUTONOMES
// ========================================

// DataTable et modules associés
export { DataTable } from './ui/datatable/datatable.component.js';
export { DataTableSort } from './ui/datatable/datatable.sort.js';
export { DataTableExport } from './ui/datatable/datatable.export.js';
export { DataTablePagination } from './ui/datatable/datatable.pagination.js';
export { DataTableResize } from './ui/datatable/datatable.resize.js';

// Filtres pour DataTable (accepte DropdownList via config)
export { DataTableFilters } from './ui/datatable-filters/datatable-filters.component.js';

// Composants de formulaire
export { DropdownList } from './ui/dropdown-list/dropdown-list.component.js';
export { SearchDropdown } from './ui/search-dropdown/search-dropdown.component.js';
export { Numpad } from './ui/numpad/numpad.component.js';

// Composants de feedback
export { Modal } from './ui/modal/modal.component.js';
export { Dialog } from './ui/dialog/dialog.component.js';
export { Notification } from './ui/notification/notification.component.js';

// Composants de visualisation
export { StatsCards } from './ui/stats-cards/stats-cards.component.js';
export { Timeline } from './ui/timeline/timeline.component.js';
export { Stepper } from './ui/stepper/stepper.component.js';

// Composants de layout
export { AppHeader } from './ui/app-header/app-header.component.js';

// ========================================
// UTILITAIRES (si nécessaire dans le futur)
// ========================================

// ❌ SUPPRIMÉ: export { generateId } from './utils/helpers.js';

// Si des utilitaires sont vraiment nécessaires pour plusieurs endroits,
// ils peuvent être ajoutés ici, mais l'objectif est l'autonomie maximale

// ========================================
// HELPERS DE FORMAT (utilisés par plusieurs modules)
// ========================================

export function formatDate(date, format = 'DD/MM/YYYY') {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    
    const formats = {
        'DD/MM/YYYY': () => {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        },
        'YYYY-MM-DD': () => {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${year}-${month}-${day}`;
        },
        'DD/MM/YYYY HH:mm': () => {
            const date = formats['DD/MM/YYYY']();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${date} ${hours}:${minutes}`;
        }
    };
    
    return formats[format] ? formats[format]() : d.toString();
}

export function formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

export function formatNumber(number, decimals = 0) {
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
}

// ========================================
// PATTERN D'UTILISATION RECOMMANDÉ
// ========================================

/*
EXEMPLE D'ORCHESTRATION:

import { DataTable, DataTableFilters, DropdownList } from './index.js';

// L'orchestrateur injecte les dépendances
const filters = new DataTableFilters({
    container: '.filters',
    DropdownClass: DropdownList,  // Injection
    filters: [...]
});

const table = new DataTable({
    container: '.table'
});

// L'orchestrateur connecte les composants
filters.onFilter = (values) => {
    table.setData(filterData(values));
};
*/