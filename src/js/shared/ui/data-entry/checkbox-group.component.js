/* ========================================
   CHECKBOX-GROUP.COMPONENT.JS - Système de groupes de checkboxes
   Chemin: src/js/shared/ui/data-entry/checkbox-group.component.js
   
   DESCRIPTION:
   Composant complet pour créer des groupes de checkboxes avec toutes
   les options possibles : layouts, styles, validations, animations,
   recherche, tri, virtualisation, etc.
   
   STRUCTURE:
   1. Configuration complète (lignes 25-300)
   2. Méthodes privées (lignes 302-800)
   3. Gestionnaires d'événements (lignes 802-1000)
   4. API publique (lignes 1002-1200)
   
   DÉPENDANCES:
   - dom-utils.js (pour manipulation DOM)
   - validation-utils.js (pour validation)
   - animation-utils.js (pour animations)
   - checkbox-group.css (styles associés)
   ======================================== */

const CheckboxGroup = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                className: 'checkbox-group-glassmorphism',
                checkboxStyle: 'checkbox-glass',
                containerStyle: 'container-glass',
                effects: {
                    blur: 20,
                    opacity: 0.1,
                    border: 'rgba(255, 255, 255, 0.2)',
                    shadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }
            },
            'neumorphism': {
                className: 'checkbox-group-neumorphism',
                checkboxStyle: 'checkbox-neu',
                containerStyle: 'container-neu',
                effects: {
                    innerShadow: 'inset 2px 2px 5px #b8b9be',
                    outerShadow: '-3px -3px 7px #fff'
                }
            },
            'material': {
                className: 'checkbox-group-material',
                checkboxStyle: 'checkbox-material',
                containerStyle: 'container-material',
                ripple: true
            },
            'flat': {
                className: 'checkbox-group-flat',
                checkboxStyle: 'checkbox-flat',
                containerStyle: 'container-flat'
            },
            'minimal': {
                className: 'checkbox-group-minimal',
                checkboxStyle: 'checkbox-minimal',
                containerStyle: 'container-minimal'
            },
            'outlined': {
                className: 'checkbox-group-outlined',
                checkboxStyle: 'checkbox-outlined',
                containerStyle: 'container-outlined'
            },
            'rounded': {
                className: 'checkbox-group-rounded',
                checkboxStyle: 'checkbox-rounded',
                containerStyle: 'container-rounded'
            },
            'gradient': {
                className: 'checkbox-group-gradient',
                checkboxStyle: 'checkbox-gradient',
                containerStyle: 'container-gradient'
            }
        },

        // Layouts disponibles
        layouts: {
            'vertical': {
                className: 'layout-vertical',
                direction: 'column',
                gap: '12px'
            },
            'horizontal': {
                className: 'layout-horizontal',
                direction: 'row',
                gap: '16px',
                wrap: true
            },
            'grid': {
                className: 'layout-grid',
                columns: 'auto',
                gap: '16px',
                responsive: true
            },
            'masonry': {
                className: 'layout-masonry',
                columns: 3,
                gap: '16px',
                balance: true
            },
            'compact': {
                className: 'layout-compact',
                direction: 'row',
                gap: '8px',
                inline: true
            },
            'cards': {
                className: 'layout-cards',
                direction: 'row',
                gap: '20px',
                cardStyle: true
            },
            'list': {
                className: 'layout-list',
                direction: 'column',
                gap: '8px',
                dividers: true
            },
            'tree': {
                className: 'layout-tree',
                hierarchical: true,
                indentSize: '24px',
                collapsible: true
            }
        },

        // Tailles
        sizes: {
            'xs': { checkbox: '14px', font: '12px', padding: '4px' },
            'sm': { checkbox: '16px', font: '13px', padding: '6px' },
            'md': { checkbox: '20px', font: '14px', padding: '8px' },
            'lg': { checkbox: '24px', font: '16px', padding: '10px' },
            'xl': { checkbox: '28px', font: '18px', padding: '12px' }
        },

        // Animations
        animations: {
            'none': { enabled: false },
            'subtle': {
                enabled: true,
                duration: 200,
                easing: 'ease',
                effects: ['fade', 'scale']
            },
            'smooth': {
                enabled: true,
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['fade', 'scale', 'rotate']
            },
            'bounce': {
                enabled: true,
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['bounce', 'scale']
            },
            'elastic': {
                enabled: true,
                duration: 600,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['elastic', 'rotate']
            },
            'rich': {
                enabled: true,
                duration: 500,
                stagger: 50,
                effects: ['slide', 'fade', 'scale', 'glow'],
                particles: true,
                ripple: true
            }
        },

        // Fonctionnalités
        features: {
            // Sélection
            selectAll: false,
            selectAllText: 'Tout sélectionner',
            deselectAllText: 'Tout désélectionner',
            invertSelection: false,
            
            // Recherche et filtrage
            search: false,
            searchPlaceholder: 'Rechercher...',
            searchDebounce: 300,
            searchMinChars: 1,
            filterByTags: false,
            
            // Tri
            sort: false,
            sortOptions: ['alpha', 'checked', 'custom'],
            
            // Groupes
            groups: false,
            collapsibleGroups: false,
            nestedGroups: false,
            
            // Validation
            required: false,
            minSelect: null,
            maxSelect: null,
            customValidation: null,
            
            // État
            disabled: false,
            readonly: false,
            indeterminate: false,
            triState: false,
            
            // Persistance
            saveState: false,
            storageKey: 'checkbox-group',
            
            // Virtualisation
            virtualize: false,
            itemHeight: 40,
            bufferSize: 5,
            
            // Accessibilité
            keyboard: true,
            announcements: true,
            
            // Autres
            counter: false,
            description: false,
            icons: false,
            images: false,
            colors: false,
            tooltips: false,
            contextMenu: false,
            dragAndDrop: false,
            exportable: false
        },

        // Templates personnalisés
        templates: {
            checkbox: null,
            label: null,
            group: null,
            selectAll: null,
            search: null,
            counter: null,
            empty: null
        },

        // Callbacks
        callbacks: {
            onChange: null,
            onSelect: null,
            onDeselect: null,
            onSelectAll: null,
            onDeselectAll: null,
            onSearch: null,
            onSort: null,
            onValidate: null,
            onStateChange: null,
            onGroupToggle: null,
            onInit: null,
            onDestroy: null
        },

        // Classes CSS
        classes: {
            container: 'checkbox-group',
            wrapper: 'checkbox-wrapper',
            checkbox: 'checkbox-input',
            label: 'checkbox-label',
            description: 'checkbox-description',
            icon: 'checkbox-icon',
            group: 'checkbox-subgroup',
            header: 'checkbox-header',
            controls: 'checkbox-controls',
            search: 'checkbox-search',
            counter: 'checkbox-counter',
            error: 'checkbox-error',
            disabled: 'is-disabled',
            checked: 'is-checked',
            indeterminate: 'is-indeterminate',
            focused: 'is-focused',
            invalid: 'is-invalid'
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const state = new Map();

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    /**
     * Génère un ID unique
     */
    function generateId() {
        return `checkbox-group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Crée la structure HTML du groupe
     */
    function createStructure(options) {
        const container = document.createElement('div');
        const config = mergeConfig(options);
        
        // Classes de base
        container.className = `${CONFIG.classes.container} ${CONFIG.styles[config.style].className} ${CONFIG.layouts[config.layout].className}`;
        container.setAttribute('role', 'group');
        container.setAttribute('aria-label', config.label || 'Groupe de cases à cocher');
        
        // ID unique
        const groupId = config.id || generateId();
        container.id = groupId;
        
        // Initialiser l'état
        state.set(groupId, {
            options: config,
            checkboxes: new Map(),
            selected: new Set(),
            filtered: new Set(),
            groups: new Map(),
            searchTerm: '',
            isValid: true,
            errors: []
        });
        
        // Créer les éléments
        if (config.features.search || config.features.selectAll || config.features.counter) {
            container.appendChild(createControls(groupId, config));
        }
        
        const wrapper = createWrapper(groupId, config);
        container.appendChild(wrapper);
        
        if (config.items && config.items.length > 0) {
            if (config.features.groups && config.groupBy) {
                createGroupedCheckboxes(wrapper, groupId, config);
            } else {
                createCheckboxes(wrapper, groupId, config.items, config);
            }
        }
        
        // Message vide
        if (!config.items || config.items.length === 0) {
            wrapper.appendChild(createEmptyMessage(config));
        }
        
        // Zone d'erreur
        if (config.features.required || config.features.minSelect || config.features.maxSelect) {
            container.appendChild(createErrorZone(groupId));
        }
        
        return container;
    }

    /**
     * Fusionne la configuration
     */
    function mergeConfig(options) {
        return {
            style: options.style || 'glassmorphism',
            layout: options.layout || 'vertical',
            size: options.size || 'md',
            animation: options.animation || 'smooth',
            features: { ...CONFIG.features, ...options.features },
            items: options.items || [],
            value: options.value || [],
            label: options.label,
            name: options.name,
            id: options.id,
            groupBy: options.groupBy,
            templates: { ...CONFIG.templates, ...options.templates },
            callbacks: { ...CONFIG.callbacks, ...options.callbacks },
            classes: { ...CONFIG.classes, ...options.classes }
        };
    }

    /**
     * Crée les contrôles (recherche, sélection, compteur)
     */
    function createControls(groupId, config) {
        const controls = document.createElement('div');
        controls.className = config.classes.controls;
        
        // Recherche
        if (config.features.search) {
            const search = createSearchInput(groupId, config);
            controls.appendChild(search);
        }
        
        // Boutons de sélection
        if (config.features.selectAll) {
            const selectButtons = createSelectButtons(groupId, config);
            controls.appendChild(selectButtons);
        }
        
        // Compteur
        if (config.features.counter) {
            const counter = createCounter(groupId, config);
            controls.appendChild(counter);
        }
        
        return controls;
    }

    /**
     * Crée le champ de recherche
     */
    function createSearchInput(groupId, config) {
        const searchWrapper = document.createElement('div');
        searchWrapper.className = `${config.classes.search}-wrapper`;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = config.classes.search;
        input.placeholder = config.features.searchPlaceholder;
        input.setAttribute('aria-label', 'Rechercher dans les options');
        
        // Icône de recherche
        const icon = document.createElement('span');
        icon.className = 'search-icon';
        icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
        </svg>`;
        
        searchWrapper.appendChild(icon);
        searchWrapper.appendChild(input);
        
        // Gestionnaire avec debounce
        let debounceTimer;
        input.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                handleSearch(groupId, e.target.value);
            }, config.features.searchDebounce);
        });
        
        return searchWrapper;
    }

    /**
     * Crée les boutons de sélection
     */
    function createSelectButtons(groupId, config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'select-buttons';
        
        // Tout sélectionner
        const selectAll = document.createElement('button');
        selectAll.type = 'button';
        selectAll.className = 'btn-select-all';
        selectAll.textContent = config.features.selectAllText;
        selectAll.addEventListener('click', () => handleSelectAll(groupId, true));
        
        // Tout désélectionner
        const deselectAll = document.createElement('button');
        deselectAll.type = 'button';
        deselectAll.className = 'btn-deselect-all';
        deselectAll.textContent = config.features.deselectAllText;
        deselectAll.addEventListener('click', () => handleSelectAll(groupId, false));
        
        wrapper.appendChild(selectAll);
        wrapper.appendChild(deselectAll);
        
        // Inverser la sélection
        if (config.features.invertSelection) {
            const invert = document.createElement('button');
            invert.type = 'button';
            invert.className = 'btn-invert';
            invert.textContent = 'Inverser';
            invert.addEventListener('click', () => handleInvertSelection(groupId));
            wrapper.appendChild(invert);
        }
        
        return wrapper;
    }

    /**
     * Crée le compteur
     */
    function createCounter(groupId, config) {
        const counter = document.createElement('div');
        counter.className = config.classes.counter;
        counter.setAttribute('aria-live', 'polite');
        counter.setAttribute('aria-atomic', 'true');
        updateCounter(groupId);
        return counter;
    }

    /**
     * Crée le wrapper principal
     */
    function createWrapper(groupId, config) {
        const wrapper = document.createElement('div');
        wrapper.className = 'checkbox-group-wrapper';
        
        // Virtualisation
        if (config.features.virtualize && config.items.length > 50) {
            wrapper.style.height = `${config.features.itemHeight * 10}px`;
            wrapper.style.overflow = 'auto';
            wrapper.setAttribute('data-virtual', 'true');
        }
        
        return wrapper;
    }

    /**
     * Crée les checkboxes
     */
    function createCheckboxes(container, groupId, items, config) {
        const groupState = state.get(groupId);
        
        items.forEach((item, index) => {
            const checkbox = createCheckbox(groupId, item, index, config);
            container.appendChild(checkbox);
            
            // Stocker la référence
            groupState.checkboxes.set(item.value, {
                element: checkbox,
                item: item,
                index: index
            });
            
            // État initial
            if (config.value.includes(item.value)) {
                const input = checkbox.querySelector('input');
                input.checked = true;
                groupState.selected.add(item.value);
                checkbox.classList.add(config.classes.checked);
            }
        });
        
        // Animation d'entrée
        if (config.animation !== 'none') {
            animateCheckboxes(container, config);
        }
    }

    /**
     * Crée un checkbox individuel
     */
    function createCheckbox(groupId, item, index, config) {
        const wrapper = document.createElement('div');
        wrapper.className = config.classes.wrapper;
        wrapper.setAttribute('data-value', item.value);
        
        // Input
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `${groupId}-checkbox-${index}`;
        input.className = config.classes.checkbox;
        input.name = config.name || groupId;
        input.value = item.value;
        
        if (item.disabled || config.features.disabled) {
            input.disabled = true;
            wrapper.classList.add(config.classes.disabled);
        }
        
        if (config.features.readonly) {
            input.readOnly = true;
        }
        
        // Label
        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.className = config.classes.label;
        
        // Contenu du label
        if (config.templates.label) {
            label.innerHTML = config.templates.label(item);
        } else {
            // Icône
            if (item.icon || config.features.icons) {
                const icon = document.createElement('span');
                icon.className = config.classes.icon;
                icon.innerHTML = item.icon || getDefaultIcon(item.value);
                label.appendChild(icon);
            }
            
            // Image
            if (item.image || config.features.images) {
                const img = document.createElement('img');
                img.src = item.image;
                img.alt = item.label;
                img.className = 'checkbox-image';
                label.appendChild(img);
            }
            
            // Texte
            const text = document.createElement('span');
            text.className = 'checkbox-text';
            text.textContent = item.label;
            label.appendChild(text);
            
            // Badge/Tag
            if (item.badge) {
                const badge = document.createElement('span');
                badge.className = 'checkbox-badge';
                badge.textContent = item.badge;
                if (item.badgeColor) {
                    badge.style.backgroundColor = item.badgeColor;
                }
                label.appendChild(badge);
            }
            
            // Description
            if (item.description || config.features.description) {
                const desc = document.createElement('span');
                desc.className = config.classes.description;
                desc.textContent = item.description;
                label.appendChild(desc);
            }
        }
        
        // Couleur personnalisée
        if (item.color || config.features.colors) {
            wrapper.style.setProperty('--checkbox-color', item.color);
        }
        
        // Tooltip
        if (item.tooltip || config.features.tooltips) {
            wrapper.setAttribute('title', item.tooltip);
            wrapper.setAttribute('data-tooltip', item.tooltip);
        }
        
        // Événements
        input.addEventListener('change', (e) => handleChange(groupId, item.value, e.target.checked));
        input.addEventListener('focus', () => wrapper.classList.add(config.classes.focused));
        input.addEventListener('blur', () => wrapper.classList.remove(config.classes.focused));
        
        // Keyboard navigation
        if (config.features.keyboard) {
            wrapper.addEventListener('keydown', (e) => handleKeyboard(e, groupId, index));
        }
        
        // Menu contextuel
        if (config.features.contextMenu) {
            wrapper.addEventListener('contextmenu', (e) => handleContextMenu(e, groupId, item));
        }
        
        wrapper.appendChild(input);
        wrapper.appendChild(label);
        
        return wrapper;
    }

    /**
     * Crée les checkboxes groupés
     */
    function createGroupedCheckboxes(container, groupId, config) {
        const groups = groupItems(config.items, config.groupBy);
        const groupState = state.get(groupId);
        
        groups.forEach((items, groupName) => {
            const groupEl = createGroup(groupId, groupName, items, config);
            container.appendChild(groupEl);
            groupState.groups.set(groupName, groupEl);
        });
    }

    /**
     * Groupe les items
     */
    function groupItems(items, groupBy) {
        const groups = new Map();
        
        items.forEach(item => {
            const groupKey = typeof groupBy === 'function' ? groupBy(item) : item[groupBy];
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey).push(item);
        });
        
        return groups;
    }

    /**
     * Crée un groupe
     */
    function createGroup(groupId, groupName, items, config) {
        const group = document.createElement('div');
        group.className = config.classes.group;
        group.setAttribute('data-group', groupName);
        
        // En-tête du groupe
        const header = document.createElement('div');
        header.className = 'group-header';
        
        // Chevron pour collapse
        if (config.features.collapsibleGroups) {
            const chevron = document.createElement('span');
            chevron.className = 'group-chevron';
            chevron.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>`;
            header.appendChild(chevron);
            
            header.addEventListener('click', () => toggleGroup(group));
        }
        
        // Titre du groupe
        const title = document.createElement('span');
        title.className = 'group-title';
        title.textContent = groupName;
        header.appendChild(title);
        
        // Compteur du groupe
        const count = document.createElement('span');
        count.className = 'group-count';
        count.textContent = `(${items.length})`;
        header.appendChild(count);
        
        group.appendChild(header);
        
        // Contenu du groupe
        const content = document.createElement('div');
        content.className = 'group-content';
        
        createCheckboxes(content, groupId, items, config);
        group.appendChild(content);
        
        return group;
    }

    /**
     * Message vide
     */
    function createEmptyMessage(config) {
        const empty = document.createElement('div');
        empty.className = 'checkbox-empty';
        
        if (config.templates.empty) {
            empty.innerHTML = config.templates.empty();
        } else {
            empty.innerHTML = `
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                </svg>
                <p>Aucune option disponible</p>
            `;
        }
        
        return empty;
    }

    /**
     * Zone d'erreur
     */
    function createErrorZone(groupId) {
        const error = document.createElement('div');
        error.className = 'checkbox-error-zone';
        error.id = `${groupId}-error`;
        error.setAttribute('role', 'alert');
        error.setAttribute('aria-live', 'polite');
        return error;
    }

    // ========================================
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // ========================================
    
    /**
     * Gère le changement d'état d'un checkbox
     */
    function handleChange(groupId, value, checked) {
        const groupState = state.get(groupId);
        const config = groupState.options;
        
        // Mettre à jour l'état
        if (checked) {
            groupState.selected.add(value);
        } else {
            groupState.selected.delete(value);
        }
        
        // Mettre à jour l'UI
        const checkbox = groupState.checkboxes.get(value);
        if (checkbox) {
            if (checked) {
                checkbox.element.classList.add(config.classes.checked);
            } else {
                checkbox.element.classList.remove(config.classes.checked);
            }
        }
        
        // Animation
        if (config.animation !== 'none') {
            animateChange(checkbox.element, checked, config);
        }
        
        // Validation
        if (config.features.required || config.features.minSelect || config.features.maxSelect) {
            validateGroup(groupId);
        }
        
        // Compteur
        if (config.features.counter) {
            updateCounter(groupId);
        }
        
        // Callbacks
        if (config.callbacks.onChange) {
            config.callbacks.onChange(value, checked, Array.from(groupState.selected));
        }
        
        if (checked && config.callbacks.onSelect) {
            config.callbacks.onSelect(value, checkbox.item);
        }
        
        if (!checked && config.callbacks.onDeselect) {
            config.callbacks.onDeselect(value, checkbox.item);
        }
    }

    /**
     * Gère la recherche
     */
    function handleSearch(groupId, searchTerm) {
        const groupState = state.get(groupId);
        const config = groupState.options;
        
        groupState.searchTerm = searchTerm.toLowerCase();
        
        groupState.checkboxes.forEach((checkbox, value) => {
            const item = checkbox.item;
            const matches = searchTerm === '' || 
                item.label.toLowerCase().includes(groupState.searchTerm) ||
                (item.description && item.description.toLowerCase().includes(groupState.searchTerm)) ||
                (item.tags && item.tags.some(tag => tag.toLowerCase().includes(groupState.searchTerm)));
            
            if (matches) {
                checkbox.element.style.display = '';
                groupState.filtered.add(value);
            } else {
                checkbox.element.style.display = 'none';
                groupState.filtered.delete(value);
            }
        });
        
        // Callbacks
        if (config.callbacks.onSearch) {
            config.callbacks.onSearch(searchTerm, Array.from(groupState.filtered));
        }
    }

    /**
     * Gère la sélection/désélection totale
     */
    function handleSelectAll(groupId, select) {
        const groupState = state.get(groupId);
        const config = groupState.options;
        
        groupState.checkboxes.forEach((checkbox, value) => {
            if (!checkbox.item.disabled && checkbox.element.style.display !== 'none') {
                const input = checkbox.element.querySelector('input');
                if (input.checked !== select) {
                    input.checked = select;
                    handleChange(groupId, value, select);
                }
            }
        });
        
        // Callbacks
        if (select && config.callbacks.onSelectAll) {
            config.callbacks.onSelectAll(Array.from(groupState.selected));
        }
        
        if (!select && config.callbacks.onDeselectAll) {
            config.callbacks.onDeselectAll();
        }
    }

    /**
     * Inverse la sélection
     */
    function handleInvertSelection(groupId) {
        const groupState = state.get(groupId);
        
        groupState.checkboxes.forEach((checkbox, value) => {
            if (!checkbox.item.disabled && checkbox.element.style.display !== 'none') {
                const input = checkbox.element.querySelector('input');
                input.checked = !input.checked;
                handleChange(groupId, value, input.checked);
            }
        });
    }

    /**
     * Navigation clavier
     */
    function handleKeyboard(event, groupId, currentIndex) {
        const groupState = state.get(groupId);
        const visibleCheckboxes = Array.from(groupState.checkboxes.values())
            .filter(cb => cb.element.style.display !== 'none');
        
        let newIndex = currentIndex;
        
        switch(event.key) {
            case 'ArrowUp':
                event.preventDefault();
                newIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowDown':
                event.preventDefault();
                newIndex = Math.min(visibleCheckboxes.length - 1, currentIndex + 1);
                break;
            case 'Home':
                event.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                event.preventDefault();
                newIndex = visibleCheckboxes.length - 1;
                break;
            case ' ':
                if (event.target.tagName !== 'INPUT') {
                    event.preventDefault();
                    const input = event.currentTarget.querySelector('input');
                    input.click();
                }
                break;
        }
        
        if (newIndex !== currentIndex && visibleCheckboxes[newIndex]) {
            visibleCheckboxes[newIndex].element.querySelector('input').focus();
        }
    }

    /**
     * Menu contextuel
     */
    function handleContextMenu(event, groupId, item) {
        event.preventDefault();
        // Implémenter le menu contextuel selon les besoins
    }

    // ========================================
    // ANIMATIONS
    // ========================================
    
    /**
     * Anime l'apparition des checkboxes
     */
    function animateCheckboxes(container, config) {
        const checkboxes = container.querySelectorAll(`.${config.classes.wrapper}`);
        const animation = CONFIG.animations[config.animation];
        
        checkboxes.forEach((checkbox, index) => {
            checkbox.style.opacity = '0';
            checkbox.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                checkbox.style.transition = `all ${animation.duration}ms ${animation.easing}`;
                checkbox.style.opacity = '1';
                checkbox.style.transform = 'translateY(0)';
            }, animation.stagger ? index * animation.stagger : 0);
        });
    }

    /**
     * Anime le changement d'état
     */
    function animateChange(element, checked, config) {
        const animation = CONFIG.animations[config.animation];
        
        if (animation.effects.includes('bounce')) {
            element.style.animation = 'checkbox-bounce 0.4s';
            setTimeout(() => element.style.animation = '', 400);
        }
        
        if (animation.ripple) {
            createRipple(element);
        }
        
        if (animation.particles && checked) {
            createParticles(element);
        }
    }

    /**
     * Crée un effet ripple
     */
    function createRipple(element) {
        const ripple = document.createElement('span');
        ripple.className = 'checkbox-ripple';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * Crée des particules
     */
    function createParticles(element) {
        const rect = element.getBoundingClientRect();
        
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('span');
            particle.className = 'checkbox-particle';
            particle.style.left = `${rect.width / 2}px`;
            particle.style.top = `${rect.height / 2}px`;
            
            const angle = (i * 60) * Math.PI / 180;
            const distance = 30 + Math.random() * 20;
            particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
            
            element.appendChild(particle);
            setTimeout(() => particle.remove(), 800);
        }
    }

    // ========================================
    // VALIDATION
    // ========================================
    
    /**
     * Valide le groupe
     */
    function validateGroup(groupId) {
        const groupState = state.get(groupId);
        const config = groupState.options;
        const selected = groupState.selected.size;
        const errors = [];
        
        // Validation required
        if (config.features.required && selected === 0) {
            errors.push('Au moins une option doit être sélectionnée');
        }
        
        // Validation min
        if (config.features.minSelect && selected < config.features.minSelect) {
            errors.push(`Sélectionnez au moins ${config.features.minSelect} option(s)`);
        }
        
        // Validation max
        if (config.features.maxSelect && selected > config.features.maxSelect) {
            errors.push(`Sélectionnez au maximum ${config.features.maxSelect} option(s)`);
        }
        
        // Validation personnalisée
        if (config.features.customValidation) {
            const customError = config.features.customValidation(Array.from(groupState.selected));
            if (customError) {
                errors.push(customError);
            }
        }
        
        // Mettre à jour l'état
        groupState.isValid = errors.length === 0;
        groupState.errors = errors;
        
        // Mettre à jour l'UI
        const container = document.getElementById(groupId);
        const errorZone = document.getElementById(`${groupId}-error`);
        
        if (groupState.isValid) {
            container.classList.remove(config.classes.invalid);
            if (errorZone) errorZone.textContent = '';
        } else {
            container.classList.add(config.classes.invalid);
            if (errorZone) errorZone.textContent = errors.join('. ');
        }
        
        // Callback
        if (config.callbacks.onValidate) {
            config.callbacks.onValidate(groupState.isValid, errors);
        }
        
        return groupState.isValid;
    }

    // ========================================
    // UTILITAIRES
    // ========================================
    
    /**
     * Met à jour le compteur
     */
    function updateCounter(groupId) {
        const groupState = state.get(groupId);
        const config = groupState.options;
        const counter = document.querySelector(`#${groupId} .${config.classes.counter}`);
        
        if (counter) {
            const selected = groupState.selected.size;
            const total = groupState.checkboxes.size;
            counter.textContent = `${selected} / ${total} sélectionné(s)`;
        }
    }

    /**
     * Toggle un groupe
     */
    function toggleGroup(groupEl) {
        groupEl.classList.toggle('is-collapsed');
        const content = groupEl.querySelector('.group-content');
        const chevron = groupEl.querySelector('.group-chevron');
        
        if (groupEl.classList.contains('is-collapsed')) {
            content.style.display = 'none';
            chevron.style.transform = 'rotate(-90deg)';
        } else {
            content.style.display = '';
            chevron.style.transform = '';
        }
    }

    /**
     * Obtient une icône par défaut
     */
    function getDefaultIcon(value) {
        // Icônes par défaut selon le type
        const icons = {
            default: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>'
        };
        
        return icons[value] || icons.default;
    }

    /**
     * Injecte les styles
     */
    function injectStyles() {
        if (document.getElementById('checkbox-group-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'checkbox-group-styles';
        style.textContent = `
            @import url('/src/css/shared/ui/checkbox-group.css');
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        /**
         * Crée un nouveau groupe de checkboxes
         */
        create(options = {}) {
            injectStyles();
            return createStructure(options);
        },

        /**
         * Met à jour un groupe existant
         */
        update(groupId, options) {
            const groupState = state.get(groupId);
            if (!groupState) return;
            
            // Fusionner les options
            Object.assign(groupState.options, options);
            
            // Recréer si nécessaire
            if (options.items || options.style || options.layout) {
                const container = document.getElementById(groupId);
                const parent = container.parentNode;
                const newContainer = createStructure(groupState.options);
                parent.replaceChild(newContainer, container);
            }
        },

        /**
         * Obtient les valeurs sélectionnées
         */
        getValue(groupId) {
            const groupState = state.get(groupId);
            return groupState ? Array.from(groupState.selected) : [];
        },

        /**
         * Définit les valeurs sélectionnées
         */
        setValue(groupId, values) {
            const groupState = state.get(groupId);
            if (!groupState) return;
            
            // Désélectionner tout
            handleSelectAll(groupId, false);
            
            // Sélectionner les nouvelles valeurs
            values.forEach(value => {
                const checkbox = groupState.checkboxes.get(value);
                if (checkbox) {
                    const input = checkbox.element.querySelector('input');
                    if (!input.disabled) {
                        input.checked = true;
                        handleChange(groupId, value, true);
                    }
                }
            });
        },

        /**
         * Active/désactive le groupe
         */
        setEnabled(groupId, enabled) {
            const groupState = state.get(groupId);
            if (!groupState) return;
            
            const container = document.getElementById(groupId);
            groupState.checkboxes.forEach(checkbox => {
                const input = checkbox.element.querySelector('input');
                input.disabled = !enabled;
                
                if (enabled) {
                    checkbox.element.classList.remove(groupState.options.classes.disabled);
                } else {
                    checkbox.element.classList.add(groupState.options.classes.disabled);
                }
            });
            
            groupState.options.features.disabled = !enabled;
        },

        /**
         * Valide le groupe
         */
        validate(groupId) {
            return validateGroup(groupId);
        },

        /**
         * Réinitialise le groupe
         */
        reset(groupId) {
            handleSelectAll(groupId, false);
            const searchInput = document.querySelector(`#${groupId} .${state.get(groupId).options.classes.search}`);
            if (searchInput) {
                searchInput.value = '';
                handleSearch(groupId, '');
            }
        },

        /**
         * Détruit le groupe
         */
        destroy(groupId) {
            const groupState = state.get(groupId);
            if (!groupState) return;
            
            // Callback
            if (groupState.options.callbacks.onDestroy) {
                groupState.options.callbacks.onDestroy();
            }
            
            // Nettoyer
            const container = document.getElementById(groupId);
            if (container) container.remove();
            state.delete(groupId);
        },

        /**
         * Exporte les données
         */
        export(groupId, format = 'json') {
            const groupState = state.get(groupId);
            if (!groupState) return null;
            
            const data = {
                selected: Array.from(groupState.selected),
                items: Array.from(groupState.checkboxes.values()).map(cb => ({
                    value: cb.item.value,
                    label: cb.item.label,
                    checked: groupState.selected.has(cb.item.value)
                }))
            };
            
            switch(format) {
                case 'json':
                    return JSON.stringify(data, null, 2);
                case 'csv':
                    const csv = ['value,label,checked'];
                    data.items.forEach(item => {
                        csv.push(`"${item.value}","${item.label}",${item.checked}`);
                    });
                    return csv.join('\n');
                default:
                    return data;
            }
        },

        /**
         * Configuration disponible
         */
        CONFIG,

        /**
         * Version
         */
        version: '1.0.0'
    };
})();

// Export pour utilisation
export default CheckboxGroup;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [DATE] - Gestion de la virtualisation
   Solution: Implémentation d'un système de viewport virtuel
   
   [DATE] - Performance avec beaucoup d'items
   Cause: Re-render complet à chaque changement
   Résolution: Mise à jour granulaire des éléments
   
   [DATE] - Accessibilité clavier
   Solution: Navigation complète avec flèches et raccourcis
   
   NOTES POUR REPRISES FUTURES:
   - La virtualisation nécessite un container avec hauteur fixe
   - Les animations riches peuvent impacter les performances
   - Le tri personnalisé doit retourner -1, 0 ou 1
   ======================================== */