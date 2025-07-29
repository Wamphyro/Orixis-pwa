// ========================================
// DATATABLE-FILTERS.COMPONENT.JS - Composant de filtres pour DataTable
// Chemin: src/js/shared/ui/datatable-filters.component.js
//
// DESCRIPTION:
// Composant indépendant pour créer des filtres configurables
// Compatible avec DataTable mais utilisable seul
//
// TYPES SUPPORTÉS:
// - search: Recherche textuelle
// - select: Liste déroulante
// - daterange: Sélection de période
// - checkbox: Cases à cocher multiples
// (plus à venir...)
// ========================================

import { generateId } from '../index.js';

export class DataTableFilters {
    constructor(config) {
        this.id = generateId('filters');
        
        // Configuration par défaut
        this.config = {
            container: null,
            filters: [],
            autoSubmit: true,  // Filtrer automatiquement au changement
            debounceDelay: 300, // Délai pour la recherche (ms)
            onFilter: null,     // Callback quand les filtres changent
            resetButton: true,  // Afficher le bouton reset
            ...config
        };
        
        // État des filtres
        this.values = {};
        
        // Éléments DOM
        this.elements = {
            container: null,
            form: null,
            resetButton: null
        };
        
        // Timer pour le debounce
        this.debounceTimer = null;
        
        // Initialiser
        this.init();
    }
    
    /**
     * Initialisation
     */
    init() {
        // TODO: Implémenter
        console.log('DataTableFilters initialisé avec config:', this.config);
    }
    
    /**
     * Obtenir les valeurs actuelles des filtres
     */
    getValues() {
        return { ...this.values };
    }
    
    /**
     * Réinitialiser les filtres
     */
    reset() {
        this.values = {};
        // TODO: Réinitialiser l'UI
        this.triggerFilter();
    }
    
    /**
     * Déclencher le callback de filtre
     */
    triggerFilter() {
        if (this.config.onFilter) {
            this.config.onFilter(this.getValues());
        }
    }
}