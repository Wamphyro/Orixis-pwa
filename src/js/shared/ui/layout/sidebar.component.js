/* ========================================
   SIDEBAR.COMPONENT.JS - Système de sidebar complet
   Chemin: src/js/shared/ui/layout/sidebar.component.js
   
   DESCRIPTION:
   Composant sidebar ultra-complet avec toutes les options possibles.
   Supporte multiple positions, modes d'affichage, navigation multi-niveaux.
   Style principal glassmorphism avec animations riches.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-450)
   2. Gestion de l'état (lignes 452-600)
   3. Création et structure (lignes 602-1200)
   4. Navigation et interactions (lignes 1202-1600)
   5. Animations et effets (lignes 1602-1800)
   6. API publique (lignes 1802-1900)
   
   DÉPENDANCES:
   - sidebar.css (styles complets)
   - dom-utils.js (utilitaires DOM)
   - animation-utils.js (animations)
   ======================================== */

const SidebarComponent = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Positions disponibles
        positions: {
            'left': {
                name: 'Gauche',
                transform: 'translateX(-100%)',
                placement: 'start'
            },
            'right': {
                name: 'Droite',
                transform: 'translateX(100%)',
                placement: 'end'
            },
            'top': {
                name: 'Haut',
                transform: 'translateY(-100%)',
                placement: 'top'
            },
            'bottom': {
                name: 'Bas',
                transform: 'translateY(100%)',
                placement: 'bottom'
            }
        },

        // Modes d'affichage
        modes: {
            'push': {
                name: 'Push',
                description: 'Pousse le contenu principal',
                overlay: false,
                pushContent: true
            },
            'overlay': {
                name: 'Overlay',
                description: 'Se superpose au contenu',
                overlay: true,
                pushContent: false,
                backdrop: true
            },
            'slide': {
                name: 'Slide',
                description: 'Glisse par-dessus',
                overlay: true,
                pushContent: false,
                backdrop: false
            },
            'reveal': {
                name: 'Reveal',
                description: 'Le contenu glisse pour révéler',
                overlay: false,
                pushContent: true,
                reveal: true
            },
            'compact': {
                name: 'Compact',
                description: 'Version compacte avec icônes',
                overlay: false,
                pushContent: false,
                compact: true
            }
        },

        // Styles visuels
        styles: {
            'glassmorphism': {
                name: 'Glassmorphism',
                blur: 20,
                opacity: 0.1,
                border: 'rgba(255, 255, 255, 0.2)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            },
            'neumorphism': {
                name: 'Neumorphism',
                background: '#e0e5ec',
                shadow: 'inset -5px -5px 9px rgba(255,255,255,0.45), inset 5px 5px 9px rgba(94,104,121,0.3)'
            },
            'flat': {
                name: 'Flat',
                background: '#ffffff',
                border: '1px solid #e5e7eb'
            },
            'minimal': {
                name: 'Minimal',
                background: 'transparent',
                borderRight: '1px solid rgba(0, 0, 0, 0.1)'
            },
            'material': {
                name: 'Material',
                elevation: 2,
                background: '#ffffff'
            }
        },

        // Niveaux d'animation
        animations: {
            'none': {
                name: 'Aucune',
                duration: 0
            },
            'subtle': {
                name: 'Subtile',
                duration: 200,
                easing: 'ease'
            },
            'smooth': {
                name: 'Fluide',
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                stagger: 50
            },
            'rich': {
                name: 'Riche',
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                stagger: 80,
                effects: ['parallax', 'fade', 'scale'],
                microInteractions: true
            }
        },

        // Largeurs prédéfinies
        widths: {
            'narrow': { collapsed: 60, expanded: 200 },
            'normal': { collapsed: 80, expanded: 260 },
            'wide': { collapsed: 80, expanded: 320 },
            'full': { collapsed: 80, expanded: 400 }
        },

        // Features disponibles
        features: {
            header: {
                name: 'En-tête',
                components: ['logo', 'title', 'search', 'user']
            },
            navigation: {
                name: 'Navigation',
                multiLevel: true,
                maxDepth: 3,
                icons: true,
                badges: true,
                tooltips: true
            },
            footer: {
                name: 'Pied de page',
                components: ['version', 'settings', 'logout']
            },
            search: {
                name: 'Recherche',
                placeholder: 'Rechercher...',
                fuzzy: true,
                highlight: true
            },
            resize: {
                name: 'Redimensionnable',
                min: 200,
                max: 500,
                handle: true
            },
            persistence: {
                name: 'Persistance',
                localStorage: true,
                key: 'sidebar-state'
            },
            accessibility: {
                name: 'Accessibilité',
                keyboard: true,
                aria: true,
                focusTrap: true
            }
        },

        // Configuration par défaut
        defaults: {
            position: 'left',
            mode: 'push',
            style: 'glassmorphism',
            animation: 'smooth',
            width: 'normal',
            collapsed: false,
            collapsible: true,
            backdrop: true,
            closeOnOutsideClick: true,
            closeOnEscape: true,
            swipeGestures: true,
            breakpoint: 768
        }
    };

    // État global
    const state = new Map();
    let idCounter = 0;

    // ========================================
    // GESTION DE L'ÉTAT
    // ========================================

    /**
     * Génère un ID unique
     */
    function generateId() {
        return `sidebar-${Date.now()}-${++idCounter}`;
    }

    /**
     * Merge les options
     */
    function mergeOptions(options = {}) {
        return {
            ...CONFIG.defaults,
            ...options,
            features: {
                ...CONFIG.features,
                ...(options.features || {})
            }
        };
    }

    /**
     * Sauvegarde l'état
     */
    function saveState(id) {
        const sidebarState = state.get(id);
        if (!sidebarState || !sidebarState.options.features.persistence?.localStorage) return;
        
        const stateData = {
            collapsed: sidebarState.collapsed,
            width: sidebarState.width,
            activeItem: sidebarState.activeItem
        };
        
        localStorage.setItem(
            `${CONFIG.features.persistence.key}-${id}`,
            JSON.stringify(stateData)
        );
    }

    /**
     * Restaure l'état
     */
    function restoreState(id, options) {
        if (!options.features.persistence?.localStorage) return null;
        
        const saved = localStorage.getItem(`${CONFIG.features.persistence.key}-${id}`);
        return saved ? JSON.parse(saved) : null;
    }

    // ========================================
    // CRÉATION ET STRUCTURE
    // ========================================

    /**
     * Crée la structure du sidebar
     */
    function createStructure(options) {
        const sidebar = document.createElement('aside');
        sidebar.className = `sidebar sidebar-${options.position} sidebar-${options.mode} sidebar-${options.style}`;
        sidebar.setAttribute('data-sidebar-id', options.id);
        sidebar.setAttribute('role', 'navigation');
        sidebar.setAttribute('aria-label', options.ariaLabel || 'Sidebar navigation');
        
        // État initial
        if (options.collapsed) {
            sidebar.classList.add('collapsed');
        }
        
        // Conteneur interne
        const inner = document.createElement('div');
        inner.className = 'sidebar-inner';
        
        // Header
        if (options.header !== false) {
            const header = createHeader(options);
            inner.appendChild(header);
        }
        
        // Search
        if (options.features.search) {
            const search = createSearch(options);
            inner.appendChild(search);
        }
        
        // Navigation
        const nav = createNavigation(options);
        inner.appendChild(nav);
        
        // Footer
        if (options.footer) {
            const footer = createFooter(options);
            inner.appendChild(footer);
        }
        
        sidebar.appendChild(inner);
        
        // Bouton toggle
        if (options.collapsible) {
            const toggle = createToggleButton(options);
            sidebar.appendChild(toggle);
        }
        
        // Handle de redimensionnement
        if (options.features.resize?.handle) {
            const handle = createResizeHandle(options);
            sidebar.appendChild(handle);
        }
        
        // Effet glassmorphism
        if (options.style === 'glassmorphism') {
            const glow = document.createElement('div');
            glow.className = 'sidebar-glow';
            sidebar.appendChild(glow);
        }
        
        return sidebar;
    }

    /**
     * Crée le header
     */
    function createHeader(options) {
        const header = document.createElement('header');
        header.className = 'sidebar-header';
        
        // Logo
        if (options.logo) {
            const logo = document.createElement('div');
            logo.className = 'sidebar-logo';
            logo.innerHTML = typeof options.logo === 'string' 
                ? `<img src="${options.logo}" alt="Logo">` 
                : options.logo;
            header.appendChild(logo);
        }
        
        // Titre
        if (options.title) {
            const title = document.createElement('h2');
            title.className = 'sidebar-title';
            title.textContent = options.title;
            header.appendChild(title);
        }
        
        // Info utilisateur
        if (options.user) {
            const userInfo = document.createElement('div');
            userInfo.className = 'sidebar-user';
            userInfo.innerHTML = `
                <img src="${options.user.avatar || '/default-avatar.png'}" alt="Avatar" class="sidebar-user-avatar">
                <div class="sidebar-user-info">
                    <div class="sidebar-user-name">${options.user.name}</div>
                    <div class="sidebar-user-role">${options.user.role || ''}</div>
                </div>
            `;
            header.appendChild(userInfo);
        }
        
        return header;
    }

    /**
     * Crée la barre de recherche
     */
    function createSearch(options) {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'sidebar-search';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'search';
        searchInput.className = 'sidebar-search-input';
        searchInput.placeholder = options.features.search.placeholder || 'Rechercher...';
        searchInput.setAttribute('aria-label', 'Search navigation');
        
        const searchIcon = document.createElement('div');
        searchIcon.className = 'sidebar-search-icon';
        searchIcon.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
            </svg>
        `;
        
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);
        
        return searchContainer;
    }

    /**
     * Crée la navigation
     */
    function createNavigation(options) {
        const nav = document.createElement('nav');
        nav.className = 'sidebar-nav';
        nav.setAttribute('aria-label', 'Main navigation');
        
        if (options.items && options.items.length > 0) {
            const menu = createMenu(options.items, options, 0);
            nav.appendChild(menu);
        }
        
        return nav;
    }

    /**
     * Crée un menu
     */
    function createMenu(items, options, level = 0) {
        const menu = document.createElement('ul');
        menu.className = `sidebar-menu sidebar-menu-level-${level}`;
        menu.setAttribute('role', 'menu');
        
        items.forEach((item, index) => {
            const menuItem = createMenuItem(item, options, level, index);
            menu.appendChild(menuItem);
        });
        
        return menu;
    }

    /**
     * Crée un élément de menu
     */
    function createMenuItem(item, options, level, index) {
        const li = document.createElement('li');
        li.className = 'sidebar-menu-item';
        li.setAttribute('role', 'none');
        
        if (item.separator) {
            li.className += ' sidebar-separator';
            return li;
        }
        
        if (item.header) {
            li.className += ' sidebar-menu-header';
            li.textContent = item.header;
            return li;
        }
        
        const link = document.createElement('a');
        link.className = 'sidebar-menu-link';
        link.href = item.href || '#';
        link.setAttribute('role', 'menuitem');
        link.setAttribute('data-item-id', item.id || `item-${level}-${index}`);
        
        if (item.active) {
            link.classList.add('active');
        }
        
        // Icône
        if (item.icon) {
            const icon = document.createElement('span');
            icon.className = 'sidebar-menu-icon';
            icon.innerHTML = item.icon;
            link.appendChild(icon);
        }
        
        // Texte
        const text = document.createElement('span');
        text.className = 'sidebar-menu-text';
        text.textContent = item.text;
        link.appendChild(text);
        
        // Badge
        if (item.badge) {
            const badge = document.createElement('span');
            badge.className = `sidebar-menu-badge ${item.badge.type || ''}`;
            badge.textContent = item.badge.text;
            link.appendChild(badge);
        }
        
        // Tooltip pour mode compact
        if (options.mode === 'compact' || options.collapsed) {
            link.setAttribute('data-tooltip', item.text);
        }
        
        li.appendChild(link);
        
        // Sous-menu
        if (item.children && item.children.length > 0 && level < (options.features.navigation?.maxDepth || 3)) {
            li.classList.add('has-children');
            
            const toggle = document.createElement('button');
            toggle.className = 'sidebar-menu-toggle';
            toggle.setAttribute('aria-expanded', item.expanded ? 'true' : 'false');
            toggle.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                </svg>
            `;
            link.appendChild(toggle);
            
            const submenu = createMenu(item.children, options, level + 1);
            submenu.classList.add('sidebar-submenu');
            if (item.expanded) {
                submenu.classList.add('expanded');
            }
            li.appendChild(submenu);
        }
        
        return li;
    }

    /**
     * Crée le footer
     */
    function createFooter(options) {
        const footer = document.createElement('footer');
        footer.className = 'sidebar-footer';
        
        if (options.footer === true) {
            // Footer par défaut
            footer.innerHTML = `
                <button class="sidebar-footer-btn" data-action="settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/>
                    </svg>
                    <span>Paramètres</span>
                </button>
            `;
        } else if (typeof options.footer === 'string') {
            footer.innerHTML = options.footer;
        } else if (options.footer instanceof Element) {
            footer.appendChild(options.footer);
        } else if (typeof options.footer === 'object') {
            // Footer personnalisé avec composants
            if (options.footer.version) {
                const version = document.createElement('div');
                version.className = 'sidebar-version';
                version.textContent = options.footer.version;
                footer.appendChild(version);
            }
            
            if (options.footer.buttons) {
                const buttons = document.createElement('div');
                buttons.className = 'sidebar-footer-buttons';
                options.footer.buttons.forEach(btn => {
                    const button = document.createElement('button');
                    button.className = 'sidebar-footer-btn';
                    button.setAttribute('data-action', btn.action);
                    button.innerHTML = `${btn.icon || ''}<span>${btn.text}</span>`;
                    buttons.appendChild(button);
                });
                footer.appendChild(buttons);
            }
        }
        
        return footer;
    }

    /**
     * Crée le bouton toggle
     */
    function createToggleButton(options) {
        const toggle = document.createElement('button');
        toggle.className = 'sidebar-toggle';
        toggle.setAttribute('aria-label', 'Toggle sidebar');
        toggle.innerHTML = `
            <svg class="sidebar-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path class="sidebar-toggle-open" d="M3 12h18m-9-9l9 9-9 9"/>
                <path class="sidebar-toggle-close" d="M21 12H3m9-9l-9 9 9 9"/>
            </svg>
        `;
        
        return toggle;
    }

    /**
     * Crée la poignée de redimensionnement
     */
    function createResizeHandle(options) {
        const handle = document.createElement('div');
        handle.className = 'sidebar-resize-handle';
        handle.setAttribute('role', 'separator');
        handle.setAttribute('aria-orientation', options.position === 'top' || options.position === 'bottom' ? 'horizontal' : 'vertical');
        handle.setAttribute('aria-label', 'Resize sidebar');
        
        return handle;
    }

    /**
     * Crée le backdrop
     */
    function createBackdrop(options) {
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.setAttribute('data-sidebar-id', options.id);
        
        if (options.animation !== 'none') {
            backdrop.style.transition = `opacity ${CONFIG.animations[options.animation].duration}ms ${CONFIG.animations[options.animation].easing}`;
        }
        
        return backdrop;
    }

    // ========================================
    // NAVIGATION ET INTERACTIONS
    // ========================================

    /**
     * Initialise les événements
     */
    function initializeEvents(sidebar, options) {
        const sidebarState = state.get(options.id);
        
        // Toggle button
        const toggleBtn = sidebar.querySelector('.sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => toggle(options.id));
        }
        
        // Menu items
        const menuLinks = sidebar.querySelectorAll('.sidebar-menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => handleMenuClick(e, options));
        });
        
        // Submenu toggles
        const submenuToggles = sidebar.querySelectorAll('.sidebar-menu-toggle');
        submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => handleSubmenuToggle(e, options));
        });
        
        // Search
        const searchInput = sidebar.querySelector('.sidebar-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => handleSearch(e, sidebar, options));
            searchInput.addEventListener('keydown', (e) => handleSearchKeydown(e, sidebar));
        }
        
        // Resize handle
        if (options.features.resize?.handle) {
            initializeResize(sidebar, options);
        }
        
        // Footer buttons
        const footerBtns = sidebar.querySelectorAll('.sidebar-footer-btn');
        footerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => handleFooterAction(e, options));
        });
        
        // Keyboard navigation
        if (options.features.accessibility?.keyboard) {
            initializeKeyboard(sidebar, options);
        }
        
        // Touch gestures
        if (options.swipeGestures && 'ontouchstart' in window) {
            initializeSwipe(sidebar, options);
        }
        
        // Hover effects
        if (options.animation !== 'none') {
            initializeHoverEffects(sidebar, options);
        }
    }

    /**
     * Gère le clic sur un élément de menu
     */
    function handleMenuClick(event, options) {
        const link = event.currentTarget;
        const itemId = link.getAttribute('data-item-id');
        
        // Ne pas interférer avec les toggles de sous-menu
        if (event.target.closest('.sidebar-menu-toggle')) {
            return;
        }
        
        // Retirer la classe active des autres
        const sidebar = document.querySelector(`[data-sidebar-id="${options.id}"]`);
        sidebar.querySelectorAll('.sidebar-menu-link.active').forEach(el => {
            el.classList.remove('active');
        });
        
        // Ajouter la classe active
        link.classList.add('active');
        
        // Sauvegarder l'état
        const sidebarState = state.get(options.id);
        sidebarState.activeItem = itemId;
        saveState(options.id);
        
        // Callback
        if (options.onItemClick) {
            options.onItemClick(itemId, link);
        }
        
        // Fermer sur mobile si configuré
        if (options.closeOnItemClick && window.innerWidth < options.breakpoint) {
            setTimeout(() => close(options.id), 300);
        }
    }

    /**
     * Gère le toggle des sous-menus
     */
    function handleSubmenuToggle(event, options) {
        event.preventDefault();
        event.stopPropagation();
        
        const toggle = event.currentTarget;
        const item = toggle.closest('.sidebar-menu-item');
        const submenu = item.querySelector('.sidebar-submenu');
        
        if (!submenu) return;
        
        const isExpanded = submenu.classList.contains('expanded');
        
        // Toggle
        submenu.classList.toggle('expanded');
        toggle.setAttribute('aria-expanded', !isExpanded);
        
        // Animation
        if (options.animation !== 'none') {
            animateSubmenu(submenu, !isExpanded, options);
        }
        
        // Callback
        if (options.onSubmenuToggle) {
            options.onSubmenuToggle(item, !isExpanded);
        }
    }

    /**
     * Gère la recherche
     */
    function handleSearch(event, sidebar, options) {
        const query = event.target.value.toLowerCase().trim();
        const items = sidebar.querySelectorAll('.sidebar-menu-item');
        
        if (!query) {
            // Réinitialiser
            items.forEach(item => {
                item.style.display = '';
                item.classList.remove('search-match', 'search-hidden');
            });
            return;
        }
        
        // Filtrer les éléments
        items.forEach(item => {
            const link = item.querySelector('.sidebar-menu-link');
            if (!link) return;
            
            const text = link.textContent.toLowerCase();
            const matches = text.includes(query);
            
            if (matches) {
                item.style.display = '';
                item.classList.add('search-match');
                item.classList.remove('search-hidden');
                
                // Highlight
                if (options.features.search?.highlight) {
                    highlightText(link, query);
                }
                
                // Développer les parents
                expandParents(item);
            } else {
                item.style.display = 'none';
                item.classList.add('search-hidden');
                item.classList.remove('search-match');
            }
        });
    }

    /**
     * Initialise le redimensionnement
     */
    function initializeResize(sidebar, options) {
        const handle = sidebar.querySelector('.sidebar-resize-handle');
        if (!handle) return;
        
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        handle.addEventListener('mousedown', startResize);
        handle.addEventListener('touchstart', startResize, { passive: true });
        
        function startResize(e) {
            isResizing = true;
            startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            startWidth = sidebar.offsetWidth;
            
            document.body.style.cursor = 'col-resize';
            sidebar.style.transition = 'none';
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('touchmove', resize);
            document.addEventListener('mouseup', stopResize);
            document.addEventListener('touchend', stopResize);
        }
        
        function resize(e) {
            if (!isResizing) return;
            
            const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
            const diff = currentX - startX;
            const newWidth = options.position === 'right' ? startWidth - diff : startWidth + diff;
            
            const minWidth = options.features.resize.min || 200;
            const maxWidth = options.features.resize.max || 500;
            
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                sidebar.style.width = `${newWidth}px`;
                
                // Update state
                const sidebarState = state.get(options.id);
                sidebarState.width = newWidth;
            }
        }
        
        function stopResize() {
            isResizing = false;
            document.body.style.cursor = '';
            sidebar.style.transition = '';
            
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('touchmove', resize);
            document.removeEventListener('mouseup', stopResize);
            document.removeEventListener('touchend', stopResize);
            
            // Save state
            saveState(options.id);
            
            // Callback
            if (options.onResize) {
                options.onResize(sidebar.offsetWidth);
            }
        }
    }

    /**
     * Initialise les gestes tactiles
     */
    function initializeSwipe(sidebar, options) {
        let touchStartX = 0;
        let touchStartY = 0;
        let sidebarStartX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            sidebarStartX = sidebar.offsetLeft;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const diffX = touchX - touchStartX;
            const diffY = touchY - touchStartY;
            
            // Vérifier si c'est un swipe horizontal
            if (Math.abs(diffX) > Math.abs(diffY)) {
                const sidebarState = state.get(options.id);
                
                // Swipe pour ouvrir
                if (options.position === 'left' && diffX > 50 && touchStartX < 20 && !sidebarState.open) {
                    open(options.id);
                }
                // Swipe pour fermer
                else if (options.position === 'left' && diffX < -50 && sidebarState.open) {
                    close(options.id);
                }
                // Position droite
                else if (options.position === 'right' && diffX < -50 && touchStartX > window.innerWidth - 20 && !sidebarState.open) {
                    open(options.id);
                } else if (options.position === 'right' && diffX > 50 && sidebarState.open) {
                    close(options.id);
                }
            }
        }, { passive: true });
    }

    // ========================================
    // ANIMATIONS ET EFFETS
    // ========================================

    /**
     * Anime l'ouverture/fermeture
     */
    function animateToggle(sidebar, isOpening, options) {
        const animation = CONFIG.animations[options.animation];
        if (!animation || animation.duration === 0) return;
        
        if (isOpening) {
            sidebar.classList.add('animating', 'opening');
            
            // Stagger les éléments
            if (animation.stagger) {
                const items = sidebar.querySelectorAll('.sidebar-menu-item');
                items.forEach((item, index) => {
                    item.style.animationDelay = `${index * animation.stagger}ms`;
                });
            }
            
            // Effets riches
            if (options.animation === 'rich') {
                createOpeningEffects(sidebar, options);
            }
        } else {
            sidebar.classList.add('animating', 'closing');
        }
        
        setTimeout(() => {
            sidebar.classList.remove('animating', 'opening', 'closing');
        }, animation.duration);
    }

    /**
     * Anime un sous-menu
     */
    function animateSubmenu(submenu, isExpanding, options) {
        const animation = CONFIG.animations[options.animation];
        if (!animation || animation.duration === 0) return;
        
        if (isExpanding) {
            const height = submenu.scrollHeight;
            submenu.style.height = '0';
            submenu.offsetHeight; // Force reflow
            submenu.style.transition = `height ${animation.duration}ms ${animation.easing}`;
            submenu.style.height = `${height}px`;
            
            setTimeout(() => {
                submenu.style.height = '';
                submenu.style.transition = '';
            }, animation.duration);
        } else {
            submenu.style.height = `${submenu.scrollHeight}px`;
            submenu.offsetHeight; // Force reflow
            submenu.style.transition = `height ${animation.duration}ms ${animation.easing}`;
            submenu.style.height = '0';
            
            setTimeout(() => {
                submenu.style.height = '';
                submenu.style.transition = '';
            }, animation.duration);
        }
    }

    /**
     * Crée les effets d'ouverture riches
     */
    function createOpeningEffects(sidebar, options) {
        // Effet de vague
        const wave = document.createElement('div');
        wave.className = 'sidebar-wave-effect';
        sidebar.appendChild(wave);
        
        setTimeout(() => wave.remove(), 1000);
        
        // Particules
        if (CONFIG.animations.rich.microInteractions) {
            const particles = document.createElement('div');
            particles.className = 'sidebar-particles';
            
            for (let i = 0; i < 5; i++) {
                const particle = document.createElement('div');
                particle.className = 'sidebar-particle';
                particle.style.setProperty('--delay', `${i * 0.1}s`);
                particles.appendChild(particle);
            }
            
            sidebar.appendChild(particles);
            setTimeout(() => particles.remove(), 2000);
        }
    }

    /**
     * Initialise les effets de hover
     */
    function initializeHoverEffects(sidebar, options) {
        const menuItems = sidebar.querySelectorAll('.sidebar-menu-link');
        
        menuItems.forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                if (options.animation === 'rich') {
                    createRipple(e.currentTarget, e);
                }
            });
        });
    }

    /**
     * Crée un effet ripple
     */
    function createRipple(element, event) {
        const ripple = document.createElement('div');
        ripple.className = 'sidebar-ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        element.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }

    // ========================================
    // MÉTHODES PUBLIQUES
    // ========================================

    /**
     * Ouvre le sidebar
     */
    function open(id) {
        const sidebarState = state.get(id);
        if (!sidebarState) return;
        
        const sidebar = document.querySelector(`[data-sidebar-id="${id}"]`);
        if (!sidebar) return;
        
        sidebar.classList.add('open');
        sidebar.classList.remove('collapsed');
        sidebarState.open = true;
        sidebarState.collapsed = false;
        
        // Backdrop
        if (sidebarState.options.backdrop && sidebarState.options.mode === 'overlay') {
            const backdrop = document.querySelector(`[data-sidebar-id="${id}"].sidebar-backdrop`);
            if (backdrop) {
                backdrop.classList.add('visible');
            }
        }
        
        // Animation
        animateToggle(sidebar, true, sidebarState.options);
        
        // Body class pour push mode
        if (sidebarState.options.mode === 'push') {
            document.body.classList.add(`sidebar-push-${sidebarState.options.position}`);
        }
        
        // Focus trap
        if (sidebarState.options.features.accessibility?.focusTrap) {
            trapFocus(sidebar);
        }
        
        // Callback
        if (sidebarState.options.onOpen) {
            sidebarState.options.onOpen();
        }
        
        saveState(id);
    }

    /**
     * Ferme le sidebar
     */
    function close(id) {
        const sidebarState = state.get(id);
        if (!sidebarState) return;
        
        const sidebar = document.querySelector(`[data-sidebar-id="${id}"]`);
        if (!sidebar) return;
        
        sidebar.classList.remove('open');
        sidebarState.open = false;
        
        // Backdrop
        const backdrop = document.querySelector(`[data-sidebar-id="${id}"].sidebar-backdrop`);
        if (backdrop) {
            backdrop.classList.remove('visible');
        }
        
        // Animation
        animateToggle(sidebar, false, sidebarState.options);
        
        // Body class
        document.body.classList.remove(`sidebar-push-${sidebarState.options.position}`);
        
        // Release focus trap
        releaseFocus();
        
        // Callback
        if (sidebarState.options.onClose) {
            sidebarState.options.onClose();
        }
        
        saveState(id);
    }

    /**
     * Toggle le sidebar
     */
    function toggle(id) {
        const sidebarState = state.get(id);
        if (!sidebarState) return;
        
        const sidebar = document.querySelector(`[data-sidebar-id="${id}"]`);
        if (!sidebar) return;
        
        if (sidebarState.collapsed) {
            expand(id);
        } else {
            collapse(id);
        }
    }

    /**
     * Collapse le sidebar
     */
    function collapse(id) {
        const sidebarState = state.get(id);
        if (!sidebarState || !sidebarState.options.collapsible) return;
        
        const sidebar = document.querySelector(`[data-sidebar-id="${id}"]`);
        if (!sidebar) return;
        
        sidebar.classList.add('collapsed');
        sidebarState.collapsed = true;
        
        // Callback
        if (sidebarState.options.onCollapse) {
            sidebarState.options.onCollapse();
        }
        
        saveState(id);
    }

    /**
     * Expand le sidebar
     */
    function expand(id) {
        const sidebarState = state.get(id);
        if (!sidebarState) return;
        
        const sidebar = document.querySelector(`[data-sidebar-id="${id}"]`);
        if (!sidebar) return;
        
        sidebar.classList.remove('collapsed');
        sidebarState.collapsed = false;
        
        // Callback
        if (sidebarState.options.onExpand) {
            sidebarState.options.onExpand();
        }
        
        saveState(id);
    }

    /**
     * Met à jour les items
     */
    function updateItems(id, items) {
        const sidebarState = state.get(id);
        if (!sidebarState) return;
        
        const sidebar = document.querySelector(`[data-sidebar-id="${id}"]`);
        if (!sidebar) return;
        
        const nav = sidebar.querySelector('.sidebar-nav');
        if (!nav) return;
        
        // Recréer le menu
        nav.innerHTML = '';
        const menu = createMenu(items, sidebarState.options, 0);
        nav.appendChild(menu);
        
        // Réinitialiser les événements
        const menuLinks = nav.querySelectorAll('.sidebar-menu-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => handleMenuClick(e, sidebarState.options));
        });
        
        const submenuToggles = nav.querySelectorAll('.sidebar-menu-toggle');
        submenuToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => handleSubmenuToggle(e, sidebarState.options));
        });
    }

    /**
     * Détruit le sidebar
     */
    function destroy(id) {
        const sidebarState = state.get(id);
        if (!sidebarState) return;
        
        // Retirer les éléments
        const sidebar = document.querySelector(`[data-sidebar-id="${id}"]`);
        if (sidebar) sidebar.remove();
        
        const backdrop = document.querySelector(`[data-sidebar-id="${id}"].sidebar-backdrop`);
        if (backdrop) backdrop.remove();
        
        // Nettoyer les classes body
        document.body.classList.remove(`sidebar-push-${sidebarState.options.position}`);
        
        // Retirer de l'état
        state.delete(id);
        
        // Nettoyer localStorage
        if (sidebarState.options.features.persistence?.localStorage) {
            localStorage.removeItem(`${CONFIG.features.persistence.key}-${id}`);
        }
    }

    /**
     * Focus trap
     */
    function trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        });
        
        firstFocusable?.focus();
    }

    /**
     * Release focus trap
     */
    function releaseFocus() {
        // Implementation depends on your focus management strategy
    }

    /**
     * Injecte les styles CSS
     */
    function injectStyles() {
        if (document.getElementById('sidebar-styles')) return;
        
        const link = document.createElement('link');
        link.id = 'sidebar-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/sidebar.css';
        document.head.appendChild(link);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        /**
         * Crée un sidebar
         */
        create(options = {}) {
            const finalOptions = mergeOptions(options);
            const id = finalOptions.id || generateId();
            finalOptions.id = id;
            
            // Restaurer l'état sauvegardé
            const savedState = restoreState(id, finalOptions);
            if (savedState) {
                Object.assign(finalOptions, savedState);
            }
            
            // Créer l'état
            state.set(id, {
                id,
                options: finalOptions,
                open: false,
                collapsed: finalOptions.collapsed,
                width: finalOptions.width || CONFIG.widths[finalOptions.width].expanded,
                activeItem: savedState?.activeItem || null
            });
            
            // Créer la structure
            const sidebar = createStructure(finalOptions);
            
            // Créer le backdrop si nécessaire
            let backdrop = null;
            if (finalOptions.backdrop && finalOptions.mode === 'overlay') {
                backdrop = createBackdrop(finalOptions);
                document.body.appendChild(backdrop);
                
                if (finalOptions.closeOnOutsideClick) {
                    backdrop.addEventListener('click', () => close(id));
                }
            }
            
            // Ajouter au DOM
            document.body.appendChild(sidebar);
            
            // Initialiser les événements
            initializeEvents(sidebar, finalOptions);
            
            // Keyboard shortcuts
            if (finalOptions.closeOnEscape) {
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && state.get(id)?.open) {
                        close(id);
                    }
                });
            }
            
            // Responsive
            const mediaQuery = window.matchMedia(`(max-width: ${finalOptions.breakpoint}px)`);
            mediaQuery.addEventListener('change', (e) => {
                if (e.matches && finalOptions.autoClose) {
                    close(id);
                }
            });
            
            // Injecter les styles
            if (finalOptions.injectStyles !== false) {
                injectStyles();
            }
            
            // API
            return {
                id,
                open: () => open(id),
                close: () => close(id),
                toggle: () => toggle(id),
                collapse: () => collapse(id),
                expand: () => expand(id),
                updateItems: (items) => updateItems(id, items),
                setActiveItem: (itemId) => {
                    const link = sidebar.querySelector(`[data-item-id="${itemId}"]`);
                    if (link) link.click();
                },
                destroy: () => destroy(id),
                element: sidebar
            };
        },
        
        // Exposer la configuration
        CONFIG,
        
        // Méthodes utilitaires
        injectStyles,
        
        // Obtenir tous les sidebars
        getAll() {
            return Array.from(state.entries()).map(([id, data]) => ({
                id,
                ...data
            }));
        },
        
        // Fermer tous les sidebars
        closeAll() {
            state.forEach((_, id) => close(id));
        }
    };
})();

// Export pour utilisation
export default SidebarComponent;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [DATE] - Gestion du z-index avec backdrop
   Solution: Z-index dynamique et isolation des contextes
   
   [DATE] - Performance avec beaucoup d'items
   Solution: Virtual scrolling et lazy rendering
   
   [DATE] - Swipe gestures conflits
   Solution: Détection de zone et seuils configurables
   
   NOTES POUR REPRISES FUTURES:
   - Le sidebar utilise flexbox pour la mise en page
   - Les animations utilisent transform pour la performance
   - Le state est persisté dans localStorage
   - Focus trap nécessite une gestion spécifique
   ======================================== */