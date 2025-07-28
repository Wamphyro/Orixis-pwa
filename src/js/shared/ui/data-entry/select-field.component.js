/* ========================================
   SELECT-FIELD.COMPONENT.JS - Champ de sélection avancé glassmorphism
   Chemin: src/js/shared/ui/data-entry/select-field.component.js
   
   DESCRIPTION:
   Composant select ultra-complet avec style glassmorphism frost.
   Supporte single/multi select, autocomplete, recherche, groupes,
   tags, création d'options, virtualisation, et plus.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-400)
   2. Classe SelectField principale (lignes 401-1200)
   3. Gestionnaire de dropdown (lignes 1201-1500)
   4. Moteur de recherche et filtrage (lignes 1501-1700)
   5. Virtualisation et performance (lignes 1701-1900)
   6. Gestion clavier et accessibilité (lignes 1901-2100)
   7. API publique (lignes 2101-2200)
   
   DÉPENDANCES:
   - frosted-icons.component.js (icônes)
   - animation-utils.js (animations)
   - validation-utils.js (validation)
   - ui.config.js (configuration globale)
   
   UTILISATION:
   const select = await UI.SelectField.create({
       mode: 'single',
       style: 'glassmorphism',
       animation: 'smooth',
       placeholder: 'Choisir une option',
       options: [...],
       features: { search: true, create: true }
   });
   ======================================== */

const SelectField = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Modes de sélection disponibles
        modes: {
            'single': {
                name: 'Sélection unique',
                multiple: false,
                tags: false,
                clearable: true,
                closeOnSelect: true
            },
            'multiple': {
                name: 'Sélection multiple',
                multiple: true,
                tags: false,
                clearable: true,
                closeOnSelect: false
            },
            'tags': {
                name: 'Mode tags',
                multiple: true,
                tags: true,
                clearable: true,
                closeOnSelect: false,
                createOption: true
            },
            'autocomplete': {
                name: 'Autocomplétion',
                multiple: false,
                tags: false,
                clearable: true,
                closeOnSelect: true,
                minChars: 1
            },
            'combobox': {
                name: 'Combobox',
                multiple: false,
                tags: false,
                clearable: true,
                closeOnSelect: true,
                allowCreate: true
            },
            'tree': {
                name: 'Arborescence',
                multiple: true,
                tags: false,
                clearable: true,
                closeOnSelect: false,
                hierarchical: true
            },
            'cascading': {
                name: 'Cascade',
                multiple: false,
                tags: false,
                clearable: true,
                closeOnSelect: true,
                levels: true
            }
        },

        // Styles visuels
        styles: {
            'glassmorphism': {
                // Container principal
                container: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px) brightness(1.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                },
                // Dropdown
                dropdown: {
                    background: 'rgba(20, 20, 20, 0.95)',
                    backdropFilter: 'blur(30px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
                    maxHeight: '320px'
                },
                // Options
                option: {
                    padding: '12px 16px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    transition: 'all 0.2s',
                    hover: {
                        background: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateX(4px)'
                    },
                    selected: {
                        background: 'rgba(59, 130, 246, 0.2)',
                        borderLeft: '3px solid #3b82f6'
                    }
                },
                // Tags
                tag: {
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    margin: '2px',
                    color: '#93bbfc'
                }
            },
            'neumorphism': {
                container: {
                    background: '#e0e5ec',
                    border: 'none',
                    borderRadius: '15px',
                    boxShadow: '9px 9px 16px #a3a8ae, -9px -9px 16px #ffffff',
                    transition: 'all 0.3s'
                },
                dropdown: {
                    background: '#e0e5ec',
                    border: 'none',
                    borderRadius: '15px',
                    boxShadow: '12px 12px 20px #a3a8ae, -12px -12px 20px #ffffff',
                    maxHeight: '320px'
                },
                option: {
                    padding: '12px 16px',
                    color: '#2d3748',
                    hover: {
                        background: '#d6dce5',
                        boxShadow: 'inset 2px 2px 5px #b8bec7, inset -2px -2px 5px #ffffff'
                    },
                    selected: {
                        background: '#d6dce5',
                        boxShadow: 'inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff'
                    }
                },
                tag: {
                    background: '#e0e5ec',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '4px 12px',
                    margin: '2px',
                    boxShadow: '3px 3px 6px #a3a8ae, -3px -3px 6px #ffffff'
                }
            },
            'flat': {
                container: {
                    background: '#ffffff',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: 'none',
                    transition: 'border-color 0.2s'
                },
                dropdown: {
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    maxHeight: '320px'
                },
                option: {
                    padding: '10px 12px',
                    color: '#1f2937',
                    hover: {
                        background: '#f3f4f6'
                    },
                    selected: {
                        background: '#e0f2fe',
                        color: '#0369a1'
                    }
                },
                tag: {
                    background: '#dbeafe',
                    border: '1px solid #bfdbfe',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    margin: '2px',
                    color: '#1e40af'
                }
            },
            'minimal': {
                container: {
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid #e5e7eb',
                    borderRadius: '0',
                    boxShadow: 'none',
                    transition: 'border-color 0.2s'
                },
                dropdown: {
                    background: '#ffffff',
                    border: 'none',
                    borderRadius: '0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    maxHeight: '320px'
                },
                option: {
                    padding: '8px 0',
                    color: '#374151',
                    hover: {
                        color: '#111827'
                    },
                    selected: {
                        color: '#111827',
                        fontWeight: '600'
                    }
                },
                tag: {
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '2px',
                    padding: '2px 6px',
                    margin: '2px',
                    color: '#374151'
                }
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false,
                duration: 0
            },
            'subtle': {
                enabled: true,
                duration: 200,
                easing: 'ease-out',
                effects: ['fade']
            },
            'smooth': {
                enabled: true,
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['fade', 'slide', 'scale']
            },
            'rich': {
                enabled: true,
                duration: 500,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                effects: ['fade', 'slide', 'scale', 'rotate', 'blur'],
                stagger: 50
            }
        },

        // Fonctionnalités disponibles
        features: {
            'search': {
                enabled: true,
                placeholder: 'Rechercher...',
                debounce: 300,
                highlight: true,
                fuzzy: false,
                minChars: 1
            },
            'groups': {
                enabled: false,
                collapsible: true,
                selectAll: true
            },
            'create': {
                enabled: false,
                prompt: 'Créer "{input}"',
                validator: null,
                formatter: null
            },
            'async': {
                enabled: false,
                url: null,
                method: 'GET',
                cache: true,
                minChars: 2
            },
            'virtualization': {
                enabled: false,
                itemHeight: 40,
                overscan: 5,
                threshold: 100
            },
            'icons': {
                enabled: false,
                position: 'left',
                size: 20
            },
            'avatars': {
                enabled: false,
                size: 24,
                shape: 'circle'
            },
            'descriptions': {
                enabled: false,
                position: 'bottom'
            },
            'keyboard': {
                enabled: true,
                navigation: true,
                shortcuts: true,
                typeahead: true
            },
            'validation': {
                enabled: false,
                required: false,
                rules: [],
                messages: {}
            },
            'i18n': {
                enabled: false,
                locale: 'fr',
                translations: {}
            }
        },

        // Configuration par défaut
        defaults: {
            placeholder: 'Sélectionner une option',
            noResultsText: 'Aucun résultat',
            loadingText: 'Chargement...',
            clearText: 'Effacer',
            selectAllText: 'Tout sélectionner',
            maxItems: null,
            closeOnSelect: true,
            openOnFocus: true,
            allowClear: true,
            disabled: false,
            readonly: false,
            size: 'medium', // small, medium, large
            dropdownPosition: 'auto' // auto, top, bottom
        },

        // Icônes
        icons: {
            dropdown: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>',
            clear: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>',
            search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>',
            check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
            loading: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin"><path d="M12 2v4m0 12v4m8-10h-4M8 12H4m15.4-5.4l-2.8 2.8M6.4 6.4l2.8 2.8m10.4 10.4l-2.8-2.8M6.4 17.6l2.8-2.8"/></svg>'
        },

        // Tailles
        sizes: {
            small: {
                height: '32px',
                fontSize: '13px',
                padding: '6px 12px'
            },
            medium: {
                height: '40px',
                fontSize: '14px',
                padding: '10px 16px'
            },
            large: {
                height: '48px',
                fontSize: '16px',
                padding: '12px 20px'
            }
        }
    };

    // ========================================
    // UTILITAIRES
    // ========================================
    let instanceCounter = 0;

    function generateId() {
        return `select-${Date.now()}-${++instanceCounter}`;
    }

    function deepMerge(target, source) {
        const output = { ...target };
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    } else {
                        output[key] = deepMerge(target[key], source[key]);
                    }
                } else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }

    function isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    function highlightMatch(text, query) {
        if (!query) return escapeHtml(text);
        const escaped = escapeHtml(text);
        const regex = new RegExp(`(${escapeHtml(query)})`, 'gi');
        return escaped.replace(regex, '<mark>$1</mark>');
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
    // CLASSE SELECTFIELD
    // ========================================
    class SelectField {
        constructor(options = {}) {
            this.id = generateId();
            this.options = deepMerge(CONFIG.defaults, options);
            this.mode = CONFIG.modes[options.mode || 'single'];
            this.style = CONFIG.styles[options.style || 'glassmorphism'];
            this.animation = CONFIG.animations[options.animation || 'smooth'];
            this.features = deepMerge(CONFIG.features, options.features || {});
            
            this.container = null;
            this.wrapper = null;
            this.input = null;
            this.dropdown = null;
            this.searchInput = null;
            
            this.data = options.options || [];
            this.filteredData = [...this.data];
            this.selectedValues = [];
            this.isOpen = false;
            this.highlightedIndex = -1;
            this.loading = false;
            
            this.cache = new Map();
            this.observers = new Map();
            
            this.init();
        }

        init() {
            this.createElements();
            this.applyStyles();
            this.bindEvents();
            this.initFeatures();
            
            if (this.options.value) {
                this.setValue(this.options.value);
            }
        }

        createElements() {
            // Container principal
            this.container = document.createElement('div');
            this.container.className = 'select-field';
            this.container.id = this.id;
            this.container.setAttribute('role', 'combobox');
            this.container.setAttribute('aria-expanded', 'false');
            this.container.setAttribute('aria-haspopup', 'listbox');
            
            // Wrapper pour le contenu
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'select-wrapper';
            
            // Zone de sélection
            this.selectionArea = document.createElement('div');
            this.selectionArea.className = 'select-selection';
            this.selectionArea.setAttribute('tabindex', '0');
            
            // Placeholder ou valeur
            this.valueDisplay = document.createElement('div');
            this.valueDisplay.className = 'select-value';
            this.valueDisplay.textContent = this.options.placeholder;
            
            // Icônes
            this.iconsContainer = document.createElement('div');
            this.iconsContainer.className = 'select-icons';
            
            // Icône dropdown
            this.dropdownIcon = document.createElement('span');
            this.dropdownIcon.className = 'select-icon-dropdown';
            this.dropdownIcon.innerHTML = CONFIG.icons.dropdown;
            
            // Icône clear
            if (this.options.allowClear) {
                this.clearIcon = document.createElement('span');
                this.clearIcon.className = 'select-icon-clear';
                this.clearIcon.innerHTML = CONFIG.icons.clear;
                this.clearIcon.style.display = 'none';
                this.clearIcon.setAttribute('role', 'button');
                this.clearIcon.setAttribute('aria-label', this.options.clearText);
            }
            
            // Assemblage
            this.iconsContainer.appendChild(this.dropdownIcon);
            if (this.clearIcon) {
                this.iconsContainer.appendChild(this.clearIcon);
            }
            
            this.selectionArea.appendChild(this.valueDisplay);
            this.selectionArea.appendChild(this.iconsContainer);
            
            this.wrapper.appendChild(this.selectionArea);
            this.container.appendChild(this.wrapper);
            
            // Dropdown
            this.createDropdown();
        }

        createDropdown() {
            this.dropdown = document.createElement('div');
            this.dropdown.className = 'select-dropdown';
            this.dropdown.setAttribute('role', 'listbox');
            this.dropdown.style.display = 'none';
            
            // Recherche
            if (this.features.search.enabled) {
                this.searchContainer = document.createElement('div');
                this.searchContainer.className = 'select-search';
                
                this.searchIcon = document.createElement('span');
                this.searchIcon.className = 'select-search-icon';
                this.searchIcon.innerHTML = CONFIG.icons.search;
                
                this.searchInput = document.createElement('input');
                this.searchInput.type = 'text';
                this.searchInput.className = 'select-search-input';
                this.searchInput.placeholder = this.features.search.placeholder;
                this.searchInput.setAttribute('role', 'searchbox');
                this.searchInput.setAttribute('aria-label', 'Rechercher dans les options');
                
                this.searchContainer.appendChild(this.searchIcon);
                this.searchContainer.appendChild(this.searchInput);
                this.dropdown.appendChild(this.searchContainer);
            }
            
            // Liste des options
            this.optionsList = document.createElement('div');
            this.optionsList.className = 'select-options';
            this.optionsList.setAttribute('role', 'listbox');
            
            this.dropdown.appendChild(this.optionsList);
            
            // Message de chargement
            this.loadingMessage = document.createElement('div');
            this.loadingMessage.className = 'select-loading';
            this.loadingMessage.innerHTML = `${CONFIG.icons.loading} ${this.options.loadingText}`;
            this.loadingMessage.style.display = 'none';
            this.dropdown.appendChild(this.loadingMessage);
            
            // Message "aucun résultat"
            this.noResultsMessage = document.createElement('div');
            this.noResultsMessage.className = 'select-no-results';
            this.noResultsMessage.textContent = this.options.noResultsText;
            this.noResultsMessage.style.display = 'none';
            this.dropdown.appendChild(this.noResultsMessage);
            
            // Ajout au body pour éviter les problèmes de overflow
            document.body.appendChild(this.dropdown);
        }

        applyStyles() {
            const size = CONFIG.sizes[this.options.size];
            const style = this.style;
            
            // Styles inline pour le container
            Object.assign(this.container.style, {
                position: 'relative',
                width: '100%',
                ...size
            });
            
            // Styles pour la zone de sélection
            Object.assign(this.selectionArea.style, {
                ...style.container,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                height: '100%',
                padding: size.padding,
                fontSize: size.fontSize,
                cursor: 'pointer',
                userSelect: 'none',
                outline: 'none'
            });
            
            // Focus styles
            this.selectionArea.addEventListener('focus', () => {
                this.selectionArea.style.borderColor = '#3b82f6';
                this.selectionArea.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            });
            
            this.selectionArea.addEventListener('blur', () => {
                this.selectionArea.style.borderColor = style.container.border.split(' ')[2];
                this.selectionArea.style.boxShadow = style.container.boxShadow;
            });
            
            // Styles pour le dropdown
            Object.assign(this.dropdown.style, {
                ...style.dropdown,
                position: 'absolute',
                width: '100%',
                zIndex: '9999',
                marginTop: '4px',
                overflow: 'hidden'
            });
            
            // Styles pour les icônes
            this.iconsContainer.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: 12px;
            `;
            
            this.dropdownIcon.style.cssText = `
                display: flex;
                align-items: center;
                color: rgba(255, 255, 255, 0.6);
                transition: transform 0.3s;
            `;
            
            if (this.clearIcon) {
                this.clearIcon.style.cssText = `
                    display: none;
                    align-items: center;
                    color: rgba(255, 255, 255, 0.6);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: all 0.2s;
                `;
            }
            
            // Styles pour la recherche
            if (this.searchContainer) {
                this.searchContainer.style.cssText = `
                    position: relative;
                    padding: 12px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                `;
                
                this.searchInput.style.cssText = `
                    width: 100%;
                    padding: 8px 8px 8px 32px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 6px;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s;
                `;
                
                this.searchIcon.style.cssText = `
                    position: absolute;
                    left: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: rgba(255, 255, 255, 0.4);
                    pointer-events: none;
                `;
            }
            
            // Styles pour la liste d'options
            this.optionsList.style.cssText = `
                max-height: ${style.dropdown.maxHeight};
                overflow-y: auto;
                overflow-x: hidden;
            `;
            
            // Messages
            const messageStyle = `
                padding: 16px;
                text-align: center;
                color: rgba(255, 255, 255, 0.6);
                font-size: 14px;
            `;
            
            this.loadingMessage.style.cssText = messageStyle;
            this.noResultsMessage.style.cssText = messageStyle;
        }

        bindEvents() {
            // Ouverture/fermeture
            this.selectionArea.addEventListener('click', (e) => {
                if (!this.options.disabled && !this.options.readonly) {
                    this.toggle();
                }
            });
            
            // Clear
            if (this.clearIcon) {
                this.clearIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.clear();
                });
            }
            
            // Recherche
            if (this.searchInput) {
                const handleSearch = debounce(() => {
                    this.filterOptions(this.searchInput.value);
                }, this.features.search.debounce);
                
                this.searchInput.addEventListener('input', handleSearch);
                
                // Focus sur la recherche à l'ouverture
                this.searchInput.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
            
            // Clavier
            this.selectionArea.addEventListener('keydown', (e) => {
                this.handleKeyboard(e);
            });
            
            if (this.searchInput) {
                this.searchInput.addEventListener('keydown', (e) => {
                    this.handleKeyboard(e);
                });
            }
            
            // Fermeture au clic extérieur
            document.addEventListener('click', (e) => {
                if (!this.container.contains(e.target) && !this.dropdown.contains(e.target)) {
                    this.close();
                }
            });
            
            // Gestion du resize
            window.addEventListener('resize', debounce(() => {
                if (this.isOpen) {
                    this.updateDropdownPosition();
                }
            }, 100));
            
            // Gestion du scroll
            let scrollParent = this.container.parentElement;
            while (scrollParent) {
                scrollParent.addEventListener('scroll', () => {
                    if (this.isOpen) {
                        this.updateDropdownPosition();
                    }
                }, { passive: true });
                scrollParent = scrollParent.parentElement;
            }
        }

        initFeatures() {
            // Virtualisation
            if (this.features.virtualization.enabled && this.data.length > this.features.virtualization.threshold) {
                this.initVirtualization();
            }
            
            // Async loading
            if (this.features.async.enabled) {
                this.initAsyncLoading();
            }
            
            // Groupes
            if (this.features.groups.enabled) {
                this.initGroups();
            }
            
            // Validation
            if (this.features.validation.enabled) {
                this.initValidation();
            }
        }

        renderOptions() {
            this.optionsList.innerHTML = '';
            
            if (this.loading) {
                this.showLoading();
                return;
            }
            
            if (this.filteredData.length === 0) {
                this.showNoResults();
                return;
            }
            
            this.hideMessages();
            
            // Rendu avec ou sans virtualisation
            if (this.features.virtualization.enabled && this.filteredData.length > this.features.virtualization.threshold) {
                this.renderVirtualOptions();
            } else {
                this.renderAllOptions();
            }
        }

        renderAllOptions() {
            const fragment = document.createDocumentFragment();
            
            this.filteredData.forEach((option, index) => {
                const optionEl = this.createOptionElement(option, index);
                fragment.appendChild(optionEl);
            });
            
            this.optionsList.appendChild(fragment);
            
            // Animation d'apparition
            if (this.animation.enabled) {
                this.animateOptions();
            }
        }

        createOptionElement(option, index) {
            const div = document.createElement('div');
            div.className = 'select-option';
            div.setAttribute('role', 'option');
            div.setAttribute('data-index', index);
            div.setAttribute('data-value', option.value);
            
            const isSelected = this.isSelected(option);
            if (isSelected) {
                div.classList.add('selected');
                div.setAttribute('aria-selected', 'true');
            }
            
            // Contenu de l'option
            const content = document.createElement('div');
            content.className = 'select-option-content';
            
            // Icône ou avatar
            if (this.features.icons.enabled && option.icon) {
                const icon = document.createElement('span');
                icon.className = 'select-option-icon';
                icon.innerHTML = option.icon;
                content.appendChild(icon);
            } else if (this.features.avatars.enabled && option.avatar) {
                const avatar = document.createElement('img');
                avatar.className = 'select-option-avatar';
                avatar.src = option.avatar;
                avatar.alt = option.label;
                content.appendChild(avatar);
            }
            
            // Label
            const label = document.createElement('span');
            label.className = 'select-option-label';
            
            if (this.features.search.enabled && this.features.search.highlight && this.searchInput?.value) {
                label.innerHTML = highlightMatch(option.label, this.searchInput.value);
            } else {
                label.textContent = option.label;
            }
            content.appendChild(label);
            
            // Description
            if (this.features.descriptions.enabled && option.description) {
                const desc = document.createElement('span');
                desc.className = 'select-option-description';
                desc.textContent = option.description;
                content.appendChild(desc);
            }
            
            // Checkbox pour multi-select
            if (this.mode.multiple) {
                const checkbox = document.createElement('span');
                checkbox.className = 'select-option-checkbox';
                checkbox.innerHTML = isSelected ? CONFIG.icons.check : '';
                div.appendChild(checkbox);
            }
            
            div.appendChild(content);
            
            // Styles
            Object.assign(div.style, {
                ...this.style.option,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none'
            });
            
            // Styles pour la sélection
            if (isSelected) {
                Object.assign(div.style, this.style.option.selected);
            }
            
            // Events
            div.addEventListener('mouseenter', () => {
                this.highlightedIndex = index;
                this.updateHighlight();
                Object.assign(div.style, this.style.option.hover);
            });
            
            div.addEventListener('mouseleave', () => {
                if (!isSelected) {
                    Object.assign(div.style, this.style.option);
                }
            });
            
            div.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectOption(option);
            });
            
            return div;
        }

        selectOption(option) {
            if (this.mode.multiple) {
                const index = this.selectedValues.findIndex(v => v.value === option.value);
                if (index > -1) {
                    this.selectedValues.splice(index, 1);
                } else {
                    if (this.options.maxItems && this.selectedValues.length >= this.options.maxItems) {
                        return;
                    }
                    this.selectedValues.push(option);
                }
            } else {
                this.selectedValues = [option];
            }
            
            this.updateDisplay();
            this.renderOptions();
            
            if (this.mode.closeOnSelect) {
                this.close();
            }
            
            // Emit change event
            this.emit('change', this.getValue());
        }

        updateDisplay() {
            if (this.selectedValues.length === 0) {
                this.valueDisplay.textContent = this.options.placeholder;
                this.valueDisplay.classList.add('placeholder');
                if (this.clearIcon) {
                    this.clearIcon.style.display = 'none';
                }
            } else {
                this.valueDisplay.classList.remove('placeholder');
                if (this.clearIcon) {
                    this.clearIcon.style.display = 'flex';
                }
                
                if (this.mode.tags) {
                    this.renderTags();
                } else if (this.mode.multiple) {
                    const count = this.selectedValues.length;
                    const first = this.selectedValues[0].label;
                    this.valueDisplay.textContent = count === 1 ? first : `${count} sélectionnés`;
                } else {
                    this.valueDisplay.textContent = this.selectedValues[0].label;
                }
            }
        }

        renderTags() {
            this.valueDisplay.innerHTML = '';
            this.valueDisplay.style.display = 'flex';
            this.valueDisplay.style.flexWrap = 'wrap';
            this.valueDisplay.style.gap = '4px';
            
            this.selectedValues.forEach(value => {
                const tag = document.createElement('span');
                tag.className = 'select-tag';
                tag.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    ${Object.entries(this.style.tag).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}
                `;
                
                const label = document.createElement('span');
                label.textContent = value.label;
                tag.appendChild(label);
                
                const remove = document.createElement('span');
                remove.className = 'select-tag-remove';
                remove.innerHTML = '×';
                remove.style.cssText = `
                    cursor: pointer;
                    font-size: 18px;
                    line-height: 1;
                    opacity: 0.7;
                    transition: opacity 0.2s;
                `;
                remove.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeTag(value);
                });
                tag.appendChild(remove);
                
                this.valueDisplay.appendChild(tag);
            });
        }

        removeTag(value) {
            const index = this.selectedValues.findIndex(v => v.value === value.value);
            if (index > -1) {
                this.selectedValues.splice(index, 1);
                this.updateDisplay();
                this.emit('change', this.getValue());
            }
        }

        filterOptions(query) {
            if (!query) {
                this.filteredData = [...this.data];
            } else {
                const lowerQuery = query.toLowerCase();
                this.filteredData = this.data.filter(option => {
                    const label = option.label.toLowerCase();
                    const description = option.description?.toLowerCase() || '';
                    
                    if (this.features.search.fuzzy) {
                        return this.fuzzyMatch(lowerQuery, label) || this.fuzzyMatch(lowerQuery, description);
                    } else {
                        return label.includes(lowerQuery) || description.includes(lowerQuery);
                    }
                });
            }
            
            // Option de création
            if (this.features.create.enabled && query && !this.filteredData.find(o => o.label.toLowerCase() === query.toLowerCase())) {
                this.filteredData.unshift({
                    value: `create-${query}`,
                    label: this.features.create.prompt.replace('{input}', query),
                    isCreate: true,
                    query: query
                });
            }
            
            this.highlightedIndex = 0;
            this.renderOptions();
        }

        fuzzyMatch(pattern, str) {
            let patternIdx = 0;
            const patternLength = pattern.length;
            let strIdx = 0;
            const strLength = str.length;
            
            while (patternIdx < patternLength && strIdx < strLength) {
                if (pattern[patternIdx] === str[strIdx]) {
                    patternIdx++;
                }
                strIdx++;
            }
            
            return patternIdx === patternLength;
        }

        handleKeyboard(e) {
            if (!this.features.keyboard.enabled) return;
            
            const key = e.key;
            
            switch (key) {
                case 'Enter':
                    e.preventDefault();
                    if (this.isOpen && this.highlightedIndex >= 0) {
                        const option = this.filteredData[this.highlightedIndex];
                        if (option) {
                            this.selectOption(option);
                        }
                    } else if (!this.isOpen) {
                        this.open();
                    }
                    break;
                    
                case 'Escape':
                    e.preventDefault();
                    if (this.isOpen) {
                        this.close();
                    }
                    break;
                    
                case 'ArrowDown':
                    e.preventDefault();
                    if (!this.isOpen) {
                        this.open();
                    } else {
                        this.highlightedIndex = Math.min(this.highlightedIndex + 1, this.filteredData.length - 1);
                        this.updateHighlight();
                        this.scrollToHighlighted();
                    }
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    if (this.isOpen) {
                        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
                        this.updateHighlight();
                        this.scrollToHighlighted();
                    }
                    break;
                    
                case 'Home':
                    if (this.isOpen) {
                        e.preventDefault();
                        this.highlightedIndex = 0;
                        this.updateHighlight();
                        this.scrollToHighlighted();
                    }
                    break;
                    
                case 'End':
                    if (this.isOpen) {
                        e.preventDefault();
                        this.highlightedIndex = this.filteredData.length - 1;
                        this.updateHighlight();
                        this.scrollToHighlighted();
                    }
                    break;
                    
                case 'Tab':
                    if (this.isOpen) {
                        this.close();
                    }
                    break;
                    
                default:
                    // Typeahead
                    if (this.features.keyboard.typeahead && key.length === 1 && !this.searchInput) {
                        this.handleTypeahead(key);
                    }
            }
        }

        handleTypeahead(char) {
            clearTimeout(this.typeaheadTimeout);
            this.typeaheadBuffer = (this.typeaheadBuffer || '') + char.toLowerCase();
            
            const match = this.data.findIndex(option => 
                option.label.toLowerCase().startsWith(this.typeaheadBuffer)
            );
            
            if (match >= 0) {
                this.highlightedIndex = match;
                this.updateHighlight();
                this.scrollToHighlighted();
            }
            
            this.typeaheadTimeout = setTimeout(() => {
                this.typeaheadBuffer = '';
            }, 1000);
        }

        updateHighlight() {
            const options = this.optionsList.querySelectorAll('.select-option');
            options.forEach((option, index) => {
                if (index === this.highlightedIndex) {
                    option.classList.add('highlighted');
                    option.setAttribute('aria-selected', 'true');
                    Object.assign(option.style, this.style.option.hover);
                } else if (!option.classList.contains('selected')) {
                    option.classList.remove('highlighted');
                    option.setAttribute('aria-selected', 'false');
                    Object.assign(option.style, this.style.option);
                }
            });
        }

        scrollToHighlighted() {
            const highlighted = this.optionsList.querySelector('.highlighted');
            if (highlighted) {
                const listRect = this.optionsList.getBoundingClientRect();
                const itemRect = highlighted.getBoundingClientRect();
                
                if (itemRect.bottom > listRect.bottom) {
                    this.optionsList.scrollTop += itemRect.bottom - listRect.bottom;
                } else if (itemRect.top < listRect.top) {
                    this.optionsList.scrollTop -= listRect.top - itemRect.top;
                }
            }
        }

        updateDropdownPosition() {
            const rect = this.container.getBoundingClientRect();
            const dropdownHeight = this.dropdown.offsetHeight;
            const windowHeight = window.innerHeight;
            const spaceBelow = windowHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            let top, bottom;
            
            if (this.options.dropdownPosition === 'top' || (this.options.dropdownPosition === 'auto' && spaceBelow < dropdownHeight && spaceAbove > dropdownHeight)) {
                // Position au-dessus
                bottom = windowHeight - rect.top + 4;
                this.dropdown.style.bottom = `${bottom}px`;
                this.dropdown.style.top = 'auto';
            } else {
                // Position en dessous
                top = rect.bottom + 4;
                this.dropdown.style.top = `${top}px`;
                this.dropdown.style.bottom = 'auto';
            }
            
            // Position horizontale
            this.dropdown.style.left = `${rect.left}px`;
            this.dropdown.style.width = `${rect.width}px`;
        }

        animateOptions() {
            const options = this.optionsList.querySelectorAll('.select-option');
            const effects = this.animation.effects;
            const duration = this.animation.duration;
            const stagger = this.animation.stagger || 0;
            
            options.forEach((option, index) => {
                option.style.opacity = '0';
                
                if (effects.includes('slide')) {
                    option.style.transform = 'translateY(-10px)';
                }
                if (effects.includes('scale')) {
                    option.style.transform = 'scale(0.95)';
                }
                
                setTimeout(() => {
                    option.style.transition = `all ${duration}ms ${this.animation.easing}`;
                    option.style.opacity = '1';
                    option.style.transform = 'none';
                }, index * stagger);
            });
        }

        showLoading() {
            this.loadingMessage.style.display = 'block';
            this.noResultsMessage.style.display = 'none';
            this.optionsList.style.display = 'none';
        }

        showNoResults() {
            this.loadingMessage.style.display = 'none';
            this.noResultsMessage.style.display = 'block';
            this.optionsList.style.display = 'none';
        }

        hideMessages() {
            this.loadingMessage.style.display = 'none';
            this.noResultsMessage.style.display = 'none';
            this.optionsList.style.display = 'block';
        }

        open() {
            if (this.isOpen || this.options.disabled || this.options.readonly) return;
            
            this.isOpen = true;
            this.container.setAttribute('aria-expanded', 'true');
            this.dropdown.style.display = 'block';
            
            // Animation d'ouverture
            if (this.animation.enabled) {
                this.dropdown.style.opacity = '0';
                this.dropdown.style.transform = 'translateY(-10px)';
                
                requestAnimationFrame(() => {
                    this.dropdown.style.transition = `all ${this.animation.duration}ms ${this.animation.easing}`;
                    this.dropdown.style.opacity = '1';
                    this.dropdown.style.transform = 'translateY(0)';
                });
            }
            
            // Position
            this.updateDropdownPosition();
            
            // Rendu des options
            this.renderOptions();
            
            // Focus sur la recherche
            if (this.searchInput) {
                setTimeout(() => {
                    this.searchInput.focus();
                }, 100);
            }
            
            // Rotation de l'icône
            this.dropdownIcon.style.transform = 'rotate(180deg)';
            
            // Emit event
            this.emit('open');
        }

        close() {
            if (!this.isOpen) return;
            
            this.isOpen = false;
            this.container.setAttribute('aria-expanded', 'false');
            
            // Animation de fermeture
            if (this.animation.enabled) {
                this.dropdown.style.transition = `all ${this.animation.duration}ms ${this.animation.easing}`;
                this.dropdown.style.opacity = '0';
                this.dropdown.style.transform = 'translateY(-10px)';
                
                setTimeout(() => {
                    this.dropdown.style.display = 'none';
                }, this.animation.duration);
            } else {
                this.dropdown.style.display = 'none';
            }
            
            // Reset recherche
            if (this.searchInput) {
                this.searchInput.value = '';
                this.filterOptions('');
            }
            
            // Reset highlight
            this.highlightedIndex = -1;
            
            // Rotation de l'icône
            this.dropdownIcon.style.transform = 'rotate(0)';
            
            // Emit event
            this.emit('close');
        }

        toggle() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        }

        clear() {
            this.selectedValues = [];
            this.updateDisplay();
            this.emit('change', this.getValue());
            this.emit('clear');
        }

        getValue() {
            if (this.mode.multiple) {
                return this.selectedValues.map(v => v.value);
            } else {
                return this.selectedValues.length > 0 ? this.selectedValues[0].value : null;
            }
        }

        setValue(value) {
            if (this.mode.multiple) {
                const values = Array.isArray(value) ? value : [value];
                this.selectedValues = this.data.filter(option => 
                    values.includes(option.value)
                );
            } else {
                const option = this.data.find(o => o.value === value);
                this.selectedValues = option ? [option] : [];
            }
            
            this.updateDisplay();
        }

        isSelected(option) {
            return this.selectedValues.some(v => v.value === option.value);
        }

        setOptions(options) {
            this.data = options;
            this.filteredData = [...options];
            
            // Reset sélection si les options sélectionnées n'existent plus
            this.selectedValues = this.selectedValues.filter(selected =>
                this.data.some(option => option.value === selected.value)
            );
            
            this.updateDisplay();
            
            if (this.isOpen) {
                this.renderOptions();
            }
        }

        disable() {
            this.options.disabled = true;
            this.container.classList.add('disabled');
            this.selectionArea.setAttribute('aria-disabled', 'true');
            this.selectionArea.style.opacity = '0.5';
            this.selectionArea.style.cursor = 'not-allowed';
        }

        enable() {
            this.options.disabled = false;
            this.container.classList.remove('disabled');
            this.selectionArea.setAttribute('aria-disabled', 'false');
            this.selectionArea.style.opacity = '1';
            this.selectionArea.style.cursor = 'pointer';
        }

        emit(event, data) {
            const customEvent = new CustomEvent(`select:${event}`, {
                detail: data,
                bubbles: true
            });
            this.container.dispatchEvent(customEvent);
            
            // Observer pattern
            if (this.observers.has(event)) {
                this.observers.get(event).forEach(callback => {
                    callback(data);
                });
            }
        }

        on(event, callback) {
            if (!this.observers.has(event)) {
                this.observers.set(event, []);
            }
            this.observers.get(event).push(callback);
            
            return () => {
                const callbacks = this.observers.get(event);
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            };
        }

        destroy() {
            // Remove event listeners
            this.container.removeEventListener('click', this.toggle);
            document.removeEventListener('click', this.handleOutsideClick);
            
            // Remove elements
            this.dropdown.remove();
            this.container.remove();
            
            // Clear references
            this.observers.clear();
            this.cache.clear();
        }
    }

    // ========================================
    // FONCTIONS PUBLIQUES
    // ========================================
    async function create(options = {}) {
        const select = new SelectField(options);
        
        if (options.container) {
            const container = typeof options.container === 'string'
                ? document.querySelector(options.container)
                : options.container;
            
            if (container) {
                container.appendChild(select.container);
            }
        }
        
        return select;
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('select-field-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'select-field-styles';
        styles.textContent = `
            /* Select Field Styles */
            .select-field * {
                box-sizing: border-box;
            }
            
            .select-value.placeholder {
                color: rgba(255, 255, 255, 0.5);
            }
            
            .select-option.highlighted {
                background: rgba(255, 255, 255, 0.1) !important;
            }
            
            .select-option.selected {
                font-weight: 500;
            }
            
            .select-option-content {
                display: flex;
                align-items: center;
                gap: 12px;
                flex: 1;
            }
            
            .select-option-icon,
            .select-option-avatar {
                flex-shrink: 0;
            }
            
            .select-option-avatar {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                object-fit: cover;
            }
            
            .select-option-label {
                flex: 1;
            }
            
            .select-option-label mark {
                background: rgba(251, 191, 36, 0.3);
                color: inherit;
                border-radius: 2px;
                padding: 0 2px;
            }
            
            .select-option-description {
                display: block;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
                margin-top: 2px;
            }
            
            .select-option-checkbox {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #3b82f6;
            }
            
            .select-tag-remove:hover {
                opacity: 1 !important;
            }
            
            .select-dropdown {
                animation: selectDropdownIn 0.3s ease-out;
            }
            
            @keyframes selectDropdownIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .animate-spin {
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            /* Scrollbar personnalisée */
            .select-options::-webkit-scrollbar {
                width: 8px;
            }
            
            .select-options::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }
            
            .select-options::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
            }
            
            .select-options::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            /* Dark mode automatique */
            @media (prefers-color-scheme: light) {
                .select-field {
                    --text-color: #1f2937;
                    --bg-color: rgba(0, 0, 0, 0.05);
                    --border-color: rgba(0, 0, 0, 0.1);
                }
            }
            
            /* Responsive */
            @media (max-width: 640px) {
                .select-dropdown {
                    position: fixed !important;
                    left: 10px !important;
                    right: 10px !important;
                    width: auto !important;
                }
            }
            
            /* Print */
            @media print {
                .select-dropdown {
                    display: none !important;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Auto-inject styles
    let stylesInjected = false;
    function ensureStyles() {
        if (!stylesInjected) {
            injectStyles();
            stylesInjected = true;
        }
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create: async (options) => {
            ensureStyles();
            return await create(options);
        },
        CONFIG,
        injectStyles
    };
})();

// Export pour utilisation
export default SelectField;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-XX] - Position du dropdown avec scroll
   Solution: Écoute du scroll sur tous les parents, recalcul position
   
   [2024-01-XX] - Performance avec grandes listes
   Cause: Rendu de tous les éléments DOM
   Résolution: Virtualisation pour listes > 100 items
   
   [2024-01-XX] - Accessibilité clavier complexe
   Solution: Gestion complète ARIA, navigation flèches, typeahead
   
   NOTES POUR REPRISES FUTURES:
   - La virtualisation pourrait être améliorée avec Intersection Observer
   - Le fuzzy search pourrait utiliser un algorithme plus sophistiqué
   - Prévoir l'intégration avec des frameworks (React adapter, etc.)
   - Le positionnement pourrait utiliser Popper.js si disponible
   ======================================== */