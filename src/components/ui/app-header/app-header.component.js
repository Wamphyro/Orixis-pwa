// ========================================
// APP-HEADER.COMPONENT.JS - Composant header d'application réutilisable
// Chemin: src/components/ui/app-header/app-header.component.js
//
// DESCRIPTION:
// Header d'application avec navigation, titre et informations utilisateur
// Composant autonome et réutilisable dans n'importe quelle page
//
// MODIFIÉ le 01/02/2025:
// - Génération d'ID autonome harmonisée
// - 100% indépendant
//
// API PUBLIQUE:
// - constructor(config)
// - setTitle(title, subtitle)
// - setUser(userData)
// - showLoading()
// - hideLoading()
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onBack: () => void
// - onLogout: () => void  
// - onUserClick: (userData) => void
//
// EXEMPLE:
// const header = new AppHeader({
//     container: 'body',
//     title: 'Ma Page',
//     user: { name: 'John Doe', store: 'Magasin Paris' },
//     onLogout: () => console.log('Déconnexion')
// });
// ========================================

export class AppHeader {
    constructor(config) {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'app-header-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // Configuration par défaut
        this.config = {
            container: 'body',      // Où insérer le header
            title: 'Application',   // Titre principal
            subtitle: '',           // Sous-titre optionnel
            backUrl: null,          // URL de retour (null = pas de bouton retour)
            user: null,             // Données utilisateur { name, store, role }
            showLogout: true,       // Afficher le bouton déconnexion
            position: 'prepend',    // prepend ou append dans le container
            theme: 'default',       // Thème visuel
            
            // Callbacks
            onBack: null,           // Callback retour
            onLogout: null,         // Callback déconnexion
            onUserClick: null,      // Callback clic sur utilisateur
            
            ...config
        };
        
        // État interne
        this.state = {
            loading: false,
            rendered: false
        };
        
        // Éléments DOM
        this.elements = {
            container: null,
            header: null,
            backButton: null,
            titleElement: null,
            subtitleElement: null,
            userInfo: null,
            logoutButton: null,
            loadingIndicator: null
        };
        
        // Initialiser
        this.init();
    }
    
    // ========================================
    // INITIALISATION ET CONFIGURATION
    // ========================================
    
    init() {
        try {
            // Charger les styles
            this.loadStyles();
            
            // Récupérer le container
            if (typeof this.config.container === 'string') {
                this.elements.container = document.querySelector(this.config.container);
            } else {
                this.elements.container = this.config.container;
            }
            
            if (!this.elements.container) {
                console.error('AppHeader: Container non trouvé');
                return;
            }
            
            // Créer et insérer le header
            this.render();
            
            // Attacher les événements
            this.attachEvents();
            
            // Marquer comme rendu
            this.state.rendered = true;
            
            console.log('✅ AppHeader initialisé:', this.id);
            
        } catch (error) {
            console.error('❌ Erreur initialisation AppHeader:', error);
        }
    }
    
    loadStyles() {
        const styleId = 'app-header-styles';
        
        if (!document.getElementById(styleId)) {
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = '../src/components/ui/app-header/app-header.css';
            document.head.appendChild(link);
            
            console.log('📦 CSS AppHeader chargé');
        }
    }
    
    // ========================================
    // RENDU ET DOM
    // ========================================
    
    render() {
        // Créer l'élément header
        const header = document.createElement('header');
        header.className = `app-header theme-${this.config.theme}`;
        header.id = this.id;
        
        // Structure HTML
        header.innerHTML = this.generateHTML();
        
        // Insérer dans le container
        if (this.config.position === 'prepend') {
            this.elements.container.insertBefore(header, this.elements.container.firstChild);
        } else {
            this.elements.container.appendChild(header);
        }
        
        // Sauvegarder les références
        this.elements.header = header;
        this.cacheElements();
    }
    
    generateHTML() {
        const hasBackButton = this.config.backUrl || this.config.onBack;
        const hasUser = this.config.user !== null;
        
        return `
            <div class="header-container">
                <!-- Section gauche -->
                <div class="header-left">
                    ${hasBackButton ? `
                        <button class="btn-back" aria-label="Retour">
                            <span class="back-icon">←</span>
                            <span class="back-text">Retour</span>
                        </button>
                    ` : ''}
                    
                    <div class="header-title-section">
                        <h1 class="header-title">${this.config.title}</h1>
                        ${this.config.subtitle ? `
                            <p class="header-subtitle">${this.config.subtitle}</p>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Section droite -->
                <div class="header-right">
                    ${hasUser ? `
                        <div class="user-info">
                            <div class="user-details">
                                <span class="user-name">${this.config.user.name || 'Utilisateur'}</span>
                                ${this.config.user.store ? `
                                    <span class="user-store">${this.config.user.store}</span>
                                ` : ''}
                            </div>
                            <div class="user-avatar">
                                ${this.getInitials(this.config.user.name)}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${hasUser && this.config.showLogout ? `
                        <button class="btn-logout" aria-label="Déconnexion">
                            <span class="logout-icon">⚡</span>
                            <span class="logout-text">Déconnexion</span>
                        </button>
                    ` : ''}
                </div>
                
                <!-- Indicateur de chargement -->
                <div class="loading-indicator" style="display: none;">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
    }
    
    cacheElements() {
        const header = this.elements.header;
        
        this.elements.backButton = header.querySelector('.btn-back');
        this.elements.titleElement = header.querySelector('.header-title');
        this.elements.subtitleElement = header.querySelector('.header-subtitle');
        this.elements.userInfo = header.querySelector('.user-info');
        this.elements.logoutButton = header.querySelector('.btn-logout');
        this.elements.loadingIndicator = header.querySelector('.loading-indicator');
    }
    
    getInitials(name) {
        if (!name) return '?';
        
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Bouton retour
        if (this.elements.backButton) {
            this.elements.backButton.addEventListener('click', () => {
                this.handleBack();
            });
        }
        
        // Info utilisateur
        if (this.elements.userInfo) {
            this.elements.userInfo.addEventListener('click', () => {
                this.handleUserClick();
            });
        }
        
        // Bouton déconnexion
        if (this.elements.logoutButton) {
            this.elements.logoutButton.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }
    
    handleBack() {
        // Callback prioritaire
        if (this.config.onBack) {
            this.config.onBack();
        }
        // Sinon navigation directe
        else if (this.config.backUrl) {
            window.location.href = this.config.backUrl;
        }
    }
    
    handleUserClick() {
        if (this.config.onUserClick && this.config.user) {
            this.config.onUserClick(this.config.user);
        }
    }
    
    handleLogout() {
        if (this.config.onLogout) {
            this.config.onLogout();
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    /**
     * Mettre à jour le titre et sous-titre
     */
    setTitle(title, subtitle = '') {
        this.config.title = title;
        this.config.subtitle = subtitle;
        
        if (this.elements.titleElement) {
            this.elements.titleElement.textContent = title;
        }
        
        if (subtitle && !this.elements.subtitleElement) {
            // Créer le sous-titre s'il n'existe pas
            const subtitleEl = document.createElement('p');
            subtitleEl.className = 'header-subtitle';
            subtitleEl.textContent = subtitle;
            this.elements.titleElement.parentNode.appendChild(subtitleEl);
            this.elements.subtitleElement = subtitleEl;
        } else if (this.elements.subtitleElement) {
            if (subtitle) {
                this.elements.subtitleElement.textContent = subtitle;
                this.elements.subtitleElement.style.display = '';
            } else {
                this.elements.subtitleElement.style.display = 'none';
            }
        }
    }
    
    /**
     * Mettre à jour les informations utilisateur
     */
    setUser(userData) {
        this.config.user = userData;
        
        if (!userData) {
            // Masquer la section utilisateur
            if (this.elements.userInfo) {
                this.elements.userInfo.style.display = 'none';
            }
            if (this.elements.logoutButton) {
                this.elements.logoutButton.style.display = 'none';
            }
            return;
        }
        
        // Mettre à jour ou créer la section utilisateur
        if (this.elements.userInfo) {
            const nameEl = this.elements.userInfo.querySelector('.user-name');
            const storeEl = this.elements.userInfo.querySelector('.user-store');
            const avatarEl = this.elements.userInfo.querySelector('.user-avatar');
            
            if (nameEl) nameEl.textContent = userData.name || 'Utilisateur';
            if (storeEl) {
                if (userData.store) {
                    storeEl.textContent = userData.store;
                    storeEl.style.display = '';
                } else {
                    storeEl.style.display = 'none';
                }
            }
            if (avatarEl) avatarEl.textContent = this.getInitials(userData.name);
            
            this.elements.userInfo.style.display = '';
            if (this.elements.logoutButton && this.config.showLogout) {
                this.elements.logoutButton.style.display = '';
            }
        }
    }
    
    /**
     * Afficher l'indicateur de chargement
     */
    showLoading() {
        this.state.loading = true;
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'flex';
        }
    }
    
    /**
     * Masquer l'indicateur de chargement
     */
    hideLoading() {
        this.state.loading = false;
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }
    }
    
    /**
     * Obtenir l'état du composant
     */
    getState() {
        return {
            ...this.state,
            title: this.config.title,
            subtitle: this.config.subtitle,
            user: this.config.user
        };
    }
    
    /**
     * Détruire le composant
     */
    destroy() {
        // Retirer du DOM
        if (this.elements.header) {
            this.elements.header.remove();
        }
        
        // Réinitialiser
        this.state = {
            loading: false,
            rendered: false
        };
        
        this.elements = {
            container: null,
            header: null,
            backButton: null,
            titleElement: null,
            subtitleElement: null,
            userInfo: null,
            logoutButton: null,
            loadingIndicator: null
        };
        
        console.log('🧹 AppHeader détruit:', this.id);
    }
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default AppHeader;