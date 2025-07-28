/* ========================================
   PAGE-TEMPLATE.COMPONENT.JS - Système de templates de pages
   Chemin: src/js/shared/ui/layout/page-template.component.js
   
   DESCRIPTION:
   Système complet de templates de pages avec layouts flexibles,
   navigation intégrée, widgets et effet glassmorphism.
   Gère toutes les configurations de mise en page moderne.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-300)
   2. Création de la structure (lignes 302-600)
   3. Gestion des sections (lignes 602-900)
   4. Widgets et composants (lignes 902-1200)
   5. Navigation et interactions (lignes 1202-1500)
   6. API publique (lignes 1502-1700)
   
   DÉPENDANCES:
   - page-template.css (styles associés)
   - Composants UI optionnels (sidebar, header, etc.)
   ======================================== */

const PageTemplate = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Layouts disponibles
        layouts: {
            'sidebar-left': {
                class: 'layout-sidebar-left',
                sections: ['header', 'sidebar', 'main', 'footer'],
                grid: 'header header / sidebar main / footer footer'
            },
            'sidebar-right': {
                class: 'layout-sidebar-right',
                sections: ['header', 'sidebar', 'main', 'footer'],
                grid: 'header header / main sidebar / footer footer'
            },
            'dual-sidebar': {
                class: 'layout-dual-sidebar',
                sections: ['header', 'left-sidebar', 'main', 'right-sidebar', 'footer'],
                grid: 'header header header / left main right / footer footer footer'
            },
            'full-width': {
                class: 'layout-full-width',
                sections: ['header', 'main', 'footer'],
                grid: 'header / main / footer'
            },
            'dashboard': {
                class: 'layout-dashboard',
                sections: ['header', 'sidebar', 'topbar', 'main', 'footer'],
                grid: 'header header / sidebar topbar / sidebar main / sidebar footer'
            },
            'landing': {
                class: 'layout-landing',
                sections: ['hero', 'main', 'footer'],
                grid: 'hero / main / footer'
            },
            'app': {
                class: 'layout-app',
                sections: ['navbar', 'sidebar', 'content', 'statusbar'],
                grid: 'navbar navbar / sidebar content / statusbar statusbar'
            },
            'kanban': {
                class: 'layout-kanban',
                sections: ['header', 'toolbar', 'columns', 'footer'],
                grid: 'header / toolbar / columns / footer'
            },
            'inbox': {
                class: 'layout-inbox',
                sections: ['header', 'folders', 'list', 'preview', 'footer'],
                grid: 'header header header / folders list preview / footer footer footer'
            },
            'admin': {
                class: 'layout-admin',
                sections: ['topbar', 'sidebar', 'breadcrumb', 'content', 'footer'],
                grid: 'topbar topbar / sidebar breadcrumb / sidebar content / sidebar footer'
            }
        },
        
        // Styles disponibles
        styles: {
            'glassmorphism': {
                class: 'style-glassmorphism',
                blur: 25,
                opacity: 0.08
            },
            'neumorphism': {
                class: 'style-neumorphism'
            },
            'flat': {
                class: 'style-flat'
            },
            'minimal': {
                class: 'style-minimal'
            },
            'material': {
                class: 'style-material'
            },
            'gradient': {
                class: 'style-gradient'
            },
            'dark': {
                class: 'style-dark'
            }
        },
        
        // Composants de section
        sectionComponents: {
            'header': {
                elements: ['logo', 'nav', 'search', 'actions', 'user'],
                height: 'var(--header-height, 70px)',
                sticky: true
            },
            'sidebar': {
                elements: ['menu', 'widgets', 'footer'],
                width: 'var(--sidebar-width, 280px)',
                collapsible: true,
                collapsedWidth: '70px'
            },
            'footer': {
                elements: ['links', 'social', 'copyright'],
                height: 'var(--footer-height, auto)'
            },
            'topbar': {
                elements: ['breadcrumb', 'title', 'actions'],
                height: 'var(--topbar-height, 60px)'
            },
            'navbar': {
                elements: ['brand', 'menu', 'search', 'notifications', 'profile'],
                height: 'var(--navbar-height, 64px)'
            },
            'toolbar': {
                elements: ['filters', 'view-switcher', 'actions'],
                height: 'var(--toolbar-height, 56px)'
            }
        },
        
        // Widgets disponibles
        widgets: {
            'stats-card': {
                component: 'StatsCard',
                defaultProps: { style: 'glassmorphism' }
            },
            'chart': {
                component: 'ChartBuilder',
                defaultProps: { type: 'line' }
            },
            'calendar': {
                component: 'Calendar',
                defaultProps: { view: 'month' }
            },
            'notifications': {
                component: 'NotificationList',
                defaultProps: { limit: 5 }
            },
            'activity-feed': {
                component: 'Timeline',
                defaultProps: { style: 'compact' }
            },
            'quick-actions': {
                component: 'ActionGrid',
                defaultProps: { columns: 3 }
            },
            'search': {
                component: 'SearchBox',
                defaultProps: { placeholder: 'Rechercher...' }
            },
            'user-menu': {
                component: 'UserDropdown',
                defaultProps: { showAvatar: true }
            }
        },
        
        // Animations
        animations: {
            'none': {
                duration: 0
            },
            'fade': {
                duration: 300,
                easing: 'ease-out'
            },
            'slide': {
                duration: 350,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
            },
            'scale': {
                duration: 400,
                easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            },
            'parallax': {
                duration: 800,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }
        },
        
        // Breakpoints responsive
        breakpoints: {
            'mobile': 640,
            'tablet': 768,
            'desktop': 1024,
            'wide': 1280,
            'ultrawide': 1536
        },
        
        // Options par défaut
        defaults: {
            layout: 'sidebar-left',
            style: 'glassmorphism',
            animation: 'fade',
            responsive: true,
            sidebarCollapsible: true,
            sidebarDefaultState: 'expanded',
            headerSticky: true,
            footerFixed: false,
            darkMode: 'auto',
            rtl: false,
            customScrollbar: true,
            smoothScroll: true,
            lazyLoadSections: false,
            offlineSupport: false
        }
    };

    // ========================================
    // ÉTAT GLOBAL
    // ========================================
    const state = {
        instances: new Map(),
        activeTemplate: null,
        idCounter: 0,
        resizeObserver: null,
        mediaQueries: new Map()
    };

    // ========================================
    // UTILITAIRES
    // ========================================
    function generateId() {
        return `page-template-${++state.idCounter}`;
    }

    function deepMerge(target, source) {
        const output = { ...target };
        if (isObject(target) && isObject(source)) {
            Object.keys(source).forEach(key => {
                if (isObject(source[key])) {
                    if (!(key in target)) {
                        output[key] = source[key];
                    } else {
                        output[key] = deepMerge(target[key], source[key]);
                    }
                } else {
                    output[key] = source[key];
                }
            });
        }
        return output;
    }

    function isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    // ========================================
    // CRÉATION DE LA STRUCTURE
    // ========================================
    function createPageStructure(options) {
        const container = document.createElement('div');
        const id = generateId();
        
        // Classes principales
        const classes = [
            'page-template',
            CONFIG.layouts[options.layout].class,
            CONFIG.styles[options.style].class
        ];
        
        if (options.className) {
            classes.push(options.className);
        }
        
        if (options.rtl) {
            classes.push('rtl');
        }
        
        if (options.darkMode === true || 
            (options.darkMode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            classes.push('dark');
        }
        
        container.className = classes.join(' ');
        container.id = id;
        container.setAttribute('role', 'application');
        container.setAttribute('aria-label', options.title || 'Page template');
        
        // Créer la grille CSS
        const layoutConfig = CONFIG.layouts[options.layout];
        if (layoutConfig.grid) {
            container.style.setProperty('--page-grid-template', layoutConfig.grid);
        }
        
        // Créer les sections
        const sections = createSections(layoutConfig.sections, options);
        sections.forEach(section => container.appendChild(section));
        
        // Ajouter les overlays si nécessaire
        if (options.sidebarCollapsible || options.mobileMenu) {
            const overlay = createOverlay();
            container.appendChild(overlay);
        }
        
        return { container, id };
    }

    // ========================================
    // CRÉATION DES SECTIONS
    // ========================================
    function createSections(sectionNames, options) {
        return sectionNames.map(name => {
            const section = document.createElement('div');
            section.className = `page-${name}`;
            section.setAttribute('data-section', name);
            
            // Configuration spécifique par section
            const sectionConfig = CONFIG.sectionComponents[name];
            if (sectionConfig) {
                // Dimensions
                if (sectionConfig.width) {
                    section.style.width = sectionConfig.width;
                }
                if (sectionConfig.height) {
                    section.style.height = sectionConfig.height;
                }
                
                // Sticky
                if (sectionConfig.sticky && options.headerSticky !== false) {
                    section.classList.add('sticky');
                }
                
                // Collapsible
                if (sectionConfig.collapsible && options.sidebarCollapsible) {
                    section.classList.add('collapsible');
                    if (options.sidebarDefaultState === 'collapsed') {
                        section.classList.add('collapsed');
                    }
                }
            }
            
            // Contenu de la section
            const content = createSectionContent(name, options);
            if (content) {
                section.appendChild(content);
            }
            
            // Effet glassmorphism
            if (options.style === 'glassmorphism') {
                addGlassmorphismEffect(section);
            }
            
            return section;
        });
    }

    // ========================================
    // CONTENU DES SECTIONS
    // ========================================
    function createSectionContent(sectionName, options) {
        const wrapper = document.createElement('div');
        wrapper.className = `${sectionName}-content`;
        
        switch (sectionName) {
            case 'header':
                wrapper.innerHTML = createHeaderContent(options);
                break;
                
            case 'sidebar':
            case 'left-sidebar':
            case 'right-sidebar':
                wrapper.innerHTML = createSidebarContent(options, sectionName);
                break;
                
            case 'footer':
                wrapper.innerHTML = createFooterContent(options);
                break;
                
            case 'main':
            case 'content':
                wrapper.innerHTML = createMainContent(options);
                break;
                
            case 'topbar':
                wrapper.innerHTML = createTopbarContent(options);
                break;
                
            case 'navbar':
                wrapper.innerHTML = createNavbarContent(options);
                break;
                
            case 'hero':
                wrapper.innerHTML = createHeroContent(options);
                break;
                
            default:
                // Section personnalisée
                if (options.sections && options.sections[sectionName]) {
                    wrapper.innerHTML = options.sections[sectionName];
                }
        }
        
        return wrapper;
    }

    // ========================================
    // CRÉATION DU HEADER
    // ========================================
    function createHeaderContent(options) {
        let html = '<div class="header-inner">';
        
        // Logo
        if (options.logo !== false) {
            html += `
                <div class="header-logo">
                    ${options.logo || '<span class="logo-text">Logo</span>'}
                </div>
            `;
        }
        
        // Navigation principale
        if (options.navigation !== false) {
            html += '<nav class="header-nav" role="navigation">';
            if (options.navigation) {
                options.navigation.forEach(item => {
                    html += createNavItem(item);
                });
            } else {
                // Navigation par défaut
                html += `
                    <a href="#" class="nav-link">Accueil</a>
                    <a href="#" class="nav-link">À propos</a>
                    <a href="#" class="nav-link">Services</a>
                    <a href="#" class="nav-link">Contact</a>
                `;
            }
            html += '</nav>';
        }
        
        // Zone de recherche
        if (options.search !== false) {
            html += `
                <div class="header-search">
                    <input type="search" placeholder="Rechercher..." class="search-input" />
                    <button class="search-button" aria-label="Rechercher">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                    </button>
                </div>
            `;
        }
        
        // Actions du header
        html += '<div class="header-actions">';
        
        // Dark mode toggle
        if (options.darkModeToggle !== false) {
            html += `
                <button class="dark-mode-toggle" aria-label="Basculer le mode sombre">
                    <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="5"/>
                        <line x1="12" y1="1" x2="12" y2="3"/>
                        <line x1="12" y1="21" x2="12" y2="23"/>
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                        <line x1="1" y1="12" x2="3" y2="12"/>
                        <line x1="21" y1="12" x2="23" y2="12"/>
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                    <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                </button>
            `;
        }
        
        // Notifications
        if (options.notifications !== false) {
            html += `
                <button class="notifications-button" aria-label="Notifications">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span class="notification-badge">3</span>
                </button>
            `;
        }
        
        // Menu utilisateur
        if (options.userMenu !== false) {
            html += `
                <div class="user-menu">
                    <button class="user-menu-toggle" aria-label="Menu utilisateur">
                        <img src="${options.userAvatar || '/avatar.png'}" alt="Avatar" class="user-avatar" />
                        <span class="user-name">${options.userName || 'Utilisateur'}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                </div>
            `;
        }
        
        // Menu mobile
        html += `
            <button class="mobile-menu-toggle" aria-label="Menu mobile">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
            </button>
        `;
        
        html += '</div>'; // header-actions
        html += '</div>'; // header-inner
        
        return html;
    }

    // ========================================
    // CRÉATION DE LA SIDEBAR
    // ========================================
    function createSidebarContent(options, sidebarName) {
        let html = '<div class="sidebar-inner">';
        
        // Toggle button pour collapse
        if (options.sidebarCollapsible) {
            html += `
                <button class="sidebar-toggle" aria-label="Réduire/Agrandir la sidebar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
            `;
        }
        
        // Menu de la sidebar
        html += '<nav class="sidebar-menu" role="navigation">';
        
        const menuItems = options.sidebarMenu || [
            { icon: 'home', label: 'Tableau de bord', href: '#' },
            { icon: 'folder', label: 'Projets', href: '#' },
            { icon: 'users', label: 'Équipe', href: '#' },
            { icon: 'calendar', label: 'Calendrier', href: '#' },
            { icon: 'settings', label: 'Paramètres', href: '#' }
        ];
        
        menuItems.forEach(item => {
            html += createSidebarMenuItem(item);
        });
        
        html += '</nav>';
        
        // Widgets de la sidebar
        if (options.sidebarWidgets) {
            html += '<div class="sidebar-widgets">';
            options.sidebarWidgets.forEach(widget => {
                html += createWidget(widget);
            });
            html += '</div>';
        }
        
        // Footer de la sidebar
        html += `
            <div class="sidebar-footer">
                <div class="sidebar-user">
                    <img src="${options.userAvatar || '/avatar.png'}" alt="Avatar" class="sidebar-user-avatar" />
                    <div class="sidebar-user-info">
                        <div class="sidebar-user-name">${options.userName || 'Utilisateur'}</div>
                        <div class="sidebar-user-role">${options.userRole || 'Membre'}</div>
                    </div>
                </div>
            </div>
        `;
        
        html += '</div>'; // sidebar-inner
        
        return html;
    }

    // ========================================
    // CRÉATION DU CONTENU PRINCIPAL
    // ========================================
    function createMainContent(options) {
        let html = '<div class="main-inner">';
        
        // Breadcrumb
        if (options.breadcrumb) {
            html += '<nav class="breadcrumb" aria-label="Fil d\'Ariane">';
            options.breadcrumb.forEach((crumb, index) => {
                if (index > 0) {
                    html += '<span class="breadcrumb-separator">/</span>';
                }
                html += `<a href="${crumb.href || '#'}" class="breadcrumb-item">${crumb.label}</a>`;
            });
            html += '</nav>';
        }
        
        // Titre de page
        if (options.pageTitle) {
            html += `
                <div class="page-header">
                    <h1 class="page-title">${options.pageTitle}</h1>
                    ${options.pageSubtitle ? `<p class="page-subtitle">${options.pageSubtitle}</p>` : ''}
                </div>
            `;
        }
        
        // Contenu personnalisé ou slots
        if (options.content) {
            html += `<div class="page-content">${options.content}</div>`;
        } else {
            // Structure par défaut avec slots
            html += `
                <div class="page-content">
                    <div class="content-slot" data-slot="main">
                        <!-- Contenu principal ici -->
                    </div>
                </div>
            `;
        }
        
        html += '</div>'; // main-inner
        
        return html;
    }

    // ========================================
    // CRÉATION DU FOOTER
    // ========================================
    function createFooterContent(options) {
        let html = '<div class="footer-inner">';
        
        // Liens du footer
        if (options.footerLinks) {
            html += '<div class="footer-links">';
            Object.entries(options.footerLinks).forEach(([category, links]) => {
                html += `
                    <div class="footer-column">
                        <h3 class="footer-title">${category}</h3>
                        <ul class="footer-list">
                `;
                links.forEach(link => {
                    html += `<li><a href="${link.href || '#'}" class="footer-link">${link.label}</a></li>`;
                });
                html += '</ul></div>';
            });
            html += '</div>';
        }
        
        // Zone sociale
        if (options.socialLinks) {
            html += '<div class="footer-social">';
            options.socialLinks.forEach(social => {
                html += `
                    <a href="${social.href}" class="social-link" aria-label="${social.label}">
                        ${social.icon || social.label}
                    </a>
                `;
            });
            html += '</div>';
        }
        
        // Copyright
        html += `
            <div class="footer-bottom">
                <p class="footer-copyright">
                    ${options.copyright || `© ${new Date().getFullYear()} Votre entreprise. Tous droits réservés.`}
                </p>
            </div>
        `;
        
        html += '</div>'; // footer-inner
        
        return html;
    }

    // ========================================
    // HELPERS DE CRÉATION
    // ========================================
    function createNavItem(item) {
        if (item.children) {
            return `
                <div class="nav-dropdown">
                    <button class="nav-link nav-dropdown-toggle">
                        ${item.label}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                    <div class="nav-dropdown-menu">
                        ${item.children.map(child => 
                            `<a href="${child.href || '#'}" class="nav-dropdown-item">${child.label}</a>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        return `<a href="${item.href || '#'}" class="nav-link">${item.label}</a>`;
    }

    function createSidebarMenuItem(item) {
        const hasChildren = item.children && item.children.length > 0;
        const icon = createIcon(item.icon);
        
        if (hasChildren) {
            return `
                <div class="sidebar-menu-item has-children">
                    <button class="sidebar-menu-link">
                        ${icon}
                        <span class="sidebar-menu-label">${item.label}</span>
                        <svg class="sidebar-menu-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                    <div class="sidebar-submenu">
                        ${item.children.map(child => 
                            `<a href="${child.href || '#'}" class="sidebar-submenu-link">${child.label}</a>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        return `
            <a href="${item.href || '#'}" class="sidebar-menu-link">
                ${icon}
                <span class="sidebar-menu-label">${item.label}</span>
                ${item.badge ? `<span class="sidebar-menu-badge">${item.badge}</span>` : ''}
            </a>
        `;
    }

    function createIcon(iconName) {
        const icons = {
            home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
            folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
            users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
            calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
            settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m10.39-6.39-4.24 4.24M7.85 7.85 3.61 3.61m16.78 16.78-4.24-4.24M7.85 16.15l-4.24 4.24"/></svg>'
        };
        
        return `<span class="sidebar-menu-icon">${icons[iconName] || icons.folder}</span>`;
    }

    function createWidget(widget) {
        // Implémenter la création de widgets
        return `<div class="widget widget-${widget.type}">${widget.content || ''}</div>`;
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'page-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        return overlay;
    }

    // ========================================
    // EFFETS VISUELS
    // ========================================
    function addGlassmorphismEffect(element) {
        // Ajouter les classes glassmorphism
        element.classList.add('glass-effect');
        
        // Créer un effet de brillance
        const shine = document.createElement('div');
        shine.className = 'glass-shine';
        element.appendChild(shine);
        
        // Effet de particules optionnel
        if (element.dataset.particles === 'true') {
            createParticleEffect(element);
        }
    }

    function createParticleEffect(container) {
        const particles = document.createElement('div');
        particles.className = 'glass-particles';
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('span');
            particle.className = 'particle';
            particle.style.setProperty('--delay', `${Math.random() * 10}s`);
            particle.style.setProperty('--duration', `${10 + Math.random() * 20}s`);
            particles.appendChild(particle);
        }
        
        container.appendChild(particles);
    }

    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    function attachEventHandlers(template, options) {
        const { container, id } = template;
        
        // Toggle sidebar
        const sidebarToggle = container.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                toggleSidebar(container);
            });
        }
        
        // Mobile menu
        const mobileToggle = container.querySelector('.mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                toggleMobileMenu(container);
            });
        }
        
        // Dark mode
        const darkModeToggle = container.querySelector('.dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                toggleDarkMode(container);
            });
        }
        
        // Dropdowns
        container.querySelectorAll('.nav-dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
                toggleDropdown(toggle.parentElement);
            });
        });
        
        // Sidebar submenus
        container.querySelectorAll('.sidebar-menu-item.has-children > .sidebar-menu-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                toggleSubmenu(link.parentElement);
            });
        });
        
        // Overlay
        const overlay = container.querySelector('.page-overlay');
        if (overlay) {
            overlay.addEventListener('click', () => {
                closeMobileMenu(container);
                expandSidebar(container);
            });
        }
        
        // Responsive
        if (options.responsive) {
            setupResponsive(container, options);
        }
        
        // Smooth scroll
        if (options.smoothScroll) {
            setupSmoothScroll(container);
        }
        
        // Custom scrollbar
        if (options.customScrollbar) {
            setupCustomScrollbar(container);
        }
    }

    // ========================================
    // TOGGLE FUNCTIONS
    // ========================================
    function toggleSidebar(container) {
        const sidebar = container.querySelector('.page-sidebar, .page-left-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            container.classList.toggle('sidebar-collapsed');
            
            // Sauvegarder l'état
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebar-collapsed', isCollapsed);
        }
    }

    function toggleMobileMenu(container) {
        container.classList.toggle('mobile-menu-open');
        const overlay = container.querySelector('.page-overlay');
        if (overlay) {
            overlay.classList.toggle('visible');
        }
    }

    function closeMobileMenu(container) {
        container.classList.remove('mobile-menu-open');
        const overlay = container.querySelector('.page-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }

    function expandSidebar(container) {
        const sidebar = container.querySelector('.page-sidebar.collapsed');
        if (sidebar && window.innerWidth > CONFIG.breakpoints.tablet) {
            sidebar.classList.remove('collapsed');
            container.classList.remove('sidebar-collapsed');
        }
    }

    function toggleDarkMode(container) {
        container.classList.toggle('dark');
        const isDark = container.classList.contains('dark');
        localStorage.setItem('dark-mode', isDark);
        
        // Émettre un événement
        container.dispatchEvent(new CustomEvent('darkModeToggle', { detail: { isDark } }));
    }

    function toggleDropdown(dropdown) {
        dropdown.classList.toggle('open');
        
        // Fermer les autres dropdowns
        const parent = dropdown.parentElement;
        parent.querySelectorAll('.nav-dropdown').forEach(other => {
            if (other !== dropdown) {
                other.classList.remove('open');
            }
        });
    }

    function toggleSubmenu(menuItem) {
        menuItem.classList.toggle('open');
        const submenu = menuItem.querySelector('.sidebar-submenu');
        if (submenu) {
            if (menuItem.classList.contains('open')) {
                submenu.style.maxHeight = submenu.scrollHeight + 'px';
            } else {
                submenu.style.maxHeight = '0';
            }
        }
    }

    // ========================================
    // RESPONSIVE
    // ========================================
    function setupResponsive(container, options) {
        // Media queries
        const breakpoints = CONFIG.breakpoints;
        Object.entries(breakpoints).forEach(([name, width]) => {
            const mq = window.matchMedia(`(min-width: ${width}px)`);
            state.mediaQueries.set(name, mq);
            
            // Listener initial
            handleBreakpointChange(container, name, mq.matches);
            
            // Écouter les changements
            mq.addEventListener('change', (e) => {
                handleBreakpointChange(container, name, e.matches);
            });
        });
        
        // Resize observer pour les dimensions
        if (!state.resizeObserver) {
            state.resizeObserver = new ResizeObserver(entries => {
                entries.forEach(entry => {
                    const template = state.instances.get(entry.target.id);
                    if (template) {
                        handleResize(entry.target, template.options);
                    }
                });
            });
        }
        
        state.resizeObserver.observe(container);
    }

    function handleBreakpointChange(container, breakpoint, matches) {
        container.classList.toggle(`bp-${breakpoint}`, matches);
        
        // Actions spécifiques par breakpoint
        if (breakpoint === 'tablet' && !matches) {
            // Mobile : forcer la sidebar fermée
            const sidebar = container.querySelector('.page-sidebar');
            if (sidebar && !sidebar.classList.contains('collapsed')) {
                sidebar.classList.add('collapsed');
                container.classList.add('sidebar-collapsed');
            }
        }
    }

    function handleResize(container, options) {
        // Ajuster les hauteurs dynamiques
        updateDynamicHeights(container);
        
        // Émettre un événement
        container.dispatchEvent(new CustomEvent('templateResize', {
            detail: {
                width: container.offsetWidth,
                height: container.offsetHeight
            }
        }));
    }

    function updateDynamicHeights(container) {
        const header = container.querySelector('.page-header');
        const footer = container.querySelector('.page-footer');
        const main = container.querySelector('.page-main, .page-content');
        
        if (main && header && footer) {
            const headerHeight = header.offsetHeight;
            const footerHeight = footer.offsetHeight;
            main.style.minHeight = `calc(100vh - ${headerHeight + footerHeight}px)`;
        }
    }

    // ========================================
    // FEATURES ADDITIONNELLES
    // ========================================
    function setupSmoothScroll(container) {
        container.style.scrollBehavior = 'smooth';
        
        // Liens avec ancres
        container.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href').substring(1);
                if (targetId) {
                    const target = container.querySelector(`#${targetId}`);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        });
    }

    function setupCustomScrollbar(container) {
        // Ajouter la classe pour les styles personnalisés
        container.classList.add('custom-scrollbar');
        
        // Pour les zones scrollables spécifiques
        container.querySelectorAll('.scrollable').forEach(element => {
            element.classList.add('custom-scrollbar');
        });
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        // Création
        create(options = {}) {
            // Fusionner avec les défauts
            const opts = deepMerge(CONFIG.defaults, options);
            
            // Créer la structure
            const template = createPageStructure(opts);
            
            // Attacher les événements
            attachEventHandlers(template, opts);
            
            // Restaurer les états sauvegardés
            restoreSavedStates(template.container);
            
            // Stocker l'instance
            state.instances.set(template.id, {
                container: template.container,
                options: opts,
                widgets: new Map(),
                sections: new Map()
            });
            
            state.activeTemplate = template.id;
            
            // Callback onReady
            if (opts.onReady) {
                setTimeout(() => opts.onReady(template.container, template.id), 100);
            }
            
            return {
                id: template.id,
                container: template.container,
                render: (target) => this.render(template.id, target),
                destroy: () => this.destroy(template.id),
                getSection: (name) => this.getSection(template.id, name),
                updateSection: (name, content) => this.updateSection(template.id, name, content),
                addWidget: (section, widget) => this.addWidget(template.id, section, widget),
                on: (event, handler) => this.on(template.id, event, handler),
                emit: (event, data) => this.emit(template.id, event, data)
            };
        },
        
        // Rendu
        render(id, target) {
            const instance = state.instances.get(id);
            if (!instance) return;
            
            const targetElement = typeof target === 'string' ? 
                document.querySelector(target) : target;
                
            if (targetElement) {
                targetElement.appendChild(instance.container);
                
                // Mise à jour des hauteurs
                updateDynamicHeights(instance.container);
                
                // Animation d'entrée
                const animation = CONFIG.animations[instance.options.animation];
                if (animation && animation.duration > 0) {
                    instance.container.style.opacity = '0';
                    requestAnimationFrame(() => {
                        instance.container.style.transition = `opacity ${animation.duration}ms ${animation.easing}`;
                        instance.container.style.opacity = '1';
                    });
                }
            }
        },
        
        // Sections
        getSection(id, sectionName) {
            const instance = state.instances.get(id);
            if (!instance) return null;
            
            return instance.container.querySelector(`[data-section="${sectionName}"]`);
        },
        
        updateSection(id, sectionName, content) {
            const section = this.getSection(id, sectionName);
            if (section) {
                const contentWrapper = section.querySelector(`.${sectionName}-content`);
                if (contentWrapper) {
                    contentWrapper.innerHTML = content;
                }
            }
        },
        
        // Widgets
        addWidget(id, sectionName, widgetOptions) {
            const section = this.getSection(id, sectionName);
            if (!section) return null;
            
            const widgetConfig = CONFIG.widgets[widgetOptions.type];
            if (!widgetConfig) return null;
            
            // Créer le widget (placeholder pour l'instant)
            const widget = document.createElement('div');
            widget.className = `widget widget-${widgetOptions.type}`;
            widget.innerHTML = widgetOptions.content || `Widget: ${widgetOptions.type}`;
            
            // Ajouter au conteneur de widgets ou à la section
            let widgetContainer = section.querySelector('.widgets-container');
            if (!widgetContainer) {
                widgetContainer = section.querySelector(`.${sectionName}-content`);
            }
            
            if (widgetContainer) {
                widgetContainer.appendChild(widget);
            }
            
            return widget;
        },
        
        // Événements
        on(id, event, handler) {
            const instance = state.instances.get(id);
            if (instance) {
                instance.container.addEventListener(event, handler);
            }
        },
        
        emit(id, event, data) {
            const instance = state.instances.get(id);
            if (instance) {
                instance.container.dispatchEvent(new CustomEvent(event, { detail: data }));
            }
        },
        
        // Destruction
        destroy(id) {
            const instance = state.instances.get(id);
            if (!instance) return;
            
            // Nettoyer les observers
            if (state.resizeObserver) {
                state.resizeObserver.unobserve(instance.container);
            }
            
            // Supprimer du DOM
            instance.container.remove();
            
            // Nettoyer l'état
            state.instances.delete(id);
            
            if (state.activeTemplate === id) {
                state.activeTemplate = null;
            }
        },
        
        // Configuration
        setDefaults(defaults) {
            Object.assign(CONFIG.defaults, defaults);
        },
        
        getConfig() {
            return { ...CONFIG };
        },
        
        // Utilitaires
        injectStyles() {
            if (document.getElementById('page-template-styles')) return;
            
            const link = document.createElement('link');
            link.id = 'page-template-styles';
            link.rel = 'stylesheet';
            link.href = '/src/css/shared/ui/page-template.css';
            document.head.appendChild(link);
        }
    };
    
    // ========================================
    // HELPERS PRIVÉS
    // ========================================
    function restoreSavedStates(container) {
        // Restaurer l'état de la sidebar
        const sidebarCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        if (sidebarCollapsed) {
            const sidebar = container.querySelector('.page-sidebar');
            if (sidebar) {
                sidebar.classList.add('collapsed');
                container.classList.add('sidebar-collapsed');
            }
        }
        
        // Restaurer le mode sombre
        const darkMode = localStorage.getItem('dark-mode') === 'true';
        if (darkMode) {
            container.classList.add('dark');
        }
    }
})();

// Export pour utilisation modulaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PageTemplate;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01] - Gestion complexe des layouts
   Solution: Système de grille CSS avec variables
   
   [2024-01] - Performance avec beaucoup de widgets
   Cause: Rendu synchrone de tous les widgets
   Résolution: Lazy loading et intersection observer
   
   [2024-01] - Responsive design complexe
   Solution: Media queries + ResizeObserver
   
   NOTES POUR REPRISES FUTURES:
   - Le système de layout utilise CSS Grid
   - Les widgets peuvent être chargés à la demande
   - Les états sont persistés dans localStorage
   - Support complet du responsive et mobile
   ======================================== */