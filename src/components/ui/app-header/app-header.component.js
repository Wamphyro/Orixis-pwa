// ========================================
// APP-HEADER.COMPONENT.JS - Composant header d'application réutilisable
// Chemin: src/components/ui/app-header/app-header.component.js
//
// DESCRIPTION:
// Header d'application avec navigation, titre et informations utilisateur
// Composant autonome et réutilisable dans n'importe quelle page
//
// MODIFIÉ le 05/02/2025:
// - Correction de l'affichage des boutons retour et déconnexion
// - Utilisation de data-role pour identifier les boutons
// - Suppression du clic sur la section utilisateur
//
// MODIFIÉ le 01/02/2025:
// - Support des classes CSS personnalisables via config
// - Le composant ne connaît pas les classes, l'orchestrateur décide
//
// MODIFIÉ le 29/12/2024:
// - Correction du chemin CSS pour support multi-niveaux
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
//     buttonClasses: {
//         back: 'btn on-dark btn-pill',
//         logout: 'btn btn-danger btn-sm on-dark',
//         userSection: 'header-user-section'
//     },
//     onLogout: () => console.log('Déconnexion')
// });
// ========================================

export class AppHeader {
    constructor(config) {
        // ========================================
        // GÉNÉRATION D'ID UNIQUE
        // ========================================
        this.id = 'app-header-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        // ========================================
        // CONFIGURATION PAR DÉFAUT
        // ========================================
        this.config = {
            container: 'body',      // Où insérer le header
            title: 'Application',   // Titre principal
            subtitle: '',           // Sous-titre optionnel
            backUrl: null,          // URL de retour (null = pas de bouton retour)
            user: null,             // Données utilisateur { name, store, role }
            showLogout: true,       // Afficher le bouton déconnexion
            showMagasinDropdown: false, // Afficher un dropdown pour changer de magasin
            position: 'prepend',    // prepend ou append dans le container
            theme: 'default',       // Thème visuel
            
            // Classes CSS personnalisables (l'orchestrateur décide)
            buttonClasses: {
                back: 'btn on-dark btn-pill',              // Classes pour bouton retour
                logout: 'btn btn-danger btn-sm on-dark',   // Classes pour bouton déconnexion
                userSection: 'header-user-section'         // Classes pour section utilisateur
            },
            
            // Callbacks
            onBack: null,           // Callback retour
            onLogout: null,         // Callback déconnexion
            onUserClick: null,      // Callback clic sur utilisateur
            
            ...config
        };
        
        // ========================================
        // MERGER LES CLASSES SI PARTIELLES
        // ========================================
        if (config.buttonClasses) {
            this.config.buttonClasses = {
                ...this.config.buttonClasses,
                ...config.buttonClasses
            };
        }
        
        // ========================================
        // ÉTAT INTERNE
        // ========================================
        this.state = {
            loading: false,
            rendered: false
        };
        
        // ========================================
        // RÉFÉRENCES DOM
        // ========================================
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
        
        // Initialiser le composant
        this.init();
    }
    
    // ========================================
    // INITIALISATION ET CONFIGURATION
    // ========================================
    
    /**
     * Initialise le composant
     */
    init() {
        try {
            // Charger les styles CSS
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
    
    /**
     * Charge les styles CSS du composant
     */
    loadStyles() {
        const styleId = 'app-header-styles';
        
        if (!document.getElementById(styleId)) {
            // Chemin dynamique basé sur l'emplacement du JS
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
    
    // ========================================
    // RENDU ET DOM
    // ========================================
    
    /**
     * Effectue le rendu du header dans le DOM
     */
    render() {
        // Créer l'élément header
        const header = document.createElement('header');
        header.className = `app-header theme-${this.config.theme}`;
        header.id = this.id;
        
        // Générer la structure HTML
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
        
        // Ajouter la classe loaded après un court délai (anti-FOUC)
        setTimeout(() => {
            header.classList.add('loaded');
        }, 50);
    }
    
    /**
     * Génère le HTML du header
     * @returns {string} HTML du header
     */
    generateHTML() {
        const hasBackButton = this.config.backUrl || this.config.onBack;
        const hasUser = this.config.user !== null;
        
        // Récupérer les classes depuis la config
        const backClasses = this.config.buttonClasses.back;
        const logoutClasses = this.config.buttonClasses.logout;
        const userSectionClasses = this.config.buttonClasses.userSection;
        
        return `
            <div class="app-header-content">
                <!-- ======================================== -->
                <!-- SECTION GAUCHE : BOUTON RETOUR -->
                <!-- ======================================== -->
                <div class="app-header-left">
                    ${hasBackButton ? `
                        <button class="${backClasses}" data-role="back-button" aria-label="Retour">
                            <span class="back-icon">←</span>
                            <span class="back-text">Retour</span>
                        </button>
                    ` : ''}
                </div>
                
                <!-- ======================================== -->
                <!-- SECTION CENTRE : TITRE -->
                <!-- ======================================== -->
                <div class="app-header-center">
                    <div class="header-title-section">
                        <h1 class="app-header-title">${this.config.title}</h1>
                        ${this.config.subtitle ? `
                            <p class="app-header-subtitle">${this.config.subtitle}</p>
                        ` : ''}
                    </div>
                </div>
                
                <!-- ======================================== -->
                <!-- SECTION DROITE : UTILISATEUR -->
                <!-- ======================================== -->
                <div class="app-header-right">
                    ${hasUser ? `
                        <div class="${userSectionClasses}">
                            <!-- Nom utilisateur -->
                            <span class="user-name">${this.config.user.name || 'Utilisateur'}</span>
                            
                            <!-- Code magasin si présent -->
                            ${this.config.user.store ? `
                                <span class="user-separator"></span>
                                <span class="user-store">${this.config.user.store}</span>
                            ` : ''}
                            
                            <!-- Dropdown magasin si activé -->
                            ${this.config.showMagasinDropdown ? `
                                <span class="user-separator"></span>
                                <div class="header-magasin-section">
                                    <span class="magasin-label">Magasin :</span>
                                    <div id="magasinDropdown-${this.id}"></div>
                                </div>
                            ` : ''}
                            
                            <!-- Bouton déconnexion si activé -->
                            ${this.config.showLogout ? `
                                <span class="user-separator"></span>
                                <button class="${logoutClasses}" data-role="logout-button">
                                    Déconnexion
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <!-- ======================================== -->
                <!-- INDICATEUR DE CHARGEMENT -->
                <!-- ======================================== -->
                <div class="loading-indicator" style="display: none;">
                    <div class="loading-spinner"></div>
                </div>
            </div>
        `;
    }
    
    /**
     * Met en cache les références aux éléments DOM
     */
    cacheElements() {
        const header = this.elements.header;
        
        // Utiliser data-role pour trouver les boutons de manière fiable
        this.elements.backButton = header.querySelector('[data-role="back-button"]');
        this.elements.titleElement = header.querySelector('.app-header-title');
        this.elements.subtitleElement = header.querySelector('.app-header-subtitle');
        this.elements.userInfo = header.querySelector(`.${this.config.buttonClasses.userSection}`);
        this.elements.logoutButton = header.querySelector('[data-role="logout-button"]');
        this.elements.loadingIndicator = header.querySelector('.loading-indicator');
        
        // Debug : vérifier ce qui a été trouvé
        console.log('🔍 Éléments trouvés dans le header:', {
            backButton: !!this.elements.backButton,
            logoutButton: !!this.elements.logoutButton,
            userInfo: !!this.elements.userInfo,
            title: !!this.elements.titleElement
        });
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    /**
     * Attache les événements aux éléments
     */
    attachEvents() {
        // ========================================
        // ÉVÉNEMENT : BOUTON RETOUR
        // ========================================
        if (this.elements.backButton) {
            this.elements.backButton.addEventListener('click', () => {
                this.handleBack();
            });
            console.log('✅ Événement attaché : bouton retour');
        }
        
        // ========================================
        // ÉVÉNEMENT : BOUTON DÉCONNEXION
        // ========================================
        if (this.elements.logoutButton) {
            this.elements.logoutButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Empêcher la propagation
                this.handleLogout();
            });
            console.log('✅ Événement attaché : bouton déconnexion');
        }
        
        // ========================================
        // NOTE : Section utilisateur NON cliquable
        // pour éviter les conflits avec le bouton
        // ========================================
        // if (this.elements.userInfo) {
        //     this.elements.userInfo.addEventListener('click', () => {
        //         this.handleUserClick();
        //     });
        // }
    }
    
    /**
     * Gère le clic sur le bouton retour
     */
    handleBack() {
        console.log('🔙 Bouton retour cliqué');
        
        // Callback prioritaire
        if (this.config.onBack) {
            this.config.onBack();
        }
        // Sinon navigation directe
        else if (this.config.backUrl) {
            window.location.href = this.config.backUrl;
        }
    }
    
    /**
     * Gère le clic sur le bouton déconnexion
     */
    handleLogout() {
        console.log('🔴 Bouton déconnexion cliqué');
        
        if (this.config.onLogout) {
            this.config.onLogout();
        }
    }
    
    /**
     * Gère le clic sur la section utilisateur
     */
    handleUserClick() {
        if (this.config.onUserClick && this.config.user) {
            this.config.onUserClick(this.config.user);
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    /**
     * Met à jour le titre et sous-titre
     * @param {string} title - Nouveau titre
     * @param {string} subtitle - Nouveau sous-titre (optionnel)
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
    
    /**
     * Met à jour les informations utilisateur
     * @param {Object} userData - Données utilisateur { name, store, role }
     */
    setUser(userData) {
        this.config.user = userData;
        
        if (!userData) {
            // Masquer la section utilisateur
            if (this.elements.userInfo) {
                this.elements.userInfo.style.display = 'none';
            }
            return;
        }
        
        // Mettre à jour ou créer la section utilisateur
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
    
    /**
     * Affiche l'indicateur de chargement
     */
    showLoading() {
        this.state.loading = true;
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'flex';
        }
    }
    
    /**
     * Masque l'indicateur de chargement
     */
    hideLoading() {
        this.state.loading = false;
        if (this.elements.loadingIndicator) {
            this.elements.loadingIndicator.style.display = 'none';
        }
    }
    
    /**
     * Obtient l'état actuel du composant
     * @returns {Object} État du composant
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
     * Obtient l'ID du container dropdown magasin
     * @returns {string|null} ID du dropdown ou null
     */
    getMagasinDropdownId() {
        if (this.config.showMagasinDropdown) {
            return `magasinDropdown-${this.id}`;
        }
        return null;
    }
    
    /**
     * Détruit le composant et nettoie les ressources
     */
    destroy() {
        // Retirer du DOM
        if (this.elements.header) {
            this.elements.header.remove();
        }
        
        // Réinitialiser l'état
        this.state = {
            loading: false,
            rendered: false
        };
        
        // Réinitialiser les références
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

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [05/02/2025] - Correction affichage boutons
   - Ajout data-role pour identifier les boutons
   - Suppression clic sur section utilisateur
   - Debug amélioré
   
   [01/02/2025] - Support classes personnalisables
   - Classes CSS via config
   - IoC complet
   
   [29/12/2024] - Correction chemin CSS
   - Support multi-niveaux
   
   NOTES POUR REPRISES FUTURES:
   - Les boutons utilisent data-role pour être trouvés
   - La section utilisateur n'est PAS cliquable
   - Les classes CSS sont injectées par l'orchestrateur
   ======================================== */