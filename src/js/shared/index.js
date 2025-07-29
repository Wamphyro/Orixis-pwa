// ========================================
// INDEX.JS - Point d'entrée centralisé pour shared
// ========================================
// Chemin: src/js/shared/index.js
//
// MODIFICATIONS:
// [28/01/2025] - Ajout de l'export SearchDropdown
// [29/01/2025] - Ajout de l'export DataTableFilters
// ========================================

// ========================================
// COMPOSANTS UI
// ========================================

// Dialog (remplace alert, confirm, prompt)
import DialogComponent from './ui/dialog.component.js';
export const Dialog = DialogComponent;

// Notifications toast
import { notify } from './ui/notification.component.js';
export { notify };

// Table
import { DataTable } from './ui/datatable/datatable.component.js';
export { DataTable };

// Filtres pour DataTable (AJOUTER)
import { DataTableFilters } from './ui/datatable-filters.component.js';
export { DataTableFilters };

// Modal (déjà existant - à déplacer dans ui/)
import { 
    Modal, 
    ModalManager, 
    modalManager, 
    confirmerAction 
} from './ui/modal.component.js';

export { 
    Modal, 
    ModalManager, 
    modalManager, 
    confirmerAction 
};

// Timeline
import Timeline, { createTimeline, createOrderTimeline } from './ui/timeline.component.js';
export { Timeline, createTimeline, createOrderTimeline };

// Search Dropdown
import SearchDropdown from './ui/search-dropdown.component.js';
export { SearchDropdown };

// ... reste du fichier inchangé ...

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    // UI Components
    Dialog: Dialog,
    notify: notify,
    Modal: Modal,
    modalManager: modalManager,
    confirmerAction: confirmerAction,
    Timeline: Timeline,
    createTimeline: createTimeline,
    createOrderTimeline: createOrderTimeline,
    SearchDropdown: SearchDropdown,
    DataTable,
    DataTableFilters,  // AJOUTER
    
    // Utils
    formatDate,
    formatMoney,
    isValidEmail,
    isValidPhone,
    debounce,
    deepClone,
    generateId,
    capitalize,
    truncate,
    storage,
    queryParams,
    sleep,
    retry
};

// ========================================
// HISTORIQUE DES DIFFICULTÉS
//
// [28/01/2025] - Ajout SearchDropdown
// - Import et export du composant SearchDropdown
// - Ajouté dans l'export par défaut pour cohérence
//
// [29/01/2025] - Ajout DataTableFilters
// - Import et export du composant DataTableFilters
// - Composant de filtres réutilisable pour DataTable
//
// NOTES POUR REPRISES FUTURES:
// - Tous les composants UI sont dans ./ui/
// - Les utils sont directement dans ce fichier
// - Toujours exporter à la fois en named export et dans le default
// ========================================