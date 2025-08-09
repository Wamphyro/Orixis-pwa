// ========================================
// HEADER.WIDGET.JS - Enhanced Glassmorphism
// Chemin: widgets/header/header.widget.js
// ========================================

import { loadWidgetStyles } from '/src/utils/widget-styles-loader.js';

export class HeaderWidget {
    constructor(config = {}) {
        // ID unique pour le widget
        this.id = `header-${Date.now()}`;
        
        // Charger le CSS
        this.loadCSS();
        
        // Configuration complète avec toutes les options
        this.config = {
            // ===== BASIQUE (existant) =====
            title: config.title || 'Application',
            subtitle: config.subtitle || '',
            centerTitle: config.centerTitle || false,  // NOUVELLE OPTION
            theme: config.theme || 'gradient', // 'gradient' ou 'solid'
            container: config.container || 'body',
            position: config.position || 'prepend',
            sticky: config.sticky !== false,
            
            // ===== NAVIGATION =====
            showBack: config.showBack !== false,
            backUrl: config.backUrl || '/modules/home/home.html',
            backText: config.backText || 'Retour',
            onBack: config.onBack || null,
            
            // ===== NOUVEAU: LOGO =====
            showLogo: config.showLogo || false,
            logoIcon: config.logoIcon || null, // SVG ou emoji
            logoUrl: config.logoUrl || '/',
            onLogoClick: config.onLogoClick || null,
            
            // ===== NOUVEAU: RECHERCHE =====
            showSearch: config.showSearch || false,
            searchPlaceholder: config.searchPlaceholder || 'Rechercher...',
            searchDebounce: config.searchDebounce || 300,
            searchMaxWidth: config.searchMaxWidth || '600px',
            searchHeight: config.searchHeight || '40px',  // ⬅️ AJOUTER CETTE LIGNE
            onSearch: config.onSearch || null,
            
            // ===== NOUVEAU: ACTIONS RAPIDES =====
            showQuickActions: config.showQuickActions || false,
            quickActions: config.quickActions || [
                {
                    id: 'new',
                    title: 'Nouvelle facture',
                    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <line x1="12" y1="8" x2="12" y2="16"/>
                        <line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>`,
                    onClick: null
                },
                {
                    id: 'dashboard',
                    title: 'Dashboard',
                    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="14" y="14" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                    </svg>`,
                    onClick: null
                }
            ],
            onQuickAction: config.onQuickAction || null,
            
            // ===== NOUVEAU: INDICATEURS =====
            showIndicators: config.showIndicators || false,
            indicators: config.indicators || [
                {
                    id: 'online',
                    text: 'En ligne',
                    type: 'success', // success, warning, danger
                    animated: true
                }
            ],
            
            // ===== NOUVEAU: NOTIFICATIONS =====
            showNotifications: config.showNotifications || false,
            notificationCount: config.notificationCount || 0,
            notifications: config.notifications || [],
            onNotificationClick: config.onNotificationClick || null,
            onNotificationClear: config.onNotificationClear || null,
            
            // ===== NOUVEAU: BREADCRUMBS =====
            showBreadcrumbs: config.showBreadcrumbs || false,
            breadcrumbs: config.breadcrumbs || [],
            onBreadcrumbClick: config.onBreadcrumbClick || null,
            
            // ===== UTILISATEUR (amélioré) =====
            showUser: config.showUser !== false,
            showUserDropdown: config.showUserDropdown || false,
            showMagasin: config.showMagasin !== false,
            showLogout: config.showLogout !== false,
            userMenuItems: config.userMenuItems || [
                { id: 'profile', text: 'Mon profil', icon: '👤' },
                { id: 'settings', text: 'Paramètres', icon: '⚙️' },
                { type: 'separator' },
                { id: 'logout', text: 'Déconnexion', icon: '🚪', danger: true }
            ],
            onUserClick: config.onUserClick || null,
            onLogout: config.onLogout || this.defaultLogout.bind(this),
            
            // ===== AUTO FEATURES =====
            autoAuth: config.autoAuth !== false,
            autoRefresh: config.autoRefresh || false,
            refreshInterval: config.refreshInterval || 60000,
            
            // ===== PERSONNALISATION BOUTONS =====
            buttonStyles: {
                back: {
                    height: config.buttonStyles?.back?.height || '40px',
                    padding: config.buttonStyles?.back?.padding || '10px 20px',
                    minWidth: config.buttonStyles?.back?.minWidth || 'auto',
                    ...config.buttonStyles?.back
                },
                action: {
                    height: config.buttonStyles?.action?.height || '40px',
                    width: config.buttonStyles?.action?.width || '40px',
                    ...config.buttonStyles?.action
                },
                notification: {
                    height: config.buttonStyles?.notification?.height || '44px',
                    width: config.buttonStyles?.notification?.width || '44px',
                    ...config.buttonStyles?.notification
                },
                userMenu: {
                    height: config.buttonStyles?.userMenu?.height || '44px',
                    padding: config.buttonStyles?.userMenu?.padding || '6px 14px 6px 6px',
                    ...config.buttonStyles?.userMenu
                },
                indicator: {
                    height: config.buttonStyles?.indicator?.height || '36px',
                    padding: config.buttonStyles?.indicator?.padding || '8px 14px',
                    ...config.buttonStyles?.indicator
                }
            },
            
            // ===== CALLBACKS ADDITIONNELS =====
            onInit: config.onInit || null,
            onDestroy: config.onDestroy || null
        };
        
        // État interne
        this.state = {
            userData: null,
            searchQuery: '',
            searchSuggestions: [],
            notificationsOpen: false,
            userMenuOpen: false,
            indicators: [...this.config.indicators],
            notifications: [...this.config.notifications]
        };
        
        // Éléments DOM
        this.element = null;
        this.searchTimeout = null;
        this.refreshTimer = null;
        
        // Initialiser
        this.init();
    }
    
    // ========================================
    // CHARGEMENT CSS
    // ========================================
    
    loadCSS() {
        // Charger les styles communs
        loadWidgetStyles();
        
        // Charger le CSS spécifique
        const cssId = 'header-widget-enhanced-css';
        if (!document.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = `/widgets/header/header.widget.css?v=${Date.now()}`;
            document.head.appendChild(link);
        }
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init() {
        try {
            // Récupérer les données utilisateur
            if (this.config.autoAuth) {
                this.state.userData = await this.getUserData();
                if (!this.state.userData) {
                    console.warn('⚠️ Utilisateur non authentifié');
                    this.redirectToLogin();
                    return;
                }
            }
            
            // Créer le HTML
            this.createElement();
            
            // Injecter dans le DOM
            this.inject();
            
            // Attacher les événements
            this.attachEvents();

            // Attacher les événements
            this.attachEvents();
            
            // Configurer les tooltips globaux
            this.setupTooltips();
            
            // Charger les notifications depuis localStorage
            if (this.config.showNotifications) {
                this.loadNotifications();
            }
            
            // Démarrer l'auto-refresh
            if (this.config.autoRefresh) {
                this.startAutoRefresh();
            }
            
            // Animation d'entrée
            this.animate();
            
            // Callback d'initialisation
            if (this.config.onInit) {
                this.config.onInit(this);
            }
            
            console.log('✅ HeaderWidget Enhanced initialisé');
            
        } catch (error) {
            console.error('❌ Erreur init HeaderWidget:', error);
        }
    }
    
    // ========================================
    // RÉCUPÉRATION DONNÉES UTILISATEUR
    // ========================================
    
    async getUserData() {
        const auth = localStorage.getItem('sav_auth');
        if (!auth) return null;
        
        try {
            const authData = JSON.parse(auth);
            
            // Vérifier l'expiration
            const now = Date.now();
            if (now - authData.timestamp > authData.expiry) {
                localStorage.removeItem('sav_auth');
                return null;
            }
            
            const user = authData.collaborateur;
            if (!user) return null;
            
            // Formater le magasin
            let magasin = authData.magasin || user.magasin || 'XXX';
            if (!/^9[A-Z]{3}$/.test(magasin) && !magasin.startsWith('Magasin')) {
                magasin = `Magasin ${magasin}`;
            }
            
            return {
                nom: user.nom || '',
                prenom: user.prenom || '',
                nomComplet: `${user.prenom} ${user.nom}`.trim(),
                initiales: `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`,
                role: user.role || 'technicien',
                magasin: magasin,
                email: user.email || '',
                avatar: user.avatar || null,
                authenticated: true
            };
            
        } catch (error) {
            console.error('❌ Erreur parsing auth:', error);
            return null;
        }
    }
    
    // ========================================
    // CRÉATION DU HTML
    // ========================================
    
    createElement() {
        const html = `
            <header class="header-widget theme-${this.config.theme} ${this.config.sticky ? 'sticky' : ''}" 
                    id="${this.id}">
                
                ${this.config.centerTitle ? 
                    `<div class="header-title-row">
                        <div class="header-title-group">
                            <h1 class="header-brand-centered">${this.config.title}</h1>
                            ${this.config.subtitle ? `<p class="header-subtitle-centered">${this.config.subtitle}</p>` : ''}
                        </div>
                    </div>` : ''
                }
                
                <div class="header-content">
                    <!-- Section gauche -->
                    <div class="header-left">
                        ${this.createLeftSection()}
                    </div>
                    
                    <!-- Section centrale -->
                    <div class="header-center">
                        ${this.config.showSearch ? 
                            `<div class="header-search-wrapper">
                                <span class="header-search-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="11" cy="11" r="8"/>
                                        <path d="m21 21-4.35-4.35"/>
                                    </svg>
                                </span>
                                <input type="text" 
                                       class="header-search-input" 
                                       placeholder="${this.config.searchPlaceholder}"
                                       data-action="search">
                                ${this.config.showSearchSuggestions ? 
                                    '<div class="header-search-suggestions" data-dropdown="search"></div>' : ''
                                }
                            </div>` : ''
                        }
                    </div>
                    
                    <!-- Section droite -->
                    <div class="header-right">
                        ${this.createRightSection()}
                    </div>
                </div>
                
                <!-- Breadcrumbs (optionnel) -->
                ${this.config.showBreadcrumbs ? this.createBreadcrumbs() : ''}
                
                <!-- Barre de progression -->
                <div class="header-progress" style="display: none;">
                    <div class="header-progress-bar"></div>
                </div>
            </header>
        `;
        
        const temp = document.createElement('div');
        temp.innerHTML = html;
        this.element = temp.firstElementChild;
    }
    
    createLeftSection() {
        let html = '';
        
        // Logo
        if (this.config.showLogo && this.config.logoIcon) {
            html += `
                <div class="header-logo" data-action="logo">
                    ${this.config.logoIcon}
                </div>
            `;
        }
        
        // Titre (seulement si pas centré)
        if (!this.config.centerTitle) {
            html += `<h1 class="header-brand">${this.config.title}</h1>`;
        }
        
        // Bouton retour
        if (this.config.showBack) {
            html += `
                <button class="header-back-btn" data-action="back">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5m7 7l-7-7 7-7"/>
                    </svg>
                    <span>${this.config.backText}</span>
                </button>
            `;
        }
        
        // Actions rapides
        if (this.config.showQuickActions && this.config.quickActions.length > 0) {
            html += '<div class="header-quick-actions">';
            this.config.quickActions.forEach(action => {
                html += `
                    <button class="header-action-btn" 
                            data-action="quick" 
                            data-action-id="${action.id}"
                            data-tooltip="${action.title}">
                        ${action.icon}
                    </button>
                `;
            });
            html += '</div>';
        }
        
        return html;
    }
    
    createRightSection() {
        let html = '';
        
        // Indicateurs
        if (this.config.showIndicators && this.state.indicators.length > 0) {
            html += '<div class="header-indicators">';
            this.state.indicators.forEach(indicator => {
                const typeClass = indicator.type === 'warning' ? 'warning' : 'online';
                html += `
                    <div class="header-indicator ${typeClass}">
                        ${this.createIndicatorIcon(indicator.type)}
                        <span>${indicator.text}</span>
                    </div>
                `;
            });
            html += '</div>';
        }
        
        // Notifications
        if (this.config.showNotifications) {
            const count = this.state.notifications.filter(n => !n.read).length;
            html += `
                <button class="header-notification-btn ${count > 0 ? 'has-notifications' : ''}" 
                        data-action="notifications">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    ${count > 0 ? `<span class="header-notif-badge">${count}</span>` : ''}
                </button>
                ${this.createNotificationsDropdown()}
            `;
        }
        
        // Menu utilisateur
        if (this.config.showUser && this.state.userData) {
            html += `
                <div class="header-user-menu" data-action="user">
                    ${this.createUserAvatar()}
                    <div class="header-user-info">
                        <div class="header-user-name">${this.state.userData.nomComplet}</div>
                        ${this.config.showMagasin ? `
                            <div class="header-user-role">
                                ${this.state.userData.role} • ${this.state.userData.magasin}
                            </div>
                        ` : ''}
                    </div>
                </div>
                ${this.config.showUserDropdown ? this.createUserDropdown() : ''}
            `;
        }
        
        return html;
    }
    
    createIndicatorIcon(type) {
        const color = type === 'success' ? '#48bb78' : 
                    type === 'warning' ? '#fbbf24' : 
                    '#ef4444';
        
        return `
            <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" fill="${color}" opacity="0.3"/>
                <circle cx="12" cy="12" r="2" fill="${color}"/>
                <circle cx="12" cy="12" r="6" stroke="${color}" stroke-width="1" opacity="0.2"/>
            </svg>
        `;
    }
    
    createUserAvatar() {
        if (this.state.userData.avatar) {
            return `
                <div class="header-user-avatar with-image">
                    <img src="${this.state.userData.avatar}" alt="${this.state.userData.nomComplet}">
                </div>
            `;
        } else {
            return `
                <div class="header-user-avatar placeholder">
                    ${this.state.userData.initiales}
                </div>
            `;
        }
    }
    
    createNotificationsDropdown() {
        return `
            <div class="header-notifications-dropdown" data-dropdown="notifications">
                <div class="notifications-header">
                    <span class="notifications-title">Notifications</span>
                    <span class="notifications-clear" data-action="clear-notifications">
                        Tout marquer comme lu
                    </span>
                </div>
                <div class="notifications-list">
                    ${this.state.notifications.length > 0 ? 
                        this.state.notifications.map(notif => this.createNotificationItem(notif)).join('') :
                        '<div style="padding: 20px; text-align: center; color: #9ca3af;">Aucune notification</div>'
                    }
                </div>
            </div>
        `;
    }
    
    createNotificationItem(notif) {
        const iconClass = notif.type || 'info';
        const iconColor = iconClass === 'success' ? '#10b981' :
                         iconClass === 'warning' ? '#f59e0b' :
                         iconClass === 'danger' ? '#ef4444' :
                         '#3b82f6';
        
        return `
            <div class="notification-item ${notif.read ? '' : 'unread'}" 
                 data-notification-id="${notif.id}">
                <div class="notification-content">
                    <div class="notification-icon ${iconClass}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                    </div>
                    <div class="notification-text">
                        <div class="notification-message">${notif.message}</div>
                        <div class="notification-time">${this.formatTime(notif.timestamp)}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    createUserDropdown() {
        return `
            <div class="header-user-dropdown" data-dropdown="user">
                <div class="user-dropdown-header">
                    <div class="header-user-name">${this.state.userData.nomComplet}</div>
                    <div class="user-dropdown-email">${this.state.userData.email}</div>
                </div>
                <div class="user-dropdown-menu">
                    ${this.config.userMenuItems.map(item => {
                        if (item.type === 'separator') {
                            return '<hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">';
                        }
                        return `
                            <a class="user-dropdown-item ${item.danger ? 'danger' : ''}" 
                               data-action="user-menu" 
                               data-menu-id="${item.id}">
                                <span>${item.icon}</span>
                                <span>${item.text}</span>
                            </a>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    createBreadcrumbs() {
        if (!this.config.breadcrumbs || this.config.breadcrumbs.length === 0) {
            return '';
        }
        
        let html = '<div class="header-breadcrumbs">';
        
        this.config.breadcrumbs.forEach((crumb, index) => {
            const isLast = index === this.config.breadcrumbs.length - 1;
            
            if (isLast) {
                html += `<span class="breadcrumb-current">${crumb.text || crumb}</span>`;
            } else {
                html += `
                    <a href="${crumb.url || '#'}" 
                       class="breadcrumb-item" 
                       data-breadcrumb-index="${index}">
                        ${crumb.icon ? crumb.icon : ''}
                        ${crumb.text || crumb}
                    </a>
                    <span class="breadcrumb-separator">›</span>
                `;
            }
        });
        
        html += '</div>';
        return html;
    }
    
    // ========================================
    // INJECTION DANS LE DOM
    // ========================================
    
inject() {
    const container = typeof this.config.container === 'string' 
        ? document.querySelector(this.config.container)
        : this.config.container;
        
    if (!container) {
        console.error('❌ Container non trouvé:', this.config.container);
        return;
    }
    
    switch (this.config.position) {
        case 'prepend':
            container.insertBefore(this.element, container.firstChild);
            break;
        case 'append':
            container.appendChild(this.element);
            break;
        case 'replace':
            container.innerHTML = '';
            container.appendChild(this.element);
            break;
    }
    
    // Appliquer le fond de page si demandé
    if (this.config.pageBackground) {
        // Retirer les anciens fonds
        document.body.classList.remove('with-gradient-background', 'with-gradient-purple');
        
        // Appliquer le nouveau fond
        if (this.config.pageBackground === 'colorful') {
            document.body.classList.add('with-gradient-background');
        } else if (this.config.pageBackground === 'purple') {
            document.body.classList.add('with-gradient-purple');
        }
    }
    
    // Ajuster le padding du body
    if (this.config.sticky && this.config.container === 'body') {
        document.body.classList.add('has-header');
        if (this.config.showBreadcrumbs) {
            document.body.classList.add('with-breadcrumbs');
        }
    }
    
// Appliquer les styles personnalisés
    this.applyButtonStyles();
}

// ========================================
// STYLES PERSONNALISÉS - Application dynamique
// Applique les styles de boutons configurés
// ========================================
applyButtonStyles() {
    const styleId = `header-styles-${this.id}`;
    
    // Retirer l'ancien style si existe
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();
    
    // Créer le nouveau style
    const style = document.createElement('style');
    style.id = styleId;
    
    const bs = this.config.buttonStyles;
    
    style.textContent = `
        /* ========================================
           STYLES PERSONNALISÉS DES BOUTONS - ${this.id}
           ======================================== */
        
        /* Bouton retour */
        #${this.id} .header-back-btn {
            height: ${bs.back.height} !important;
            padding: ${bs.back.padding} !important;
            min-width: ${bs.back.minWidth} !important;
            white-space: nowrap !important;
        }
        
        /* Actions rapides */
        #${this.id} .header-action-btn {
            height: ${bs.action.height} !important;
            width: ${bs.action.width} !important;
        }
        
        /* Notification */
        #${this.id} .header-notification-btn {
            height: ${bs.notification.height} !important;
            width: ${bs.notification.width} !important;
        }
        
        /* Menu utilisateur - CORRECTION AJOUTÉE */
        #${this.id} .header-user-menu {
            height: ${bs.userMenu.height} !important;
            padding: ${bs.userMenu.padding} !important;
            ${bs.userMenu.maxWidth ? `max-width: ${bs.userMenu.maxWidth} !important;` : ''}
        }
        
        /* Indicateurs */
        #${this.id} .header-indicator {
            height: ${bs.indicator.height} !important;
            padding: ${bs.indicator.padding} !important;
            min-width: ${bs.indicator.minWidth || 'fit-content'} !important;
        }
        
        /* Avatar adaptatif */
        #${this.id} .header-user-avatar {
            width: calc(${bs.userMenu.height} - 8px) !important;
            height: calc(${bs.userMenu.height} - 8px) !important;
        }
        
        /* Hauteur de la barre de recherche */
        #${this.id} .header-search-input {
            height: ${this.config.searchHeight} !important;
        }

        /* Alignement global */
        #${this.id} .header-left,
        #${this.id} .header-center,
        #${this.id} .header-right {
            align-items: center !important;
        }
    `;
    
    document.head.appendChild(style);
}
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Délégation d'événements sur le header
        this.element.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]');
            if (!action) return;
            
            const actionType = action.dataset.action;
            
            switch (actionType) {
                case 'logo':
                    this.handleLogoClick();
                    break;
                case 'back':
                    this.handleBackClick();
                    break;
                case 'quick':
                    this.handleQuickAction(action.dataset.actionId);
                    break;
                case 'notifications':
                    this.toggleNotifications();
                    break;
                case 'clear-notifications':
                    this.clearNotifications();
                    break;
                case 'user':
                    this.toggleUserMenu();
                    break;
                case 'user-menu':
                    this.handleUserMenuItem(action.dataset.menuId);
                    break;
            }
        });
        
        // Événements de recherche
        if (this.config.showSearch) {
            const searchInput = this.element.querySelector('[data-action="search"]');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.handleSearch(e.target.value);
                });
                
                searchInput.addEventListener('focus', () => {
                    if (this.config.showSearchSuggestions) {
                        this.showSearchSuggestions();
                    }
                });
            }
        }
        
        // Clic sur notification
        this.element.addEventListener('click', (e) => {
            const notifItem = e.target.closest('.notification-item');
            if (notifItem) {
                const notifId = notifItem.dataset.notificationId;
                this.handleNotificationClick(notifId);
            }
        });
        
        // Clic sur breadcrumb
        if (this.config.showBreadcrumbs) {
            this.element.addEventListener('click', (e) => {
                const crumb = e.target.closest('[data-breadcrumb-index]');
                if (crumb) {
                    e.preventDefault();
                    const index = parseInt(crumb.dataset.breadcrumbIndex);
                    this.handleBreadcrumbClick(index);
                }
            });
        }
        
        // Fermer les dropdowns au clic extérieur
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target)) {
                this.closeAllDropdowns();
            }
        });
        
        // Gestion des tooltips
        this.element.querySelectorAll('.header-action-btn[data-tooltip]').forEach(btn => {
            const tooltip = btn.querySelector('.header-tooltip');
            if (tooltip) {
                btn.addEventListener('mouseenter', () => {
                    tooltip.style.display = 'block';
                });
                btn.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none';
                });
            }
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            // Alt + B : Retour
            if (e.altKey && e.key === 'b' && this.config.showBack) {
                this.handleBackClick();
            }
            // Alt + S : Focus recherche
            if (e.altKey && e.key === 's' && this.config.showSearch) {
                const searchInput = this.element.querySelector('[data-action="search"]');
                if (searchInput) searchInput.focus();
            }
            // Alt + N : Notifications
            if (e.altKey && e.key === 'n' && this.config.showNotifications) {
                this.toggleNotifications();
            }
            // Escape : Fermer les dropdowns
            if (e.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });
    }

// ========================================
// GESTION DES TOOLTIPS GLOBAUX
// Système centralisé de tooltips au niveau body
// ========================================
setupTooltips() {
    // Créer un conteneur de tooltips global s'il n'existe pas
    let tooltipContainer = document.getElementById('header-tooltips-container');
    if (!tooltipContainer) {
        tooltipContainer = document.createElement('div');
        tooltipContainer.id = 'header-tooltips-container';
        tooltipContainer.style.cssText = 'position: fixed; z-index: 1005; pointer-events: none;';
        document.body.appendChild(tooltipContainer);
    }
    
    // Pour chaque élément avec tooltip (pas seulement les action-btn)
    this.element.querySelectorAll('[data-tooltip]').forEach(btn => {
        const tooltipText = btn.getAttribute('data-tooltip');
        if (!tooltipText) return;
        
        // Créer le tooltip dans le body
        const tooltip = document.createElement('div');
        tooltip.className = 'header-global-tooltip';
        tooltip.textContent = tooltipText;
        tooltip.style.cssText = `
            position: fixed;
            padding: 6px 12px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            font-size: 12px;
            border-radius: 6px;
            white-space: nowrap;
            display: none;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            z-index: 1005;
        `;
        tooltipContainer.appendChild(tooltip);
        
        // Positionner au survol
        btn.addEventListener('mouseenter', () => {
            const rect = btn.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width/2 + 'px';
            tooltip.style.top = rect.bottom + 8 + 'px';
            tooltip.style.transform = 'translateX(-50%)';
            tooltip.style.display = 'block';
        });
        
        btn.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
        
        // Stocker la référence pour le nettoyage
        btn._tooltip = tooltip;
    });
}
    
    // ========================================
    // HANDLERS D'ÉVÉNEMENTS
    // ========================================
    
    handleLogoClick() {
        if (this.config.onLogoClick) {
            this.config.onLogoClick();
        } else if (this.config.logoUrl) {
            window.location.href = this.config.logoUrl;
        }
    }
    
    handleBackClick() {
        if (this.config.onBack) {
            this.config.onBack();
        } else if (this.config.backUrl) {
            window.location.href = this.config.backUrl;
        }
    }
    
    handleQuickAction(actionId) {
        const action = this.config.quickActions.find(a => a.id === actionId);
        if (!action) return;
        
        if (action.onClick) {
            action.onClick(action);
        } else if (this.config.onQuickAction) {
            this.config.onQuickAction(action);
        }
    }
    
    handleSearch(query) {
        this.state.searchQuery = query;
        
        // Debounce
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            if (this.config.onSearch) {
                this.config.onSearch(query);
            }
        }, this.config.searchDebounce);
    }
    
    handleNotificationClick(notifId) {
        const notif = this.state.notifications.find(n => n.id === notifId);
        if (!notif) return;
        
        // Marquer comme lu
        notif.read = true;
        this.updateNotifications();
        
        if (this.config.onNotificationClick) {
            this.config.onNotificationClick(notif);
        }
    }
    
    handleBreadcrumbClick(index) {
        const crumb = this.config.breadcrumbs[index];
        if (this.config.onBreadcrumbClick) {
            this.config.onBreadcrumbClick(crumb, index);
        } else if (crumb.url) {
            window.location.href = crumb.url;
        }
    }
    
    handleUserMenuItem(menuId) {
        const item = this.config.userMenuItems.find(i => i.id === menuId);
        if (!item) return;
        
        if (menuId === 'logout') {
            this.config.onLogout();
        } else if (item.onClick) {
            item.onClick(item);
        } else if (this.config.onUserClick) {
            this.config.onUserClick(item);
        }
        
        this.closeAllDropdowns();
    }
    
    // ========================================
    // GESTION DES DROPDOWNS
    // ========================================
    
    toggleNotifications() {
        const dropdown = this.element.querySelector('[data-dropdown="notifications"]');
        if (!dropdown) return;
        
        const isOpen = dropdown.classList.contains('active');
        
        this.closeAllDropdowns();
        
        if (!isOpen) {
            dropdown.classList.add('active');
            this.state.notificationsOpen = true;
        }
    }
    
    toggleUserMenu() {
        const dropdown = this.element.querySelector('[data-dropdown="user"]');
        if (!dropdown) return;
        
        const isOpen = dropdown.classList.contains('active');
        
        this.closeAllDropdowns();
        
        if (!isOpen) {
            dropdown.classList.add('active');
            this.state.userMenuOpen = true;
        }
    }
    
    closeAllDropdowns() {
        const dropdowns = this.element.querySelectorAll('[data-dropdown]');
        dropdowns.forEach(d => d.classList.remove('active'));
        
        this.state.notificationsOpen = false;
        this.state.userMenuOpen = false;
    }
    
    // ========================================
    // GESTION DES NOTIFICATIONS
    // ========================================
    
    loadNotifications() {
        const saved = localStorage.getItem('header_notifications');
        if (saved) {
            try {
                this.state.notifications = JSON.parse(saved);
                this.updateNotificationBadge();
            } catch (e) {
                console.error('Erreur chargement notifications:', e);
            }
        }
    }
    
    saveNotifications() {
        localStorage.setItem('header_notifications', JSON.stringify(this.state.notifications));
    }
    
    addNotification(notif) {
        const notification = {
            id: notif.id || `notif-${Date.now()}`,
            message: notif.message,
            type: notif.type || 'info',
            timestamp: notif.timestamp || Date.now(),
            read: false,
            ...notif
        };
        
        this.state.notifications.unshift(notification);
        this.updateNotifications();
    }
    
    clearNotifications() {
        this.state.notifications.forEach(n => n.read = true);
        this.updateNotifications();
        
        if (this.config.onNotificationClear) {
            this.config.onNotificationClear();
        }
    }
    
    updateNotifications() {
        this.saveNotifications();
        this.updateNotificationBadge();
        this.updateNotificationsList();
    }
    
    updateNotificationBadge() {
        const badge = this.element.querySelector('.header-notif-badge');
        const btn = this.element.querySelector('.header-notification-btn');
        const count = this.state.notifications.filter(n => !n.read).length;
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
                btn?.classList.add('has-notifications');
            } else {
                badge.style.display = 'none';
                btn?.classList.remove('has-notifications');
            }
        }
    }
    
    updateNotificationsList() {
        const list = this.element.querySelector('.notifications-list');
        if (!list) return;
        
        if (this.state.notifications.length === 0) {
            list.innerHTML = '<div style="padding: 20px; text-align: center; color: #9ca3af;">Aucune notification</div>';
        } else {
            list.innerHTML = this.state.notifications
                .map(notif => this.createNotificationItem(notif))
                .join('');
        }
    }
    
    // ========================================
    // MÉTHODES PUBLIQUES
    // ========================================
    
    setTitle(title) {
        this.config.title = title;
        const titleEl = this.element.querySelector('.header-brand');
        if (titleEl) titleEl.textContent = title;
    }
    
    setBreadcrumbs(breadcrumbs) {
        this.config.breadcrumbs = breadcrumbs;
        const container = this.element.querySelector('.header-breadcrumbs');
        if (container) {
            container.outerHTML = this.createBreadcrumbs();
        }
    }
    
    updateIndicator(indicatorId, updates) {
        const indicator = this.state.indicators.find(i => i.id === indicatorId);
        if (indicator) {
            Object.assign(indicator, updates);
            this.updateIndicators();
        }
    }
    
    updateIndicators() {
        const container = this.element.querySelector('.header-indicators');
        if (!container) return;
        
        container.innerHTML = '';
        this.state.indicators.forEach(indicator => {
            const typeClass = indicator.type === 'warning' ? 'warning' : 'online';
            container.innerHTML += `
                <div class="header-indicator ${typeClass}">
                    ${this.createIndicatorIcon(indicator.type)}
                    <span>${indicator.text}</span>
                </div>
            `;
        });
    }
    
    showProgress(percent = 0) {
        const progress = this.element.querySelector('.header-progress');
        const bar = this.element.querySelector('.header-progress-bar');
        
        if (progress && bar) {
            progress.style.display = 'block';
            bar.style.width = `${percent}%`;
        }
    }
    
    hideProgress() {
        const progress = this.element.querySelector('.header-progress');
        if (progress) {
            progress.style.display = 'none';
        }
    }
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'À l\'instant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;
        
        const date = new Date(timestamp);
        return date.toLocaleDateString('fr-FR');
    }
    
    defaultLogout() {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            localStorage.removeItem('sav_auth');
            window.location.href = '/index.html';
        }
    }
    
    redirectToLogin() {
        window.location.href = '/index.html';
    }
    
    // ========================================
    // AUTO-REFRESH
    // ========================================
    
    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            this.refresh();
        }, this.config.refreshInterval);
    }
    
    async refresh() {
        if (this.config.autoAuth) {
            const newUserData = await this.getUserData();
            
            if (JSON.stringify(newUserData) !== JSON.stringify(this.state.userData)) {
                this.state.userData = newUserData;
                this.updateUserSection();
            }
            
            if (!newUserData) {
                this.redirectToLogin();
            }
        }
    }
    
    updateUserSection() {
        const userMenu = this.element.querySelector('.header-user-menu');
        if (userMenu) {
            userMenu.innerHTML = `
                ${this.createUserAvatar()}
                <div class="header-user-info">
                    <div class="header-user-name">${this.state.userData.nomComplet}</div>
                    ${this.config.showMagasin ? `
                        <div class="header-user-role">
                            ${this.state.userData.role} • ${this.state.userData.magasin}
                        </div>
                    ` : ''}
                </div>
            `;
        }
    }
    
    // ========================================
    // ANIMATIONS
    // ========================================
    
    animate() {
        this.element.style.opacity = '0';
        this.element.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            this.element.style.transition = 'all 0.3s ease';
            this.element.style.opacity = '1';
            this.element.style.transform = 'translateY(0)';
        }, 10);
    }
    
    // ========================================
    // DESTRUCTION
    // ========================================
    
    destroy() {
        // Arrêter les timers
        clearTimeout(this.searchTimeout);
        clearInterval(this.refreshTimer);
        
        // Nettoyer les tooltips
        const tooltipContainer = document.getElementById('header-tooltips-container');
        if (tooltipContainer) {
            tooltipContainer.remove();
        }
        
        // Retirer du DOM
        if (this.element) {
            this.element.remove();
        }
        
        // Retirer les classes du body
        document.body.classList.remove('has-header', 'with-breadcrumbs');
        
        // Callback de destruction
        if (this.config.onDestroy) {
            this.config.onDestroy(this);
        }
        
        console.log('🗑️ HeaderWidget détruit');
    }
}

// Export par défaut
export default HeaderWidget;