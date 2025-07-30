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
        
        // Initialiser
        this.init();
    }
    
    /**
     * Initialisation
     */
    init() {
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
    // Container principal avec classe pour style
    this.elements.container.className = 'filters-container';
    
    // Créer un wrapper pour tout
    const wrapper = document.createElement('div');
    wrapper.className = 'filters-wrapper';
    
    // Ligne des filtres
    const filtersRow = document.createElement('div');
    filtersRow.className = 'filters-row';
    
    // Créer le formulaire
    const form = document.createElement('form');
    form.className = 'filters-form';
    form.id = `${this.id}-form`;
    form.onsubmit = (e) => e.preventDefault();
    
    // Ajouter chaque filtre
    this.config.filters.forEach(filterConfig => {
        const filterElement = this.createFilter(filterConfig);
        if (filterElement) {
            filtersRow.appendChild(filterElement);
        }
    });
    
    // Ajouter le bouton reset dans la même ligne
    if (this.config.resetButton && this.config.filters.length > 0) {
        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'btn-reset-filters';
        resetBtn.innerHTML = '🔄 Réinitialiser';
        resetBtn.onclick = () => this.reset();
        
        filtersRow.appendChild(resetBtn);
        this.elements.resetButton = resetBtn;
    }
    
    form.appendChild(filtersRow);
    wrapper.appendChild(form);
    
    // Vider et ajouter
    this.elements.container.innerHTML = '';
    this.elements.container.appendChild(wrapper);
    
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
        const input = document.createElement('input');
        input.type = 'search';
        input.placeholder = config.placeholder || 'Rechercher...';
        input.id = `${this.id}-${config.key}`;
        input.className = 'filter-search-input';
        
        // Si valeur par défaut
        if (config.defaultValue) {
            input.value = config.defaultValue;
        }
        
        // Gestion du debounce pour la recherche
        if (this.config.autoSubmit) {
            input.addEventListener('input', (e) => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.handleFilterChange();
                }, this.config.debounceDelay);
            });
        }
        
        // Icône de recherche
        const wrapper = document.createElement('div');
        wrapper.className = 'filter-search-wrapper';
        wrapper.innerHTML = `
            <span class="filter-search-icon">🔍</span>
        `;
        wrapper.insertBefore(input, wrapper.firstChild);
        
        return wrapper;
    }
    
    /**
     * Render Select
     */
    renderSelect(config) {
        const select = document.createElement('select');
        select.id = `${this.id}-${config.key}`;
        select.className = 'filter-select-input';
        
        // Ajouter les options
        if (config.options) {
            config.options.forEach(option => {
                const opt = document.createElement('option');
                
                if (typeof option === 'object') {
                    opt.value = option.value;
                    opt.textContent = option.label;
                    
                    // Sélection par défaut
                    if (config.defaultValue !== undefined && option.value === config.defaultValue) {
                        opt.selected = true;
                    }
                } else {
                    opt.value = option;
                    opt.textContent = option;
                    
                    if (config.defaultValue !== undefined && option === config.defaultValue) {
                        opt.selected = true;
                    }
                }
                
                select.appendChild(opt);
            });
        }
        
        return select;
    }
    
    /**
     * Render Date
     */
    renderDate(config) {
        const input = document.createElement('input');
        input.type = 'date';
        input.id = `${this.id}-${config.key}`;
        input.className = 'filter-date-input';
        
        if (config.defaultValue) {
            input.value = config.defaultValue;
        }
        
        return input;
    }
    
    /**
     * Render DateRange
     */
    renderDateRange(config) {
        const container = document.createElement('div');
        container.className = 'filter-daterange-container';
        
        // Date de début
        const startInput = document.createElement('input');
        startInput.type = 'date';
        startInput.className = 'filter-daterange-start';
        startInput.id = `${this.id}-${config.key}-start`;
        
        // Séparateur
        const separator = document.createElement('span');
        separator.className = 'filter-daterange-separator';
        separator.textContent = 'à';
        
        // Date de fin
        const endInput = document.createElement('input');
        endInput.type = 'date';
        endInput.className = 'filter-daterange-end';
        endInput.id = `${this.id}-${config.key}-end`;
        
        container.appendChild(startInput);
        container.appendChild(separator);
        container.appendChild(endInput);
        
        return container;
    }
    
    /**
     * Render Checkbox
     */
    renderCheckbox(config) {
        const container = document.createElement('div');
        container.className = 'filter-checkbox-group';
        
        if (config.options) {
            config.options.forEach((option, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'filter-checkbox';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `${this.id}-${config.key}-${index}`;
                checkbox.value = typeof option === 'object' ? option.value : option;
                
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = typeof option === 'object' ? option.label : option;
                
                wrapper.appendChild(checkbox);
                wrapper.appendChild(label);
                container.appendChild(wrapper);
            });
        }
        
        return container;
    }
    
    /**
     * Render Radio
     */
    renderRadio(config) {
        const container = document.createElement('div');
        container.className = 'filter-radio-group';
        
        if (config.options) {
            config.options.forEach((option, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'filter-radio';
                
                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `${this.id}-${config.key}`;
                radio.id = `${this.id}-${config.key}-${index}`;
                radio.value = typeof option === 'object' ? option.value : option;
                
                const label = document.createElement('label');
                label.htmlFor = radio.id;
                label.textContent = typeof option === 'object' ? option.label : option;
                
                wrapper.appendChild(radio);
                wrapper.appendChild(label);
                container.appendChild(wrapper);
            });
        }
        
        return container;
    }
    
    /**
     * Render Range
     */
    renderRange(config) {
        const container = document.createElement('div');
        container.className = 'filter-range-container';
        
        const input = document.createElement('input');
        input.type = 'range';
        input.min = config.min || 0;
        input.max = config.max || 100;
        input.step = config.step || 1;
        input.value = config.defaultValue || config.min || 0;
        
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'filter-range-value';
        valueDisplay.textContent = input.value;
        
        input.addEventListener('input', () => {
            valueDisplay.textContent = input.value;
        });
        
        container.appendChild(input);
        container.appendChild(valueDisplay);
        
        return container;
    }
    
    /**
     * Render Tags
     */
    renderTags(config) {
        const container = document.createElement('div');
        container.className = 'filter-tags-container';
        container.innerHTML = '<div class="filter-tags-input">Tags non implémenté</div>';
        return container;
    }
    
    /**
     * Render Button Group
     */
    renderButtonGroup(config) {
        const container = document.createElement('div');
        container.className = 'filter-buttongroup';
        
        if (config.options) {
            config.options.forEach(option => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'filter-buttongroup-btn';
                button.dataset.value = typeof option === 'object' ? option.value : option;
                button.textContent = typeof option === 'object' ? option.label : option;
                
                button.addEventListener('click', () => {
                    // Retirer active de tous
                    container.querySelectorAll('button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    // Ajouter active au cliqué
                    button.classList.add('active');
                    // Déclencher le changement
                    this.handleFilterChange();
                });
                
                container.appendChild(button);
            });
        }
        
        return container;
    }
    
    /**
     * Render Custom
     */
    renderCustom(config) {
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
        const input = element.querySelector('input');
        return input ? input.value.trim() : '';
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
    
    /**
     * Get Value DateRange
     */
    getValueDaterange(element) {
        const start = element.querySelector('.filter-daterange-start');
        const end = element.querySelector('.filter-daterange-end');
        
        if (start && end && (start.value || end.value)) {
            return {
                start: start.value,
                end: end.value
            };
        }
        return null;
    }
    
    /**
     * Get Value Checkbox
     */
    getValueCheckbox(element) {
        const checked = [];
        element.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
            checked.push(cb.value);
        });
        return checked.length > 0 ? checked : null;
    }
    
    /**
     * Get Value Radio
     */
    getValueRadio(element) {
        const checked = element.querySelector('input[type="radio"]:checked');
        return checked ? checked.value : null;
    }
    
    /**
     * Get Value Range
     */
    getValueRange(element) {
        const input = element.querySelector('input[type="range"]');
        return input ? parseFloat(input.value) : null;
    }
    
    /**
     * Get Value Tags
     */
    getValueTags(element) {
        // TODO: Implémenter
        return null;
    }
    
    /**
     * Get Value Button Group
     */
    getValueButtongroup(element) {
        const active = element.querySelector('.active');
        return active ? active.dataset.value : null;
    }
    
    /**
     * Get Value Custom
     */
    getValueCustom(element, config) {
        if (config.getValue) {
            return config.getValue(element);
        }
        return null;
    }
}