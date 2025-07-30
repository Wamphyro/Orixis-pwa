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
            resetButton: null,
            filters: {} // Stockage des éléments de chaque filtre
        };
        
        // Timer pour le debounce
        this.debounceTimer = null;
        
        // Définir les types de filtres disponibles
        this.filterTypes = {
            'search': this.renderSearch.bind(this),
            'select': this.renderSelect.bind(this),
            'date': this.renderDate.bind(this),
            'daterange': this.renderDateRange.bind(this),
            'checkbox': this.renderCheckbox.bind(this),
            'radio': this.renderRadio.bind(this),
            'range': this.renderRange.bind(this),
            'tags': this.renderTags.bind(this),
            'buttongroup': this.renderButtonGroup.bind(this),
            'custom': this.renderCustom.bind(this)
        };
        
        // Initialiser
        this.init();
    }
    
    /**
     * Initialisation
     */
    init() {
        // Vérifier le container
        if (typeof this.config.container === 'string') {
            this.elements.container = document.querySelector(this.config.container);
        } else {
            this.elements.container = this.config.container;
        }
        
        if (!this.elements.container) {
            console.error('DataTableFilters: Container non trouvé');
            return;
        }
        
        // Créer la structure
        this.render();
        
        // Initialiser les valeurs par défaut
        this.initDefaultValues();
        
        // Attacher les événements globaux
        this.attachGlobalEvents();
        
        console.log('✅ DataTableFilters initialisé');
    }
    
    /**
     * Créer la structure HTML
     */
    render() {
        // Créer le formulaire principal
        const form = document.createElement('form');
        form.className = 'filters-form';
        form.id = `${this.id}-form`;
        form.onsubmit = (e) => e.preventDefault(); // Empêcher la soumission
        
        // Créer la grille de filtres
        const grid = document.createElement('div');
        grid.className = 'filters-grid';
        
        // Ajouter chaque filtre
        this.config.filters.forEach(filterConfig => {
            const filterElement = this.createFilter(filterConfig);
            if (filterElement) {
                grid.appendChild(filterElement);
            }
        });
        
        form.appendChild(grid);
        
        // Ajouter les actions (bouton reset)
        if (this.config.resetButton && this.config.filters.length > 0) {
            const actions = document.createElement('div');
            actions.className = 'filters-actions';
            
            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'btn-reset-filters';
            resetBtn.innerHTML = '🔄 Réinitialiser';
            resetBtn.onclick = () => this.reset();
            
            actions.appendChild(resetBtn);
            form.appendChild(actions);
            
            this.elements.resetButton = resetBtn;
        }
        
        // Vider le container et ajouter le form
        this.elements.container.innerHTML = '';
        this.elements.container.appendChild(form);
        
        this.elements.form = form;
    }
    
    /**
     * Créer un filtre selon son type
     */
    createFilter(filterConfig) {
        const { type, key, label, ...options } = filterConfig;
        
        // Vérifier que le type existe
        if (!this.filterTypes[type]) {
            console.warn(`DataTableFilters: Type de filtre inconnu "${type}"`);
            return null;
        }
        
        // Créer le groupe de filtre
        const group = document.createElement('div');
        group.className = `filter-group filter-${type}`;
        group.dataset.filterKey = key;
        
        // Ajouter le label si présent
        if (label) {
            const labelElement = document.createElement('label');
            labelElement.textContent = label;
            labelElement.htmlFor = `${this.id}-${key}`;
            group.appendChild(labelElement);
        }
        
        // Créer le filtre spécifique
        const filterElement = this.filterTypes[type]({
            key,
            label,
            ...options
        });
        
        if (filterElement) {
            group.appendChild(filterElement);
            
            // Stocker la référence
            this.elements.filters[key] = {
                group,
                element: filterElement,
                type,
                config: filterConfig
            };
        }
        
        return group;
    }
    
    /**
     * Initialiser les valeurs par défaut
     */
    initDefaultValues() {
        this.config.filters.forEach(filter => {
            if (filter.defaultValue !== undefined) {
                this.values[filter.key] = filter.defaultValue;
            }
        });
    }
    
    /**
     * Attacher les événements globaux
     */
    attachGlobalEvents() {
        // Écouter les changements de formulaire si autoSubmit
        if (this.config.autoSubmit && this.elements.form) {
            this.elements.form.addEventListener('change', (e) => {
                // Sauf pour les input text (ils ont leur propre debounce)
                if (e.target.type !== 'text' && e.target.type !== 'search') {
                    this.handleFilterChange();
                }
            });
        }
    }
    
    /**
     * Gérer le changement d'un filtre
     */
    handleFilterChange() {
        // Collecter toutes les valeurs
        this.collectValues();
        
        // Déclencher le callback
        this.triggerFilter();
    }
    
    /**
     * Collecter les valeurs de tous les filtres
     */
    collectValues() {
        const newValues = {};
        
        Object.entries(this.elements.filters).forEach(([key, filterData]) => {
            const { element, type, config } = filterData;
            
            // Méthode spécifique par type pour récupérer la valeur
            const getValue = this[`getValue${type.charAt(0).toUpperCase() + type.slice(1)}`];
            
            if (getValue) {
                const value = getValue.call(this, element, config);
                if (value !== undefined && value !== null && value !== '') {
                    newValues[key] = value;
                }
            }
        });
        
        this.values = newValues;
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
        // Réinitialiser les valeurs
        this.values = {};
        
        // Réinitialiser l'UI
        if (this.elements.form) {
            this.elements.form.reset();
        }
        
        // Réinitialiser les valeurs par défaut
        this.initDefaultValues();
        
        // Déclencher le callback
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
    
    /**
     * Définir une valeur programmatiquement
     */
    setValue(key, value) {
        if (this.elements.filters[key]) {
            this.values[key] = value;
            // TODO: Mettre à jour l'UI selon le type
            this.triggerFilter();
        }
    }
    
    /**
     * Activer/désactiver un filtre
     */
    setEnabled(key, enabled) {
        if (this.elements.filters[key]) {
            const { group } = this.elements.filters[key];
            if (enabled) {
                group.classList.remove('disabled');
            } else {
                group.classList.add('disabled');
            }
        }
    }
    
    /**
     * Détruire le composant
     */
    destroy() {
        // Nettoyer les timers
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // Vider le container
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
        
        // Réinitialiser
        this.values = {};
        this.elements = {
            container: null,
            form: null,
            resetButton: null,
            filters: {}
        };
    }
    
    // ========================================
    // MÉTHODES DE RENDU PAR TYPE
    // ========================================
    
    /**
     * Render Search
     */
    renderSearch(config) {
        // TODO: Implémenter
        const input = document.createElement('input');
        input.type = 'search';
        input.placeholder = config.placeholder || 'Rechercher...';
        input.id = `${this.id}-${config.key}`;
        return input;
    }
    
    /**
     * Render Select
     */
    renderSelect(config) {
        // TODO: Implémenter
        const select = document.createElement('select');
        select.id = `${this.id}-${config.key}`;
        return select;
    }
    
    /**
     * Render Date
     */
    renderDate(config) {
        // TODO: Implémenter
        const input = document.createElement('input');
        input.type = 'date';
        input.id = `${this.id}-${config.key}`;
        return input;
    }
    
    /**
     * Render DateRange
     */
    renderDateRange(config) {
        // TODO: Implémenter
        const container = document.createElement('div');
        container.className = 'filter-daterange-container';
        return container;
    }
    
    /**
     * Render Checkbox
     */
    renderCheckbox(config) {
        // TODO: Implémenter
        const container = document.createElement('div');
        container.className = 'filter-checkbox-group';
        return container;
    }
    
    /**
     * Render Radio
     */
    renderRadio(config) {
        // TODO: Implémenter
        const container = document.createElement('div');
        container.className = 'filter-radio-group';
        return container;
    }
    
    /**
     * Render Range
     */
    renderRange(config) {
        // TODO: Implémenter
        const container = document.createElement('div');
        container.className = 'filter-range-container';
        return container;
    }
    
    /**
     * Render Tags
     */
    renderTags(config) {
        // TODO: Implémenter
        const container = document.createElement('div');
        container.className = 'filter-tags-container';
        return container;
    }
    
    /**
     * Render Button Group
     */
    renderButtonGroup(config) {
        // TODO: Implémenter
        const container = document.createElement('div');
        container.className = 'filter-buttongroup';
        return container;
    }
    
    /**
     * Render Custom
     */
    renderCustom(config) {
        // TODO: Implémenter
        if (config.render) {
            const temp = document.createElement('div');
            temp.innerHTML = config.render();
            return temp.firstChild;
        }
        return null;
    }
    
    // ========================================
    // MÉTHODES POUR RÉCUPÉRER LES VALEURS
    // ========================================
    
    /**
     * Get Value Search
     */
    getValueSearch(element) {
        return element.value.trim();
    }
    
    /**
     * Get Value Select
     */
    getValueSelect(element) {
        return element.value;
    }
    
    /**
     * Get Value Date
     */
    getValueDate(element) {
        return element.value;
    }
    
    // TODO: Implémenter les autres getValueXXX
}