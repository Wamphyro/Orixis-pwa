// ========================================
// SUBVENTIONS.CONFIG.JS - Configuration UI locale du module
// Chemin: modules/subventions/core/subventions.config.js
// ========================================

// ========================================
// IMPORTS DIRECTS DES COMPOSANTS UI (COPIÉ DE FACTURES)
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

// Composants progress (spécifiques subventions)
import { ProgressTimeline } from '../../../src/components/ui/progress-timeline/progress-timeline.component.js';
import { ProgressOverview } from '../../../src/components/ui/progress-overview/progress-overview.component.js';
import { DelayTracker } from '../../../src/components/ui/delay-tracker/delay-tracker.component.js';

// ========================================
// FACTORIES - EXACTEMENT COMME FACTURES
// ========================================

export function createSubventionsHeader(config) {
    return new AppHeader(config);
}

// ========================================
// EXPORT PAR DÉFAUT - COMME FACTURES
// ========================================

export default {
    // Factories
    createSubventionsHeader,
    
    // Components directs
    Button,
    Badge,
    Modal,
    Dialog,
    notify,
    modalManager,
    DropdownList,
    SearchDropdown,
    DropZone,
    DataTable,
    DataTableFilters,
    StatsCards,
    Timeline,
    ProgressTimeline,
    ProgressOverview,
    DelayTracker
};