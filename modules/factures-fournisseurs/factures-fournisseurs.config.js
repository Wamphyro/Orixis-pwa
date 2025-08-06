// ========================================
// FACTURES-FOURNISSEURS.CONFIG.JS - Configuration UI locale du module
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.config.js
//
// DESCRIPTION:
// Factories simples pour créer tous les composants UI
// AUCUNE décision n'est prise ici - tout est pass-through
// L'orchestrateur (main.js) décide de TOUT
//
// ARCHITECTURE:
// - Ce fichier = simple pont vers les composants
// - main.js = toutes les décisions et configurations
// - Communication uniquement par callbacks
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
// FACTORIES SIMPLES - AUCUNE DÉCISION
// Tout est pass-through vers les composants
// ========================================

export function createFacturesHeader(config) {
    return new AppHeader(config);
}

export function createFacturesTable(config) {
    return new DataTable(config);
}

export function createFacturesFilters(config) {
    return new DataTableFilters(config);
}

export function createFacturesStatsCards(config) {
    return new StatsCards(config);
}

export function createFactureTimeline(config) {
    return new Timeline(config);
}

export function createDropdown(config) {
    return new DropdownList(config);
}

export function createSearchDropdown(config) {
    return new SearchDropdown(config);
}

export function createFactureDropzone(config) {
    return new DropZone(config);
}

export function createButton(config) {
    return new Button(config);
}

export function createBadge(config) {
    return new Badge(config);
}

// ========================================
// EXPORTS DE MODULES (pour main.js)
// ========================================

export const modules = {
    DataTableSort,
    DataTableExport,
    DataTablePagination,
    DataTableResize
};

// ========================================
// CONFIG : TEMPLATES HTML
// Les templates restent ici car ce sont des helpers, pas des composants
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
// HELPER : ENREGISTREMENT DES MODALES
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
        }
    });
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    // Factories simples
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
    
    // Modules DataTable
    modules,
    
    // Templates HTML
    HTML_TEMPLATES,
    
    // Helper
    registerFacturesModals,
    
    // Components directs (pour utilisation dans main.js)
    Dialog,
    notify,
    modalManager,
    DropdownList  // Pour passer aux filtres
};