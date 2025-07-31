// ========================================
// DATATABLE-FILTERS.COMPONENT.JS - Composant de filtres pour DataTable
// Chemin: src/js/shared/ui/datatable-filters.component.js
//
// DESCRIPTION:
// Composant indépendant pour créer des filtres configurables
// Compatible avec DataTable mais utilisable seul
//
// MODIFIÉ le 01/02/2025:
// - Remplacement de TOUS les selects par DropdownList
// - Extraction automatique des icônes depuis les labels
// - Activation de la recherche sur tous les dropdowns
//
// MODIFIÉ le 01/02/2025 v2:
// - Suppression de l'import de generateId et DropdownList
// - DropdownList passé via config par l'orchestrateur
// - 100% autonome
//
// TYPES SUPPORTÉS:
// - search: Recherche textuelle
// - select: Liste déroulante (utilise DropdownList)
// - daterange: Sélection de période
// - checkbox: Cases à cocher multiples
// (plus à venir...)
// ========================================

export class DataTableFilters {
    constructor(config) {
        // ✅ MODIFIÉ: Génération d'ID autonome
        this.id = 'filters-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Configuration par défaut
        this.config = {
            container: null,
            filters: [],
            autoSubmit: true,  // Filtrer automatiquement au changement
            debounceDelay: 300, // Délai pour la recherche (ms)
            onFilter: null,     // Callback quand les filtres changent
            resetButton: true,  // Afficher le bouton reset
            
            // ✅ NOUVEAU: Classe DropdownList injectée par l'orchestrateur
            DropdownClass: null,
            
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
        
        // Stockage des instances DropdownList
        this.dropdownInstances = [];
        
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
        
        console.log('✅ DataTableFilters initialisé' + (this.config.DropdownClass ? ' avec DropdownList' : ' sans DropdownList'));
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
        
        // Le bouton est bien dans filtersRow
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
        
        // Ajouter le label si présent (sauf pour select car DropdownList gère son propre placeholder)
        if (label && type !== 'select') {
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
                // et sauf pour les dropdowns (ils ont leur propre onChange)
                if (e.target.type !== 'text' && 
                    e.target.type !== 'search' && 
                    !e.target.closest('.dropdown-list-wrapper')) {
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
        
        // Réinitialiser les dropdowns
        this.dropdownInstances.forEach(dropdown => {
            dropdown.setValue('');
        });
        
        // Réinitialiser les valeurs par défaut
        this.initDefaultValues();
        
        // Pour les valeurs par défaut des dropdowns
        this.config.filters.forEach(filter => {
            if (filter.type === 'select' && filter.defaultValue !== undefined) {
                const dropdown = this.dropdownInstances.find(d => d.options.name === filter.key);
                if (dropdown) {
                    dropdown.setValue(filter.defaultValue);
                }
            }
        });
        
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
            
            const filterData = this.elements.filters[key];
            
            // Si c'est un dropdown, utiliser la méthode setValue
            if (filterData.type === 'select') {
                const dropdown = this.dropdownInstances.find(d => d.options.name === key);
                if (dropdown) {
                    dropdown.setValue(value);
                }
            }
            // TODO: Gérer les autres types
            
            this.triggerFilter();
        }
    }
    
    /**
     * Activer/désactiver un filtre
     */
    setEnabled(key, enabled) {
        if (this.elements.filters[key]) {
            const { group, type } = this.elements.filters[key];
            
            if (enabled) {
                group.classList.remove('disabled');
            } else {
                group.classList.add('disabled');
            }
            
            // Si c'est un dropdown, activer/désactiver
            if (type === 'select') {
                const dropdown = this.dropdownInstances.find(d => d.options.name === key);
                if (dropdown) {
                    if (enabled) {
                        dropdown.enable();
                    } else {
                        dropdown.disable();
                    }
                }
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
        
        // Détruire toutes les instances DropdownList
        this.dropdownInstances.forEach(dropdown => {
            dropdown.destroy();
        });
        this.dropdownInstances = [];
        
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
     * Render Select - MODIFIÉ pour utiliser DropdownList injectable
     */
    renderSelect(config) {
        // ✅ MODIFIÉ: Vérifier que DropdownClass est fourni
        if (!this.config.DropdownClass) {
            console.warn('DataTableFilters: DropdownClass non fourni pour le filtre select');
            // Fallback : créer un select HTML basique
            const select = document.createElement('select');
            select.id = `${this.id}-${config.key}`;
            select.className = 'filter-select-fallback';
            
            if (config.options) {
                config.options.forEach(option => {
                    const optionEl = document.createElement('option');
                    if (typeof option === 'object') {
                        optionEl.value = option.value;
                        optionEl.textContent = option.label;
                    } else {
                        optionEl.value = option;
                        optionEl.textContent = option;
                    }
                    select.appendChild(optionEl);
                });
            }
            
            return select;
        }
        
        // ✅ Utiliser la classe DropdownList fournie
        const DropdownList = this.config.DropdownClass;
        
        // Créer un container pour le dropdown
        const container = document.createElement('div');
        container.className = 'filter-dropdown-container';
        container.id = `${this.id}-${config.key}-container`;
        
        // Préparer les options avec extraction des icônes
        let dropdownOptions = [];
        
        if (config.options) {
            dropdownOptions = config.options.map(option => {
                if (typeof option === 'object') {
                    // Si l'option a déjà une icône, on la garde
                    if (option.icon) {
                        return option;
                    }
                    
                    // Sinon, on essaie d'extraire l'icône du label
                    const iconMatch = option.label.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{25A0}-\u{25FF}]|[\u{2190}-\u{21FF}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{1F004}]|[\u{1F170}-\u{1F251}]|[0-9]\u{FE0F}?\u{20E3})/u);
                    
                    if (iconMatch) {
                        // Icône trouvée, on la sépare
                        return {
                            value: option.value,
                            label: option.label.substring(iconMatch[0].length).trim(),
                            icon: iconMatch[0]
                        };
                    }
                    
                    // Pas d'icône trouvée
                    return option;
                } else {
                    // Option simple (string)
                    return {
                        value: option,
                        label: option
                    };
                }
            });
        }
        
        // Déterminer le placeholder
        let placeholder = '-- Sélectionner --';
        if (config.label) {
            placeholder = config.label;
        } else if (dropdownOptions.length > 0 && dropdownOptions[0].value === '') {
            // Si la première option est vide, l'utiliser comme placeholder
            placeholder = dropdownOptions[0].label;
            dropdownOptions.shift(); // Retirer cette option
        }
        
        // Créer l'instance DropdownList
        const dropdown = new DropdownList({
            container: container,
            name: config.key,
            placeholder: placeholder,
            options: dropdownOptions,
            value: config.defaultValue || '',
            searchable: true, // Toujours activé
            showIcons: true,  // Toujours afficher les icônes
            keepPlaceholder: config.keepPlaceholder || false, // Transmettre l'option
            onChange: (value) => {
                if (this.config.autoSubmit) {
                    this.handleFilterChange();
                }
            }
        });
        
        // Stocker l'instance pour pouvoir la détruire plus tard
        this.dropdownInstances.push(dropdown);
        
        return container;
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
     * Get Value Select - MODIFIÉ pour DropdownList
     */
    getValueSelect(element, config) {
        // Si c'est un dropdown
        const dropdown = this.dropdownInstances.find(d => d.options.name === config.key);
        if (dropdown) {
            return dropdown.getValue();
        }
        
        // Sinon fallback sur le select HTML
        const select = element.querySelector('select');
        return select ? select.value : '';
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

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [01/02/2025] - Intégration complète de DropdownList
   - Remplacement de TOUS les <select> par DropdownList
   - Extraction automatique des icônes depuis les labels (format "🍃 Normal")
   - Activation de la recherche pour TOUS les dropdowns
   - Stockage des instances pour destruction propre
   - Gestion du reset et setValue pour les dropdowns
   - Support des icônes séparées { value, label, icon }
   
   [01/02/2025 v2] - Autonomie complète
   - Suppression imports generateId et DropdownList
   - DropdownList passé via config.DropdownClass
   - Fallback sur select HTML si DropdownClass non fourni
   - 100% indépendant d'autres composants UI
   
   AVANTAGES:
   - Zero couplage entre composants UI
   - DropdownList injectable par l'orchestrateur
   - Fallback gracieux si DropdownList non fourni
   - Destruction propre des instances
   
   NOTES:
   - L'orchestrateur doit passer DropdownClass dans la config
   - Si non fourni, utilise un select HTML basique
   - La recherche n'est disponible qu'avec DropdownList
   ======================================== */