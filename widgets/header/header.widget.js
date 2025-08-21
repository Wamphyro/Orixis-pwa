/* ========================================
   HEADER.WIDGET.JS - Widget Header Glassmorphism Enhanced
   Chemin: widgets/header/header.widget.js
   
   DESCRIPTION:
   Widget header complet avec glassmorphism, recherche, notifications,
   menu utilisateur, breadcrumbs et indicateurs dynamiques.
   
   STRUCTURE DU FICHIER:
   1. IMPORTS ET CONFIGURATION
   2. CONSTRUCTEUR ET INITIALISATION
   3. CHARGEMENT CSS
   4. RÉCUPÉRATION DONNÉES
   5. CRÉATION HTML
   6. INJECTION DOM
   7. GESTION ÉVÉNEMENTS
   8. HANDLERS
   9. GESTION DROPDOWNS
   10. GESTION NOTIFICATIONS
   11. MÉTHODES PUBLIQUES
   12. UTILITAIRES
   13. AUTO-REFRESH
   14. DESTRUCTION
   
   UTILISATION:
   import { HeaderWidget } from '/Orixis-pwa/widgets/header/header.widget.js';
   const header = new HeaderWidget({
       title: 'Mon Application',
       showSearch: true,
       onSearch: (query) => console.log(query)
   });
   
   API PUBLIQUE:
   - setTitle(title) - Change le titre
   - setBreadcrumbs(array) - Met à jour les breadcrumbs
   - updateIndicator(id, updates) - Met à jour un indicateur
   - addNotification(notif) - Ajoute une notification
   - showProgress(percent) - Affiche la barre de progression
   - hideProgress() - Cache la barre de progression
   - destroy() - Détruit le widget
   
   OPTIONS PRINCIPALES:
   - title: string - Titre de l'application
   - centerTitle: boolean - Centrer le titre
   - showSearch: boolean - Afficher la recherche
   - showNotifications: boolean - Afficher les notifications
   - showUser: boolean - Afficher le menu utilisateur
   - buttonStyles: object - Personnalisation des tailles de boutons
   
   MODIFICATIONS:
   - 08/02/2025 : Refactoring complet, suppression code mort
   - 08/02/2025 : Correction z-index et tooltips
   - 08/02/2025 : Ajout support maxWidth pour userMenu
   
   AUTEUR: SAV Audition
   VERSION: 2.0.0
   ======================================== */

import { loadWidgetStyles } from '../../src/utils/widget-styles-loader.js';

// ========================================
// CLASSE PRINCIPALE
// ========================================

export class HeaderWidget {
    constructor(config = {}) {
        // ========================================
        // 1. IDENTIFIANT UNIQUE
        // ========================================
        this.id = `header-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        // ========================================
        // 2. CHARGEMENT CSS
        // ========================================
        this.loadCSS();
        
        // ========================================
        // 3. CONFIGURATION COMPLÈTE
        // ========================================
        this.config = {
            // === BASIQUE ===
            title: config.title || 'Application',
            subtitle: config.subtitle || '',
            centerTitle: config.centerTitle || false,
            theme: config.theme || 'gradient', // 'gradient' | 'solid'
            container: config.container || 'body',
            position: config.position || 'prepend', // 'prepend' | 'append' | 'replace'
            sticky: config.sticky !== false,
            pageBackground: config.pageBackground || null, // 'colorful' | 'purple' | null
            
            // === NAVIGATION ===
            showBack: config.showBack !== false,
            backUrl: config.backUrl || '/Orixis-pwa/modules/home/home.html',
            backText: config.backText || 'Retour',
            onBack: config.onBack || null,
            
            // === LOGO ===
            showLogo: config.showLogo || false,
            logoIcon: config.logoIcon || null,
            logoUrl: config.logoUrl || '/',
            onLogoClick: config.onLogoClick || null,
            
            // === RECHERCHE ===
            showSearch: config.showSearch || false,
            searchPlaceholder: config.searchPlaceholder || 'Rechercher...',
            searchDebounce: config.searchDebounce || 300,
            searchMaxWidth: config.searchMaxWidth || '600px',
            searchHeight: config.searchHeight || '40px',
            showSearchSuggestions: config.showSearchSuggestions || false,
            onSearch: config.onSearch || null,
            
            // === ACTIONS RAPIDES ===
            showQuickActions: config.showQuickActions || false,
            quickActions: config.quickActions || [],
            onQuickAction: config.onQuickAction || null,
            
            // === INDICATEURS ===
            showIndicators: config.showIndicators || false,
            indicators: config.indicators || [],
            
            // === NOTIFICATIONS ===
            showNotifications: config.showNotifications || false,
            notificationCount: config.notificationCount || 0,
            notifications: config.notifications || [],
            onNotificationClick: config.onNotificationClick || null,
            onNotificationClear: config.onNotificationClear || null,
            
            // === BREADCRUMBS ===
            showBreadcrumbs: config.showBreadcrumbs || false,
            breadcrumbs: config.breadcrumbs || [],
            onBreadcrumbClick: config.onBreadcrumbClick || null,
            
            // === UTILISATEUR ===
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
            
            // === AUTO FEATURES ===
            autoAuth: config.autoAuth !== false,
            autoRefresh: config.autoRefresh || false,
            refreshInterval: config.refreshInterval || 60000,
            
            // === PERSONNALISATION BOUTONS ===
            buttonStyles: {
                back: {
                    height: '40px',
                    padding: '10px 20px',
                    minWidth: 'auto',
                    ...config.buttonStyles?.back
                },
                action: {
                    height: '40px',
                    width: '40px',
                    ...config.buttonStyles?.action
                },
                notification: {
                    height: '44px',
                    width: '44px',
                    ...config.buttonStyles?.notification
                },
                userMenu: {
                    height: '44px',
                    padding: '6px 14px 6px 6px',
                    maxWidth: '250px',
                    ...config.buttonStyles?.userMenu
                },
                indicator: {
                    height: '36px',
                    padding: '8px 14px',
                    minWidth: 'auto',
                    ...config.buttonStyles?.indicator
                }
            },
            
            // === CALLBACKS ===
            onInit: config.onInit || null,
            onDestroy: config.onDestroy || null
        };
        
        // ========================================
        // 4. ÉTAT INTERNE
        // ========================================
        this.state = {
            userData: null,
            searchQuery: '',
            searchSuggestions: [],
            notificationsOpen: false,
            userMenuOpen: false,
            indicators: [...this.config.indicators],
            notifications: [...this.config.notifications],
            loaded: false
        };
        
        // ========================================
        // 5. RÉFÉRENCES DOM
        // ========================================
        this.elements = {
            container: null,
            mainElement: null,
            searchInput: null,
            notificationBadge: null,
            notificationBtn: null,
            userMenu: null,
            progressBar: null
        };
        
        // ========================================
        // 6. TIMERS
        // ========================================
        this.searchTimeout = null;
        this.refreshTimer = null;
        
        // ========================================
        // 7. INITIALISATION
        // ========================================
        this.init();
    }
    
    // ========================================
    // CHARGEMENT CSS
    // ========================================
    
    /**
     * Charge les styles du widget avec anti-cache
     */
    loadCSS() {
        // Charger les styles communs
        loadWidgetStyles();
        
        // Charger le CSS spécifique
        const cssId = 'header-widget-enhanced-css';
        const existing = document.getElementById(cssId);
        if (existing) existing.remove();
        
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = '/Orixis-pwa/widgets/header/header.widget.css?v=${Date.now()}`;
        document.head.appendChild(link);
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    /**
     * Initialisation asynchrone du widget
     */
    async init() {
        try {
            // Récupérer les données utilisateur si auth activée
            if (this.config.autoAuth) {
                this.state.userData = await this.getUserData();
                if (!this.state.userData) {
                    console.warn('⚠️ Utilisateur non authentifié');
                    this.redirectToLogin();
                    return;
                }
            }
            
            // Créer et injecter le HTML
            this.createElement();
            this.inject();
            
            // Configurer les interactions
            this.attachEvents();
            this.setupTooltips();
            this.setupDropdowns();
            
            // Charger les données
            if (this.config.showNotifications) {
                this.loadNotifications();
            }
            
            // Démarrer l'auto-refresh si activé
            if (this.config.autoRefresh) {
                this.startAutoRefresh();
            }
            
            // Animation d'entrée
            this.animate();
            
            // Marquer comme chargé
            this.state.loaded = true;
            
            // Callback d'initialisation
            if (this.config.onInit) {
                this.config.onInit(this);
            }
            
            console.log('✅ HeaderWidget initialisé:', this.id);
            
        } catch (error) {
            console.error('❌ Erreur init HeaderWidget:', error);
        }
    }
    
    // ========================================
    // RÉCUPÉRATION DONNÉES UTILISATEUR
    // ========================================
    
    /**
     * Récupère les données utilisateur depuis localStorage
     * @returns {Object|null} Données utilisateur ou null
     */
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
    
    /**
     * Crée l'élément HTML principal du header
     */
    createElement() {
        const html = `
            <header class="header-widget theme-${this.config.theme} ${this.config.sticky ? 'sticky' : ''} ${this.config.centerTitle ? 'has-centered-title' : ''}" 
                    id="${this.id}">
                
                ${this.config.centerTitle ? this.createTitleRow() : ''}
                
                <div class="header-content">
                    <!-- Section gauche -->
                    <div class="header-left">
                        ${this.createLeftSection()}
                    </div>
                    
                    <!-- Section centrale -->
                    <div class="header-center">
                        ${this.createCenterContent()}
                    </div>
                    
                    <!-- Section droite -->
                    <div class="header-right">
                        ${this.createRightSection()}
                    </div>
                </div>
                
                ${this.config.showBreadcrumbs ? this.createBreadcrumbs() : ''}
                
                <!-- Barre de progression -->
                <div class="header-progress" style="display: none;">
                    <div class="header-progress-bar"></div>
                </div>
            </header>
        `;
        
        const temp = document.createElement('div');
        temp.innerHTML = html;
        this.elements.mainElement = temp.firstElementChild;
    }
    
    /**
     * Crée la ligne de titre centrée
     */
    createTitleRow() {
        return `
            <div class="header-title-row">
                <div class="header-title-group">
                    <h1 class="header-brand-centered">${this.config.title}</h1>
                    ${this.config.subtitle ? `<p class="header-subtitle-centered">${this.config.subtitle}</p>` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Crée la section gauche du header
     */
    createLeftSection() {
        let html = '';
        
        // Logo
        if (this.config.showLogo && this.config.logoIcon) {
            html += `
                <div class="header-logo" data-action="logo" data-tooltip="Accueil">
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
    
    /**
     * Crée le contenu de la section centrale
     */
    createCenterContent() {
        if (!this.config.showSearch) return '';
        
        return `
            <div class="header-search-wrapper">
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
            </div>
        `;
    }
    
/**
 * Crée la section droite du header
 */
createRightSection() {
    let html = '';
    
    // Indicateurs
    if (this.config.showIndicators && this.state.indicators.length > 0) {
        html += '<div class="header-indicators">';
        this.state.indicators.forEach(indicator => {
            const typeClass = indicator.type === 'warning' ? 'warning' : 
                             indicator.type === 'danger' ? 'danger' : 
                             indicator.type === 'info' ? 'info' : 'success';
            html += `
                <div class="header-indicator ${typeClass}" data-indicator-id="${indicator.id}">
                    ${this.createIndicatorIcon(indicator.type)}
                    <span>${indicator.text}</span>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Notifications - SANS DROPDOWN
    if (this.config.showNotifications) {
        const count = this.state.notifications.filter(n => !n.read).length;
        html += `
            <button class="header-notification-btn ${count > 0 ? 'has-notifications' : ''}" 
                    data-action="notifications"
                    data-tooltip="${count} notification(s)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                ${count > 0 ? `<span class="header-notif-badge">${count > 99 ? '99+' : count}</span>` : ''}
            </button>
        `;
    }
    
    // Menu utilisateur - SANS DROPDOWN
    if (this.config.showUser && this.state.userData) {
        html += `
            <div class="header-user-menu" data-action="user" data-tooltip="${this.state.userData.nomComplet}">
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
        `;
    }
    
    return html;
}
    
    /**
     * Crée l'icône d'indicateur
     */
    createIndicatorIcon(type) {
        const color = type === 'success' ? '#48bb78' : 
                     type === 'warning' ? '#fbbf24' : 
                     type === 'danger' ? '#ef4444' :
                     '#3b82f6';
        
        return `
            <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="4" fill="${color}" opacity="0.3"/>
                <circle cx="12" cy="12" r="2" fill="${color}"/>
                ${type === 'success' || type === 'warning' ? 
                    `<circle cx="12" cy="12" r="6" stroke="${color}" stroke-width="1" opacity="0.2"/>` : ''
                }
            </svg>
        `;
    }
    
    /**
     * Crée l'avatar utilisateur
     */
    createUserAvatar() {
        if (this.state.userData.avatar) {
            return `
                <div class="header-user-avatar with-image">
                    <img src="${this.state.userData.avatar}" alt="${this.state.userData.nomComplet}">
                </div>
            `;
        }
        return `
            <div class="header-user-avatar placeholder">
                ${this.state.userData.initiales}
            </div>
        `;
    }
    
    /**
     * Crée le dropdown des notifications
     */
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
                        '<div class="empty-state">Aucune notification</div>'
                    }
                </div>
            </div>
        `;
    }
    
    /**
     * Crée un élément de notification
     */
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
    
    /**
     * Crée le dropdown du menu utilisateur
     */
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
                            return '<hr class="dropdown-separator">';
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
    
    /**
     * Crée les breadcrumbs
     */
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
    
    /**
     * Injecte le widget dans le DOM
     */
    inject() {
        const container = typeof this.config.container === 'string' 
            ? document.querySelector(this.config.container)
            : this.config.container;
            
        if (!container) {
            console.error('❌ Container non trouvé:', this.config.container);
            return;
        }
        
        // Stocker la référence
        this.elements.container = container;
        
        // Injecter selon la position
        switch (this.config.position) {
            case 'prepend':
                container.insertBefore(this.elements.mainElement, container.firstChild);
                break;
            case 'append':
                container.appendChild(this.elements.mainElement);
                break;
            case 'replace':
                container.innerHTML = '';
                container.appendChild(this.elements.mainElement);
                break;
        }
        
        // Appliquer le fond de page si configuré
        if (this.config.pageBackground) {
            document.body.classList.remove('with-gradient-background', 'with-gradient-purple');
            
            if (this.config.pageBackground === 'colorful') {
                document.body.classList.add('with-gradient-background');
            } else if (this.config.pageBackground === 'purple') {
                document.body.classList.add('with-gradient-purple');
            }
        }
        
        // Ajuster le padding du body si sticky
        if (this.config.sticky && this.config.container === 'body') {
            document.body.classList.add('has-header');
            if (this.config.showBreadcrumbs) {
                document.body.classList.add('with-breadcrumbs');
            }
        }
        
        // Appliquer les styles personnalisés des boutons
        this.applyButtonStyles();
        
        // Stocker les références aux éléments importants
        this.elements.searchInput = this.elements.mainElement.querySelector('[data-action="search"]');
        this.elements.notificationBadge = this.elements.mainElement.querySelector('.header-notif-badge');
        this.elements.notificationBtn = this.elements.mainElement.querySelector('.header-notification-btn');
        this.elements.userMenu = this.elements.mainElement.querySelector('.header-user-menu');
        this.elements.progressBar = this.elements.mainElement.querySelector('.header-progress-bar');
    }
    
    /**
     * Applique les styles personnalisés des boutons
     */
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
               STYLES PERSONNALISÉS - ${this.id}
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
            
            /* Menu utilisateur */
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
    
    /**
     * Attache tous les événements au widget
     */
    attachEvents() {
        // Délégation d'événements sur le header principal
        this.elements.mainElement.addEventListener('click', (e) => {
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
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            this.elements.searchInput.addEventListener('focus', () => {
                if (this.config.showSearchSuggestions) {
                    this.showSearchSuggestions();
                }
            });
        }
        
        // Clic sur notification
        this.elements.mainElement.addEventListener('click', (e) => {
            const notifItem = e.target.closest('.notification-item');
            if (notifItem) {
                const notifId = notifItem.dataset.notificationId;
                this.handleNotificationClick(notifId);
            }
        });
        
        // Clic sur breadcrumb
        if (this.config.showBreadcrumbs) {
            this.elements.mainElement.addEventListener('click', (e) => {
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
            if (!this.elements.mainElement.contains(e.target)) {
                this.closeAllDropdowns();
            }
        });
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            // Alt + B : Retour
            if (e.altKey && e.key === 'b' && this.config.showBack) {
                this.handleBackClick();
            }
            // Alt + S : Focus recherche
            if (e.altKey && e.key === 's' && this.elements.searchInput) {
                this.elements.searchInput.focus();
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
    
    /**
     * Configure le système de tooltips globaux
     */
    setupTooltips() {
        // Créer un conteneur de tooltips global s'il n'existe pas
        let tooltipContainer = document.getElementById('header-tooltips-container');
        if (!tooltipContainer) {
            tooltipContainer = document.createElement('div');
            tooltipContainer.id = 'header-tooltips-container';
            tooltipContainer.style.cssText = 'position: fixed; z-index: 1005; pointer-events: none;';
            document.body.appendChild(tooltipContainer);
        }
        
        // Pour chaque élément avec tooltip
        this.elements.mainElement.querySelectorAll('[data-tooltip]').forEach(btn => {
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

/**
 * Configure les dropdowns globaux (hors contexte comme les tooltips)
 */
setupDropdowns() {
    // Créer un conteneur de dropdowns global s'il n'existe pas
    let dropdownContainer = document.getElementById('header-dropdowns-container');
    if (!dropdownContainer) {
        dropdownContainer = document.createElement('div');
        dropdownContainer.id = 'header-dropdowns-container';
        document.body.appendChild(dropdownContainer);
    }
    
    // Créer le dropdown notifications si nécessaire
    if (this.config.showNotifications) {
        const notifDropdown = document.createElement('div');
        notifDropdown.className = 'glass-dropdown glass-notifications';  // ← CLASSES DIFFÉRENTES
        notifDropdown.setAttribute('data-dropdown', 'notifications');
        notifDropdown.innerHTML = `
            <div class="glass-dropdown-header">
                <span class="glass-dropdown-title">Notifications</span>
                <span class="glass-dropdown-action" data-action="clear-notifications">
                    Tout marquer comme lu
                </span>
            </div>
            <div class="glass-dropdown-list">
                ${this.state.notifications.length > 0 ? 
                    this.state.notifications.map(notif => `
                        <div class="glass-notif-item ${notif.read ? '' : 'unread'}" 
                             data-notification-id="${notif.id}">
                            <div class="glass-notif-icon ${notif.type || 'info'}">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <path d="M12 6v6l4 2"/>
                                </svg>
                            </div>
                            <div class="glass-notif-content">
                                <div class="glass-notif-message">${notif.message}</div>
                                <div class="glass-notif-time">${this.formatTime(notif.timestamp)}</div>
                            </div>
                        </div>
                    `).join('') :
                    '<div class="glass-empty">Aucune notification</div>'
                }
            </div>
        `;
        dropdownContainer.appendChild(notifDropdown);
        this.elements.notificationDropdown = notifDropdown;
    }
    
    // Créer le dropdown user si nécessaire
    if (this.config.showUserDropdown && this.state.userData) {
        const userDropdown = document.createElement('div');
        userDropdown.className = 'glass-dropdown glass-user';  // ← CLASSES DIFFÉRENTES
        userDropdown.setAttribute('data-dropdown', 'user');
        userDropdown.innerHTML = `
            <div class="glass-dropdown-header">
                <div class="glass-user-name">${this.state.userData.nomComplet}</div>
                <div class="glass-user-email">${this.state.userData.email}</div>
            </div>
            <div class="glass-dropdown-menu">
                ${this.config.userMenuItems.map(item => {
                    if (item.type === 'separator') {
                        return '<hr class="glass-separator">';
                    }
                    return `
                        <a class="glass-menu-item ${item.danger ? 'danger' : ''}" 
                           data-action="user-menu" 
                           data-menu-id="${item.id}">
                            <span>${item.icon}</span>
                            <span>${item.text}</span>
                        </a>
                    `;
                }).join('')}
            </div>
        `;
        dropdownContainer.appendChild(userDropdown);
        this.elements.userDropdown = userDropdown;
    }
    
    // Attacher les événements sur le conteneur global
    dropdownContainer.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]');
        if (!action) return;
        
        const actionType = action.dataset.action;
        
        switch (actionType) {
            case 'clear-notifications':
                this.clearNotifications();
                break;
            case 'user-menu':
                this.handleUserMenuItem(action.dataset.menuId);
                break;
        }
        
        // Gérer aussi les clics sur les notifications
        const notifItem = e.target.closest('.glass-notif-item');
        if (notifItem) {
            const notifId = notifItem.dataset.notificationId;
            this.handleNotificationClick(notifId);
        }
    });
}

/**
 * Bascule l'affichage des notifications
 */
toggleNotifications() {
    if (!this.elements.notificationDropdown) return;
    
    const btn = this.elements.notificationBtn;
    const dropdown = this.elements.notificationDropdown;
    
    const isOpen = dropdown.classList.contains('active');
    
    this.closeAllDropdowns();
    
    if (!isOpen) {
        // Positionner le dropdown par rapport au bouton
        const rect = btn.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + 8) + 'px';
        dropdown.style.right = (window.innerWidth - rect.right) + 'px';
        dropdown.classList.add('active');
        this.state.notificationsOpen = true;
    }
}

/**
 * Bascule l'affichage du menu utilisateur
 */
toggleUserMenu() {
    if (!this.elements.userDropdown) return;
    
    const menu = this.elements.userMenu;
    const dropdown = this.elements.userDropdown;
    
    const isOpen = dropdown.classList.contains('active');
    
    this.closeAllDropdowns();
    
    if (!isOpen) {
        // Positionner le dropdown par rapport au menu
        const rect = menu.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + 8) + 'px';
        dropdown.style.right = (window.innerWidth - rect.right) + 'px';
        dropdown.classList.add('active');
        this.state.userMenuOpen = true;
    }
}

/**
 * Ferme tous les dropdowns
 */
closeAllDropdowns() {
    if (this.elements.notificationDropdown) {
        this.elements.notificationDropdown.classList.remove('active');
    }
    if (this.elements.userDropdown) {
        this.elements.userDropdown.classList.remove('active');
    }
    
    this.state.notificationsOpen = false;
    this.state.userMenuOpen = false;
}
    
    // ========================================
    // HANDLERS D'ÉVÉNEMENTS
    // ========================================
    
    /**
     * Gère le clic sur le logo
     */
    handleLogoClick() {
        if (this.config.onLogoClick) {
            this.config.onLogoClick();
        } else if (this.config.logoUrl) {
            window.location.href = this.config.logoUrl;
        }
    }
    
    /**
     * Gère le clic sur le bouton retour
     */
    handleBackClick() {
        if (this.config.onBack) {
            this.config.onBack();
        } else if (this.config.backUrl) {
            window.location.href = this.config.backUrl;
        }
    }
    
    /**
     * Gère le clic sur une action rapide
     */
    handleQuickAction(actionId) {
        const action = this.config.quickActions.find(a => a.id === actionId);
        if (!action) return;
        
        if (action.onClick) {
            action.onClick(action);
        } else if (this.config.onQuickAction) {
            this.config.onQuickAction(action);
        }
    }
    
    /**
     * Gère la recherche avec debounce
     */
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
    
    /**
     * Gère le clic sur une notification
     */
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
    
    /**
     * Gère le clic sur un breadcrumb
     */
    handleBreadcrumbClick(index) {
        const crumb = this.config.breadcrumbs[index];
        if (this.config.onBreadcrumbClick) {
            this.config.onBreadcrumbClick(crumb, index);
        } else if (crumb.url) {
            window.location.href = crumb.url;
        }
    }
    
    /**
     * Gère le clic sur un élément du menu utilisateur
     */
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
    
    /**
     * Bascule l'affichage des notifications
     */
    toggleNotifications() {
        if (!this.elements.notificationDropdown) return;
        
        const btn = this.elements.notificationBtn;
        const dropdown = this.elements.notificationDropdown;
        
        const isOpen = dropdown.style.display === 'block';
        
        this.closeAllDropdowns();
        
        if (!isOpen) {
            // Positionner le dropdown par rapport au bouton
            const rect = btn.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + 8) + 'px';
            dropdown.style.right = (window.innerWidth - rect.right) + 'px';
            dropdown.style.display = 'block';
            this.state.notificationsOpen = true;
        }
    }
    
    /**
     * Bascule l'affichage du menu utilisateur
     */
    toggleUserMenu() {
        if (!this.elements.userDropdown) return;
        
        const menu = this.elements.userMenu;
        const dropdown = this.elements.userDropdown;
        
        const isOpen = dropdown.style.display === 'block';
        
        this.closeAllDropdowns();
        
        if (!isOpen) {
            // Positionner le dropdown par rapport au menu
            const rect = menu.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + 8) + 'px';
            dropdown.style.right = (window.innerWidth - rect.right) + 'px';
            dropdown.style.display = 'block';
            this.state.userMenuOpen = true;
        }
    }
    
    /**
     * Affiche les suggestions de recherche
     */
    showSearchSuggestions() {
        const dropdown = this.elements.mainElement.querySelector('[data-dropdown="search"]');
        if (dropdown && this.state.searchSuggestions.length > 0) {
            dropdown.classList.add('active');
        }
    }
    
    /**
     * Ferme tous les dropdowns
     */
    closeAllDropdowns() {
        if (this.elements.notificationDropdown) {
            this.elements.notificationDropdown.style.display = 'none';
        }
        if (this.elements.userDropdown) {
            this.elements.userDropdown.style.display = 'none';
        }
        
        this.state.notificationsOpen = false;
        this.state.userMenuOpen = false;
    }
    
    // ========================================
    // GESTION DES NOTIFICATIONS
    // ========================================
    
    /**
     * Charge les notifications depuis localStorage
     */
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
    
    /**
     * Sauvegarde les notifications dans localStorage
     */
    saveNotifications() {
        localStorage.setItem('header_notifications', JSON.stringify(this.state.notifications));
    }
    
    /**
     * Ajoute une notification
     */
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
    
    /**
     * Marque toutes les notifications comme lues
     */
    clearNotifications() {
        this.state.notifications.forEach(n => n.read = true);
        this.updateNotifications();
        
        if (this.config.onNotificationClear) {
            this.config.onNotificationClear();
        }
    }
    
    /**
     * Met à jour l'affichage des notifications
     */
    updateNotifications() {
        this.saveNotifications();
        this.updateNotificationBadge();
        this.updateNotificationsList();
    }
    
    /**
     * Met à jour le badge de notifications
     */
    updateNotificationBadge() {
        const count = this.state.notifications.filter(n => !n.read).length;
        
        if (this.elements.notificationBadge) {
            if (count > 0) {
                this.elements.notificationBadge.textContent = count > 99 ? '99+' : count;
                this.elements.notificationBadge.style.display = 'flex';
                this.elements.notificationBtn?.classList.add('has-notifications');
            } else {
                this.elements.notificationBadge.style.display = 'none';
                this.elements.notificationBtn?.classList.remove('has-notifications');
            }
        }
    }
    
    /**
     * Met à jour la liste des notifications
     */
    updateNotificationsList() {
        const list = this.elements.mainElement.querySelector('.notifications-list');
        if (!list) return;
        
        if (this.state.notifications.length === 0) {
            list.innerHTML = '<div class="empty-state">Aucune notification</div>';
        } else {
            list.innerHTML = this.state.notifications
                .map(notif => this.createNotificationItem(notif))
                .join('');
        }
    }
    
    // ========================================
    // MÉTHODES PUBLIQUES
    // ========================================
    
    /**
     * Change le titre du header
     */
    setTitle(title) {
        this.config.title = title;
        
        // Mettre à jour tous les endroits où le titre apparaît
        const brandEl = this.elements.mainElement.querySelector('.header-brand');
        if (brandEl) brandEl.textContent = title;
        
        const brandCenteredEl = this.elements.mainElement.querySelector('.header-brand-centered');
        if (brandCenteredEl) brandCenteredEl.textContent = title;
    }
    
    /**
     * Met à jour les breadcrumbs
     */
    setBreadcrumbs(breadcrumbs) {
        this.config.breadcrumbs = breadcrumbs;
        const container = this.elements.mainElement.querySelector('.header-breadcrumbs');
        if (container) {
            container.outerHTML = this.createBreadcrumbs();
        }
    }
    
    /**
     * Met à jour un indicateur
     */
    updateIndicator(indicatorId, updates) {
        const indicator = this.state.indicators.find(i => i.id === indicatorId);
        if (indicator) {
            Object.assign(indicator, updates);
            this.updateIndicators();
        }
    }
    
    /**
     * Met à jour tous les indicateurs
     */
    updateIndicators() {
        const container = this.elements.mainElement.querySelector('.header-indicators');
        if (!container) return;
        
        container.innerHTML = '';
        this.state.indicators.forEach(indicator => {
            const typeClass = indicator.type === 'warning' ? 'warning' : 
                             indicator.type === 'danger' ? 'danger' : 
                             indicator.type === 'info' ? 'info' : 'success';
            container.innerHTML += `
                <div class="header-indicator ${typeClass}" data-indicator-id="${indicator.id}">
                    ${this.createIndicatorIcon(indicator.type)}
                    <span>${indicator.text}</span>
                </div>
            `;
        });
    }
    
    /**
     * Affiche la barre de progression
     */
    showProgress(percent = 0) {
        const progress = this.elements.mainElement.querySelector('.header-progress');
        
        if (progress && this.elements.progressBar) {
            progress.style.display = 'block';
            this.elements.progressBar.style.width = `${percent}%`;
        }
    }
    
    /**
     * Cache la barre de progression
     */
    hideProgress() {
        const progress = this.elements.mainElement.querySelector('.header-progress');
        if (progress) {
            progress.style.display = 'none';
        }
    }
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    /**
     * Formate un timestamp en texte relatif
     */
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
    
    /**
     * Action de déconnexion par défaut
     */
    defaultLogout() {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            localStorage.removeItem('sav_auth');
            window.location.href = '/index.html';
        }
    }
    
    /**
     * Redirige vers la page de connexion
     */
    redirectToLogin() {
        window.location.href = '/index.html';
    }
    
    // ========================================
    // AUTO-REFRESH
    // ========================================
    
    /**
     * Démarre l'auto-refresh
     */
    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            this.refresh();
        }, this.config.refreshInterval);
    }
    
    /**
     * Rafraîchit les données utilisateur
     */
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
    
    /**
     * Met à jour la section utilisateur
     */
    updateUserSection() {
        if (this.elements.userMenu) {
            this.elements.userMenu.innerHTML = `
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
    
    /**
     * Animation d'entrée du widget
     */
    animate() {
        this.elements.mainElement.style.opacity = '0';
        this.elements.mainElement.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            this.elements.mainElement.style.transition = 'all 0.3s ease';
            this.elements.mainElement.style.opacity = '1';
            this.elements.mainElement.style.transform = 'translateY(0)';
        }, 10);
    }
    
    // ========================================
    // DESTRUCTION
    // ========================================
    
    /**
     * Détruit proprement le widget
     */
    destroy() {
        // Arrêter les timers
        clearTimeout(this.searchTimeout);
        clearInterval(this.refreshTimer);
        
        // Nettoyer les tooltips
        const tooltipContainer = document.getElementById('header-tooltips-container');
        if (tooltipContainer) {
            tooltipContainer.remove();
        }

        // Dans destroy(), après le nettoyage des tooltips
        const dropdownContainer = document.getElementById('header-dropdowns-container');
        if (dropdownContainer) {
            dropdownContainer.remove();
        }
        
        // Retirer les styles personnalisés
        const customStyle = document.getElementById(`header-styles-${this.id}`);
        if (customStyle) {
            customStyle.remove();
        }
        
        // Retirer du DOM
        if (this.elements.mainElement) {
            this.elements.mainElement.remove();
        }
        
        // Retirer les classes du body
        document.body.classList.remove('has-header', 'with-breadcrumbs', 'with-gradient-background', 'with-gradient-purple');
        
        // Réinitialiser l'état
        this.state = {
            userData: null,
            searchQuery: '',
            searchSuggestions: [],
            notificationsOpen: false,
            userMenuOpen: false,
            indicators: [],
            notifications: [],
            loaded: false
        };
        
        // Réinitialiser les éléments
        this.elements = {
            container: null,
            mainElement: null,
            searchInput: null,
            notificationBadge: null,
            notificationBtn: null,
            userMenu: null,
            progressBar: null
        };
        
        // Callback de destruction
        if (this.config.onDestroy) {
            this.config.onDestroy(this);
        }
        
        console.log('🗑️ HeaderWidget détruit:', this.id);
    }
}

// Export par défaut
export default HeaderWidget;