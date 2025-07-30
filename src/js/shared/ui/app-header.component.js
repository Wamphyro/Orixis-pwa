// ========================================
// APP-HEADER.COMPONENT.JS - Composant header d'application réutilisable
// Chemin: src/js/shared/ui/app-header.component.js
//
// DESCRIPTION:
// Composant indépendant pour afficher l'en-tête d'application
// Utilisable sur toutes les pages avec différentes configurations
//
// API PUBLIQUE:
// - constructor(config)
// - setTitle(title, subtitle)
// - setUser(userData)
// - updateBreadcrumb(items)
// - show()
// - hide()
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onBack: () => void - Appelé au clic sur retour
// - onLogout: () => void - Appelé à la déconnexion
// - onUserClick: (userData) => void - Appelé au clic sur l'utilisateur
//
// EXEMPLE:
// const header = new AppHeader({
//     title: '📦 Gestion des Commandes',
//     subtitle: 'Commandes d\'appareils et accessoires',
//     backUrl: 'home.html',
//     user: { name: 'Cédric Korber', store: 'Magasin Marseille' },
//     onLogout: () => console.log('Déconnexion')
// });
// ========================================

import { generateId } from '../index.js';

export class AppHeader {
    constructor(config) {
        this.id = generateId('header');
        
        // Configuration par défaut
        this.config = {
            container: 'body',           // Container où injecter
            title: '',                   // Titre principal
            subtitle: '',                // Sous-titre optionnel
            icon: '',                    // Icône optionnelle
            backUrl: null,              // URL de retour (null = pas de bouton)
            backText: '← Retour',       // Texte du bouton retour
            user: {                     // Données utilisateur
                name: '',
                store: '',              // 🆕 Magasin de l'utilisateur
                avatar: '',             // URL avatar optionnel
                showLogout: true        // Afficher bouton déconnexion
            },
            theme: 'default',           // Thème visuel
            position: 'top',            // Position (top, fixed)
            breadcrumb: [],             // Fil d'Ariane optionnel
            onBack: null,               // Callback retour
            onLogout: null,             // Callback déconnexion
            onUserClick: null,          // Callback clic utilisateur
            ...config
        };
        
        // État interne
        this.state = {
            visible: true,
            loaded: false
        };
        
        // Éléments DOM
        this.elements = {
            container: null,
            header: null,
            title: null,
            subtitle: null,
            backButton: null,
            userSection: null,
            userName: null,
            userStore: null,
            logoutButton: null
        };
        
        // Initialiser
        this.init();
    }
    
    // ========================================
    // INITIALISATION ET CONFIGURATION
    // ========================================
    
    init() {
        // Charger les styles en premier
        this.loadStyles().then(() => {
            // Une fois le CSS chargé, continuer
            this.setupContainer();
            this.render();
            this.attachEvents();
            this.showWithDelay();
            
            console.log('✅ AppHeader initialisé');
        });
    }
    
    loadStyles() {
        return new Promise((resolve) => {
            const styleId = 'app-header-styles';
            
            if (!document.getElementById(styleId)) {
                const link = document.createElement('link');
                link.id = styleId;
                link.rel = 'stylesheet';
                link.href = '../src/css/shared/ui/app-header.css';
                
                // Attendre que le CSS soit chargé
                link.onload = () => {
                    console.log('📦 CSS AppHeader chargé');
                    resolve();
                };
                
                link.onerror = () => {
                    console.warn('⚠️ Erreur chargement CSS AppHeader');
                    resolve(); // Continuer même en cas d'erreur
                };
                
                document.head.appendChild(link);
            } else {
                // CSS déjà chargé
                resolve();
            }
        });
    }
    
    setupContainer() {
        // Trouver le container
        if (typeof this.config.container === 'string') {
            this.elements.container = document.querySelector(this.config.container);
        } else {
            this.elements.container = this.config.container;
        }
        
        if (!this.elements.container) {
            console.error('AppHeader: Container non trouvé');
            return;
        }
    }
    
    // ========================================
    // RENDU ET DOM
    // ========================================
    
    render() {
        // Créer l'élément header principal
        const header = document.createElement('div');
        header.className = `app-header theme-${this.config.theme}`;
        header.id = this.id;
        
        if (this.config.position === 'fixed') {
            header.classList.add('fixed');
        }
        
        // Structure principale
        header.innerHTML = this.createHeaderStructure();
        
        // Sauvegarder les références
        this.elements.header = header;
        this.elements.title = header.querySelector('.app-header-title');
        this.elements.subtitle = header.querySelector('.app-header-subtitle');
        this.elements.backButton = header.querySelector('.header-back-button');
        this.elements.userSection = header.querySelector('.header-user-section');
        this.elements.userName = header.querySelector('.user-name');
        this.elements.userStore = header.querySelector('.user-store');
        this.elements.logoutButton = header.querySelector('.header-logout-button');
        
        // Injecter dans le container
        if (this.elements.container === document.body) {
            // Injecter en début de body
            this.elements.container.insertBefore(header, this.elements.container.firstChild);
        } else {
            // Remplacer le contenu du container
            this.elements.container.innerHTML = '';
            this.elements.container.appendChild(header);
        }
    }
    
    createHeaderStructure() {
        return `
            <div class="app-header-content">
                <div class="app-header-left">
                    ${this.createBackButton()}
                    ${this.createBreadcrumb()}
                </div>
                <div class="app-header-center">
                    ${this.createTitleSection()}
                </div>
                <div class="app-header-right">
                    ${this.createUserSection()}
                </div>
            </div>
        `;
    }
    
    createBackButton() {
        if (!this.config.backUrl && !this.config.onBack) {
            return '';
        }
        
        const href = this.config.backUrl ? `href="${this.config.backUrl}"` : '';
        const tag = this.config.backUrl ? 'a' : 'button';
        
        return `
            <${tag} class="header-back-button" ${href} data-action="back">
                ${this.config.backText}
            </${tag}>
        `;
    }
    
    createBreadcrumb() {
        if (!this.config.breadcrumb || this.config.breadcrumb.length === 0) {
            return '';
        }
        
        const items = this.config.breadcrumb.map((item, index) => {
            const isLast = index === this.config.breadcrumb.length - 1;
            if (isLast) {
                return `<span class="breadcrumb-current">${item.label}</span>`;
            } else {
                return `<a href="${item.url}" class="breadcrumb-link">${item.label}</a>`;
            }
        }).join('<span class="breadcrumb-separator">></span>');
        
        return `<nav class="header-breadcrumb">${items}</nav>`;
    }
    
    createTitleSection() {
        const icon = this.config.icon ? `<span class="app-header-icon">${this.config.icon}</span>` : '';
        const subtitle = this.config.subtitle ? `<p class="app-header-subtitle">${this.config.subtitle}</p>` : '';
        
        return `
            ${icon}
            <h1 class="app-header-title">${this.config.title}</h1>
            ${subtitle}
        `;
    }
    
    createUserSection() {
        if (!this.config.user || !this.config.user.name) {
            return '';
        }
        
        const avatar = this.config.user.avatar ? 
            `<img src="${this.config.user.avatar}" alt="Avatar" class="user-avatar">` : 
            '';
        
        // 🆕 Section utilisateur réorganisée avec nom + magasin + déconnexion
        const store = this.config.user.store ? 
            `<div class="user-store">${this.config.user.store}</div>` : 
            '';
        
        const logoutButton = this.config.user.showLogout ? 
            `<button class="header-logout-button" data-action="logout">
                🚪 Déconnexion
            </button>` : '';
        
        return `
            <div class="header-user-section" data-action="user-click">
                ${avatar}
                <div class="user-name">${this.config.user.name}</div>
                ${store}
                <div class="user-separator"></div>
                ${logoutButton}
            </div>
        `;
    }
    
    // ========================================
    // GESTION DES ÉVÉNEMENTS
    // ========================================
    
    attachEvents() {
        if (!this.elements.header) return;
        
        // Délégation d'événements sur le header
        this.elements.header.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            switch (action) {
                case 'back':
                    this.handleBack(e);
                    break;
                case 'logout':
                    this.handleLogout(e);
                    break;
                case 'user-click':
                    // Ne déclencher que si on clique sur le nom/avatar, pas sur déconnexion
                    if (!e.target.closest('.header-logout-button')) {
                        this.handleUserClick(e);
                    }
                    break;
            }
        });
    }
    
    handleBack(e) {
        // Si c'est un lien, laisser le comportement par défaut
        if (this.config.backUrl && e.target.tagName === 'A') {
            return;
        }
        
        // Sinon, empêcher le comportement par défaut et appeler le callback
        e.preventDefault();
        
        if (this.config.onBack) {
            this.config.onBack();
        } else if (this.config.backUrl) {
            // Fallback : navigation manuelle
            window.location.href = this.config.backUrl;
        }
    }
    
    handleLogout(e) {
        e.preventDefault();
        e.stopPropagation(); // Empêcher la propagation vers user-click
        
        if (this.config.onLogout) {
            this.config.onLogout();
        } else {
            // Fallback par défaut
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                console.log('Déconnexion demandée');
                // Ici on pourrait rediriger vers une page de login
            }
        }
    }
    
    handleUserClick(e) {
        if (this.config.onUserClick) {
            this.config.onUserClick(this.config.user);
        }
    }
    
    // ========================================
    // AFFICHAGE ET MASQUAGE
    // ========================================
    
    /**
     * Affiche le header avec délai pour éviter le FOUC
     */
    showWithDelay() {
        setTimeout(() => {
            this.show();
        }, 50); // Délai plus court car le header doit apparaître rapidement
    }
    
    /**
     * Affiche le header immédiatement
     */
    show() {
        if (this.elements.header) {
            this.elements.header.classList.add('loaded');
            this.state.visible = true;
            this.state.loaded = true;
            console.log('📦 AppHeader affiché');
        }
    }
    
    /**
     * Masque le header
     */
    hide() {
        if (this.elements.header) {
            this.elements.header.classList.remove('loaded');
            this.state.visible = false;
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
        
        if (this.elements.title) {
            this.elements.title.textContent = title;
        }
        
        if (this.elements.subtitle) {
            if (subtitle) {
                this.elements.subtitle.textContent = subtitle;
                this.elements.subtitle.style.display = '';
            } else {
                this.elements.subtitle.style.display = 'none';
            }
        }
    }
    
    /**
     * 🆕 Met à jour les informations utilisateur (nom + magasin)
     * @param {Object} userData - Nouvelles données utilisateur
     */
    setUser(userData) {
        this.config.user = { ...this.config.user, ...userData };
        
        if (this.elements.userName) {
            this.elements.userName.textContent = userData.name || '';
        }
        
        if (this.elements.userStore) {
            if (userData.store) {
                this.elements.userStore.textContent = userData.store;
                this.elements.userStore.style.display = '';
            } else {
                this.elements.userStore.style.display = 'none';
            }
        }
    }
    
    /**
     * Met à jour le fil d'Ariane
     * @param {Array} items - Éléments du breadcrumb [{label: '', url: ''}]
     */
    updateBreadcrumb(items) {
        this.config.breadcrumb = items;
        
        // Re-render la partie breadcrumb
        const leftSection = this.elements.header?.querySelector('.app-header-left');
        if (leftSection) {
            const existingBreadcrumb = leftSection.querySelector('.header-breadcrumb');
            const newBreadcrumb = this.createBreadcrumb();
            
            if (existingBreadcrumb) {
                existingBreadcrumb.outerHTML = newBreadcrumb;
            } else if (newBreadcrumb) {
                leftSection.insertAdjacentHTML('beforeend', newBreadcrumb);
            }
        }
    }
    
    /**
     * Change le thème du header
     * @param {string} theme - Nouveau thème
     */
    setTheme(theme) {
        if (this.elements.header) {
            this.elements.header.classList.remove(`theme-${this.config.theme}`);
            this.elements.header.classList.add(`theme-${theme}`);
            this.config.theme = theme;
        }
    }
    
    /**
     * Récupère l'état actuel du composant
     * @returns {Object} État du header
     */
    getState() {
        return {
            visible: this.state.visible,
            loaded: this.state.loaded,
            config: { ...this.config }
        };
    }
    
    /**
     * Détruit le composant
     */
    destroy() {
        if (this.elements.header) {
            this.elements.header.remove();
        }
        
        // Réinitialiser
        this.state = { visible: false, loaded: false };
        this.elements = { container: null, header: null };
    }
    
    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================
    
    /**
     * Valide la configuration
     * @param {Object} config - Configuration à valider
     * @returns {boolean} Configuration valide
     */
    validateConfig(config) {
        if (!config.title) {
            console.warn('AppHeader: Titre requis');
            return false;
        }
        
        return true;
    }
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [30/01/2025] - Création initiale
   - Composant créé en suivant le pattern IoC
   - Auto-chargement du CSS avec Promise
   - Gestion des événements par délégation
   - API publique complète pour mise à jour
   - Support breadcrumb optionnel
   - Anti-FOUC intégré
   
   [30/01/2025] - Réorganisation section utilisateur
   - Modification createUserSection() pour layout horizontal
   - Ajout support magasin utilisateur (user.store)
   - Nouveau layout : nom | magasin | déconnexion sur même ligne
   - Amélioration gestion événements (stopPropagation logout)
   - Mise à jour setUser() pour gérer le magasin
   
   NOTES POUR REPRISES FUTURES:
   - Le composant est complètement indépendant
   - Les callbacks sont optionnels avec fallbacks
   - Le CSS se charge automatiquement
   - Support de différents containers (body, div)
   - Délégation d'événements pour les performances
   - Section utilisateur maintenant : [avatar] [nom] [magasin] | [déconnexion]
   ======================================== */