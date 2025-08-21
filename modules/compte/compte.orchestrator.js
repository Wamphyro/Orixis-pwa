// ========================================
// COMPTE.ORCHESTRATOR.JS - 🧠 CERVEAU DU MODULE COMPTE
// Chemin: modules/compte/compte.orchestrator.js
//
// DESCRIPTION:
// Orchestrateur principal du module compte utilisateur
// Gère l'intégralité de la logique métier, les widgets et l'état
// Architecture inspirée du module decompte-secu
//
// RESPONSABILITÉS:
// - Initialisation et authentification
// - Chargement des données utilisateur
// - Calcul des permissions (service intégré)
// - Gestion du PIN (service intégré)
// - Création et gestion des widgets
// - Changement de magasin
// - État centralisé de l'application
//
// VERSION: 2.0.0
// DATE: 09/01/2025
// ========================================

// ========================================
// IMPORTS DES WIDGETS
// Widgets réutilisables du système
// ========================================

import { HeaderWidget } from '../../widgets/header/header.widget.js';
import { StatsCardsWidget } from '../../widgets/stats-cards/stats-cards.widget.js';
import { SearchFiltersWidget } from '../../widgets/search-filters/search-filters.widget.js';
import { DataGridWidget } from '../../widgets/data-grid/data-grid.widget.js';
import { DetailViewerWidget } from '../../widgets/detail-viewer/detail-viewer.widget.js';
import toast from '../../widgets/toast/toast.widget.js';

// ========================================
// IMPORTS DES SERVICES
// ========================================

import { initFirebase } from '../../src/services/firebase.service.js';

// Import conditionnel des services locaux (créer les fichiers d'abord)
let firestoreService = null;
let template = null;

try {
    const module = await import('./compte.firestore.service.js');
    firestoreService = module.default;
} catch (error) {
    console.warn('⚠️ Service Firestore non trouvé, utilisation d\'un mock');
    // Mock service temporaire
    firestoreService = {
        getUser: async (id) => ({ id, nom: 'Test', prenom: 'User', codeHash: '', groupes: [], autorisations: {} }),
        getGroupes: async () => [],
        getMagasinsInfo: async () => [],
        updateUserPin: async () => true
    };
}

try {
    const module = await import('./compte.template.js');
    template = module.default;
} catch (error) {
    console.warn('⚠️ Template non trouvé, utilisation d\'un mock');
    // Mock template temporaire
    template = {
        USER_ACCOUNT_TEMPLATE: {},
        createNewUser: () => ({}),
        createHistoryEntry: () => ({})
    };
}

// ========================================
// CLASSE ORCHESTRATEUR
// ========================================

class CompteOrchestrator {
    constructor() {
        console.log('🎯 Création de l\'orchestrateur Compte');
        
        // ========================================
        // WIDGETS UI
        // Références aux widgets créés
        // ========================================
        
        this.widgets = {
            header: null,          // HeaderWidget - Navigation et actions
            statsCards: null,      // StatsCardsWidget - Vue d'ensemble
            magasinSelector: null  // SearchFiltersWidget - Sélection magasin
        };
        
        // ========================================
        // ÉTAT CENTRALISÉ
        // Toutes les données de l'application
        // ========================================
        
        this.state = {
            // Données utilisateur
            user: null,            // Objet utilisateur complet
            groupes: [],          // Groupes de l'utilisateur
            permissions: {},      // Permissions calculées
            magasins: [],         // Magasins autorisés
            currentMagasin: null, // Magasin actuel
            
            // Flow de modification PIN
            pinFlow: {
                active: false,    // Modal ouverte
                step: 'ancien',   // ancien | nouveau | confirm
                ancienCode: '',   // Code actuel saisi
                nouveauCode: '',  // Nouveau code saisi
                confirmCode: ''   // Confirmation saisie
            }
        };
        
        // ========================================
        // DONNÉES D'AUTHENTIFICATION
        // ========================================
        
        this.authData = null;     // Données auth du localStorage
    }
    
    // ========================================
    // INITIALISATION PRINCIPALE
    // Point d'entrée du module
    // ========================================
    
    async init() {
        try {
            console.log('🚀 === INITIALISATION MODULE COMPTE ===');
            this.showLoader();
            
            // ----------------------------------------
            // 1. VÉRIFICATION AUTHENTIFICATION
            // ----------------------------------------
            console.log('🔐 Étape 1: Vérification authentification...');
            if (!this.checkAuth()) {
                console.warn('❌ Non authentifié - Redirection vers login');
                window.location.href = '/Orixis-pwa/index.html';
                return;
            }
            console.log('✅ Authentification valide');
            
            // ----------------------------------------
            // 2. INITIALISATION FIREBASE
            // ----------------------------------------
            console.log('🔥 Étape 2: Initialisation Firebase...');
            await initFirebase();
            console.log('✅ Firebase initialisé');
            
            // ----------------------------------------
            // 3. CHARGEMENT DES DONNÉES
            // ----------------------------------------
            console.log('📊 Étape 3: Chargement des données utilisateur...');
            await this.loadUserData();
            console.log('✅ Données chargées');
            
            // ----------------------------------------
            // 4. CALCUL DES PERMISSIONS
            // ----------------------------------------
            console.log('🔐 Étape 4: Calcul des permissions...');
            this.calculatePermissions();
            console.log('✅ Permissions calculées');
            
            // ----------------------------------------
            // 5. CRÉATION DES WIDGETS
            // ----------------------------------------
            console.log('🎨 Étape 5: Création des widgets UI...');
            this.createWidgets();
            console.log('✅ Widgets créés');
            
            // ----------------------------------------
            // 6. RENDU DE L'INTERFACE
            // ----------------------------------------
            console.log('🖼️ Étape 6: Rendu de l\'interface...');
            this.renderUI();
            console.log('✅ Interface rendue');
            
            // ----------------------------------------
            // SUCCÈS
            // ----------------------------------------
            this.hideLoader();
            toast.success('Page compte chargée avec succès');
            console.log('🎉 === INITIALISATION TERMINÉE ===');
            
        } catch (error) {
            // ----------------------------------------
            // GESTION D'ERREUR
            // ----------------------------------------
            this.hideLoader();
            console.error('❌ === ERREUR INITIALISATION ===', error);
            toast.error('Erreur lors du chargement de la page');
            
            // Log détaillé pour debug
            console.error('Stack trace:', error.stack);
        }
    }
    
    // ========================================
    // AUTHENTIFICATION
    // ========================================
    
    /**
     * Vérifier l'authentification de l'utilisateur
     * @returns {boolean} True si authentifié
     */
    checkAuth() {
        console.log('🔍 Vérification authentification...');
        
        const auth = localStorage.getItem('sav_auth');
        if (!auth) {
            console.warn('⚠️ Pas de données auth dans localStorage');
            return false;
        }
        
        try {
            this.authData = JSON.parse(auth);
            const now = Date.now();
            
            // Vérifier l'expiration
            if (now - this.authData.timestamp > this.authData.expiry) {
                console.warn('⚠️ Session expirée');
                localStorage.removeItem('sav_auth');
                localStorage.removeItem('sav_user_permissions');
                return false;
            }
            
            console.log('✅ Auth valide pour:', this.authData.collaborateur?.nom);
            return this.authData.authenticated;
            
        } catch (error) {
            console.error('❌ Erreur parsing auth:', error);
            return false;
        }
    }
    
    // ========================================
    // CHARGEMENT DES DONNÉES
    // ========================================
    
    /**
     * Charger toutes les données de l'utilisateur
     */
    async loadUserData() {
        try {
            console.log('📊 === CHARGEMENT DES DONNÉES ===');
            
            // ----------------------------------------
            // RÉCUPÉRATION ID UTILISATEUR
            // ----------------------------------------
            const userId = this.authData.collaborateur?.id;
            if (!userId) {
                throw new Error('ID utilisateur manquant dans auth');
            }
            console.log('👤 ID utilisateur:', userId);
            
            // ----------------------------------------
            // CHARGEMENT UTILISATEUR
            // ----------------------------------------
            console.log('📥 Chargement utilisateur depuis Firestore...');
            this.state.user = await firestoreService.getUser(userId);
            if (!this.state.user) {
                throw new Error('Utilisateur non trouvé dans Firestore');
            }
            console.log('✅ Utilisateur chargé:', this.state.user.nom, this.state.user.prenom);
            
            // ----------------------------------------
            // CHARGEMENT GROUPES
            // ----------------------------------------
            if (this.state.user.groupes?.length > 0) {
                console.log('👥 Chargement des groupes...');
                this.state.groupes = await firestoreService.getGroupes(this.state.user.groupes);
                console.log(`✅ ${this.state.groupes.length} groupe(s) chargé(s):`, 
                    this.state.groupes.map(g => g.nom).join(', '));
            } else {
                console.log('ℹ️ Aucun groupe assigné');
            }
            
            // ----------------------------------------
            // CHARGEMENT MAGASINS AUTORISÉS
            // ----------------------------------------
            const magasinCodes = Object.keys(this.state.user.autorisations || {})
                .filter(code => this.state.user.autorisations[code].acces);
            
            if (magasinCodes.length > 0) {
                console.log('🏪 Chargement des magasins autorisés...');
                this.state.magasins = await firestoreService.getMagasinsInfo(magasinCodes);
                
                // Enrichir avec les autorisations
                this.state.magasins = this.state.magasins.map(mag => ({
                    ...mag,
                    ...this.state.user.autorisations[mag.code]
                }));
                
                console.log(`✅ ${this.state.magasins.length} magasin(s) autorisé(s):`, 
                    this.state.magasins.map(m => m.code).join(', '));
            } else {
                console.warn('⚠️ Aucun magasin autorisé');
            }
            
            // ----------------------------------------
            // DÉFINITION MAGASIN ACTUEL
            // ----------------------------------------
            this.state.currentMagasin = this.authData.magasin;
            console.log('📍 Magasin actuel:', this.state.currentMagasin);
            
            // ----------------------------------------
            // RÉSUMÉ
            // ----------------------------------------
            console.log('📊 === RÉSUMÉ DONNÉES CHARGÉES ===');
            console.log('- Utilisateur:', this.state.user.nom);
            console.log('- Groupes:', this.state.groupes.length);
            console.log('- Magasins:', this.state.magasins.length);
            console.log('- Magasin actuel:', this.state.currentMagasin);
            
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
            throw error;
        }
    }
    
    // ========================================
    // CALCUL DES PERMISSIONS (Service intégré)
    // ========================================
    
    /**
     * Calculer les permissions effectives de l'utilisateur
     * Fusion: Groupes + Direct + Magasin
     */
    calculatePermissions() {
        console.log('🔐 === CALCUL DES PERMISSIONS ===');
        
        const permissions = {
            pages: {},
            fonctionnalites: {}
        };
        
        // ----------------------------------------
        // 1. AGRÉGATION PERMISSIONS DES GROUPES
        // ----------------------------------------
        console.log('📊 Étape 1: Agrégation des permissions des groupes...');
        
        this.state.groupes.forEach(groupe => {
            console.log(`  Processing groupe: ${groupe.nom}`);
            
            // Permissions pages
            if (groupe.permissions?.pages) {
                Object.entries(groupe.permissions.pages).forEach(([page, perms]) => {
                    if (!permissions.pages[page]) {
                        permissions.pages[page] = {};
                    }
                    Object.assign(permissions.pages[page], perms);
                });
            }
            
            // Permissions fonctionnalités
            if (groupe.permissions?.fonctionnalites) {
                Object.assign(permissions.fonctionnalites, groupe.permissions.fonctionnalites);
            }
        });
        
        // ----------------------------------------
        // 2. APPLICATION PERMISSIONS DIRECTES
        // ----------------------------------------
        console.log('📊 Étape 2: Application des permissions directes (override)...');
        
        if (this.state.user.permissionsDirectes?.pages) {
            Object.entries(this.state.user.permissionsDirectes.pages).forEach(([page, perms]) => {
                if (!permissions.pages[page]) {
                    permissions.pages[page] = {};
                }
                Object.assign(permissions.pages[page], perms);
            });
        }
        
        if (this.state.user.permissionsDirectes?.fonctionnalites) {
            Object.assign(permissions.fonctionnalites, this.state.user.permissionsDirectes.fonctionnalites);
        }
        
        // ----------------------------------------
        // 3. RESTRICTIONS DU MAGASIN ACTUEL
        // ----------------------------------------
        console.log('📊 Étape 3: Application des restrictions du magasin...');
        
        const magasinAuth = this.state.user.autorisations?.[this.state.currentMagasin];
        if (magasinAuth) {
            permissions.delegation = {
                responsable: magasinAuth.responsable || false,
                permissions: magasinAuth.permissions || []
            };
            console.log('  - Responsable:', permissions.delegation.responsable);
            console.log('  - Permissions spéciales:', permissions.delegation.permissions);
        }
        
        // ----------------------------------------
        // SAUVEGARDE
        // ----------------------------------------
        this.state.permissions = permissions;
        
        // Sauvegarder dans localStorage pour autres modules
        localStorage.setItem('sav_user_permissions', JSON.stringify(permissions));
        
        // ----------------------------------------
        // RÉSUMÉ
        // ----------------------------------------
        console.log('🔐 === RÉSUMÉ PERMISSIONS ===');
        console.log('- Pages accessibles:', 
            Object.keys(permissions.pages).filter(p => permissions.pages[p].view).length);
        console.log('- Permissions spéciales:', 
            Object.values(permissions.fonctionnalites).filter(v => v === true).length);
        console.log('- Est responsable:', permissions.delegation?.responsable || false);
    }
    
    // ========================================
    // CRÉATION DES WIDGETS (Factory intégrée)
    // ========================================
    
    /**
     * Créer tous les widgets UI
     */
    createWidgets() {
        console.log('🎨 === CRÉATION DES WIDGETS ===');
        
        // ----------------------------------------
        // HEADER WIDGET
        // ----------------------------------------
        console.log('📍 Création du HeaderWidget...');
        
        this.widgets.header = new HeaderWidget({
            title: 'Mon Compte',
            subtitle: `${this.state.user.prenom} ${this.state.user.nom}`,
            
            // FOND DÉGRADÉ (comme decompte-mutuelle)
            theme: 'gradient',           // ✅ Changé
            pageBackground: 'colorful',  // ✅ Changé
            
            // Navigation
            showBack: true,
            backText: 'Retour',
            onBack: () => window.location.href = '/Orixis-pwa/Orixis-pwa/modules/home/home.html',
            
            // Le reste ne change pas...
            showSearch: false,
            showQuickActions: true,
            
            // Actions rapides
            showQuickActions: true,
            quickActions: [
                {
                    id: 'pin',
                    title: 'Modifier PIN',
                    icon: '🔐',
                    onClick: () => this.openPinModal()
                },
                {
                    id: 'refresh',
                    title: 'Actualiser',
                    icon: '🔄',
                    onClick: () => this.refresh()
                }
            ],
            
            // Indicateurs
            showIndicators: true,
            indicators: [
                {
                    id: 'magasin',
                    text: `Magasin: ${this.state.currentMagasin}`,
                    type: 'info'
                },
                {
                    id: 'groupes',
                    text: `${this.state.groupes.length} groupe(s)`,
                    type: 'success'
                }
            ],
            
            // Utilisateur et déconnexion
            showUser: true,
            showLogout: true,
            
            // Breadcrumbs
            showBreadcrumbs: true,
            breadcrumbs: [
                { text: 'Accueil', url: '/Orixis-pwa/modules/home/home.html' },
                { text: 'Mon Compte' }
            ]
        });
        
        console.log('✅ HeaderWidget créé');
        
        // ----------------------------------------
        // STATS CARDS WIDGET
        // ----------------------------------------
        console.log('📊 Création du StatsCardsWidget...');
        
        this.widgets.statsCards = new StatsCardsWidget({
            container: '.stats-container',
            showWrapper: true,
            wrapperStyle: 'card',
            wrapperTitle: '📊 Vue d\'ensemble',
            cards: [
                {
                    id: 'groupes',
                    label: 'Groupes',
                    icon: '👥',
                    value: this.state.groupes.length,
                    color: 'primary'
                },
                {
                    id: 'magasins',
                    label: 'Magasins autorisés',
                    icon: '🏪',
                    value: this.state.magasins.length,
                    color: 'success'
                },
                {
                    id: 'pages',
                    label: 'Pages accessibles',
                    icon: '📄',
                    value: Object.keys(this.state.permissions.pages || {})
                        .filter(p => this.state.permissions.pages[p].view).length,
                    color: 'info'
                },
                {
                    id: 'permissions',
                    label: 'Permissions spéciales',
                    icon: '⭐',
                    value: Object.values(this.state.permissions.fonctionnalites || {})
                        .filter(v => v === true).length,
                    color: 'warning'
                }
            ]
        });
        
        console.log('✅ StatsCardsWidget créé');
        
        // ----------------------------------------
        // MAGASIN SELECTOR WIDGET
        // ----------------------------------------
        console.log('🏪 Création du SearchFiltersWidget pour magasin...');
        
        this.widgets.magasinSelector = new SearchFiltersWidget({
            container: '.info-container',
            showWrapper: false,
            filters: [
                {
                    type: 'select',
                    key: 'magasin',
                    label: 'Magasin actuel',
                    value: this.state.currentMagasin,
                    options: this.state.magasins.map(m => ({
                        value: m.code,
                        label: `${m.code} - ${m.nom || m.code}`
                    })),
                    searchable: true
                }
            ],
            onFilter: (values) => {
                if (values.magasin && values.magasin !== this.state.currentMagasin) {
                    this.switchMagasin(values.magasin);
                }
            }
        });
        
        console.log('✅ SearchFiltersWidget créé');
        console.log('🎨 === WIDGETS CRÉÉS AVEC SUCCÈS ===');
    }
    
    // ========================================
    // AFFICHAGE UI
    // ========================================
    
    /**
     * Rendre l'interface utilisateur complète
     */
    renderUI() {
        console.log('🖼️ === RENDU DE L\'INTERFACE ===');
        
        // Informations personnelles et groupes
        this.renderUserInfo();
        
        // Permissions
        this.renderPermissions();
        
        // Magasins autorisés
        this.renderMagasins();
        
        console.log('✅ Interface rendue');
    }
    
    /**
     * Rendre la section informations utilisateur
     */
    renderUserInfo() {
        console.log('👤 Rendu section informations utilisateur...');
        
        const container = document.querySelector('.info-container');
        if (!container) {
            console.error('❌ Container .info-container non trouvé');
            return;
        }
        
        // ----------------------------------------
        // SECTION INFORMATIONS PERSONNELLES
        // ----------------------------------------
        const infoSection = document.createElement('div');
        infoSection.className = 'info-card';
        infoSection.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #1f2937; font-size: 20px; font-weight: 600;">
                👤 Informations personnelles
            </h3>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">NOM</span>
                    <span class="info-value" style="font-weight: 600;">${this.state.user.nom || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">PRÉNOM</span>
                    <span class="info-value" style="font-weight: 600;">${this.state.user.prenom || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">CODE PIN</span>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="info-value">••••</span>
                        <button class="btn btn-sm" style="background: #667eea; color: white; padding: 5px 12px; border-radius: 6px; border: none; cursor: pointer;" 
                                onclick="orchestrator.openPinModal()">
                            Modifier
                        </button>
                    </div>
                </div>
                <div class="info-item">
                    <span class="info-label">DERNIÈRE CONNEXION</span>
                    <span class="info-value">${this.formatDate(this.state.user.derniereConnexion)}</span>
                </div>
            </div>
        `;
        container.appendChild(infoSection);
        
        // ----------------------------------------
        // SECTION GROUPES
        // ----------------------------------------
        const groupesSection = document.createElement('div');
        groupesSection.className = 'info-card';
        
        if (this.state.groupes.length === 0) {
            groupesSection.innerHTML = `
                <h3 style="margin-bottom: 20px; color: #1f2937; font-size: 20px; font-weight: 600;">
                    👥 Mes groupes
                </h3>
                <p style="color: #6b7280; font-style: italic;">Aucun groupe assigné</p>
            `;
        } else {
            groupesSection.innerHTML = `
                <h3 style="margin-bottom: 20px; color: #1f2937; font-size: 20px; font-weight: 600;">
                    👥 Mes groupes
                </h3>
                <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px;">
                    ${this.state.groupes.map(g => `
                        <span style="background: ${g.couleur || '#667eea'}; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                            ${g.icon || '👥'} ${g.nom}
                        </span>
                    `).join('')}
                </div>
                ${this.state.groupes.map(g => `
                    <div style="margin-top: 15px; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 3px solid ${g.couleur || '#667eea'};">
                        <strong style="color: #1f2937;">${g.icon || '👥'} ${g.nom}</strong>
                        <p style="margin: 5px 0 0 0; color: #6b7280;">${g.description || 'Aucune description'}</p>
                    </div>
                `).join('')}
            `;
        }
        
        container.appendChild(groupesSection);
        
        console.log('✅ Section informations rendue');
    }
    
    /**
     * Rendre la section permissions
     */
    renderPermissions() {
        console.log('🔐 Rendu section permissions...');
        
        const container = document.querySelector('.permissions-container');
        if (!container) {
            console.error('❌ Container .permissions-container non trouvé');
            return;
        }
        
        const permissionsCard = document.createElement('div');
        permissionsCard.className = 'info-card';
        
        // Vérifier si des permissions existent
        const hasPages = Object.keys(this.state.permissions.pages || {}).length > 0;
        const hasFonctionnalites = Object.keys(this.state.permissions.fonctionnalites || {}).length > 0;
        
        if (!hasPages && !hasFonctionnalites) {
            permissionsCard.innerHTML = `
                <h3 style="margin-bottom: 20px; color: #1f2937; font-size: 20px; font-weight: 600;">
                    🔐 Mes permissions
                </h3>
                <p style="color: #6b7280; font-style: italic;">Aucune permission définie</p>
            `;
        } else {
            permissionsCard.innerHTML = `
                <h3 style="margin-bottom: 20px; color: #1f2937; font-size: 20px; font-weight: 600;">
                    🔐 Mes permissions
                </h3>
                <div class="permissions-grid">
                    <!-- Colonne Pages -->
                    <div>
                        <h4 style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                            📄 PAGES ACCESSIBLES
                        </h4>
                        ${Object.entries(this.state.permissions.pages || {}).length > 0 ? 
                            Object.entries(this.state.permissions.pages).map(([page, perms]) => {
                                const hasAccess = perms.view === true;
                                const actions = [];
                                if (perms.create) actions.push('Créer');
                                if (perms.edit) actions.push('Modifier');
                                if (perms.delete) actions.push('Supprimer');
                                
                                return `
                                    <div class="permission-item ${hasAccess ? 'granted' : 'denied'}">
                                        <span style="font-size: 18px;">${hasAccess ? '✅' : '❌'}</span>
                                        <span style="flex: 1; color: #1f2937;">
                                            ${this.formatPageName(page)}
                                            ${actions.length ? `<small style="color: #6b7280; display: block; font-size: 12px; margin-top: 2px;">(${actions.join(', ')})</small>` : ''}
                                        </span>
                                    </div>
                                `;
                            }).join('') : 
                            '<p style="color: #9ca3af; font-size: 14px;">Aucune page accessible</p>'
                        }
                    </div>
                    
                    <!-- Colonne Fonctionnalités -->
                    <div>
                        <h4 style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                            ⭐ PERMISSIONS SPÉCIALES
                        </h4>
                        ${Object.entries(this.state.permissions.fonctionnalites || {}).length > 0 ?
                            Object.entries(this.state.permissions.fonctionnalites).map(([fonc, granted]) => `
                                <div class="permission-item ${granted ? 'granted' : 'denied'}">
                                    <span style="font-size: 18px;">${granted ? '✅' : '❌'}</span>
                                    <span style="flex: 1; color: #1f2937;">${this.formatFonctionnaliteName(fonc)}</span>
                                </div>
                            `).join('') :
                            '<p style="color: #9ca3af; font-size: 14px;">Aucune permission spéciale</p>'
                        }
                    </div>
                </div>
            `;
        }
        
        container.appendChild(permissionsCard);
        console.log('✅ Section permissions rendue');
    }
    
    /**
     * Rendre la section magasins
     */
    renderMagasins() {
        console.log('🏪 Rendu section magasins...');
        
        const container = document.querySelector('.magasins-container');
        if (!container) {
            console.error('❌ Container .magasins-container non trouvé');
            return;
        }
        
        const magasinsCard = document.createElement('div');
        magasinsCard.className = 'info-card';
        
        if (this.state.magasins.length === 0) {
            magasinsCard.innerHTML = `
                <h3 style="margin-bottom: 20px; color: #1f2937; font-size: 20px; font-weight: 600;">
                    🏪 Magasins autorisés
                </h3>
                <p style="color: #6b7280; font-style: italic;">Aucun magasin autorisé</p>
            `;
        } else {
            magasinsCard.innerHTML = `
                <h3 style="margin-bottom: 20px; color: #1f2937; font-size: 20px; font-weight: 600;">
                    🏪 Magasins autorisés
                </h3>
                <div class="magasins-grid">
                    ${this.state.magasins.map(mag => `
                        <div class="magasin-card ${mag.code === this.state.currentMagasin ? 'active' : ''}"
                             style="background: ${mag.code === this.state.currentMagasin ? '#e0e7ff' : 'white'}; 
                                    border: 2px solid ${mag.code === this.state.currentMagasin ? '#667eea' : '#e5e7eb'};
                                    cursor: pointer; transition: all 0.2s ease;"
                             onclick="orchestrator.switchMagasin('${mag.code}')">
                            <div class="magasin-header" style="margin-bottom: 15px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <span style="font-size: 24px;">🏪</span>
                                    <span class="magasin-name">${mag.code}</span>
                                </div>
                                <div style="display: flex; gap: 5px;">
                                    ${mag.code === this.state.currentMagasin ? 
                                        '<span class="badge badge-active" style="background: #10b981; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px;">Actif</span>' : ''}
                                    ${mag.responsable ? 
                                        '<span class="badge badge-resp" style="background: #f59e0b; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px;">⭐ Resp.</span>' : ''}
                                </div>
                            </div>
                            <div style="color: #4b5563; font-size: 14px; margin-bottom: 8px; font-weight: 500;">
                                ${mag.nom || 'Sans nom'}
                            </div>
                            ${mag.societe?.raisonSociale ? `
                                <div style="color: #9ca3af; font-size: 13px; margin-bottom: 10px;">
                                    ${mag.societe.raisonSociale}
                                </div>
                            ` : ''}
                            ${mag.permissions?.length > 0 ? `
                                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f3f4f6;">
                                    <small style="color: #6b7280; font-size: 12px; font-weight: 500;">PERMISSIONS SPÉCIALES:</small>
                                    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 12px; color: #9ca3af;">
                                        ${mag.permissions.map(p => `<li style="margin: 3px 0;">${p}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                            ${mag.code !== this.state.currentMagasin ? `
                                <button style="width: 100%; margin-top: 15px; padding: 8px; background: #667eea; color: white; 
                                               border: none; border-radius: 6px; font-size: 14px; font-weight: 500; 
                                               cursor: pointer; transition: background 0.2s;"
                                        onmouseover="this.style.background='#5a67d8'"
                                        onmouseout="this.style.background='#667eea'"
                                        onclick="event.stopPropagation(); orchestrator.switchMagasin('${mag.code}')">
                                    Basculer vers ce magasin
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        container.appendChild(magasinsCard);
        console.log('✅ Section magasins rendue');
    }
    
    // ========================================
    // GESTION PIN (Service intégré)
    // ========================================
    
    /**
     * Ouvrir la modal de modification du PIN
     */
    async openPinModal() {
        console.log('🔐 Ouverture modal modification PIN...');
        
        // Utiliser DetailViewerWidget pour créer une modal custom
        const pinModal = new DetailViewerWidget({
            title: '🔐 Modifier le code PIN',
            subtitle: 'Changement sécurisé du code d\'accès',
            size: 'medium',
            theme: 'default',
            
            sections: [
                {
                    id: 'pin-form',
                    title: 'Nouveau code PIN',
                    fields: [
                        {
                            label: '',
                            value: `
                                <div style="text-align: center; padding: 20px;">
                                    <!-- Étape 1: Code actuel -->
                                    <div id="pin-step-ancien" style="display: block;">
                                        <h4>Saisissez votre code actuel</h4>
                                        <input type="password" id="pin-ancien" maxlength="4" 
                                               style="width: 150px; font-size: 24px; text-align: center; padding: 10px; margin: 20px auto; display: block;"
                                               placeholder="••••">
                                        <button class="btn btn-primary" onclick="orchestrator.verifyCurrentPin()">
                                            Vérifier
                                        </button>
                                        <div id="error-ancien" style="color: red; margin-top: 10px;"></div>
                                    </div>
                                    
                                    <!-- Étape 2: Nouveau code -->
                                    <div id="pin-step-nouveau" style="display: none;">
                                        <h4>Saisissez votre nouveau code</h4>
                                        <input type="password" id="pin-nouveau" maxlength="4"
                                               style="width: 150px; font-size: 24px; text-align: center; padding: 10px; margin: 20px auto; display: block;"
                                               placeholder="••••">
                                        <button class="btn btn-primary" onclick="orchestrator.setNewPin()">
                                            Suivant
                                        </button>
                                    </div>
                                    
                                    <!-- Étape 3: Confirmation -->
                                    <div id="pin-step-confirm" style="display: none;">
                                        <h4>Confirmez votre nouveau code</h4>
                                        <input type="password" id="pin-confirm" maxlength="4"
                                               style="width: 150px; font-size: 24px; text-align: center; padding: 10px; margin: 20px auto; display: block;"
                                               placeholder="••••">
                                        <button class="btn btn-success" onclick="orchestrator.confirmNewPin()">
                                            Valider
                                        </button>
                                        <div id="error-confirm" style="color: red; margin-top: 10px;"></div>
                                    </div>
                                </div>
                            `,
                            html: true
                        }
                    ]
                }
            ],
            
            actions: [
                {
                    label: 'Annuler',
                    class: 'btn btn-ghost',
                    onClick: () => {
                        this.resetPinFlow();
                        return true; // Fermer la modal
                    }
                }
            ]
        });
        
        this.state.pinFlow.active = true;
        console.log('✅ Modal PIN ouverte');
    }
    
    /**
     * Vérifier le code PIN actuel
     */
    async verifyCurrentPin() {
        console.log('🔍 Vérification du code actuel...');
        
        const pin = document.getElementById('pin-ancien').value;
        
        // Validation
        if (pin.length !== 4) {
            document.getElementById('error-ancien').textContent = 'Le code doit contenir 4 chiffres';
            return;
        }
        
        // Vérification
        const isValid = await this.verifyPin(pin);
        
        if (isValid) {
            console.log('✅ Code actuel valide');
            this.state.pinFlow.ancienCode = pin;
            
            // Passer à l'étape suivante
            document.getElementById('pin-step-ancien').style.display = 'none';
            document.getElementById('pin-step-nouveau').style.display = 'block';
        } else {
            console.log('❌ Code incorrect');
            document.getElementById('error-ancien').textContent = 'Code incorrect';
        }
    }
    
    /**
     * Définir le nouveau PIN
     */
    setNewPin() {
        console.log('📝 Définition du nouveau code...');
        
        const pin = document.getElementById('pin-nouveau').value;
        
        // Validation
        if (pin.length !== 4) {
            alert('Le code doit contenir 4 chiffres');
            return;
        }
        
        this.state.pinFlow.nouveauCode = pin;
        
        // Passer à l'étape de confirmation
        document.getElementById('pin-step-nouveau').style.display = 'none';
        document.getElementById('pin-step-confirm').style.display = 'block';
    }
    
    /**
     * Confirmer et sauvegarder le nouveau PIN
     */
    async confirmNewPin() {
        console.log('✔️ Confirmation du nouveau code...');
        
        const pin = document.getElementById('pin-confirm').value;
        
        // Vérification correspondance
        if (pin !== this.state.pinFlow.nouveauCode) {
            document.getElementById('error-confirm').textContent = 'Les codes ne correspondent pas';
            return;
        }
        
        try {
            // Mise à jour du PIN
            await this.updatePin(this.state.pinFlow.nouveauCode);
            
            console.log('✅ Code PIN modifié avec succès');
            toast.success('Code PIN modifié avec succès');
            
            // Reset et fermeture
            this.resetPinFlow();
            
            // La modal se fermera automatiquement via DetailViewerWidget
            
        } catch (error) {
            console.error('❌ Erreur modification PIN:', error);
            toast.error('Erreur lors de la modification du code');
        }
    }
    
    /**
     * Vérifier un code PIN
     * @param {string} pin - Code à vérifier
     * @returns {boolean} True si valide
     */
    async verifyPin(pin) {
        const hash = await this.hashPin(pin);
        return hash === this.state.user.codeHash;
    }
    
    /**
     * Mettre à jour le code PIN
     * @param {string} nouveauPin - Nouveau code
     */
    async updatePin(nouveauPin) {
        const hash = await this.hashPin(nouveauPin);
        await firestoreService.updateUserPin(this.state.user.id, hash);
        this.state.user.codeHash = hash;
    }
    
    /**
     * Hasher un code PIN en SHA-256
     * @param {string} pin - Code à hasher
     * @returns {string} Hash hexadécimal
     */
    async hashPin(pin) {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    /**
     * Réinitialiser le flow de modification PIN
     */
    resetPinFlow() {
        console.log('🔄 Reset du flow PIN');
        
        this.state.pinFlow = {
            active: false,
            step: 'ancien',
            ancienCode: '',
            nouveauCode: '',
            confirmCode: ''
        };
        
        // Reset UI si existe
        const steps = ['ancien', 'nouveau', 'confirm'];
        steps.forEach(step => {
            const el = document.getElementById(`pin-step-${step}`);
            if (el) el.style.display = step === 'ancien' ? 'block' : 'none';
            
            const input = document.getElementById(`pin-${step}`);
            if (input) input.value = '';
        });
    }
    
    // ========================================
    // ACTIONS MÉTIER
    // ========================================
    
    /**
     * Changer de magasin actif
     * @param {string} codeMagasin - Code du nouveau magasin
     */
    async switchMagasin(codeMagasin) {
        try {
            console.log(`🏪 Changement de magasin: ${this.state.currentMagasin} → ${codeMagasin}`);
            
            // Vérification même magasin
            if (codeMagasin === this.state.currentMagasin) {
                console.log('ℹ️ Même magasin, pas de changement');
                return;
            }
            
            // Vérifier autorisation
            const magasin = this.state.magasins.find(m => m.code === codeMagasin);
            if (!magasin) {
                console.error('❌ Magasin non autorisé:', codeMagasin);
                toast.error('Magasin non autorisé');
                return;
            }
            
            // Mettre à jour l'auth
            this.authData.magasin = codeMagasin;
            if (magasin.societe?.raisonSociale) {
                this.authData.raisonSociale = magasin.societe.raisonSociale;
            }
            
            // Sauvegarder
            localStorage.setItem('sav_auth', JSON.stringify(this.authData));
            
            console.log('✅ Magasin changé, rechargement...');
            toast.success(`Basculement vers ${codeMagasin}`);
            
            // Recharger après 1 seconde
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('❌ Erreur changement magasin:', error);
            toast.error('Erreur lors du changement de magasin');
        }
    }
    
    /**
     * Actualiser toutes les données
     */
    async refresh() {
        console.log('🔄 Actualisation des données...');
        toast.info('Actualisation...');
        
        try {
            // Recharger les données
            await this.loadUserData();
            
            // Recalculer les permissions
            this.calculatePermissions();
            
            // Nettoyer les conteneurs
            document.querySelector('.stats-container').innerHTML = '';
            document.querySelector('.info-container').innerHTML = '';
            document.querySelector('.permissions-container').innerHTML = '';
            document.querySelector('.magasins-container').innerHTML = '';
            
            // Recréer les widgets
            this.createWidgets();
            
            // Re-rendre l'UI
            this.renderUI();
            
            console.log('✅ Données actualisées');
            toast.success('Données actualisées');
            
        } catch (error) {
            console.error('❌ Erreur actualisation:', error);
            toast.error('Erreur lors de l\'actualisation');
        }
    }
    
    // ========================================
    // HELPERS DE FORMATAGE
    // ========================================
    
    /**
     * Formater le nom d'une page
     */
    formatPageName(page) {
        const mapping = {
            'interventions': '🔧 Interventions',
            'commandes': '📦 Commandes',
            'decompte-secu': '🏥 Décomptes Sécu',
            'decompte-mutuelle': '💊 Décomptes Mutuelle',
            'operations-bancaires': '💰 Opérations Bancaires',
            'clients': '👥 Clients',
            'planning': '📅 Planning',
            'statistiques': '📊 Statistiques'
        };
        
        return mapping[page] || page;
    }
    
    /**
     * Formater le nom d'une fonctionnalité
     */
    formatFonctionnaliteName(fonc) {
        const mapping = {
            'voir_tous_utilisateurs': 'Voir tous les utilisateurs',
            'creer_utilisateurs': 'Créer des utilisateurs',
            'modifier_utilisateurs': 'Modifier les utilisateurs',
            'supprimer_utilisateurs': 'Supprimer des utilisateurs',
            'modifier_tous_codes_pin': 'Modifier tous les codes PIN',
            'acces_tous_magasins': 'Accès à tous les magasins',
            'gerer_parametres_magasins': 'Gérer les paramètres magasins',
            'voir_statistiques_globales': 'Voir les statistiques globales',
            'voir_statistiques_magasin': 'Voir les statistiques du magasin',
            'exporter_donnees_globales': 'Exporter les données globales',
            'gerer_parametres_systeme': 'Gérer les paramètres système'
        };
        
        return mapping[fonc] || fonc.replace(/_/g, ' ');
    }
    
    /**
     * Formater une date
     */
    formatDate(date) {
        if (!date) return '-';
        
        const d = date.toDate ? date.toDate() : new Date(date);
        
        return d.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // ========================================
    // UI HELPERS
    // ========================================
    
    /**
     * Afficher le loader
     */
    showLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.remove('hidden');
    }
    
    /**
     * Masquer le loader
     */
    hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('hidden');
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const orchestrator = new CompteOrchestrator();

// Exposer globalement pour les onclick inline
window.orchestrator = orchestrator;

export default orchestrator;

/* ========================================
   HISTORIQUE
   
   [09/01/2025] - v2.0.0
   - Refactorisation complète basée sur decompte-secu
   - Orchestrateur unique avec état centralisé
   - Services intégrés (permissions et PIN)
   - Widgets réutilisables
   - Suppression des dépendances externes
   ======================================== */