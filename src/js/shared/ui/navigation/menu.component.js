/* ========================================
   MENU.COMPONENT.JS - Système de menus complet
   Chemin: src/js/shared/ui/navigation/menu.component.js
   
   DESCRIPTION:
   Composant de menu polyvalent supportant dropdown, context menu, mega menu,
   sidebar menu avec effet glassmorphism et animations avancées.
   
   STRUCTURE:
   1. Configuration et constantes (lignes 20-200)
   2. Méthodes de création (lignes 202-500)
   3. Gestion des items (lignes 502-800)
   4. Gestion des événements (lignes 802-1100)
   5. Animations et positionnement (lignes 1102-1300)
   6. Utilitaires et helpers (lignes 1302-1500)
   7. API publique (lignes 1502-1600)
   
   DÉPENDANCES:
   - menu.css (styles glassmorphism et animations)
   - frosted-icons.component.js (icônes)
   - ui.config.js (configuration globale)
   ======================================== */

const MenuComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION ET CONSTANTES
    // ========================================
    const CONFIG = {
        // Types de menus
        types: {
            'dropdown': {
                trigger: 'click',
                position: 'bottom-start',
                showArrow: false,
                closeOnSelect: true,
                trapFocus: true
            },
            'context': {
                trigger: 'contextmenu',
                position: 'cursor',
                showArrow: false,
                closeOnSelect: true,
                preventContextMenu: true
            },
            'mega': {
                trigger: 'hover',
                position: 'bottom',
                showArrow: false,
                closeOnSelect: false,
                fullWidth: true,
                columns: 3
            },
            'sidebar': {
                trigger: 'click',
                position: 'left',
                showArrow: false,
                closeOnSelect: false,
                persistent: true,
                collapsible: true
            },
            'popover': {
                trigger: 'click',
                position: 'bottom-start',
                showArrow: true,
                closeOnSelect: true,
                maxWidth: 300
            },
            'toolbar': {
                trigger: 'none',
                position: 'static',
                horizontal: true,
                showArrow: false
            },
            'mobile': {
                trigger: 'click',
                position: 'fullscreen',
                showArrow: false,
                closeOnSelect: true,
                slideFrom: 'bottom'
            }
        },

        // Styles disponibles
        styles: {
            'glassmorphism': {
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            },
            'neumorphism': {
                background: '#e0e5ec',
                boxShadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff'
            },
            'flat': {
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                shadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            },
            'minimal': {
                background: 'transparent',
                border: 'none',
                itemHover: 'rgba(0, 0, 0, 0.05)'
            },
            'material': {
                background: '#ffffff',
                shadow: '0 3px 5px -1px rgba(0,0,0,.2)',
                elevation: 2
            }
        },

        // Animations
        animations: {
            'none': { enabled: false },
            'subtle': {
                openDuration: 150,
                closeDuration: 100,
                itemHover: 'background'
            },
            'smooth': {
                openDuration: 250,
                closeDuration: 200,
                itemHover: 'scale',
                openAnimation: 'fadeIn'
            },
            'rich': {
                openDuration: 300,
                closeDuration: 250,
                itemHover: 'slide',
                openAnimation: 'slideIn',
                rippleEffect: true
            },
            'bounce': {
                openDuration: 400,
                closeDuration: 300,
                itemHover: 'bounce',
                openAnimation: 'bounceIn'
            }
        },

        // Structure d'item de menu
        itemTypes: {
            'default': {
                selectable: true,
                hoverable: true,
                closesMenu: true
            },
            'header': {
                selectable: false,
                hoverable: false,
                closesMenu: false,
                styling: 'muted'
            },
            'divider': {
                selectable: false,
                hoverable: false,
                closesMenu: false,
                height: 1
            },
            'submenu': {
                selectable: false,
                hoverable: true,
                closesMenu: false,
                hasArrow: true
            },
            'checkbox': {
                selectable: true,
                hoverable: true,
                closesMenu: false,
                toggleable: true
            },
            'radio': {
                selectable: true,
                hoverable: true,
                closesMenu: false,
                exclusive: true
            }
        },

        // Classes CSS
        classes: {
            container: 'menu-container',
            menu: 'menu',
            item: 'menu-item',
            icon: 'menu-item-icon',
            label: 'menu-item-label',
            badge: 'menu-item-badge',
            shortcut: 'menu-item-shortcut',
            arrow: 'menu-item-arrow',
            submenu: 'menu-submenu',
            divider: 'menu-divider',
            header: 'menu-header'
        },

        // Positions prédéfinies
        positions: {
            'top': { my: 'bottom center', at: 'top center' },
            'bottom': { my: 'top center', at: 'bottom center' },
            'left': { my: 'right center', at: 'left center' },
            'right': { my: 'left center', at: 'right center' },
            'top-start': { my: 'bottom left', at: 'top left' },
            'top-end': { my: 'bottom right', at: 'top right' },
            'bottom-start': { my: 'top left', at: 'bottom left' },
            'bottom-end': { my: 'top right', at: 'bottom right' },
            'cursor': { my: 'top left', at: 'cursor' }
        }
    };

    // État global des menus
    const instances = new Map();
    let activeMenu = null;
    let zIndex = 1000;

    // ========================================
    // MÉTHODES DE CRÉATION
    // ========================================

    // Créer la structure du menu
    function createMenuStructure(options) {
        const container = document.createElement('div');
        container.className = `${CONFIG.classes.container} ${options.type || 'dropdown'}`;
        
        const menu = document.createElement('div');
        menu.className = `${CONFIG.classes.menu} ${options.style || 'glassmorphism'}`;
        menu.setAttribute('role', 'menu');
        menu.setAttribute('aria-orientation', options.horizontal ? 'horizontal' : 'vertical');
        
        // Flèche si activée
        if (options.showArrow) {
            const arrow = document.createElement('div');
            arrow.className = 'menu-arrow';
            container.appendChild(arrow);
        }
        
        // Contenu personnalisé ou items
        if (options.content) {
            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'menu-content';
            if (typeof options.content === 'string') {
                contentWrapper.innerHTML = options.content;
            } else {
                contentWrapper.appendChild(options.content);
            }
            menu.appendChild(contentWrapper);
        } else if (options.items) {
            options.items.forEach((item, index) => {
                const element = createMenuItem(item, options, index);
                menu.appendChild(element);
            });
        }
        
        container.appendChild(menu);
        return container;
    }

    // Créer un item de menu
    function createMenuItem(itemData, menuOptions, index) {
        // Divider
        if (itemData.type === 'divider') {
            const divider = document.createElement('div');
            divider.className = CONFIG.classes.divider;
            divider.setAttribute('role', 'separator');
            return divider;
        }
        
        // Header
        if (itemData.type === 'header') {
            const header = document.createElement('div');
            header.className = CONFIG.classes.header;
            header.textContent = itemData.label;
            header.setAttribute('role', 'heading');
            return header;
        }
        
        // Item normal
        const item = document.createElement('div');
        item.className = CONFIG.classes.item;
        item.setAttribute('role', 'menuitem');
        item.setAttribute('tabindex', itemData.disabled ? '-1' : '0');
        item.dataset.index = index;
        
        if (itemData.id) item.id = itemData.id;
        if (itemData.disabled) item.classList.add('disabled');
        if (itemData.active) item.classList.add('active');
        if (itemData.danger) item.classList.add('danger');
        if (itemData.type) item.dataset.type = itemData.type;
        
        // Icône
        if (itemData.icon) {
            const icon = createItemIcon(itemData.icon);
            item.appendChild(icon);
        } else if (menuOptions.showIconSpace !== false) {
            const spacer = document.createElement('div');
            spacer.className = `${CONFIG.classes.icon} icon-spacer`;
            item.appendChild(spacer);
        }
        
        // Checkbox/Radio
        if (itemData.type === 'checkbox' || itemData.type === 'radio') {
            const input = document.createElement('input');
            input.type = itemData.type;
            input.className = 'menu-item-input';
            input.checked = itemData.checked || false;
            if (itemData.name) input.name = itemData.name;
            item.insertBefore(input, item.firstChild);
        }
        
        // Label
        const label = document.createElement('span');
        label.className = CONFIG.classes.label;
        label.textContent = itemData.label;
        item.appendChild(label);
        
        // Description
        if (itemData.description) {
            const desc = document.createElement('span');
            desc.className = 'menu-item-description';
            desc.textContent = itemData.description;
            item.appendChild(desc);
        }
        
        // Badge
        if (itemData.badge) {
            const badge = document.createElement('span');
            badge.className = CONFIG.classes.badge;
            badge.textContent = itemData.badge;
            if (itemData.badgeType) {
                badge.classList.add(`badge-${itemData.badgeType}`);
            }
            item.appendChild(badge);
        }
        
        // Shortcut
        if (itemData.shortcut) {
            const shortcut = document.createElement('span');
            shortcut.className = CONFIG.classes.shortcut;
            shortcut.textContent = itemData.shortcut;
            item.appendChild(shortcut);
        }
        
        // Submenu arrow
        if (itemData.submenu) {
            const arrow = document.createElement('span');
            arrow.className = CONFIG.classes.arrow;
            arrow.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>';
            item.appendChild(arrow);
            item.dataset.hasSubmenu = 'true';
        }
        
        // Action personnalisée
        if (itemData.action && typeof itemData.action === 'function') {
            item.dataset.hasAction = 'true';
        }
        
        return item;
    }

    // Créer une icône d'item
    function createItemIcon(iconData) {
        const iconWrapper = document.createElement('div');
        iconWrapper.className = CONFIG.classes.icon;
        
        if (typeof iconData === 'string') {
            // Si c'est une classe d'icône
            if (iconData.startsWith('icon-') || iconData.includes('fa-')) {
                const icon = document.createElement('i');
                icon.className = iconData;
                iconWrapper.appendChild(icon);
            } else {
                // Si c'est un nom d'icône frosted
                try {
                    const FrostedIcons = window.FrostedIcons || window.UI?.FrostedIcons;
                    if (FrostedIcons) {
                        const icon = FrostedIcons.create(iconData, { size: 16 });
                        iconWrapper.appendChild(icon);
                    }
                } catch (e) {
                    // Fallback to text
                    iconWrapper.textContent = iconData.charAt(0).toUpperCase();
                }
            }
        } else if (iconData.svg) {
            iconWrapper.innerHTML = iconData.svg;
        } else if (iconData.emoji) {
            iconWrapper.textContent = iconData.emoji;
            iconWrapper.classList.add('emoji-icon');
        } else if (iconData.image) {
            const img = document.createElement('img');
            img.src = iconData.image;
            img.alt = '';
            iconWrapper.appendChild(img);
        }
        
        return iconWrapper;
    }

    // Créer un mega menu
    function createMegaMenu(options) {
        const container = createMenuStructure({
            ...options,
            type: 'mega'
        });
        
        const menu = container.querySelector(`.${CONFIG.classes.menu}`);
        menu.classList.add('menu-mega');
        
        // Organiser en colonnes
        if (options.columns && Array.isArray(options.columns)) {
            const columnsContainer = document.createElement('div');
            columnsContainer.className = 'menu-mega-columns';
            
            options.columns.forEach(column => {
                const columnEl = document.createElement('div');
                columnEl.className = 'menu-mega-column';
                
                if (column.title) {
                    const title = document.createElement('h3');
                    title.className = 'menu-mega-title';
                    title.textContent = column.title;
                    columnEl.appendChild(title);
                }
                
                if (column.items) {
                    column.items.forEach((item, index) => {
                        const itemEl = createMenuItem(item, options, index);
                        columnEl.appendChild(itemEl);
                    });
                }
                
                columnsContainer.appendChild(columnEl);
            });
            
            menu.innerHTML = '';
            menu.appendChild(columnsContainer);
        }
        
        return container;
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================

    // Initialiser les événements
    function initializeEvents(instance) {
        const { trigger, container, options } = instance;
        
        // Événements du trigger
        if (trigger && options.trigger !== 'none') {
            switch (options.trigger) {
                case 'click':
                    trigger.addEventListener('click', (e) => {
                        e.preventDefault();
                        toggleMenu(instance);
                    });
                    break;
                    
                case 'hover':
                    let hoverTimeout;
                    trigger.addEventListener('mouseenter', () => {
                        clearTimeout(hoverTimeout);
                        showMenu(instance);
                    });
                    
                    trigger.addEventListener('mouseleave', () => {
                        hoverTimeout = setTimeout(() => {
                            if (!isHoveringMenu(instance)) {
                                hideMenu(instance);
                            }
                        }, 100);
                    });
                    
                    container.addEventListener('mouseenter', () => {
                        clearTimeout(hoverTimeout);
                    });
                    
                    container.addEventListener('mouseleave', () => {
                        hoverTimeout = setTimeout(() => {
                            hideMenu(instance);
                        }, 100);
                    });
                    break;
                    
                case 'contextmenu':
                    trigger.addEventListener('contextmenu', (e) => {
                        e.preventDefault();
                        instance.mousePosition = { x: e.clientX, y: e.clientY };
                        showMenu(instance);
                    });
                    break;
                    
                case 'focus':
                    trigger.addEventListener('focus', () => showMenu(instance));
                    trigger.addEventListener('blur', () => {
                        setTimeout(() => {
                            if (!container.contains(document.activeElement)) {
                                hideMenu(instance);
                            }
                        }, 100);
                    });
                    break;
            }
        }
        
        // Événements des items
        container.addEventListener('click', (e) => handleItemClick(e, instance));
        
        // Navigation au clavier
        container.addEventListener('keydown', (e) => handleKeyboardNavigation(e, instance));
        
        // Fermeture au clic extérieur
        if (options.closeOnClickOutside !== false) {
            document.addEventListener('click', (e) => {
                if (instance.isOpen && !container.contains(e.target) && 
                    (!trigger || !trigger.contains(e.target))) {
                    hideMenu(instance);
                }
            });
        }
        
        // Fermeture à l'Escape
        if (options.closeOnEscape !== false) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && instance.isOpen) {
                    hideMenu(instance);
                    trigger?.focus();
                }
            });
        }
        
        // Gestion des sous-menus
        const submenuItems = container.querySelectorAll('[data-has-submenu="true"]');
        submenuItems.forEach(item => {
            let submenuTimeout;
            
            item.addEventListener('mouseenter', () => {
                clearTimeout(submenuTimeout);
                showSubmenu(item, instance);
            });
            
            item.addEventListener('mouseleave', () => {
                submenuTimeout = setTimeout(() => {
                    hideSubmenu(item);
                }, 200);
            });
        });
    }

    // Gérer le clic sur un item
    function handleItemClick(event, instance) {
        const item = event.target.closest(`.${CONFIG.classes.item}`);
        if (!item || item.classList.contains('disabled')) return;
        
        const { options } = instance;
        const itemData = getItemData(item, instance);
        
        // Effet ripple si activé
        if (options.animation === 'rich' && CONFIG.animations.rich.rippleEffect) {
            createRippleEffect(item, event);
        }
        
        // Type checkbox/radio
        if (item.dataset.type === 'checkbox' || item.dataset.type === 'radio') {
            const input = item.querySelector('.menu-item-input');
            if (input) {
                input.checked = !input.checked;
                
                // Pour les radios, décocher les autres du même groupe
                if (item.dataset.type === 'radio' && input.name) {
                    const otherRadios = instance.container.querySelectorAll(
                        `.menu-item-input[type="radio"][name="${input.name}"]`
                    );
                    otherRadios.forEach(other => {
                        if (other !== input) other.checked = false;
                    });
                }
            }
        }
        
        // Action personnalisée
        if (itemData && itemData.action && typeof itemData.action === 'function') {
            itemData.action(itemData, instance);
        }
        
        // Événement personnalisé
        const customEvent = new CustomEvent('menuselect', {
            detail: { item: itemData, instance }
        });
        instance.container.dispatchEvent(customEvent);
        
        // Fermer si nécessaire
        if (options.closeOnSelect && !item.dataset.hasSubmenu && 
            item.dataset.type !== 'checkbox') {
            hideMenu(instance);
        }
    }

    // Navigation au clavier
    function handleKeyboardNavigation(event, instance) {
        const { key } = event;
        const items = Array.from(instance.container.querySelectorAll(
            `.${CONFIG.classes.item}:not(.disabled)`
        ));
        const currentIndex = items.findIndex(item => item === document.activeElement);
        
        switch (key) {
            case 'ArrowDown':
            case 'ArrowUp':
                event.preventDefault();
                const direction = key === 'ArrowDown' ? 1 : -1;
                const newIndex = (currentIndex + direction + items.length) % items.length;
                items[newIndex]?.focus();
                break;
                
            case 'ArrowRight':
                if (document.activeElement?.dataset.hasSubmenu) {
                    event.preventDefault();
                    showSubmenu(document.activeElement, instance);
                    // Focus premier item du sous-menu
                    setTimeout(() => {
                        const submenu = document.activeElement.querySelector('.menu-submenu');
                        const firstItem = submenu?.querySelector('.menu-item:not(.disabled)');
                        firstItem?.focus();
                    }, 100);
                }
                break;
                
            case 'ArrowLeft':
                // Fermer le sous-menu parent si on est dedans
                const parentSubmenu = document.activeElement?.closest('.menu-submenu');
                if (parentSubmenu) {
                    event.preventDefault();
                    const parentItem = instance.container.querySelector(
                        `[data-submenu-id="${parentSubmenu.id}"]`
                    );
                    hideSubmenu(parentItem);
                    parentItem?.focus();
                }
                break;
                
            case 'Home':
                event.preventDefault();
                items[0]?.focus();
                break;
                
            case 'End':
                event.preventDefault();
                items[items.length - 1]?.focus();
                break;
                
            case 'Enter':
            case ' ':
                event.preventDefault();
                document.activeElement?.click();
                break;
                
            case 'Tab':
                if (instance.options.trapFocus) {
                    event.preventDefault();
                    const direction = event.shiftKey ? -1 : 1;
                    const newIndex = (currentIndex + direction + items.length) % items.length;
                    items[newIndex]?.focus();
                }
                break;
        }
        
        // Recherche par frappe
        if (key.length === 1 && /[a-zA-Z0-9]/.test(key)) {
            clearTimeout(instance.searchTimeout);
            instance.searchString = (instance.searchString || '') + key.toLowerCase();
            
            const matchingItem = items.find(item => {
                const label = item.querySelector(`.${CONFIG.classes.label}`)?.textContent || '';
                return label.toLowerCase().startsWith(instance.searchString);
            });
            
            if (matchingItem) {
                matchingItem.focus();
            }
            
            instance.searchTimeout = setTimeout(() => {
                instance.searchString = '';
            }, 500);
        }
    }

    // ========================================
    // ANIMATIONS ET POSITIONNEMENT
    // ========================================

    // Afficher le menu
    function showMenu(instance) {
        if (instance.isOpen) return;
        
        // Fermer les autres menus
        if (activeMenu && activeMenu !== instance) {
            hideMenu(activeMenu);
        }
        
        const { container, options } = instance;
        instance.isOpen = true;
        activeMenu = instance;
        
        // Z-index
        container.style.zIndex = ++zIndex;
        
        // Position
        positionMenu(instance);
        
        // Classes et animations
        container.classList.add('open');
        
        // Animation d'ouverture
        const animation = CONFIG.animations[options.animation || 'smooth'];
        if (animation && animation.openAnimation) {
            container.classList.add(`animate-${animation.openAnimation}`);
        }
        
        // Focus management
        if (options.autoFocus !== false) {
            setTimeout(() => {
                const firstItem = container.querySelector('.menu-item:not(.disabled)');
                firstItem?.focus();
            }, 50);
        }
        
        // Callback
        if (options.onOpen && typeof options.onOpen === 'function') {
            options.onOpen(instance);
        }
    }

    // Cacher le menu
    function hideMenu(instance) {
        if (!instance.isOpen) return;
        
        const { container, options } = instance;
        instance.isOpen = false;
        
        if (activeMenu === instance) {
            activeMenu = null;
        }
        
        // Animation de fermeture
        container.classList.remove('open');
        container.classList.add('closing');
        
        const animation = CONFIG.animations[options.animation || 'smooth'];
        const duration = animation ? animation.closeDuration : 200;
        
        setTimeout(() => {
            container.classList.remove('closing');
            container.classList.remove('animate-fadeIn', 'animate-slideIn', 'animate-bounceIn');
            
            // Cacher tous les sous-menus
            const submenus = container.querySelectorAll('.menu-submenu.open');
            submenus.forEach(submenu => {
                submenu.classList.remove('open');
            });
        }, duration);
        
        // Callback
        if (options.onClose && typeof options.onClose === 'function') {
            options.onClose(instance);
        }
    }

    // Basculer l'affichage
    function toggleMenu(instance) {
        if (instance.isOpen) {
            hideMenu(instance);
        } else {
            showMenu(instance);
        }
    }

    // Positionner le menu
    function positionMenu(instance) {
        const { container, trigger, options } = instance;
        const position = options.position || 'bottom-start';
        
        // Reset position
        container.style.position = 'fixed';
        container.style.top = '';
        container.style.left = '';
        container.style.right = '';
        container.style.bottom = '';
        container.style.transform = '';
        
        // Position spéciale pour context menu
        if (position === 'cursor' && instance.mousePosition) {
            container.style.left = `${instance.mousePosition.x}px`;
            container.style.top = `${instance.mousePosition.y}px`;
            adjustPositionToViewport(container);
            return;
        }
        
        // Position spéciale pour fullscreen
        if (position === 'fullscreen') {
            container.style.top = '0';
            container.style.left = '0';
            container.style.right = '0';
            container.style.bottom = '0';
            return;
        }
        
        // Position relative au trigger
        if (trigger && CONFIG.positions[position]) {
            const triggerRect = trigger.getBoundingClientRect();
            const menuRect = container.getBoundingClientRect();
            const pos = CONFIG.positions[position];
            
            // Calculer la position de base
            let top = triggerRect.top;
            let left = triggerRect.left;
            
            // Ajuster selon l'alignement
            if (pos.my.includes('bottom')) top += triggerRect.height;
            if (pos.my.includes('center')) top += triggerRect.height / 2;
            if (pos.at.includes('center')) top -= menuRect.height / 2;
            if (pos.at.includes('bottom')) top -= menuRect.height;
            
            if (pos.my.includes('right')) left += triggerRect.width;
            if (pos.my.includes('center')) left += triggerRect.width / 2;
            if (pos.at.includes('center')) left -= menuRect.width / 2;
            if (pos.at.includes('right')) left -= menuRect.width;
            
            // Offset
            const offset = options.offset || 8;
            if (position.startsWith('top')) top -= offset;
            if (position.startsWith('bottom')) top += offset;
            if (position.startsWith('left')) left -= offset;
            if (position.startsWith('right')) left += offset;
            
            container.style.top = `${top}px`;
            container.style.left = `${left}px`;
            
            // Ajuster si déborde
            adjustPositionToViewport(container);
        }
    }

    // Ajuster la position pour rester dans la fenêtre
    function adjustPositionToViewport(container) {
        const rect = container.getBoundingClientRect();
        const padding = 16;
        
        // Ajuster horizontalement
        if (rect.right > window.innerWidth - padding) {
            container.style.left = `${window.innerWidth - rect.width - padding}px`;
        }
        if (rect.left < padding) {
            container.style.left = `${padding}px`;
        }
        
        // Ajuster verticalement
        if (rect.bottom > window.innerHeight - padding) {
            container.style.top = `${window.innerHeight - rect.height - padding}px`;
        }
        if (rect.top < padding) {
            container.style.top = `${padding}px`;
        }
    }

    // Afficher un sous-menu
    function showSubmenu(parentItem, instance) {
        const itemData = getItemData(parentItem, instance);
        if (!itemData || !itemData.submenu) return;
        
        // Créer le sous-menu s'il n'existe pas
        let submenu = parentItem.querySelector('.menu-submenu');
        if (!submenu) {
            submenu = createMenuStructure({
                ...instance.options,
                items: itemData.submenu,
                type: 'submenu'
            });
            submenu.className = 'menu-submenu';
            submenu.id = `submenu-${Date.now()}`;
            parentItem.dataset.submenuId = submenu.id;
            parentItem.appendChild(submenu);
        }
        
        // Positionner et afficher
        submenu.classList.add('open');
        positionSubmenu(submenu, parentItem);
    }

    // Cacher un sous-menu
    function hideSubmenu(parentItem) {
        const submenu = parentItem?.querySelector('.menu-submenu');
        if (submenu) {
            submenu.classList.remove('open');
        }
    }

    // Positionner un sous-menu
    function positionSubmenu(submenu, parentItem) {
        const parentRect = parentItem.getBoundingClientRect();
        const submenuRect = submenu.getBoundingClientRect();
        
        // Position par défaut : à droite
        let left = parentRect.width - 4;
        let top = -4;
        
        // Si déborde à droite, afficher à gauche
        if (parentRect.right + submenuRect.width > window.innerWidth - 16) {
            left = -submenuRect.width + 4;
        }
        
        // Ajuster verticalement si nécessaire
        if (parentRect.top + top + submenuRect.height > window.innerHeight - 16) {
            top = window.innerHeight - parentRect.top - submenuRect.height - 16;
        }
        
        submenu.style.left = `${left}px`;
        submenu.style.top = `${top}px`;
    }

    // Créer un effet ripple
    function createRippleEffect(element, event) {
        const ripple = document.createElement('span');
        ripple.className = 'menu-ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        
        element.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }

    // ========================================
    // UTILITAIRES ET HELPERS
    // ========================================

    // Obtenir les données d'un item
    function getItemData(itemElement, instance) {
        const index = itemElement.dataset.index;
        if (index !== undefined && instance.options.items) {
            return instance.options.items[index];
        }
        return null;
    }

    // Vérifier si on survole le menu
    function isHoveringMenu(instance) {
        const rect = instance.container.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        
        return x >= rect.left && x <= rect.right && 
               y >= rect.top && y <= rect.bottom;
    }

    // Mettre à jour un item
    function updateItem(instance, itemId, updates) {
        const item = instance.container.querySelector(`#${itemId}`);
        if (!item) return;
        
        // Mettre à jour le label
        if (updates.label !== undefined) {
            const label = item.querySelector(`.${CONFIG.classes.label}`);
            if (label) label.textContent = updates.label;
        }
        
        // Mettre à jour l'icône
        if (updates.icon !== undefined) {
            const iconWrapper = item.querySelector(`.${CONFIG.classes.icon}`);
            if (iconWrapper) {
                const newIcon = createItemIcon(updates.icon);
                iconWrapper.replaceWith(newIcon);
            }
        }
        
        // Mettre à jour le badge
        if (updates.badge !== undefined) {
            let badge = item.querySelector(`.${CONFIG.classes.badge}`);
            if (updates.badge) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = CONFIG.classes.badge;
                    item.appendChild(badge);
                }
                badge.textContent = updates.badge;
            } else if (badge) {
                badge.remove();
            }
        }
        
        // Mettre à jour l'état
        if (updates.disabled !== undefined) {
            item.classList.toggle('disabled', updates.disabled);
            item.setAttribute('tabindex', updates.disabled ? '-1' : '0');
        }
        
        if (updates.active !== undefined) {
            item.classList.toggle('active', updates.active);
        }
    }

    // Injecter les styles
    function injectStyles() {
        if (document.getElementById('menu-styles')) return;

        const link = document.createElement('link');
        link.id = 'menu-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/menu.css';
        document.head.appendChild(link);
    }

    // Détruire une instance
    function destroy(instance) {
        hideMenu(instance);
        instance.container.remove();
        instances.delete(instance.id);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================

    function create(options = {}) {
        // Auto-injection des styles au premier appel
        if (!document.getElementById('menu-styles')) {
            injectStyles();
        }

        // Configuration par défaut
        const typeConfig = CONFIG.types[options.type || 'dropdown'];
        const defaultOptions = {
            trigger: 'click',
            position: 'bottom-start',
            style: 'glassmorphism',
            animation: 'smooth',
            closeOnSelect: true,
            closeOnClickOutside: true,
            closeOnEscape: true,
            autoFocus: true,
            trapFocus: false,
            offset: 8,
            ...typeConfig
        };

        const finalOptions = { ...defaultOptions, ...options };

        // Créer l'instance
        const instance = {
            id: Date.now(),
            options: finalOptions,
            isOpen: false,
            searchString: '',
            searchTimeout: null
        };

        // Élément déclencheur
        if (finalOptions.trigger !== 'none' && finalOptions.triggerElement) {
            instance.trigger = typeof finalOptions.triggerElement === 'string' 
                ? document.querySelector(finalOptions.triggerElement) 
                : finalOptions.triggerElement;
        }

        // Créer le conteneur
        if (finalOptions.type === 'mega' && finalOptions.columns) {
            instance.container = createMegaMenu(finalOptions);
        } else {
            instance.container = createMenuStructure(finalOptions);
        }
        
        // Ajouter au DOM
        if (finalOptions.appendTo) {
            const parent = typeof finalOptions.appendTo === 'string'
                ? document.querySelector(finalOptions.appendTo)
                : finalOptions.appendTo;
            parent.appendChild(instance.container);
        } else {
            document.body.appendChild(instance.container);
        }

        // Initialiser les événements
        initializeEvents(instance);

        // Position statique pour toolbar
        if (finalOptions.type === 'toolbar') {
            instance.container.classList.add('open', 'static');
        }

        // Stocker l'instance
        instances.set(instance.id, instance);

        // API publique de l'instance
        const publicAPI = {
            show: () => showMenu(instance),
            hide: () => hideMenu(instance),
            toggle: () => toggleMenu(instance),
            destroy: () => destroy(instance),
            updateItem: (itemId, updates) => updateItem(instance, itemId, updates),
            setItems: (items) => {
                instance.options.items = items;
                const menu = instance.container.querySelector(`.${CONFIG.classes.menu}`);
                menu.innerHTML = '';
                items.forEach((item, index) => {
                    const element = createMenuItem(item, instance.options, index);
                    menu.appendChild(element);
                });
            },
            getElement: () => instance.container,
            isOpen: () => instance.isOpen,
            on: (event, handler) => {
                instance.container.addEventListener(event, handler);
            },
            off: (event, handler) => {
                instance.container.removeEventListener(event, handler);
            }
        };

        // Attacher l'API au trigger si disponible
        if (instance.trigger) {
            instance.trigger.menu = publicAPI;
        }

        return publicAPI;
    }

    // Export de l'API publique
    return {
        create,
        instances,
        CONFIG,
        injectStyles
    };
})();

// Export pour utilisation
export default MenuComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-15] - Positionnement des sous-menus
   Solution: Calcul dynamique avec détection des bords
   
   [2024-01-15] - Gestion du focus trap
   Cause: Conflits avec plusieurs menus ouverts
   Résolution: Un seul menu actif à la fois
   
   [2024-01-15] - Performance avec beaucoup d'items
   Solution: Délégation d'événements et lazy loading des sous-menus
   
   NOTES POUR REPRISES FUTURES:
   - Le z-index s'incrémente pour gérer l'empilement
   - Les sous-menus sont créés à la demande
   - La navigation clavier suit les standards ARIA
   - Prévoir l'internationalisation des shortcuts
   ======================================== */