// ========================================
// APP-HEADER.COMPONENT.JS - Composant header d'application réutilisable
// Chemin: src/components/ui/app-header/app-header.component.js
// ========================================

export class AppHeader {
    constructor(config) {
        this.id = 'app-header-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        this.config = {
            container: 'body',
            title: 'Application',
            subtitle: '',
            backUrl: null,
            user: null,
            showLogout: true,
            showMagasinDropdown: false,
            position: 'prepend',
            theme: 'default',
            
            buttonClasses: {
                back: 'btn on-dark btn-pill',
                logout: 'btn btn-danger btn-sm on-dark',
                userSection: 'header-user-section'
            },
            
            onBack: null,
            onLogout: null,
            onUserClick: null,
            
            ...config
        };
        
        if (config.buttonClasses) {
            this.config.buttonClasses = {
                ...this.config.buttonClasses,
                ...config.buttonClasses
            };
        }
        
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
        
        this.init();
    }
    
    init() {
        try {
            this.loadStyles();
            
            if (typeof this.config.container === 'string') {
                this.elements.container = document.querySelector(this.config.container);
            } else {
                this.elements.container = this.config.container;
            }
            
            if (!this.elements.container) {
                console.error('AppHeader: Container non trouvé');
                return;
            }
            
            this.render();
            this.attachEvents();
            this.state.rendered = true;
            
            console.log('✅ AppHeader initialisé:', this.id);
            
        } catch (error) {
            console.error('❌ Erreur initialisation AppHeader:', error);
        }
    }
    
    loadStyles() {
        const styleId = 'app-header-styles';
        
        if (!document.getElementById(styleId)) {
            const componentUrl = new URL(import.meta.url).href;
            const cssUrl = componentUrl.replace('.js', '.css');
            
            const link = document.createElement('link');
            link.id = styleId;
            link.rel = 'stylesheet';
            link.href = cssUrl;
            document.head.appendChild(link);
            
            console.log('📦 AppHeader styles chargés depuis:', cssUrl);
        }
    }
    
    render() {
        const header = document.createElement('header');
        header.className = `app-header theme-${this.config.theme}`;
        header.id = this.id;
        
        header.innerHTML = this.generateHTML();
        
        if (this.config.position === 'prepend') {
            this.elements.container.insertBefore(header, this.elements.container.firstChild);
        } else {
            this.elements.container.appendChild(header);
        }
        
        this.elements.header = header;
        this.cacheElements();
        
        setTimeout(() => {
            header.classList.add('loaded');
        }, 50);
    }
    
    generateHTML() {
        const hasBackButton = this.config.backUrl || this.config.onBack;
        const hasUser = this.config.user !== null;
        
        const backClasses = this.config.buttonClasses.back;
        const logoutClasses = this.config.buttonClasses.logout;
        const userSectionClasses = this.config.buttonClasses.userSection;
        
        return `
            <div class="app-header-content">
                <!-- Section gauche -->
                <div class="app-header-left">
                    ${hasBackButton ? `
                        <button class="${backClasses}" data-role="back-button">
                            <span>←</span>
                            <span>Retour</span>
                        </button>
                    ` : ''}
                </div>
                
                <!-- Section centre -->
                <div class="app-header-center">
                    <div class="header-title-section">
                        <h1 class="app-header-title">${this.config.title}</h1>
                        ${this.config.subtitle ? `
                            <p class="app-header-subtitle">${this.config.subtitle}</p>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Section droite -->
                <div class="app-header-right">
                    ${hasUser ? `
                        <div class="${userSectionClasses}">
                            <span class="user-name">${this.config.user.name || 'Utilisateur'}</span>
                            ${this.config.user.store ? `
                                <span class="user-separator"></span>
                                <span class="user-store">${this.config.user.store}</span>
                            ` : ''}
                            ${this.config.showLogout ? `
                                <span class="user-separator"></span>
                                <button class="${logoutClasses}" data-role="logout-button">
                                    Déconnexion
                                </button>
                            ` : ''}
                        </div>
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
        
        this.elements.backButton = header.querySelector('[data-role="back-button"]');
        this.elements.titleElement = header.querySelector('.app-header-title');
        this.elements.subtitleElement = header.querySelector('.app-header-subtitle');
        this.elements.userInfo = header.querySelector(`.${this.config.buttonClasses.userSection}`);
        this.elements.logoutButton = header.querySelector('[data-role="logout-button"]');
        this.elements.loadingIndicator = header.querySelector('.loading-indicator');
        
        console.log('🔍 Éléments trouvés:', {
            backButton: !!this.elements.backButton,
            logoutButton: !!this.elements.logoutButton,
            userInfo: !!this.elements.userInfo
        });
    }
    
    attachEvents() {
        if (this.elements.backButton) {
            this.elements.backButton.addEventListener('click', () => {
                this.handleBack();
            });
        }
        
        if (this.elements.logoutButton) {
            this.elements.logoutButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleLogout();
            });
        }
    }
    
    handleBack() {
        if (this.config.onBack) {
            this.config.onBack();
        } else if (this.config.backUrl) {
            window.location.href = this.config.backUrl;
        }
    }
    
    handleLogout() {
        if (this.config.onLogout) {
            this.config.onLogout();
        }
    }
    
    handleUserClick() {
        if (this.config.onUserClick && this.config.user) {
            this.config.onUserClick(this.config.user);
        }
    }
    
    setTitle(title, subtitle = '') {
        this.config.title = title;
        this.config.subtitle = subtitle;
        
        if (this.elements.titleElement) {
            this.elements.titleElement.textContent = title;
        }
        
        if (subtitle && !this.elements.subtitleElement) {
            const subtitleEl = document.createElement('p');
            subtitleEl.className = 'app-header-subtitle';
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
    
    setUser(userData) {
        this.config.user = userData;
        
        if (!userData) {
            if (this.elements.userInfo) {
                this.elements.userInfo.style.display = 'none';
            }
            return;
        }
        
        if (this.elements.userInfo) {
            const nameEl = this.elements.userInfo.querySelector('.user-name');
            const storeEl = this.elements.userInfo.querySelector('.user-store');
            
            if (nameEl) nameEl.textContent = userData.name || 'Utilisateur';
            if (storeEl) {
                if (userData.store) {
                    storeEl.textContent = userData.store;
                    storeEl.style.display = '';
                } else {
                    storeEl.style.display = 'none';
                }
            }
            
            this.elements.userInfo.style.display = '';
        }
    }
    
    showLoading() {
        this.state.loading = true;
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'flex';
        }
    }
    
    hideLoading() {
        this.state.loading = false;
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }
    }
    
    getState() {
        return {
            ...this.state,
            title: this.config.title,
            subtitle: this.config.subtitle,
            user: this.config.user
        };
    }
    
    getMagasinDropdownId() {
        if (this.config.showMagasinDropdown) {
            return `magasinDropdown-${this.id}`;
        }
        return null;
    }
    
    destroy() {
        if (this.elements.header) {
            this.elements.header.remove();
        }
        
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

export default AppHeader;