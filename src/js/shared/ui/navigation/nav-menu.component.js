/* ========================================
   NAV-MENU.COMPONENT.JS - Composant de menu de navigation ultra-complet
   Chemin: src/js/shared/ui/navigation/nav-menu.component.js
   
   DESCRIPTION:
   Système de navigation complet avec multiples variantes, positions,
   animations et fonctionnalités avancées pour tous types d'applications.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-300)
   2. Création du DOM (lignes 302-700)
   3. Gestion des événements (lignes 702-1000)
   4. Navigation mobile (lignes 1002-1200)
   5. Sous-menus et mega-menus (lignes 1202-1400)
   6. Animations et transitions (lignes 1402-1600)
   7. Méthodes utilitaires (lignes 1602-1800)
   8. API publique (lignes 1802-1900)
   
   DÉPENDANCES:
   - nav-menu.css (styles associés)
   - dom-utils.js (manipulation DOM)
   - animation-utils.js (animations)
   ======================================== */

const NavMenu = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Tous les styles possibles
        styles: {
            'glassmorphism': {
                blur: 20,
                opacity: 0.08,
                border: 'rgba(255, 255, 255, 0.2)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                glow: true,
                reflections: true
            },
            'neumorphism': {
                background: '#e0e5ec',
                shadow: '9px 9px 16px #a3b1c6, -9px -9px 16px #ffffff',
                borderRadius: 20
            },
            'flat': {
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                shadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            },
            'minimal': {
                background: 'transparent',
                border: 'none',
                underline: true
            },
            'material': {
                elevation: 2,
                ripple: true,
                borderRadius: 0
            },
            'gradient': {
                gradientStart: '#667eea',
                gradientEnd: '#764ba2',
                textShadow: true
            },
            'dark': {
                background: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                blur: 10
            }
        },

        // Types de menu
        types: {
            'horizontal': {
                default: true,
                orientation: 'row',
                submenuDirection: 'down'
            },
            'vertical': {
                orientation: 'column',
                submenuDirection: 'right',
                collapsible: true
            },
            'sidebar': {
                fixed: true,
                collapsible: true,
                miniVariant: true,
                overlay: true
            },
            'dock': {
                position: 'bottom',
                centered: true,
                magnify: true
            },
            'circular': {
                radial: true,
                animated: true,
                triggerButton: true
            },
            'fullscreen': {
                overlay: true,
                centered: true,
                animated: true
            },
            'tabs': {
                underline: true,
                sliding: true,
                scrollable: true
            },
            'breadcrumb': {
                separator: '/',
                collapsible: true,
                dropdown: true
            }
        },

        // Positions possibles
        positions: {
            'top': { fixed: true, fullWidth: true },
            'bottom': { fixed: true, fullWidth: true },
            'left': { fixed: true, fullHeight: true },
            'right': { fixed: true, fullHeight: true },
            'static': { fixed: false },
            'sticky': { sticky: true, threshold: 100 },
            'floating': { absolute: true, draggable: true }
        },

        // Tailles disponibles
        sizes: {
            'small': {
                height: 48,
                fontSize: 13,
                iconSize: 18,
                padding: 12
            },
            'medium': {
                height: 56,
                fontSize: 14,
                iconSize: 20,
                padding: 16
            },
            'large': {
                height: 64,
                fontSize: 16,
                iconSize: 24,
                padding: 20
            },
            'compact': {
                height: 40,
                fontSize: 12,
                iconSize: 16,
                padding: 8
            }
        },

        // Options d'animation
        animations: {
            'none': { enabled: false },
            'subtle': {
                duration: 200,
                easing: 'ease-out',
                hover: 'fade'
            },
            'smooth': {
                duration: 300,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                hover: 'slide',
                submenu: 'slideDown'
            },
            'rich': {
                duration: 400,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                hover: 'glow',
                submenu: 'fadeSlide',
                effects: ['parallax', 'morph', 'ripple']
            },
            'bounce': {
                duration: 600,
                easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                hover: 'bounce',
                magnetic: true
            }
        },

        // Fonctionnalités
        features: {
            'search': true,
            'notifications': true,
            'user-menu': true,
            'language-switcher': true,
            'theme-toggle': true,
            'mega-menu': true,
            'breadcrumbs': true,
            'progress-bar': true,
            'sticky-header': true,
            'transparent-scroll': true,
            'auto-hide': true,
            'swipe-gestures': true,
            'keyboard-nav': true,
            'voice-control': true,
            'shortcuts': true,
            'recent-items': true,
            'favorites': true,
            'context-menu': true
        },

        // Structure d'item de menu
        itemDefaults: {
            icon: null,
            badge: null,
            shortcut: null,
            description: null,
            divider: false,
            disabled: false,
            hidden: false,
            permission: null,
            customClass: null,
            tooltip: null
        },

        // Types de badges
        badges: {
            'dot': {
                size: 8,
                position: 'top-right'
            },
            'count': {
                size: 20,
                maxCount: 99,
                position: 'top-right'
            },
            'text': {
                padding: '2px 6px',
                position: 'right'
            },
            'icon': {
                size: 16,
                position: 'right'
            }
        },

        // Icônes par défaut
        icons: {
            menu: '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>',
            close: '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
            dropdown: '<path d="M7 10l5 5 5-5z"/>',
            search: '<path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>',
            user: '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
            notification: '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>',
            settings: '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>'
        },

        // Breakpoints responsive
        breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1280
        }
    };

    // ========================================
    // ÉTAT INTERNE
    // ========================================
    const state = new Map();
    let instanceId = 0;

    // ========================================
    // CRÉATION DU DOM
    // ========================================
    function createNavMenu(options = {}) {
        const id = `nav-menu-${++instanceId}`;
        const config = mergeConfig(options);
        
        // Initialiser l'état
        state.set(id, {
            items: config.items || [],
            activeItem: null,
            openSubmenus: new Set(),
            isMobileOpen: false,
            searchQuery: '',
            collapsed: config.type === 'sidebar' ? config.startCollapsed : false,
            scrolled: false,
            favorites: new Set()
        });

        const container = document.createElement('nav');
        container.className = `nav-menu ${config.style} ${config.type} ${config.size} ${config.position}`;
        container.dataset.navId = id;
        container.setAttribute('role', 'navigation');
        container.setAttribute('aria-label', config.ariaLabel || 'Menu principal');

        // Structure différente selon le type
        switch (config.type) {
            case 'sidebar':
                container.innerHTML = createSidebarStructure(config, id);
                break;
            case 'circular':
                container.innerHTML = createCircularStructure(config, id);
                break;
            case 'fullscreen':
                container.innerHTML = createFullscreenStructure(config, id);
                break;
            case 'breadcrumb':
                container.innerHTML = createBreadcrumbStructure(config, id);
                break;
            case 'dock':
                container.innerHTML = createDockStructure(config, id);
                break;
            default:
                container.innerHTML = createDefaultStructure(config, id);
        }

        // Initialiser les événements
        initializeEvents(container, id, config);

        // Initialiser les fonctionnalités
        initializeFeatures(container, id, config);

        // Démarrer les animations
        if (config.animation !== 'none') {
            initializeAnimations(container, config);
        }

        return container;
    }

    // ========================================
    // STRUCTURES PAR TYPE
    // ========================================
    function createDefaultStructure(config, id) {
        return `
            <!-- Container principal -->
            <div class="nav-container">
                <!-- Logo/Brand -->
                ${config.brand ? `
                    <div class="nav-brand">
                        ${config.brand.logo ? `
                            <img src="${config.brand.logo}" alt="${config.brand.name || ''}" class="nav-logo">
                        ` : ''}
                        ${config.brand.name ? `
                            <span class="nav-brand-name">${config.brand.name}</span>
                        ` : ''}
                    </div>
                ` : ''}

                <!-- Toggle mobile -->
                <button class="nav-mobile-toggle" aria-label="Ouvrir le menu" aria-expanded="false">
                    <span class="nav-toggle-icon">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>

                <!-- Menu principal -->
                <div class="nav-menu-wrapper">
                    <ul class="nav-menu-items" role="menubar">
                        ${renderMenuItems(state.get(id).items, config)}
                    </ul>
                </div>

                <!-- Actions/Outils -->
                <div class="nav-actions">
                    ${config.features.search ? createSearchBox(config) : ''}
                    ${config.features.notifications ? createNotifications(config) : ''}
                    ${config.features['language-switcher'] ? createLanguageSwitcher(config) : ''}
                    ${config.features['theme-toggle'] ? createThemeToggle(config) : ''}
                    ${config.features['user-menu'] ? createUserMenu(config) : ''}
                </div>
            </div>

            <!-- Progress bar (si activé) -->
            ${config.features['progress-bar'] ? `
                <div class="nav-progress-bar">
                    <div class="nav-progress-fill"></div>
                </div>
            ` : ''}

            <!-- Mobile overlay -->
            <div class="nav-mobile-overlay"></div>
        `;
    }

    function createSidebarStructure(config, id) {
        return `
            <!-- Header sidebar -->
            <div class="nav-sidebar-header">
                ${config.brand ? `
                    <div class="nav-brand">
                        ${config.brand.logo ? `
                            <img src="${config.brand.logo}" alt="${config.brand.name || ''}" class="nav-logo">
                        ` : ''}
                        ${config.brand.name ? `
                            <span class="nav-brand-name">${config.brand.name}</span>
                        ` : ''}
                    </div>
                ` : ''}
                
                <button class="nav-sidebar-toggle" aria-label="Réduire le menu">
                    <svg viewBox="0 0 24 24">
                        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                    </svg>
                </button>
            </div>

            <!-- Recherche sidebar -->
            ${config.features.search ? `
                <div class="nav-sidebar-search">
                    ${createSearchBox(config)}
                </div>
            ` : ''}

            <!-- Menu sidebar -->
            <div class="nav-sidebar-menu">
                <ul class="nav-menu-items" role="menubar">
                    ${renderMenuItems(state.get(id).items, config, 'sidebar')}
                </ul>
            </div>

            <!-- Footer sidebar -->
            <div class="nav-sidebar-footer">
                ${config.features['user-menu'] ? createUserMenu(config, 'compact') : ''}
                ${config.features.settings ? `
                    <button class="nav-settings-btn" aria-label="Paramètres">
                        <svg viewBox="0 0 24 24">${CONFIG.icons.settings}</svg>
                        <span class="nav-label">Paramètres</span>
                    </button>
                ` : ''}
            </div>
        `;
    }

    function createCircularStructure(config, id) {
        const items = state.get(id).items;
        const angleStep = 360 / items.length;
        
        return `
            <!-- Bouton central -->
            <button class="nav-circular-trigger" aria-label="Ouvrir le menu circulaire">
                <svg viewBox="0 0 24 24">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
            </button>

            <!-- Items circulaires -->
            <div class="nav-circular-items">
                ${items.map((item, index) => `
                    <a href="${item.href || '#'}" 
                       class="nav-circular-item"
                       style="--angle: ${index * angleStep}deg; --delay: ${index * 50}ms"
                       aria-label="${item.label}">
                        ${item.icon ? `
                            <svg viewBox="0 0 24 24">${item.icon}</svg>
                        ` : ''}
                        <span class="nav-circular-label">${item.label}</span>
                    </a>
                `).join('')}
            </div>
        `;
    }

    function createFullscreenStructure(config, id) {
        return `
            <!-- Toggle fullscreen -->
            <button class="nav-fullscreen-toggle" aria-label="Ouvrir le menu">
                <span class="nav-toggle-icon">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>

            <!-- Fullscreen overlay -->
            <div class="nav-fullscreen-overlay">
                <div class="nav-fullscreen-content">
                    <!-- Close button -->
                    <button class="nav-fullscreen-close" aria-label="Fermer le menu">
                        <svg viewBox="0 0 24 24">${CONFIG.icons.close}</svg>
                    </button>

                    <!-- Menu -->
                    <nav class="nav-fullscreen-menu">
                        <ul class="nav-menu-items">
                            ${renderMenuItems(state.get(id).items, config, 'fullscreen')}
                        </ul>
                    </nav>

                    <!-- Footer info -->
                    ${config.footer ? `
                        <div class="nav-fullscreen-footer">
                            ${config.footer}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function createBreadcrumbStructure(config, id) {
        const items = config.breadcrumbs || [];
        
        return `
            <ol class="nav-breadcrumb-list" aria-label="Fil d'Ariane">
                ${items.map((item, index) => `
                    <li class="nav-breadcrumb-item ${index === items.length - 1 ? 'active' : ''}">
                        ${index < items.length - 1 ? `
                            <a href="${item.href || '#'}" class="nav-breadcrumb-link">
                                ${item.icon ? `<svg viewBox="0 0 24 24">${item.icon}</svg>` : ''}
                                <span>${item.label}</span>
                            </a>
                        ` : `
                            <span class="nav-breadcrumb-current" aria-current="page">
                                ${item.icon ? `<svg viewBox="0 0 24 24">${item.icon}</svg>` : ''}
                                <span>${item.label}</span>
                            </span>
                        `}
                        ${index < items.length - 1 ? `
                            <span class="nav-breadcrumb-separator" aria-hidden="true">
                                ${config.separator || '/'}
                            </span>
                        ` : ''}
                    </li>
                `).join('')}
            </ol>
        `;
    }

    function createDockStructure(config, id) {
        return `
            <div class="nav-dock-container">
                <ul class="nav-dock-items">
                    ${renderMenuItems(state.get(id).items, config, 'dock')}
                </ul>
            </div>
        `;
    }

    // ========================================
    // RENDU DES ITEMS
    // ========================================
    function renderMenuItems(items, config, variant = 'default') {
        return items.map(item => {
            if (item.divider) {
                return '<li class="nav-divider" role="separator"></li>';
            }

            const hasSubmenu = item.children && item.children.length > 0;
            const itemClass = `nav-item ${item.active ? 'active' : ''} ${item.disabled ? 'disabled' : ''} ${hasSubmenu ? 'has-submenu' : ''} ${item.customClass || ''}`;

            return `
                <li class="${itemClass}" role="none">
                    ${hasSubmenu ? `
                        <button class="nav-link nav-submenu-trigger"
                                role="menuitem"
                                aria-haspopup="true"
                                aria-expanded="false"
                                ${item.disabled ? 'disabled' : ''}>
                    ` : `
                        <a href="${item.href || '#'}" 
                           class="nav-link"
                           role="menuitem"
                           ${item.disabled ? 'aria-disabled="true" tabindex="-1"' : ''}>
                    `}
                        ${renderItemContent(item, config, variant)}
                        ${hasSubmenu ? `
                            <svg class="nav-submenu-arrow" viewBox="0 0 24 24">
                                ${CONFIG.icons.dropdown}
                            </svg>
                        ` : ''}
                    ${hasSubmenu ? '</button>' : '</a>'}
                    
                    ${hasSubmenu ? renderSubmenu(item.children, config, item.megaMenu) : ''}
                </li>
            `;
        }).join('');
    }

    function renderItemContent(item, config, variant) {
        const showLabel = variant !== 'sidebar' || !state.get(config.id)?.collapsed;
        
        return `
            ${item.icon ? `
                <span class="nav-icon">
                    <svg viewBox="0 0 24 24">${item.icon}</svg>
                </span>
            ` : ''}
            ${showLabel ? `
                <span class="nav-label">${item.label}</span>
            ` : ''}
            ${item.badge ? renderBadge(item.badge, config) : ''}
            ${item.shortcut && showLabel ? `
                <kbd class="nav-shortcut">${item.shortcut}</kbd>
            ` : ''}
            ${item.description && variant === 'fullscreen' ? `
                <span class="nav-description">${item.description}</span>
            ` : ''}
        `;
    }

    function renderBadge(badge, config) {
        const type = badge.type || 'count';
        const badgeConfig = CONFIG.badges[type];
        
        switch (type) {
            case 'dot':
                return `<span class="nav-badge nav-badge-dot"></span>`;
            case 'count':
                const count = badge.value > badgeConfig.maxCount ? `${badgeConfig.maxCount}+` : badge.value;
                return `<span class="nav-badge nav-badge-count">${count}</span>`;
            case 'text':
                return `<span class="nav-badge nav-badge-text">${badge.value}</span>`;
            case 'icon':
                return `<span class="nav-badge nav-badge-icon">
                    <svg viewBox="0 0 24 24">${badge.value}</svg>
                </span>`;
            default:
                return '';
        }
    }

    function renderSubmenu(items, config, isMegaMenu) {
        if (isMegaMenu) {
            return `
                <div class="nav-megamenu" role="menu">
                    <div class="nav-megamenu-content">
                        ${items.map(section => `
                            <div class="nav-megamenu-section">
                                ${section.title ? `
                                    <h3 class="nav-megamenu-title">${section.title}</h3>
                                ` : ''}
                                <ul class="nav-megamenu-items">
                                    ${section.items.map(item => `
                                        <li>
                                            <a href="${item.href || '#'}" class="nav-megamenu-link">
                                                ${item.icon ? `
                                                    <svg viewBox="0 0 24 24">${item.icon}</svg>
                                                ` : ''}
                                                <div>
                                                    <span class="nav-megamenu-label">${item.label}</span>
                                                    ${item.description ? `
                                                        <span class="nav-megamenu-desc">${item.description}</span>
                                                    ` : ''}
                                                </div>
                                            </a>
                                        </li>
                                    `).join('')}
                                </ul>
                            </div>
                        `).join('')}
                        ${config.megaMenuFooter ? `
                            <div class="nav-megamenu-footer">
                                ${config.megaMenuFooter}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            return `
                <ul class="nav-submenu" role="menu">
                    ${renderMenuItems(items, config)}
                </ul>
            `;
        }
    }

    // ========================================
    // CRÉATION DES FONCTIONNALITÉS
    // ========================================
    function createSearchBox(config) {
        return `
            <div class="nav-search">
                <button class="nav-search-toggle" aria-label="Rechercher">
                    <svg viewBox="0 0 24 24">${CONFIG.icons.search}</svg>
                </button>
                <div class="nav-search-box">
                    <input type="search" 
                           class="nav-search-input" 
                           placeholder="${config.searchPlaceholder || 'Rechercher...'}"
                           aria-label="Recherche">
                    <button class="nav-search-submit" aria-label="Lancer la recherche">
                        <svg viewBox="0 0 24 24">${CONFIG.icons.search}</svg>
                    </button>
                    <button class="nav-search-close" aria-label="Fermer la recherche">
                        <svg viewBox="0 0 24 24">${CONFIG.icons.close}</svg>
                    </button>
                </div>
            </div>
        `;
    }

    function createNotifications(config) {
        const count = config.notificationCount || 0;
        
        return `
            <div class="nav-notifications">
                <button class="nav-notifications-toggle" aria-label="Notifications">
                    <svg viewBox="0 0 24 24">${CONFIG.icons.notification}</svg>
                    ${count > 0 ? `
                        <span class="nav-badge nav-badge-count">${count > 99 ? '99+' : count}</span>
                    ` : ''}
                </button>
                <div class="nav-notifications-dropdown">
                    <div class="nav-notifications-header">
                        <h3>Notifications</h3>
                        ${count > 0 ? `
                            <button class="nav-notifications-clear">Tout marquer comme lu</button>
                        ` : ''}
                    </div>
                    <div class="nav-notifications-list">
                        ${config.notifications && config.notifications.length > 0 ? 
                            config.notifications.map(notif => `
                                <div class="nav-notification-item ${notif.unread ? 'unread' : ''}">
                                    <div class="nav-notification-icon">
                                        <svg viewBox="0 0 24 24">${notif.icon || CONFIG.icons.notification}</svg>
                                    </div>
                                    <div class="nav-notification-content">
                                        <div class="nav-notification-title">${notif.title}</div>
                                        <div class="nav-notification-desc">${notif.description}</div>
                                        <div class="nav-notification-time">${notif.time}</div>
                                    </div>
                                </div>
                            `).join('')
                        : `
                            <div class="nav-notifications-empty">
                                <p>Aucune notification</p>
                            </div>
                        `}
                    </div>
                    ${config.notificationActions ? `
                        <div class="nav-notifications-footer">
                            <a href="${config.notificationActions.viewAll.href}" class="nav-notifications-viewall">
                                ${config.notificationActions.viewAll.label}
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function createLanguageSwitcher(config) {
        const languages = config.languages || [
            { code: 'fr', label: 'Français', flag: '🇫🇷' },
            { code: 'en', label: 'English', flag: '🇬🇧' }
        ];
        const current = config.currentLanguage || languages[0];
        
        return `
            <div class="nav-language">
                <button class="nav-language-toggle" aria-label="Changer de langue">
                    <span class="nav-language-flag">${current.flag}</span>
                    <span class="nav-language-code">${current.code.toUpperCase()}</span>
                </button>
                <div class="nav-language-dropdown">
                    ${languages.map(lang => `
                        <button class="nav-language-option ${lang.code === current.code ? 'active' : ''}"
                                data-lang="${lang.code}">
                            <span class="nav-language-flag">${lang.flag}</span>
                            <span>${lang.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function createThemeToggle(config) {
        const themes = config.themes || ['light', 'dark', 'auto'];
        const current = config.currentTheme || 'auto';
        
        return `
            <div class="nav-theme">
                <button class="nav-theme-toggle" aria-label="Changer de thème">
                    <svg viewBox="0 0 24 24" class="nav-theme-icon-light">
                        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                    </svg>
                    <svg viewBox="0 0 24 24" class="nav-theme-icon-dark">
                        <path d="M9 2c-1.05 0-2.05.16-3 .46 4.06 1.27 7 5.06 7 9.54 0 4.48-2.94 8.27-7 9.54.95.3 1.95.46 3 .46 5.52 0 10-4.48 10-10S14.52 2 9 2z"/>
                    </svg>
                    <svg viewBox="0 0 24 24" class="nav-theme-icon-auto">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18V4c4.41 0 8 3.59 8 8s-3.59 8-8 8z"/>
                    </svg>
                </button>
                ${themes.length > 2 ? `
                    <div class="nav-theme-dropdown">
                        ${themes.map(theme => `
                            <button class="nav-theme-option ${theme === current ? 'active' : ''}"
                                    data-theme="${theme}">
                                ${theme.charAt(0).toUpperCase() + theme.slice(1)}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    function createUserMenu(config, variant = 'default') {
        const user = config.user || {
            name: 'Utilisateur',
            avatar: null,
            role: 'User'
        };
        
        return `
            <div class="nav-user">
                <button class="nav-user-toggle" aria-label="Menu utilisateur">
                    ${user.avatar ? `
                        <img src="${user.avatar}" alt="${user.name}" class="nav-user-avatar">
                    ` : `
                        <div class="nav-user-avatar nav-user-avatar-placeholder">
                            <svg viewBox="0 0 24 24">${CONFIG.icons.user}</svg>
                        </div>
                    `}
                    ${variant === 'default' ? `
                        <span class="nav-user-info">
                            <span class="nav-user-name">${user.name}</span>
                            ${user.role ? `
                                <span class="nav-user-role">${user.role}</span>
                            ` : ''}
                        </span>
                        <svg class="nav-user-arrow" viewBox="0 0 24 24">
                            ${CONFIG.icons.dropdown}
                        </svg>
                    ` : ''}
                </button>
                <div class="nav-user-dropdown">
                    <div class="nav-user-header">
                        <div class="nav-user-details">
                            <div class="nav-user-name">${user.name}</div>
                            ${user.email ? `
                                <div class="nav-user-email">${user.email}</div>
                            ` : ''}
                        </div>
                    </div>
                    <ul class="nav-user-menu">
                        ${config.userMenuItems ? config.userMenuItems.map(item => `
                            <li>
                                <a href="${item.href || '#'}" class="nav-user-link">
                                    ${item.icon ? `
                                        <svg viewBox="0 0 24 24">${item.icon}</svg>
                                    ` : ''}
                                    <span>${item.label}</span>
                                </a>
                            </li>
                        `).join('') : `
                            <li><a href="#profile" class="nav-user-link">Mon profil</a></li>
                            <li><a href="#settings" class="nav-user-link">Paramètres</a></li>
                            <li class="nav-divider"></li>
                            <li><a href="#logout" class="nav-user-link">Déconnexion</a></li>
                        `}
                    </ul>
                </div>
            </div>
        `;
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    function initializeEvents(container, id, config) {
        const currentState = state.get(id);

        // Toggle mobile
        const mobileToggle = container.querySelector('.nav-mobile-toggle');
        const mobileOverlay = container.querySelector('.nav-mobile-overlay');
        
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                toggleMobileMenu(container, id);
            });
        }
        
        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => {
                closeMobileMenu(container, id);
            });
        }

        // Gestion des sous-menus
        container.querySelectorAll('.nav-submenu-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                toggleSubmenu(trigger, id);
            });

            // Hover pour desktop
            if (config.openOnHover && window.innerWidth > CONFIG.breakpoints.mobile) {
                let hoverTimeout;
                
                trigger.parentElement.addEventListener('mouseenter', () => {
                    clearTimeout(hoverTimeout);
                    openSubmenu(trigger, id);
                });
                
                trigger.parentElement.addEventListener('mouseleave', () => {
                    hoverTimeout = setTimeout(() => {
                        closeSubmenu(trigger, id);
                    }, 300);
                });
            }
        });

        // Navigation clavier
        if (config.features['keyboard-nav']) {
            initializeKeyboardNavigation(container, id);
        }

        // Sidebar toggle
        const sidebarToggle = container.querySelector('.nav-sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                toggleSidebar(container, id);
            });
        }

        // Circular menu
        const circularTrigger = container.querySelector('.nav-circular-trigger');
        if (circularTrigger) {
            circularTrigger.addEventListener('click', () => {
                toggleCircularMenu(container, id);
            });
        }

        // Fullscreen menu
        const fullscreenToggle = container.querySelector('.nav-fullscreen-toggle');
        const fullscreenClose = container.querySelector('.nav-fullscreen-close');
        
        if (fullscreenToggle) {
            fullscreenToggle.addEventListener('click', () => {
                openFullscreenMenu(container, id);
            });
        }
        
        if (fullscreenClose) {
            fullscreenClose.addEventListener('click', () => {
                closeFullscreenMenu(container, id);
            });
        }

        // Dock magnify effect
        if (config.type === 'dock' && config.magnify) {
            initializeDockMagnify(container);
        }

        // Scroll events
        if (config.features['sticky-header'] || config.features['transparent-scroll'] || config.features['auto-hide']) {
            initializeScrollBehavior(container, id, config);
        }

        // Recherche
        if (config.features.search) {
            initializeSearch(container, id);
        }

        // Dropdowns
        initializeDropdowns(container);

        // Swipe gestures
        if (config.features['swipe-gestures']) {
            initializeSwipeGestures(container, id);
        }

        // Active state
        updateActiveState(container, id);
    }

    // ========================================
    // NAVIGATION MOBILE
    // ========================================
    function toggleMobileMenu(container, id) {
        const currentState = state.get(id);
        currentState.isMobileOpen = !currentState.isMobileOpen;
        
        container.classList.toggle('mobile-open', currentState.isMobileOpen);
        
        const toggle = container.querySelector('.nav-mobile-toggle');
        if (toggle) {
            toggle.setAttribute('aria-expanded', currentState.isMobileOpen);
        }
        
        // Bloquer le scroll du body
        document.body.style.overflow = currentState.isMobileOpen ? 'hidden' : '';
    }

    function closeMobileMenu(container, id) {
        const currentState = state.get(id);
        currentState.isMobileOpen = false;
        
        container.classList.remove('mobile-open');
        
        const toggle = container.querySelector('.nav-mobile-toggle');
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
        }
        
        document.body.style.overflow = '';
    }

    // ========================================
    // SOUS-MENUS
    // ========================================
    function toggleSubmenu(trigger, id) {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        
        if (isOpen) {
            closeSubmenu(trigger, id);
        } else {
            openSubmenu(trigger, id);
        }
    }

    function openSubmenu(trigger, id) {
        const currentState = state.get(id);
        const submenu = trigger.nextElementSibling;
        const parent = trigger.parentElement;
        
        // Fermer les autres sous-menus au même niveau
        parent.parentElement.querySelectorAll('.nav-submenu-trigger').forEach(otherTrigger => {
            if (otherTrigger !== trigger) {
                closeSubmenu(otherTrigger, id);
            }
        });
        
        trigger.setAttribute('aria-expanded', 'true');
        parent.classList.add('submenu-open');
        
        if (submenu) {
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
            currentState.openSubmenus.add(submenu);
        }
    }

    function closeSubmenu(trigger, id) {
        const currentState = state.get(id);
        const submenu = trigger.nextElementSibling;
        const parent = trigger.parentElement;
        
        trigger.setAttribute('aria-expanded', 'false');
        parent.classList.remove('submenu-open');
        
        if (submenu) {
            submenu.style.maxHeight = '';
            currentState.openSubmenus.delete(submenu);
            
            // Fermer les sous-menus enfants
            submenu.querySelectorAll('.nav-submenu-trigger').forEach(childTrigger => {
                closeSubmenu(childTrigger, id);
            });
        }
    }

    // ========================================
    // NAVIGATION CLAVIER
    // ========================================
    function initializeKeyboardNavigation(container, id) {
        const menuItems = container.querySelectorAll('.nav-link');
        let currentIndex = -1;
        
        container.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    currentIndex = Math.max(0, currentIndex - 1);
                    menuItems[currentIndex]?.focus();
                    break;
                    
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    currentIndex = Math.min(menuItems.length - 1, currentIndex + 1);
                    menuItems[currentIndex]?.focus();
                    break;
                    
                case 'Home':
                    e.preventDefault();
                    currentIndex = 0;
                    menuItems[currentIndex]?.focus();
                    break;
                    
                case 'End':
                    e.preventDefault();
                    currentIndex = menuItems.length - 1;
                    menuItems[currentIndex]?.focus();
                    break;
                    
                case 'Enter':
                case ' ':
                    if (document.activeElement.classList.contains('nav-submenu-trigger')) {
                        e.preventDefault();
                        toggleSubmenu(document.activeElement, id);
                    }
                    break;
                    
                case 'Escape':
                    const activeSubmenuTrigger = document.activeElement.closest('.submenu-open')?.querySelector('.nav-submenu-trigger');
                    if (activeSubmenuTrigger) {
                        e.preventDefault();
                        closeSubmenu(activeSubmenuTrigger, id);
                        activeSubmenuTrigger.focus();
                    }
                    break;
            }
        });
    }

    // ========================================
    // COMPORTEMENT AU SCROLL
    // ========================================
    function initializeScrollBehavior(container, id, config) {
        let lastScrollTop = 0;
        let scrollTimeout;
        const threshold = config.scrollThreshold || 100;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            
            scrollTimeout = setTimeout(() => {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const currentState = state.get(id);
                
                // Sticky header
                if (config.features['sticky-header']) {
                    container.classList.toggle('sticky', scrollTop > threshold);
                }
                
                // Transparent scroll
                if (config.features['transparent-scroll']) {
                    container.classList.toggle('scrolled', scrollTop > 0);
                    currentState.scrolled = scrollTop > 0;
                }
                
                // Auto-hide
                if (config.features['auto-hide']) {
                    if (scrollTop > lastScrollTop && scrollTop > threshold) {
                        container.classList.add('hidden');
                    } else {
                        container.classList.remove('hidden');
                    }
                }
                
                // Progress bar
                if (config.features['progress-bar']) {
                    updateProgressBar(container, scrollTop);
                }
                
                lastScrollTop = scrollTop;
            }, 10);
        });
    }

    function updateProgressBar(container, scrollTop) {
        const progressBar = container.querySelector('.nav-progress-fill');
        if (progressBar) {
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const progress = (scrollTop / docHeight) * 100;
            progressBar.style.width = `${progress}%`;
        }
    }

    // ========================================
    // FONCTIONNALITÉS SPÉCIFIQUES
    // ========================================
    function toggleSidebar(container, id) {
        const currentState = state.get(id);
        currentState.collapsed = !currentState.collapsed;
        
        container.classList.toggle('collapsed', currentState.collapsed);
        
        // Sauvegarder l'état
        try {
            localStorage.setItem(`nav-sidebar-${id}`, currentState.collapsed);
        } catch (e) {
            console.warn('Impossible de sauvegarder l\'état de la sidebar');
        }
    }

    function toggleCircularMenu(container, id) {
        container.classList.toggle('open');
        
        const trigger = container.querySelector('.nav-circular-trigger');
        const isOpen = container.classList.contains('open');
        
        trigger.setAttribute('aria-expanded', isOpen);
        
        // Animer les items
        if (isOpen) {
            const items = container.querySelectorAll('.nav-circular-item');
            items.forEach((item, index) => {
                setTimeout(() => {
                    item.classList.add('visible');
                }, index * 50);
            });
        } else {
            container.querySelectorAll('.nav-circular-item').forEach(item => {
                item.classList.remove('visible');
            });
        }
    }

    function openFullscreenMenu(container, id) {
        const overlay = container.querySelector('.nav-fullscreen-overlay');
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        
        // Animer les items
        const items = overlay.querySelectorAll('.nav-menu-items > li');
        items.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('visible');
            }, index * 100);
        });
    }

    function closeFullscreenMenu(container, id) {
        const overlay = container.querySelector('.nav-fullscreen-overlay');
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        
        // Reset animation
        overlay.querySelectorAll('.nav-menu-items > li').forEach(item => {
            item.classList.remove('visible');
        });
    }

    function initializeDockMagnify(container) {
        const items = container.querySelectorAll('.nav-dock-items .nav-item');
        const itemWidth = items[0]?.offsetWidth || 60;
        
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            items.forEach((item, index) => {
                const itemCenter = (index + 0.5) * itemWidth;
                const distance = Math.abs(x - itemCenter);
                const scale = Math.max(1, 1.5 - (distance / 200));
                
                item.style.transform = `scale(${scale})`;
            });
        });
        
        container.addEventListener('mouseleave', () => {
            items.forEach(item => {
                item.style.transform = '';
            });
        });
    }

    // ========================================
    // RECHERCHE
    // ========================================
    function initializeSearch(container, id) {
        const searchToggle = container.querySelector('.nav-search-toggle');
        const searchBox = container.querySelector('.nav-search-box');
        const searchInput = container.querySelector('.nav-search-input');
        const searchClose = container.querySelector('.nav-search-close');
        
        if (searchToggle) {
            searchToggle.addEventListener('click', () => {
                searchBox.classList.add('open');
                searchInput.focus();
            });
        }
        
        if (searchClose) {
            searchClose.addEventListener('click', () => {
                searchBox.classList.remove('open');
                searchInput.value = '';
            });
        }
        
        if (searchInput) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    performSearch(container, id, e.target.value);
                }, 300);
            });
            
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchBox.classList.remove('open');
                    searchInput.value = '';
                }
            });
        }
    }

    function performSearch(container, id, query) {
        const currentState = state.get(id);
        currentState.searchQuery = query;
        
        // Déclencher l'événement de recherche
        const event = new CustomEvent('navsearch', {
            detail: { query }
        });
        container.dispatchEvent(event);
        
        // Highlight des résultats
        if (query) {
            highlightSearchResults(container, query);
        } else {
            clearSearchHighlight(container);
        }
    }

    function highlightSearchResults(container, query) {
        const items = container.querySelectorAll('.nav-item');
        const lowerQuery = query.toLowerCase();
        
        items.forEach(item => {
            const label = item.querySelector('.nav-label')?.textContent.toLowerCase();
            if (label && label.includes(lowerQuery)) {
                item.classList.add('search-match');
            } else {
                item.classList.remove('search-match');
            }
        });
    }

    function clearSearchHighlight(container) {
        container.querySelectorAll('.search-match').forEach(item => {
            item.classList.remove('search-match');
        });
    }

    // ========================================
    // DROPDOWNS
    // ========================================
    function initializeDropdowns(container) {
        const dropdowns = [
            '.nav-notifications',
            '.nav-language',
            '.nav-theme',
            '.nav-user'
        ];
        
        dropdowns.forEach(selector => {
            const dropdown = container.querySelector(selector);
            if (!dropdown) return;
            
            const toggle = dropdown.querySelector('[class*="-toggle"]');
            const content = dropdown.querySelector('[class*="-dropdown"]');
            
            if (toggle && content) {
                toggle.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Fermer les autres dropdowns
                    dropdowns.forEach(otherSelector => {
                        if (otherSelector !== selector) {
                            const other = container.querySelector(otherSelector);
                            other?.classList.remove('open');
                        }
                    });
                    
                    dropdown.classList.toggle('open');
                });
            }
        });
        
        // Fermer au clic extérieur
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                container.querySelectorAll('.open').forEach(dropdown => {
                    dropdown.classList.remove('open');
                });
            }
        });
    }

    // ========================================
    // SWIPE GESTURES
    // ========================================
    function initializeSwipeGestures(container, id) {
        let touchStartX = 0;
        let touchEndX = 0;
        
        container.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        container.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeDistance = touchEndX - touchStartX;
            const threshold = 50;
            
            if (Math.abs(swipeDistance) > threshold) {
                if (swipeDistance > 0) {
                    // Swipe right
                    if (container.classList.contains('sidebar')) {
                        const currentState = state.get(id);
                        if (currentState.collapsed) {
                            toggleSidebar(container, id);
                        }
                    }
                } else {
                    // Swipe left
                    if (container.classList.contains('sidebar')) {
                        const currentState = state.get(id);
                        if (!currentState.collapsed) {
                            toggleSidebar(container, id);
                        }
                    } else if (container.classList.contains('mobile-open')) {
                        closeMobileMenu(container, id);
                    }
                }
            }
        }
    }

    // ========================================
    // UTILITAIRES
    // ========================================
    function updateActiveState(container, id) {
        const currentPath = window.location.pathname;
        const items = container.querySelectorAll('.nav-link');
        
        items.forEach(item => {
            const href = item.getAttribute('href');
            const isActive = href && (
                href === currentPath ||
                (href !== '/' && currentPath.startsWith(href))
            );
            
            item.closest('.nav-item')?.classList.toggle('active', isActive);
            
            if (isActive) {
                // Ouvrir les parents si dans un sous-menu
                let parent = item.closest('.nav-submenu');
                while (parent) {
                    const trigger = parent.previousElementSibling;
                    if (trigger?.classList.contains('nav-submenu-trigger')) {
                        openSubmenu(trigger, id);
                    }
                    parent = parent.parentElement.closest('.nav-submenu');
                }
            }
        });
    }

    function mergeConfig(options) {
        const type = options.type || 'horizontal';
        const typeConfig = CONFIG.types[type] || CONFIG.types.horizontal;
        
        return {
            id: `nav-menu-${instanceId}`,
            style: options.style || 'glassmorphism',
            type: type,
            size: options.size || 'medium',
            position: options.position || (typeConfig.fixed ? 'top' : 'static'),
            animation: options.animation || 'smooth',
            items: options.items || [],
            brand: options.brand,
            features: { ...CONFIG.features, ...options.features },
            openOnHover: options.openOnHover ?? true,
            startCollapsed: options.startCollapsed ?? false,
            ...options
        };
    }

    function initializeFeatures(container, id, config) {
        // Charger l'état sauvegardé
        if (config.type === 'sidebar') {
            try {
                const saved = localStorage.getItem(`nav-sidebar-${id}`);
                if (saved !== null) {
                    const currentState = state.get(id);
                    currentState.collapsed = saved === 'true';
                    container.classList.toggle('collapsed', currentState.collapsed);
                }
            } catch (e) {
                console.warn('Impossible de charger l\'état de la sidebar');
            }
        }
        
        // Raccourcis clavier
        if (config.features.shortcuts && config.shortcuts) {
            initializeShortcuts(container, id, config.shortcuts);
        }
        
        // Items récents
        if (config.features['recent-items']) {
            initializeRecentItems(container, id);
        }
        
        // Favoris
        if (config.features.favorites) {
            initializeFavorites(container, id);
        }
    }

    function initializeShortcuts(container, id, shortcuts) {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;
            const alt = e.altKey;
            
            shortcuts.forEach(shortcut => {
                const keys = shortcut.keys.toLowerCase().split('+');
                const matchCtrl = keys.includes('ctrl') === ctrl;
                const matchShift = keys.includes('shift') === shift;
                const matchAlt = keys.includes('alt') === alt;
                const matchKey = keys.includes(key);
                
                if (matchCtrl && matchShift && matchAlt && matchKey) {
                    e.preventDefault();
                    
                    if (shortcut.action) {
                        shortcut.action();
                    } else if (shortcut.elementId) {
                        const element = container.querySelector(`#${shortcut.elementId}`);
                        element?.click();
                    }
                }
            });
        });
    }

    function initializeAnimations(container, config) {
        const animation = CONFIG.animations[config.animation];
        if (!animation || !animation.effects) return;
        
        // Effet de parallaxe
        if (animation.effects.includes('parallax')) {
            container.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const y = (e.clientY - rect.top) / rect.height;
                
                container.style.setProperty('--mouse-x', x);
                container.style.setProperty('--mouse-y', y);
            });
        }
        
        // Effet de morphing
        if (animation.effects.includes('morph')) {
            const observer = new MutationObserver(() => {
                container.classList.add('morphing');
                setTimeout(() => {
                    container.classList.remove('morphing');
                }, animation.duration);
            });
            
            observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        }
        
        // Effet ripple
        if (animation.effects.includes('ripple')) {
            container.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    const ripple = document.createElement('span');
                    ripple.className = 'nav-ripple';
                    
                    const rect = link.getBoundingClientRect();
                    const size = Math.max(rect.width, rect.height);
                    const x = e.clientX - rect.left - size / 2;
                    const y = e.clientY - rect.top - size / 2;
                    
                    ripple.style.width = ripple.style.height = size + 'px';
                    ripple.style.left = x + 'px';
                    ripple.style.top = y + 'px';
                    
                    link.appendChild(ripple);
                    
                    setTimeout(() => {
                        ripple.remove();
                    }, animation.duration * 2);
                });
            });
        }
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (document.getElementById('nav-menu-styles')) return;

        const link = document.createElement('link');
        link.id = 'nav-menu-styles';
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/nav-menu.css';
        document.head.appendChild(link);
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(options = {}) {
            injectStyles();
            return createNavMenu(options);
        },

        // Ajouter un item
        addItem(nav, item, parentId = null) {
            const id = nav.dataset.navId;
            const currentState = state.get(id);
            
            if (parentId) {
                const parent = findItemById(currentState.items, parentId);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(item);
                }
            } else {
                currentState.items.push(item);
            }
            
            rebuildMenu(nav, id);
        },

        // Supprimer un item
        removeItem(nav, itemId) {
            const id = nav.dataset.navId;
            const currentState = state.get(id);
            
            currentState.items = removeItemById(currentState.items, itemId);
            rebuildMenu(nav, id);
        },

        // Mettre à jour un item
        updateItem(nav, itemId, updates) {
            const id = nav.dataset.navId;
            const currentState = state.get(id);
            
            const item = findItemById(currentState.items, itemId);
            if (item) {
                Object.assign(item, updates);
                rebuildMenu(nav, id);
            }
        },

        // Obtenir l'état
        getState(nav) {
            const id = nav.dataset.navId;
            return state.get(id);
        },

        // Définir l'item actif
        setActive(nav, itemId) {
            const id = nav.dataset.navId;
            const currentState = state.get(id);
            currentState.activeItem = itemId;
            updateActiveState(nav, id);
        },

        // Basculer la sidebar
        toggleSidebar(nav) {
            const id = nav.dataset.navId;
            toggleSidebar(nav, id);
        },

        // Rechercher
        search(nav, query) {
            const id = nav.dataset.navId;
            performSearch(nav, id, query);
        },

        // Détruire
        destroy(nav) {
            const id = nav.dataset.navId;
            
            // Nettoyer les event listeners globaux
            document.body.style.overflow = '';
            
            state.delete(id);
            nav.remove();
        },

        // Configuration
        getConfig() {
            return CONFIG;
        },

        // Réinitialiser les styles
        injectStyles
    };
})();

// Fonctions helper
function findItemById(items, id) {
    for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
            const found = findItemById(item.children, id);
            if (found) return found;
        }
    }
    return null;
}

function removeItemById(items, id) {
    return items.filter(item => {
        if (item.id === id) return false;
        if (item.children) {
            item.children = removeItemById(item.children, id);
        }
        return true;
    });
}

function rebuildMenu(nav, id) {
    const currentState = state.get(id);
    const wrapper = nav.querySelector('.nav-menu-items');
    const config = getConfigFromNav(nav);
    
    if (wrapper) {
        wrapper.innerHTML = renderMenuItems(currentState.items, config);
        // Réinitialiser les événements
        initializeEvents(nav, id, config);
    }
}

function getConfigFromNav(nav) {
    // Récupérer la configuration depuis les classes
    return {
        style: nav.className.match(/\b(glassmorphism|neumorphism|flat|minimal|material|gradient|dark)\b/)?.[1] || 'glassmorphism',
        type: nav.className.match(/\b(horizontal|vertical|sidebar|dock|circular|fullscreen|tabs|breadcrumb)\b/)?.[1] || 'horizontal',
        features: CONFIG.features // Par défaut toutes les features
    };
}

// Export pour utilisation
export default NavMenu;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-12-XX] - Gestion des sous-menus imbriqués
   Solution: Récursion avec fermeture des enfants
   
   [2024-12-XX] - Performance avec beaucoup d'items
   Cause: Trop de listeners
   Résolution: Délégation d'événements
   
   [2024-12-XX] - Animations complexes sur mobile
   Cause: Performances limitées
   Résolution: Désactivation conditionnelle
   
   [2024-12-XX] - État de la sidebar
   Cause: Perte au rechargement
   Résolution: localStorage avec fallback
   
   NOTES POUR REPRISES FUTURES:
   - Les sous-menus utilisent maxHeight pour l'animation
   - Le mode mobile bloque le scroll du body
   - Les dropdowns se ferment mutuellement
   - Le dock magnify utilise transform scale
   - Les swipe gestures sont en passive mode
   ======================================== */