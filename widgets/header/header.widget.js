// ========================================
// HEADER.WIDGET.JS - Widget Header Intelligent
// Chemin: widgets/header/header.widget.js
//
// DESCRIPTION:
// Widget header réutilisable pour toutes les pages
// Gère automatiquement auth, navigation, user info
// ========================================

// ========================================
// HEADER.WIDGET.JS - Widget Header Intelligent
// Chemin: widgets/header/header.widget.js
// ========================================

export class HeaderWidget {
    constructor(config = {}) {
        // Charger le CSS automatiquement
        this.loadCSS();
        
        // 🔴 ICI LA CONFIG COMPLÈTE !
        this.config = {
            // Apparence
            title: config.title || 'Application',
            subtitle: config.subtitle || '',
            icon: config.icon || '',
            theme: config.theme || 'gradient',
            customClass: config.customClass || '',
            height: config.height || '70px',
            
            // Navigation
            showBack: config.showBack !== false,
            backUrl: config.backUrl || '/modules/home/home.html',
            backText: config.backText || '',
            onBack: config.onBack || null,
            
            // Utilisateur
            showUser: config.showUser !== false,
            showMagasin: config.showMagasin !== false,
            showLogout: config.showLogout !== false,
            
            // Container
            container: config.container || 'body',
            position: config.position || 'prepend',
            sticky: config.sticky !== false,
            
            // Callbacks
            onLogout: config.onLogout || this.defaultLogout.bind(this),
            onUserClick: config.onUserClick || null,
            
            // Auto-features
            autoAuth: config.autoAuth !== false,
            autoRefresh: config.autoRefresh || false,
            refreshInterval: config.refreshInterval || 60000
        };
        
        // État
        this.userData = null;
        this.element = null;
        this.refreshTimer = null;
        
        // Initialiser
        this.init();
    }
    
    // Charge le CSS automatiquement
    loadCSS() {
            // Charger buttons.css EN PREMIER
            const buttonsId = 'buttons-css';
            if (!document.getElementById(buttonsId)) {
                const buttonsLink = document.createElement('link');
                buttonsLink.id = buttonsId;
                buttonsLink.rel = 'stylesheet';
                buttonsLink.href = '/src/css/components/buttons.css';
                document.head.appendChild(buttonsLink);
            }
            
            // Puis charger le CSS du widget
            const cssId = 'header-widget-css';
            const existing = document.getElementById(cssId);
            if (existing) existing.remove();
            
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.href = `/widgets/header/header.widget.css?v=${Date.now()}`;
            document.head.appendChild(link);
            
            console.log('✅ CSS chargés : buttons.css + header.widget.css');
        }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init() {
        try {
            // 1. Récupérer les données utilisateur si autoAuth
            if (this.config.autoAuth) {
                this.userData = await this.getUserData();
                
                // Vérifier l'auth
                if (!this.userData) {
                    console.warn('⚠️ Utilisateur non authentifié');
                    this.redirectToLogin();
                    return;
                }
            }
            
            // 2. Créer le HTML
            this.createElement();
            
            // 3. Injecter dans le DOM
            this.inject();
            
            // 4. Attacher les événements
            this.attachEvents();
            
            // 5. Démarrer le refresh auto si activé
            if (this.config.autoRefresh) {
                this.startAutoRefresh();
            }
            
            // 6. Ajouter les animations
            this.animate();
            
            console.log('✅ HeaderWidget initialisé');
            
        } catch (error) {
            console.error('❌ Erreur initialisation HeaderWidget:', error);
        }
    }
    
    // ========================================
    // RÉCUPÉRATION DES DONNÉES
    // ========================================
    
    async getUserData() {
        // Récupérer depuis localStorage
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
            
            // Extraire les infos utilisateur
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
                role: user.role || 'technicien',
                magasin: magasin,
                societe: authData.societe || authData.raisonSociale || 'ORIXIS',
                email: user.email || '',
                avatar: user.avatar || null,
                permissions: user.permissions || [],
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
                <header class="header-widget ${this.config.theme} ${this.config.customClass} ${this.config.sticky ? 'sticky' : ''}"
                        style="--header-height: ${this.config.height};">
                    
                    <!-- Fond animé pour theme gradient -->
                    ${this.config.theme === 'gradient' ? '<div class="header-gradient-bg"></div>' : ''}
                    
                    <!-- Contenu principal -->
                    <div class="header-content">
                        <!-- Partie gauche -->
                        <div class="header-left">
                            ${this.createLeftSection()}
                        </div>
                        
                        <div class="header-center">
                            <div class="header-title-group">
                                <div class="header-title-line">
                                    ${this.config.icon ? `<span class="header-icon">${this.config.icon}</span>` : ''}
                                    <h1 class="header-title">${this.config.title}</h1>
                                </div>
                                ${this.config.subtitle ? `<div class="header-subtitle">${this.config.subtitle}</div>` : ''}
                            </div>
                        </div>
                        
                        <!-- Partie droite -->
                        <div class="header-right">
                            ${this.createRightSection()}
                        </div>
                    </div>
                    
                    <!-- Barre de progression (optionnelle) -->
                    <div class="header-progress" style="display: none;">
                        <div class="header-progress-bar"></div>
                    </div>
                </header>
            `;
            
            // Créer l'élément
            const temp = document.createElement('div');
            temp.innerHTML = html;
            this.element = temp.firstElementChild;
        }

        createLeftSection() {
            let html = '';
            
            if (this.config.showBack) {
                // CONTAINER VIDE pour que l'orchestrateur y mette le bouton
                html += `<div class="header-back-container" id="header-back-${this.id}"></div>`;
            }
            
            return html;
        }

        createRightSection() {
            if (!this.config.showUser && !this.config.showLogout) {
                return '';
            }
            
            let html = '<div class="header-user-section">';
            
            // Info utilisateur
            if (this.config.showUser && this.userData) {
                html += `
                    <div class="header-user-info ${this.config.onUserClick ? 'clickable' : ''}">
                        ${this.userData.avatar ? `
                            <img class="header-avatar" src="${this.userData.avatar}" alt="${this.userData.nomComplet}">
                        ` : `
                            <div class="header-avatar-placeholder">
                                ${this.userData.prenom?.[0] || 'U'}${this.userData.nom?.[0] || ''}
                            </div>
                        `}
                        <div class="header-user-details">
                            <span class="header-user-name">${this.userData.nomComplet}</span>
                            ${this.config.showMagasin ? `
                                <span class="header-user-magasin">${this.userData.magasin}</span>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
            
            // Bouton déconnexion - CONTAINER VIDE
            if (this.config.showLogout) {
                html += `<div class="header-logout-container" id="header-logout-${this.id}"></div>`;
            }
            
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
        
        // Ajuster le padding du body si sticky
        if (this.config.sticky && this.config.container === 'body') {
            document.body.style.paddingTop = this.config.height;
        }
    }
    
    // ========================================
    // ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        // Bouton retour
        const backBtn = this.element.querySelector('.header-left .btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.config.onBack) {
                    this.config.onBack();
                } else if (this.config.backUrl) {
                    window.location.href = this.config.backUrl;
                }
            });
        }
        
        // Zone utilisateur
        const userInfo = this.element.querySelector('.header-user-info.clickable');
        if (userInfo && this.config.onUserClick) {
            userInfo.addEventListener('click', () => {
                this.config.onUserClick(this.userData);
            });
        }
        
        // Bouton déconnexion
        const logoutBtn = this.element.querySelector('.header-right .btn-danger');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.config.onLogout();
            });
        }
        
        // Raccourcis clavier
        document.addEventListener('keydown', (e) => {
            // Alt + B : Retour
            if (e.altKey && e.key === 'b' && this.config.showBack) {
                backBtn?.click();
            }
            // Alt + L : Déconnexion
            if (e.altKey && e.key === 'l' && this.config.showLogout) {
                logoutBtn?.click();
            }
        });
    }
    
    // ========================================
    // FONCTIONNALITÉS AUTO
    // ========================================
    
    startAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            this.refresh();
        }, this.config.refreshInterval);
    }
    
    async refresh() {
        if (this.config.autoAuth) {
            const newUserData = await this.getUserData();
            
            // Si les données ont changé
            if (JSON.stringify(newUserData) !== JSON.stringify(this.userData)) {
                this.userData = newUserData;
                this.updateUserSection();
            }
            
            // Si plus authentifié
            if (!newUserData) {
                this.redirectToLogin();
            }
        }
    }
    
    updateUserSection() {
        const userSection = this.element.querySelector('.header-user-section');
        if (userSection) {
            userSection.innerHTML = this.createRightSection();
            // Ré-attacher les événements
            this.attachEvents();
        }
    }
    
    // ========================================
    // ANIMATIONS
    // ========================================
    
    animate() {
        // Animation d'entrée
        this.element.style.opacity = '0';
        this.element.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            this.element.style.transition = 'all 0.3s ease';
            this.element.style.opacity = '1';
            this.element.style.transform = 'translateY(0)';
        }, 10);
    }
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    defaultLogout() {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            localStorage.removeItem('sav_auth');
            window.location.href = '/index.html';
        }
    }
    
    redirectToLogin() {
        window.location.href = '/index.html';
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
    
    setTitle(title) {
        const titleEl = this.element.querySelector('.header-title');
        if (titleEl) {
            titleEl.textContent = title;
        }
        this.config.title = title;
    }
    
    setSubtitle(subtitle) {
        const subtitleEl = this.element.querySelector('.header-subtitle');
        if (subtitleEl) {
            subtitleEl.textContent = subtitle;
        }
        this.config.subtitle = subtitle;
    }
    
    // ========================================
    // DESTRUCTION
    // ========================================
    
    destroy() {
        // Arrêter le refresh
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // Retirer du DOM
        if (this.element) {
            this.element.remove();
        }
        
        // Retirer le padding du body
        if (this.config.sticky && this.config.container === 'body') {
            document.body.style.paddingTop = '';
        }
        
        console.log('🗑️ HeaderWidget détruit');
    }
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default HeaderWidget;