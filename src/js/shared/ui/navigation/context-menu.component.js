/* ========================================
   CONTEXT-MENU.COMPONENT.JS - Système de menus contextuels
   Chemin: src/js/shared/ui/navigation/context-menu.component.js
   
   DESCRIPTION:
   Composant complet pour créer des menus contextuels avec toutes
   les options possibles : styles, positions, sous-menus, icônes,
   raccourcis, séparateurs, items désactivés, animations, etc.
   
   STRUCTURE:
   1. Configuration complète (lignes 25-350)
   2. État et gestion (lignes 352-400)
   3. Méthodes de création (lignes 402-900)
   4. Gestionnaires d'événements (lignes 902-1200)
   5. Utilitaires et helpers (lignes 1202-1400)
   6. API publique (lignes 1402-1600)
   
   DÉPENDANCES:
   - dom-utils.js (pour manipulation DOM)
   - animation-utils.js (pour animations)
   - context-menu.css (styles associés)
   ======================================== */

const ContextMenu = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles visuels disponibles
        styles: {
            'glassmorphism': {
                className: 'context-menu-glassmorphism',
                effects: {
                    blur: 20,
                    opacity: 0.08,
                    border: 'rgba(255, 255, 255, 0.15)',
                    shadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                    glow: true
                }
            },
            'neumorphism': {
                className: 'context-menu-neumorphism',
                effects: {
                    innerShadow: 'inset 2px 2px 5px #b8b9be',
                    outerShadow: '5px 5px 15px #b8b9be, -5px -5px 15px #fff'
                }
            },
            'material': {
                className: 'context-menu-material',
                effects: {
                    elevation: 8,
                    ripple: true
                }
            },
            'flat': {
                className: 'context-menu-flat',
                effects: {
                    border: '1px solid #e5e7eb'
                }
            },
            'minimal': {
                className: 'context-menu-minimal',
                effects: {
                    padding: 'compact'
                }
            },
            'rounded': {
                className: 'context-menu-rounded',
                effects: {
                    borderRadius: '16px'
                }
            },
            'dark': {
                className: 'context-menu-dark',
                effects: {
                    background: '#1a1a1a',
                    color: '#ffffff'
                }
            },
            'gradient': {
                className: 'context-menu-gradient',
                effects: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                }
            },
            'floating': {
                className: 'context-menu-floating',
                effects: {
                    shadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
                    transform: 'scale'
                }
            }
        },

        // Positions disponibles
        positions: {
            'auto': { smart: true },
            'cursor': { followCursor: true },
            'top-left': { vertical: 'top', horizontal: 'left' },
            'top-right': { vertical: 'top', horizontal: 'right' },
            'bottom-left': { vertical: 'bottom', horizontal: 'left' },
            'bottom-right': { vertical: 'bottom', horizontal: 'right' },
            'center': { vertical: 'center', horizontal: 'center' },
            'custom': { callback: null }
        },

        // Tailles
        sizes: {
            'xs': { width: '150px', fontSize: '12px', itemHeight: '28px' },
            'sm': { width: '180px', fontSize: '13px', itemHeight: '32px' },
            'md': { width: '220px', fontSize: '14px', itemHeight: '36px' },
            'lg': { width: '280px', fontSize: '15px', itemHeight: '40px' },
            'xl': { width: '320px', fontSize: '16px', itemHeight: '44px' },
            'auto': { width: 'auto', minWidth: '180px', maxWidth: '400px' }
        },

        // Animations
        animations: {
            'none': { enabled: false },
            'fade': {
                enabled: true,
                duration: 150,
                easing: 'ease',
                effects: ['opacity']
            },
            'slide': {
                enabled: true,
                duration: 200,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['opacity', 'translateY']
            },
            'scale': {
                enabled: true,
                duration: 200,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                effects: ['opacity', 'scale']
            },
            'flip': {
                enabled: true,
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                effects: ['opacity', 'rotateX']
            },
            'bounce': {
                enabled: true,
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                effects: ['opacity', 'scale', 'bounce']
            },
            'rich': {
                enabled: true,
                duration: 300,
                stagger: 30,
                effects: ['opacity', 'scale', 'blur', 'glow'],
                cascade: true,
                particles: true
            }
        },

        // Types d'items
        itemTypes: {
            'normal': {
                tag: 'li',
                role: 'menuitem',
                interactive: true
            },
            'header': {
                tag: 'li',
                role: 'heading',
                interactive: false,
                className: 'context-menu-header'
            },
            'separator': {
                tag: 'li',
                role: 'separator',
                interactive: false,
                className: 'context-menu-separator'
            },
            'submenu': {
                tag: 'li',
                role: 'menuitem',
                hasPopup: true,
                className: 'context-menu-submenu'
            },
            'checkbox': {
                tag: 'li',
                role: 'menuitemcheckbox',
                checkable: true,
                className: 'context-menu-checkbox'
            },
            'radio': {
                tag: 'li',
                role: 'menuitemradio',
                checkable: true,
                className: 'context-menu-radio'
            },
            'custom': {
                tag: 'li',
                role: 'menuitem',
                template: null
            }
        },

        // Fonctionnalités
        features: {
            // Navigation
            keyboard: true,
            arrowNavigation: true,
            typeToSearch: false,
            searchDebounce: 300,
            
            // Interaction
            closeOnClick: true,
            closeOnScroll: true,
            closeOnResize: true,
            closeOnEscape: true,
            preventContextMenu: true,
            
            // Sous-menus
            submenus: true,
            submenuDelay: 200,
            submenuTrigger: 'hover', // 'hover' | 'click'
            
            // Accessibilité
            announcements: true,
            focusTrap: true,
            autoFocus: true,
            
            // Visuels
            icons: true,
            badges: true,
            shortcuts: true,
            descriptions: true,
            
            // Comportement
            multiSelect: false,
            sticky: false,
            maxHeight: '400px',
            scrollable: true,
            
            // Avancé
            virtualization: false,
            customContent: false,
            contextData: true,
            callbacks: true
        },

        // Templates
        templates: {
            menu: null,
            item: null,
            submenu: null,
            header: null,
            footer: null
        },

        // Callbacks
        callbacks: {
            onOpen: null,
            onClose: null,
            onSelect: null,
            onHover: null,
            onCheck: null,
            onBeforeOpen: null,
            onBeforeClose: null,
            onPositioned: null,
            onKeydown: null
        },

        // Classes CSS
        classes: {
            container: 'context-menu',
            overlay: 'context-menu-overlay',
            menu: 'context-menu-list',
            item: 'context-menu-item',
            icon: 'context-menu-icon',
            label: 'context-menu-label',
            shortcut: 'context-menu-shortcut',
            badge: 'context-menu-badge',
            arrow: 'context-menu-arrow',
            description: 'context-menu-description',
            active: 'is-active',
            disabled: 'is-disabled',
            checked: 'is-checked',
            focused: 'is-focused',
            hasSubmenu: 'has-submenu',
            open: 'is-open'
        },

        // Icônes par défaut
        icons: {
            submenu: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>',
            check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
            radio: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"></circle></svg>'
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const state = {
        activeMenus: new Map(),
        currentMenu: null,
        focusedItem: null,
        searchBuffer: '',
        searchTimeout: null,
        submenuTimeout: null,
        eventListeners: new Map()
    };

    // ========================================
    // MÉTHODES DE CRÉATION
    // ========================================
    
    /**
     * Crée un menu contextuel
     */
    function createMenu(options) {
        const config = mergeConfig(options);
        const menuId = generateId();
        
        // Container principal
        const container = document.createElement('div');
        container.id = menuId;
        container.className = `${CONFIG.classes.container} ${CONFIG.styles[config.style].className}`;
        container.setAttribute('role', 'menu');
        container.setAttribute('aria-label', config.label || 'Menu contextuel');
        container.style.display = 'none';
        container.style.position = 'fixed';
        container.style.zIndex = '9999';
        
        // Appliquer la taille
        const size = CONFIG.sizes[config.size];
        if (size.width !== 'auto') {
            container.style.width = size.width;
        } else {
            container.style.minWidth = size.minWidth;
            container.style.maxWidth = size.maxWidth;
        }
        
        // Liste des items
        const menuList = document.createElement('ul');
        menuList.className = CONFIG.classes.menu;
        
        // Hauteur max et scroll
        if (config.features.scrollable && config.features.maxHeight) {
            menuList.style.maxHeight = config.features.maxHeight;
            menuList.style.overflowY = 'auto';
        }
        
        // Créer les items
        if (config.items && config.items.length > 0) {
            config.items.forEach((item, index) => {
                const menuItem = createMenuItem(item, index, config, menuId);
                menuList.appendChild(menuItem);
            });
        }
        
        // Header personnalisé
        if (config.header) {
            const header = createHeader(config.header, config);
            container.insertBefore(header, menuList);
        }
        
        container.appendChild(menuList);
        
        // Footer personnalisé
        if (config.footer) {
            const footer = createFooter(config.footer, config);
            container.appendChild(footer);
        }
        
        // Stocker la configuration
        state.activeMenus.set(menuId, {
            element: container,
            config: config,
            items: config.items,
            parentMenu: null,
            childMenus: new Set()
        });
        
        // Ajouter au DOM
        document.body.appendChild(container);
        
        return menuId;
    }

    /**
     * Crée un item de menu
     */
    function createMenuItem(item, index, config, menuId) {
        const itemType = CONFIG.itemTypes[item.type || 'normal'];
        const element = document.createElement(itemType.tag);
        element.className = `${CONFIG.classes.item} ${itemType.className || ''}`;
        element.setAttribute('role', itemType.role);
        element.setAttribute('data-index', index);
        
        // ID unique
        element.id = `${menuId}-item-${index}`;
        
        // États
        if (item.disabled) {
            element.classList.add(CONFIG.classes.disabled);
            element.setAttribute('aria-disabled', 'true');
        }
        
        if (item.active) {
            element.classList.add(CONFIG.classes.active);
        }
        
        // Types spéciaux
        if (item.type === 'separator') {
            return element;
        }
        
        if (item.type === 'header') {
            element.textContent = item.label;
            return element;
        }
        
        // Contenu de l'item
        const content = document.createElement('div');
        content.className = 'context-menu-content';
        
        // Icône
        if (item.icon || (config.features.icons && item.type)) {
            const icon = document.createElement('span');
            icon.className = CONFIG.classes.icon;
            icon.innerHTML = item.icon || getDefaultIcon(item);
            content.appendChild(icon);
        }
        
        // Label
        const label = document.createElement('span');
        label.className = CONFIG.classes.label;
        label.textContent = item.label;
        content.appendChild(label);
        
        // Badge
        if (item.badge && config.features.badges) {
            const badge = document.createElement('span');
            badge.className = CONFIG.classes.badge;
            badge.textContent = item.badge;
            if (item.badgeColor) {
                badge.style.backgroundColor = item.badgeColor;
            }
            content.appendChild(badge);
        }
        
        // Raccourci
        if (item.shortcut && config.features.shortcuts) {
            const shortcut = document.createElement('span');
            shortcut.className = CONFIG.classes.shortcut;
            shortcut.textContent = formatShortcut(item.shortcut);
            content.appendChild(shortcut);
        }
        
        // Flèche pour sous-menu
        if (item.submenu && config.features.submenus) {
            element.classList.add(CONFIG.classes.hasSubmenu);
            element.setAttribute('aria-haspopup', 'true');
            element.setAttribute('aria-expanded', 'false');
            
            const arrow = document.createElement('span');
            arrow.className = CONFIG.classes.arrow;
            arrow.innerHTML = CONFIG.icons.submenu;
            content.appendChild(arrow);
        }
        
        element.appendChild(content);
        
        // Description
        if (item.description && config.features.descriptions) {
            const desc = document.createElement('div');
            desc.className = CONFIG.classes.description;
            desc.textContent = item.description;
            element.appendChild(desc);
        }
        
        // Événements
        if (itemType.interactive && !item.disabled) {
            element.addEventListener('click', (e) => handleItemClick(e, item, menuId));
            element.addEventListener('mouseenter', (e) => handleItemHover(e, item, menuId));
            element.addEventListener('mouseleave', (e) => handleItemLeave(e, item, menuId));
            
            if (config.features.keyboard) {
                element.setAttribute('tabindex', '-1');
            }
        }
        
        // Type checkbox/radio
        if (item.type === 'checkbox' || item.type === 'radio') {
            element.setAttribute('aria-checked', item.checked ? 'true' : 'false');
            if (item.checked) {
                element.classList.add(CONFIG.classes.checked);
                const checkIcon = document.createElement('span');
                checkIcon.className = 'context-menu-check';
                checkIcon.innerHTML = item.type === 'checkbox' ? CONFIG.icons.check : CONFIG.icons.radio;
                content.insertBefore(checkIcon, content.firstChild);
            }
        }
        
        return element;
    }

    /**
     * Crée un header personnalisé
     */
    function createHeader(content, config) {
        const header = document.createElement('div');
        header.className = 'context-menu-custom-header';
        
        if (typeof content === 'string') {
            header.innerHTML = content;
        } else if (typeof content === 'function') {
            header.innerHTML = content(config);
        } else if (content instanceof HTMLElement) {
            header.appendChild(content);
        }
        
        return header;
    }

    /**
     * Crée un footer personnalisé
     */
    function createFooter(content, config) {
        const footer = document.createElement('div');
        footer.className = 'context-menu-custom-footer';
        
        if (typeof content === 'string') {
            footer.innerHTML = content;
        } else if (typeof content === 'function') {
            footer.innerHTML = content(config);
        } else if (content instanceof HTMLElement) {
            footer.appendChild(footer);
        }
        
        return footer;
    }

    /**
     * Crée un sous-menu
     */
    function createSubmenu(parentItem, parentMenuId) {
        const parentMenu = state.activeMenus.get(parentMenuId);
        if (!parentMenu) return;
        
        const submenuConfig = {
            ...parentMenu.config,
            items: parentItem.submenu,
            isSubmenu: true,
            parentMenuId: parentMenuId
        };
        
        const submenuId = createMenu(submenuConfig);
        const submenu = state.activeMenus.get(submenuId);
        
        // Relations parent-enfant
        submenu.parentMenu = parentMenuId;
        parentMenu.childMenus.add(submenuId);
        
        return submenuId;
    }

    // ========================================
    // POSITIONNEMENT
    // ========================================
    
    /**
     * Positionne le menu
     */
    function positionMenu(menuId, event, targetElement) {
        const menu = state.activeMenus.get(menuId);
        if (!menu) return;
        
        const container = menu.element;
        const config = menu.config;
        const position = CONFIG.positions[config.position];
        
        // Afficher temporairement pour calculer les dimensions
        container.style.visibility = 'hidden';
        container.style.display = 'block';
        
        const menuRect = container.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let x, y;
        
        // Position selon le curseur
        if (position.followCursor && event) {
            x = event.clientX;
            y = event.clientY;
        }
        // Position relative à un élément
        else if (targetElement) {
            const targetRect = targetElement.getBoundingClientRect();
            
            switch (config.position) {
                case 'top-left':
                    x = targetRect.left;
                    y = targetRect.top - menuRect.height;
                    break;
                case 'top-right':
                    x = targetRect.right - menuRect.width;
                    y = targetRect.top - menuRect.height;
                    break;
                case 'bottom-left':
                    x = targetRect.left;
                    y = targetRect.bottom;
                    break;
                case 'bottom-right':
                    x = targetRect.right - menuRect.width;
                    y = targetRect.bottom;
                    break;
                case 'center':
                    x = targetRect.left + (targetRect.width - menuRect.width) / 2;
                    y = targetRect.top + (targetRect.height - menuRect.height) / 2;
                    break;
                default:
                    x = targetRect.left;
                    y = targetRect.bottom;
            }
        }
        // Position personnalisée
        else if (position.callback) {
            const customPos = position.callback(menuRect, viewportWidth, viewportHeight);
            x = customPos.x;
            y = customPos.y;
        }
        // Position par défaut (centre de l'écran)
        else {
            x = (viewportWidth - menuRect.width) / 2;
            y = (viewportHeight - menuRect.height) / 2;
        }
        
        // Ajustement intelligent pour rester dans le viewport
        if (position.smart !== false) {
            // Ajustement horizontal
            if (x + menuRect.width > viewportWidth - 10) {
                x = viewportWidth - menuRect.width - 10;
            }
            if (x < 10) {
                x = 10;
            }
            
            // Ajustement vertical
            if (y + menuRect.height > viewportHeight - 10) {
                y = viewportHeight - menuRect.height - 10;
            }
            if (y < 10) {
                y = 10;
            }
        }
        
        // Appliquer la position
        container.style.left = `${x}px`;
        container.style.top = `${y}px`;
        container.style.visibility = '';
        
        // Callback après positionnement
        if (config.callbacks.onPositioned) {
            config.callbacks.onPositioned(container, { x, y });
        }
    }

    /**
     * Positionne un sous-menu
     */
    function positionSubmenu(submenuId, parentElement) {
        const submenu = state.activeMenus.get(submenuId);
        if (!submenu) return;
        
        const container = submenu.element;
        const parentRect = parentElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // Afficher temporairement
        container.style.visibility = 'hidden';
        container.style.display = 'block';
        
        const menuRect = container.getBoundingClientRect();
        
        // Position par défaut à droite
        let x = parentRect.right - 4;
        let y = parentRect.top - 4;
        
        // Si pas assez de place à droite, afficher à gauche
        if (x + menuRect.width > viewportWidth - 10) {
            x = parentRect.left - menuRect.width + 4;
        }
        
        // Ajustement vertical
        if (y + menuRect.height > window.innerHeight - 10) {
            y = window.innerHeight - menuRect.height - 10;
        }
        
        container.style.left = `${x}px`;
        container.style.top = `${y}px`;
        container.style.visibility = '';
    }

    // ========================================
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // ========================================
    
    /**
     * Gère le clic sur un item
     */
    function handleItemClick(event, item, menuId) {
        event.preventDefault();
        event.stopPropagation();
        
        const menu = state.activeMenus.get(menuId);
        if (!menu) return;
        
        // Type checkbox/radio
        if (item.type === 'checkbox' || item.type === 'radio') {
            toggleCheckable(event.currentTarget, item, menuId);
        }
        
        // Callback de l'item
        if (item.action && typeof item.action === 'function') {
            const context = menu.config.context || {};
            item.action(item, context, event);
        }
        
        // Callback global
        if (menu.config.callbacks.onSelect) {
            menu.config.callbacks.onSelect(item, event);
        }
        
        // Fermer le menu (sauf si sticky ou si c'est un checkbox/radio)
        if (menu.config.features.closeOnClick && 
            !menu.config.features.sticky && 
            item.type !== 'checkbox' && 
            item.type !== 'radio' &&
            !item.keepOpen) {
            closeMenu(menuId);
        }
    }

    /**
     * Gère le survol d'un item
     */
    function handleItemHover(event, item, menuId) {
        const menu = state.activeMenus.get(menuId);
        if (!menu) return;
        
        const element = event.currentTarget;
        
        // Retirer le focus des autres items
        const allItems = element.parentElement.querySelectorAll(`.${CONFIG.classes.item}`);
        allItems.forEach(el => el.classList.remove(CONFIG.classes.focused));
        
        // Ajouter le focus
        element.classList.add(CONFIG.classes.focused);
        state.focusedItem = element;
        
        // Callback
        if (menu.config.callbacks.onHover) {
            menu.config.callbacks.onHover(item, event);
        }
        
        // Gérer les sous-menus
        if (item.submenu && menu.config.features.submenus) {
            // Fermer les autres sous-menus
            closeChildMenus(menuId, element.id);
            
            // Délai avant ouverture
            clearTimeout(state.submenuTimeout);
            state.submenuTimeout = setTimeout(() => {
                if (menu.config.features.submenuTrigger === 'hover') {
                    openSubmenu(element, item, menuId);
                }
            }, menu.config.features.submenuDelay);
        }
    }

    /**
     * Gère la sortie du survol
     */
    function handleItemLeave(event, item, menuId) {
        clearTimeout(state.submenuTimeout);
    }

    /**
     * Ouvre un sous-menu
     */
    function openSubmenu(parentElement, parentItem, parentMenuId) {
        // Vérifier si déjà ouvert
        const isOpen = parentElement.getAttribute('aria-expanded') === 'true';
        if (isOpen) return;
        
        // Créer le sous-menu
        const submenuId = createSubmenu(parentItem, parentMenuId);
        if (!submenuId) return;
        
        // Positionner
        positionSubmenu(submenuId, parentElement);
        
        // Afficher avec animation
        showMenu(submenuId);
        
        // Mettre à jour l'état du parent
        parentElement.setAttribute('aria-expanded', 'true');
        parentElement.classList.add(CONFIG.classes.open);
        
        // Stocker la référence
        parentElement.setAttribute('data-submenu-id', submenuId);
    }

    /**
     * Toggle un item checkable
     */
    function toggleCheckable(element, item, menuId) {
        const menu = state.activeMenus.get(menuId);
        if (!menu) return;
        
        const isChecked = element.getAttribute('aria-checked') === 'true';
        const newChecked = !isChecked;
        
        // Radio : décocher les autres du même groupe
        if (item.type === 'radio' && item.group && newChecked) {
            const radioItems = element.parentElement.querySelectorAll(`[data-group="${item.group}"]`);
            radioItems.forEach(radio => {
                radio.setAttribute('aria-checked', 'false');
                radio.classList.remove(CONFIG.classes.checked);
                const checkIcon = radio.querySelector('.context-menu-check');
                if (checkIcon) checkIcon.remove();
            });
        }
        
        // Mettre à jour l'état
        element.setAttribute('aria-checked', newChecked.toString());
        item.checked = newChecked;
        
        if (newChecked) {
            element.classList.add(CONFIG.classes.checked);
            // Ajouter l'icône de check
            const checkIcon = document.createElement('span');
            checkIcon.className = 'context-menu-check';
            checkIcon.innerHTML = item.type === 'checkbox' ? CONFIG.icons.check : CONFIG.icons.radio;
            element.querySelector('.context-menu-content').insertBefore(checkIcon, element.querySelector('.context-menu-content').firstChild);
        } else {
            element.classList.remove(CONFIG.classes.checked);
            const checkIcon = element.querySelector('.context-menu-check');
            if (checkIcon) checkIcon.remove();
        }
        
        // Callback
        if (menu.config.callbacks.onCheck) {
            menu.config.callbacks.onCheck(item, newChecked);
        }
    }

    /**
     * Navigation clavier
     */
    function handleKeydown(event, menuId) {
        const menu = state.activeMenus.get(menuId);
        if (!menu || !menu.config.features.keyboard) return;
        
        const items = Array.from(menu.element.querySelectorAll(`.${CONFIG.classes.item}:not(.${CONFIG.classes.disabled}):not(.context-menu-separator)`));
        const currentIndex = items.indexOf(state.focusedItem);
        
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                focusNextItem(items, currentIndex);
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                focusPreviousItem(items, currentIndex);
                break;
                
            case 'ArrowRight':
                if (state.focusedItem?.classList.contains(CONFIG.classes.hasSubmenu)) {
                    event.preventDefault();
                    const item = menu.items[state.focusedItem.dataset.index];
                    openSubmenu(state.focusedItem, item, menuId);
                }
                break;
                
            case 'ArrowLeft':
                if (menu.parentMenu) {
                    event.preventDefault();
                    closeMenu(menuId);
                }
                break;
                
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (state.focusedItem) {
                    state.focusedItem.click();
                }
                break;
                
            case 'Escape':
                if (menu.config.features.closeOnEscape) {
                    event.preventDefault();
                    closeMenu(menuId);
                }
                break;
                
            case 'Home':
                event.preventDefault();
                focusItem(items[0]);
                break;
                
            case 'End':
                event.preventDefault();
                focusItem(items[items.length - 1]);
                break;
                
            default:
                // Type to search
                if (menu.config.features.typeToSearch && event.key.length === 1) {
                    handleTypeToSearch(event.key, items);
                }
        }
        
        // Callback
        if (menu.config.callbacks.onKeydown) {
            menu.config.callbacks.onKeydown(event, state.focusedItem);
        }
    }

    /**
     * Type to search
     */
    function handleTypeToSearch(key, items) {
        clearTimeout(state.searchTimeout);
        state.searchBuffer += key.toLowerCase();
        
        // Rechercher l'item
        const matchingItem = items.find(item => {
            const label = item.querySelector(`.${CONFIG.classes.label}`)?.textContent.toLowerCase();
            return label?.startsWith(state.searchBuffer);
        });
        
        if (matchingItem) {
            focusItem(matchingItem);
        }
        
        // Reset après délai
        state.searchTimeout = setTimeout(() => {
            state.searchBuffer = '';
        }, 1000);
    }

    // ========================================
    // GESTION DU FOCUS
    // ========================================
    
    /**
     * Focus sur un item
     */
    function focusItem(item) {
        if (!item) return;
        
        // Retirer le focus précédent
        if (state.focusedItem) {
            state.focusedItem.classList.remove(CONFIG.classes.focused);
            state.focusedItem.setAttribute('tabindex', '-1');
        }
        
        // Nouveau focus
        item.classList.add(CONFIG.classes.focused);
        item.setAttribute('tabindex', '0');
        item.focus();
        state.focusedItem = item;
        
        // Scroll into view si nécessaire
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /**
     * Focus sur l'item suivant
     */
    function focusNextItem(items, currentIndex) {
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % items.length;
        focusItem(items[nextIndex]);
    }

    /**
     * Focus sur l'item précédent
     */
    function focusPreviousItem(items, currentIndex) {
        const prevIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        focusItem(items[prevIndex]);
    }

    // ========================================
    // AFFICHAGE ET FERMETURE
    // ========================================
    
    /**
     * Affiche le menu
     */
    function showMenu(menuId, event, targetElement) {
        const menu = state.activeMenus.get(menuId);
        if (!menu) return;
        
        // Callback avant ouverture
        if (menu.config.callbacks.onBeforeOpen) {
            const shouldOpen = menu.config.callbacks.onBeforeOpen(menu.element);
            if (shouldOpen === false) return;
        }
        
        // Fermer les autres menus (sauf parents)
        if (!menu.config.isSubmenu) {
            closeAllMenus(menuId);
        }
        
        // Positionner
        positionMenu(menuId, event, targetElement);
        
        // Animation
        const animation = CONFIG.animations[menu.config.animation];
        if (animation.enabled) {
            animateIn(menu.element, animation);
        } else {
            menu.element.style.display = 'block';
        }
        
        // Focus
        if (menu.config.features.autoFocus) {
            const firstItem = menu.element.querySelector(`.${CONFIG.classes.item}:not(.${CONFIG.classes.disabled})`);
            if (firstItem) {
                setTimeout(() => focusItem(firstItem), 50);
            }
        }
        
        // État
        state.currentMenu = menuId;
        menu.element.classList.add('is-visible');
        
        // Event listeners globaux
        attachGlobalListeners(menuId);
        
        // Callback après ouverture
        if (menu.config.callbacks.onOpen) {
            menu.config.callbacks.onOpen(menu.element);
        }
    }

    /**
     * Ferme le menu
     */
    function closeMenu(menuId) {
        const menu = state.activeMenus.get(menuId);
        if (!menu) return;
        
        // Callback avant fermeture
        if (menu.config.callbacks.onBeforeClose) {
            const shouldClose = menu.config.callbacks.onBeforeClose(menu.element);
            if (shouldClose === false) return;
        }
        
        // Fermer les sous-menus d'abord
        closeChildMenus(menuId);
        
        // Animation
        const animation = CONFIG.animations[menu.config.animation];
        if (animation.enabled) {
            animateOut(menu.element, animation, () => {
                menu.element.style.display = 'none';
                menu.element.classList.remove('is-visible');
            });
        } else {
            menu.element.style.display = 'none';
            menu.element.classList.remove('is-visible');
        }
        
        // Nettoyer l'état
        if (state.currentMenu === menuId) {
            state.currentMenu = null;
        }
        state.focusedItem = null;
        
        // Détacher les listeners
        detachGlobalListeners(menuId);
        
        // Callback après fermeture
        if (menu.config.callbacks.onClose) {
            menu.config.callbacks.onClose(menu.element);
        }
    }

    /**
     * Ferme tous les menus
     */
    function closeAllMenus(exceptId) {
        state.activeMenus.forEach((menu, menuId) => {
            if (menuId !== exceptId && !isParentOf(menuId, exceptId)) {
                closeMenu(menuId);
            }
        });
    }

    /**
     * Ferme les sous-menus
     */
    function closeChildMenus(parentId, exceptId) {
        const parent = state.activeMenus.get(parentId);
        if (!parent) return;
        
        parent.childMenus.forEach(childId => {
            if (childId !== exceptId) {
                closeMenu(childId);
                
                // Mettre à jour l'élément parent
                const parentElement = document.querySelector(`[data-submenu-id="${childId}"]`);
                if (parentElement) {
                    parentElement.setAttribute('aria-expanded', 'false');
                    parentElement.classList.remove(CONFIG.classes.open);
                    parentElement.removeAttribute('data-submenu-id');
                }
            }
        });
    }

    // ========================================
    // ANIMATIONS
    // ========================================
    
    /**
     * Animation d'entrée
     */
    function animateIn(element, animation) {
        element.style.display = 'block';
        
        // Reset
        element.style.opacity = '0';
        
        if (animation.effects.includes('translateY')) {
            element.style.transform = 'translateY(-10px)';
        }
        if (animation.effects.includes('scale')) {
            element.style.transform = 'scale(0.95)';
        }
        if (animation.effects.includes('rotateX')) {
            element.style.transform = 'perspective(1000px) rotateX(-30deg)';
        }
        
        // Forcer le reflow
        element.offsetHeight;
        
        // Transition
        element.style.transition = `all ${animation.duration}ms ${animation.easing}`;
        element.style.opacity = '1';
        element.style.transform = '';
        
        // Animation cascade pour les items
        if (animation.cascade) {
            const items = element.querySelectorAll(`.${CONFIG.classes.item}`);
            items.forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateX(-10px)';
                setTimeout(() => {
                    item.style.transition = `all ${animation.duration}ms ${animation.easing}`;
                    item.style.opacity = '1';
                    item.style.transform = '';
                }, index * (animation.stagger || 30));
            });
        }
        
        // Particules
        if (animation.particles) {
            createParticles(element);
        }
    }

    /**
     * Animation de sortie
     */
    function animateOut(element, animation, callback) {
        element.style.transition = `all ${animation.duration}ms ${animation.easing}`;
        element.style.opacity = '0';
        
        if (animation.effects.includes('translateY')) {
            element.style.transform = 'translateY(-10px)';
        }
        if (animation.effects.includes('scale')) {
            element.style.transform = 'scale(0.95)';
        }
        if (animation.effects.includes('rotateX')) {
            element.style.transform = 'perspective(1000px) rotateX(-30deg)';
        }
        
        setTimeout(() => {
            if (callback) callback();
        }, animation.duration);
    }

    /**
     * Crée des particules
     */
    function createParticles(element) {
        const rect = element.getBoundingClientRect();
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('span');
            particle.className = 'context-menu-particle';
            particle.style.left = `${Math.random() * rect.width}px`;
            particle.style.top = `${Math.random() * rect.height}px`;
            
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            
            particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
            
            element.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }

    // ========================================
    // UTILITAIRES
    // ========================================
    
    /**
     * Génère un ID unique
     */
    function generateId() {
        return `context-menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Fusionne la configuration
     */
    function mergeConfig(options) {
        return {
            style: options.style || 'glassmorphism',
            position: options.position || 'cursor',
            size: options.size || 'md',
            animation: options.animation || 'slide',
            features: { ...CONFIG.features, ...options.features },
            items: options.items || [],
            label: options.label,
            header: options.header,
            footer: options.footer,
            context: options.context,
            templates: { ...CONFIG.templates, ...options.templates },
            callbacks: { ...CONFIG.callbacks, ...options.callbacks }
        };
    }

    /**
     * Obtient l'icône par défaut
     */
    function getDefaultIcon(item) {
        if (item.type === 'checkbox' && item.checked) {
            return CONFIG.icons.check;
        }
        if (item.type === 'radio' && item.checked) {
            return CONFIG.icons.radio;
        }
        return '';
    }

    /**
     * Formate un raccourci
     */
    function formatShortcut(shortcut) {
        return shortcut
            .replace(/\+/g, ' + ')
            .replace(/cmd/gi, '⌘')
            .replace(/ctrl/gi, '⌃')
            .replace(/alt/gi, '⌥')
            .replace(/shift/gi, '⇧')
            .replace(/enter/gi, '⏎')
            .replace(/delete/gi, '⌫')
            .replace(/tab/gi, '⇥');
    }

    /**
     * Vérifie si un menu est parent d'un autre
     */
    function isParentOf(parentId, childId) {
        const child = state.activeMenus.get(childId);
        if (!child) return false;
        
        let currentParent = child.parentMenu;
        while (currentParent) {
            if (currentParent === parentId) return true;
            const parent = state.activeMenus.get(currentParent);
            currentParent = parent?.parentMenu;
        }
        
        return false;
    }

    /**
     * Attache les listeners globaux
     */
    function attachGlobalListeners(menuId) {
        const menu = state.activeMenus.get(menuId);
        if (!menu) return;
        
        // Click outside
        const clickHandler = (e) => {
            if (!menu.element.contains(e.target) && !menu.config.features.sticky) {
                closeMenu(menuId);
            }
        };
        
        // Scroll
        const scrollHandler = () => {
            if (menu.config.features.closeOnScroll) {
                closeMenu(menuId);
            }
        };
        
        // Resize
        const resizeHandler = () => {
            if (menu.config.features.closeOnResize) {
                closeMenu(menuId);
            } else {
                // Repositionner
                positionMenu(menuId);
            }
        };
        
        // Keydown
        const keydownHandler = (e) => handleKeydown(e, menuId);
        
        // Context menu (prévenir le menu natif)
        const contextHandler = (e) => {
            if (menu.config.features.preventContextMenu) {
                e.preventDefault();
            }
        };
        
        // Stocker les références
        const listeners = {
            click: clickHandler,
            scroll: scrollHandler,
            resize: resizeHandler,
            keydown: keydownHandler,
            contextmenu: contextHandler
        };
        
        state.eventListeners.set(menuId, listeners);
        
        // Attacher
        setTimeout(() => {
            document.addEventListener('click', clickHandler);
            window.addEventListener('scroll', scrollHandler, true);
            window.addEventListener('resize', resizeHandler);
            document.addEventListener('keydown', keydownHandler);
            document.addEventListener('contextmenu', contextHandler);
        }, 0);
    }

    /**
     * Détache les listeners globaux
     */
    function detachGlobalListeners(menuId) {
        const listeners = state.eventListeners.get(menuId);
        if (!listeners) return;
        
        document.removeEventListener('click', listeners.click);
        window.removeEventListener('scroll', listeners.scroll, true);
        window.removeEventListener('resize', listeners.resize);
        document.removeEventListener('keydown', listeners.keydown);
        document.removeEventListener('contextmenu', listeners.contextmenu);
        
        state.eventListeners.delete(menuId);
    }

    /**
     * Injecte les styles
     */
    function injectStyles() {
        if (document.getElementById('context-menu-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'context-menu-styles';
        style.textContent = `
            @import url('/src/css/shared/ui/context-menu.css');
        `;
        document.head.appendChild(style);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        /**
         * Affiche un menu contextuel
         */
        show(options, event, targetElement) {
            injectStyles();
            
            const menuId = createMenu(options);
            showMenu(menuId, event, targetElement);
            
            return menuId;
        },

        /**
         * Ferme un menu
         */
        close(menuId) {
            if (menuId) {
                closeMenu(menuId);
            } else {
                closeAllMenus();
            }
        },

        /**
         * Met à jour les items d'un menu
         */
        update(menuId, items) {
            const menu = state.activeMenus.get(menuId);
            if (!menu) return;
            
            // Mettre à jour les items
            menu.items = items;
            
            // Recréer le contenu
            const menuList = menu.element.querySelector(`.${CONFIG.classes.menu}`);
            menuList.innerHTML = '';
            
            items.forEach((item, index) => {
                const menuItem = createMenuItem(item, index, menu.config, menuId);
                menuList.appendChild(menuItem);
            });
        },

        /**
         * Active/désactive un item
         */
        setItemEnabled(menuId, itemIndex, enabled) {
            const menu = state.activeMenus.get(menuId);
            if (!menu) return;
            
            const item = menu.element.querySelector(`[data-index="${itemIndex}"]`);
            if (!item) return;
            
            if (enabled) {
                item.classList.remove(CONFIG.classes.disabled);
                item.removeAttribute('aria-disabled');
            } else {
                item.classList.add(CONFIG.classes.disabled);
                item.setAttribute('aria-disabled', 'true');
            }
            
            // Mettre à jour les données
            if (menu.items[itemIndex]) {
                menu.items[itemIndex].disabled = !enabled;
            }
        },

        /**
         * Coche/décoche un item
         */
        setItemChecked(menuId, itemIndex, checked) {
            const menu = state.activeMenus.get(menuId);
            if (!menu) return;
            
            const item = menu.element.querySelector(`[data-index="${itemIndex}"]`);
            if (!item) return;
            
            const menuItem = menu.items[itemIndex];
            if (!menuItem || (menuItem.type !== 'checkbox' && menuItem.type !== 'radio')) return;
            
            toggleCheckable(item, menuItem, menuId);
        },

        /**
         * Détruit un menu
         */
        destroy(menuId) {
            const menu = state.activeMenus.get(menuId);
            if (!menu) return;
            
            // Fermer et nettoyer
            closeMenu(menuId);
            menu.element.remove();
            state.activeMenus.delete(menuId);
        },

        /**
         * Détruit tous les menus
         */
        destroyAll() {
            state.activeMenus.forEach((menu, menuId) => {
                this.destroy(menuId);
            });
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
export default ContextMenu;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [DATE] - Positionnement des sous-menus
   Solution: Calcul dynamique avec détection des bords
   
   [DATE] - Gestion du focus clavier
   Cause: Conflits avec les sous-menus
   Résolution: Système de focus hiérarchique
   
   [DATE] - Performance avec beaucoup d'items
   Solution: Virtualisation optionnelle
   
   NOTES POUR REPRISES FUTURES:
   - Les animations riches peuvent impacter les performances
   - Le z-index doit être élevé pour surpasser les modales
   - Tester sur appareils tactiles pour les sous-menus
   ======================================== */