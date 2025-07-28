/* ========================================
   FILTER-PANEL.COMPONENT.JS - Panneau de filtres modulaire
   Chemin: src/js/shared/ui/filters/filter-panel.component.js
   
   DESCRIPTION:
   Composant de panneau de filtres ultra-complet avec style glassmorphism.
   Gère tous les types de filtres avec animations fluides et états avancés.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-400)
   2. Méthodes de création (lignes 401-800)
   3. Types de filtres (lignes 801-1400)
   4. Gestionnaires d'événements (lignes 1401-1600)
   5. API publique (lignes 1601-1700)
   
   DÉPENDANCES:
   - filter-panel.component.css (styles spécifiques)
   - ui.config.js (configuration globale)
   - date-picker.component.js (si filtres date)
   ======================================== */

const FilterPanel = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            'glassmorphism': {
                panel: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px) brightness(1.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    padding: '20px'
                },
                filter: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    focus: {
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }
                }
            },
            'neumorphism': {
                panel: {
                    background: '#e0e5ec',
                    boxShadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
                    borderRadius: '20px',
                    padding: '24px'
                },
                filter: {
                    background: '#e0e5ec',
                    boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                    borderRadius: '12px'
                }
            },
            'material': {
                panel: {
                    background: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                    padding: '16px'
                },
                filter: {
                    borderBottom: '1px solid #e0e0e0',
                    focus: {
                        borderBottom: '2px solid #1976d2'
                    }
                }
            },
            'minimal': {
                panel: {
                    background: 'transparent',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '16px'
                },
                filter: {
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    background: '#f5f5f5'
                }
            },
            'floating': {
                panel: {
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                    borderRadius: '12px',
                    padding: '20px'
                }
            }
        },

        // Types de filtres
        filterTypes: {
            'text': {
                icon: '🔍',
                placeholder: 'Rechercher...',
                operators: ['contains', 'equals', 'startsWith', 'endsWith', 'notContains'],
                caseSensitive: false,
                debounce: 300
            },
            'number': {
                icon: '🔢',
                placeholder: 'Valeur...',
                operators: ['equals', 'notEquals', 'greater', 'less', 'between', 'notBetween'],
                step: 1,
                min: null,
                max: null
            },
            'select': {
                icon: '📋',
                placeholder: 'Sélectionner...',
                operators: ['equals', 'notEquals', 'in', 'notIn'],
                multiple: false,
                searchable: true,
                clearable: true
            },
            'multiselect': {
                icon: '☑️',
                placeholder: 'Sélectionner plusieurs...',
                operators: ['in', 'notIn', 'all', 'any'],
                multiple: true,
                searchable: true,
                tags: true,
                max: null
            },
            'date': {
                icon: '📅',
                placeholder: 'Date...',
                operators: ['equals', 'before', 'after', 'between', 'notBetween', 'today', 'yesterday', 'thisWeek', 'thisMonth', 'thisYear'],
                format: 'DD/MM/YYYY',
                minDate: null,
                maxDate: null
            },
            'daterange': {
                icon: '📆',
                placeholder: 'Période...',
                operators: ['between', 'notBetween', 'last7Days', 'last30Days', 'last90Days', 'custom'],
                format: 'DD/MM/YYYY',
                separator: ' - '
            },
            'boolean': {
                icon: '✓',
                placeholder: '',
                operators: ['equals'],
                labels: { true: 'Oui', false: 'Non', null: 'Tous' }
            },
            'range': {
                icon: '⚖️',
                placeholder: 'Min - Max',
                operators: ['between', 'notBetween'],
                min: 0,
                max: 100,
                step: 1,
                showValue: true,
                dual: true
            },
            'color': {
                icon: '🎨',
                placeholder: 'Couleur...',
                operators: ['equals', 'notEquals', 'in'],
                format: 'hex',
                showPalette: true
            },
            'tags': {
                icon: '🏷️',
                placeholder: 'Tags...',
                operators: ['contains', 'notContains', 'all', 'any', 'none'],
                autocomplete: true,
                createNew: true
            },
            'rating': {
                icon: '⭐',
                placeholder: 'Note...',
                operators: ['equals', 'greater', 'less', 'between'],
                max: 5,
                allowHalf: true,
                showValue: true
            },
            'status': {
                icon: '🚦',
                placeholder: 'Statut...',
                operators: ['equals', 'notEquals', 'in'],
                options: [],
                colors: true,
                icons: true
            },
            'custom': {
                icon: '⚙️',
                placeholder: 'Custom...',
                operators: [],
                component: null // Fonction de rendu custom
            }
        },

        // Layouts disponibles
        layouts: {
            'horizontal': {
                direction: 'row',
                gap: '12px',
                wrap: true,
                align: 'center'
            },
            'vertical': {
                direction: 'column',
                gap: '16px',
                wrap: false,
                align: 'stretch'
            },
            'grid': {
                columns: 'auto-fit',
                minWidth: '200px',
                gap: '16px'
            },
            'compact': {
                direction: 'row',
                gap: '8px',
                inline: true,
                minimal: true
            },
            'sidebar': {
                direction: 'column',
                gap: '12px',
                sticky: true,
                collapsible: true
            },
            'advanced': {
                sections: true,
                collapsible: true,
                tabs: false,
                summary: true
            }
        },

        // Modes de fonctionnement
        modes: {
            'simple': {
                showOperators: false,
                showLabels: true,
                showClear: true,
                showApply: false,
                instant: true
            },
            'advanced': {
                showOperators: true,
                showLabels: true,
                showClear: true,
                showApply: true,
                instant: false,
                logic: true // AND/OR entre filtres
            },
            'query': {
                showBuilder: true,
                showSQL: true,
                showJSON: true,
                groups: true,
                conditions: true
            },
            'preset': {
                showPresets: true,
                allowSave: true,
                allowShare: true,
                categories: true
            }
        },

        // Animations
        animations: {
            'none': {
                enabled: false,
                duration: 0
            },
            'subtle': {
                enabled: true,
                duration: 200,
                easing: 'ease',
                fade: true
            },
            'smooth': {
                enabled: true,
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fade: true,
                slide: true,
                scale: false
            },
            'bouncy': {
                enabled: true,
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                fade: true,
                slide: true,
                scale: true,
                bounce: true
            }
        },

        // Fonctionnalités
        features: {
            // Persistance
            persistence: {
                enabled: false,
                storage: 'local', // 'local', 'session', 'url', 'cookie'
                key: 'filters',
                autoLoad: true,
                autoSave: true
            },

            // Presets
            presets: {
                enabled: false,
                items: [], // [{id, name, filters, icon}]
                allowCustom: true,
                maxCustom: 10,
                categories: false
            },

            // Export/Import
            export: {
                enabled: false,
                formats: ['json', 'url', 'sql'],
                copyToClipboard: true,
                download: true
            },

            // Historique
            history: {
                enabled: false,
                max: 10,
                showUndo: true,
                showRedo: true
            },

            // Suggestions
            suggestions: {
                enabled: false,
                smart: true, // Suggestions basées sur les données
                recent: true,
                popular: true,
                max: 5
            },

            // Validation
            validation: {
                enabled: true,
                realtime: true,
                showErrors: true,
                preventInvalid: true
            },

            // Responsive
            responsive: {
                enabled: true,
                breakpoint: 768,
                mobileLayout: 'vertical',
                collapsible: true,
                drawer: false
            },

            // Accessibilité
            accessibility: {
                enabled: true,
                labels: true,
                descriptions: true,
                announcements: true,
                keyboard: true
            }
        },

        // Classes CSS
        classes: {
            panel: 'filter-panel',
            header: 'filter-panel-header',
            body: 'filter-panel-body',
            footer: 'filter-panel-footer',
            filter: 'filter-item',
            label: 'filter-label',
            control: 'filter-control',
            operator: 'filter-operator',
            value: 'filter-value',
            actions: 'filter-actions',
            clear: 'filter-clear',
            apply: 'filter-apply',
            preset: 'filter-preset',
            active: 'active',
            invalid: 'invalid',
            disabled: 'disabled'
        },

        // Textes et labels
        i18n: {
            apply: 'Appliquer',
            clear: 'Effacer',
            clearAll: 'Tout effacer',
            addFilter: 'Ajouter un filtre',
            removeFilter: 'Supprimer',
            and: 'ET',
            or: 'OU',
            operators: {
                equals: 'Égal à',
                notEquals: 'Différent de',
                contains: 'Contient',
                notContains: 'Ne contient pas',
                startsWith: 'Commence par',
                endsWith: 'Finit par',
                greater: 'Supérieur à',
                less: 'Inférieur à',
                between: 'Entre',
                notBetween: 'Pas entre',
                in: 'Dans',
                notIn: 'Pas dans',
                before: 'Avant',
                after: 'Après',
                today: "Aujourd'hui",
                yesterday: 'Hier',
                thisWeek: 'Cette semaine',
                thisMonth: 'Ce mois',
                thisYear: 'Cette année',
                last7Days: '7 derniers jours',
                last30Days: '30 derniers jours',
                last90Days: '90 derniers jours',
                all: 'Tous',
                any: 'Au moins un',
                none: 'Aucun'
            },
            presets: {
                recent: 'Récents',
                popular: 'Populaires',
                custom: 'Personnalisés',
                save: 'Enregistrer',
                name: 'Nom du preset'
            },
            validation: {
                required: 'Ce champ est requis',
                invalid: 'Valeur invalide',
                min: 'Valeur minimale : ',
                max: 'Valeur maximale : ',
                between: 'Doit être entre {min} et {max}',
                date: 'Date invalide'
            }
        }
    };

    // ========================================
    // VARIABLES PRIVÉES
    // ========================================
    let instanceCounter = 0;
    const instances = new Map();
    let cssLoaded = false;

    // ========================================
    // MÉTHODES DE CRÉATION
    // ========================================
    function create(options = {}) {
        const instanceId = `filter-panel-${++instanceCounter}`;
        const config = mergeConfig(options);
        
        // Charger CSS si nécessaire
        if (!cssLoaded) {
            loadCSS();
            cssLoaded = true;
        }
        
        // Créer la structure
        const container = createContainer(instanceId, config);
        const state = createState(config);
        
        // Instance
        const instance = {
            id: instanceId,
            container,
            config,
            state,
            filters: new Map(),
            activeFilters: new Map(),
            history: [],
            
            // Méthodes publiques
            addFilter: (field, options) => addFilter(instance, field, options),
            removeFilter: (field) => removeFilter(instance, field),
            updateFilter: (field, value) => updateFilter(instance, field, value),
            
            getFilters: () => getFilters(instance),
            setFilters: (filters) => setFilters(instance, filters),
            clearFilters: () => clearFilters(instance),
            
            getActiveFilters: () => getActiveFilters(instance),
            applyFilters: () => applyFilters(instance),
            
            addPreset: (preset) => addPreset(instance, preset),
            loadPreset: (presetId) => loadPreset(instance, presetId),
            
            validate: () => validate(instance),
            reset: () => reset(instance),
            destroy: () => destroy(instance),
            
            on: (event, handler) => on(instance, event, handler),
            off: (event, handler) => off(instance, event, handler)
        };
        
        // Initialiser
        instances.set(instanceId, instance);
        initialize(instance);
        
        return instance;
    }

    // ========================================
    // MÉTHODES DE CONFIGURATION
    // ========================================
    function mergeConfig(options) {
        const merged = {
            style: options.style || 'glassmorphism',
            layout: options.layout || 'horizontal',
            mode: options.mode || 'simple',
            animation: options.animation || 'smooth',
            filters: options.filters || [],
            features: {},
            i18n: { ...CONFIG.i18n },
            ...options
        };

        // Fusionner les features
        Object.keys(CONFIG.features).forEach(feature => {
            merged.features[feature] = {
                ...CONFIG.features[feature],
                ...(options.features?.[feature] || {})
            };
        });

        // Fusionner i18n
        if (options.i18n) {
            Object.assign(merged.i18n, options.i18n);
        }

        return merged;
    }

    // ========================================
    // MÉTHODES DOM
    // ========================================
    function createContainer(id, config) {
        const container = document.createElement('div');
        container.id = id;
        container.className = config.classes.panel;
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Filtres');
        
        // Header (si nécessaire)
        if (config.mode === 'advanced' || config.features.presets.enabled) {
            const header = createHeader(config);
            container.appendChild(header);
        }
        
        // Body
        const body = document.createElement('div');
        body.className = config.classes.body;
        container.appendChild(body);
        
        // Footer (si mode avancé)
        if (config.mode === 'advanced' || !config.mode.instant) {
            const footer = createFooter(config);
            container.appendChild(footer);
        }
        
        // Appliquer le style
        applyStyle(container, config);
        
        return container;
    }

    function createHeader(config) {
        const header = document.createElement('div');
        header.className = config.classes.header;
        
        // Titre
        const title = document.createElement('h3');
        title.className = 'filter-panel-title';
        title.textContent = 'Filtres';
        header.appendChild(title);
        
        // Actions header
        const actions = document.createElement('div');
        actions.className = 'filter-header-actions';
        
        // Presets
        if (config.features.presets.enabled) {
            const presetButton = createPresetButton(config);
            actions.appendChild(presetButton);
        }
        
        // Clear all
        const clearAllButton = document.createElement('button');
        clearAllButton.className = 'filter-clear-all';
        clearAllButton.innerHTML = `<span>🗑️</span> ${config.i18n.clearAll}`;
        clearAllButton.addEventListener('click', () => {
            const instance = instances.get(container.id);
            clearFilters(instance);
        });
        actions.appendChild(clearAllButton);
        
        header.appendChild(actions);
        
        return header;
    }

    function createFooter(config) {
        const footer = document.createElement('div');
        footer.className = config.classes.footer;
        
        // Bouton Clear
        const clearButton = document.createElement('button');
        clearButton.className = `${config.classes.clear} filter-button secondary`;
        clearButton.textContent = config.i18n.clear;
        footer.appendChild(clearButton);
        
        // Bouton Apply
        const applyButton = document.createElement('button');
        applyButton.className = `${config.classes.apply} filter-button primary`;
        applyButton.textContent = config.i18n.apply;
        footer.appendChild(applyButton);
        
        return footer;
    }

    // ========================================
    // MÉTHODES DE CRÉATION DE FILTRES
    // ========================================
    function createFilterElement(field, options, instance) {
        const filterConfig = {
            ...CONFIG.filterTypes[options.type || 'text'],
            ...options
        };
        
        const filterEl = document.createElement('div');
        filterEl.className = `${instance.config.classes.filter} filter-type-${options.type}`;
        filterEl.setAttribute('data-field', field);
        
        // Label
        if (instance.config.mode.showLabels) {
            const label = document.createElement('label');
            label.className = instance.config.classes.label;
            label.textContent = options.label || field;
            label.setAttribute('for', `filter-${field}`);
            filterEl.appendChild(label);
        }
        
        // Container pour operator + value
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'filter-controls';
        
        // Operator (si mode avancé)
        if (instance.config.mode.showOperators && filterConfig.operators.length > 1) {
            const operator = createOperatorSelect(field, filterConfig, instance);
            controlsContainer.appendChild(operator);
        }
        
        // Value control
        const control = createFilterControl(field, filterConfig, instance);
        controlsContainer.appendChild(control);
        
        // Clear button
        if (instance.config.mode.showClear) {
            const clearBtn = document.createElement('button');
            clearBtn.className = 'filter-clear-btn';
            clearBtn.innerHTML = '✕';
            clearBtn.title = 'Effacer';
            clearBtn.addEventListener('click', () => {
                clearFilter(instance, field);
            });
            controlsContainer.appendChild(clearBtn);
        }
        
        filterEl.appendChild(controlsContainer);
        
        // Animation d'entrée
        if (instance.config.animations[instance.config.animation].enabled) {
            animateIn(filterEl, instance.config);
        }
        
        return filterEl;
    }

    function createFilterControl(field, config, instance) {
        const container = document.createElement('div');
        container.className = `${instance.config.classes.control} filter-${config.type}`;
        
        switch (config.type) {
            case 'text':
                return createTextFilter(field, config, instance);
                
            case 'number':
                return createNumberFilter(field, config, instance);
                
            case 'select':
            case 'multiselect':
                return createSelectFilter(field, config, instance);
                
            case 'date':
                return createDateFilter(field, config, instance);
                
            case 'daterange':
                return createDateRangeFilter(field, config, instance);
                
            case 'boolean':
                return createBooleanFilter(field, config, instance);
                
            case 'range':
                return createRangeFilter(field, config, instance);
                
            case 'tags':
                return createTagsFilter(field, config, instance);
                
            case 'rating':
                return createRatingFilter(field, config, instance);
                
            case 'color':
                return createColorFilter(field, config, instance);
                
            case 'status':
                return createStatusFilter(field, config, instance);
                
            case 'custom':
                if (config.component) {
                    return config.component(field, config, instance);
                }
                break;
        }
        
        return container;
    }

    // ========================================
    // TYPES DE FILTRES SPÉCIFIQUES
    // ========================================
    function createTextFilter(field, config, instance) {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `filter-${field}`;
        input.className = 'filter-input filter-text';
        input.placeholder = config.placeholder;
        
        // Icon
        if (config.icon) {
            const wrapper = document.createElement('div');
            wrapper.className = 'filter-input-wrapper';
            
            const icon = document.createElement('span');
            icon.className = 'filter-icon';
            icon.textContent = config.icon;
            wrapper.appendChild(icon);
            
            wrapper.appendChild(input);
            
            // Gestion du focus
            input.addEventListener('focus', () => wrapper.classList.add('focused'));
            input.addEventListener('blur', () => wrapper.classList.remove('focused'));
            
            // Événements
            if (config.debounce) {
                input.addEventListener('input', debounce((e) => {
                    updateFilter(instance, field, e.target.value);
                }, config.debounce));
            } else {
                input.addEventListener('change', (e) => {
                    updateFilter(instance, field, e.target.value);
                });
            }
            
            return wrapper;
        }
        
        // Sans icon
        input.addEventListener('input', debounce((e) => {
            updateFilter(instance, field, e.target.value);
        }, config.debounce || 300));
        
        return input;
    }

    function createNumberFilter(field, config, instance) {
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `filter-${field}`;
        input.className = 'filter-input filter-number';
        input.placeholder = config.placeholder;
        
        if (config.min !== null) input.min = config.min;
        if (config.max !== null) input.max = config.max;
        if (config.step) input.step = config.step;
        
        input.addEventListener('change', (e) => {
            const value = e.target.value ? parseFloat(e.target.value) : null;
            updateFilter(instance, field, value);
        });
        
        return input;
    }

    function createSelectFilter(field, config, instance) {
        const wrapper = document.createElement('div');
        wrapper.className = 'filter-select-wrapper';
        
        // Pour multiselect, créer un composant plus complexe
        if (config.multiple) {
            return createMultiSelect(field, config, instance);
        }
        
        // Select simple
        const select = document.createElement('select');
        select.id = `filter-${field}`;
        select.className = 'filter-select';
        
        // Option vide
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = config.placeholder;
        select.appendChild(emptyOption);
        
        // Options
        if (config.options) {
            config.options.forEach(option => {
                const optionEl = document.createElement('option');
                if (typeof option === 'object') {
                    optionEl.value = option.value;
                    optionEl.textContent = option.label;
                    if (option.disabled) optionEl.disabled = true;
                } else {
                    optionEl.value = option;
                    optionEl.textContent = option;
                }
                select.appendChild(optionEl);
            });
        }
        
        select.addEventListener('change', (e) => {
            updateFilter(instance, field, e.target.value || null);
        });
        
        wrapper.appendChild(select);
        
        // Bouton clear si activé
        if (config.clearable && select.value) {
            const clearBtn = createClearButton(() => {
                select.value = '';
                updateFilter(instance, field, null);
            });
            wrapper.appendChild(clearBtn);
        }
        
        return wrapper;
    }

    function createMultiSelect(field, config, instance) {
        const container = document.createElement('div');
        container.className = 'filter-multiselect';
        
        // Selected tags container
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'filter-multiselect-tags';
        
        // Input
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'filter-multiselect-input';
        input.placeholder = config.placeholder;
        
        // Dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'filter-multiselect-dropdown';
        dropdown.style.display = 'none';
        
        // Options
        const selectedValues = new Set();
        
        function renderOptions(filter = '') {
            dropdown.innerHTML = '';
            
            config.options.forEach(option => {
                const value = typeof option === 'object' ? option.value : option;
                const label = typeof option === 'object' ? option.label : option;
                
                if (filter && !label.toLowerCase().includes(filter.toLowerCase())) {
                    return;
                }
                
                const optionEl = document.createElement('div');
                optionEl.className = 'filter-multiselect-option';
                if (selectedValues.has(value)) {
                    optionEl.classList.add('selected');
                }
                
                optionEl.innerHTML = `
                    <input type="checkbox" ${selectedValues.has(value) ? 'checked' : ''}>
                    <span>${label}</span>
                `;
                
                optionEl.addEventListener('click', () => {
                    if (selectedValues.has(value)) {
                        selectedValues.delete(value);
                    } else {
                        selectedValues.add(value);
                    }
                    renderTags();
                    renderOptions(input.value);
                    updateFilter(instance, field, Array.from(selectedValues));
                });
                
                dropdown.appendChild(optionEl);
            });
        }
        
        function renderTags() {
            tagsContainer.innerHTML = '';
            
            selectedValues.forEach(value => {
                const tag = document.createElement('span');
                tag.className = 'filter-tag';
                
                const label = config.options.find(opt => 
                    (typeof opt === 'object' ? opt.value : opt) === value
                );
                tag.innerHTML = `
                    <span>${typeof label === 'object' ? label.label : label}</span>
                    <button class="filter-tag-remove">✕</button>
                `;
                
                tag.querySelector('.filter-tag-remove').addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectedValues.delete(value);
                    renderTags();
                    renderOptions(input.value);
                    updateFilter(instance, field, Array.from(selectedValues));
                });
                
                tagsContainer.appendChild(tag);
            });
        }
        
        // Événements
        input.addEventListener('focus', () => {
            dropdown.style.display = 'block';
            renderOptions();
        });
        
        input.addEventListener('input', (e) => {
            renderOptions(e.target.value);
        });
        
        // Fermer au clic externe
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        container.appendChild(tagsContainer);
        container.appendChild(input);
        container.appendChild(dropdown);
        
        return container;
    }

    function createDateFilter(field, config, instance) {
        const input = document.createElement('input');
        input.type = 'date';
        input.id = `filter-${field}`;
        input.className = 'filter-input filter-date';
        
        if (config.minDate) input.min = config.minDate;
        if (config.maxDate) input.max = config.maxDate;
        
        input.addEventListener('change', (e) => {
            updateFilter(instance, field, e.target.value || null);
        });
        
        return input;
    }

    function createDateRangeFilter(field, config, instance) {
        const container = document.createElement('div');
        container.className = 'filter-daterange';
        
        // From date
        const fromInput = document.createElement('input');
        fromInput.type = 'date';
        fromInput.className = 'filter-input filter-date-from';
        fromInput.placeholder = 'Du';
        
        // Separator
        const separator = document.createElement('span');
        separator.className = 'filter-daterange-separator';
        separator.textContent = config.separator || ' - ';
        
        // To date
        const toInput = document.createElement('input');
        toInput.type = 'date';
        toInput.className = 'filter-input filter-date-to';
        toInput.placeholder = 'Au';
        
        // Quick presets
        const presets = document.createElement('div');
        presets.className = 'filter-daterange-presets';
        
        const quickDates = [
            { label: '7 jours', days: 7 },
            { label: '30 jours', days: 30 },
            { label: '90 jours', days: 90 }
        ];
        
        quickDates.forEach(preset => {
            const btn = document.createElement('button');
            btn.className = 'filter-preset-btn';
            btn.textContent = preset.label;
            btn.addEventListener('click', () => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - preset.days);
                
                fromInput.value = start.toISOString().split('T')[0];
                toInput.value = end.toISOString().split('T')[0];
                
                updateFilter(instance, field, {
                    from: fromInput.value,
                    to: toInput.value
                });
            });
            presets.appendChild(btn);
        });
        
        // Update on change
        function updateRange() {
            if (fromInput.value || toInput.value) {
                updateFilter(instance, field, {
                    from: fromInput.value || null,
                    to: toInput.value || null
                });
            } else {
                updateFilter(instance, field, null);
            }
        }
        
        fromInput.addEventListener('change', updateRange);
        toInput.addEventListener('change', updateRange);
        
        container.appendChild(fromInput);
        container.appendChild(separator);
        container.appendChild(toInput);
        container.appendChild(presets);
        
        return container;
    }

    function createBooleanFilter(field, config, instance) {
        const container = document.createElement('div');
        container.className = 'filter-boolean';
        
        const options = [
            { value: '', label: config.labels.null || 'Tous' },
            { value: 'true', label: config.labels.true || 'Oui' },
            { value: 'false', label: config.labels.false || 'Non' }
        ];
        
        options.forEach(option => {
            const label = document.createElement('label');
            label.className = 'filter-boolean-option';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `filter-${field}`;
            input.value = option.value;
            if (!option.value) input.checked = true;
            
            input.addEventListener('change', (e) => {
                const value = e.target.value === '' ? null : 
                            e.target.value === 'true';
                updateFilter(instance, field, value);
            });
            
            label.appendChild(input);
            label.appendChild(document.createTextNode(' ' + option.label));
            container.appendChild(label);
        });
        
        return container;
    }

    function createRangeFilter(field, config, instance) {
        const container = document.createElement('div');
        container.className = 'filter-range';
        
        // Value display
        if (config.showValue) {
            const valueDisplay = document.createElement('div');
            valueDisplay.className = 'filter-range-value';
            container.appendChild(valueDisplay);
        }
        
        // Slider container
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'filter-range-slider';
        
        if (config.dual) {
            // Double slider pour range
            const minSlider = document.createElement('input');
            minSlider.type = 'range';
            minSlider.className = 'filter-range-min';
            minSlider.min = config.min;
            minSlider.max = config.max;
            minSlider.step = config.step;
            minSlider.value = config.min;
            
            const maxSlider = document.createElement('input');
            maxSlider.type = 'range';
            maxSlider.className = 'filter-range-max';
            maxSlider.min = config.min;
            maxSlider.max = config.max;
            maxSlider.step = config.step;
            maxSlider.value = config.max;
            
            function updateRange() {
                const min = parseFloat(minSlider.value);
                const max = parseFloat(maxSlider.value);
                
                if (min > max) {
                    [minSlider.value, maxSlider.value] = [maxSlider.value, minSlider.value];
                }
                
                if (config.showValue) {
                    container.querySelector('.filter-range-value').textContent = 
                        `${minSlider.value} - ${maxSlider.value}`;
                }
                
                updateFilter(instance, field, {
                    min: parseFloat(minSlider.value),
                    max: parseFloat(maxSlider.value)
                });
            }
            
            minSlider.addEventListener('input', updateRange);
            maxSlider.addEventListener('input', updateRange);
            
            sliderContainer.appendChild(minSlider);
            sliderContainer.appendChild(maxSlider);
            
            // Initial display
            updateRange();
        } else {
            // Simple slider
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'filter-range-single';
            slider.min = config.min;
            slider.max = config.max;
            slider.step = config.step;
            slider.value = config.min;
            
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (config.showValue) {
                    container.querySelector('.filter-range-value').textContent = value;
                }
                updateFilter(instance, field, value);
            });
            
            sliderContainer.appendChild(slider);
        }
        
        container.appendChild(sliderContainer);
        
        // Min/Max labels
        const labels = document.createElement('div');
        labels.className = 'filter-range-labels';
        labels.innerHTML = `
            <span>${config.min}</span>
            <span>${config.max}</span>
        `;
        container.appendChild(labels);
        
        return container;
    }

    function createRatingFilter(field, config, instance) {
        const container = document.createElement('div');
        container.className = 'filter-rating';
        
        let currentRating = 0;
        
        // Stars
        const starsContainer = document.createElement('div');
        starsContainer.className = 'filter-rating-stars';
        
        for (let i = 1; i <= config.max; i++) {
            const star = document.createElement('span');
            star.className = 'filter-rating-star';
            star.innerHTML = '☆';
            star.dataset.rating = i;
            
            star.addEventListener('click', () => {
                currentRating = currentRating === i ? 0 : i;
                updateStars();
                updateFilter(instance, field, currentRating || null);
            });
            
            star.addEventListener('mouseenter', () => {
                highlightStars(i);
            });
            
            starsContainer.appendChild(star);
        }
        
        starsContainer.addEventListener('mouseleave', () => {
            updateStars();
        });
        
        function updateStars() {
            const stars = starsContainer.querySelectorAll('.filter-rating-star');
            stars.forEach((star, index) => {
                star.innerHTML = index < currentRating ? '★' : '☆';
                star.classList.toggle('filled', index < currentRating);
            });
            
            if (config.showValue && valueDisplay) {
                valueDisplay.textContent = currentRating || '';
            }
        }
        
        function highlightStars(rating) {
            const stars = starsContainer.querySelectorAll('.filter-rating-star');
            stars.forEach((star, index) => {
                star.classList.toggle('hover', index < rating);
            });
        }
        
        container.appendChild(starsContainer);
        
        // Value display
        if (config.showValue) {
            const valueDisplay = document.createElement('span');
            valueDisplay.className = 'filter-rating-value';
            container.appendChild(valueDisplay);
        }
        
        // Clear button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'filter-rating-clear';
        clearBtn.textContent = '✕';
        clearBtn.addEventListener('click', () => {
            currentRating = 0;
            updateStars();
            updateFilter(instance, field, null);
        });
        container.appendChild(clearBtn);
        
        return container;
    }

    function createTagsFilter(field, config, instance) {
        const container = document.createElement('div');
        container.className = 'filter-tags';
        
        const tags = new Set();
        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'filter-tags-list';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'filter-tags-input';
        input.placeholder = config.placeholder;
        
        // Suggestions dropdown
        const suggestions = document.createElement('div');
        suggestions.className = 'filter-tags-suggestions';
        suggestions.style.display = 'none';
        
        function addTag(value) {
            if (value && !tags.has(value)) {
                tags.add(value);
                renderTags();
                updateFilter(instance, field, Array.from(tags));
                input.value = '';
            }
        }
        
        function renderTags() {
            tagsContainer.innerHTML = '';
            tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'filter-tag';
                tagEl.innerHTML = `
                    <span>${tag}</span>
                    <button class="filter-tag-remove">✕</button>
                `;
                
                tagEl.querySelector('.filter-tag-remove').addEventListener('click', () => {
                    tags.delete(tag);
                    renderTags();
                    updateFilter(instance, field, Array.from(tags));
                });
                
                tagsContainer.appendChild(tagEl);
            });
        }
        
        // Input events
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag(input.value.trim());
            } else if (e.key === 'Backspace' && !input.value && tags.size > 0) {
                const lastTag = Array.from(tags).pop();
                tags.delete(lastTag);
                renderTags();
                updateFilter(instance, field, Array.from(tags));
            }
        });
        
        // Autocomplete
        if (config.autocomplete && config.suggestions) {
            input.addEventListener('input', (e) => {
                const value = e.target.value.toLowerCase();
                if (value) {
                    const matches = config.suggestions.filter(s => 
                        s.toLowerCase().includes(value) && !tags.has(s)
                    );
                    
                    if (matches.length > 0) {
                        suggestions.innerHTML = '';
                        matches.slice(0, 5).forEach(match => {
                            const item = document.createElement('div');
                            item.className = 'filter-tags-suggestion';
                            item.textContent = match;
                            item.addEventListener('click', () => {
                                addTag(match);
                                suggestions.style.display = 'none';
                            });
                            suggestions.appendChild(item);
                        });
                        suggestions.style.display = 'block';
                    } else {
                        suggestions.style.display = 'none';
                    }
                } else {
                    suggestions.style.display = 'none';
                }
            });
        }
        
        container.appendChild(tagsContainer);
        container.appendChild(input);
        container.appendChild(suggestions);
        
        return container;
    }

    // ========================================
    // MÉTHODES DE GESTION DES FILTRES
    // ========================================
    function addFilter(instance, field, options) {
        if (instance.filters.has(field)) {
            console.warn(`Filter ${field} already exists`);
            return;
        }
        
        // Ajouter à la config
        instance.filters.set(field, options);
        
        // Créer l'élément
        const filterEl = createFilterElement(field, options, instance);
        
        // Ajouter au DOM
        const body = instance.container.querySelector(`.${instance.config.classes.body}`);
        body.appendChild(filterEl);
        
        // Émettre événement
        emit(instance, 'filterAdded', { field, options });
    }

    function removeFilter(instance, field) {
        if (!instance.filters.has(field)) {
            return;
        }
        
        // Retirer de la config
        instance.filters.delete(field);
        instance.activeFilters.delete(field);
        
        // Retirer du DOM
        const filterEl = instance.container.querySelector(`[data-field="${field}"]`);
        if (filterEl) {
            animateOut(filterEl, instance.config, () => {
                filterEl.remove();
            });
        }
        
        // Émettre événement
        emit(instance, 'filterRemoved', { field });
        
        // Appliquer si instant
        if (instance.config.mode.instant) {
            applyFilters(instance);
        }
    }

    function updateFilter(instance, field, value) {
        // Valider
        if (instance.config.features.validation.enabled) {
            const isValid = validateFilter(instance, field, value);
            if (!isValid && instance.config.features.validation.preventInvalid) {
                return;
            }
        }
        
        // Mettre à jour
        if (value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
            instance.activeFilters.delete(field);
        } else {
            instance.activeFilters.set(field, value);
        }
        
        // Historique
        if (instance.config.features.history.enabled) {
            addToHistory(instance);
        }
        
        // Émettre événement
        emit(instance, 'filterChanged', { 
            field, 
            value,
            filters: getActiveFilters(instance)
        });
        
        // Appliquer si instant
        if (instance.config.mode.instant) {
            applyFilters(instance);
        }
    }

    function clearFilter(instance, field) {
        instance.activeFilters.delete(field);
        
        // Reset UI
        const filterEl = instance.container.querySelector(`[data-field="${field}"]`);
        if (filterEl) {
            const inputs = filterEl.querySelectorAll('input, select');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = false;
                } else {
                    input.value = '';
                }
            });
        }
        
        // Émettre événement
        emit(instance, 'filterCleared', { field });
        
        // Appliquer si instant
        if (instance.config.mode.instant) {
            applyFilters(instance);
        }
    }

    function clearFilters(instance) {
        instance.activeFilters.clear();
        
        // Reset tous les inputs
        const inputs = instance.container.querySelectorAll('input, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
        
        // Émettre événement
        emit(instance, 'filtersCleared');
        
        // Appliquer
        if (instance.config.mode.instant) {
            applyFilters(instance);
        }
    }

    function applyFilters(instance) {
        const filters = getActiveFilters(instance);
        
        // Sauvegarder si persistance
        if (instance.config.features.persistence.enabled && 
            instance.config.features.persistence.autoSave) {
            saveFilters(instance, filters);
        }
        
        // Émettre événement
        emit(instance, 'filtersApplied', { filters });
    }

    function getActiveFilters(instance) {
        const filters = {};
        
        instance.activeFilters.forEach((value, field) => {
            const filterConfig = instance.filters.get(field);
            if (filterConfig) {
                filters[field] = {
                    value,
                    type: filterConfig.type,
                    operator: filterConfig.operator || 
                             CONFIG.filterTypes[filterConfig.type].operators[0]
                };
            }
        });
        
        return filters;
    }

    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    function createState(config) {
        return {
            loading: false,
            events: new Map(),
            historyIndex: -1
        };
    }

    function loadCSS() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/filter-panel.component.css';
        document.head.appendChild(link);
    }

    function applyStyle(container, config) {
        const styleConfig = CONFIG.styles[config.style];
        if (!styleConfig) return;
        
        // Panel styles
        if (styleConfig.panel) {
            Object.assign(container.style, styleConfig.panel);
        }
        
        // Layout
        const layoutConfig = CONFIG.layouts[config.layout];
        if (layoutConfig) {
            const body = container.querySelector(`.${config.classes.body}`);
            if (layoutConfig.direction) {
                body.style.display = 'flex';
                body.style.flexDirection = layoutConfig.direction;
                body.style.gap = layoutConfig.gap;
                if (layoutConfig.wrap) body.style.flexWrap = 'wrap';
                if (layoutConfig.align) body.style.alignItems = layoutConfig.align;
            } else if (layoutConfig.columns) {
                body.style.display = 'grid';
                body.style.gridTemplateColumns = `repeat(${layoutConfig.columns}, minmax(${layoutConfig.minWidth}, 1fr))`;
                body.style.gap = layoutConfig.gap;
            }
        }
    }

    function animateIn(element, config) {
        const animConfig = CONFIG.animations[config.animation];
        if (!animConfig.enabled) return;
        
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        
        requestAnimationFrame(() => {
            element.style.transition = `all ${animConfig.duration}ms ${animConfig.easing}`;
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    function animateOut(element, config, callback) {
        const animConfig = CONFIG.animations[config.animation];
        if (!animConfig.enabled) {
            if (callback) callback();
            return;
        }
        
        element.style.transition = `all ${animConfig.duration}ms ${animConfig.easing}`;
        element.style.opacity = '0';
        element.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            if (callback) callback();
        }, animConfig.duration);
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function emit(instance, event, data) {
        const handlers = instance.state.events.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    function on(instance, event, handler) {
        if (!instance.state.events.has(event)) {
            instance.state.events.set(event, new Set());
        }
        instance.state.events.get(event).add(handler);
    }

    function off(instance, event, handler) {
        const handlers = instance.state.events.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    function initialize(instance) {
        // Charger les filtres initiaux
        if (instance.config.filters && instance.config.filters.length > 0) {
            instance.config.filters.forEach(filter => {
                addFilter(instance, filter.field, filter);
            });
        }
        
        // Charger depuis persistence
        if (instance.config.features.persistence.enabled && 
            instance.config.features.persistence.autoLoad) {
            loadFilters(instance);
        }
        
        // Event listeners globaux
        if (instance.config.mode === 'advanced') {
            const applyBtn = instance.container.querySelector(`.${instance.config.classes.apply}`);
            if (applyBtn) {
                applyBtn.addEventListener('click', () => applyFilters(instance));
            }
            
            const clearBtn = instance.container.querySelector(`.${instance.config.classes.clear}`);
            if (clearBtn) {
                clearBtn.addEventListener('click', () => clearFilters(instance));
            }
        }
    }

    function destroy(instance) {
        // Retirer du DOM
        if (instance.container.parentNode) {
            instance.container.parentNode.removeChild(instance.container);
        }
        
        // Nettoyer
        instances.delete(instance.id);
        instance.state.events.clear();
        instance.filters.clear();
        instance.activeFilters.clear();
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create,
        CONFIG,
        instances,
        version: '1.0.0',
        
        // Méthodes utilitaires
        getInstance: (id) => instances.get(id),
        
        destroyAll: () => {
            instances.forEach(instance => destroy(instance));
            instances.clear();
        }
    };
})();

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterPanel;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [Date création] - Types de filtres complexes
   Solution: Factory pattern pour chaque type
   
   [Date création] - Gestion des états multiples
   Solution: Map pour activeFilters vs filters config
   
   [Date création] - Performance avec beaucoup de filtres
   Solution: Debounce et mode instant optionnel
   
   NOTES POUR REPRISES FUTURES:
   - Les filtres custom nécessitent une fonction component
   - La validation est extensible via validateFilter
   - Les événements permettent intégration externe
   - Le CSS gère tous les états visuels
   ======================================== */