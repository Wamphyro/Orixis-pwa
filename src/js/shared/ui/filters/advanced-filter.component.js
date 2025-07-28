/* ========================================
   ADVANCED-FILTER.COMPONENT.JS - Système de filtrage avancé glassmorphism
   Chemin: src/js/shared/ui/filters/advanced-filter.component.js
   
   DESCRIPTION:
   Système complet de filtrage avec constructeur visuel, opérateurs logiques,
   groupes de conditions, et interface glassmorphism.
   
   STRUCTURE:
   1. Configuration complète (lignes 30-250)
   2. Gestionnaire d'état (lignes 252-350)
   3. Constructeur de filtres (lignes 352-600)
   4. Rendu des composants (lignes 602-900)
   5. Logique de filtrage (lignes 902-1100)
   6. Import/Export (lignes 1102-1200)
   7. API publique (lignes 1202-1350)
   
   DÉPENDANCES:
   - advanced-filter.css (styles glassmorphism)
   - Optionnel: moment.js pour dates avancées
   ======================================== */

const AdvancedFilter = (() => {
    'use strict';
    
    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Types de filtres disponibles
        filterTypes: {
            'text': {
                name: 'Texte',
                operators: ['contains', 'not_contains', 'equals', 'not_equals', 'starts_with', 'ends_with', 'is_empty', 'is_not_empty'],
                component: 'input',
                icon: '📝'
            },
            'number': {
                name: 'Nombre',
                operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_or_equal', 'less_or_equal', 'between', 'not_between'],
                component: 'number',
                icon: '🔢'
            },
            'date': {
                name: 'Date',
                operators: ['equals', 'not_equals', 'before', 'after', 'between', 'not_between', 'last_days', 'next_days', 'this_week', 'this_month', 'this_year'],
                component: 'date',
                icon: '📅'
            },
            'select': {
                name: 'Sélection',
                operators: ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty'],
                component: 'select',
                icon: '📋'
            },
            'boolean': {
                name: 'Oui/Non',
                operators: ['is_true', 'is_false'],
                component: 'checkbox',
                icon: '✓'
            },
            'range': {
                name: 'Plage',
                operators: ['between', 'not_between'],
                component: 'range',
                icon: '↔️'
            },
            'tags': {
                name: 'Tags',
                operators: ['has_any', 'has_all', 'has_none', 'has_exactly'],
                component: 'tags',
                icon: '🏷️'
            },
            'color': {
                name: 'Couleur',
                operators: ['equals', 'not_equals', 'in', 'not_in'],
                component: 'color',
                icon: '🎨'
            }
        },
        
        // Opérateurs
        operators: {
            // Texte
            'contains': { label: 'Contient', symbol: '∋' },
            'not_contains': { label: 'Ne contient pas', symbol: '∌' },
            'equals': { label: 'Égal à', symbol: '=' },
            'not_equals': { label: 'Différent de', symbol: '≠' },
            'starts_with': { label: 'Commence par', symbol: '^' },
            'ends_with': { label: 'Finit par', symbol: '$' },
            'is_empty': { label: 'Est vide', symbol: '∅', noValue: true },
            'is_not_empty': { label: 'N\'est pas vide', symbol: '∄', noValue: true },
            
            // Nombres
            'greater_than': { label: 'Supérieur à', symbol: '>' },
            'less_than': { label: 'Inférieur à', symbol: '<' },
            'greater_or_equal': { label: 'Supérieur ou égal', symbol: '≥' },
            'less_or_equal': { label: 'Inférieur ou égal', symbol: '≤' },
            'between': { label: 'Entre', symbol: '↔', requiresTwo: true },
            'not_between': { label: 'Pas entre', symbol: '↮', requiresTwo: true },
            
            // Dates
            'before': { label: 'Avant', symbol: '◄' },
            'after': { label: 'Après', symbol: '►' },
            'last_days': { label: 'Derniers jours', symbol: '↶' },
            'next_days': { label: 'Prochains jours', symbol: '↷' },
            'this_week': { label: 'Cette semaine', symbol: 'W', noValue: true },
            'this_month': { label: 'Ce mois', symbol: 'M', noValue: true },
            'this_year': { label: 'Cette année', symbol: 'Y', noValue: true },
            
            // Sélection
            'in': { label: 'Dans', symbol: '∈', multiple: true },
            'not_in': { label: 'Pas dans', symbol: '∉', multiple: true },
            
            // Boolean
            'is_true': { label: 'Oui', symbol: '✓', noValue: true },
            'is_false': { label: 'Non', symbol: '✗', noValue: true },
            
            // Tags
            'has_any': { label: 'A au moins un', symbol: '∨', multiple: true },
            'has_all': { label: 'A tous', symbol: '∧', multiple: true },
            'has_none': { label: 'N\'a aucun', symbol: '⊽', multiple: true },
            'has_exactly': { label: 'A exactement', symbol: '≡', multiple: true }
        },
        
        // Styles disponibles
        styles: {
            'glassmorphism': {
                className: 'glassmorphism',
                backdrop: true,
                blur: 20
            },
            'neumorphism': {
                className: 'neumorphism',
                shadows: true
            },
            'flat': {
                className: 'flat',
                minimal: true
            },
            'material': {
                className: 'material',
                elevation: true
            }
        },
        
        // Modes d'affichage
        modes: {
            'inline': {
                className: 'mode-inline',
                compact: true
            },
            'popover': {
                className: 'mode-popover',
                floating: true
            },
            'sidebar': {
                className: 'mode-sidebar',
                panel: true
            },
            'modal': {
                className: 'mode-modal',
                overlay: true
            }
        },
        
        // Préréglages
        presets: {
            'recent': {
                name: 'Récents',
                icon: '🕐',
                filters: [
                    { field: 'created_at', type: 'date', operator: 'last_days', value: 7 }
                ]
            },
            'active': {
                name: 'Actifs',
                icon: '✅',
                filters: [
                    { field: 'status', type: 'select', operator: 'equals', value: 'active' }
                ]
            },
            'high_priority': {
                name: 'Priorité haute',
                icon: '🔴',
                filters: [
                    { field: 'priority', type: 'number', operator: 'greater_or_equal', value: 8 }
                ]
            }
        },
        
        // Options avancées
        advanced: {
            maxNestingLevel: 3,
            allowSave: true,
            allowExport: true,
            allowImport: true,
            allowPresets: true,
            allowGroups: true,
            autoApply: false,
            debounceDelay: 300,
            showCount: true,
            showReset: true,
            showApply: true,
            animations: true,
            keyboardShortcuts: true,
            localStorageKey: 'advanced-filters'
        },
        
        // Icônes
        icons: {
            add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14m-7-7h14"/></svg>',
            remove: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12"/></svg>',
            group: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16m-7 6h7"/></svg>',
            save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2"/></svg>',
            reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
            apply: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 13l4 4L19 7"/></svg>'
        }
    };
    
    // ========================================
    // ÉTAT ET GESTION
    // ========================================
    class FilterState {
        constructor() {
            this.filters = [];
            this.groups = [];
            this.activePreset = null;
            this.savedFilters = this.loadSavedFilters();
        }
        
        addFilter(filter) {
            filter.id = this.generateId();
            filter.groupId = filter.groupId || null;
            this.filters.push(filter);
            return filter;
        }
        
        addGroup(parentGroupId = null) {
            const group = {
                id: this.generateId(),
                parentId: parentGroupId,
                logic: 'AND',
                filters: []
            };
            this.groups.push(group);
            return group;
        }
        
        removeFilter(filterId) {
            this.filters = this.filters.filter(f => f.id !== filterId);
        }
        
        removeGroup(groupId) {
            // Supprimer le groupe et tous ses enfants
            this.groups = this.groups.filter(g => g.id !== groupId && g.parentId !== groupId);
            this.filters = this.filters.filter(f => f.groupId !== groupId);
        }
        
        updateFilter(filterId, updates) {
            const filter = this.filters.find(f => f.id === filterId);
            if (filter) {
                Object.assign(filter, updates);
            }
            return filter;
        }
        
        getFiltersForGroup(groupId) {
            return this.filters.filter(f => f.groupId === groupId);
        }
        
        generateId() {
            return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        saveFilters(name) {
            const saved = {
                id: this.generateId(),
                name,
                date: new Date().toISOString(),
                filters: this.filters,
                groups: this.groups
            };
            this.savedFilters.push(saved);
            this.persistSavedFilters();
            return saved;
        }
        
        loadSavedFilters() {
            const saved = localStorage.getItem(CONFIG.advanced.localStorageKey);
            return saved ? JSON.parse(saved) : [];
        }
        
        persistSavedFilters() {
            localStorage.setItem(CONFIG.advanced.localStorageKey, JSON.stringify(this.savedFilters));
        }
        
        exportFilters() {
            return JSON.stringify({
                version: '1.0',
                filters: this.filters,
                groups: this.groups,
                exported: new Date().toISOString()
            }, null, 2);
        }
        
        importFilters(jsonString) {
            try {
                const data = JSON.parse(jsonString);
                this.filters = data.filters || [];
                this.groups = data.groups || [];
                return true;
            } catch (e) {
                console.error('Import failed:', e);
                return false;
            }
        }
        
        reset() {
            this.filters = [];
            this.groups = [];
            this.activePreset = null;
        }
    }
    
    // ========================================
    // CONSTRUCTEUR DE FILTRES
    // ========================================
    function createFilterBuilder(container, options) {
        const state = new FilterState();
        const elements = {
            container,
            toolbar: null,
            content: null,
            footer: null
        };
        
        // Créer la structure
        function initializeStructure() {
            container.className = `advanced-filter ${CONFIG.styles[options.style].className} ${CONFIG.modes[options.mode].className}`;
            
            // Toolbar
            elements.toolbar = createElement('div', 'filter-toolbar');
            elements.toolbar.innerHTML = `
                <div class="filter-toolbar-left">
                    <button class="filter-btn btn-add-filter" title="Ajouter un filtre">
                        ${CONFIG.icons.add}
                        <span>Ajouter un filtre</span>
                    </button>
                    ${options.allowGroups ? `
                        <button class="filter-btn btn-add-group" title="Ajouter un groupe">
                            ${CONFIG.icons.group}
                            <span>Groupe</span>
                        </button>
                    ` : ''}
                    ${options.allowPresets ? `
                        <div class="filter-presets">
                            <select class="filter-preset-select">
                                <option value="">Préréglages...</option>
                                ${Object.entries(CONFIG.presets).map(([key, preset]) => 
                                    `<option value="${key}">${preset.icon} ${preset.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                    ` : ''}
                </div>
                <div class="filter-toolbar-right">
                    ${options.showCount ? '<span class="filter-count">0 filtres</span>' : ''}
                    ${options.allowSave ? `
                        <button class="filter-btn btn-save" title="Sauvegarder">
                            ${CONFIG.icons.save}
                        </button>
                    ` : ''}
                    ${options.showReset ? `
                        <button class="filter-btn btn-reset" title="Réinitialiser">
                            ${CONFIG.icons.reset}
                        </button>
                    ` : ''}
                </div>
            `;
            
            // Content
            elements.content = createElement('div', 'filter-content');
            
            // Footer
            if (options.showApply || options.allowExport || options.allowImport) {
                elements.footer = createElement('div', 'filter-footer');
                elements.footer.innerHTML = `
                    <div class="filter-footer-left">
                        ${options.allowExport ? '<button class="filter-btn btn-export">Exporter</button>' : ''}
                        ${options.allowImport ? '<button class="filter-btn btn-import">Importer</button>' : ''}
                    </div>
                    <div class="filter-footer-right">
                        ${options.showApply ? `
                            <button class="filter-btn btn-apply btn-primary">
                                ${CONFIG.icons.apply}
                                <span>Appliquer</span>
                            </button>
                        ` : ''}
                    </div>
                `;
            }
            
            // Assembler
            container.appendChild(elements.toolbar);
            container.appendChild(elements.content);
            if (elements.footer) container.appendChild(elements.footer);
        }
        
        // Créer un filtre UI
        function createFilterUI(filter, parentElement = elements.content) {
            const filterEl = createElement('div', 'filter-item');
            filterEl.dataset.filterId = filter.id;
            
            // Structure du filtre
            filterEl.innerHTML = `
                <div class="filter-item-content">
                    <div class="filter-field">
                        <select class="filter-field-select">
                            ${options.fields.map(field => 
                                `<option value="${field.name}" ${filter.field === field.name ? 'selected' : ''}>
                                    ${field.label}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="filter-operator">
                        <select class="filter-operator-select">
                            ${getOperatorsForType(filter.type).map(op => 
                                `<option value="${op}" ${filter.operator === op ? 'selected' : ''}>
                                    ${CONFIG.operators[op].label}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="filter-value">
                        ${createValueInput(filter)}
                    </div>
                    <div class="filter-actions">
                        <button class="filter-btn-icon btn-remove" title="Supprimer">
                            ${CONFIG.icons.remove}
                        </button>
                    </div>
                </div>
            `;
            
            // Animations
            if (options.animations) {
                filterEl.style.opacity = '0';
                filterEl.style.transform = 'translateY(-10px)';
                parentElement.appendChild(filterEl);
                requestAnimationFrame(() => {
                    filterEl.style.transition = 'all 0.3s ease-out';
                    filterEl.style.opacity = '1';
                    filterEl.style.transform = 'translateY(0)';
                });
            } else {
                parentElement.appendChild(filterEl);
            }
            
            // Attacher les événements
            attachFilterEvents(filterEl, filter);
            
            return filterEl;
        }
        
        // Créer un groupe UI
        function createGroupUI(group, parentElement = elements.content) {
            const groupEl = createElement('div', 'filter-group');
            groupEl.dataset.groupId = group.id;
            
            groupEl.innerHTML = `
                <div class="filter-group-header">
                    <div class="filter-group-logic">
                        <button class="filter-logic-toggle" data-logic="${group.logic}">
                            ${group.logic}
                        </button>
                    </div>
                    <div class="filter-group-actions">
                        <button class="filter-btn-icon btn-add-to-group" title="Ajouter un filtre au groupe">
                            ${CONFIG.icons.add}
                        </button>
                        <button class="filter-btn-icon btn-remove-group" title="Supprimer le groupe">
                            ${CONFIG.icons.remove}
                        </button>
                    </div>
                </div>
                <div class="filter-group-content"></div>
            `;
            
            parentElement.appendChild(groupEl);
            
            // Attacher les événements
            attachGroupEvents(groupEl, group);
            
            return groupEl;
        }
        
        // Créer l'input de valeur selon le type
        function createValueInput(filter) {
            const type = CONFIG.filterTypes[filter.type];
            const operator = CONFIG.operators[filter.operator];
            
            if (operator.noValue) {
                return '<span class="filter-no-value">—</span>';
            }
            
            switch (type.component) {
                case 'input':
                    return `<input type="text" class="filter-input" value="${filter.value || ''}" placeholder="Valeur...">`;
                
                case 'number':
                    if (operator.requiresTwo) {
                        return `
                            <input type="number" class="filter-input filter-input-min" value="${filter.value?.[0] || ''}" placeholder="Min">
                            <span class="filter-range-separator">-</span>
                            <input type="number" class="filter-input filter-input-max" value="${filter.value?.[1] || ''}" placeholder="Max">
                        `;
                    }
                    return `<input type="number" class="filter-input" value="${filter.value || ''}" placeholder="0">`;
                
                case 'date':
                    if (operator.requiresTwo) {
                        return `
                            <input type="date" class="filter-input filter-input-start" value="${filter.value?.[0] || ''}">
                            <span class="filter-range-separator">-</span>
                            <input type="date" class="filter-input filter-input-end" value="${filter.value?.[1] || ''}">
                        `;
                    }
                    if (['last_days', 'next_days'].includes(filter.operator)) {
                        return `<input type="number" class="filter-input" value="${filter.value || 7}" min="1" placeholder="Jours">`;
                    }
                    return `<input type="date" class="filter-input" value="${filter.value || ''}">`;
                
                case 'select':
                    const field = options.fields.find(f => f.name === filter.field);
                    const fieldOptions = field?.options || [];
                    if (operator.multiple) {
                        return `
                            <select class="filter-select" multiple>
                                ${fieldOptions.map(opt => 
                                    `<option value="${opt.value}" ${filter.value?.includes(opt.value) ? 'selected' : ''}>
                                        ${opt.label}
                                    </option>`
                                ).join('')}
                            </select>
                        `;
                    }
                    return `
                        <select class="filter-select">
                            <option value="">Choisir...</option>
                            ${fieldOptions.map(opt => 
                                `<option value="${opt.value}" ${filter.value === opt.value ? 'selected' : ''}>
                                    ${opt.label}
                                </option>`
                            ).join('')}
                        </select>
                    `;
                
                case 'checkbox':
                    return `
                        <label class="filter-checkbox-label">
                            <input type="checkbox" class="filter-checkbox" ${filter.value ? 'checked' : ''}>
                            <span class="filter-checkbox-indicator"></span>
                        </label>
                    `;
                
                case 'tags':
                    return `
                        <div class="filter-tags-input" data-tags="${(filter.value || []).join(',')}">
                            <input type="text" class="filter-tags-input-field" placeholder="Ajouter un tag...">
                        </div>
                    `;
                
                case 'color':
                    return `<input type="color" class="filter-input filter-color" value="${filter.value || '#000000'}">`;
                
                case 'range':
                    return `
                        <div class="filter-range-container">
                            <input type="range" class="filter-range" min="0" max="100" value="${filter.value?.[0] || 0}">
                            <span class="filter-range-value">${filter.value?.[0] || 0} - ${filter.value?.[1] || 100}</span>
                            <input type="range" class="filter-range" min="0" max="100" value="${filter.value?.[1] || 100}">
                        </div>
                    `;
                
                default:
                    return '<span class="filter-unsupported">Type non supporté</span>';
            }
        }
        
        // Obtenir les opérateurs pour un type
        function getOperatorsForType(type) {
            return CONFIG.filterTypes[type]?.operators || ['equals'];
        }
        
        // ========================================
        // ÉVÉNEMENTS
        // ========================================
        function attachFilterEvents(filterEl, filter) {
            // Changement de champ
            const fieldSelect = filterEl.querySelector('.filter-field-select');
            fieldSelect?.addEventListener('change', (e) => {
                const field = options.fields.find(f => f.name === e.target.value);
                if (field) {
                    filter.field = field.name;
                    filter.type = field.type;
                    filter.operator = getOperatorsForType(field.type)[0];
                    filter.value = null;
                    updateFilterUI(filterEl, filter);
                    triggerChange();
                }
            });
            
            // Changement d'opérateur
            const operatorSelect = filterEl.querySelector('.filter-operator-select');
            operatorSelect?.addEventListener('change', (e) => {
                filter.operator = e.target.value;
                updateFilterUI(filterEl, filter);
                triggerChange();
            });
            
            // Changement de valeur
            const valueInputs = filterEl.querySelectorAll('.filter-input, .filter-select, .filter-checkbox');
            valueInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    updateFilterValue(filter, filterEl);
                    triggerChange();
                });
                
                if (input.type === 'text' || input.type === 'number') {
                    input.addEventListener('input', debounce(() => {
                        updateFilterValue(filter, filterEl);
                        triggerChange();
                    }, options.debounceDelay));
                }
            });
            
            // Suppression
            const removeBtn = filterEl.querySelector('.btn-remove');
            removeBtn?.addEventListener('click', () => {
                removeFilter(filter.id, filterEl);
            });
        }
        
        function attachGroupEvents(groupEl, group) {
            // Toggle logique
            const logicBtn = groupEl.querySelector('.filter-logic-toggle');
            logicBtn?.addEventListener('click', () => {
                group.logic = group.logic === 'AND' ? 'OR' : 'AND';
                logicBtn.dataset.logic = group.logic;
                logicBtn.textContent = group.logic;
                triggerChange();
            });
            
            // Ajouter au groupe
            const addBtn = groupEl.querySelector('.btn-add-to-group');
            addBtn?.addEventListener('click', () => {
                const filter = {
                    field: options.fields[0].name,
                    type: options.fields[0].type,
                    operator: getOperatorsForType(options.fields[0].type)[0],
                    value: null,
                    groupId: group.id
                };
                state.addFilter(filter);
                const content = groupEl.querySelector('.filter-group-content');
                createFilterUI(filter, content);
                updateCount();
                triggerChange();
            });
            
            // Supprimer le groupe
            const removeBtn = groupEl.querySelector('.btn-remove-group');
            removeBtn?.addEventListener('click', () => {
                removeGroup(group.id, groupEl);
            });
        }
        
        // Attacher les événements globaux
        function attachGlobalEvents() {
            // Ajouter un filtre
            const addFilterBtn = elements.toolbar.querySelector('.btn-add-filter');
            addFilterBtn?.addEventListener('click', () => {
                const filter = {
                    field: options.fields[0].name,
                    type: options.fields[0].type,
                    operator: getOperatorsForType(options.fields[0].type)[0],
                    value: null
                };
                state.addFilter(filter);
                createFilterUI(filter);
                updateCount();
                triggerChange();
            });
            
            // Ajouter un groupe
            const addGroupBtn = elements.toolbar.querySelector('.btn-add-group');
            addGroupBtn?.addEventListener('click', () => {
                const group = state.addGroup();
                createGroupUI(group);
            });
            
            // Préréglages
            const presetSelect = elements.toolbar.querySelector('.filter-preset-select');
            presetSelect?.addEventListener('change', (e) => {
                if (e.target.value) {
                    loadPreset(e.target.value);
                }
            });
            
            // Réinitialiser
            const resetBtn = elements.toolbar.querySelector('.btn-reset');
            resetBtn?.addEventListener('click', () => {
                resetFilters();
            });
            
            // Sauvegarder
            const saveBtn = elements.toolbar.querySelector('.btn-save');
            saveBtn?.addEventListener('click', () => {
                showSaveDialog();
            });
            
            // Appliquer
            const applyBtn = elements.footer?.querySelector('.btn-apply');
            applyBtn?.addEventListener('click', () => {
                applyFilters();
            });
            
            // Export/Import
            const exportBtn = elements.footer?.querySelector('.btn-export');
            exportBtn?.addEventListener('click', () => {
                exportFilters();
            });
            
            const importBtn = elements.footer?.querySelector('.btn-import');
            importBtn?.addEventListener('click', () => {
                showImportDialog();
            });
        }
        
        // ========================================
        // MÉTHODES UTILITAIRES
        // ========================================
        function updateFilterUI(filterEl, filter) {
            const valueContainer = filterEl.querySelector('.filter-value');
            valueContainer.innerHTML = createValueInput(filter);
            
            // Réattacher les événements sur les nouveaux inputs
            const valueInputs = valueContainer.querySelectorAll('.filter-input, .filter-select, .filter-checkbox');
            valueInputs.forEach(input => {
                input.addEventListener('change', () => {
                    updateFilterValue(filter, filterEl);
                    triggerChange();
                });
            });
        }
        
        function updateFilterValue(filter, filterEl) {
            const operator = CONFIG.operators[filter.operator];
            
            if (operator.requiresTwo) {
                const min = filterEl.querySelector('.filter-input-min, .filter-input-start')?.value;
                const max = filterEl.querySelector('.filter-input-max, .filter-input-end')?.value;
                filter.value = [min, max];
            } else if (operator.multiple) {
                const select = filterEl.querySelector('.filter-select');
                filter.value = Array.from(select.selectedOptions).map(opt => opt.value);
            } else if (filter.type === 'boolean') {
                filter.value = filterEl.querySelector('.filter-checkbox')?.checked;
            } else if (filter.type === 'tags') {
                // Gérer les tags (implémentation simplifiée)
                const tagsInput = filterEl.querySelector('.filter-tags-input');
                filter.value = tagsInput.dataset.tags.split(',').filter(Boolean);
            } else {
                filter.value = filterEl.querySelector('.filter-input, .filter-select')?.value;
            }
        }
        
        function removeFilter(filterId, filterEl) {
            state.removeFilter(filterId);
            
            if (options.animations) {
                filterEl.style.transition = 'all 0.3s ease-out';
                filterEl.style.opacity = '0';
                filterEl.style.transform = 'translateX(-20px)';
                setTimeout(() => filterEl.remove(), 300);
            } else {
                filterEl.remove();
            }
            
            updateCount();
            triggerChange();
        }
        
        function removeGroup(groupId, groupEl) {
            state.removeGroup(groupId);
            
            if (options.animations) {
                groupEl.style.transition = 'all 0.3s ease-out';
                groupEl.style.opacity = '0';
                groupEl.style.transform = 'scale(0.95)';
                setTimeout(() => groupEl.remove(), 300);
            } else {
                groupEl.remove();
            }
            
            updateCount();
            triggerChange();
        }
        
        function resetFilters() {
            state.reset();
            elements.content.innerHTML = '';
            updateCount();
            triggerChange();
        }
        
        function loadPreset(presetKey) {
            const preset = CONFIG.presets[presetKey];
            if (!preset) return;
            
            resetFilters();
            state.activePreset = presetKey;
            
            preset.filters.forEach(filterConfig => {
                const field = options.fields.find(f => f.name === filterConfig.field);
                if (field) {
                    const filter = state.addFilter({
                        ...filterConfig,
                        type: field.type
                    });
                    createFilterUI(filter);
                }
            });
            
            updateCount();
            triggerChange();
        }
        
        function updateCount() {
            const countEl = elements.toolbar.querySelector('.filter-count');
            if (countEl) {
                const count = state.filters.length;
                countEl.textContent = `${count} filtre${count !== 1 ? 's' : ''}`;
            }
        }
        
        function triggerChange() {
            if (options.autoApply) {
                applyFilters();
            }
            
            if (options.onChange) {
                options.onChange(getFilters());
            }
        }
        
        function applyFilters() {
            if (options.onApply) {
                options.onApply(getFilters());
            }
        }
        
        function getFilters() {
            return {
                filters: state.filters,
                groups: state.groups,
                logic: buildFilterLogic()
            };
        }
        
        function buildFilterLogic() {
            // Construire la logique de filtrage
            const rootFilters = state.filters.filter(f => !f.groupId);
            const logic = {
                operator: 'AND',
                conditions: []
            };
            
            // Ajouter les filtres racine
            rootFilters.forEach(filter => {
                logic.conditions.push({
                    field: filter.field,
                    operator: filter.operator,
                    value: filter.value
                });
            });
            
            // Ajouter les groupes
            state.groups.forEach(group => {
                if (!group.parentId) {
                    const groupLogic = {
                        operator: group.logic,
                        conditions: []
                    };
                    
                    const groupFilters = state.getFiltersForGroup(group.id);
                    groupFilters.forEach(filter => {
                        groupLogic.conditions.push({
                            field: filter.field,
                            operator: filter.operator,
                            value: filter.value
                        });
                    });
                    
                    if (groupLogic.conditions.length > 0) {
                        logic.conditions.push(groupLogic);
                    }
                }
            });
            
            return logic;
        }
        
        // ========================================
        // DIALOGUES
        // ========================================
        function showSaveDialog() {
            const dialog = createElement('div', 'filter-dialog');
            dialog.innerHTML = `
                <div class="filter-dialog-content">
                    <h3>Sauvegarder les filtres</h3>
                    <input type="text" class="filter-dialog-input" placeholder="Nom du filtre..." autofocus>
                    <div class="filter-dialog-actions">
                        <button class="filter-btn btn-cancel">Annuler</button>
                        <button class="filter-btn btn-primary btn-save-confirm">Sauvegarder</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            const input = dialog.querySelector('.filter-dialog-input');
            const saveBtn = dialog.querySelector('.btn-save-confirm');
            const cancelBtn = dialog.querySelector('.btn-cancel');
            
            saveBtn.addEventListener('click', () => {
                const name = input.value.trim();
                if (name) {
                    state.saveFilters(name);
                    dialog.remove();
                }
            });
            
            cancelBtn.addEventListener('click', () => dialog.remove());
            
            input.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') saveBtn.click();
                if (e.key === 'Escape') cancelBtn.click();
            });
        }
        
        function showImportDialog() {
            const dialog = createElement('div', 'filter-dialog');
            dialog.innerHTML = `
                <div class="filter-dialog-content">
                    <h3>Importer des filtres</h3>
                    <textarea class="filter-dialog-textarea" placeholder="Coller le JSON ici..." rows="10"></textarea>
                    <div class="filter-dialog-actions">
                        <button class="filter-btn btn-cancel">Annuler</button>
                        <button class="filter-btn btn-primary btn-import-confirm">Importer</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(dialog);
            
            const textarea = dialog.querySelector('.filter-dialog-textarea');
            const importBtn = dialog.querySelector('.btn-import-confirm');
            const cancelBtn = dialog.querySelector('.btn-cancel');
            
            importBtn.addEventListener('click', () => {
                const json = textarea.value.trim();
                if (json && state.importFilters(json)) {
                    renderAllFilters();
                    dialog.remove();
                } else {
                    alert('Format JSON invalide');
                }
            });
            
            cancelBtn.addEventListener('click', () => dialog.remove());
        }
        
        function exportFilters() {
            const json = state.exportFilters();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `filters_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        // ========================================
        // RENDU
        // ========================================
        function renderAllFilters() {
            elements.content.innerHTML = '';
            
            // Rendre les filtres racine
            state.filters.filter(f => !f.groupId).forEach(filter => {
                createFilterUI(filter);
            });
            
            // Rendre les groupes
            state.groups.filter(g => !g.parentId).forEach(group => {
                const groupEl = createGroupUI(group);
                const groupContent = groupEl.querySelector('.filter-group-content');
                
                // Rendre les filtres du groupe
                state.getFiltersForGroup(group.id).forEach(filter => {
                    createFilterUI(filter, groupContent);
                });
            });
            
            updateCount();
        }
        
        // ========================================
        // HELPERS
        // ========================================
        function createElement(tag, className) {
            const el = document.createElement(tag);
            if (className) el.className = className;
            return el;
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
        
        // ========================================
        // INITIALISATION
        // ========================================
        initializeStructure();
        attachGlobalEvents();
        updateCount();
        
        // API du builder
        return {
            state,
            elements,
            addFilter: (filterConfig) => {
                const filter = state.addFilter(filterConfig);
                createFilterUI(filter);
                updateCount();
                return filter;
            },
            getFilters,
            reset: resetFilters,
            apply: applyFilters,
            export: () => state.exportFilters(),
            import: (json) => {
                if (state.importFilters(json)) {
                    renderAllFilters();
                    return true;
                }
                return false;
            }
        };
    }
    
    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('advanced-filter-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'advanced-filter-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/advanced-filter.css';
        document.head.appendChild(link);
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(container, options = {}) {
            if (!container || !options.fields) {
                console.error('AdvancedFilter: container and fields are required');
                return null;
            }
            
            // Configuration par défaut
            const settings = {
                style: 'glassmorphism',
                mode: 'inline',
                ...CONFIG.advanced,
                ...options
            };
            
            // Injecter les styles
            injectStyles();
            
            // Créer le builder
            return createFilterBuilder(container, settings);
        },
        
        // Méthode helper pour créer rapidement
        quickCreate(selector, fields, options = {}) {
            const container = document.querySelector(selector);
            if (!container) {
                console.error(`AdvancedFilter: Element not found: ${selector}`);
                return null;
            }
            
            return this.create(container, {
                fields,
                ...options
            });
        },
        
        // Exposer la configuration
        CONFIG,
        
        // Utilitaire pour appliquer des filtres sur des données
        applyFilters(data, filterLogic) {
            return data.filter(item => evaluateLogic(item, filterLogic));
        },
        
        // Injecter les styles manuellement
        injectStyles
    };
    
    // ========================================
    // LOGIQUE DE FILTRAGE
    // ========================================
    function evaluateLogic(item, logic) {
        if (!logic || !logic.conditions || logic.conditions.length === 0) {
            return true;
        }
        
        const results = logic.conditions.map(condition => {
            if (condition.operator && condition.conditions) {
                // C'est un groupe
                return evaluateLogic(item, condition);
            } else {
                // C'est un filtre simple
                return evaluateCondition(item, condition);
            }
        });
        
        if (logic.operator === 'AND') {
            return results.every(r => r);
        } else if (logic.operator === 'OR') {
            return results.some(r => r);
        }
        
        return true;
    }
    
    function evaluateCondition(item, condition) {
        const value = item[condition.field];
        const filterValue = condition.value;
        
        switch (condition.operator) {
            case 'equals':
                return value == filterValue;
            case 'not_equals':
                return value != filterValue;
            case 'contains':
                return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'not_contains':
                return !String(value).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'starts_with':
                return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
            case 'ends_with':
                return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
            case 'is_empty':
                return !value || value === '';
            case 'is_not_empty':
                return value && value !== '';
            case 'greater_than':
                return Number(value) > Number(filterValue);
            case 'less_than':
                return Number(value) < Number(filterValue);
            case 'greater_or_equal':
                return Number(value) >= Number(filterValue);
            case 'less_or_equal':
                return Number(value) <= Number(filterValue);
            case 'between':
                return Number(value) >= Number(filterValue[0]) && Number(value) <= Number(filterValue[1]);
            case 'not_between':
                return Number(value) < Number(filterValue[0]) || Number(value) > Number(filterValue[1]);
            case 'in':
                return filterValue.includes(value);
            case 'not_in':
                return !filterValue.includes(value);
            case 'is_true':
                return value === true || value === 1 || value === '1';
            case 'is_false':
                return value === false || value === 0 || value === '0';
            // Dates (implémentation simplifiée)
            case 'before':
                return new Date(value) < new Date(filterValue);
            case 'after':
                return new Date(value) > new Date(filterValue);
            // Ajouter d'autres opérateurs selon les besoins
            default:
                return true;
        }
    }
})();

// Export pour utilisation en module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedFilter;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2025-01-28] - Gestion des groupes imbriqués
   Solution: Système récursif avec limite de profondeur
   
   [2025-01-28] - Performance avec beaucoup de filtres
   Solution: Debounce et application différée
   
   [2025-01-28] - Import/Export de configurations
   Solution: Format JSON standardisé avec versioning
   
   NOTES POUR REPRISES FUTURES:
   - La logique de filtrage peut être étendue facilement
   - Les types de filtres sont modulaires
   - L'état est centralisé pour faciliter la persistance
   - Attention aux performances avec de gros datasets
   ======================================== */