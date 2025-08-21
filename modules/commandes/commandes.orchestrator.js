// ========================================
// COMMANDES.ORCHESTRATOR.JS - 🧠 CERVEAU UNIQUE
// Chemin: modules/commandes/commandes.orchestrator.js
//
// DESCRIPTION:
// Orchestre toute la logique métier et coordonne les widgets
// Centralise les workflows, la gestion d'état et les interactions
//
// VERSION: 2.0.0 - REFAIT PROPREMENT
// DATE: 09/08/2025
// ========================================

// ========================================
// IMPORTS DES WIDGETS
// ========================================
import { HeaderWidget } from '../../widgets/header/header.widget.js';
import { StatsCardsWidget } from '../../widgets/stats-cards/stats-cards.widget.js';
import { SearchFiltersWidget } from '../../widgets/search-filters/search-filters.widget.js';
import { DataGridWidget } from '../../widgets/data-grid/data-grid.widget.js';
import { FormModalWidget } from '../../widgets/form-modal/form-modal.widget.js';
import { DetailViewerWidget } from '../../widgets/detail-viewer/detail-viewer.widget.js';
import toast from '../../widgets/toast/toast.widget.js';

// ========================================
// IMPORTS DES SERVICES
// ========================================
import firestoreService from './commandes.firestore.service.js';
import { COMMANDE_TEMPLATE, createNewCommande, createHistoriqueEntry } from './commandes.template.js';

// ========================================
// IMPORT FIREBASE
// ========================================
import { initFirebase } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION MÉTIER
// ========================================
const CONFIG = {
    // Statuts workflow
    STATUTS: {
        nouvelle: { label: 'Nouvelle', icon: '📋', couleur: 'info', suivant: 'preparation' },
        preparation: { label: 'En préparation', icon: '🔧', couleur: 'warning', suivant: 'terminee' },
        terminee: { label: 'Préparée', icon: '✅', couleur: 'success', suivant: 'expediee' },
        expediee: { label: 'Expédiée', icon: '📦', couleur: 'primary', suivant: 'receptionnee' },
        receptionnee: { label: 'Réceptionnée', icon: '📥', couleur: 'info', suivant: 'livree' },
        livree: { label: 'Livrée', icon: '🎯', couleur: 'success', suivant: null },
        annulee: { label: 'Annulée', icon: '❌', couleur: 'danger', suivant: null }
    },
    
    // Types de préparation
    TYPES_PREPARATION: {
        appareil: { label: 'Première appareillage', icon: '👂', description: 'Première paire d\'appareils auditifs' },
        deuxieme_paire: { label: 'Deuxième paire', icon: '👂👂', description: 'Deuxième paire d\'appareils' },
        accessoire: { label: 'Accessoires', icon: '🎧', description: 'Accessoires et consommables' },
        reparation: { label: 'Réparation', icon: '🔧', description: 'Retour de réparation' }
    },
    
    // Niveaux d'urgence
    URGENCES: {
        normal: { label: 'Normal', icon: '🍃', delai: '3-5 jours', jours: 5 },
        urgent: { label: 'Urgent', icon: '⚡', delai: '48h', jours: 2 },
        tres_urgent: { label: 'Très urgent', icon: '🔥', delai: '24h', jours: 1 }
    }
};

// ========================================
// CLASSE ORCHESTRATEUR
// ========================================
class CommandesOrchestrator {
    constructor() {
        // ========================================
        // WIDGETS
        // ========================================
        this.header = null;
        this.stats = null;
        this.filters = null;
        this.grid = null;
        this.createModal = null;
        
        // ========================================
        // ÉTAT GLOBAL
        // ========================================
        this.commandesData = [];
        this.filteredData = [];
        this.currentFilters = {
            search: '',
            statuts: [],
            urgence: '',
            magasin: '',
            periode: 'all'
        };
        
        // ========================================
        // CACHE
        // ========================================
        this.clientsCache = new Map();
        this.produitsCache = new Map();
        this.magasinsCache = null;
        
        // ========================================
        // ÉTAT UI
        // ========================================
        this.isLoading = false;
        this.currentFormData = {};
    }
    
    // ========================================
    // INITIALISATION PRINCIPALE
    // ========================================
    
    async init() {
        try {
            this.showLoader();
            console.log('🚀 Initialisation de l\'orchestrateur Commandes...');
            
            if (!this.checkAuth()) {
                this.showError('Vous devez être connecté pour accéder à cette page');
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
                return;
            }
            
            console.log('🔥 Initialisation Firebase...');
            await initFirebase();
            console.log('✅ Firebase initialisé');
            
            await this.loadReferenceData();
            await this.createWidgets();
            await this.loadData();
            
            this.hideLoader();
            this.showSuccess('Application prête !');
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur initialisation : ' + error.message);
            console.error('Erreur complète:', error);
        }
    }
    
    checkAuth() {
        const auth = localStorage.getItem('sav_auth');
        return !!auth;
    }
    
    async loadReferenceData() {
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('../../src/services/firebase.service.js');
            
            const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
            this.magasinsCache = [];
            
            magasinsSnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.actif !== false) {
                    this.magasinsCache.push({
                        id: doc.id,
                        code: data.code || doc.id,
                        nom: data.nom || data.code || doc.id
                    });
                }
            });
            
            console.log(`✅ ${this.magasinsCache.length} magasins chargés`);
            
        } catch (error) {
            console.error('Erreur chargement données de référence:', error);
        }
    }
    
    // ========================================
    // CRÉATION DES WIDGETS (COPIÉ DE DECOMPTE)
    // ========================================
    
    async createWidgets() {
        console.log('🎨 Création des widgets...');
        
        this.createHeader();
        this.createStatsCards();
        this.createFilters();
        this.createDataGrid();
        
        console.log('✅ Widgets créés');
    }
    
    createHeader() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        this.header = new HeaderWidget({
            // FOND DÉGRADÉ
            pageBackground: 'colorful',
            theme: 'gradient',
            
            // PERSONNALISATION DES BOUTONS
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
                    maxWidth: '220px'
                },
                indicator: {
                    height: '48px',
                    padding: '10px 16px',
                    minWidth: 'auto'
                }
            },
            
            // TEXTES
            title: '📦 Gestion des Commandes',
            subtitle: 'Appareils et accessoires',
            centerTitle: true,
            
            // LOGO
            showLogo: true,
            logoIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
            
            // NAVIGATION
            showBack: true,
            backText: 'Retour',
            onBack: () => {
                window.location.href = '/Orixis-pwa/modules/home/home.html';
            },
            
            // RECHERCHE
            showSearch: true,
            searchPlaceholder: 'Rechercher commande, client...',
            searchMaxWidth: '1500px',
            searchHeight: '48px',
            onSearch: (query) => {
                this.currentFilters.search = query;
                this.applyFilters();
            },
            
            // BOUTONS RAPIDES - AJOUT DU BOUTON RESET
            showQuickActions: true,
            quickActions: [
                {
                    id: 'new',
                    title: 'Nouvelle commande',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
                    onClick: () => this.openCreateModal()
                },
                {
                    id: 'export',
                    title: 'Export Excel',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>',
                    onClick: () => this.grid?.export('excel')
                },
                {
                    id: 'reset',
                    title: 'Réinitialiser',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
                    onClick: () => this.resetAllFilters()
                },
                {
                    id: 'refresh',
                    title: 'Actualiser',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
                    onClick: () => {
                        window.location.reload(true);
                    }
                }
            ],
            
            // INDICATEURS - SUPPRESSION DE L'INDICATEUR COUNT
            showIndicators: true,
            indicators: [
                {
                    id: 'status',
                    text: 'Connecté',
                    type: 'success',
                    animated: true
                }
                // SUPPRIMÉ : indicateur 'count'
            ],
            
            // NOTIFICATIONS
            showNotifications: true,
            showUser: true,
            showUserDropdown: true,
            showMagasin: true,
            showLogout: true
        });
    }
    
    createStatsCards() {
        this.stats = new StatsCardsWidget({
            container: '.stats-container',
            showWrapper: true,
            wrapperStyle: 'card',
            size: 'md',
            selectionMode: 'multiple',
            animated: true,
            cards: Object.entries(CONFIG.STATUTS)
                .filter(([key]) => key !== 'annulee')
                .map(([key, statut]) => ({
                    id: key,
                    label: statut.label,
                    icon: statut.icon,
                    value: 0,
                    color: statut.couleur
                })),
            onSelect: (selectedIds) => {
                this.currentFilters.statuts = selectedIds;
                this.applyFilters();
            }
        });
    }
    
createFilters() {
    this.filters = new SearchFiltersWidget({
        container: '.filters-container',
        showWrapper: true,
        wrapperStyle: 'card',
        wrapperTitle: 'Filtres',
        resetButton: false,  // ⚡ DÉSACTIVATION DU BOUTON RESET
        filters: [
            { 
                type: 'select', 
                key: 'urgence', 
                label: 'Urgence',
                options: [
                    { value: '', label: 'Toutes' },
                    ...Object.entries(CONFIG.URGENCES).map(([key, urgence]) => ({
                        value: key,
                        label: `${urgence.icon} ${urgence.label}`
                    }))
                ]
            },
            { 
                type: 'select', 
                key: 'magasin', 
                label: 'Magasin',
                options: [
                    { value: '', label: 'Tous les magasins' },
                    ...(this.magasinsCache || []).map(m => ({
                        value: m.code,
                        label: m.nom
                    }))
                ],
                searchable: true
            },
            { 
                type: 'select', 
                key: 'periode', 
                label: 'Période',
                options: [
                    { value: 'all', label: 'Toutes' },
                    { value: 'today', label: "Aujourd'hui" },
                    { value: 'week', label: 'Cette semaine' },
                    { value: 'month', label: 'Ce mois' }
                ]
            }
        ],
        onFilter: (values) => {
            this.currentFilters = { 
                ...this.currentFilters, 
                ...values,
                statuts: this.currentFilters.statuts
            };
            this.applyFilters();
        }
    });
}
    
    createDataGrid() {
        this.grid = new DataGridWidget({
            container: '.table-container',
            showWrapper: true,
            wrapperStyle: 'card',
            columns: [
                { 
                    key: 'numeroCommande', 
                    label: 'N° Commande', 
                    sortable: true, 
                    width: 140
                },
                { 
                    key: 'dates.commande', 
                    label: 'Date', 
                    sortable: true, 
                    width: 100,
                    formatter: (v) => this.formatDate(v)
                },
                { 
                    key: 'client', 
                    label: 'Client', 
                    sortable: true, 
                    width: 200,
                    formatter: (client) => client ? `${client.prenom} ${client.nom}` : '-'
                },
                { 
                    key: 'typePreparation', 
                    label: 'Type', 
                    sortable: true, 
                    width: 120,
                    formatter: (v) => {
                        const type = CONFIG.TYPES_PREPARATION[v];
                        return type ? `${type.icon} ${type.label}` : v;
                    }
                },
                { 
                    key: 'niveauUrgence', 
                    label: 'Urgence', 
                    sortable: true, 
                    width: 100,
                    formatter: (v) => {
                        const urgence = CONFIG.URGENCES[v];
                        return urgence ? `${urgence.icon} ${urgence.label}` : v;
                    }
                },
                { 
                    key: 'statut', 
                    label: 'Statut', 
                    sortable: true,
                    width: 120,
                    formatter: (v) => {
                        const statut = CONFIG.STATUTS[v];
                        return statut ? 
                            `<span class="badge badge-${statut.couleur}">${statut.icon} ${statut.label}</span>` : v;
                    }
                },
                { 
                    type: 'actions',
                    label: 'Actions',
                    width: 100,
                    actions: [
                        { 
                            type: 'view',
                            title: 'Voir les détails',
                            onClick: (row) => this.openDetailModal(row)
                        }
                    ]
                }
            ],
            data: [],
            features: {
                sort: true,
                export: true,
                selection: false,
                pagination: true
            },
            pagination: {
                itemsPerPage: 10,
                pageSizeOptions: [10, 20, 50, 100]
            }
        });
    }
    
    // ========================================
    // CHARGEMENT DES DONNÉES
    // ========================================
    
async loadData() {
    try {
        this.showLoader();
        console.log('📊 Chargement des données...');
        
        this.commandesData = await firestoreService.getCommandes({ limite: 100 });
        
        console.log(`✅ ${this.commandesData.length} commandes chargées`);
        
        this.updateStats();
        this.applyFilters();
        this.hideLoader();
        
    } catch (error) {
        this.hideLoader();
        this.showError('Erreur chargement données : ' + error.message);
        console.error('Erreur complète:', error);
    }
}
    
    updateStats() {
        const stats = {};
        
        Object.keys(CONFIG.STATUTS).forEach(statut => {
            stats[statut] = 0;
        });
        
        this.commandesData.forEach(commande => {
            if (stats[commande.statut] !== undefined) {
                stats[commande.statut]++;
            }
        });
        
        if (this.stats) {
            this.stats.updateAll(stats);
        }
    }
    
    applyFilters() {
        console.log('🔍 Application des filtres:', this.currentFilters);
        
        this.filteredData = this.commandesData.filter(commande => {
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                const clientNom = commande.client ? 
                    `${commande.client.prenom} ${commande.client.nom}`.toLowerCase() : '';
                const numero = (commande.numeroCommande || '').toLowerCase();
                
                if (!clientNom.includes(search) && !numero.includes(search)) {
                    return false;
                }
            }
            
            if (this.currentFilters.statuts.length > 0) {
                if (!this.currentFilters.statuts.includes(commande.statut)) {
                    return false;
                }
            }
            
            if (this.currentFilters.urgence) {
                if (commande.niveauUrgence !== this.currentFilters.urgence) {
                    return false;
                }
            }
            
            if (this.currentFilters.magasin) {
                if (commande.magasinLivraison !== this.currentFilters.magasin) {
                    return false;
                }
            }
            
            if (this.currentFilters.periode !== 'all') {
                const date = this.parseDate(commande.dates?.commande);
                if (!date) return false;
                
                const now = new Date();
                switch (this.currentFilters.periode) {
                    case 'today':
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (date < today) return false;
                        break;
                    case 'week':
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        if (date < weekAgo) return false;
                        break;
                    case 'month':
                        const monthAgo = new Date();
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        if (date < monthAgo) return false;
                        break;
                }
            }
            
            return true;
        });
        
        if (this.grid) {
            this.grid.setData(this.filteredData);
            console.log(`✅ ${this.filteredData.length} commandes affichées`);
        }
    }

    /**
     * Réinitialiser tous les filtres depuis le header
     */
    resetAllFilters() {
        console.log('🔄 Réinitialisation de tous les filtres');
        
        // Réinitialiser les filtres
        this.currentFilters = {
            search: '',
            statuts: [],
            urgence: '',
            magasin: '',
            periode: 'all'
        };
        
        // Désélectionner toutes les cartes stats
        if (this.stats) {
            this.stats.deselectAll();
        }
        
        // Réinitialiser les valeurs dans le widget de filtres
        if (this.filters) {
            this.filters.reset();
        }
        
        // Réinitialiser la barre de recherche du header
        if (this.header && this.header.clearSearch) {
            this.header.clearSearch();
        }
        
        // Appliquer les filtres réinitialisés
        this.applyFilters();
        
        this.showInfo('Filtres réinitialisés');
    }
    
    // ========================================
    // CRÉATION DE COMMANDE - AVEC FORMMODAL
    // ========================================
    
async openCreateModal() {
    console.log('📦 Ouverture modal création commande');
    
    // État local pour cette modal
    const modalState = {
        selectedClient: null,
        selectedProducts: [],
        packTemplates: [],
        produitsCache: [],
        magasins: this.magasinsCache || []
    };
    
    // IMPORTANT : Charger les packs AVANT de créer le widget
    await this.loadPackTemplates(modalState);
    
    // Créer et ouvrir automatiquement la modal
    this.createModal = new FormModalWidget({
        title: '📦 Nouvelle Commande',
        theme: 'blue',
        size: 'large',
        height: '85vh',
        minHeight: '600px',
        maxHeight: '90vh',
        autoOpen: true,
        destroyOnClose: true,
        
        steps: [
            // ========================================
            // ÉTAPE 1 : SÉLECTION DU CLIENT
            // ========================================
            {
                id: 'client',
                title: '👤 Sélection du Client',
                icon: '👤',
                fields: [
                    {
                        key: 'clientId',
                        type: 'search',
                        label: 'Client',
                        placeholder: 'Rechercher par nom, prénom, téléphone...',
                        required: true,
                        minLength: 2,
                        
                        onSearch: async (query) => {
                            return await this.searchClients(query);
                        },
                        
                        renderResult: (client) => `
                            <div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;">
                                <div style="font-weight: 600; color: #2c3e50; font-size: 14px;">
                                    ${client.prenom} ${client.nom}
                                </div>
                                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                    ${client.telephone ? `📱 ${client.telephone}` : ''}
                                    ${client.telephoneFixe ? ` • ☎️ ${client.telephoneFixe}` : ''}
                                    ${client.email ? ` • ✉️ ${client.email}` : ''}
                                </div>
                                ${client.magasinReference ? `
                                    <div style="font-size: 11px; color: #999; margin-top: 2px;">
                                        🏪 Magasin: ${client.magasinReference}
                                    </div>
                                ` : ''}
                            </div>
                        `,
                        
                        displayValue: (client) => `${client.prenom} ${client.nom}`,
                        valueId: (client) => client.id,
                        
                        onSelect: (client) => {
                            console.log('✅ Client sélectionné:', client);
                            modalState.selectedClient = client;
                            
                            if (client.magasinReference && this.createModal) {
                                // Après la création du modal
                                setTimeout(() => {
                                    // Retirer le focus de tous les champs
                                    document.activeElement?.blur();
                                }, 100);
                            }
                            
                            return client.id;
                        }
                    }
                ]
            },


            // ========================================
            // ÉTAPE 2 : SÉLECTION DES PRODUITS - VERSION AVEC LISTE DÉROULANTE
            // ========================================
            {
                id: 'produits',
                title: '📦 Sélection des Produits',
                icon: '📦',
                fields: [
                    {
                        key: 'pack',
                        type: 'search',
                        label: 'Pack prédéfini (optionnel)',
                        placeholder: 'Cliquez pour voir tous les packs ou tapez pour rechercher...',
                        required: false,
                        minLength: 0,              // ⚡ Permet l'affichage immédiat
                        showAllOnFocus: true,       // ⚡ NOUVEAU : Affiche tout au clic
                        clearOnSelect: true,
                        
                        onSearch: async (query) => {
                            // Si pas de recherche, retourner TOUS les packs
                            if (!query || query.length === 0) {
                                return modalState.packTemplates;
                            }
                            // Sinon filtrer
                            return modalState.packTemplates.filter(p => 
                                p.nom.toLowerCase().includes(query.toLowerCase())
                            );
                        },
                        
                        renderResult: (pack) => `
                            <div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;">
                                <div style="font-weight: 600; color: #2c3e50; font-size: 14px;">
                                    ${pack.nom}
                                </div>
                                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                    ${pack.description || ''}
                                </div>
                                <div style="font-size: 11px; color: #999; margin-top: 2px;">
                                    ${pack.produits?.length || 0} produits
                                </div>
                            </div>
                        `,
                        
                        displayValue: (pack) => pack.nom,
                        valueId: (pack) => pack.id,
                        
                        onSelect: async (pack) => {
                            console.log('✅ Pack sélectionné:', pack);
                            
                            // Appliquer le pack au panier
                            await this.applyPackToCart(pack.id, modalState);
                            
                            // Rafraîchir le panier
                            this.createModal.setFieldValue('produits', [...modalState.selectedProducts]);
                            this.createModal.refreshCurrentStep();
                            
                            // RETOURNER NULL pour vider le champ
                            return null;
                        }
                    },
                    {
                        key: 'searchProduct',
                        type: 'search',
                        label: 'Ajouter un produit',
                        placeholder: 'Cliquez pour voir tous les produits ou tapez pour rechercher...',
                        clearOnSelect: true,
                        minLength: 0,              // ⚡ Permet l'affichage immédiat
                        showAllOnFocus: true,       // ⚡ NOUVEAU : Affiche tout au clic
                        
                        onSearch: async (query) => {
                            // Charger les produits si pas en cache
                            if (!modalState.produitsCache || modalState.produitsCache.length === 0) {
                                await this.loadProduitsCache(modalState);
                            }
                            
                            // Si pas de recherche, retourner TOUS les produits
                            if (!query || query.length === 0) {
                                return modalState.produitsCache.slice(0, 50);  // Limiter à 50 pour la performance
                            }
                            
                            // Sinon filtrer
                            const searchLower = query.toLowerCase();
                            return modalState.produitsCache
                                .filter(p => {
                                    const searchStr = `${p.designation} ${p.reference} ${p.marque || ''}`.toLowerCase();
                                    return searchStr.includes(searchLower);
                                })
                                .slice(0, 50);  // Limiter les résultats
                        },
                        
                        renderResult: (produit) => `
                            <div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;">
                                <div style="font-weight: 600; color: #2c3e50;">
                                    ${produit.designation}
                                </div>
                                <div style="font-size: 12px; color: #666; margin-top: 4px;">
                                    Réf: ${produit.reference} - ${produit.marque || ''}
                                </div>
                                ${produit.prix ? `
                                    <div style="font-size: 11px; color: #10b981; margin-top: 2px;">
                                        Prix: ${produit.prix} €
                                    </div>
                                ` : ''}
                            </div>
                        `,
                        
                        displayValue: (produit) => produit.designation,
                        valueId: (produit) => produit.id,
                        
                        onSelect: async (produit) => {
                            // Ajouter au panier
                            await this.addProductToCart(produit, modalState);
                            
                            // Rafraîchir le panier
                            this.createModal.setFieldValue('produits', [...modalState.selectedProducts]);
                            this.createModal.refreshCurrentStep();
                            
                            // RETOURNER NULL pour vider le champ
                            return null;
                        }
                    },
                    {
                        key: 'produits',
                        type: 'cart',
                        label: 'Produits sélectionnés',
                        required: true,
                        emptyText: 'Aucun produit sélectionné',
                        editable: true,
                        
                        renderItem: (item, index) => `
                            <div class="cart-item" data-item-index="${index}">
                                <div class="cart-item-info">
                                    <span class="item-name">${item.designation}</span>
                                    <span class="item-reference" style="font-size: 12px; color: #666;">
                                        Réf: ${item.reference} ${item.cote ? `- ${item.cote}` : ''}
                                    </span>
                                </div>
                                <div class="cart-item-actions">
                                    <input type="number" 
                                        class="item-quantity" 
                                        value="${item.quantite || 1}" 
                                        min="1"
                                        data-item-index="${index}">
                                    <button class="btn-remove-item" 
                                            type="button"
                                            data-item-index="${index}">×</button>
                                </div>
                            </div>
                        `,
                        
                        onQuantityChange: (item, quantity, index) => {
                            modalState.selectedProducts[index].quantite = quantity;
                            console.log('Quantité modifiée:', item.designation, quantity);
                        },
                        
                        onRemoveItem: (item, index) => {
                            modalState.selectedProducts.splice(index, 1);
                            this.createModal.setFieldValue('produits', [...modalState.selectedProducts]);
                            console.log('Produit retiré:', item.designation);
                        }
                    }
                ]
            },
            
            // ========================================
            // ÉTAPE 3 : INFORMATIONS DE LIVRAISON - VERSION AMÉLIORÉE
            // ========================================
            {
                id: 'livraison',
                title: '🚚 Informations de Livraison',
                icon: '🚚',
                fields: [
                    {
                        key: 'typePreparation',
                        type: 'select',
                        label: 'Type de préparation',
                        required: true,
                        placeholder: '-- Sélectionner un type --',
                        options: [
                            { value: 'appareil', label: '👂 Première appareillage', description: 'Première paire d\'appareils auditifs' },
                            { value: 'deuxieme_paire', label: '👂👂 Deuxième paire', description: 'Deuxième paire d\'appareils' },
                            { value: 'accessoire', label: '🎧 Accessoires', description: 'Accessoires et consommables' },
                            { value: 'reparation', label: '🔧 Réparation', description: 'Retour de réparation' }
                        ]
                    },
                    {
                        key: 'niveauUrgence',
                        type: 'radio-group',
                        label: "Niveau d'urgence",
                        required: true,
                        options: Object.entries(CONFIG.URGENCES).map(([key, urgence]) => ({
                            value: key,
                            label: `${urgence.icon} ${urgence.label} (${urgence.delai})`
                        })),
                    },
                    {
                        key: 'magasinLivraison',
                        type: 'select',
                        label: 'Magasin de livraison',
                        required: true,
                        placeholder: '-- Sélectionner un magasin --',
                        searchable: true,
                        options: []  // Sera rempli dynamiquement
                    },
                    {
                        key: 'dateLivraison',
                        type: 'date',
                        label: 'Date de livraison',
                        required: true,
                        min: new Date().toISOString().split('T')[0],
                        help: 'La date sera ajustée selon le niveau d\'urgence'
                    },
                    {
                        key: 'commentaires',
                        type: 'textarea',
                        label: 'Commentaires',
                        placeholder: 'Instructions particulières, informations complémentaires...',
                        rows: 4,
                        maxLength: 500,
                        help: 'Optionnel - Maximum 500 caractères'
                    }
                ],
                onBeforeShow: async () => {
                    // Charger les magasins avant d'afficher l'étape
                    try {
                        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                        const { db } = await import('../../src/services/firebase.service.js');
                        
                        const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
                        const magasins = [];
                        
                        magasinsSnapshot.forEach((doc) => {
                            const data = doc.data();
                            if (data.actif !== false) {
                                const code = data.code || doc.id;
                                const nom = data.nom || '';
                                
                                magasins.push({
                                    value: code,
                                    label: nom && nom !== code ? `${code} - ${nom}` : code
                                });
                            }
                        });
                        
                        // Ajouter le magasin du client s'il n'est pas dans la liste
                        if (modalState.selectedClient?.magasinReference) {
                            const magasinClient = modalState.selectedClient.magasinReference;
                            if (!magasins.find(m => m.value === magasinClient)) {
                                magasins.push({
                                    value: magasinClient,
                                    label: magasinClient
                                });
                            }
                        }
                        
                        // Trier par code
                        magasins.sort((a, b) => a.value.localeCompare(b.value));
                        
                        // Mettre à jour les options du champ magasin
                        const magasinField = this.createModal.config.steps[2].fields.find(f => f.key === 'magasinLivraison');
                        if (magasinField) {
                            magasinField.options = magasins;
                        }
                        
                        // Rafraîchir l'affichage
                        this.createModal.refreshCurrentStep();
                        
                    } catch (error) {
                        console.error('Erreur chargement magasins:', error);
                        toast.error('Erreur lors du chargement des magasins');
                    }
                }
            },
            
            // ========================================
            // ÉTAPE 4 : RÉCAPITULATIF
            // ========================================
            {
                id: 'recap',
                title: '✅ Récapitulatif',
                icon: '✅',
                fields: [
                    {
                        type: 'summary',
                        template: (data) => {
                            const client = modalState.selectedClient;
                            const products = modalState.selectedProducts;
                            
                            if (!client || !products.length) {
                                return '<p class="text-danger">Données manquantes</p>';
                            }
                            
                            return `
                                <div style="display: grid; gap: 20px;">
                                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                                        <h5>👤 Client</h5>
                                        <p><strong>${client.prenom} ${client.nom}</strong></p>
                                        <p>${client.telephone || ''}</p>
                                    </div>
                                    
                                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                                        <h5>📦 Produits (${products.length})</h5>
                                        ${products.map(p => `
                                            <div>${p.designation} ${p.cote ? '(' + p.cote + ')' : ''} x${p.quantite || 1}</div>
                                        `).join('')}
                                    </div>
                                    
                                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                                        <h5>🚚 Livraison</h5>
                                        <p>Type: ${CONFIG.TYPES_PREPARATION[data.typePreparation]?.label}</p>
                                        <p>Urgence: ${CONFIG.URGENCES[data.niveauUrgence]?.label}</p>
                                        <p>Magasin: ${data.magasinLivraison}</p>
                                        <p>Date: ${new Date(data.dateLivraison).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                </div>
                            `;
                        }
                    }
                ]
            }
        ],
        
        timeline: {
            enabled: true,
            theme: 'colorful',
            orientation: 'horizontal',
            animated: true
        },
        
        navigation: {
            showPrevious: true,
            showNext: true,
            previousText: '← Précédent',
            nextText: 'Suivant →',
            finishText: '✓ Créer la commande'
        },
        
        validation: {
            enabled: true,
            validateOnNext: true
        },
        
        initialData: {
            produits: [],
            pack: null,
            searchProduct: null,
        },
        
onValidateStep: async (stepIndex, data) => {
    switch (stepIndex) {
        case 0:  // Étape client
            if (!modalState.selectedClient) {
                toast.error('Veuillez sélectionner un client');
                return false;
            }
            break;
            
        case 1:  // Étape produits
            if (!modalState.selectedProducts.length) {
                toast.error('Veuillez ajouter au moins un produit');
                return false;
            }
            data.produits = modalState.selectedProducts;
            break;
            
        case 2:  // Étape livraison
            // DEBUG : Voir ce que contiennent les données
            console.log('🔍 VALIDATION ÉTAPE 3 - Données:', data);
            console.log('typePreparation:', data.typePreparation);
            console.log('niveauUrgence:', data.niveauUrgence);
            console.log('magasinLivraison:', data.magasinLivraison);
            console.log('dateLivraison:', data.dateLivraison);
            
            // Type de préparation
            if (!data.typePreparation || data.typePreparation === '') {
                toast.error('Veuillez sélectionner un type de préparation');
                return false;
            }
            
            // Niveau d'urgence
            if (!data.niveauUrgence || data.niveauUrgence === '') {
                toast.error('Veuillez sélectionner un niveau d\'urgence');
                return false;
            }
            
            // Magasin
            if (!data.magasinLivraison || data.magasinLivraison === '') {
                toast.error('Veuillez sélectionner un magasin de livraison');
                return false;
            }
            
            // Date - FORCER LA VALIDATION
            console.log('🔍 Date value:', data.dateLivraison, 'Type:', typeof data.dateLivraison);
            
            // Vérifier TOUS les cas possibles
            if (!data.dateLivraison || 
                data.dateLivraison === '' || 
                data.dateLivraison === null || 
                data.dateLivraison === undefined ||
                data.dateLivraison === 'Invalid Date') {
                toast.error('⚠️ Veuillez sélectionner une date de livraison');
                return false;
            }
            
            break;
    }
    return true;
},
        
        onSave: async (data) => {
            try {
                this.showLoader();
                
                const commandeData = {
                    clientId: data.clientId,
                    client: modalState.selectedClient,
                    produits: modalState.selectedProducts,
                    typePreparation: data.typePreparation,
                    niveauUrgence: data.niveauUrgence,
                    magasinLivraison: data.magasinLivraison,
                    dateLivraison: new Date(data.dateLivraison),
                    commentaires: data.commentaires || '',
                    statut: 'nouvelle'
                };
                
                await firestoreService.creerCommande(commandeData);
                await this.loadData();
                
                this.hideLoader();
                toast.success('Commande créée avec succès !');
                return true;
                
            } catch (error) {
                this.hideLoader();
                toast.error('Erreur : ' + error.message);
                throw error;
            }
        }
    });
}


    // ========================================
    // MÉTHODE HELPER POUR LA TIMELINE
    // ========================================
    
    /**
     * Vérifie si un statut donné est complété par rapport au statut actuel
     * @param {string} currentStatus - Le statut actuel de la commande
     * @param {string} checkStatus - Le statut à vérifier
     * @returns {boolean} - True si le statut est complété, false sinon
     */
    isStatusCompleted(currentStatus, checkStatus) {
        // Définir l'ordre du workflow
        const workflow = [
            'nouvelle',
            'preparation', 
            'terminee',
            'expediee',
            'receptionnee',
            'livree'
        ];
        
        // Si la commande est annulée, aucun statut n'est complété
        if (currentStatus === 'annulee') {
            return false;
        }
        
        // Obtenir les indices dans le workflow
        const currentIndex = workflow.indexOf(currentStatus);
        const checkIndex = workflow.indexOf(checkStatus);
        
        // Si l'un des statuts n'est pas dans le workflow, retourner false
        if (currentIndex === -1 || checkIndex === -1) {
            return false;
        }
        
        // Le statut est complété s'il est avant le statut actuel dans le workflow
        return checkIndex < currentIndex;
    }
    
    // ========================================
    // MÉTHODES HELPER POUR LE MODAL
    // ========================================
    
    async loadPackTemplates(modalState) {
        try {
            const { collection, getDocs, query, where } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('../../src/services/firebase.service.js');
            
            const q = query(collection(db, 'packTemplates'), where('actif', '!=', false));
            const snapshot = await getDocs(q);
            
            modalState.packTemplates = [];
            snapshot.forEach((doc) => {
                modalState.packTemplates.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`✅ ${modalState.packTemplates.length} packs chargés`);
            
        } catch (error) {
            console.error('Erreur chargement packs:', error);
        }
    }

    async loadProduitsCache(modalState) {
        try {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('../../src/services/firebase.service.js');
            
            const snapshot = await getDocs(collection(db, 'produits'));
            modalState.produitsCache = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.actif !== false) {
                    modalState.produitsCache.push({
                        id: doc.id,
                        ...data,
                        name: data.designation,
                        label: data.designation
                    });
                }
            });
            
            console.log(`✅ ${modalState.produitsCache.length} produits en cache`);
            
        } catch (error) {
            console.error('Erreur chargement produits:', error);
        }
    }
    
async searchClients(query) {
    try {
        if (!query || query.length < 2) return [];
        
        const { collection, getDocs, query: firestoreQuery, where } = 
            await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { db } = await import('../../src/services/firebase.service.js');
        
        // Récupérer TOUS les clients actifs
        const q = firestoreQuery(
            collection(db, 'clients'),
            where('actif', '==', true)
        );
        
        const snapshot = await getDocs(q);
        const clients = [];
        
        // Normaliser la recherche (minuscules, sans accents)
        const searchQuery = query.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Créer une chaîne de recherche avec tous les champs pertinents
            const searchableFields = [
                data.nom || '',
                data.prenom || '',
                data.telephone || '',
                data.telephoneFixe || '',
                data.email || '',
                data.magasinReference || ''
            ];
            
            // Créer la chaîne de recherche normalisée
            const searchStr = searchableFields
                .join(' ')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
            
            // Si la recherche correspond, ajouter le client
            if (searchStr.includes(searchQuery)) {
                clients.push({
                    id: doc.id,
                    nom: data.nom || '',
                    prenom: data.prenom || '',
                    telephone: data.telephone || '',
                    telephoneFixe: data.telephoneFixe || '',
                    email: data.email || '',
                    magasinReference: data.magasinReference || '',
                    actif: data.actif
                });
            }
        });
        
        // Trier les résultats par nom puis prénom
        clients.sort((a, b) => {
            const nomCompare = (a.nom || '').localeCompare(b.nom || '');
            if (nomCompare !== 0) return nomCompare;
            return (a.prenom || '').localeCompare(b.prenom || '');
        });
        
        console.log(`🔍 Recherche "${query}": ${clients.length} clients trouvés`);
        
        // Limiter à 20 résultats pour la performance
        return clients.slice(0, 20);
        
    } catch (error) {
        console.error('❌ Erreur recherche clients:', error);
        toast.error('Erreur lors de la recherche de clients');
        return [];
    }
}
    
    async searchProduits(query) {
        try {
            if (!query || query.length < 2) return [];
            
            const { collection, getDocs } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('../../src/services/firebase.service.js');
            
            const snapshot = await getDocs(collection(db, 'produits'));
            const produits = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                const searchStr = `${data.designation || ''} ${data.reference || ''}`.toLowerCase();
                
                if (searchStr.includes(query.toLowerCase())) {
                    // STRUCTURE CORRECTE pour le widget
                    produits.push({
                        id: doc.id,
                        reference: data.reference || '',
                        designation: data.designation || '',
                        marque: data.marque || '',
                        prix: data.prix || 0,
                        type: data.type || '',
                        categorie: data.categorie || '',
                        necessiteCote: data.necessiteCote || false,
                        gestionNumeroSerie: data.gestionNumeroSerie || false,
                        actif: data.actif !== false,
                        // IMPORTANT : Ajouter ces champs pour le widget
                        name: data.designation || '',
                        label: data.designation || '',
                        value: doc.id
                    });
                }
            });
            
            console.log(`🔍 Recherche produits "${query}": ${produits.length} trouvés`);
            return produits;
            
        } catch (error) {
            console.error('❌ Erreur recherche produits:', error);
            return [];
        }
    }
    
    async applyPackToCart(packId, modalState) {
        try {
            const pack = modalState.packTemplates.find(p => p.id === packId);
            if (!pack) return;
            
            console.log('📦 Application du pack:', pack.nom);
            modalState.selectedProducts = [];
            
            const { collection, getDocs, query, where } = 
                await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('../../src/services/firebase.service.js');
            
            for (const item of (pack.produits || [])) {
                console.log('🔍 Recherche produit avec critères:', item);
                
                let produitTrouve = null;
                
                // Stratégie : chercher d'abord par le critère le plus spécifique
                if (item.reference) {
                    // Si on a une référence exacte
                    const q = query(collection(db, 'produits'), where('reference', '==', item.reference));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        produitTrouve = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                    }
                } else if (item.type && item.categorie) {
                    // Si on a type ET categorie, chercher par type puis filtrer
                    const q = query(collection(db, 'produits'), where('type', '==', item.type));
                    const snapshot = await getDocs(q);
                    
                    // Filtrer manuellement par categorie
                    for (const doc of snapshot.docs) {
                        const data = doc.data();
                        if (data.categorie === item.categorie) {
                            produitTrouve = { id: doc.id, ...data };
                            break; // Prendre le premier qui correspond
                        }
                    }
                } else if (item.type) {
                    // Si on a seulement le type
                    const q = query(collection(db, 'produits'), where('type', '==', item.type));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        produitTrouve = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                    }
                } else if (item.categorie) {
                    // Si on a seulement la catégorie
                    const q = query(collection(db, 'produits'), where('categorie', '==', item.categorie));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) {
                        produitTrouve = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
                    }
                }
                
                // Si on a trouvé un produit, l'ajouter
                if (produitTrouve) {
                    console.log('✅ Produit trouvé:', produitTrouve.designation);
                    
                    // IMPORTANT : Ajouter 'name' et 'label' pour le widget
                    produitTrouve.name = produitTrouve.designation;
                    produitTrouve.label = produitTrouve.designation;
                    
                    // Gérer les côtés
                    if (item.cote === 'both' || produitTrouve.necessiteCote) {
                        modalState.selectedProducts.push({
                            ...produitTrouve,
                            name: produitTrouve.designation,
                            label: produitTrouve.designation,
                            cote: 'droit',
                            quantite: 1
                        });
                        modalState.selectedProducts.push({
                            ...produitTrouve,
                            name: produitTrouve.designation,
                            label: produitTrouve.designation,
                            cote: 'gauche',
                            quantite: 1
                        });
                    } else {
                        modalState.selectedProducts.push({
                            ...produitTrouve,
                            name: produitTrouve.designation,
                            label: produitTrouve.designation,
                            quantite: item.quantite || 1,
                            cote: item.cote
                        });
                    }
                } else {
                    console.warn('⚠️ Aucun produit trouvé pour:', item);
                }
            }
            
            console.log('📦 Produits ajoutés au panier:', modalState.selectedProducts.length);
            
            // Mettre à jour le panier - MÉTHODE 1 : Via setFieldValue
            this.createModal.setFieldValue('produits', [...modalState.selectedProducts]);
            
            // MÉTHODE 2 : Forcer le rafraîchissement du widget
            setTimeout(() => {
                // Forcer le refresh de l'étape courante
                if (this.createModal.refreshCurrentStep) {
                    this.createModal.refreshCurrentStep();
                }
                
                // Si ça ne marche toujours pas, forcer manuellement l'affichage
                const cartContainer = document.querySelector('[data-field-key="produits"] .field-cart-universal');
                if (cartContainer && modalState.selectedProducts.length > 0) {
                    // Générer le HTML des items
                    const itemsHtml = modalState.selectedProducts.map((item, index) => `
                        <div class="cart-item" data-item-index="${index}">
                            <div class="cart-item-info">
                                <span class="item-name">${item.designation || item.name}</span>
                                <span class="item-reference" style="font-size: 12px; color: #666;">
                                    Réf: ${item.reference} ${item.cote ? `- ${item.cote}` : ''}
                                </span>
                            </div>
                            <div class="cart-item-actions">
                                <input type="number" 
                                    class="item-quantity" 
                                    value="${item.quantite || 1}" 
                                    min="1" 
                                    data-item-index="${index}">
                                <button class="btn-remove-item" 
                                        type="button" 
                                        data-item-index="${index}">×</button>
                            </div>
                        </div>
                    `).join('');
                    
                    // Remplacer le contenu
                    cartContainer.innerHTML = `
                        <div class="cart-items">${itemsHtml}</div>
                        <div class="cart-summary">
                            <span>${modalState.selectedProducts.length} article(s)</span>
                        </div>
                    `;
                    
                    // Réattacher les événements sur les boutons
                    cartContainer.querySelectorAll('.btn-remove-item').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const index = parseInt(e.target.dataset.itemIndex);
                            modalState.selectedProducts.splice(index, 1);
                            this.createModal.setFieldValue('produits', [...modalState.selectedProducts]);
                            
                            // Relancer le rafraîchissement
                            setTimeout(() => {
                                this.applyPackToCart(packId, modalState);
                            }, 10);
                        });
                    });
                    
                    // Réattacher les événements sur les quantités
                    cartContainer.querySelectorAll('.item-quantity').forEach(input => {
                        input.addEventListener('change', (e) => {
                            const index = parseInt(e.target.dataset.itemIndex);
                            const quantity = parseInt(e.target.value) || 1;
                            modalState.selectedProducts[index].quantite = quantity;
                            console.log('Quantité modifiée:', modalState.selectedProducts[index].designation, quantity);
                        });
                    });
                }
            }, 100);
            
            toast.success(`Pack appliqué : ${modalState.selectedProducts.length} produits ajoutés`);
            
        } catch (error) {
            console.error('❌ Erreur application pack:', error);
            toast.error('Erreur lors de l\'application du pack');
        }
    }
    
async addProductToCart(produit, modalState) {
    try {
        // S'assurer que le produit a les bons champs
        const produitComplet = {
            ...produit,
            name: produit.designation || produit.name,
            label: produit.designation || produit.label
        };
        
        if (produit.necessiteCote || produit.type === 'appareil_auditif') {
            const cote = await this.selectProductSide(produit);
            
            if (cote === 'both') {
                modalState.selectedProducts.push({
                    ...produitComplet,
                    cote: 'droit',
                    quantite: 1
                });
                modalState.selectedProducts.push({
                    ...produitComplet,
                    cote: 'gauche',
                    quantite: 1
                });
            } else if (cote) {
                modalState.selectedProducts.push({
                    ...produitComplet,
                    cote: cote,
                    quantite: 1
                });
            }
        } else {
            modalState.selectedProducts.push({
                ...produitComplet,
                quantite: 1
            });
        }
        
        // SOLUTION : Forcer le rafraîchissement du cart
        this.createModal.setFieldValue('produits', [...modalState.selectedProducts]);
        
        // AJOUTER : Forcer le rafraîchissement visuel
        const cartField = document.querySelector('[data-field-key="produits"]');
        if (cartField) {
            const adapter = this.createModal.adapters.get('produits');
            if (adapter) {
                adapter.setValue(cartField, modalState.selectedProducts);
            } else {
                // Si pas d'adapter, forcer manuellement
                this.createModal.refreshCurrentStep();
            }
        }
        
        toast.success('Produit ajouté');
        
    } catch (error) {
        console.error('Erreur ajout produit:', error);
    }
}
    
    async selectProductSide(produit) {
        return new Promise((resolve) => {
            const html = `
                <div id="side-modal" class="modal-overlay active" style="z-index: 100000;">
                    <div class="modal-container" style="max-width: 400px;">
                        <div class="modal-header">
                            <h3>Sélectionner le côté</h3>
                        </div>
                        <div class="modal-body text-center">
                            <p>${produit.designation}</p>
                            <div class="d-flex justify-content-center gap-2 mt-3">
                                <button class="btn btn-primary" onclick="window.resolveSide('gauche')">Gauche</button>
                                <button class="btn btn-danger" onclick="window.resolveSide('droit')">Droit</button>
                                <button class="btn btn-success" onclick="window.resolveSide('both')">Les deux</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', html);
            
            window.resolveSide = (side) => {
                document.getElementById('side-modal').remove();
                resolve(side);
            };
        });
    }
    
    calculateDeliveryDate(urgence = 'normal') {
        const jours = CONFIG.URGENCES[urgence]?.jours || 5;
        const date = new Date();
        date.setDate(date.getDate() + jours);
        return date.toISOString().split('T')[0];
    }
    
    // ========================================
    // AFFICHAGE DÉTAIL
    // ========================================
    
openDetailModal(row) {
    const self = this;
    let detailViewer = null;
    
    // Fonction pour générer les actions selon le statut
    const generateActions = (commandeRow) => {
        const actions = [];
        
        // Bouton Imprimer (toujours disponible)
        actions.push({
            label: '🖨️ Imprimer',
            class: 'btn btn-secondary',
            onClick: () => self.imprimerCommande(commandeRow)
        });
        
        // Actions selon le statut
        switch (commandeRow.statut) {
            case 'nouvelle':
                actions.push({
                    label: '🔵 Commencer la préparation',
                    class: 'btn btn-primary',
                    onClick: async () => {
                        await self.changerStatut(commandeRow.id, 'preparation');
                        await updateViewer();
                    }
                });
                break;
                
            case 'preparation':
                actions.push({
                    label: '📝 Saisir les numéros de série',
                    class: 'btn btn-primary',
                    onClick: () => {
                        self.saisirNumerosSerie(commandeRow);
                    }
                });
                actions.push({
                    label: '✅ Terminer la préparation',
                    class: 'btn btn-success',
                    onClick: async () => {
                        const nsOk = await self.verifierNumerosSerie(commandeRow);
                        if (nsOk) {
                            await self.changerStatut(commandeRow.id, 'terminee');
                            await updateViewer();
                        }
                    }
                });
                break;
                
            case 'terminee':
                actions.push({
                    label: '📦 Expédier le colis',
                    class: 'btn btn-primary',
                    onClick: async () => {
                        await self.saisirExpedition(commandeRow);
                        await updateViewer();
                    }
                });
                actions.push({
                    label: '✅ Livrer directement',
                    class: 'btn btn-success',
                    onClick: async () => {
                        await self.changerStatut(commandeRow.id, 'livree');
                        await updateViewer();
                    }
                });
                break;
                
            case 'expediee':
                actions.push({
                    label: '📥 Valider la réception',
                    class: 'btn btn-primary',
                    onClick: async () => {
                        await self.validerReception(commandeRow);
                        await updateViewer();
                    }
                });
                break;
                
            case 'receptionnee':
                if (!commandeRow.patientPrevenu) {
                    actions.push({
                        label: '📞 Patient prévenu',
                        class: 'btn btn-secondary',
                        onClick: async () => {
                            await self.marquerPatientPrevenu(commandeRow);
                            await updateViewer();
                        }
                    });
                }
                actions.push({
                    label: '✅ Livrer au patient',
                    class: 'btn btn-success',
                    onClick: async () => {
                        await self.changerStatut(commandeRow.id, 'livree');
                        await updateViewer();
                    }
                });
                break;
        }
        
        // Bouton Annuler (sauf si livree ou annulee)
        if (commandeRow.statut !== 'livree' && commandeRow.statut !== 'annulee') {
            actions.push({
                label: '❌ Annuler la commande',
                class: 'btn btn-danger',
                onClick: async () => {
                    await self.annulerCommande(commandeRow);
                    await updateViewer();
                }
            });
        }
        
        return actions;
    };
    
    // Fonction pour mettre à jour le viewer sans fermer
    const updateViewer = async () => {
        await self.loadData();
        const updatedRow = self.commandesData.find(c => c.id === row.id);
        if (updatedRow && detailViewer) {
            // Générer les nouvelles actions pour le nouveau statut
            const newActions = generateActions(updatedRow);
            
            // Mettre à jour la config des actions
            detailViewer.config.actions = newActions;
            
            // Mettre à jour la timeline
            detailViewer.config.timeline.items = Object.entries(CONFIG.STATUTS)
                .filter(([key]) => key !== 'annulee')
                .map(([key, statut]) => {
                    let status = 'pending';
                    if (updatedRow.statut === key) {
                        status = 'active';
                    } else if (self.isStatusCompleted(updatedRow.statut, key)) {
                        status = 'completed';
                    }
                    
                    return {
                        label: statut.label,
                        status: status,
                        icon: statut.icon
                    };
                });
            
            // Reconstruire les sections avec les nouvelles données
            detailViewer.config.sections = self.buildDetailSections(updatedRow);
            
            // Utiliser updateContent pour rafraîchir sans fermer
            detailViewer.updateContent(updatedRow);
            
            toast.success('Statut mis à jour');
        }
    };
    
    // IMPORTANT : RENDRE updateViewer ACCESSIBLE GLOBALEMENT
    window.updateViewer = updateViewer;
    
    // Construire les sections
    const sections = this.buildDetailSections(row);
    
    // Créer le DetailViewer avec les actions initiales
    detailViewer = new DetailViewerWidget({
        title: `Commande ${row.numeroCommande}`,
        subtitle: row.client ? `${row.client.prenom} ${row.client.nom}` : '',
        data: row,
        
        timeline: {
            enabled: true,
            orientation: 'horizontal',
            animated: true,
            theme: 'colorful',
            items: Object.entries(CONFIG.STATUTS)
                .filter(([key]) => key !== 'annulee')
                .map(([key, statut]) => {
                    let status = 'pending';
                    if (row.statut === key) {
                        status = 'active';
                    } else if (this.isStatusCompleted(row.statut, key)) {
                        status = 'completed';
                    }
                    
                    return {
                        label: statut.label,
                        status: status,
                        icon: statut.icon
                    };
                })
        },
        
        sections: sections,
        
        // Actions générées dynamiquement
        actions: generateActions(row),
        
        // IMPORTANT : NETTOYER window.updateViewer QUAND ON FERME
        onClose: () => {
            delete window.updateViewer;
        }
    });
}

// MÉTHODE buildDetailSections COMPLÈTE
buildDetailSections(row) {
    const sections = [];
    
    // ========================================
    // 1. SECTION CLIENT
    // ========================================
    sections.push({
        id: 'client',
        title: '👤 Client',
        fields: [
            { label: 'Nom', key: 'client.nom' },
            { label: 'Prénom', key: 'client.prenom' },
            { label: 'Téléphone', key: 'client.telephone' },
            { label: 'Email', key: 'client.email' }
        ]
    });
    
// ========================================
    // 2. SECTION LIVRAISON
    // ========================================
    sections.push({
        id: 'livraison',
        title: '🚚 Informations de livraison',
        layout: 'grid',
        fields: [
            { 
                label: 'Type de préparation', 
                key: 'typePreparation',
                formatter: (v) => `${CONFIG.TYPES_PREPARATION[v]?.icon || ''} ${CONFIG.TYPES_PREPARATION[v]?.label || v}`
            },
            { 
                label: 'Niveau d\'urgence', 
                key: 'niveauUrgence',
                formatter: (v) => `${CONFIG.URGENCES[v]?.icon || ''} ${CONFIG.URGENCES[v]?.label || v}`
            },
            { 
                label: 'Magasin', 
                key: 'magasinLivraison',
                formatter: (v) => `🏪 ${v || '-'}`
            },
            { 
                label: 'Date prévue', 
                key: 'dates.livraisonPrevue',
                formatter: 'date'
            },
            { 
                label: 'Commentaires', 
                key: 'commentaires',
                fullWidth: true,
                defaultValue: 'Aucun commentaire'
            }
        ]
    });
    
    // ========================================
    // 3. SECTION PRODUITS
    // ========================================
    sections.push({
        id: 'produits',
        title: `📦 Produits commandés (${row.produits?.length || 0})`,
        type: 'list',
        items: row.produits?.map(p => {
            const needsSerial = p.type === 'appareil_auditif' || p.necessiteCote || p.gestionNumeroSerie;
            const hasSerial = !!p.numeroSerie;
            
            return {
                title: p.designation,
                badges: p.cote ? [{ text: p.cote.toUpperCase(), color: 'warning' }] : [],
                subtitle: `Réf: ${p.reference} | Qté: ${p.quantite} | Prix: ${p.prix || 0}€`,
                highlight: needsSerial ? (hasSerial ? 'success' : 'warning') : null,
                statusBox: needsSerial ? {
                    type: hasSerial ? 'success' : 'warning',
                    icon: hasSerial ? '✅' : '⚠️',
                    label: 'N° série:',
                    value: hasSerial ? p.numeroSerie : 'Non saisi'
                } : null,
                sideContent: p.type === 'appareil_auditif' ? '<span style="font-size: 28px;">👂</span>' : ''
            };
        }) || []
    });
    
    // ========================================
    // 4. SECTION EXPÉDITION (si expédié)
    // ========================================
    if (row.statut === 'expediee' || row.statut === 'receptionnee' || row.statut === 'livree') {
        const expeditionFields = [];
        
        if (row.expedition?.envoi?.transporteur) {
            expeditionFields.push({ 
                label: 'Transporteur', 
                value: row.expedition.envoi.transporteur
            });
        }
        if (row.expedition?.envoi?.numeroSuivi) {
            expeditionFields.push({ 
                label: 'Numéro de suivi', 
                value: row.expedition.envoi.numeroSuivi,
                bold: true
            });
        }
        if (row.expedition?.envoi?.dateEnvoi) {
            expeditionFields.push({ 
                label: 'Date d\'expédition', 
                value: this.formatDate(row.expedition.envoi.dateEnvoi)
            });
        }
        if (row.expedition?.envoi?.scanPar) {
            expeditionFields.push({ 
                label: 'Expédié par', 
                value: `${row.expedition.envoi.scanPar.prenom || ''} ${row.expedition.envoi.scanPar.nom || ''}`
            });
        }
        
        if (expeditionFields.length > 0) {
            sections.push({
                id: 'expedition',
                title: '📦 Expédition',
                layout: 'grid',
                fields: expeditionFields
            });
        }
    }
    
    // ========================================
    // 5. SECTION RÉCEPTION (si réceptionné)
    // ========================================
    if (row.statut === 'receptionnee' || row.statut === 'livree') {
        const receptionFields = [];
        
        if (row.expedition?.reception?.numeroSuiviRecu) {
            receptionFields.push({ 
                label: 'N° suivi reçu', 
                value: row.expedition.reception.numeroSuiviRecu,
                bold: true
            });
        }
        if (row.expedition?.reception?.dateReception) {
            receptionFields.push({ 
                label: 'Date de réception', 
                value: this.formatDate(row.expedition.reception.dateReception)
            });
        }
        if (row.expedition?.reception?.colisConforme !== null && row.expedition?.reception?.colisConforme !== undefined) {
            receptionFields.push({ 
                label: 'État du colis', 
                value: row.expedition.reception.colisConforme ? '✅ Conforme' : '⚠️ Non conforme',
                bold: !row.expedition.reception.colisConforme
            });
        }
        if (row.expedition?.reception?.recuPar) {
            receptionFields.push({ 
                label: 'Réceptionné par', 
                value: `${row.expedition.reception.recuPar.prenom || ''} ${row.expedition.reception.recuPar.nom || ''}`
            });
        }
        if (row.patientPrevenu) {
            receptionFields.push({ 
                label: 'Patient prévenu', 
                value: `📞 Oui ${row.dates?.patientPrevenu ? 'le ' + this.formatDate(row.dates.patientPrevenu) : ''}`,
                bold: true
            });
        }
        
        if (receptionFields.length > 0) {
            sections.push({
                id: 'reception',
                title: '📥 Réception',
                layout: 'grid',
                fields: receptionFields
            });
        }
    }
    
    // ========================================
    // 5. SECTION HISTORIQUE
    // ========================================
    sections.push({
        id: 'historique',
        title: '📜 Historique',
        type: 'custom',
        collapsible: true,
        collapsed: false,
        customContent: row.historique && row.historique.length > 0 ? `
            <div style="max-height: 300px; overflow-y: auto;">
                ${row.historique.sort((a, b) => {
                    const dateA = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date);
                    const dateB = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date);
                    return dateB - dateA;
                }).map(entry => `
                    <div style="
                        padding: 12px;
                        margin-bottom: 8px;
                        background: #f8f9fa;
                        border-left: 3px solid ${
                            entry.action.includes('Création') ? '#4caf50' :
                            entry.action.includes('Annulation') ? '#f44336' :
                            entry.action.includes('Expédition') ? '#2196f3' :
                            entry.action.includes('Livraison') ? '#ff9800' :
                            '#9e9e9e'
                        };
                        border-radius: 4px;
                    ">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <strong style="color: #2c3e50; font-size: 14px;">
                                ${entry.action}
                            </strong>
                            <span style="color: #666; font-size: 12px;">
                                ${this.formatDateTime(entry.date)}
                            </span>
                        </div>
                        ${entry.details ? `
                            <div style="color: #666; font-size: 13px; margin-top: 4px;">
                                ${entry.details}
                            </div>
                        ` : ''}
                        ${entry.utilisateur ? `
                            <div style="color: #999; font-size: 11px; margin-top: 4px;">
                                Par: ${entry.utilisateur}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        ` : '<p style="color: #999; text-align: center;">Aucun historique</p>'
    });
    
    return sections;
}

    // ========================================
    // MÉTHODES D'ACTIONS POUR LE DÉTAIL
    // ========================================

async changerStatut(commandeId, nouveauStatut, details = {}) {
    try {
        const commande = this.commandesData.find(c => c.id === commandeId);
        if (!commande) return;
        
        const confirme = confirm(`Passer au statut "${CONFIG.STATUTS[nouveauStatut]?.label}" ?`);
        if (!confirme) return;
        
        const ancienStatut = commande.statut;
        const userInfo = this.getUserInfo();
        
        // Créer l'entrée historique
        const historiqueEntry = {
            date: new Date(),
            action: `Changement de statut: ${CONFIG.STATUTS[ancienStatut]?.label} → ${CONFIG.STATUTS[nouveauStatut]?.label}`,
            details: details.motif || details.numeroSuivi || '',
            utilisateur: `${userInfo.prenom} ${userInfo.nom}`,
            statut: nouveauStatut
        };
        
        // Mettre à jour avec l'historique
        await firestoreService.updateCommande(commandeId, {
            statut: nouveauStatut,
            'dates.derniereModification': new Date(),
            historique: [...(commande.historique || []), historiqueEntry],
            ...details
        });
        
        toast.success('Statut mis à jour');
        
    } catch (error) {
        console.error('Erreur changement statut:', error);
        toast.error('Erreur lors du changement de statut');
    }
}

async saisirNumerosSerie(commande) {
    try {
        console.log('📝 Ouverture saisie NS pour commande:', commande.id);
        
        // Filtrer les produits nécessitant un NS AVEC leur index original
        const produitsAvecNS = [];
        commande.produits.forEach((produit, originalIndex) => {
            if (produit.type === 'appareil_auditif' || 
                produit.necessiteCote || 
                produit.gestionNumeroSerie) {
                produitsAvecNS.push({
                    produit: produit,
                    originalIndex: originalIndex
                });
            }
        });
        
        if (produitsAvecNS.length === 0) {
            toast.info('Aucun produit ne nécessite de numéro de série');
            return;
        }
        
        // Créer le dialog
        const result = await new Promise((resolve) => {
            const html = `
                <div id="ns-modal" class="modal-overlay active" style="z-index: 100001;">
                    <div class="modal-container" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                        <div class="modal-header">
                            <h3>📝 Saisie des numéros de série</h3>
                            <span style="font-size: 14px; color: #666;">Commande ${commande.numeroCommande}</span>
                        </div>
                        <div class="modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px;">
                                <p style="margin: 0; color: #1976d2; font-size: 14px;">
                                    ℹ️ Saisissez les numéros de série pour chaque produit concerné
                                </p>
                            </div>
                            
                            <div id="ns-products-list">
                                ${produitsAvecNS.map((item, index) => {
                                    const produit = item.produit;
                                    return `
                                        <div class="ns-product-item" style="margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; border: 2px solid #e0e0e0;">
                                            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                                                <div>
                                                    <strong style="color: #2c3e50; font-size: 15px;">
                                                        ${produit.designation}
                                                    </strong>
                                                    ${produit.cote ? `
                                                        <span style="background: #ff9800; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 8px;">
                                                            ${produit.cote.toUpperCase()}
                                                        </span>
                                                    ` : ''}
                                                </div>
                                                <div id="ns-status-${index}" style="font-size: 20px;">
                                                    ${produit.numeroSerie ? '✅' : '⚠️'}
                                                </div>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 10px;">
                                                <label style="font-size: 13px; color: #666; min-width: 80px;">N° Série :</label>
                                                <input type="text" 
                                                       id="ns-input-${index}"
                                                       data-original-index="${item.originalIndex}"
                                                       placeholder="Entrez le numéro de série..."
                                                       value="${produit.numeroSerie || ''}"
                                                       style="flex: 1; padding: 8px 12px; border: 2px solid #ddd; border-radius: 6px; font-family: monospace; font-size: 14px;"
                                                       onkeyup="this.value = this.value.toUpperCase(); document.getElementById('ns-status-${index}').textContent = this.value ? '✅' : '⚠️';">
                                            </div>
                                            <div style="margin-top: 5px; font-size: 12px; color: #999;">
                                                Réf: ${produit.reference} | Qté: ${produit.quantite}
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            
                            <div style="margin-top: 20px; padding: 10px; background: #fff3e0; border-radius: 8px; border: 1px solid #ffcc80;">
                                <p style="margin: 0; color: #e65100; font-size: 13px;">
                                    ⚠️ Vérifiez bien les numéros avant de valider
                                </p>
                            </div>
                        </div>
                        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 15px; border-top: 1px solid #e0e0e0;">
                            <button class="btn btn-secondary" id="ns-cancel">Annuler</button>
                            <button class="btn btn-primary" id="ns-validate">
                                ✅ Valider les numéros
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', html);
            
            // Focus sur le premier champ
            setTimeout(() => {
                const firstInput = document.getElementById('ns-input-0');
                if (firstInput) firstInput.focus();
            }, 100);
            
            // Gestionnaires d'événements
            const handleValidate = () => {
                const numerosSeries = {};
                let allFilled = true;
                
                produitsAvecNS.forEach((item, index) => {
                    const input = document.getElementById(`ns-input-${index}`);
                    const value = input ? input.value.trim() : '';
                    const originalIndex = parseInt(input.dataset.originalIndex);
                    
                    if (!value) {
                        allFilled = false;
                        input.style.borderColor = '#f44336';
                    } else {
                        // UTILISER L'INDEX ORIGINAL !
                        numerosSeries[originalIndex] = value;
                    }
                });
                
                if (!allFilled) {
                    toast.warning('Veuillez remplir tous les numéros de série');
                    return;
                }
                
                document.getElementById('ns-modal').remove();
                resolve(numerosSeries);
            };
            
            const handleCancel = () => {
                document.getElementById('ns-modal').remove();
                resolve(null);
            };
            
            document.getElementById('ns-validate').addEventListener('click', handleValidate);
            document.getElementById('ns-cancel').addEventListener('click', handleCancel);
            
            // Gestion clavier
            document.getElementById('ns-modal').addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                } else if (e.key === 'Enter' && e.ctrlKey) {
                    handleValidate();
                }
            });
        });
        
        // Si annulation
        if (!result) {
            console.log('Saisie NS annulée');
            return;
        }
        
        // Mettre à jour les produits avec les NS
        const updatedProduits = [...commande.produits];
        
        // Utiliser les indices ORIGINAUX pour mettre à jour
        Object.entries(result).forEach(([originalIndex, numeroSerie]) => {
            updatedProduits[parseInt(originalIndex)].numeroSerie = numeroSerie;
        });
        
        console.log('✅ Produits mis à jour avec NS:', updatedProduits);
        
        // Sauvegarder en base - SEULEMENT LES PRODUITS, PAS D'EXPEDITION !
        await firestoreService.updateCommande(commande.id, {
            produits: updatedProduits,
            'dates.derniereModification': new Date()
        });
        
        // Rafraîchir les données
        await this.loadData();
        
        // Mettre à jour le DetailViewer si ouvert
        if (window.updateViewer) {
            await window.updateViewer();
        }
        
        toast.success('Numéros de série enregistrés');
        
    } catch (error) {
        console.error('Erreur saisie NS:', error);
        toast.error('Erreur lors de la saisie des numéros');
    }
}

async verifierNumerosSerie(commande) {
    // Vérifier que tous les produits requis ont un NS
    const produitsRequis = commande.produits.filter(p => 
        p.type === 'appareil_auditif' || 
        p.necessiteCote || 
        p.gestionNumeroSerie
    );
    
    const produitsManquants = produitsRequis.filter(p => !p.numeroSerie);
    
    if (produitsManquants.length > 0) {
        const details = produitsManquants.map(p => 
            `• ${p.designation}${p.cote ? ` (${p.cote})` : ''}`
        ).join('\n');
        
        const continuer = confirm(
            `⚠️ Numéros de série manquants :\n\n${details}\n\n` +
            `Voulez-vous saisir les numéros maintenant ?`
        );
        
        if (continuer) {
            await this.saisirNumerosSerie(commande);
            // Revérifier après saisie
            const commandeMAJ = this.commandesData.find(c => c.id === commande.id);
            return this.verifierNumerosSerie(commandeMAJ);
        }
        
        return false;
    }
    
    return true;
}

    async saisirExpedition(commande) {
        try {
            console.log('📦 Ouverture dialog expédition pour commande:', commande.id);
            
            // Créer le dialog
            const result = await new Promise((resolve) => {
                const html = `
                    <div id="expedition-modal" class="modal-overlay active" style="z-index: 100001;">
                        <div class="modal-container" style="max-width: 600px;">
                            <div class="modal-header">
                                <h3>📦 Expédition du colis</h3>
                                <span style="font-size: 14px; color: #666;">Commande ${commande.numeroCommande}</span>
                            </div>
                            <div class="modal-body" style="padding: 20px;">
                                <div style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px;">
                                    <p style="margin: 0; color: #1976d2; font-size: 14px;">
                                        ℹ️ Enregistrez les informations d'expédition
                                    </p>
                                </div>
                                
                                <div style="display: grid; gap: 15px;">
                                    <div>
                                        <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">
                                            Transporteur <span style="color: #f44336;">*</span>
                                        </label>
                                        <select id="exp-transporteur" style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 6px;">
                                            <option value="">-- Sélectionner --</option>
                                            <option value="Colissimo">📦 Colissimo</option>
                                            <option value="Chronopost">⚡ Chronopost</option>
                                            <option value="UPS">🚚 UPS</option>
                                            <option value="DHL">✈️ DHL Express</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">
                                            Numéro de suivi <span style="color: #f44336;">*</span>
                                        </label>
                                        <input type="text" 
                                            id="exp-numero"
                                            placeholder="Ex: LB123456789FR"
                                            style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 6px; font-family: monospace;"
                                            onkeyup="this.value = this.value.toUpperCase();">
                                    </div>
                                    
                                    <div>
                                        <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">
                                            Date d'expédition
                                        </label>
                                        <input type="date" 
                                            id="exp-date"
                                            value="${new Date().toISOString().split('T')[0]}"
                                            style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 6px;">
                                    </div>
                                </div>
                                
                                <div style="margin-top: 20px; padding: 10px; background: #fff3e0; border-radius: 8px; border: 1px solid #ffcc80;">
                                    <p style="margin: 0; color: #e65100; font-size: 13px;">
                                        ⚠️ Vérifiez le numéro de suivi avant de valider
                                    </p>
                                </div>
                            </div>
                            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 15px; border-top: 1px solid #e0e0e0;">
                                <button class="btn btn-secondary" id="exp-cancel">Annuler</button>
                                <button class="btn btn-primary" id="exp-validate">
                                    📦 Confirmer l'expédition
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.insertAdjacentHTML('beforeend', html);
                
                // Focus sur le premier champ
                setTimeout(() => {
                    const firstSelect = document.getElementById('exp-transporteur');
                    if (firstSelect) firstSelect.focus();
                }, 100);
                
                // Gestionnaires d'événements
                const handleValidate = () => {
                    const transporteur = document.getElementById('exp-transporteur').value;
                    const numeroSuivi = document.getElementById('exp-numero').value.trim();
                    const dateExpedition = document.getElementById('exp-date').value;
                    
                    if (!transporteur) {
                        toast.warning('Veuillez sélectionner un transporteur');
                        document.getElementById('exp-transporteur').style.borderColor = '#f44336';
                        return;
                    }
                    
                    if (!numeroSuivi) {
                        toast.warning('Veuillez saisir le numéro de suivi');
                        document.getElementById('exp-numero').style.borderColor = '#f44336';
                        return;
                    }
                    
                    document.getElementById('expedition-modal').remove();
                    resolve({ transporteur, numeroSuivi, dateExpedition });
                };
                
                const handleCancel = () => {
                    document.getElementById('expedition-modal').remove();
                    resolve(null);
                };
                
                document.getElementById('exp-validate').addEventListener('click', handleValidate);
                document.getElementById('exp-cancel').addEventListener('click', handleCancel);
                
                // Gestion clavier
                document.getElementById('expedition-modal').addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        handleCancel();
                    } else if (e.key === 'Enter' && e.ctrlKey) {
                        handleValidate();
                    }
                });
            });
            
            // Si annulation
            if (!result) {
                console.log('Expédition annulée');
                return;
            }
            
            // Sauvegarder en base
            await firestoreService.changerStatut(commande.id, 'expediee', {
                numeroSuivi: result.numeroSuivi,
                transporteur: result.transporteur,
                'dates.expedition': new Date(result.dateExpedition)
            });
            
            // Rafraîchir les données
            await this.loadData();
            
            // Mettre à jour le DetailViewer si ouvert
            if (window.updateViewer) {
                await window.updateViewer();
            }
            
            toast.success(`Expédié via ${result.transporteur}`);
            
        } catch (error) {
            console.error('Erreur expédition:', error);
            toast.error('Erreur lors de l\'expédition');
        }
    }

async validerReception(commande) {
    try {
        console.log('📥 Ouverture dialog réception pour commande:', commande.id);
        
        // Récupérer le numéro de suivi envoyé
        const numeroSuiviEnvoye = commande.expedition?.envoi?.numeroSuivi || '';
        
        // Créer le dialog
        const result = await new Promise((resolve) => {
            const html = `
                <div id="reception-modal" class="modal-overlay active" style="z-index: 100001;">
                    <div class="modal-container" style="max-width: 600px;">
                        <div class="modal-header">
                            <h3>📥 Valider la réception</h3>
                            <span style="font-size: 14px; color: #666;">Commande ${commande.numeroCommande}</span>
                        </div>
                        <div class="modal-body" style="padding: 20px;">
                            <div style="margin-bottom: 15px; padding: 10px; background: #e8f5e9; border-radius: 8px;">
                                <p style="margin: 0; color: #2e7d32; font-size: 14px;">
                                    ℹ️ Confirmez la réception du colis
                                </p>
                            </div>
                            
                            ${numeroSuiviEnvoye ? `
                                <div style="background: #f5f5f5; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
                                    <strong>N° suivi envoyé:</strong> 
                                    <span style="font-family: monospace; font-size: 16px; color: #1976d2;">
                                        ${numeroSuiviEnvoye}
                                    </span>
                                </div>
                            ` : ''}
                            
                            <div style="display: grid; gap: 15px;">
                                <div>
                                    <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">
                                        Numéro de suivi reçu <span style="color: #f44336;">*</span>
                                    </label>
                                    <input type="text" 
                                           id="rec-numero"
                                           placeholder="Saisissez le numéro du colis reçu"
                                           style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 6px; font-family: monospace;"
                                           onkeyup="this.value = this.value.toUpperCase();">
                                    <div id="rec-numero-error" style="color: #f44336; font-size: 12px; margin-top: 5px; display: none;">
                                        ❌ Le numéro ne correspond pas au colis envoyé !
                                    </div>
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">
                                        Date de réception
                                    </label>
                                    <input type="date" 
                                           id="rec-date"
                                           value="${new Date().toISOString().split('T')[0]}"
                                           style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 6px;">
                                </div>
                                
                                <div>
                                    <label style="display: block; margin-bottom: 5px; color: #333; font-weight: 500;">
                                        État du colis
                                    </label>
                                    <select id="rec-etat" style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 6px;">
                                        <option value="bon">✅ Bon état</option>
                                        <option value="endommage">⚠️ Endommagé</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div style="margin-top: 20px; padding: 10px; background: #fff3e0; border-radius: 8px; border: 1px solid #ffcc80;">
                                <p style="margin: 0; color: #e65100; font-size: 13px;">
                                    ⚠️ Le numéro de suivi doit correspondre exactement au colis envoyé
                                </p>
                            </div>
                        </div>
                        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding: 15px; border-top: 1px solid #e0e0e0;">
                            <button class="btn btn-secondary" id="rec-cancel">Annuler</button>
                            <button class="btn btn-success" id="rec-validate">
                                ✅ Confirmer la réception
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', html);
            
            // Focus sur le premier champ
            setTimeout(() => {
                const firstInput = document.getElementById('rec-numero');
                if (firstInput) firstInput.focus();
            }, 100);
            
            // Gestionnaires d'événements
            const handleValidate = () => {
                const numeroRecu = document.getElementById('rec-numero').value.trim();
                const dateReception = document.getElementById('rec-date').value;
                const etatColis = document.getElementById('rec-etat').value;
                const errorDiv = document.getElementById('rec-numero-error');
                
                if (!numeroRecu) {
                    toast.warning('Veuillez saisir le numéro de suivi');
                    document.getElementById('rec-numero').style.borderColor = '#f44336';
                    return;
                }
                
                // VÉRIFICATION STRICTE : le numéro doit être IDENTIQUE
                if (numeroSuiviEnvoye && numeroRecu !== numeroSuiviEnvoye) {
                    toast.error(`Le numéro saisi (${numeroRecu}) ne correspond pas au numéro envoyé (${numeroSuiviEnvoye})`);
                    document.getElementById('rec-numero').style.borderColor = '#f44336';
                    errorDiv.style.display = 'block';
                    return;
                }
                
                document.getElementById('reception-modal').remove();
                resolve({ numeroSuiviRecu: numeroRecu, dateReception, etatColis });
            };
            
            const handleCancel = () => {
                document.getElementById('reception-modal').remove();
                resolve(null);
            };
            
            document.getElementById('rec-validate').addEventListener('click', handleValidate);
            document.getElementById('rec-cancel').addEventListener('click', handleCancel);
            
            // Validation en temps réel
            document.getElementById('rec-numero').addEventListener('input', (e) => {
                const value = e.target.value.toUpperCase();
                const errorDiv = document.getElementById('rec-numero-error');
                
                if (numeroSuiviEnvoye && value && value !== numeroSuiviEnvoye) {
                    e.target.style.borderColor = '#f44336';
                    errorDiv.style.display = 'block';
                } else if (numeroSuiviEnvoye && value === numeroSuiviEnvoye) {
                    e.target.style.borderColor = '#4caf50';
                    errorDiv.style.display = 'none';
                } else {
                    e.target.style.borderColor = '#ddd';
                    errorDiv.style.display = 'none';
                }
            });
            
            // Gestion clavier
            document.getElementById('reception-modal').addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                } else if (e.key === 'Enter' && e.ctrlKey) {
                    handleValidate();
                }
            });
        });
        
        // Si annulation
        if (!result) {
            console.log('Réception annulée');
            return;
        }
        
        // Sauvegarder en base avec la BONNE STRUCTURE
        await firestoreService.updateCommande(commande.id, {
            statut: 'receptionnee',
            'expedition.reception.numeroSuiviRecu': result.numeroSuiviRecu,
            'expedition.reception.dateReception': new Date(result.dateReception),
            'expedition.reception.colisConforme': result.etatColis === 'bon',
            'expedition.reception.recuPar': this.getUserInfo(),
            'dates.reception': new Date(result.dateReception)
        });
        
        // Rafraîchir les données
        await this.loadData();
        
        // Mettre à jour le DetailViewer si ouvert
        if (window.updateViewer) {
            await window.updateViewer();
        }
        
        toast.success('Réception confirmée');
        
    } catch (error) {
        console.error('Erreur réception:', error);
        toast.error('Erreur lors de la réception');
    }
}

    imprimerCommande(commande) {
        // Import dynamique du widget
        import('/Orixis-pwa/widgets/print/print.widget.js').then(module => {
            const PrintWidget = module.default;
            
            // Préparer les données avec les labels
            const printData = {
                ...commande,
                urgenceLabel: `${CONFIG.URGENCES[commande.niveauUrgence]?.icon || ''} ${CONFIG.URGENCES[commande.niveauUrgence]?.label || commande.niveauUrgence}`,
                typeLabel: `${CONFIG.TYPES_PREPARATION[commande.typePreparation]?.icon || ''} ${CONFIG.TYPES_PREPARATION[commande.typePreparation]?.label || commande.typePreparation}`
            };
            
            // Créer et afficher le widget
            const printer = new PrintWidget({
                title: `Commande ${commande.numeroCommande}`,
                template: 'commande',
                data: printData,
                companyName: 'Orixis Audio',
                
                onBeforePrint: () => {
                    console.log('🖨️ Impression de la commande:', commande.numeroCommande);
                },
                
                onAfterPrint: () => {
                    toast.success('Document envoyé à l\'imprimante');
                }
            });
            
            printer.preview();
            
        }).catch(error => {
            console.error('Erreur chargement PrintWidget:', error);
            toast.error('Erreur lors de l\'impression');
        });
    }
    
    // ========================================
    // UTILITAIRES
    // ========================================
    
    parseDate(dateValue) {
        if (!dateValue) return null;
        if (dateValue.toDate) return dateValue.toDate();
        if (dateValue.seconds) return new Date(dateValue.seconds * 1000);
        return new Date(dateValue);
    }
    
    formatDate(dateValue) {
        const date = this.parseDate(dateValue);
        if (!date) return '-';
        return date.toLocaleDateString('fr-FR');
    }

    formatDateTime(dateValue) {
        const date = this.parseDate(dateValue);
        if (!date) return '-';
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    getUserInfo() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        return {
            id: auth.collaborateur?.id || 'unknown',
            nom: auth.collaborateur?.nom || 'Inconnu',
            prenom: auth.collaborateur?.prenom || '',
            role: auth.collaborateur?.role || 'technicien',
            magasin: auth.magasin || auth.collaborateur?.magasin || 'XXX'
        };
    }
    
    showLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.remove('hidden');
    }
    
    hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('hidden');
    }
    
    showError(message) {
        toast.error(message);
        console.error('❌', message);
    }
    
    showSuccess(message) {
        toast.success(message);
        console.log('✅', message);
    }
    
    showWarning(message) {
        toast.warning(message);
        console.log('⚠️', message);
    }
    
    showInfo(message) {
        toast.info(message);
        console.log('ℹ️', message);
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const orchestrator = new CommandesOrchestrator();
export default orchestrator;