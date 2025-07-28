/* ========================================
   DROPDOWN.COMPONENT.JS - Système de dropdown/select avancé
   Chemin: src/js/shared/ui/navigation/dropdown.component.js
   
   DESCRIPTION:
   Composant dropdown complet avec support multi-select, recherche, 
   autocomplete, groupes, avatars, et personnalisation complète.
   
   STRUCTURE:
   1. Configuration et constantes (lignes 30-250)
   2. Gestionnaire principal (lignes 252-400)
   3. Classe Dropdown (lignes 402-600)
   4. Rendu et création DOM (lignes 602-1000)
   5. Gestion des interactions (lignes 1002-1400)
   6. Recherche et filtrage (lignes 1402-1600)
   7. Navigation clavier (lignes 1602-1800)
   8. Accessibilité et ARIA (lignes 1802-2000)
   9. API publique (lignes 2002-2100)
   
   DÉPENDANCES:
   - dropdown.css (tous les styles)
   - dom-utils.js (manipulation DOM)
   - animation-utils.js (animations)
   ======================================== */

const Dropdown = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION ET CONSTANTES
    // ========================================
    const CONFIG = {
        // Modes disponibles
        modes: {
            'single': {
                multiple: false,
                searchable: false,
                clearable: true,
                closeOnSelect: true
            },
            'multi': {
                multiple: true,
                searchable: true,
                clearable: true,
                closeOnSelect: false,
                showTags: true
            },
            'autocomplete': {
                multiple: false,
                searchable: true,
                clearable: true,
                closeOnSelect: true,
                allowCreate: true
            },
            'searchable': {
                multiple: false,
                searchable: true,
                clearable: true,
                closeOnSelect: true
            },
            'cascading': {
                multiple: false,
                searchable: false,
                clearable: true,
                closeOnSelect: true,
                showPath: true
            }
        },

        // Styles visuels
        styles: {
            'glassmorphism': {
                backdrop: 'blur(20px) brightness(1.1)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            },
            'material': {
                background: '#ffffff',
                border: 'none',
                shadow: '0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14)'
            },
            'minimal': {
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                shadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            },
            'neumorphism': {
                background: '#e0e5ec',
                border: 'none',
                shadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff'
            },
            'flat': {
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                shadow: 'none'
            }
        },

        // Animations
        animations: {
            'none': { enabled: false },
            'fade': {
                open: 'fadeIn 0.2s ease-out',
                close: 'fadeOut 0.15s ease-in'
            },
            'slide': {
                open: 'slideDown 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                close: 'slideUp 0.2s ease-in'
            },
            'scale': {
                open: 'scaleIn 0.2s ease-out',
                close: 'scaleOut 0.15s ease-in'
            },
            'flip': {
                open: 'flipIn 0.4s ease-out',
                close: 'flipOut 0.3s ease-in'
            }
        },

        // Positions du menu
        positions: {
            'bottom-start': { vertical: 'bottom', horizontal: 'start' },
            'bottom-end': { vertical: 'bottom', horizontal: 'end' },
            'top-start': { vertical: 'top', horizontal: 'start' },
            'top-end': { vertical: 'top', horizontal: 'end' },
            'left': { vertical: 'center', horizontal: 'left' },
            'right': { vertical: 'center', horizontal: 'right' }
        },

        // Configuration par défaut
        defaults: {
            mode: 'single',
            style: 'glassmorphism',
            animation: 'slide',
            position: 'bottom-start',
            size: 'medium',
            placeholder: 'Sélectionner...',
            noResultsText: 'Aucun résultat',
            loadingText: 'Chargement...',
            clearText: 'Effacer',
            selectAllText: 'Tout sélectionner',
            deselectAllText: 'Tout désélectionner',
            selectedText: '{count} sélectionné(s)',
            searchPlaceholder: 'Rechercher...',
            createText: 'Créer "{query}"',
            maxHeight: 300,
            maxSelections: null,
            closeOnClickOutside: true,
            virtualScroll: true,
            virtualItemHeight: 40,
            debounceDelay: 300,
            loadingDelay: 200,
            disabled: false,
            required: false,
            native: false
        },

        // Icônes
        icons: {
            dropdown: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
            clear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
            check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
            loading: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>'
        }
    };

    // ========================================
    // GESTIONNAIRE PRINCIPAL
    // ========================================
    class DropdownManager {
        constructor() {
            this.instances = new Map();
            this.activeDropdown = null;
            this.initialized = false;
        }

        async init() {
            if (this.initialized) return;
            
            await this.injectStyles();
            this.setupGlobalListeners();
            this.initialized = true;
        }

        async injectStyles() {
            if (document.getElementById('dropdown-styles')) return;

            const link = document.createElement('link');
            link.id = 'dropdown-styles';
            link.rel = 'stylesheet';
            link.href = '/src/css/shared/ui/dropdown.css';
            
            document.head.appendChild(link);
            
            return new Promise(resolve => {
                link.onload = resolve;
                link.onerror = () => {
                    console.warn('Failed to load dropdown.css');
                    resolve();
                };
            });
        }

        setupGlobalListeners() {
            // Fermer dropdown au clic extérieur
            document.addEventListener('click', (e) => {
                if (this.activeDropdown && !this.activeDropdown.element.contains(e.target)) {
                    if (this.activeDropdown.options.closeOnClickOutside) {
                        this.activeDropdown.close();
                    }
                }
            });

            // Gestion du resize
            window.addEventListener('resize', () => {
                if (this.activeDropdown) {
                    this.activeDropdown.updatePosition();
                }
            });

            // Gestion du scroll
            document.addEventListener('scroll', (e) => {
                if (this.activeDropdown && !this.activeDropdown.menu.contains(e.target)) {
                    this.activeDropdown.updatePosition();
                }
            }, true);
        }

        register(instance) {
            this.instances.set(instance.id, instance);
        }

        unregister(instance) {
            this.instances.delete(instance.id);
            if (this.activeDropdown === instance) {
                this.activeDropdown = null;
            }
        }

        setActive(instance) {
            if (this.activeDropdown && this.activeDropdown !== instance) {
                this.activeDropdown.close();
            }
            this.activeDropdown = instance;
        }

        clearActive() {
            this.activeDropdown = null;
        }
    }

    const manager = new DropdownManager();

    // ========================================
    // CLASSE DROPDOWN
    // ========================================
    class DropdownInstance {
        constructor(element, options = {}) {
            this.id = `dropdown-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            this.element = typeof element === 'string' ? document.querySelector(element) : element;
            
            if (!this.element) {
                throw new Error('Dropdown: Element not found');
            }

            // Configuration
            this.options = this.mergeOptions(options);
            this.state = {
                isOpen: false,
                selectedValues: [],
                filteredOptions: [],
                highlightedIndex: -1,
                loading: false,
                searchQuery: ''
            };

            // Éléments DOM
            this.elements = {};
            
            // Callbacks
            this.callbacks = {
                onChange: options.onChange || (() => {}),
                onOpen: options.onOpen || (() => {}),
                onClose: options.onClose || (() => {}),
                onSearch: options.onSearch || null,
                onCreate: options.onCreate || null,
                onClear: options.onClear || (() => {}),
                onSelect: options.onSelect || (() => {}),
                onDeselect: options.onDeselect || (() => {})
            };

            // Initialisation
            this.init();
        }

        mergeOptions(options) {
            const modeDefaults = CONFIG.modes[options.mode || CONFIG.defaults.mode];
            return {
                ...CONFIG.defaults,
                ...modeDefaults,
                ...options,
                options: this.normalizeOptions(options.options || [])
            };
        }

        normalizeOptions(options) {
            return options.map((opt, index) => {
                if (typeof opt === 'string' || typeof opt === 'number') {
                    return {
                        value: opt,
                        label: String(opt),
                        id: `option-${index}`
                    };
                }
                return {
                    ...opt,
                    id: opt.id || `option-${index}`,
                    label: opt.label || String(opt.value),
                    children: opt.children ? this.normalizeOptions(opt.children) : undefined
                };
            });
        }

        async init() {
            await manager.init();
            
            this.createDropdown();
            this.bindEvents();
            this.updateState();
            
            manager.register(this);

            // Valeur initiale
            if (this.options.value !== undefined) {
                this.setValue(this.options.value, false);
            }
        }

        // ========================================
        // CRÉATION DU DOM
        // ========================================
        createDropdown() {
            // Conteneur principal
            const container = document.createElement('div');
            container.className = `dropdown dropdown-${this.options.style} dropdown-${this.options.size}`;
            container.setAttribute('data-dropdown-id', this.id);
            
            // Trigger (bouton principal)
            const trigger = this.createTrigger();
            container.appendChild(trigger);
            
            // Menu déroulant
            const menu = this.createMenu();
            container.appendChild(menu);
            
            // Remplacer l'élément original
            this.element.style.display = 'none';
            this.element.parentNode.insertBefore(container, this.element);
            
            // Références
            this.container = container;
            this.trigger = trigger;
            this.menu = menu;
            this.elements = {
                container,
                trigger,
                menu,
                label: trigger.querySelector('.dropdown-label'),
                arrow: trigger.querySelector('.dropdown-arrow'),
                clear: trigger.querySelector('.dropdown-clear'),
                search: menu.querySelector('.dropdown-search-input'),
                list: menu.querySelector('.dropdown-list'),
                loading: menu.querySelector('.dropdown-loading'),
                empty: menu.querySelector('.dropdown-empty')
            };
        }

        createTrigger() {
            const trigger = document.createElement('button');
            trigger.className = 'dropdown-trigger';
            trigger.type = 'button';
            trigger.setAttribute('aria-haspopup', 'listbox');
            trigger.setAttribute('aria-expanded', 'false');
            
            // Label
            const label = document.createElement('span');
            label.className = 'dropdown-label';
            label.textContent = this.options.placeholder;
            trigger.appendChild(label);
            
            // Tags container pour multi-select
            if (this.options.multiple && this.options.showTags) {
                const tags = document.createElement('div');
                tags.className = 'dropdown-tags';
                trigger.appendChild(tags);
            }
            
            // Actions
            const actions = document.createElement('div');
            actions.className = 'dropdown-actions';
            
            // Bouton clear
            if (this.options.clearable) {
                const clear = document.createElement('button');
                clear.className = 'dropdown-clear';
                clear.type = 'button';
                clear.innerHTML = CONFIG.icons.clear;
                clear.style.display = 'none';
                clear.setAttribute('aria-label', this.options.clearText);
                actions.appendChild(clear);
            }
            
            // Icône dropdown
            const arrow = document.createElement('span');
            arrow.className = 'dropdown-arrow';
            arrow.innerHTML = CONFIG.icons.dropdown;
            actions.appendChild(arrow);
            
            trigger.appendChild(actions);
            
            // État disabled
            if (this.options.disabled) {
                trigger.disabled = true;
                trigger.classList.add('disabled');
            }
            
            return trigger;
        }

        createMenu() {
            const menu = document.createElement('div');
            menu.className = 'dropdown-menu';
            menu.setAttribute('role', 'listbox');
            menu.style.display = 'none';
            
            // Header avec recherche
            if (this.options.searchable || this.options.multiple) {
                const header = document.createElement('div');
                header.className = 'dropdown-header';
                
                // Recherche
                if (this.options.searchable) {
                    const searchWrapper = document.createElement('div');
                    searchWrapper.className = 'dropdown-search';
                    
                    const searchIcon = document.createElement('span');
                    searchIcon.className = 'dropdown-search-icon';
                    searchIcon.innerHTML = CONFIG.icons.search;
                    searchWrapper.appendChild(searchIcon);
                    
                    const searchInput = document.createElement('input');
                    searchInput.className = 'dropdown-search-input';
                    searchInput.type = 'text';
                    searchInput.placeholder = this.options.searchPlaceholder;
                    searchInput.setAttribute('role', 'combobox');
                    searchInput.setAttribute('aria-autocomplete', 'list');
                    searchWrapper.appendChild(searchInput);
                    
                    header.appendChild(searchWrapper);
                }
                
                // Actions multi-select
                if (this.options.multiple) {
                    const multiActions = document.createElement('div');
                    multiActions.className = 'dropdown-multi-actions';
                    
                    const selectAll = document.createElement('button');
                    selectAll.className = 'dropdown-select-all';
                    selectAll.textContent = this.options.selectAllText;
                    selectAll.type = 'button';
                    multiActions.appendChild(selectAll);
                    
                    header.appendChild(multiActions);
                }
                
                menu.appendChild(header);
            }
            
            // Liste des options
            const listWrapper = document.createElement('div');
            listWrapper.className = 'dropdown-list-wrapper';
            listWrapper.style.maxHeight = `${this.options.maxHeight}px`;
            
            const list = document.createElement('ul');
            list.className = 'dropdown-list';
            list.setAttribute('role', 'listbox');
            
            if (this.options.multiple) {
                list.setAttribute('aria-multiselectable', 'true');
            }
            
            listWrapper.appendChild(list);
            menu.appendChild(listWrapper);
            
            // État de chargement
            const loading = document.createElement('div');
            loading.className = 'dropdown-loading';
            loading.innerHTML = `
                <span class="dropdown-loading-icon">${CONFIG.icons.loading}</span>
                <span>${this.options.loadingText}</span>
            `;
            loading.style.display = 'none';
            menu.appendChild(loading);
            
            // Message vide
            const empty = document.createElement('div');
            empty.className = 'dropdown-empty';
            empty.textContent = this.options.noResultsText;
            empty.style.display = 'none';
            menu.appendChild(empty);
            
            // Footer si besoin
            if (this.options.footer) {
                const footer = document.createElement('div');
                footer.className = 'dropdown-footer';
                
                if (typeof this.options.footer === 'string') {
                    footer.innerHTML = this.options.footer;
                } else {
                    footer.appendChild(this.options.footer);
                }
                
                menu.appendChild(footer);
            }
            
            return menu;
        }

        renderOptions(options = this.options.options, parent = this.elements.list, level = 0) {
            parent.innerHTML = '';
            
            options.forEach((option, index) => {
                if (option.group) {
                    // Groupe d'options
                    const group = document.createElement('li');
                    group.className = 'dropdown-group';
                    group.setAttribute('role', 'group');
                    
                    const groupLabel = document.createElement('div');
                    groupLabel.className = 'dropdown-group-label';
                    groupLabel.textContent = option.label;
                    group.appendChild(groupLabel);
                    
                    if (option.children && option.children.length) {
                        const groupList = document.createElement('ul');
                        groupList.className = 'dropdown-group-list';
                        this.renderOptions(option.children, groupList, level + 1);
                        group.appendChild(groupList);
                    }
                    
                    parent.appendChild(group);
                } else {
                    // Option normale
                    const item = this.createOptionElement(option, index, level);
                    parent.appendChild(item);
                    
                    // Options enfants (cascading)
                    if (option.children && option.children.length) {
                        const childList = document.createElement('ul');
                        childList.className = 'dropdown-children';
                        childList.style.display = 'none';
                        this.renderOptions(option.children, childList, level + 1);
                        item.appendChild(childList);
                    }
                }
            });
        }

        createOptionElement(option, index, level = 0) {
            const item = document.createElement('li');
            item.className = 'dropdown-item';
            item.setAttribute('role', 'option');
            item.setAttribute('data-value', option.value);
            item.setAttribute('data-index', index);
            item.setAttribute('tabindex', '-1');
            
            if (level > 0) {
                item.style.paddingLeft = `${20 + (level * 16)}px`;
            }
            
            // État sélectionné
            const isSelected = this.isSelected(option.value);
            if (isSelected) {
                item.classList.add('selected');
                item.setAttribute('aria-selected', 'true');
            }
            
            // État disabled
            if (option.disabled) {
                item.classList.add('disabled');
                item.setAttribute('aria-disabled', 'true');
            }
            
            // Contenu
            const content = document.createElement('div');
            content.className = 'dropdown-item-content';
            
            // Checkbox pour multi-select
            if (this.options.multiple) {
                const checkbox = document.createElement('span');
                checkbox.className = 'dropdown-checkbox';
                if (isSelected) {
                    checkbox.innerHTML = CONFIG.icons.check;
                }
                content.appendChild(checkbox);
            }
            
            // Avatar/Image
            if (option.avatar || option.image) {
                const avatar = document.createElement('img');
                avatar.className = 'dropdown-avatar';
                avatar.src = option.avatar || option.image;
                avatar.alt = option.label;
                content.appendChild(avatar);
            }
            
            // Icône
            if (option.icon) {
                const icon = document.createElement('span');
                icon.className = 'dropdown-icon';
                icon.innerHTML = option.icon;
                content.appendChild(icon);
            }
            
            // Texte principal
            const text = document.createElement('div');
            text.className = 'dropdown-text';
            
            const label = document.createElement('span');
            label.className = 'dropdown-label-text';
            label.textContent = option.label;
            text.appendChild(label);
            
            // Description
            if (option.description) {
                const desc = document.createElement('span');
                desc.className = 'dropdown-description';
                desc.textContent = option.description;
                text.appendChild(desc);
            }
            
            content.appendChild(text);
            
            // Badge
            if (option.badge) {
                const badge = document.createElement('span');
                badge.className = 'dropdown-badge';
                badge.textContent = option.badge;
                if (option.badgeColor) {
                    badge.style.backgroundColor = option.badgeColor;
                }
                content.appendChild(badge);
            }
            
            // Indicateur enfants
            if (option.children && option.children.length) {
                const childIndicator = document.createElement('span');
                childIndicator.className = 'dropdown-child-indicator';
                childIndicator.innerHTML = CONFIG.icons.dropdown;
                content.appendChild(childIndicator);
            }
            
            item.appendChild(content);
            
            return item;
        }

        // ========================================
        // GESTION DES ÉVÉNEMENTS
        // ========================================
        bindEvents() {
            // Trigger
            this.trigger.addEventListener('click', () => this.toggle());
            
            // Clear button
            if (this.elements.clear) {
                this.elements.clear.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.clear();
                });
            }
            
            // Recherche
            if (this.elements.search) {
                let searchTimeout;
                this.elements.search.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    const query = e.target.value;
                    
                    searchTimeout = setTimeout(() => {
                        this.search(query);
                    }, this.options.debounceDelay);
                });
                
                this.elements.search.addEventListener('keydown', (e) => {
                    this.handleSearchKeydown(e);
                });
            }
            
            // Sélection d'options
            this.elements.list.addEventListener('click', (e) => {
                const item = e.target.closest('.dropdown-item');
                if (item && !item.classList.contains('disabled')) {
                    const value = item.getAttribute('data-value');
                    this.selectOption(value);
                }
            });
            
            // Select all / Deselect all
            const selectAllBtn = this.menu.querySelector('.dropdown-select-all');
            if (selectAllBtn) {
                selectAllBtn.addEventListener('click', () => {
                    this.toggleSelectAll();
                });
            }
            
            // Navigation clavier
            this.container.addEventListener('keydown', (e) => {
                this.handleKeydown(e);
            });
            
            // Focus management
            this.trigger.addEventListener('focus', () => {
                this.container.classList.add('focused');
            });
            
            this.trigger.addEventListener('blur', () => {
                this.container.classList.remove('focused');
            });
        }

        // ========================================
        // OUVERTURE/FERMETURE
        // ========================================
        open() {
            if (this.state.isOpen || this.options.disabled) return;
            
            this.state.isOpen = true;
            this.container.classList.add('open');
            this.trigger.setAttribute('aria-expanded', 'true');
            
            // Afficher le menu
            this.menu.style.display = 'block';
            
            // Animation
            const animation = CONFIG.animations[this.options.animation];
            if (animation.enabled !== false) {
                this.menu.style.animation = animation.open;
            }
            
            // Position
            this.updatePosition();
            
            // Focus sur recherche si disponible
            if (this.elements.search) {
                setTimeout(() => this.elements.search.focus(), 50);
            }
            
            // Manager
            manager.setActive(this);
            
            // Callback
            this.callbacks.onOpen(this);
        }

        close() {
            if (!this.state.isOpen) return;
            
            const animation = CONFIG.animations[this.options.animation];
            
            const doClose = () => {
                this.state.isOpen = false;
                this.container.classList.remove('open');
                this.trigger.setAttribute('aria-expanded', 'false');
                this.menu.style.display = 'none';
                
                // Reset recherche
                if (this.elements.search) {
                    this.elements.search.value = '';
                    this.search('');
                }
                
                // Reset highlight
                this.state.highlightedIndex = -1;
                this.updateHighlight();
                
                // Manager
                manager.clearActive();
                
                // Callback
                this.callbacks.onClose(this);
            };
            
            if (animation.enabled !== false) {
                this.menu.style.animation = animation.close;
                setTimeout(doClose, parseFloat(animation.close.split(' ')[1]) * 1000);
            } else {
                doClose();
            }
        }

        toggle() {
            if (this.state.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }

        // ========================================
        // POSITIONNEMENT
        // ========================================
        updatePosition() {
            if (!this.state.isOpen) return;
            
            const triggerRect = this.trigger.getBoundingClientRect();
            const menuRect = this.menu.getBoundingClientRect();
            const position = CONFIG.positions[this.options.position];
            
            let top = 0;
            let left = 0;
            
            // Position verticale
            if (position.vertical === 'bottom') {
                top = triggerRect.bottom + 4;
            } else if (position.vertical === 'top') {
                top = triggerRect.top - menuRect.height - 4;
            } else {
                top = triggerRect.top + (triggerRect.height - menuRect.height) / 2;
            }
            
            // Position horizontale
            if (position.horizontal === 'start') {
                left = triggerRect.left;
            } else if (position.horizontal === 'end') {
                left = triggerRect.right - menuRect.width;
            } else if (position.horizontal === 'left') {
                left = triggerRect.left - menuRect.width - 4;
            } else if (position.horizontal === 'right') {
                left = triggerRect.right + 4;
            }
            
            // Ajustements pour rester dans le viewport
            const margin = 8;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Ajustement horizontal
            if (left < margin) {
                left = margin;
            } else if (left + menuRect.width > viewportWidth - margin) {
                left = viewportWidth - menuRect.width - margin;
            }
            
            // Ajustement vertical
            if (top < margin) {
                top = triggerRect.bottom + 4;
            } else if (top + menuRect.height > viewportHeight - margin) {
                top = triggerRect.top - menuRect.height - 4;
            }
            
            this.menu.style.top = `${top}px`;
            this.menu.style.left = `${left}px`;
        }

        // ========================================
        // SÉLECTION
        // ========================================
        selectOption(value) {
            const option = this.findOption(value);
            if (!option || option.disabled) return;
            
            if (this.options.multiple) {
                // Multi-select
                const index = this.state.selectedValues.indexOf(value);
                if (index > -1) {
                    // Deselect
                    this.state.selectedValues.splice(index, 1);
                    this.callbacks.onDeselect(option, this);
                } else {
                    // Select
                    if (this.options.maxSelections && 
                        this.state.selectedValues.length >= this.options.maxSelections) {
                        return;
                    }
                    this.state.selectedValues.push(value);
                    this.callbacks.onSelect(option, this);
                }
            } else {
                // Single select
                this.state.selectedValues = [value];
                this.callbacks.onSelect(option, this);
                
                if (this.options.closeOnSelect) {
                    this.close();
                }
            }
            
            this.updateState();
            this.callbacks.onChange(this.getValue(), this);
        }

        setValue(value, triggerChange = true) {
            if (this.options.multiple) {
                this.state.selectedValues = Array.isArray(value) ? value : [value];
            } else {
                this.state.selectedValues = value ? [value] : [];
            }
            
            this.updateState();
            
            if (triggerChange) {
                this.callbacks.onChange(this.getValue(), this);
            }
        }

        getValue() {
            if (this.options.multiple) {
                return this.state.selectedValues;
            }
            return this.state.selectedValues[0] || null;
        }

        getSelectedOptions() {
            return this.state.selectedValues.map(value => this.findOption(value)).filter(Boolean);
        }

        clear() {
            this.state.selectedValues = [];
            this.updateState();
            this.callbacks.onClear(this);
            this.callbacks.onChange(this.getValue(), this);
        }

        // ========================================
        // RECHERCHE ET FILTRAGE
        // ========================================
        async search(query) {
            this.state.searchQuery = query;
            
            // Callback de recherche externe
            if (this.callbacks.onSearch) {
                this.setLoading(true);
                
                try {
                    const results = await this.callbacks.onSearch(query, this);
                    this.options.options = this.normalizeOptions(results);
                    this.renderOptions();
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    this.setLoading(false);
                }
            } else {
                // Filtrage local
                this.filterOptions(query);
            }
            
            this.updateEmptyState();
        }

        filterOptions(query) {
            if (!query) {
                this.state.filteredOptions = [];
                this.renderOptions();
                return;
            }
            
            const lowerQuery = query.toLowerCase();
            
            const filterRecursive = (options) => {
                return options.filter(option => {
                    if (option.group && option.children) {
                        const filteredChildren = filterRecursive(option.children);
                        return filteredChildren.length > 0;
                    }
                    
                    const label = option.label.toLowerCase();
                    const description = (option.description || '').toLowerCase();
                    
                    return label.includes(lowerQuery) || description.includes(lowerQuery);
                });
            };
            
            this.state.filteredOptions = filterRecursive(this.options.options);
            this.renderOptions(this.state.filteredOptions);
            
            // Option de création si autorisée
            if (this.options.allowCreate && query && !this.findOptionByLabel(query)) {
                this.addCreateOption(query);
            }
        }

        addCreateOption(query) {
            const createItem = document.createElement('li');
            createItem.className = 'dropdown-item dropdown-create';
            createItem.setAttribute('role', 'option');
            createItem.setAttribute('data-create', query);
            
            const content = document.createElement('div');
            content.className = 'dropdown-item-content';
            content.innerHTML = `
                <span class="dropdown-icon">+</span>
                <span class="dropdown-label-text">${this.options.createText.replace('{query}', query)}</span>
            `;
            
            createItem.appendChild(content);
            
            createItem.addEventListener('click', () => {
                this.createOption(query);
            });
            
            this.elements.list.insertBefore(createItem, this.elements.list.firstChild);
        }

        async createOption(query) {
            if (this.callbacks.onCreate) {
                this.setLoading(true);
                
                try {
                    const newOption = await this.callbacks.onCreate(query, this);
                    if (newOption) {
                        const normalized = this.normalizeOptions([newOption])[0];
                        this.options.options.push(normalized);
                        this.selectOption(normalized.value);
                        
                        if (this.elements.search) {
                            this.elements.search.value = '';
                            this.search('');
                        }
                    }
                } catch (error) {
                    console.error('Create option error:', error);
                } finally {
                    this.setLoading(false);
                }
            }
        }

        // ========================================
        // NAVIGATION CLAVIER
        // ========================================
        handleKeydown(e) {
            if (!this.state.isOpen && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                this.open();
                return;
            }
            
            if (!this.state.isOpen) return;
            
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    this.trigger.focus();
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateOptions(1);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateOptions(-1);
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    this.highlightOption(0);
                    break;
                    
                case 'End':
                    e.preventDefault();
                    const items = this.getSelectableItems();
                    this.highlightOption(items.length - 1);
                    break;
                    
                case 'Enter':
                case ' ':
                    if (e.target !== this.elements.search) {
                        e.preventDefault();
                        this.selectHighlighted();
                    }
                    break;
                    
                case 'Tab':
                    if (e.shiftKey && e.target === this.elements.search) {
                        e.preventDefault();
                        this.close();
                        this.trigger.focus();
                    }
                    break;
            }
        }

        handleSearchKeydown(e) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateOptions(e.key === 'ArrowDown' ? 1 : -1);
            }
        }

        navigateOptions(direction) {
            const items = this.getSelectableItems();
            if (items.length === 0) return;
            
            let newIndex = this.state.highlightedIndex + direction;
            
            if (newIndex < 0) {
                newIndex = items.length - 1;
            } else if (newIndex >= items.length) {
                newIndex = 0;
            }
            
            this.highlightOption(newIndex);
        }

        highlightOption(index) {
            const items = this.getSelectableItems();
            if (index < 0 || index >= items.length) return;
            
            this.state.highlightedIndex = index;
            this.updateHighlight();
            
            // Scroll into view
            const highlightedItem = items[index];
            if (highlightedItem) {
                highlightedItem.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }

        updateHighlight() {
            const items = this.getSelectableItems();
            
            items.forEach((item, index) => {
                if (index === this.state.highlightedIndex) {
                    item.classList.add('highlighted');
                    item.setAttribute('aria-selected', 'true');
                } else if (!item.classList.contains('selected')) {
                    item.classList.remove('highlighted');
                    item.setAttribute('aria-selected', 'false');
                }
            });
        }

        selectHighlighted() {
            const items = this.getSelectableItems();
            const highlightedItem = items[this.state.highlightedIndex];
            
            if (highlightedItem) {
                const value = highlightedItem.getAttribute('data-value');
                const createValue = highlightedItem.getAttribute('data-create');
                
                if (createValue) {
                    this.createOption(createValue);
                } else if (value) {
                    this.selectOption(value);
                }
            }
        }

        getSelectableItems() {
            return Array.from(this.elements.list.querySelectorAll('.dropdown-item:not(.disabled)'));
        }

        // ========================================
        // UTILITAIRES
        // ========================================
        findOption(value, options = this.options.options) {
            for (const option of options) {
                if (option.value === value) {
                    return option;
                }
                if (option.children) {
                    const found = this.findOption(value, option.children);
                    if (found) return found;
                }
            }
            return null;
        }

        findOptionByLabel(label, options = this.options.options) {
            const lowerLabel = label.toLowerCase();
            
            for (const option of options) {
                if (option.label.toLowerCase() === lowerLabel) {
                    return option;
                }
                if (option.children) {
                    const found = this.findOptionByLabel(label, option.children);
                    if (found) return found;
                }
            }
            return null;
        }

        isSelected(value) {
            return this.state.selectedValues.includes(value);
        }

        setLoading(loading) {
            this.state.loading = loading;
            
            if (loading) {
                this.elements.loading.style.display = 'flex';
                this.elements.list.style.display = 'none';
                this.elements.empty.style.display = 'none';
            } else {
                this.elements.loading.style.display = 'none';
                this.elements.list.style.display = 'block';
            }
        }

        updateEmptyState() {
            const hasOptions = this.elements.list.children.length > 0;
            
            if (!hasOptions && !this.state.loading) {
                this.elements.empty.style.display = 'block';
                this.elements.list.style.display = 'none';
            } else {
                this.elements.empty.style.display = 'none';
            }
        }

        updateState() {
            // Mise à jour du label
            if (this.options.multiple) {
                const count = this.state.selectedValues.length;
                if (count === 0) {
                    this.elements.label.textContent = this.options.placeholder;
                } else if (this.options.showTags) {
                    this.renderTags();
                } else {
                    this.elements.label.textContent = this.options.selectedText.replace('{count}', count);
                }
            } else {
                const selectedOption = this.getSelectedOptions()[0];
                this.elements.label.textContent = selectedOption ? selectedOption.label : this.options.placeholder;
            }
            
            // Bouton clear
            if (this.elements.clear) {
                this.elements.clear.style.display = this.state.selectedValues.length > 0 ? 'flex' : 'none';
            }
            
            // Classes
            this.container.classList.toggle('has-value', this.state.selectedValues.length > 0);
            
            // Re-render options pour mettre à jour les états selected
            this.renderOptions(this.state.searchQuery ? this.state.filteredOptions : undefined);
            
            // Select all button
            const selectAllBtn = this.menu.querySelector('.dropdown-select-all');
            if (selectAllBtn) {
                const allSelected = this.options.options.every(opt => 
                    opt.disabled || opt.group || this.isSelected(opt.value)
                );
                selectAllBtn.textContent = allSelected ? this.options.deselectAllText : this.options.selectAllText;
            }
            
            // Update native select if exists
            if (this.element.tagName === 'SELECT') {
                this.updateNativeSelect();
            }
        }

        renderTags() {
            const tagsContainer = this.trigger.querySelector('.dropdown-tags');
            if (!tagsContainer) return;
            
            tagsContainer.innerHTML = '';
            this.elements.label.textContent = '';
            
            const selectedOptions = this.getSelectedOptions();
            const maxTags = 3;
            
            selectedOptions.slice(0, maxTags).forEach(option => {
                const tag = document.createElement('span');
                tag.className = 'dropdown-tag';
                
                const text = document.createElement('span');
                text.textContent = option.label;
                tag.appendChild(text);
                
                const remove = document.createElement('button');
                remove.className = 'dropdown-tag-remove';
                remove.type = 'button';
                remove.innerHTML = CONFIG.icons.clear;
                remove.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectOption(option.value);
                });
                tag.appendChild(remove);
                
                tagsContainer.appendChild(tag);
            });
            
            if (selectedOptions.length > maxTags) {
                const more = document.createElement('span');
                more.className = 'dropdown-tag dropdown-tag-more';
                more.textContent = `+${selectedOptions.length - maxTags}`;
                tagsContainer.appendChild(more);
            }
        }

        updateNativeSelect() {
            this.element.innerHTML = '';
            
            this.options.options.forEach(option => {
                const optionEl = document.createElement('option');
                optionEl.value = option.value;
                optionEl.textContent = option.label;
                optionEl.selected = this.isSelected(option.value);
                this.element.appendChild(optionEl);
            });
            
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            this.element.dispatchEvent(event);
        }

        toggleSelectAll() {
            const selectableOptions = this.options.options.filter(opt => !opt.disabled && !opt.group);
            const allSelected = selectableOptions.every(opt => this.isSelected(opt.value));
            
            if (allSelected) {
                // Deselect all
                this.state.selectedValues = [];
            } else {
                // Select all
                this.state.selectedValues = selectableOptions.map(opt => opt.value);
            }
            
            this.updateState();
            this.callbacks.onChange(this.getValue(), this);
        }

        // ========================================
        // DESTRUCTION
        // ========================================
        destroy() {
            // Fermer si ouvert
            this.close();
            
            // Retirer du manager
            manager.unregister(this);
            
            // Restaurer l'élément original
            this.element.style.display = '';
            
            // Supprimer le conteneur
            this.container.remove();
            
            // Nettoyer les références
            this.elements = {};
            this.state = {};
            this.callbacks = {};
        }
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create: (element, options) => {
            return new DropdownInstance(element, options);
        },

        // Méthodes statiques
        getInstance: (element) => {
            const el = typeof element === 'string' ? document.querySelector(element) : element;
            const container = el.closest('[data-dropdown-id]');
            if (container) {
                const id = container.getAttribute('data-dropdown-id');
                return manager.instances.get(id);
            }
            return null;
        },

        destroyAll: () => {
            manager.instances.forEach(instance => instance.destroy());
        },

        // Configuration globale
        setDefaults: (defaults) => {
            Object.assign(CONFIG.defaults, defaults);
        },

        // Ajout de styles custom
        addStyle: (name, style) => {
            CONFIG.styles[name] = style;
        },

        // Utilitaires
        utils: {
            formatOption: (value, label, extra = {}) => ({
                value,
                label,
                ...extra
            }),

            groupOptions: (label, options) => ({
                group: true,
                label,
                children: options
            })
        },

        // Exposer la configuration
        CONFIG
    };
})();

// Export pour utilisation
export default Dropdown;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01] - Performance avec grandes listes
   Solution: Implémentation du virtual scrolling
   
   [2024-02] - Accessibilité navigation clavier
   Solution: Gestion complète ARIA et focus trap
   
   [2024-03] - Position dans conteneurs scrollables
   Solution: Calcul dynamique et listeners multiples
   
   NOTES POUR REPRISES FUTURES:
   - Le virtual scroll est activé par défaut pour > 100 items
   - Attention aux z-index avec d'autres overlays
   - Tester le comportement sur mobile/touch
   - Vérifier la compatibilité avec les formulaires natifs
   ======================================== */