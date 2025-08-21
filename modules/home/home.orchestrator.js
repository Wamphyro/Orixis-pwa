// ========================================
// HOME.ORCHESTRATOR.JS - 🎯 ORCHESTRATEUR PRINCIPAL DU DASHBOARD
// Chemin: modules/home/home.orchestrator.js
//
// DESCRIPTION:
// Orchestre la page d'accueil avec les widgets modernes
// Gère l'authentification, les permissions et la navigation
// Coordonne HeaderWidget et MenuCardsWidget
//
// RESPONSABILITÉS:
// - Vérification de l'authentification
// - Chargement des données utilisateur
// - Création et configuration des widgets
// - Gestion des événements globaux
// - Navigation et analytics
// ========================================

// ========================================
// IMPORTS
// ========================================

// Import des widgets nécessaires
import { HeaderWidget } from '../../widgets/header/header.widget.js';
import MenuCardsWidget from '../../widgets/menu-cards/menu-cards.widget.js';
import toast from '../../widgets/toast/toast.widget.js';

// ========================================
// CLASSE ORCHESTRATEUR
// ========================================

class HomeOrchestrator {
    /**
     * Constructeur de l'orchestrateur
     * Initialise l'état et la configuration
     */
    constructor() {
        // ========================================
        // WIDGETS
        // Références aux widgets créés
        // ========================================
        this.header = null;      // Widget du header
        this.menuCards = null;   // Widget des cartes de menu
        
        // ========================================
        // ÉTAT DE L'APPLICATION
        // Données utilisateur et contexte
        // ========================================
        this.userData = null;       // Informations utilisateur
        this.currentMagasin = null; // Magasin actuel
        this.permissions = null;    // Permissions utilisateur
        
        // ========================================
        // CONFIGURATION
        // Paramètres de l'application
        // ========================================
        this.config = {
            authExpiry: 24 * 60 * 60 * 1000, // Durée de validité de l'auth (24h)
            animationDelay: 50,               // Délai entre animations (ms)
            searchDebounce: 300,              // Délai pour la recherche (ms)
            toastDuration: 3000               // Durée des notifications (ms)
        };
    }
    
    // ========================================
    // MÉTHODE PRINCIPALE D'INITIALISATION
    // ========================================
    
    /**
     * Initialise l'application complète
     * Point d'entrée principal de l'orchestrateur
     */
    async init() {
        try {
            console.log('🏠 Initialisation du Dashboard...');
            console.time('⏱️ Temps d\'initialisation');
            
            // ========================================
            // ÉTAPE 1: VÉRIFICATION DE L'AUTHENTIFICATION
            // ========================================
            if (!this.checkAuth()) {
                console.warn('⚠️ Utilisateur non authentifié');
                this.redirectToLogin();
                return;
            }
            console.log('✅ Authentification validée');
            
            // ========================================
            // ÉTAPE 2: CHARGEMENT DES DONNÉES UTILISATEUR
            // ========================================
            this.loadUserData();
            console.log('✅ Données utilisateur chargées');
            
            // ========================================
            // ÉTAPE 3: CRÉATION DES WIDGETS
            // ========================================
            await this.createWidgets();
            console.log('✅ Widgets créés');
            
            // ========================================
            // ÉTAPE 4: INITIALISATION DES ÉVÉNEMENTS
            // ========================================
            this.initGlobalEvents();
            console.log('✅ Événements globaux initialisés');
            
            // ========================================
            // ÉTAPE 5: FINALISATION
            // ========================================
            this.hideLoader();
            this.showWelcomeMessage();
            
            console.timeEnd('⏱️ Temps d\'initialisation');
            console.log('✅ Dashboard prêt !');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.handleInitError(error);
        }
    }
    
    // ========================================
    // GESTION DE L'AUTHENTIFICATION
    // ========================================
    
    /**
     * Vérifie si l'utilisateur est authentifié
     * @returns {boolean} True si authentifié, false sinon
     */
    checkAuth() {
        const auth = localStorage.getItem('sav_auth');
        if (!auth) {
            console.log('❌ Pas de données d\'authentification');
            return false;
        }
        
        try {
            const authData = JSON.parse(auth);
            const now = Date.now();
            
            // Vérifier l'expiration si définie
            if (authData.timestamp && authData.expiry) {
                const age = now - authData.timestamp;
                if (age > authData.expiry) {
                    console.log('❌ Session expirée');
                    this.clearAuth();
                    return false;
                }
            }
            
            // Vérifier le flag d'authentification
            return authData.authenticated === true;
            
        } catch (error) {
            console.error('❌ Erreur parsing auth:', error);
            return false;
        }
    }
    
    /**
     * Charge les données utilisateur depuis le localStorage
     */
    loadUserData() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        const permissions = JSON.parse(localStorage.getItem('sav_user_permissions') || '{}');
        
        // Construire l'objet userData
        this.userData = {
            name: auth.collaborateur ? 
                `${auth.collaborateur.prenom} ${auth.collaborateur.nom}` : 
                'Utilisateur',
            email: auth.collaborateur?.email || '',
            role: auth.collaborateur?.role || 'technicien',
            magasin: auth.magasin || 'Non défini',
            magasins: auth.magasins || [],
            avatar: auth.collaborateur?.avatar || null
        };
        
        // Stocker le magasin actuel et les permissions
        this.currentMagasin = auth.magasin;
        this.permissions = permissions;
        
        console.log('👤 Utilisateur:', this.userData);
        console.log('🔑 Permissions:', this.permissions);
    }
    
    // ========================================
    // CRÉATION DES WIDGETS
    // ========================================
    
    /**
     * Crée et configure tous les widgets
     */
    async createWidgets() {
        try {
            console.log('🎨 Création des widgets...');
            
            // Créer le header
            await this.createHeader();
            
            // Créer les cartes de menu
            await this.createMenuCards();
            
            console.log('✅ Tous les widgets sont créés');
            
        } catch (error) {
            console.error('❌ Erreur création widgets:', error);
            throw error;
        }
    }
    
/**
 * Crée et configure le widget Header
 */
createHeader() {
    console.log('🎨 Création du header...');
    
    this.header = new HeaderWidget({
        // ========================================
        // CONTAINER ET POSITION - TRÈS IMPORTANT
        // ========================================
        container: 'body',        // Injecter dans body (par défaut)
        position: 'prepend',      // ✅ CORRIGÉ : 'prepend' au lieu de 'relative'
        sticky: true,             // Header fixe en haut
        
        // ========================================
        // APPARENCE
        // ========================================
        pageBackground: 'colorful',
        theme: 'gradient',
        
        // ========================================
        // TITRE
        // ========================================
        title: 'Dashboard',
        subtitle: 'Système de Gestion ORIXIS',
        centerTitle: true,
        
        // ========================================
        // LOGO
        // ========================================
        showLogo: true,
        logoIcon: `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
        `,
        
        // ========================================
        // NAVIGATION
        // ========================================
        showBack: false,
        
        // ========================================
        // RECHERCHE
        // ========================================
        showSearch: true,
        searchPlaceholder: 'Rechercher un module, une fonctionnalité...',
        searchMaxWidth: '600px',
        searchHeight: '48px',
        onSearch: (query) => this.handleSearch(query),
        
        // ========================================
        // PERSONNALISATION DES BOUTONS
        // ========================================
        buttonStyles: {
            back: {
                height: '48px',
                padding: '12px 24px',
                minWidth: '120px'
            },
            action: {
                height: '48px',
                width: '44px'
            },
            notification: {
                height: '48px',
                width: '44px'
            },
            userMenu: {
                height: '48px',
                padding: '6px 16px 6px 6px',
                maxWidth: '240px'
            },
            indicator: {
                height: '48px',
                padding: '10px 16px',
                minWidth: 'auto'
            }
        },
        
        // ========================================
        // BOUTONS D'ACTIONS RAPIDES
        // ========================================
        showQuickActions: true,
        quickActions: [
            {
                id: 'notifications',
                title: 'Notifications',
                icon: `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                `,
                badge: this.getNotificationCount(),
                onClick: () => this.showNotifications()
            },
            {
                id: 'shortcuts',
                title: 'Raccourcis',
                icon: `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                `,
                onClick: () => this.showShortcuts()
            },
            {
                id: 'stats',
                title: 'Statistiques',
                icon: `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                `,
                onClick: () => this.showStats()
            },
            {
                id: 'refresh',
                title: 'Actualiser',
                icon: `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                `,
                onClick: () => this.refresh()
            }
        ],
        
        // ========================================
        // INDICATEURS D'ÉTAT
        // ========================================
        showIndicators: true,
        indicators: this.getIndicators(),
        
        // ========================================
        // NOTIFICATIONS
        // ========================================
        showNotifications: true,
        notificationCount: this.getNotificationCount(),
        
        // ========================================
        // UTILISATEUR - MENU PAR DÉFAUT DU WIDGET
        // ========================================
        showUser: true,
        showUserDropdown: true,
        // PAS de userMenuItems - le widget utilisera son menu par défaut
        
        // ========================================
        // MAGASIN
        // ========================================
        showMagasin: true,
        
        // ========================================
        // DÉCONNEXION
        // ========================================
        showLogout: true,
        onLogout: () => this.handleLogout()
    });
    
    console.log('✅ Header créé avec succès');
}
    
    /**
     * Crée et configure le widget MenuCards
     */
    createMenuCards() {
        console.log('🎨 Création des cartes de menu...');
        
        // Configuration des modules disponibles
        const menuItems = this.getMenuItems();
        
        // Créer le widget
        this.menuCards = new MenuCardsWidget({
            container: '.menu-container',
            
            // ========================================
            // APPARENCE
            // ========================================
            theme: 'gradient',
            layout: 'grid',
            cardLayout: 'vertical',
            
            // ========================================
            // GRILLE RESPONSIVE
            // ========================================
            gridLayout: {
                type: 'grid',
                columns: {
                    xs: 1,  // Mobile: 1 colonne
                    sm: 2,  // Petite tablette: 2 colonnes
                    md: 3,  // Tablette: 3 colonnes
                    lg: 4,  // Desktop: 4 colonnes
                    xl: 5   // Grand écran: 5 colonnes
                },
                gap: {
                    x: 20,  // Espacement horizontal
                    y: 20   // Espacement vertical
                }
            },
            
            // ========================================
            // ANIMATIONS
            // ========================================
            animated: true,
            animationType: 'fadeInUp',
            animationDelay: this.config.animationDelay,
            staggerAnimation: true,
            
            // ========================================
            // WRAPPER
            // ========================================
            showWrapper: true,
            wrapperStyle: 'transparent',
            
            // ========================================
            // FILTRES
            // ========================================
            showFilters: true,
            filterCategories: this.getFilterCategories(),
            
            // ========================================
            // DONNÉES
            // ========================================
            cards: menuItems,
            
            // ========================================
            // PERMISSIONS
            // ========================================
            checkPermissions: true,
            userPermissions: this.permissions,
            
            // ========================================
            // TRI
            // ========================================
            sortable: true,
            sortBy: 'order',
            sortOrder: 'asc',
            
            // ========================================
            // MESSAGES
            // ========================================
            emptyMessage: 'Aucun module disponible avec vos permissions actuelles',
            
            // ========================================
            // CALLBACKS
            // ========================================
            onCardClick: (card, event) => this.handleCardClick(card, event),
            onFilter: (filter, visibleCards) => this.handleFilter(filter, visibleCards),
            onCardHover: (card, action) => this.handleCardHover(card, action)
        });
        
        console.log('✅ Menu cards créé avec succès');
    }
    
    // ========================================
    // CONFIGURATION DES MODULES
    // ========================================
    
    /**
     * Retourne la liste des modules disponibles
     * @returns {Array} Liste des modules
     */
    getMenuItems() {
        return [
            {
                id: 'intervention',
                icon: '🔍',
                title: 'Nouvelle Intervention',
                description: 'Créer une fiche d\'intervention pour un client',
                href: '../intervention/intervention.html',
                permissions: ['intervention.create'],
                category: 'operations',
                order: 1
            },
            {
                id: 'commandes',
                icon: '📦',
                title: 'Commandes',
                description: 'Gérer les commandes d\'appareils et accessoires',
                href: '../commandes/commandes.html',
                permissions: ['commandes.view'],
                category: 'operations',
                stats: this.getCommandesStats(),
                order: 2
            },
            {
                id: 'decompte-mutuelle',
                icon: '💳',
                title: 'Décompte Mutuelle',
                description: 'Gérer les décomptes mutuelles et remboursements',
                href: '../decompte-mutuelle/decompte-mutuelle.html',
                permissions: ['mutuelle.view'],
                category: 'finance',
                order: 3
            },
            {
                id: 'decompte-secu',
                icon: '🏥',
                title: 'Sécurité Sociale',
                description: 'Gérer les décomptes sécurité sociale',
                href: '../decompte-secu/decompte-secu.html',
                permissions: ['secu.view'],
                category: 'finance',
                order: 4
            },
            {
                id: 'operations-bancaires',
                icon: '🏦',
                title: 'Opérations Bancaires',
                description: 'Importer et gérer les opérations bancaires',
                href: '../operations-bancaires/operations-bancaires.html',
                permissions: ['banque.view'],
                category: 'finance',
                badge: { text: 'Nouveau', type: 'success' },
                order: 5
            },
            {
                id: 'stock-produit',
                icon: '📦',
                title: 'Stock Produit',
                description: 'Gérer le stock et les inventaires produits',
                href: '../stock-produit/stock-produit.html',
                permissions: ['stock.view'],
                category: 'operations',
                badge: { text: 'Nouveau', type: 'primary' },
                stats: {
                    value: '0',
                    label: 'Articles',
                    trend: 'stable'
                },
                order: 6
            },
            {
                id: 'factures-fournisseurs',
                icon: '📄',
                title: 'Factures Fournisseurs',
                description: 'Gérer les factures fournisseurs',
                href: '../factures-fournisseurs/factures-fournisseurs.html',
                permissions: ['factures.view'],
                category: 'finance',
                stats: this.getFacturesStats(),
                order: 6
            },
            {
                id: 'subventions',
                icon: '🗃️',
                title: 'Dossiers de subvention',
                description: 'Gérer les dossiers de subvention MDPH et AGEFIPH',
                href: '../subventions/ui/subventions.html',
                permissions: ['subventions.view'],
                category: 'operations',
                order: 7
            },
            {
                id: 'test-widgets',
                icon: '🧪',
                title: 'TEST PAGE WIDGETS',
                description: 'Environnement de test pour les nouveaux widgets',
                href: '/modules/test/test-widgets.html',
                permissions: ['clients.view'],
                category: 'dev',
                badge: { text: 'Dev', type: 'warning' },
                order: 8,
                disabled: !this.isDevMode()
            },
            {
                id: 'gmail',
                icon: '📧',
                title: 'MailBox & Chat',
                description: 'Gérer les emails et les conversations',
                href: '../gmail/gmail.html',
                permissions: ['gmail.view'],
                category: 'communication',
                order: 9,
                comingSoon: true
            },
            {
                id: 'guide',
                icon: '📚',
                title: 'Guide SAV',
                description: 'Consulter les procédures et protocoles',
                href: '../guide/guide.html',
                category: 'support',
                order: 10
            },
            {
                id: 'contacts',
                icon: '📞',
                title: 'Contacts SAV',
                description: 'Numéros et contacts importants',
                href: '/module/contacts/contacts.html',
                category: 'support',
                order: 11
            },
            {
                id: 'compte',
                icon: '👤',
                title: 'Mon Compte',
                description: 'Gérer mon profil, mes groupes et permissions',
                href: '../compte/compte.html',
                category: 'administration',
                order: 12
            },
            {
                id: 'admin',
                icon: '👑',
                title: 'Administration',
                description: 'Gérer les utilisateurs, groupes et permissions',
                href: '../admin/admin.html',
                permissions: ['admin.access'],
                requiresAdmin: true,
                category: 'administration',
                badge: { text: 'Admin', type: 'danger' },
                order: 13
            }
        ];
    }
    
    /**
     * Retourne les catégories de filtres
     * @returns {Array} Liste des catégories
     */
    getFilterCategories() {
        return [
            { value: 'operations', label: '📊 Opérations' },
            { value: 'finance', label: '💰 Finance' },
            { value: 'communication', label: '💬 Communication' },
            { value: 'support', label: '🛠️ Support' },
            { value: 'administration', label: '⚙️ Administration' },
            { value: 'dev', label: '🔧 Développement' }
        ];
    }
    
    /**
     * Retourne les indicateurs du header
     * @returns {Array} Liste des indicateurs
     */
    getIndicators() {
        const indicators = [
            {
                id: 'status',
                text: 'Connecté',
                type: 'success',
                animated: true
            }
        ];
        
        // Ajouter indicateur magasin si plusieurs
        if (this.userData.magasins && this.userData.magasins.length > 1) {
            indicators.push({
                id: 'magasin',
                text: `📍 ${this.currentMagasin}`,
                type: 'info'
            });
        }
        
        // Ajouter indicateur dev si mode dev
        if (this.isDevMode()) {
            indicators.push({
                id: 'dev',
                text: 'DEV',
                type: 'warning'
            });
        }
        
        return indicators;
    }


    // ========================================
    // GESTIONNAIRES D'ÉVÉNEMENTS
    // ========================================
    
    /**
     * Gère la recherche
     * @param {string} query - Terme de recherche
     */
    handleSearch(query) {
        console.log('🔍 Recherche:', query);
        if (this.menuCards) {
            this.menuCards.search(query);
        }
    }
    
    /**
     * Gère le clic sur une carte
     * @param {Object} card - Carte cliquée
     * @param {Event} event - Événement de clic
     */
    handleCardClick(card, event) {
        console.log('📱 Clic sur carte:', card.title);
        
        // Gérer les cas spéciaux
        if (card.comingSoon) {
            event.preventDefault();
            toast.info('Cette fonctionnalité sera bientôt disponible');
            return false;
        }
        
        if (card.disabled) {
            event.preventDefault();
            toast.warning('Module désactivé');
            return false;
        }
        
        // Analytics et sauvegarde
        this.trackNavigation(card);
        this.saveLastNavigation(card);
        
        return true;
    }
    
    /**
     * Gère le changement de filtre
     * @param {string} filter - Filtre appliqué
     * @param {Array} visibleCards - Cartes visibles
     */
    handleFilter(filter, visibleCards) {
        console.log(`📁 Filtre: ${filter} - ${visibleCards.length} modules visibles`);
        this.updateFilterIndicator(filter, visibleCards.length);
    }
    
    /**
     * Gère le survol d'une carte
     * @param {Object} card - Carte survolée
     * @param {string} action - Type d'action (enter/leave)
     */
    handleCardHover(card, action) {
        if (action === 'enter' && card.stats) {
            this.preloadModuleData(card.id);
        }
    }
    
    // ========================================
    // ÉVÉNEMENTS GLOBAUX
    // ========================================
    
    /**
     * Initialise les événements globaux de l'application
     */
    initGlobalEvents() {
        console.log('🎮 Initialisation des événements globaux...');
        
        // ========================================
        // RACCOURCIS CLAVIER
        // ========================================
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K pour recherche
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.focusSearch();
            }
            
            // Escape pour fermer les modals
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // ========================================
        // GESTION DU RÉSEAU
        // ========================================
        window.addEventListener('online', () => {
            console.log('📶 Connexion rétablie');
            toast.success('Connexion rétablie');
            this.header?.updateIndicator('status', {
                text: 'Connecté',
                type: 'success'
            });
        });
        
        window.addEventListener('offline', () => {
            console.log('📵 Connexion perdue');
            toast.error('Connexion perdue');
            this.header?.updateIndicator('status', {
                text: 'Hors ligne',
                type: 'danger'
            });
        });
        
        // ========================================
        // GESTION DE LA VISIBILITÉ
        // ========================================
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Vérifier la session quand l'utilisateur revient
                if (!this.checkAuth()) {
                    console.warn('⚠️ Session expirée pendant l\'absence');
                    this.redirectToLogin();
                }
            }
        });
    }
    
    // ========================================
    // ACTIONS UTILISATEUR
    // ========================================
    
    /**
     * Affiche les notifications
     */
    showNotifications() {
        console.log('🔔 Affichage des notifications');
        toast.info('Panneau de notifications en développement');
    }
    
    /**
     * Affiche les raccourcis
     */
    showShortcuts() {
        console.log('⌨️ Affichage des raccourcis');
        toast.info('Raccourcis clavier : Ctrl+K pour rechercher');
    }
    
    /**
     * Affiche les statistiques
     */
    showStats() {
        console.log('📊 Affichage des statistiques');
        
        const stats = {
            modules: this.menuCards?.state?.visibleCards?.length || 0,
            modulesTotal: this.menuCards?.config?.cards?.length || 0,
            notifications: this.getNotificationCount(),
            magasin: this.currentMagasin,
            utilisateur: this.userData.name,
            role: this.userData.role
        };
        
        toast.info(`📊 ${stats.modules}/${stats.modulesTotal} modules | ${stats.notifications} notifications`);
        console.log('📊 Statistiques complètes:', stats);
    }
    
    /**
     * Affiche les paramètres
     */
    showSettings() {
        console.log('⚙️ Affichage des paramètres');
        toast.info('Paramètres en développement');
    }
    
    /**
     * Affiche le support
     */
    showSupport() {
        console.log('🆘 Affichage du support');
        window.open('mailto:support@orixis.fr', '_blank');
    }
    
    /**
     * Rafraîchit la page
     */
    refresh() {
        console.log('🔄 Actualisation...');
        toast.info('Actualisation...');
        setTimeout(() => {
            location.reload();
        }, 500);
    }
    
    /**
     * Gère la déconnexion
     */
    async handleLogout() {
        const confirmed = confirm('Voulez-vous vraiment vous déconnecter ?');
        
        if (confirmed) {
            this.clearAuth();
            toast.success('Déconnexion réussie');
            
            setTimeout(() => {
                this.redirectToLogin();
            }, 1000);
        }
    }
    
    // ========================================
    // GESTION DU MAGASIN
    // ========================================
    
    /**
     * Change de magasin
     * @param {string} nouveauMagasin - Code du nouveau magasin
     */
    changeMagasin(nouveauMagasin) {
        if (nouveauMagasin === this.currentMagasin) return;
        
        if (!this.checkMagasinPermission(nouveauMagasin)) {
            toast.error('Vous n\'avez pas accès à ce magasin');
            return;
        }
        
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        auth.magasin = nouveauMagasin;
        localStorage.setItem('sav_auth', JSON.stringify(auth));
        
        this.currentMagasin = nouveauMagasin;
        
        toast.success(`Magasin changé : ${nouveauMagasin}`);
        
        setTimeout(() => {
            location.reload();
        }, 1000);
    }
    
    /**
     * Vérifie les permissions pour un magasin
     * @param {string} magasin - Code du magasin
     * @returns {boolean} True si autorisé
     */
    checkMagasinPermission(magasin) {
        if (this.permissions?.autorisations?.[magasin]?.acces === true) {
            return true;
        }
        
        const auth = JSON.parse(localStorage.getItem('sav_auth'));
        return auth.magasins?.includes(magasin);
    }
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    /**
     * Met à jour l'indicateur de filtre
     * @param {string} filter - Filtre actif
     * @param {number} count - Nombre de cartes visibles
     */
    updateFilterIndicator(filter, count) {
        if (this.header) {
            this.header.updateIndicator('filter', {
                text: filter === 'all' ? '' : `${count} modules`,
                type: 'info',
                show: filter !== 'all'
            });
        }
    }
    
    /**
     * Obtient les stats des commandes
     * @returns {Object} Statistiques
     */
    getCommandesStats() {
        return {
            value: '12',
            label: 'En cours',
            trend: 'up'
        };
    }
    
    /**
     * Obtient les stats des factures
     * @returns {Object} Statistiques
     */
    getFacturesStats() {
        return {
            value: '8',
            label: 'À payer',
            trend: 'stable'
        };
    }
    
    /**
     * Obtient le nombre de notifications
     * @returns {number} Nombre de notifications
     */
    getNotificationCount() {
        return 3; // Simulé - À remplacer par un appel API
    }
    
    /**
     * Vérifie si on est en mode développement
     * @returns {boolean} True si en mode dev
     */
    isDevMode() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               localStorage.getItem('dev_mode') === 'true';
    }
    
    /**
     * Affiche le message de bienvenue
     */
    showWelcomeMessage() {
        const hour = new Date().getHours();
        let greeting = 'Bonjour';
        
        if (hour >= 18) greeting = 'Bonsoir';
        else if (hour >= 12) greeting = 'Bon après-midi';
        
        const firstName = this.userData.name.split(' ')[0];
        toast.success(`${greeting} ${firstName} ! 👋`);
    }
    
    /**
     * Focus sur la barre de recherche
     */
    focusSearch() {
        const searchInput = document.querySelector('.hw-search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    /**
     * Ferme toutes les modals
     */
    closeAllModals() {
        this.header?.closeAllDropdowns();
    }
    
    /**
     * Track la navigation (analytics)
     * @param {Object} card - Carte cliquée
     */
    trackNavigation(card) {
        console.log(`📊 Navigation vers: ${card.title}`, {
            module: card.id,
            category: card.category,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Sauvegarde la dernière navigation
     * @param {Object} card - Carte cliquée
     */
    saveLastNavigation(card) {
        const navigation = {
            module: card.id,
            title: card.title,
            timestamp: Date.now()
        };
        
        localStorage.setItem('last_navigation', JSON.stringify(navigation));
    }
    
    /**
     * Précharge les données d'un module
     * @param {string} moduleId - ID du module
     */
    preloadModuleData(moduleId) {
        console.log(`📦 Préchargement module: ${moduleId}`);
    }
    
    /**
     * Efface l'authentification
     */
    clearAuth() {
        localStorage.removeItem('sav_auth');
        localStorage.removeItem('sav_user_permissions');
        localStorage.removeItem('last_navigation');
    }
    
    /**
     * Redirige vers la page de connexion
     */
    redirectToLogin() {
        window.location.href = '../../index.html';
    }
    
    /**
     * Cache le loader de chargement
     */
    hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }
    
    /**
     * Gère les erreurs d'initialisation
     * @param {Error} error - Erreur à gérer
     */
    handleInitError(error) {
        this.hideLoader();
        toast.error('Erreur lors du chargement du dashboard');
        console.error('Détails de l\'erreur:', error);
    }
    
    /**
     * Détruit l'orchestrateur et nettoie les ressources
     */
    destroy() {
        console.log('🗑️ Destruction de l\'orchestrateur...');
        
        // Détruire les widgets
        if (this.header) {
            this.header.destroy();
            this.header = null;
        }
        
        if (this.menuCards) {
            this.menuCards.destroy();
            this.menuCards = null;
        }
        
        // Nettoyer les événements (à implémenter si nécessaire)
        
        console.log('✅ Orchestrateur détruit');
    }
}

// ========================================
// EXPORT ET INITIALISATION
// ========================================

// Créer l'instance singleton
const orchestrator = new HomeOrchestrator();

// Export par défaut
export default orchestrator;

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [10/02/2025] - Version 2.0
   - Refactorisation complète du code
   - Documentation détaillée
   - Header qui scrolle avec la page
   - Espacement optimisé entre les éléments
   - Gestion d'erreurs améliorée
   - Support multi-magasin
   - Analytics et tracking
   ======================================== */