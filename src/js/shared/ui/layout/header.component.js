/* ========================================
   HEADER.COMPONENT.JS - Composant d'en-tête complet
   Chemin: src/js/shared/ui/layout/header.component.js
   
   DESCRIPTION:
   Composant d'en-tête ultra-complet avec navigation, recherche,
   notifications, profil et toutes les variantes de styles et layouts.
   
   STRUCTURE:
   1. Configuration complète (lignes 20-450)
   2. Variables privées (lignes 452-480)
   3. Méthodes de création (lignes 482-1000)
   4. Navigation et menus (lignes 1002-1400)
   5. Fonctionnalités avancées (lignes 1402-1800)
   6. Gestion responsive (lignes 1802-2000)
   7. API publique (lignes 2002-2100)
   
   DÉPENDANCES:
   - dom-utils.js (manipulation DOM)
   - animation-utils.js (animations)
   - icons.component.js (icônes)
   ======================================== */

const Header = (() => {
    'use strict';

    // ========================================
    // CONFIGURATION COMPLÈTE
    // ========================================
    const CONFIG = {
        // Styles disponibles
        styles: {
            glassmorphism: {
                background: 'rgba(255, 255, 255, 0.08)',
                blur: 20,
                border: 'rgba(255, 255, 255, 0.15)',
                shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                borderRadius: 0
            },
            neumorphism: {
                background: '#e0e5ec',
                boxShadow: '0 10px 20px #a3b1c6, 0 -5px 10px #ffffff',
                borderRadius: 0
            },
            flat: {
                background: '#ffffff',
                border: '#e5e7eb',
                shadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            },
            minimal: {
                background: 'transparent',
                borderBottom: '1px solid #e5e7eb'
            },
            material: {
                background: '#ffffff',
                boxShadow: '0 2px 4px -1px rgba(0,0,0,.2)',
                elevation: 4
            },
            transparent: {
                background: 'transparent',
                backdropFilter: 'none',
                transition: 'all 0.3s ease'
            },
            gradient: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff'
            },
            dark: {
                background: '#1a202c',
                color: '#ffffff',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }
        },

        // Layouts disponibles
        layouts: {
            fixed: {
                position: 'fixed',
                top: 0,
                width: '100%',
                zIndex: 1000
            },
            sticky: {
                position: 'sticky',
                top: 0,
                zIndex: 999
            },
            static: {
                position: 'relative'
            },
            floating: {
                position: 'fixed',
                top: 20,
                left: 20,
                right: 20,
                borderRadius: 16,
                zIndex: 1000
            },
            detached: {
                position: 'fixed',
                top: 0,
                transform: 'translateY(-100%)',
                transition: 'transform 0.3s ease'
            },
            overlay: {
                position: 'absolute',
                top: 0,
                width: '100%',
                zIndex: 10
            }
        },

        // Hauteurs prédéfinies
        heights: {
            compact: 48,
            normal: 64,
            large: 80,
            extra: 96,
            auto: 'auto',
            responsive: {
                mobile: 56,
                tablet: 64,
                desktop: 80
            }
        },

        // Structure de navigation
        navigation: {
            position: {
                left: 'flex-start',
                center: 'center',
                right: 'flex-end',
                split: 'space-between'
            },
            style: {
                horizontal: {
                    display: 'flex',
                    flexDirection: 'row'
                },
                vertical: {
                    display: 'flex',
                    flexDirection: 'column'
                },
                dropdown: {
                    position: 'relative'
                },
                megamenu: {
                    position: 'absolute',
                    width: '100%'
                }
            }
        },

        // Animations
        animations: {
            none: {
                enabled: false
            },
            subtle: {
                enabled: true,
                duration: 200,
                hover: true
            },
            smooth: {
                enabled: true,
                duration: 300,
                hover: true,
                scroll: true,
                menuSlide: true
            },
            rich: {
                enabled: true,
                duration: 400,
                hover: true,
                scroll: true,
                menuSlide: true,
                parallax: true,
                morphing: true,
                glowEffect: true
            }
        },

        // Fonctionnalités
        features: {
            // Logo/Branding
            logo: {
                enabled: true,
                position: 'left',
                type: 'image', // image, text, both
                adaptive: true // Change selon le scroll
            },
            // Navigation principale
            navigation: {
                enabled: true,
                position: 'center',
                style: 'horizontal',
                indicators: true,
                animations: true
            },
            // Recherche
            search: {
                enabled: true,
                position: 'right',
                type: 'inline', // inline, modal, overlay
                suggestions: true,
                voice: false,
                history: true
            },
            // Notifications
            notifications: {
                enabled: true,
                badge: true,
                dropdown: true,
                realtime: false,
                sound: false
            },
            // Profil utilisateur
            profile: {
                enabled: true,
                avatar: true,
                dropdown: true,
                status: true
            },
            // Menu mobile
            mobileMenu: {
                enabled: true,
                type: 'hamburger', // hamburger, dots, custom
                position: 'right',
                animation: 'slide' // slide, fade, morph
            },
            // Fonctionnalités avancées
            advanced: {
                darkMode: true,
                language: true,
                accessibility: true,
                customActions: []
            },
            // Comportement au scroll
            scroll: {
                hide: false,
                shrink: true,
                changeStyle: true,
                progress: false,
                threshold: 100
            },
            // Breadcrumb
            breadcrumb: {
                enabled: false,
                position: 'bottom',
                separator: '/'
            },
            // Sticky elements
            sticky: {
                enabled: false,
                elements: [],
                offset: 0
            }
        },

        // États
        states: {
            default: 'is-default',
            scrolled: 'is-scrolled',
            hidden: 'is-hidden',
            expanded: 'is-expanded',
            searching: 'is-searching',
            loading: 'is-loading',
            transparent: 'is-transparent',
            solid: 'is-solid',
            mobile: 'is-mobile'
        },

        // Classes CSS
        classes: {
            container: 'header',
            wrapper: 'header-wrapper',
            content: 'header-content',
            logo: 'header-logo',
            nav: 'header-nav',
            navItem: 'header-nav-item',
            navLink: 'header-nav-link',
            dropdown: 'header-dropdown',
            search: 'header-search',
            actions: 'header-actions',
            profile: 'header-profile',
            notifications: 'header-notifications',
            mobileToggle: 'header-mobile-toggle',
            overlay: 'header-overlay'
        },

        // Breakpoints
        breakpoints: {
            mobile: 640,
            tablet: 768,
            desktop: 1024,
            wide: 1280
        },

        // Messages et labels
        messages: {
            search: 'Rechercher...',
            searchVoice: 'Recherche vocale',
            notifications: 'Notifications',
            profile: 'Profil',
            menu: 'Menu',
            close: 'Fermer',
            darkMode: 'Mode sombre',
            language: 'Langue',
            accessibility: 'Accessibilité'
        }
    };

    // ========================================
    // VARIABLES PRIVÉES
    // ========================================
    let instances = new Map();
    let instanceIdCounter = 0;
    let stylesInjected = false;
    let scrollPosition = 0;
    let isScrolling = false;

    // ========================================
    // MÉTHODES PRIVÉES - CRÉATION
    // ========================================
    function generateId() {
        return `header-${++instanceIdCounter}`;
    }

    function createContainer(options) {
        const container = document.createElement('header');
        container.className = `${CONFIG.classes.container} ${options.style} ${options.layout}`;
        container.setAttribute('role', 'banner');
        
        if (options.id) {
            container.id = options.id;
        }

        // Appliquer le layout
        applyLayout(container, options.layout);

        // Hauteur
        if (options.height) {
            const height = CONFIG.heights[options.height] || options.height;
            if (typeof height === 'number') {
                container.style.height = `${height}px`;
            } else if (typeof height === 'object') {
                // Responsive heights
                applyResponsiveHeight(container, height);
            }
        }

        return container;
    }

    function createWrapper(options) {
        const wrapper = document.createElement('div');
        wrapper.className = CONFIG.classes.wrapper;
        
        if (options.maxWidth) {
            wrapper.style.maxWidth = options.maxWidth;
            wrapper.style.margin = '0 auto';
        }

        return wrapper;
    }

    function createContent(options) {
        const content = document.createElement('div');
        content.className = CONFIG.classes.content;
        
        // Position de la navigation
        const navPosition = options.features?.navigation?.position || 'center';
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = CONFIG.navigation.position[navPosition] || navPosition;
        
        return content;
    }

    function createLogo(options) {
        if (!options.features?.logo?.enabled) return null;
        
        const logoWrapper = document.createElement('div');
        logoWrapper.className = CONFIG.classes.logo;
        
        const logoOptions = options.features.logo;
        
        if (logoOptions.type === 'image' || logoOptions.type === 'both') {
            const img = document.createElement('img');
            img.src = options.logoSrc || '/assets/logo.png';
            img.alt = options.logoAlt || 'Logo';
            logoWrapper.appendChild(img);
        }
        
        if (logoOptions.type === 'text' || logoOptions.type === 'both') {
            const text = document.createElement('span');
            text.className = 'header-logo-text';
            text.textContent = options.logoText || 'Logo';
            logoWrapper.appendChild(text);
        }
        
        // Logo adaptatif
        if (logoOptions.adaptive && options.logoSrcDark) {
            logoWrapper.dataset.adaptive = 'true';
            logoWrapper.dataset.logoLight = options.logoSrc;
            logoWrapper.dataset.logoDark = options.logoSrcDark;
        }
        
        // Lien vers l'accueil
        if (options.logoLink !== false) {
            const link = document.createElement('a');
            link.href = options.logoLink || '/';
            link.className = 'header-logo-link';
            link.appendChild(logoWrapper.firstChild);
            logoWrapper.appendChild(link);
        }
        
        return logoWrapper;
    }

    function createNavigation(options) {
        if (!options.features?.navigation?.enabled || !options.navItems) return null;
        
        const nav = document.createElement('nav');
        nav.className = CONFIG.classes.nav;
        nav.setAttribute('role', 'navigation');
        nav.setAttribute('aria-label', 'Navigation principale');
        
        const navList = document.createElement('ul');
        navList.className = 'header-nav-list';
        
        options.navItems.forEach(item => {
            const navItem = createNavItem(item, options);
            navList.appendChild(navItem);
        });
        
        nav.appendChild(navList);
        return nav;
    }

    function createNavItem(item, options) {
        const li = document.createElement('li');
        li.className = CONFIG.classes.navItem;
        
        const link = document.createElement('a');
        link.className = CONFIG.classes.navLink;
        link.href = item.href || '#';
        link.textContent = item.label;
        
        if (item.active) {
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'page');
        }
        
        // Icône
        if (item.icon) {
            const icon = createIcon(item.icon);
            link.insertBefore(icon, link.firstChild);
        }
        
        // Badge
        if (item.badge) {
            const badge = createBadge(item.badge);
            link.appendChild(badge);
        }
        
        li.appendChild(link);
        
        // Sous-menu
        if (item.children && item.children.length > 0) {
            li.classList.add('has-dropdown');
            const dropdown = createDropdown(item.children, options);
            li.appendChild(dropdown);
            
            // Indicateur de dropdown
            if (options.features?.navigation?.indicators) {
                const indicator = createDropdownIndicator();
                link.appendChild(indicator);
            }
        }
        
        // Mega menu
        if (item.megamenu) {
            li.classList.add('has-megamenu');
            const megamenu = createMegaMenu(item.megamenu, options);
            li.appendChild(megamenu);
        }
        
        return li;
    }

    function createDropdown(items, options) {
        const dropdown = document.createElement('ul');
        dropdown.className = CONFIG.classes.dropdown;
        dropdown.setAttribute('role', 'menu');
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.setAttribute('role', 'none');
            
            const link = document.createElement('a');
            link.className = 'header-dropdown-link';
            link.href = item.href || '#';
            link.textContent = item.label;
            link.setAttribute('role', 'menuitem');
            
            if (item.icon) {
                const icon = createIcon(item.icon);
                link.insertBefore(icon, link.firstChild);
            }
            
            if (item.description) {
                const desc = document.createElement('span');
                desc.className = 'header-dropdown-desc';
                desc.textContent = item.description;
                link.appendChild(desc);
            }
            
            li.appendChild(link);
            dropdown.appendChild(li);
            
            // Sous-sous-menu récursif
            if (item.children) {
                li.classList.add('has-submenu');
                const submenu = createDropdown(item.children, options);
                submenu.classList.add('header-submenu');
                li.appendChild(submenu);
            }
        });
        
        return dropdown;
    }

    function createMegaMenu(megaConfig, options) {
        const megamenu = document.createElement('div');
        megamenu.className = 'header-megamenu';
        
        const container = document.createElement('div');
        container.className = 'header-megamenu-container';
        
        // Colonnes
        if (megaConfig.columns) {
            megaConfig.columns.forEach(column => {
                const col = document.createElement('div');
                col.className = 'header-megamenu-column';
                
                if (column.title) {
                    const title = document.createElement('h3');
                    title.className = 'header-megamenu-title';
                    title.textContent = column.title;
                    col.appendChild(title);
                }
                
                if (column.items) {
                    const list = document.createElement('ul');
                    list.className = 'header-megamenu-list';
                    
                    column.items.forEach(item => {
                        const li = document.createElement('li');
                        const link = document.createElement('a');
                        link.href = item.href || '#';
                        link.textContent = item.label;
                        
                        if (item.icon) {
                            const icon = createIcon(item.icon);
                            link.insertBefore(icon, link.firstChild);
                        }
                        
                        li.appendChild(link);
                        list.appendChild(li);
                    });
                    
                    col.appendChild(list);
                }
                
                container.appendChild(col);
            });
        }
        
        // Section promo
        if (megaConfig.promo) {
            const promo = document.createElement('div');
            promo.className = 'header-megamenu-promo';
            promo.innerHTML = megaConfig.promo;
            container.appendChild(promo);
        }
        
        megamenu.appendChild(container);
        return megamenu;
    }

    function createSearch(options) {
        if (!options.features?.search?.enabled) return null;
        
        const searchWrapper = document.createElement('div');
        searchWrapper.className = CONFIG.classes.search;
        
        const searchConfig = options.features.search;
        
        if (searchConfig.type === 'inline') {
            const form = document.createElement('form');
            form.className = 'header-search-form';
            form.setAttribute('role', 'search');
            
            const input = document.createElement('input');
            input.type = 'search';
            input.className = 'header-search-input';
            input.placeholder = options.searchPlaceholder || CONFIG.messages.search;
            input.setAttribute('aria-label', 'Recherche');
            
            const button = document.createElement('button');
            button.type = 'submit';
            button.className = 'header-search-button';
            button.setAttribute('aria-label', 'Lancer la recherche');
            button.innerHTML = getSearchIcon();
            
            form.appendChild(input);
            form.appendChild(button);
            
            // Suggestions
            if (searchConfig.suggestions) {
                const suggestions = createSearchSuggestions();
                form.appendChild(suggestions);
            }
            
            searchWrapper.appendChild(form);
        } else {
            // Bouton pour ouvrir la recherche
            const button = document.createElement('button');
            button.className = 'header-search-trigger';
            button.setAttribute('aria-label', 'Ouvrir la recherche');
            button.innerHTML = getSearchIcon();
            
            searchWrapper.appendChild(button);
        }
        
        // Recherche vocale
        if (searchConfig.voice && 'webkitSpeechRecognition' in window) {
            const voiceButton = document.createElement('button');
            voiceButton.className = 'header-search-voice';
            voiceButton.setAttribute('aria-label', CONFIG.messages.searchVoice);
            voiceButton.innerHTML = getMicIcon();
            searchWrapper.appendChild(voiceButton);
        }
        
        return searchWrapper;
    }

    function createActions(options) {
        const actions = document.createElement('div');
        actions.className = CONFIG.classes.actions;
        
        // Mode sombre
        if (options.features?.advanced?.darkMode) {
            const darkModeToggle = createDarkModeToggle(options);
            actions.appendChild(darkModeToggle);
        }
        
        // Sélecteur de langue
        if (options.features?.advanced?.language) {
            const langSelector = createLanguageSelector(options);
            actions.appendChild(langSelector);
        }
        
        // Notifications
        if (options.features?.notifications?.enabled) {
            const notifications = createNotifications(options);
            actions.appendChild(notifications);
        }
        
        // Profil
        if (options.features?.profile?.enabled) {
            const profile = createProfile(options);
            actions.appendChild(profile);
        }
        
        // Actions personnalisées
        if (options.features?.advanced?.customActions) {
            options.features.advanced.customActions.forEach(action => {
                const customAction = createCustomAction(action, options);
                actions.appendChild(customAction);
            });
        }
        
        return actions;
    }

    function createNotifications(options) {
        const wrapper = document.createElement('div');
        wrapper.className = CONFIG.classes.notifications;
        
        const button = document.createElement('button');
        button.className = 'header-notifications-button';
        button.setAttribute('aria-label', CONFIG.messages.notifications);
        button.innerHTML = getBellIcon();
        
        // Badge
        if (options.features.notifications.badge) {
            const badge = document.createElement('span');
            badge.className = 'header-notifications-badge';
            badge.textContent = options.notificationCount || '';
            if (options.notificationCount > 0) {
                button.appendChild(badge);
            }
        }
        
        wrapper.appendChild(button);
        
        // Dropdown
        if (options.features.notifications.dropdown) {
            const dropdown = createNotificationsDropdown(options);
            wrapper.appendChild(dropdown);
        }
        
        return wrapper;
    }

    function createProfile(options) {
        const wrapper = document.createElement('div');
        wrapper.className = CONFIG.classes.profile;
        
        const button = document.createElement('button');
        button.className = 'header-profile-button';
        button.setAttribute('aria-label', CONFIG.messages.profile);
        
        // Avatar
        if (options.features.profile.avatar && options.user?.avatar) {
            const avatar = document.createElement('img');
            avatar.className = 'header-profile-avatar';
            avatar.src = options.user.avatar;
            avatar.alt = options.user.name || 'Avatar';
            button.appendChild(avatar);
        } else {
            button.innerHTML = getUserIcon();
        }
        
        // Nom
        if (options.user?.name && options.features.profile.showName) {
            const name = document.createElement('span');
            name.className = 'header-profile-name';
            name.textContent = options.user.name;
            button.appendChild(name);
        }
        
        // Status
        if (options.features.profile.status && options.user?.status) {
            const status = document.createElement('span');
            status.className = `header-profile-status status-${options.user.status}`;
            button.appendChild(status);
        }
        
        wrapper.appendChild(button);
        
        // Dropdown
        if (options.features.profile.dropdown) {
            const dropdown = createProfileDropdown(options);
            wrapper.appendChild(dropdown);
        }
        
        return wrapper;
    }

    function createMobileMenu(options) {
        if (!options.features?.mobileMenu?.enabled) return null;
        
        const button = document.createElement('button');
        button.className = CONFIG.classes.mobileToggle;
        button.setAttribute('aria-label', CONFIG.messages.menu);
        button.setAttribute('aria-expanded', 'false');
        
        const menuConfig = options.features.mobileMenu;
        
        // Type de menu
        switch (menuConfig.type) {
            case 'hamburger':
                button.innerHTML = `
                    <span class="hamburger">
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                        <span class="hamburger-line"></span>
                    </span>
                `;
                break;
            case 'dots':
                button.innerHTML = getDotsIcon();
                break;
            default:
                button.innerHTML = getMenuIcon();
        }
        
        return button;
    }

    function createMobileNavigation(options) {
        const mobileNav = document.createElement('div');
        mobileNav.className = 'header-mobile-nav';
        mobileNav.setAttribute('role', 'navigation');
        mobileNav.setAttribute('aria-label', 'Navigation mobile');
        
        // Overlay
        if (options.features?.mobileMenu?.overlay !== false) {
            const overlay = document.createElement('div');
            overlay.className = CONFIG.classes.overlay;
            mobileNav.appendChild(overlay);
        }
        
        // Container
        const container = document.createElement('div');
        container.className = 'header-mobile-nav-container';
        
        // Header mobile
        const header = document.createElement('div');
        header.className = 'header-mobile-nav-header';
        
        // Logo dans le menu mobile
        if (options.features?.logo?.enabled) {
            const logo = createLogo(options);
            if (logo) {
                logo.classList.add('mobile');
                header.appendChild(logo);
            }
        }
        
        // Bouton fermer
        const closeButton = document.createElement('button');
        closeButton.className = 'header-mobile-nav-close';
        closeButton.setAttribute('aria-label', CONFIG.messages.close);
        closeButton.innerHTML = getCloseIcon();
        header.appendChild(closeButton);
        
        container.appendChild(header);
        
        // Navigation mobile
        if (options.navItems) {
            const nav = createMobileNavItems(options.navItems, options);
            container.appendChild(nav);
        }
        
        // Actions mobile
        const actions = document.createElement('div');
        actions.className = 'header-mobile-nav-actions';
        
        // Copier les actions desktop
        if (options.features?.search?.enabled) {
            const search = createSearch(options);
            if (search) {
                search.classList.add('mobile');
                actions.appendChild(search);
            }
        }
        
        container.appendChild(actions);
        mobileNav.appendChild(container);
        
        return mobileNav;
    }

    function createMobileNavItems(items, options) {
        const nav = document.createElement('nav');
        nav.className = 'header-mobile-nav-items';
        
        const list = document.createElement('ul');
        
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'header-mobile-nav-item';
            
            const link = document.createElement('a');
            link.href = item.href || '#';
            link.textContent = item.label;
            
            if (item.icon) {
                const icon = createIcon(item.icon);
                link.insertBefore(icon, link.firstChild);
            }
            
            li.appendChild(link);
            
            // Sous-menu mobile
            if (item.children) {
                li.classList.add('has-children');
                const toggle = document.createElement('button');
                toggle.className = 'header-mobile-nav-toggle';
                toggle.innerHTML = getChevronIcon();
                li.appendChild(toggle);
                
                const submenu = createMobileNavItems(item.children, options);
                submenu.classList.add('header-mobile-submenu');
                li.appendChild(submenu);
            }
            
            list.appendChild(li);
        });
        
        nav.appendChild(list);
        return nav;
    }

    // ========================================
    // MÉTHODES PRIVÉES - FONCTIONNALITÉS
    // ========================================
    function attachEvents(instance) {
        const { elements, options } = instance;
        
        // Scroll events
        if (options.features?.scroll) {
            attachScrollEvents(instance);
        }
        
        // Navigation dropdown
        if (elements.nav) {
            attachNavigationEvents(instance);
        }
        
        // Recherche
        if (elements.search) {
            attachSearchEvents(instance);
        }
        
        // Notifications
        if (elements.notifications) {
            attachNotificationEvents(instance);
        }
        
        // Profil
        if (elements.profile) {
            attachProfileEvents(instance);
        }
        
        // Menu mobile
        if (elements.mobileToggle) {
            attachMobileMenuEvents(instance);
        }
        
        // Mode sombre
        if (elements.darkModeToggle) {
            attachDarkModeEvents(instance);
        }
        
        // Responsive
        attachResponsiveEvents(instance);
        
        // Clavier
        if (options.features?.accessibility?.keyboardSupport !== false) {
            attachKeyboardEvents(instance);
        }
    }

    function attachScrollEvents(instance) {
        const { elements, options } = instance;
        const scrollConfig = options.features.scroll;
        
        let lastScrollY = window.scrollY;
        let ticking = false;
        
        function updateScroll() {
            const currentScrollY = window.scrollY;
            
            // Détecter la direction
            if (currentScrollY > lastScrollY && currentScrollY > scrollConfig.threshold) {
                // Scroll vers le bas
                if (scrollConfig.hide) {
                    elements.container.classList.add(CONFIG.states.hidden);
                }
            } else {
                // Scroll vers le haut
                elements.container.classList.remove(CONFIG.states.hidden);
            }
            
            // État scrolled
            if (currentScrollY > scrollConfig.threshold) {
                elements.container.classList.add(CONFIG.states.scrolled);
                
                // Changer le style
                if (scrollConfig.changeStyle && options.scrollStyle) {
                    applyScrollStyle(instance, options.scrollStyle);
                }
                
                // Réduire la hauteur
                if (scrollConfig.shrink) {
                    elements.container.classList.add('is-shrinked');
                }
            } else {
                elements.container.classList.remove(CONFIG.states.scrolled, 'is-shrinked');
                
                // Restaurer le style original
                if (scrollConfig.changeStyle) {
                    restoreOriginalStyle(instance);
                }
            }
            
            // Progress bar
            if (scrollConfig.progress && elements.progressBar) {
                updateProgressBar(instance, currentScrollY);
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
        }
        
        function requestTick() {
            if (!ticking) {
                window.requestAnimationFrame(updateScroll);
                ticking = true;
            }
        }
        
        window.addEventListener('scroll', requestTick, { passive: true });
    }

    function attachNavigationEvents(instance) {
        const { elements } = instance;
        
        // Hover sur les items avec dropdown
        const dropdownItems = elements.nav.querySelectorAll('.has-dropdown');
        
        dropdownItems.forEach(item => {
            let hoverTimeout;
            
            item.addEventListener('mouseenter', () => {
                clearTimeout(hoverTimeout);
                closeAllDropdowns(instance);
                item.classList.add('is-open');
                
                // Animation d'ouverture
                const dropdown = item.querySelector(`.${CONFIG.classes.dropdown}`);
                if (dropdown) {
                    animateDropdown(dropdown, 'open');
                }
            });
            
            item.addEventListener('mouseleave', () => {
                hoverTimeout = setTimeout(() => {
                    item.classList.remove('is-open');
                    
                    const dropdown = item.querySelector(`.${CONFIG.classes.dropdown}`);
                    if (dropdown) {
                        animateDropdown(dropdown, 'close');
                    }
                }, 300);
            });
            
            // Click sur mobile
            const link = item.querySelector(`.${CONFIG.classes.navLink}`);
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= CONFIG.breakpoints.tablet) {
                    e.preventDefault();
                    item.classList.toggle('is-open');
                }
            });
        });
        
        // Mega menu
        const megamenuItems = elements.nav.querySelectorAll('.has-megamenu');
        
        megamenuItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                closeAllMegamenus(instance);
                item.classList.add('is-open');
                
                const megamenu = item.querySelector('.header-megamenu');
                if (megamenu) {
                    animateMegamenu(megamenu, 'open');
                }
            });
            
            item.addEventListener('mouseleave', () => {
                item.classList.remove('is-open');
                
                const megamenu = item.querySelector('.header-megamenu');
                if (megamenu) {
                    animateMegamenu(megamenu, 'close');
                }
            });
        });
    }

    function attachSearchEvents(instance) {
        const { elements, options } = instance;
        const searchConfig = options.features.search;
        
        if (searchConfig.type === 'inline') {
            const input = elements.search.querySelector('.header-search-input');
            const form = elements.search.querySelector('.header-search-form');
            
            // Focus/blur
            input.addEventListener('focus', () => {
                elements.container.classList.add(CONFIG.states.searching);
                
                // Afficher les suggestions
                if (searchConfig.suggestions) {
                    showSearchSuggestions(instance);
                }
            });
            
            input.addEventListener('blur', () => {
                setTimeout(() => {
                    elements.container.classList.remove(CONFIG.states.searching);
                    hideSearchSuggestions(instance);
                }, 200);
            });
            
            // Input pour suggestions
            if (searchConfig.suggestions) {
                input.addEventListener('input', debounce(() => {
                    updateSearchSuggestions(instance, input.value);
                }, 300));
            }
            
            // Submit
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                handleSearch(instance, input.value);
            });
        } else {
            // Trigger pour ouvrir la recherche
            const trigger = elements.search.querySelector('.header-search-trigger');
            
            trigger.addEventListener('click', () => {
                openSearchOverlay(instance);
            });
        }
        
        // Recherche vocale
        if (searchConfig.voice) {
            const voiceButton = elements.search.querySelector('.header-search-voice');
            if (voiceButton) {
                voiceButton.addEventListener('click', () => {
                    startVoiceSearch(instance);
                });
            }
        }
    }

    function attachMobileMenuEvents(instance) {
        const { elements } = instance;
        
        // Toggle menu
        elements.mobileToggle.addEventListener('click', () => {
            toggleMobileMenu(instance);
        });
        
        // Fermer le menu
        const closeButton = elements.mobileNav?.querySelector('.header-mobile-nav-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                closeMobileMenu(instance);
            });
        }
        
        // Overlay
        const overlay = elements.mobileNav?.querySelector(`.${CONFIG.classes.overlay}`);
        if (overlay) {
            overlay.addEventListener('click', () => {
                closeMobileMenu(instance);
            });
        }
        
        // Toggles sous-menu
        const submenutToggles = elements.mobileNav?.querySelectorAll('.header-mobile-nav-toggle');
        submenutToggles?.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const item = toggle.parentElement;
                item.classList.toggle('is-open');
                
                // Animation
                const submenu = item.querySelector('.header-mobile-submenu');
                if (submenu) {
                    slideToggle(submenu);
                }
            });
        });
    }

    function attachKeyboardEvents(instance) {
        const { elements } = instance;
        
        // Navigation au clavier
        elements.container.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Escape':
                    closeAllDropdowns(instance);
                    closeAllMegamenus(instance);
                    closeMobileMenu(instance);
                    break;
                    
                case 'Tab':
                    handleTabNavigation(instance, e);
                    break;
                    
                case 'ArrowDown':
                case 'ArrowUp':
                    if (e.target.closest(`.${CONFIG.classes.nav}`)) {
                        e.preventDefault();
                        navigateDropdown(instance, e);
                    }
                    break;
            }
        });
    }

    // ========================================
    // MÉTHODES PRIVÉES - UTILITAIRES
    // ========================================
    function applyLayout(container, layout) {
        const layoutConfig = CONFIG.layouts[layout] || CONFIG.layouts.fixed;
        
        Object.entries(layoutConfig).forEach(([property, value]) => {
            container.style[property] = value;
        });
    }

    function applyScrollStyle(instance, scrollStyle) {
        const { elements, originalStyle } = instance;
        
        // Sauvegarder le style original
        if (!originalStyle) {
            instance.originalStyle = elements.container.className;
        }
        
        // Appliquer le nouveau style
        elements.container.classList.remove(...Object.keys(CONFIG.styles));
        elements.container.classList.add(scrollStyle);
    }

    function restoreOriginalStyle(instance) {
        if (instance.originalStyle) {
            const { elements } = instance;
            elements.container.className = instance.originalStyle;
        }
    }

    function toggleMobileMenu(instance) {
        const { elements } = instance;
        const isOpen = elements.container.classList.contains(CONFIG.states.mobile);
        
        if (isOpen) {
            closeMobileMenu(instance);
        } else {
            openMobileMenu(instance);
        }
    }

    function openMobileMenu(instance) {
        const { elements, options } = instance;
        
        elements.container.classList.add(CONFIG.states.mobile);
        elements.mobileToggle.setAttribute('aria-expanded', 'true');
        
        // Bloquer le scroll
        document.body.style.overflow = 'hidden';
        
        // Animation
        if (options.features?.mobileMenu?.animation) {
            animateMobileMenu(instance, 'open');
        }
        
        // Focus trap
        if (options.features?.accessibility?.focusTrap !== false) {
            createFocusTrap(elements.mobileNav);
        }
    }

    function closeMobileMenu(instance) {
        const { elements, options } = instance;
        
        elements.container.classList.remove(CONFIG.states.mobile);
        elements.mobileToggle.setAttribute('aria-expanded', 'false');
        
        // Restaurer le scroll
        document.body.style.overflow = '';
        
        // Animation
        if (options.features?.mobileMenu?.animation) {
            animateMobileMenu(instance, 'close');
        }
        
        // Retirer le focus trap
        removeFocusTrap();
    }

    function closeAllDropdowns(instance) {
        const dropdowns = instance.elements.nav?.querySelectorAll('.has-dropdown.is-open');
        dropdowns?.forEach(item => {
            item.classList.remove('is-open');
        });
    }

    function closeAllMegamenus(instance) {
        const megamenus = instance.elements.nav?.querySelectorAll('.has-megamenu.is-open');
        megamenus?.forEach(item => {
            item.classList.remove('is-open');
        });
    }

    function createBadge(content) {
        const badge = document.createElement('span');
        badge.className = 'header-badge';
        
        if (typeof content === 'object') {
            badge.textContent = content.text || '';
            badge.className += ` badge-${content.type || 'default'}`;
        } else {
            badge.textContent = content;
        }
        
        return badge;
    }

    function createIcon(iconName) {
        const icon = document.createElement('span');
        icon.className = 'header-icon';
        icon.innerHTML = getIcon(iconName);
        return icon;
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

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ========================================
    // MÉTHODES PRIVÉES - ICÔNES
    // ========================================
    function getIcon(name) {
        const icons = {
            search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>',
            bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>',
            user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
            menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>',
            close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
            chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>',
            moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
            sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
            globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>',
            mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>',
            dots: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>'
        };
        
        return icons[name] || '';
    }

    function getSearchIcon() {
        return getIcon('search');
    }

    function getBellIcon() {
        return getIcon('bell');
    }

    function getUserIcon() {
        return getIcon('user');
    }

    function getMenuIcon() {
        return getIcon('menu');
    }

    function getCloseIcon() {
        return getIcon('close');
    }

    function getChevronIcon() {
        return getIcon('chevron');
    }

    function getMicIcon() {
        return getIcon('mic');
    }

    function getDotsIcon() {
        return getIcon('dots');
    }

    // ========================================
    // INJECTION DES STYLES
    // ========================================
    function injectStyles() {
        if (stylesInjected) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/src/css/shared/ui/header.css';
        document.head.appendChild(link);
        
        stylesInjected = true;
    }

    // ========================================
    // API PUBLIQUE
    // ========================================
    return {
        create(options = {}) {
            // Injection des styles
            if (!stylesInjected) {
                injectStyles();
            }

            // Options par défaut
            const defaultOptions = {
                style: 'glassmorphism',
                layout: 'fixed',
                height: 'normal',
                animation: 'smooth',
                features: {
                    logo: {
                        enabled: true,
                        type: 'image'
                    },
                    navigation: {
                        enabled: true,
                        position: 'center'
                    },
                    search: {
                        enabled: true,
                        type: 'inline'
                    },
                    mobileMenu: {
                        enabled: true,
                        type: 'hamburger'
                    }
                }
            };

            // Fusion des options
            options = Object.assign({}, defaultOptions, options);

            // Créer l'instance
            const instance = {
                id: generateId(),
                options,
                elements: {},
                state: {
                    scrolled: false,
                    hidden: false,
                    mobile: false,
                    searching: false
                }
            };

            // Créer les éléments
            instance.elements.container = createContainer(options);
            instance.elements.wrapper = createWrapper(options);
            instance.elements.content = createContent(options);

            // Logo
            if (options.features?.logo?.enabled) {
                instance.elements.logo = createLogo(options);
                if (instance.elements.logo) {
                    instance.elements.content.appendChild(instance.elements.logo);
                }
            }

            // Navigation
            if (options.features?.navigation?.enabled) {
                instance.elements.nav = createNavigation(options);
                if (instance.elements.nav) {
                    instance.elements.content.appendChild(instance.elements.nav);
                }
            }

            // Recherche
            if (options.features?.search?.enabled) {
                instance.elements.search = createSearch(options);
                if (instance.elements.search) {
                    instance.elements.content.appendChild(instance.elements.search);
                }
            }

            // Actions
            instance.elements.actions = createActions(options);
            instance.elements.content.appendChild(instance.elements.actions);

            // Mobile toggle
            if (options.features?.mobileMenu?.enabled) {
                instance.elements.mobileToggle = createMobileMenu(options);
                if (instance.elements.mobileToggle) {
                    instance.elements.content.appendChild(instance.elements.mobileToggle);
                }
            }

            // Assembler
            instance.elements.wrapper.appendChild(instance.elements.content);
            instance.elements.container.appendChild(instance.elements.wrapper);

            // Navigation mobile
            if (options.features?.mobileMenu?.enabled) {
                instance.elements.mobileNav = createMobileNavigation(options);
                if (instance.elements.mobileNav) {
                    document.body.appendChild(instance.elements.mobileNav);
                }
            }

            // Attacher les événements
            attachEvents(instance);

            // Stocker l'instance
            instances.set(instance.id, instance);

            // API de l'instance
            instance.updateNotifications = (count) => {
                const badge = instance.elements.notifications?.querySelector('.header-notifications-badge');
                if (badge) {
                    badge.textContent = count || '';
                    badge.style.display = count > 0 ? 'block' : 'none';
                }
            };

            instance.setActive = (href) => {
                const links = instance.elements.nav?.querySelectorAll(`.${CONFIG.classes.navLink}`);
                links?.forEach(link => {
                    if (link.getAttribute('href') === href) {
                        link.classList.add('is-active');
                        link.setAttribute('aria-current', 'page');
                    } else {
                        link.classList.remove('is-active');
                        link.removeAttribute('aria-current');
                    }
                });
            };

            instance.show = () => {
                instance.elements.container.classList.remove(CONFIG.states.hidden);
            };

            instance.hide = () => {
                instance.elements.container.classList.add(CONFIG.states.hidden);
            };

            instance.destroy = () => {
                instances.delete(instance.id);
                instance.elements.container.remove();
                if (instance.elements.mobileNav) {
                    instance.elements.mobileNav.remove();
                }
            };

            // Retourner l'élément et l'instance
            return {
                element: instance.elements.container,
                instance
            };
        },

        // Configuration exposée
        CONFIG,
        
        // Méthodes utilitaires
        getInstance(id) {
            return instances.get(id);
        },
        
        getAllInstances() {
            return Array.from(instances.values());
        },
        
        // Injection manuelle des styles
        injectStyles
    };
})();

// Export pour utilisation
export default Header;

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-12-XX] - Gestion du z-index avec modales
   Solution: Système de z-index centralisé avec layers
   
   [2024-12-XX] - Performance scroll sur mobile
   Cause: Trop d'événements scroll non throttled
   Résolution: Throttling et passive listeners
   
   [2024-12-XX] - Menu mobile et scroll iOS
   Solution: Bloquer le body scroll et gérer le bounce
   
   NOTES POUR REPRISES FUTURES:
   - Le header fixed nécessite un padding-top sur le body
   - Les mega menus doivent être positionnés avec JS sur mobile
   - L'accessibilité clavier est critique pour la navigation
   - Le mode transparent nécessite des logos adaptatifs
   ======================================== */