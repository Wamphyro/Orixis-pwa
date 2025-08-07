/* ========================================
   SEARCH-FILTERS.WIDGET.JS - Widget de filtres de recherche
   Chemin: /widgets/search-filters/search-filters.widget.js
   
   DESCRIPTION:
   Widget autonome de filtres avec recherche et dropdowns custom.
   Inclut dropdowns avec style glassmorphism, recherche intégrée,
   sélection multiple et debounce. 100% indépendant.
   
   STRUCTURE DU FICHIER:
   1. CONSTRUCTOR ET CONFIGURATION
   2. INITIALISATION
   3. RENDU PRINCIPAL
   4. COMPOSANTS FILTRES
   5. DROPDOWN CUSTOM INTÉGRÉ
   6. GESTION ÉVÉNEMENTS
   7. API PUBLIQUE
   8. DESTRUCTION
   
   UTILISATION:
   import { SearchFiltersWidget } from '/widgets/search-filters/search-filters.widget.js';
   const filters = new SearchFiltersWidget({
       container: '.filters',
       showWrapper: true,
       filters: [...],
       onFilter: (values) => {...}
   });
   
   API PUBLIQUE:
   - getValues() - Récupère les valeurs actuelles
   - setValue(key, value) - Définit une valeur
   - reset() - Réinitialise tous les filtres
   - setEnabled(key, enabled) - Active/désactive un filtre
   - refresh() - Rafraîchit l'affichage
   - destroy() - Détruit le widget
   
   OPTIONS:
   - container: string|Element - Container cible
   - showWrapper: boolean (défaut: false) - Affiche container englobant
   - wrapperStyle: 'card'|'minimal'|'bordered' (défaut: 'card')
   - wrapperTitle: string (défaut: '') - Titre du wrapper
   - filters: Array - Configuration des filtres
   - debounceDelay: number (défaut: 300) - Délai debounce en ms
   - autoSubmit: boolean (défaut: true) - Soumet automatiquement
   - resetButton: boolean (défaut: true) - Affiche bouton reset
   - onFilter: Function - Callback sur changement
   
   MODIFICATIONS:
   - 08/02/2025 : Création initiale basée sur StatsCardsWidget
   
   AUTEUR: Assistant Claude
   VERSION: 1.0.0
   ======================================== */

export class SearchFiltersWidget {
    constructor(config = {}) {
        // 1. Charger CSS TOUJOURS en premier
        this.loadCSS();
        
        // 2. Configuration avec défauts
        this.config = {
            // Container
            container: config.container || null,
            
            // Options wrapper englobant
            showWrapper: config.showWrapper || false,
            wrapperStyle: config.wrapperStyle || 'card',
            wrapperTitle: config.wrapperTitle || '',
            wrapperClass: config.wrapperClass || '',
            
            // Filtres
            filters: config.filters || [],
            
            // Comportement
            autoSubmit: config.autoSubmit !== false,
            debounceDelay: config.debounceDelay || 300,
            resetButton: config.resetButton !== false,
            animated: config.animated !== false,
            
            // Classes boutons (pour personnalisation externe)
            buttonClasses: {
                reset: config.buttonClasses?.reset || 'search-filters-reset-btn'
            },
            
            // Callbacks
            onFilter: config.onFilter || null,
            onChange: config.onChange || null, // Compatibilité
            
            ...config
        };
        
        // 3. État interne structuré
        this.state = {
            values: {},
            enabled: {},
            loaded: false,
            dropdowns: {} // Stockage des dropdowns custom
        };
        
        // 4. Références DOM
        this.elements = {
            container: null,
            mainContainer: null,
            wrapper: null,
            form: null,
            filters: {},
            resetButton: null
        };
        
        // 5. ID unique (pattern obligatoire)
        this.id = 'filters-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Timer pour debounce
        this.debounceTimer = null;
        
        // 6. Initialiser
        this.init();
    }
    
    // ========================================
    // SECTION 1 : INITIALISATION
    // ========================================
    
    /**
     * Charge le CSS avec timestamp anti-cache
     */
    loadCSS() {
        const cssId = 'search-filters-widget-css';
        const existing = document.getElementById(cssId);
        if (existing) existing.remove();
        
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = `/widgets/search-filters/search-filters.widget.css?v=${Date.now()}`;
        document.head.appendChild(link);
        
        console.log('✅ CSS SearchFiltersWidget chargé');
    }
    
    /**
     * Initialisation asynchrone
     */
    async init() {
        try {
            this.setupContainer();
            this.initState();
            this.render();
            this.attachEvents();
            this.showWithDelay(); // Anti-FOUC
            
            console.log('✅ SearchFiltersWidget initialisé:', this.id);
        } catch (error) {
            console.error('❌ Erreur init SearchFiltersWidget:', error);
        }
    }
    
    /**
     * Configure le container
     */
    setupContainer() {
        if (typeof this.config.container === 'string') {
            this.elements.container = document.querySelector(this.config.container);
        } else {
            this.elements.container = this.config.container;
        }
        
        if (!this.elements.container) {
            throw new Error('SearchFiltersWidget: Container non trouvé');
        }
    }
    
    /**
     * Initialise l'état avec les valeurs par défaut
     */
    initState() {
        this.config.filters.forEach(filter => {
            // Valeur par défaut
            if (filter.defaultValue !== undefined) {
                this.state.values[filter.key] = filter.defaultValue;
            }
            // État enabled
            this.state.enabled[filter.key] = filter.enabled !== false;
        });
    }
    
    // ========================================
    // SECTION 2 : RENDU PRINCIPAL
    // ========================================
    
    /**
     * Génère et affiche le HTML
     */
    render() {
        if (this.config.showWrapper) {
            this.renderWithWrapper();
        } else {
            this.renderWithoutWrapper();
        }
    }
    
    /**
     * Rendu avec wrapper englobant
     */
    renderWithWrapper() {
        // Créer le container englobant
        const container = document.createElement('div');
        container.className = this.buildContainerClasses();
        container.id = `${this.id}-container`;
        
        // Ajouter le titre si fourni
        if (this.config.wrapperTitle) {
            const title = document.createElement('div');
            title.className = 'search-filters-container-title';
            title.textContent = this.config.wrapperTitle;
            container.appendChild(title);
        }
        
        // Créer le wrapper des filtres
        const wrapper = this.createFiltersWrapper();
        container.appendChild(wrapper);
        
        // Sauvegarder les références
        this.elements.mainContainer = container;
        this.elements.wrapper = wrapper;
        
        // Injecter dans le DOM
        this.elements.container.innerHTML = '';
        this.elements.container.appendChild(container);
    }
    
    /**
     * Rendu sans wrapper
     */
    renderWithoutWrapper() {
        const wrapper = this.createFiltersWrapper();
        
        // Sauvegarder les références
        this.elements.mainContainer = wrapper;
        this.elements.wrapper = wrapper;
        
        // Injecter dans le DOM
        this.elements.container.innerHTML = '';
        this.elements.container.appendChild(wrapper);
    }
    
    /**
     * Crée le wrapper principal des filtres
     */
    createFiltersWrapper() {
        const wrapper = document.createElement('div');
        wrapper.className = this.buildWrapperClasses();
        wrapper.id = this.id;
        
        // Créer le formulaire
        const form = document.createElement('form');
        form.className = 'search-filters-form';
        form.onsubmit = (e) => e.preventDefault();
        
        // Créer la ligne de filtres
        const filtersRow = document.createElement('div');
        filtersRow.className = 'search-filters-row';
        
        // Ajouter chaque filtre
        this.config.filters.forEach(filterConfig => {
            const filterElement = this.createFilter(filterConfig);
            if (filterElement) {
                filtersRow.appendChild(filterElement);
                // Stocker la référence
                this.elements.filters[filterConfig.key] = {
                    element: filterElement,
                    config: filterConfig
                };
            }
        });
        
        // Bouton reset
        if (this.config.resetButton && this.config.filters.length > 0) {
            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'btn btn-ghost-purple';  // Retiré btn-sm
            resetBtn.innerHTML = '<span class="reset-icon">↺</span> Réinitialiser';
            resetBtn.onclick = () => this.reset();
            
            filtersRow.appendChild(resetBtn);
            this.elements.resetButton = resetBtn;
        }
        
        form.appendChild(filtersRow);
        wrapper.appendChild(form);
        this.elements.form = form;
        
        return wrapper;
    }
    
    /**
     * Construit les classes du container englobant
     */
    buildContainerClasses() {
        const classes = ['search-filters-container'];
        
        // Style du wrapper
        classes.push(`wrapper-${this.config.wrapperStyle}`);
        
        // Classes additionnelles
        if (this.config.wrapperClass) {
            classes.push(this.config.wrapperClass);
        }
        
        return classes.join(' ');
    }
    
    /**
     * Construit les classes du wrapper
     */
    buildWrapperClasses() {
        const classes = ['search-filters-wrapper'];
        
        // Animations
        if (!this.config.animated) {
            classes.push('no-animation');
        }
        
        return classes.join(' ');
    }
    
    // ========================================
    // SECTION 3 : CRÉATION DES FILTRES
    // ========================================
    
    /**
     * Crée un filtre selon son type
     */
    createFilter(config) {
        const group = document.createElement('div');
        group.className = `filter-group filter-${config.type}`;
        group.dataset.filterKey = config.key;
        
        // État disabled
        if (!this.state.enabled[config.key]) {
            group.classList.add('disabled');
        }
        
        // Créer selon le type
        let filterElement;
        switch (config.type) {
            case 'search':
                filterElement = this.createSearchFilter(config);
                break;
            case 'select':
                filterElement = this.createSelectFilter(config);
                break;
            case 'date':
                filterElement = this.createDateFilter(config);
                break;
            case 'daterange':
                filterElement = this.createDateRangeFilter(config);
                break;
            default:
                console.warn(`SearchFiltersWidget: Type "${config.type}" non supporté`);
                return null;
        }
        
        if (filterElement) {
            // Ajouter le label si présent (sauf pour select qui gère son placeholder)
            if (config.label && config.type !== 'select') {
                const label = document.createElement('label');
                label.className = 'filter-label';
                label.textContent = config.label;
                label.htmlFor = `${this.id}-${config.key}`;
                group.appendChild(label);
            }
            
            group.appendChild(filterElement);
        }
        
        return group;
    }
    
    /**
     * Crée un filtre de recherche
     */
    createSearchFilter(config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'filter-search-wrapper';
        
        const input = document.createElement('input');
        input.type = 'search';
        input.className = 'filter-search-input';
        input.id = `${this.id}-${config.key}`;
        input.placeholder = config.placeholder || 'Rechercher...';
        input.value = this.state.values[config.key] || '';
        
        // Icône
        const icon = document.createElement('span');
        icon.className = 'filter-search-icon';
        icon.innerHTML = '🔍';
        
        // Debounce sur input
        if (this.config.autoSubmit) {
            input.addEventListener('input', () => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.handleFilterChange();
                }, this.config.debounceDelay);
            });
        }
        
        wrapper.appendChild(input);
        wrapper.appendChild(icon);
        
        return wrapper;
    }
    
    /**
     * Crée un filtre select avec dropdown custom
     */
    createSelectFilter(config) {
        const container = document.createElement('div');
        container.className = 'filter-select-container';
        container.id = `${this.id}-${config.key}-dropdown`;
        
        // Créer le dropdown custom
        const dropdown = this.createCustomDropdown({
            id: `${this.id}-${config.key}`,
            placeholder: config.label || config.placeholder || 'Sélectionner',
            options: config.options || [],
            value: this.state.values[config.key],
            searchable: config.searchable !== false,
            multiple: config.multiple || false,
            onChange: (value) => {
                this.state.values[config.key] = value;
                if (this.config.autoSubmit) {
                    this.handleFilterChange();
                }
            }
        });
        
        // Stocker la référence
        this.state.dropdowns[config.key] = dropdown;
        
        container.appendChild(dropdown.element);
        return container;
    }
    
    /**
     * Crée un filtre date
     */
    createDateFilter(config) {
        const input = document.createElement('input');
        input.type = 'date';
        input.className = 'filter-date-input';
        input.id = `${this.id}-${config.key}`;
        input.value = this.state.values[config.key] || '';
        
        if (this.config.autoSubmit) {
            input.addEventListener('change', () => this.handleFilterChange());
        }
        
        return input;
    }
    
    /**
     * Crée un filtre date range
     */
    createDateRangeFilter(config) {
        const container = document.createElement('div');
        container.className = 'filter-daterange-container';
        
        const startInput = document.createElement('input');
        startInput.type = 'date';
        startInput.className = 'filter-daterange-start';
        startInput.id = `${this.id}-${config.key}-start`;
        
        const separator = document.createElement('span');
        separator.className = 'filter-daterange-separator';
        separator.textContent = '→';
        
        const endInput = document.createElement('input');
        endInput.type = 'date';
        endInput.className = 'filter-daterange-end';
        endInput.id = `${this.id}-${config.key}-end`;
        
        if (this.config.autoSubmit) {
            [startInput, endInput].forEach(input => {
                input.addEventListener('change', () => this.handleFilterChange());
            });
        }
        
        container.appendChild(startInput);
        container.appendChild(separator);
        container.appendChild(endInput);
        
        return container;
    }
    
    // ========================================
    // SECTION 4 : DROPDOWN CUSTOM INTÉGRÉ
    // ========================================
    
    /**
     * Crée un dropdown custom avec toutes les fonctionnalités
     */
    createCustomDropdown(config) {
        const dropdown = {
            id: config.id,
            isOpen: false,
            value: config.multiple ? (config.value || []) : (config.value || ''),
            searchQuery: '',
            filteredOptions: [...(config.options || [])],
            highlightedIndex: -1,
            config: config,
            protected: false
        };
        
        // Créer la structure DOM
        const wrapper = document.createElement('div');
        wrapper.className = 'widget-dropdown-wrapper';
        
        // Trigger
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'widget-dropdown-trigger';
        trigger.innerHTML = `
            <span class="widget-dropdown-value">${this.getDropdownDisplayValue(dropdown)}</span>
            <span class="widget-dropdown-arrow">▼</span>
        `;
        
        // Panel
        const panel = document.createElement('div');
        panel.className = 'widget-dropdown-panel';
        panel.style.display = 'none';
        
        // Recherche si activée
        if (config.searchable) {
            const searchWrapper = document.createElement('div');
            searchWrapper.className = 'widget-dropdown-search';
            
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.className = 'widget-dropdown-search-input';
            searchInput.placeholder = 'Rechercher...';
            
            searchInput.addEventListener('input', (e) => {
                dropdown.searchQuery = e.target.value;
                this.filterDropdownOptions(dropdown);
                this.renderDropdownOptions(dropdown);
            });
            
            searchWrapper.appendChild(searchInput);
            panel.appendChild(searchWrapper);
            dropdown.searchInput = searchInput;
        }
        
        // Container des options
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'widget-dropdown-options';
        panel.appendChild(optionsContainer);
        
        // Assembler
        wrapper.appendChild(trigger);
        wrapper.appendChild(panel);
        
        // Sauvegarder les éléments
        dropdown.element = wrapper;
        dropdown.trigger = trigger;
        dropdown.panel = panel;
        dropdown.optionsContainer = optionsContainer;
        
        // Événements du dropdown
        this.attachDropdownEvents(dropdown);
        
        // Render initial des options
        this.renderDropdownOptions(dropdown);
        
        return dropdown;
    }
    
    /**
     * Attache les événements d'un dropdown
     */
    attachDropdownEvents(dropdown) {
        // Toggle au clic sur le trigger
        dropdown.trigger.addEventListener('click', () => {
            this.toggleDropdown(dropdown);
        });
        
        // Sélection d'option (délégation)
        dropdown.panel.addEventListener('click', (e) => {
            const optionEl = e.target.closest('.widget-dropdown-option');
            if (optionEl && !optionEl.classList.contains('disabled')) {
                const index = parseInt(optionEl.dataset.index);
                this.selectDropdownOption(dropdown, dropdown.filteredOptions[index]);
            }
        });
        
        // Hover sur les options
        dropdown.panel.addEventListener('mouseover', (e) => {
            const optionEl = e.target.closest('.widget-dropdown-option');
            if (optionEl && !optionEl.classList.contains('disabled')) {
                dropdown.highlightedIndex = parseInt(optionEl.dataset.index);
                this.updateDropdownHighlight(dropdown);
            }
        });
        
        // Navigation clavier
        dropdown.element.addEventListener('keydown', (e) => {
            this.handleDropdownKeyboard(dropdown, e);
        });
        
        // Fermeture clic extérieur
        const closeHandler = (e) => {
            // Si dropdown protégé, ignorer
            if (dropdown.protected) return;
            
            // Vérifier si le clic est vraiment en dehors
            if (dropdown.element.contains(e.target) || 
                dropdown.panel.contains(e.target)) {
                return;
            }
            
            // Fermer seulement si ouvert
            if (dropdown.isOpen) {
                this.closeDropdown(dropdown);
            }
        };
        
        // Attacher le handler immédiatement mais avec protection
        document.addEventListener('click', closeHandler, true);
        dropdown.closeHandler = closeHandler;
    }
    
    /**
     * Gestion clavier dropdown
     */
    handleDropdownKeyboard(dropdown, e) {
        if (!dropdown.isOpen && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            this.openDropdown(dropdown);
            return;
        }
        
        if (!dropdown.isOpen) return;
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                dropdown.highlightedIndex = Math.min(
                    dropdown.highlightedIndex + 1,
                    dropdown.filteredOptions.length - 1
                );
                this.updateDropdownHighlight(dropdown);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                dropdown.highlightedIndex = Math.max(dropdown.highlightedIndex - 1, 0);
                this.updateDropdownHighlight(dropdown);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (dropdown.highlightedIndex >= 0) {
                    this.selectDropdownOption(dropdown, dropdown.filteredOptions[dropdown.highlightedIndex]);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.closeDropdown(dropdown);
                dropdown.trigger.focus();
                break;
        }
    }
    
    /**
     * Filtre les options du dropdown
     */
    filterDropdownOptions(dropdown) {
        if (!dropdown.searchQuery) {
            dropdown.filteredOptions = [...dropdown.config.options];
        } else {
            const query = dropdown.searchQuery.toLowerCase();
            dropdown.filteredOptions = dropdown.config.options.filter(option => {
                const label = typeof option === 'object' ? option.label : option;
                return label.toLowerCase().includes(query);
            });
        }
        dropdown.highlightedIndex = -1;
    }
    
    /**
     * Affiche les options du dropdown
     */
    renderDropdownOptions(dropdown) {
        const container = dropdown.optionsContainer;
        container.innerHTML = '';
        
        if (dropdown.filteredOptions.length === 0) {
            container.innerHTML = '<div class="widget-dropdown-empty">Aucun résultat</div>';
            return;
        }
        
        dropdown.filteredOptions.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'widget-dropdown-option';
            optionEl.dataset.index = index;
            
            const value = typeof option === 'object' ? option.value : option;
            const label = typeof option === 'object' ? option.label : option;
            const icon = typeof option === 'object' ? option.icon : null;
            
            // Vérifier si sélectionné
            const isSelected = dropdown.config.multiple 
                ? dropdown.value.includes(value)
                : dropdown.value === value;
                
            if (isSelected) {
                optionEl.classList.add('selected');
            }
            
            // Contenu
            let html = '';
            if (icon) {
                html += `<span class="widget-dropdown-option-icon">${icon}</span>`;
            }
            html += `<span class="widget-dropdown-option-label">${label}</span>`;
            
            if (dropdown.config.multiple && isSelected) {
                html += `<span class="widget-dropdown-option-check">✓</span>`;
            }
            
            optionEl.innerHTML = html;
            container.appendChild(optionEl);
        });
    }
    
    /**
     * Met à jour le highlight
     */
    updateDropdownHighlight(dropdown) {
        dropdown.optionsContainer.querySelectorAll('.widget-dropdown-option').forEach((el, index) => {
            if (index === dropdown.highlightedIndex) {
                el.classList.add('highlighted');
                el.scrollIntoView({ block: 'nearest' });
            } else {
                el.classList.remove('highlighted');
            }
        });
    }
    
    /**
     * Sélectionne une option
     */
    selectDropdownOption(dropdown, option) {
        if (!option) return;
        
        const value = typeof option === 'object' ? option.value : option;
        
        if (dropdown.config.multiple) {
            // Mode multiple : toggle sans fermer
            if (!Array.isArray(dropdown.value)) {
                dropdown.value = [];
            }
            const index = dropdown.value.indexOf(value);
            if (index > -1) {
                dropdown.value.splice(index, 1);
            } else {
                dropdown.value.push(value);
            }
            
            // Protéger contre la fermeture temporairement
            dropdown.protected = true;
            setTimeout(() => {
                dropdown.protected = false;
            }, 100);
            // NE PAS FERMER en mode multiple !
        } else {
            // Mode simple : sélectionner et fermer
            dropdown.value = value;
            this.closeDropdown(dropdown);
        }
        
        // Mettre à jour l'affichage
        this.updateDropdownDisplay(dropdown);
        
        // Re-render les options
        this.renderDropdownOptions(dropdown);
        
        // Callback
        if (dropdown.config.onChange) {
            dropdown.config.onChange(dropdown.value);
        }
    }
    
    /**
     * Met à jour l'affichage du dropdown
     */
    updateDropdownDisplay(dropdown) {
        const valueEl = dropdown.trigger.querySelector('.widget-dropdown-value');
        if (valueEl) {
            valueEl.innerHTML = this.getDropdownDisplayValue(dropdown);
        }
    }
    
    /**
     * Obtient la valeur à afficher
     */
    getDropdownDisplayValue(dropdown) {
        if (dropdown.config.multiple) {
            if (!dropdown.value || dropdown.value.length === 0) {
                return dropdown.config.placeholder;
            }
            return `${dropdown.value.length} sélectionné(s)`;
        } else {
            if (!dropdown.value) {
                return dropdown.config.placeholder;
            }
            const option = dropdown.config.options.find(opt => {
                const val = typeof opt === 'object' ? opt.value : opt;
                return val === dropdown.value;
            });
            if (option) {
                const label = typeof option === 'object' ? option.label : option;
                const icon = typeof option === 'object' ? option.icon : null;
                return icon ? `${icon} ${label}` : label;
            }
            return dropdown.config.placeholder;
        }
    }
    
    /**
     * Ouvre le dropdown
     */
    openDropdown(dropdown) {
        if (dropdown.isOpen) return;
        
        dropdown.isOpen = true;
        dropdown.element.classList.add('open');
        dropdown.panel.style.display = 'block';
        
        // Animation
        requestAnimationFrame(() => {
            dropdown.panel.classList.add('show');
        });
        
        // Focus recherche si présente
        if (dropdown.searchInput) {
            setTimeout(() => dropdown.searchInput.focus(), 100);
        }
        
        // Protection temporaire contre la fermeture
        dropdown.protected = true;
        setTimeout(() => {
            dropdown.protected = false;
        }, 200);
    }
    
    /**
     * Ferme le dropdown
     */
    closeDropdown(dropdown) {
        if (!dropdown.isOpen) return;
        
        dropdown.isOpen = false;
        dropdown.element.classList.remove('open');
        dropdown.panel.classList.remove('show');
        
        setTimeout(() => {
            dropdown.panel.style.display = 'none';
        }, 300);
        
        // Reset recherche
        if (dropdown.searchInput) {
            dropdown.searchInput.value = '';
            dropdown.searchQuery = '';
            this.filterDropdownOptions(dropdown);
            this.renderDropdownOptions(dropdown);
        }
    }
    
    /**
     * Toggle dropdown
     */
    toggleDropdown(dropdown) {
        if (dropdown.isOpen) {
            this.closeDropdown(dropdown);
        } else {
            this.openDropdown(dropdown);
        }
    }
    
    // ========================================
    // SECTION 5 : GESTION DES ÉVÉNEMENTS
    // ========================================
    
    /**
     * Attache les événements globaux
     */
    attachEvents() {
        // Auto-submit sur changements (sauf search qui a son debounce)
        if (this.config.autoSubmit && this.elements.form) {
            this.elements.form.addEventListener('change', (e) => {
                if (!e.target.matches('.filter-search-input')) {
                    this.handleFilterChange();
                }
            });
        }
    }
    
    /**
     * Gère le changement de filtre
     */
    handleFilterChange() {
        this.collectValues();
        this.triggerFilter();
    }
    
    /**
     * Collecte les valeurs de tous les filtres
     */
    collectValues() {
        const values = {};
        
        this.config.filters.forEach(filter => {
            const filterEl = this.elements.filters[filter.key];
            if (!filterEl) return;
            
            let value;
            switch (filter.type) {
                case 'search':
                    const searchInput = filterEl.element.querySelector('.filter-search-input');
                    value = searchInput ? searchInput.value.trim() : '';
                    break;
                    
                case 'select':
                    const dropdown = this.state.dropdowns[filter.key];
                    value = dropdown ? dropdown.value : null;
                    break;
                    
                case 'date':
                    const dateInput = filterEl.element.querySelector('.filter-date-input');
                    value = dateInput ? dateInput.value : '';
                    break;
                    
                case 'daterange':
                    const startInput = filterEl.element.querySelector('.filter-daterange-start');
                    const endInput = filterEl.element.querySelector('.filter-daterange-end');
                    if (startInput || endInput) {
                        value = {
                            start: startInput ? startInput.value : '',
                            end: endInput ? endInput.value : ''
                        };
                    }
                    break;
            }
            
            // Toujours inclure les valeurs, même vides pour arrays
            if (value !== undefined && value !== null) {
                if (Array.isArray(value) || value !== '') {
                    values[filter.key] = value;
                }
            }
        });
        
        this.state.values = values;
    }
    
    /**
     * Déclenche le callback de filtre
     */
    triggerFilter() {
        if (this.config.onFilter) {
            this.config.onFilter(this.getValues());
        }
        // Compatibilité onChange
        if (this.config.onChange) {
            this.config.onChange(this.getValues());
        }
    }
    
    // ========================================
    // SECTION 6 : API PUBLIQUE
    // ========================================
    
    /**
     * Obtient les valeurs actuelles
     */
    getValues() {
        return { ...this.state.values };
    }
    
    /**
     * Définit une valeur
     */
    setValue(key, value) {
        const filter = this.config.filters.find(f => f.key === key);
        if (!filter) return;
        
        this.state.values[key] = value;
        
        // Mettre à jour l'UI selon le type
        if (filter.type === 'select') {
            const dropdown = this.state.dropdowns[key];
            if (dropdown) {
                dropdown.value = value;
                this.updateDropdownDisplay(dropdown);
                this.renderDropdownOptions(dropdown);
            }
        } else if (filter.type === 'search') {
            const input = this.elements.filters[key]?.element.querySelector('.filter-search-input');
            if (input) input.value = value;
        }
        // TODO: Autres types
        
        this.triggerFilter();
    }
    
    /**
     * Réinitialise tous les filtres
     */
    reset() {
        // Reset values
        this.state.values = {};
        
        // Reset UI
        if (this.elements.form) {
            this.elements.form.reset();
        }
        
        // Reset dropdowns
        Object.values(this.state.dropdowns).forEach(dropdown => {
            dropdown.value = dropdown.config.multiple ? [] : '';
            dropdown.searchQuery = '';
            this.filterDropdownOptions(dropdown);
            this.updateDropdownDisplay(dropdown);
            this.renderDropdownOptions(dropdown);
        });
        
        // Réappliquer les valeurs par défaut
        this.initState();
        
        // Trigger
        this.triggerFilter();
    }
    
    /**
     * Active/désactive un filtre
     */
    setEnabled(key, enabled) {
        const filterEl = this.elements.filters[key];
        if (!filterEl) return;
        
        this.state.enabled[key] = enabled;
        
        if (enabled) {
            filterEl.element.classList.remove('disabled');
        } else {
            filterEl.element.classList.add('disabled');
        }
        
        // Désactiver les inputs
        const inputs = filterEl.element.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = !enabled;
        });
    }
    
    /**
     * Obtient l'élément bouton reset pour personnalisation externe
     */
    getResetButtonElement() {
        return this.elements.resetButton;
    }
    
    /**
     * Rafraîchit l'affichage
     */
    refresh() {
        this.render();
        this.attachEvents();
        if (this.state.loaded) {
            this.show();
        }
    }
    
    // ========================================
    // SECTION 7 : AFFICHAGE (ANTI-FOUC)
    // ========================================
    
    /**
     * Anti-FOUC : affichage avec délai
     */
    showWithDelay() {
        setTimeout(() => {
            this.show();
        }, 100);
    }
    
    /**
     * Affiche le widget
     */
    show() {
        if (this.elements.mainContainer) {
            this.elements.mainContainer.classList.add('loaded');
        }
        this.state.loaded = true;
    }
    
    /**
     * Masque le widget
     */
    hide() {
        if (this.elements.mainContainer) {
            this.elements.mainContainer.classList.remove('loaded');
        }
        this.state.loaded = false;
    }
    
    // ========================================
    // SECTION 8 : DESTRUCTION
    // ========================================
    
    /**
     * Destruction propre OBLIGATOIRE
     */
    destroy() {
        // Nettoyer timers
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        
        // Nettoyer event listeners des dropdowns
        Object.values(this.state.dropdowns).forEach(dropdown => {
            if (dropdown.closeHandler) {
                document.removeEventListener('click', dropdown.closeHandler, true);
            }
        });
        
        // Vider container
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
        
        // Réinitialiser état
        this.state = {
            values: {},
            enabled: {},
            loaded: false,
            dropdowns: {}
        };
        
        // Réinitialiser éléments
        this.elements = {
            container: null,
            mainContainer: null,
            wrapper: null,
            form: null,
            filters: {},
            resetButton: null
        };
        
        console.log('🗑️ SearchFiltersWidget détruit:', this.id);
    }
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default SearchFiltersWidget;