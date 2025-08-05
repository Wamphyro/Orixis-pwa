// ========================================
// DECOMPTE-SECU.CONFIG.JS - Configuration UI locale du module
// Chemin: modules/decompte-secu/decompte-secu.config.js
//
// DESCRIPTION:
// Configuration UI complète pour le module décomptes sécurité sociale
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

import { Button } from '../../src/components/ui/button/button.component.js';
import { Badge } from '../../src/components/ui/badge/badge.component.js';
import { AppHeader } from '../../src/components/ui/app-header/app-header.component.js';
import { DataTable } from '../../src/components/ui/datatable/datatable.component.js';
import { DataTableFilters } from '../../src/components/ui/datatable-filters/datatable-filters.component.js';
import { StatsCards } from '../../src/components/ui/stats-cards/stats-cards.component.js';
import { Timeline } from '../../src/components/ui/timeline/timeline.component.js';
import { DropdownList } from '../../src/components/ui/dropdown-list/dropdown-list.component.js';
import { SearchDropdown } from '../../src/components/ui/search-dropdown/search-dropdown.component.js';
import { Modal } from '../../src/components/ui/modal/modal.component.js';
import { modalManager } from '../../src/components/ui/modal/modal.component.js';
import { Dialog } from '../../src/components/ui/dialog/dialog.component.js';
import { notify } from '../../src/components/ui/notification/notification.component.js';
import { DropZone } from '../../src/components/ui/dropzone/dropzone.component.js';

// Import des modules DataTable
import { DataTableSort } from '../../src/components/ui/datatable/datatable.sort.js';
import { DataTableExport } from '../../src/components/ui/datatable/datatable.export.js';
import { DataTablePagination } from '../../src/components/ui/datatable/datatable.pagination.js';
import { DataTableResize } from '../../src/components/ui/datatable/datatable.resize.js';

// ========================================
// FACTORY : HEADER DU MODULE
// ========================================

export function createDecomptesSecuHeader(userData) {
    return new AppHeader({
        container: 'body',
        title: '🏥 Décomptes Sécurité Sociale',
        subtitle: 'Gestion des remboursements CPAM',
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

export function createDecomptesSecuTable(container, options = {}) {
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
            noData: 'Aucun décompte trouvé',
            loading: 'Chargement des décomptes...',
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

export function createDecomptesSecuFilters(container, filters, onFilter) {
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

export function createDecomptesSecuStatsCards(container, cards, onClick) {
    return new StatsCards({
        container,
        cards,
        animated: true,
        onClick
    });
}

// ========================================
// FACTORY : TIMELINE DÉCOMPTE
// ========================================

export function createDecompteSecuTimeline(container, items, options = {}) {
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

export function createDecompteSecuDropzone(container, options = {}) {
    return new DropZone({
        container,
        acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFiles: 10,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        showPreview: true,
        previewSize: 'medium',
        messages: {
            drop: '📄 Glissez vos décomptes CPAM ici',
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
        
        // Boutons spécifiques décomptes sécu
        newDecompte: {
            text: 'Nouveau décompte',
            variant: 'primary',
            pill: true,
            icon: '➕'
        },
        transmettreIA: {
            text: 'Analyser avec l\'IA',
            variant: 'info',
            icon: '🤖'
        },
        validerTraitement: {
            text: 'Valider le traitement',
            variant: 'success',
            icon: '✅'
        },
        calculerMontants: {
            text: 'Recalculer',
            variant: 'warning',
            icon: '🧮'
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
    
    // Template pour taux
    taux: (value) => `
        <span class="taux-value ${value === 100 ? 'taux-100' : ''}">
            ${value}%
        </span>
    `,
    
    // Template pour NSS
    nss: (value) => `
        <span class="nss-value">
            ${value}
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
    `,
    
    // Template pour régime
    regime: (regime) => {
        const config = {
            general: { icon: '🏥', label: 'Régime Général' },
            rsi: { icon: '🏪', label: 'RSI' },
            msa: { icon: '🌾', label: 'MSA' },
            special: { icon: '⭐', label: 'Régime Spécial' }
        }[regime] || { icon: '❓', label: regime };
        
        return `
            <span class="regime-secu">
                ${config.icon} ${config.label}
            </span>
        `;
    },
    
    // Template pour type d'acte
    typeActe: (type) => {
        const config = {
            consultation: { icon: '👨‍⚕️', label: 'Consultation' },
            pharmacie: { icon: '💊', label: 'Pharmacie' },
            analyses: { icon: '🔬', label: 'Analyses' },
            radiologie: { icon: '📷', label: 'Radiologie' },
            hospitalisation: { icon: '🏥', label: 'Hospitalisation' }
        }[type] || { icon: '📋', label: type };
        
        return `
            <span class="type-acte">
                ${config.icon} ${config.label}
            </span>
        `;
    }
};

// ========================================
// CONFIG : MODALES DU MODULE
// ========================================

export function registerDecomptesSecuModals() {
    const modalsConfig = [
        { id: 'modalNouveauDecompteSecu', options: { closeOnOverlayClick: false, closeOnEscape: true } },
        { id: 'modalDetailDecompteSecu', options: { closeOnOverlayClick: false, closeOnEscape: true } }
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
    createDecomptesSecuHeader,
    createDecomptesSecuTable,
    createDecomptesSecuFilters,
    createDecomptesSecuStatsCards,
    createDecompteSecuTimeline,
    createDropdown,
    createSearchDropdown,
    createDecompteSecuDropzone,
    createButton,
    createBadge,
    
    // Configs
    BUTTON_CLASSES,
    HTML_TEMPLATES,
    registerDecomptesSecuModals,
    
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
   - Adaptation pour décomptes sécu
   - Templates HTML spécifiques (taux, régime, type acte)
   - Communication par callbacks uniquement
   
   NOTES POUR REPRISES FUTURES:
   - Ce fichier ne doit JAMAIS importer de composants directement
   - Toujours passer par les factories
   - Les orchestrateurs utilisent config.createXXX()
   ======================================== */