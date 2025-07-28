/* ========================================
   LIST.COMPONENT.JS - Système de listes modulaire
   Chemin: src/js/shared/ui/data-display/list.component.js
   
   DESCRIPTION:
   Composant de liste ultra-complet avec style glassmorphism frost.
   Gère tous les types de listes possibles avec animations fluides.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-300)
   2. Méthodes privées (lignes 301-1200)
   3. Gestionnaires d'événements (lignes 1201-1400)
   4. API publique (lignes 1401-1500)
   
   DÉPENDANCES:
   - frosted-icons.component.js (pour les icônes d'actions)
   - ui.config.js (configuration globale)
   - list.component.css (styles spécifiques)
   ======================================== */

const ListComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            'glassmorphism': {
                container: {
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px) brightness(1.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                },
                item: {
                    background: 'transparent',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    hover: {
                        background: 'rgba(255, 255, 255, 0.05)',
                    }
                },
                selected: {
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                }
            },
            'neumorphism': {
                container: {
                    background: '#e0e5ec',
                    boxShadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
                    borderRadius: '20px',
                },
                item: {
                    background: 'transparent',
                    padding: '16px',
                    hover: {
                        boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                    }
                }
            },
            'material': {
                container: {
                    background: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderRadius: '4px',
                },
                item: {
                    borderBottom: '1px solid #e0e0e0',
                    hover: {
                        background: '#f5f5f5',
                    }
                }
            },
            'minimal': {
                container: {
                    background: 'transparent',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                },
                item: {
                    padding: '12px',
                    borderBottom: '1px solid #f0f0f0',
                }
            },
            'ios': {
                container: {
                    background: 'rgba(242, 242, 247, 0.6)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '10px',
                },
                item: {
                    padding: '11px 16px',
                    borderBottom: '0.5px solid rgba(60, 60, 67, 0.18)',
                }
            }
        },

        // Types de listes
        types: {
            'simple': {
                itemHeight: 48,
                padding: '12px 16px',
                fontSize: '14px',
            },
            'detailed': {
                itemHeight: 72,
                padding: '16px',
                primaryFontSize: '16px',
                secondaryFontSize: '13px',
            },
            'avatar': {
                itemHeight: 64,
                avatarSize: 40,
                padding: '12px 16px',
                gap: '12px',
            },
            'media': {
                itemHeight: 88,
                thumbnailSize: 64,
                padding: '12px',
                gap: '16px',
            },
            'card': {
                itemHeight: 'auto',
                padding: '20px',
                margin: '8px 0',
                elevated: true,
            },
            'timeline': {
                itemHeight: 'auto',
                padding: '20px 16px 20px 40px',
                dotSize: 12,
                lineWidth: 2,
            },
            'chat': {
                itemHeight: 'auto',
                padding: '8px 16px',
                bubbleStyle: true,
                avatarSize: 32,
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                enabled: false,
                duration: 0,
            },
            'subtle': {
                enabled: true,
                duration: 200,
                easing: 'ease',
                hover: true,
                selection: true,
            },
            'smooth': {
                enabled: true,
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                hover: true,
                selection: true,
                reorder: true,
                entrance: 'fadeIn',
            },
            'rich': {
                enabled: true,
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                hover: true,
                selection: true,
                reorder: true,
                entrance: 'slideIn',
                exit: 'slideOut',
                stagger: 50,
                parallax: true,
                morphing: true,
            },
            'playful': {
                enabled: true,
                duration: 600,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                bounce: true,
                shake: true,
                flip: true,
                particles: true,
            }
        },

        // Fonctionnalités
        features: {
            // Sélection
            selection: {
                enabled: false,
                mode: 'none', // 'none', 'single', 'multiple'
                checkbox: false,
                highlight: true,
                keyboard: true,
                touch: true,
                swipe: false,
            },

            // Tri
            sort: {
                enabled: false,
                fields: [],
                initial: null,
                direction: 'asc',
                indicator: true,
                animation: true,
            },

            // Filtrage
            filter: {
                enabled: false,
                searchable: false,
                fields: [],
                live: true,
                debounce: 300,
                highlight: true,
            },

            // Drag & Drop
            dragDrop: {
                enabled: false,
                handle: false,
                axis: 'y', // 'x', 'y', 'xy'
                revert: true,
                placeholder: true,
                autoScroll: true,
                groups: [],
            },

            // Actions
            actions: {
                enabled: false,
                items: [], // ['edit', 'delete', 'share', etc.]
                position: 'end', // 'start', 'end', 'hover'
                swipe: false,
                contextMenu: false,
                bulk: false,
            },

            // Virtualisation
            virtualization: {
                enabled: false,
                threshold: 100,
                buffer: 5,
                dynamic: true,
            },

            // Pagination
            pagination: {
                enabled: false,
                type: 'pages', // 'pages', 'infinite', 'load-more'
                pageSize: 20,
                showInfo: true,
                scrollToTop: true,
            },

            // États
            states: {
                loading: {
                    enabled: true,
                    skeleton: true,
                    shimmer: true,
                    message: 'Chargement...',
                },
                empty: {
                    enabled: true,
                    icon: 'inbox',
                    message: 'Aucun élément',
                    action: null,
                },
                error: {
                    enabled: true,
                    retry: true,
                    message: 'Une erreur est survenue',
                },
            },

            // Groupage
            grouping: {
                enabled: false,
                field: null,
                collapsible: true,
                sticky: true,
                showCount: true,
            },

            // Accessibilité
            accessibility: {
                enabled: true,
                announcements: true,
                keyboard: true,
                focus: true,
                aria: true,
            },

            // Performance
            performance: {
                debounce: true,
                throttle: true,
                lazy: true,
                intersection: true,
            }
        },

        // Templates d'items
        templates: {
            'default': (item) => `
                <div class="list-item-content">
                    <span class="list-item-text">${item.text || item.label || item.name}</span>
                </div>
            `,
            'detailed': (item) => `
                <div class="list-item-content">
                    <div class="list-item-primary">${item.title}</div>
                    <div class="list-item-secondary">${item.subtitle || ''}</div>
                </div>
            `,
            'avatar': (item) => `
                <div class="list-item-avatar">
                    ${item.avatar ? `<img src="${item.avatar}" alt="${item.name}">` : 
                      `<div class="avatar-placeholder">${(item.name || '?')[0]}</div>`}
                </div>
                <div class="list-item-content">
                    <div class="list-item-primary">${item.name}</div>
                    ${item.status ? `<div class="list-item-secondary">${item.status}</div>` : ''}
                </div>
            `,
            'media': (item) => `
                <div class="list-item-media">
                    ${item.thumbnail ? `<img src="${item.thumbnail}" alt="${item.title}">` : 
                      `<div class="media-placeholder"></div>`}
                </div>
                <div class="list-item-content">
                    <div class="list-item-primary">${item.title}</div>
                    <div class="list-item-secondary">${item.description || ''}</div>
                    ${item.meta ? `<div class="list-item-meta">${item.meta}</div>` : ''}
                </div>
            `,
            'custom': null // Fonction fournie par l'utilisateur
        },

        // Thèmes de couleurs
        themes: {
            'default': {
                primary: '#3b82f6',
                secondary: '#6b7280',
                success: '#22c55e',
                warning: '#f59e0b',
                danger: '#ef4444',
                info: '#3b82f6',
            },
            'dark': {
                primary: '#60a5fa',
                secondary: '#9ca3af',
                success: '#34d399',
                warning: '#fbbf24',
                danger: '#f87171',
                info: '#60a5fa',
            },
            'vibrant': {
                primary: '#8b5cf6',
                secondary: '#ec4899',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                info: '#06b6d4',
            }
        },

        // Classes CSS
        classes: {
            container: 'glass-list',
            wrapper: 'glass-list-wrapper',
            header: 'glass-list-header',
            body: 'glass-list-body',
            footer: 'glass-list-footer',
            item: 'glass-list-item',
            selected: 'selected',
            hover: 'hover',
            dragging: 'dragging',
            disabled: 'disabled',
            loading: 'loading',
            empty: 'empty',
            error: 'error',
        }
    };

    // ========================================
    // VARIABLES PRIVÉES
    // ========================================
    let instanceCounter = 0;
    const instances = new Map();
    const styleInjected = new Map();

    // ========================================
    // MÉTHODES PRIVÉES - CRÉATION
    // ========================================
    function create(options = {}) {
        const instanceId = `list-${++instanceCounter}`;
        const config = mergeConfig(options);
        
        // Structure HTML
        const container = createContainer(instanceId, config);
        const state = createState(config);
        
        // Instance
        const instance = {
            id: instanceId,
            container,
            config,
            state,
            items: [],
            selectedItems: new Set(),
            filteredItems: null,
            
            // Méthodes publiques
            render: (items) => render(instance, items),
            addItem: (item, index) => addItem(instance, item, index),
            removeItem: (item) => removeItem(instance, item),
            updateItem: (item, updates) => updateItem(instance, item, updates),
            clearItems: () => clearItems(instance),
            
            getSelected: () => getSelected(instance),
            setSelected: (items) => setSelected(instance, items),
            clearSelection: () => clearSelection(instance),
            
            sort: (field, direction) => sortItems(instance, field, direction),
            filter: (query) => filterItems(instance, query),
            clearFilter: () => clearFilter(instance),
            
            setLoading: (loading) => setLoading(instance, loading),
            setError: (error) => setError(instance, error),
            
            refresh: () => refresh(instance),
            destroy: () => destroy(instance),
            
            on: (event, handler) => on(instance, event, handler),
            off: (event, handler) => off(instance, event, handler),
        };
        
        // Initialiser
        instances.set(instanceId, instance);
        initialize(instance);
        
        return instance;
    }

    // ========================================
    // MÉTHODES PRIVÉES - CONFIGURATION
    // ========================================
    function mergeConfig(options) {
        const merged = {
            style: options.style || 'glassmorphism',
            type: options.type || 'simple',
            animation: options.animation || 'smooth',
            features: {},
            templates: {},
            theme: options.theme || 'default',
            classes: { ...CONFIG.classes },
            ...options
        };

        // Fusionner les features
        Object.keys(CONFIG.features).forEach(feature => {
            merged.features[feature] = {
                ...CONFIG.features[feature],
                ...(options.features?.[feature] || {})
            };
        });

        // Fusionner les templates
        merged.templates = {
            ...CONFIG.templates,
            ...(options.templates || {})
        };

        return merged;
    }

    // ========================================
    // MÉTHODES PRIVÉES - DOM
    // ========================================
    function createContainer(id, config) {
        const container = document.createElement('div');
        container.id = id;
        container.className = config.classes.container;
        container.setAttribute('role', 'list');
        
        // Wrapper
        const wrapper = document.createElement('div');
        wrapper.className = config.classes.wrapper;
        
        // Header (si nécessaire)
        if (config.features.filter.searchable || config.features.sort.enabled) {
            const header = createHeader(config);
            wrapper.appendChild(header);
        }
        
        // Body
        const body = document.createElement('div');
        body.className = config.classes.body;
        body.setAttribute('role', 'group');
        wrapper.appendChild(body);
        
        // Footer (pagination)
        if (config.features.pagination.enabled) {
            const footer = createFooter(config);
            wrapper.appendChild(footer);
        }
        
        container.appendChild(wrapper);
        
        // Appliquer le style
        applyStyle(container, config);
        
        return container;
    }

    function createHeader(config) {
        const header = document.createElement('div');
        header.className = config.classes.header;
        
        // Barre de recherche
        if (config.features.filter.searchable) {
            const searchBox = createSearchBox(config);
            header.appendChild(searchBox);
        }
        
        // Options de tri
        if (config.features.sort.enabled) {
            const sortOptions = createSortOptions(config);
            header.appendChild(sortOptions);
        }
        
        return header;
    }

    function createFooter(config) {
        const footer = document.createElement('div');
        footer.className = config.classes.footer;
        
        if (config.features.pagination.type === 'pages') {
            const pagination = createPagination(config);
            footer.appendChild(pagination);
        } else if (config.features.pagination.type === 'load-more') {
            const loadMore = createLoadMoreButton(config);
            footer.appendChild(loadMore);
        }
        
        return footer;
    }

    function createSearchBox(config) {
        const searchBox = document.createElement('div');
        searchBox.className = 'list-search-box';
        
        const input = document.createElement('input');
        input.type = 'search';
        input.placeholder = 'Rechercher...';
        input.className = 'list-search-input';
        
        const icon = document.createElement('span');
        icon.className = 'list-search-icon';
        icon.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
            </svg>
        `;
        
        searchBox.appendChild(icon);
        searchBox.appendChild(input);
        
        return searchBox;
    }

    // ========================================
    // MÉTHODES PRIVÉES - RENDU
    // ========================================
    function render(instance, items = []) {
        instance.items = items;
        const body = instance.container.querySelector(`.${instance.config.classes.body}`);
        
        // État loading
        if (instance.state.loading) {
            renderLoading(body, instance.config);
            return;
        }
        
        // État error
        if (instance.state.error) {
            renderError(body, instance.config, instance.state.error);
            return;
        }
        
        // Filtrer si nécessaire
        const itemsToRender = instance.filteredItems !== null ? 
            instance.filteredItems : items;
        
        // État empty
        if (itemsToRender.length === 0) {
            renderEmpty(body, instance.config);
            return;
        }
        
        // Rendu des items
        if (instance.config.features.virtualization.enabled && 
            itemsToRender.length > instance.config.features.virtualization.threshold) {
            renderVirtual(instance, itemsToRender);
        } else {
            renderAll(instance, itemsToRender);
        }
        
        // Mise à jour pagination
        if (instance.config.features.pagination.enabled) {
            updatePagination(instance);
        }
    }

    function renderAll(instance, items) {
        const body = instance.container.querySelector(`.${instance.config.classes.body}`);
        const fragment = document.createDocumentFragment();
        
        // Grouper si nécessaire
        if (instance.config.features.grouping.enabled) {
            const groups = groupItems(items, instance.config.features.grouping.field);
            
            Object.entries(groups).forEach(([groupName, groupItems]) => {
                const groupEl = createGroup(groupName, groupItems, instance.config);
                fragment.appendChild(groupEl);
                
                groupItems.forEach((item, index) => {
                    const itemEl = createItemElement(item, index, instance);
                    groupEl.querySelector('.list-group-items').appendChild(itemEl);
                });
            });
        } else {
            items.forEach((item, index) => {
                const itemEl = createItemElement(item, index, instance);
                
                // Animation d'entrée
                if (instance.config.animations[instance.config.animation].entrance) {
                    animateEntrance(itemEl, index, instance.config);
                }
                
                fragment.appendChild(itemEl);
            });
        }
        
        // Remplacer le contenu
        body.innerHTML = '';
        body.appendChild(fragment);
    }

    function createItemElement(item, index, instance) {
        const itemEl = document.createElement('div');
        itemEl.className = instance.config.classes.item;
        itemEl.setAttribute('role', 'listitem');
        itemEl.setAttribute('data-index', index);
        itemEl.setAttribute('tabindex', '0');
        
        // ID unique
        if (item.id !== undefined) {
            itemEl.setAttribute('data-id', item.id);
        }
        
        // Template
        const template = instance.config.templates[instance.config.type] || 
                        instance.config.templates.default;
        
        if (typeof template === 'function') {
            itemEl.innerHTML = template(item);
        } else {
            itemEl.textContent = item.toString();
        }
        
        // Checkbox de sélection
        if (instance.config.features.selection.checkbox) {
            const checkbox = createSelectionCheckbox(item, instance);
            itemEl.insertBefore(checkbox, itemEl.firstChild);
        }
        
        // Actions
        if (instance.config.features.actions.enabled) {
            const actions = createItemActions(item, instance);
            itemEl.appendChild(actions);
        }
        
        // État sélectionné
        if (instance.selectedItems.has(item)) {
            itemEl.classList.add(instance.config.classes.selected);
        }
        
        // Événements
        attachItemEvents(itemEl, item, instance);
        
        return itemEl;
    }

    // ========================================
    // MÉTHODES PRIVÉES - ÉVÉNEMENTS
    // ========================================
    function attachItemEvents(itemEl, item, instance) {
        // Click
        itemEl.addEventListener('click', (e) => {
            handleItemClick(e, item, instance);
        });
        
        // Keyboard
        itemEl.addEventListener('keydown', (e) => {
            handleItemKeydown(e, item, instance);
        });
        
        // Hover (si animation)
        if (instance.config.animations[instance.config.animation].hover) {
            itemEl.addEventListener('mouseenter', () => {
                itemEl.classList.add(instance.config.classes.hover);
            });
            
            itemEl.addEventListener('mouseleave', () => {
                itemEl.classList.remove(instance.config.classes.hover);
            });
        }
        
        // Drag & Drop
        if (instance.config.features.dragDrop.enabled) {
            attachDragEvents(itemEl, item, instance);
        }
        
        // Context menu
        if (instance.config.features.actions.contextMenu) {
            itemEl.addEventListener('contextmenu', (e) => {
                handleContextMenu(e, item, instance);
            });
        }
        
        // Touch/Swipe
        if (instance.config.features.selection.swipe || 
            instance.config.features.actions.swipe) {
            attachTouchEvents(itemEl, item, instance);
        }
    }

    function handleItemClick(e, item, instance) {
        // Ignorer si click sur action ou checkbox
        if (e.target.closest('.list-item-actions') || 
            e.target.closest('.list-item-checkbox')) {
            return;
        }
        
        const config = instance.config.features.selection;
        
        if (!config.enabled || config.mode === 'none') {
            // Émettre événement click simple
            emit(instance, 'itemClick', { item, event: e });
            return;
        }
        
        if (config.mode === 'single') {
            // Désélectionner tout
            instance.selectedItems.clear();
            instance.container.querySelectorAll(`.${instance.config.classes.selected}`)
                .forEach(el => el.classList.remove(instance.config.classes.selected));
            
            // Sélectionner l'item
            instance.selectedItems.add(item);
            e.currentTarget.classList.add(instance.config.classes.selected);
        } else if (config.mode === 'multiple') {
            // Toggle sélection
            if (instance.selectedItems.has(item)) {
                instance.selectedItems.delete(item);
                e.currentTarget.classList.remove(instance.config.classes.selected);
            } else {
                instance.selectedItems.add(item);
                e.currentTarget.classList.add(instance.config.classes.selected);
            }
        }
        
        // Mettre à jour checkboxes
        updateSelectionCheckboxes(instance);
        
        // Émettre événement
        emit(instance, 'selectionChange', {
            selected: Array.from(instance.selectedItems),
            item,
            action: instance.selectedItems.has(item) ? 'select' : 'deselect'
        });
    }

    // ========================================
    // MÉTHODES PRIVÉES - ANIMATIONS
    // ========================================
    function animateEntrance(element, index, config) {
        const animConfig = CONFIG.animations[config.animation];
        const entrance = animConfig.entrance;
        
        if (!entrance) return;
        
        // Style initial
        element.style.opacity = '0';
        
        switch (entrance) {
            case 'fadeIn':
                element.style.transition = `opacity ${animConfig.duration}ms ${animConfig.easing}`;
                break;
                
            case 'slideIn':
                element.style.transform = 'translateX(-20px)';
                element.style.transition = `all ${animConfig.duration}ms ${animConfig.easing}`;
                break;
                
            case 'scaleIn':
                element.style.transform = 'scale(0.8)';
                element.style.transition = `all ${animConfig.duration}ms ${animConfig.easing}`;
                break;
        }
        
        // Délai stagger
        const delay = animConfig.stagger ? index * animConfig.stagger : 0;
        
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'none';
        }, delay);
    }

    // ========================================
    // MÉTHODES PRIVÉES - STYLES
    // ========================================
    function applyStyle(container, config) {
        const styleConfig = CONFIG.styles[config.style];
        if (!styleConfig) return;
        
        // Container
        Object.assign(container.style, styleConfig.container);
        
        // Injecter CSS si nécessaire
        injectStyles(config);
    }

    function injectStyles(config) {
        const styleId = `list-style-${config.style}`;
        
        if (styleInjected.has(styleId)) return;
        
        const styleConfig = CONFIG.styles[config.style];
        const animConfig = CONFIG.animations[config.animation];
        
        const css = `
            /* Container */
            .${config.classes.container} {
                position: relative;
                width: 100%;
                overflow: hidden;
            }
            
            /* Items */
            .${config.classes.item} {
                position: relative;
                display: flex;
                align-items: center;
                cursor: pointer;
                outline: none;
                transition: all ${animConfig.duration}ms ${animConfig.easing};
                ${Object.entries(styleConfig.item)
                    .filter(([key]) => key !== 'hover')
                    .map(([key, value]) => `${key}: ${value};`)
                    .join('\n')}
            }
            
            /* Hover */
            .${config.classes.item}:hover,
            .${config.classes.item}.${config.classes.hover} {
                ${Object.entries(styleConfig.item.hover || {})
                    .map(([key, value]) => `${key}: ${value};`)
                    .join('\n')}
            }
            
            /* Selected */
            .${config.classes.item}.${config.classes.selected} {
                ${Object.entries(styleConfig.selected || {})
                    .map(([key, value]) => `${key}: ${value};`)
                    .join('\n')}
            }
            
            /* Focus */
            .${config.classes.item}:focus {
                outline: 2px solid rgba(59, 130, 246, 0.5);
                outline-offset: -2px;
            }
            
            /* Disabled */
            .${config.classes.item}.${config.classes.disabled} {
                opacity: 0.5;
                cursor: not-allowed;
                pointer-events: none;
            }
            
            /* Content areas */
            .list-item-content {
                flex: 1;
                min-width: 0;
            }
            
            .list-item-primary {
                font-weight: 500;
                color: rgba(0, 0, 0, 0.87);
                margin-bottom: 2px;
            }
            
            .list-item-secondary {
                font-size: 0.875em;
                color: rgba(0, 0, 0, 0.54);
            }
            
            /* Avatar */
            .list-item-avatar {
                width: 40px;
                height: 40px;
                margin-right: 12px;
                border-radius: 50%;
                overflow: hidden;
                flex-shrink: 0;
            }
            
            .list-item-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .avatar-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(59, 130, 246, 0.1);
                color: #3b82f6;
                font-weight: 500;
                font-size: 1.2em;
            }
            
            /* Media */
            .list-item-media {
                width: 64px;
                height: 64px;
                margin-right: 16px;
                border-radius: 8px;
                overflow: hidden;
                flex-shrink: 0;
            }
            
            .list-item-media img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            /* Actions */
            .list-item-actions {
                display: flex;
                gap: 4px;
                margin-left: 12px;
            }
            
            /* States */
            .${config.classes.loading} {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 200px;
                color: rgba(0, 0, 0, 0.54);
            }
            
            .${config.classes.empty} {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 200px;
                text-align: center;
                color: rgba(0, 0, 0, 0.54);
            }
            
            .${config.classes.error} {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 200px;
                text-align: center;
                color: #ef4444;
            }
            
            /* Animations */
            @keyframes list-skeleton-pulse {
                0% { opacity: 0.4; }
                50% { opacity: 0.7; }
                100% { opacity: 0.4; }
            }
            
            .skeleton-item {
                animation: list-skeleton-pulse 1.5s ease-in-out infinite;
            }
        `;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
        
        styleInjected.set(styleId, true);
    }

    // ========================================
    // MÉTHODES PRIVÉES - UTILITAIRES
    // ========================================
    function createState(config) {
        return {
            loading: false,
            error: null,
            page: 1,
            sortField: config.features.sort.initial,
            sortDirection: config.features.sort.direction,
            filterQuery: '',
            events: new Map(),
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

    // Autres méthodes utilitaires...
    function groupItems(items, field) {
        return items.reduce((groups, item) => {
            const key = item[field] || 'Autres';
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
            return groups;
        }, {});
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

    function initialize(instance) {
        // Attacher événements globaux
        if (instance.config.features.filter.searchable) {
            const searchInput = instance.container.querySelector('.list-search-input');
            if (searchInput) {
                const handleSearch = instance.config.features.filter.live ?
                    debounce((e) => filterItems(instance, e.target.value), 
                            instance.config.features.filter.debounce) :
                    (e) => {
                        if (e.key === 'Enter') {
                            filterItems(instance, e.target.value);
                        }
                    };
                
                searchInput.addEventListener(instance.config.features.filter.live ? 'input' : 'keydown', handleSearch);
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
        instance.selectedItems.clear();
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create,
        CONFIG,
        instances,
        version: '1.0.0',
        
        // Méthodes statiques utiles
        injectStyles: () => {
            Object.keys(CONFIG.styles).forEach(style => {
                injectStyles({ style, ...CONFIG });
            });
        },
        
        // Obtenir une instance
        getInstance: (id) => instances.get(id),
        
        // Détruire toutes les instances
        destroyAll: () => {
            instances.forEach(instance => destroy(instance));
            instances.clear();
        }
    };
})();

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ListComponent;
}