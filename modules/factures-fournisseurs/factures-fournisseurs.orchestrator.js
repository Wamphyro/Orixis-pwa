// ========================================
// FACTURES-FOURNISSEURS.ORCHESTRATOR.JS - 🎯 ORCHESTRATEUR PRINCIPAL
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.orchestrator.js
//
// DESCRIPTION:
// Orchestre toute la logique métier et coordonne les widgets
// Centralise les workflows, la gestion d'état et les interactions
// Fusion de : main.js, list.js, create.js, detail.js
//
// RESPONSABILITÉS:
// - Création et gestion des widgets
// - Workflows complets (upload → création → analyse)
// - Gestion des filtres et recherche
// - Formatage et affichage des données
// - Gestion des modals et interactions
// ========================================

// Import des widgets
import { HeaderWidget } from '../../widgets/header/header.widget.js';
import { StatsCardsWidget } from '../../widgets/stats-cards/stats-cards.widget.js';
import { SearchFiltersWidget } from '../../widgets/search-filters/search-filters.widget.js';
import { DataGridWidget } from '../../widgets/data-grid/data-grid.widget.js';
import { PdfUploaderWidget } from '../../widgets/pdf-uploader/pdf-uploader.widget.js';
import { DetailViewerWidget } from '../../widgets/detail-viewer/detail-viewer.widget.js';
import toast from '../../widgets/toast/toast.widget.js';

// Import des services
import uploadService from './factures-fournisseurs.upload.service.js';
import firestoreService from './factures-fournisseurs.firestore.service.js';
import openaiService from './factures-fournisseurs.openai.service.js';
import { FacturesFournisseursService, FACTURES_CONFIG } from './factures-fournisseurs.service.js';

// Import Firebase
import { initFirebase } from '../../src/services/firebase.service.js';

// ========================================
// CLASSE ORCHESTRATEUR
// ========================================

class FactureOrchestrator {
    constructor() {
        // Widgets
        this.header = null;
        this.stats = null;
        this.filters = null;
        this.grid = null;
        
        // Données
        this.facturesData = [];
        this.statsData = {};
        this.filteredData = [];
        this.selectedFactures = [];
        
        // État des filtres
        this.currentFilters = {
            search: '',
            statuts: [],  // Multi-sélection depuis cards
            fournisseur: '',
            categorie: '',
            magasin: '',
            periode: 'all'
        };
        
        // Données dynamiques
        this.fournisseursDynamiques = new Set();
        this.categoriesDynamiques = new Set();
        
        // État de l'application
        this.isLoading = false;
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    /**
     * Initialiser l'application complète
     */
    async init() {
        try {
            this.showLoader();
            console.log('🚀 Initialisation du module Factures Fournisseurs...');
            
            // Vérifier l'authentification
            if (!this.checkAuth()) {
                this.showError('Vous devez être connecté pour accéder à cette page');
                setTimeout(() => {
                    window.location.href = '/Orixis-pwa/index.html';
                }, 2000);
                return;
            }
            
            // Initialiser Firebase
            console.log('🔥 Initialisation Firebase...');
            await initFirebase();
            console.log('✅ Firebase initialisé');
            
            // Créer les widgets
            await this.createWidgets();
            
            // Charger les données
            await this.loadData();
            
            this.hideLoader();
            this.showSuccess('Application prête !');
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur initialisation : ' + error.message);
            console.error('Erreur complète:', error);
        }
    }
    
    /**
     * Vérifier l'authentification
     */
    checkAuth() {
        const auth = localStorage.getItem('sav_auth');
        return !!auth;
    }
    
    // ========================================
    // CRÉATION DES WIDGETS
    // ========================================
    
    /**
     * Créer tous les widgets
     */
    async createWidgets() {
        console.log('🎨 Création des widgets...');
        
        // Header
        this.createHeader();
        
        // Stats Cards
        this.createStatsCards();
        
        // Filtres
        this.createFilters();
        
        // DataGrid
        this.createDataGrid();
        
        console.log('✅ Widgets créés');
    }
    
    /**
     * Créer le header
     */
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
        title: 'Factures Fournisseurs',
        subtitle: '',
        centerTitle: true,  // Activer le titre centré
        
        // LOGO
        showLogo: true,
        logoIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        
        // NAVIGATION
        showBack: true,
        backText: 'Retour',
        onBack: () => {
            window.location.href = '/Orixis-pwa/Orixis-pwa/modules/home/home.html';
        },
        
        // RECHERCHE
        showSearch: true,
        searchPlaceholder: 'Rechercher fournisseur, n° facture, référence...',
        searchMaxWidth: '1500px',
        searchHeight: '48px',
        onSearch: (query) => {
            this.currentFilters.search = query;
            this.applyFilters();
        },
        
        // BOUTONS RAPIDES
        showQuickActions: true,
        quickActions: [
            {
                id: 'new',
                title: 'Nouvelle facture',
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
                    // Force le rechargement complet depuis le serveur (équivalent Cmd+Maj+R)
                    window.location.reload(true);
                }
            }
        ],
        
        // INDICATEURS
        showIndicators: true,
        indicators: [
            {
                id: 'status',
                text: 'Connecté',
                type: 'success',  // IMPORTANT: doit être 'success' pour le vert
                animated: true
            }
        ],
        
        // NOTIFICATIONS
        showNotifications: true,
        
        // BREADCRUMBS
        showBreadcrumbs: true,
        breadcrumbs: [
            { text: 'Accueil', url: '/Orixis-pwa/modules/home/home.html' },
            { text: 'Gestion', url: '#' },
            { text: 'Factures Fournisseurs' }
        ],
        
        // UTILISATEUR
        showUser: true,
        showUserDropdown: true,
        showMagasin: true,
        showLogout: true
    });
    
    // Mettre à jour les indicateurs après chargement
    // Fonction vide - plus de mise à jour des indicateurs
    this.updateHeaderIndicators = () => {
        // Désactivé - on garde seulement l'indicateur "Connecté"
    };
}
    
    /**
     * Créer les cartes de statistiques
     */
    createStatsCards() {
        this.stats = new StatsCardsWidget({
            container: '.stats-container',
            showWrapper: true,
            wrapperStyle: 'card',
            wrapperTitle: '',
            size: 'md',
            selectionMode: 'multiple',
            animated: true,
            cards: [
                { id: 'nouvelle', label: 'Nouvelle', icon: '📄', value: 0, color: 'secondary' },
                { id: 'a_payer', label: 'À payer', icon: '💳', value: 0, color: 'warning' },
                { id: 'en_retard', label: 'En retard', icon: '⚠️', value: 0, color: 'danger' },
                { id: 'payee', label: 'Payée', icon: '💰', value: 0, color: 'info' },
                { id: 'pointee', label: 'Pointée', icon: '✓✓', value: 0, color: 'success' },
                { id: 'total', label: 'Total à payer', icon: '💰', value: '0 €', color: 'primary' }
            ],
            onSelect: (selectedIds) => {
                console.log('Filtres par statuts:', selectedIds);
                // Exclure 'total' qui n'est pas un statut
                this.currentFilters.statuts = selectedIds.filter(id => id !== 'total');
                this.applyFilters();
            }
        });
    }
    
    /**
     * Créer les filtres de recherche
     */
    createFilters() {
        this.filters = new SearchFiltersWidget({
            container: '.filters-container',
            showWrapper: true,
            wrapperStyle: 'card',
            wrapperTitle: 'Filtres',
            resetButton: false,  // Pas de bouton reset ici
            filters: [
                { 
                    type: 'select', 
                    key: 'fournisseur', 
                    label: 'Fournisseur',
                    options: [
                        { value: '', label: 'Tous les fournisseurs' }
                    ],
                    searchable: true
                },
                { 
                    type: 'select', 
                    key: 'compteComptable', 
                    label: 'Type de dépense',
                    options: [
                        { value: '', label: 'Tous les types' },
                        ...Object.entries(FACTURES_CONFIG.COMPTES_PCG)
                            .sort((a, b) => a[1].libelle.localeCompare(b[1].libelle))
                            .map(([compte, data]) => ({
                                value: compte,
                                label: data.libelle
                            }))
                    ],
                    searchable: true
                },
                { 
                    type: 'select', 
                    key: 'magasin', 
                    label: 'Magasin',
                    options: [
                        { value: '', label: 'Tous les magasins' }
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
                console.log('Filtres appliqués:', values);
                
                this.currentFilters = { 
                    ...this.currentFilters, 
                    search: values.search || '',
                    fournisseur: values.fournisseur || '',
                    compteComptable: values.compteComptable || '',
                    magasin: values.magasin || '',
                    periode: values.periode || 'all',
                    statuts: this.currentFilters.statuts  // Préserver les statuts des cartes
                };
                
                this.applyFilters();
            },
        });
    }
    
    /**
     * Créer le tableau de données
     */
    createDataGrid() {
        this.grid = new DataGridWidget({
            container: '.table-container',
            showWrapper: true,
            wrapperStyle: 'card',
            wrapperTitle: '',
            columns: [
                { 
                    key: 'dateFacture', 
                    label: 'Date', 
                    sortable: true, 
                    width: 100,
                    formatter: (v) => {
                        if (!v) return '-';
                        const date = v.toDate ? v.toDate() : new Date(v);
                        return date.toLocaleDateString('fr-FR');
                    }
                },
                { 
                    key: 'numeroFacture', 
                    label: 'N° Facture', 
                    sortable: true, 
                    width: 140,
                    formatter: (v, row) => v || row.numeroInterne || '-'
                },
                { 
                    key: 'codeMagasin', 
                    label: 'Magasin', 
                    sortable: true, 
                    width: 100,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'fournisseur', 
                    label: 'Fournisseur', 
                    sortable: true, 
                    width: 200,
                    formatter: (fournisseur) => {
                        if (!fournisseur || !fournisseur.nom) return '-';
                        return `<strong>${fournisseur.nom}</strong>`;
                    }
                },
                { 
                    key: 'comptabilite.compteComptable', 
                    label: 'Type de dépense',  // ← CHANGÉ
                    sortable: true, 
                    width: 220,  // Un peu plus large pour le titre
                    formatter: (v, row) => {
                        const compte = row.comptabilite?.compteComptable;
                        if (!compte) return '<span class="text-muted">Non défini</span>';
                        
                        const data = FACTURES_CONFIG.COMPTES_PCG[compte];
                        if (data) {
                            return `<span title="Compte ${compte}">${data.libelle}</span>`;
                        }
                        // Si compte non référencé dans notre dictionnaire
                        return `<span class="text-muted" title="Compte non référencé">📊 ${compte}</span>`;
                    },
                    html: true
                },
                { 
                    key: 'statut', 
                    label: 'Statut', 
                    sortable: true,
                    width: 120,
                    formatter: (v) => {
                        const statuts = {
                            'nouvelle': { label: 'Nouvelle', class: 'badge-secondary' },
                            'a_payer': { label: 'À payer', class: 'badge-warning' },
                            'en_retard': { label: 'En retard', class: 'badge-danger' },
                            'deja_payee': { label: 'Déjà payée', class: 'badge-success' },
                            'payee': { label: 'Payée', class: 'badge-info' },
                            'a_pointer': { label: 'À pointer', class: 'badge-purple' },
                            'pointee': { label: 'Pointée', class: 'badge-success' },
                            'annulee': { label: 'Annulée', class: 'badge-secondary' }
                        };
                        const statut = statuts[v] || { label: v, class: 'badge-secondary' };
                        return `<span class="badge ${statut.class}">${statut.label}</span>`;
                    }
                },
                { 
                    type: 'actions',
                    label: 'Actions',
                    width: 80,
                    actions: [
                        { 
                            type: 'view',
                            title: 'Voir les détails',
                            onClick: (row, index) => this.openDetailModal(row)
                        }
                    ]
                }
            ],
            data: [],
            features: {
                sort: true,
                export: true,
                selection: true,           // ✅ ACTIVÉ
                selectionMode: 'multiple', // ✅ AJOUTÉ
                pagination: true,
                resize: false
            },
            pagination: {
                itemsPerPage: 20,
                pageSizeOptions: [10, 20, 50, 100],
                showPageInfo: true
            },
            // ✅ NOUVEAU : Callback de sélection
            onSelectionChange: (selectedRows) => {
                this.selectedFactures = selectedRows;
                console.log(`📋 ${selectedRows.length} facture(s) sélectionnée(s)`);
                
                // Mettre à jour le bouton export comptable
                const btnExportCompta = document.querySelector('.btn-export-comptable');
                if (btnExportCompta) {
                    btnExportCompta.textContent = selectedRows.length > 0 
                        ? `📊 Export comptable (${selectedRows.length})` 
                        : '📊 Export comptable';
                    btnExportCompta.disabled = selectedRows.length === 0;
                }
            }
        });
    }

    // ========================================
    // CHARGEMENT DES DONNÉES
    // ========================================
    
    /**
     * Charger toutes les données
     */
    async loadData() {
        try {
            this.showLoader();
            console.log('📊 Chargement des données...');
            
            // Charger TOUTES les factures
            const toutesLesFactures = await FacturesFournisseursService.getFactures({ limite: 100 });
            
            // Filtrer les annulées
            this.facturesData = toutesLesFactures.filter(f => f.statut !== 'annulee');
            
            console.log(`📊 ${toutesLesFactures.length} factures totales`);
            console.log(`✅ ${this.facturesData.length} factures actives`);
            
            // Charger les stats
            this.statsData = await FacturesFournisseursService.getStatistiques();
            console.log('✅ Statistiques chargées:', this.statsData);
            
            // Mettre à jour les listes dynamiques
            this.updateDynamicLists();
            
            // Mettre à jour les options de filtres
            this.updateFilterOptions();
            
            // Mettre à jour l'affichage
            this.updateStats();
            this.applyFilters();
            
            this.hideLoader();
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur chargement données : ' + error.message);
            console.error('Erreur complète:', error);
        }
    }
    
    /**
     * Mettre à jour les listes dynamiques
     */
    updateDynamicLists() {
        this.fournisseursDynamiques.clear();
        this.categoriesDynamiques.clear();
        
        this.facturesData.forEach(facture => {
            if (facture.fournisseur?.nom) {
                this.fournisseursDynamiques.add(facture.fournisseur.nom);
            }
            if (facture.fournisseur?.categorie) {
                this.categoriesDynamiques.add(facture.fournisseur.categorie);
            }
        });
        
        console.log('📊 Fournisseurs:', Array.from(this.fournisseursDynamiques));
        console.log('📊 Catégories:', Array.from(this.categoriesDynamiques));
    }
    
    /**
     * Mettre à jour les options de filtres dynamiquement
     */
    updateFilterOptions() {
        const fournisseurs = Array.from(this.fournisseursDynamiques).sort();
        const magasins = [...new Set(this.facturesData.map(f => f.codeMagasin).filter(Boolean))].sort();
        
        // Mettre à jour le dropdown fournisseur
        if (this.filters && this.filters.state.dropdowns.fournisseur) {
            const fournisseurDropdown = this.filters.state.dropdowns.fournisseur;
            
            fournisseurDropdown.config.options = [
                { value: '', label: 'Tous les fournisseurs' },
                ...fournisseurs.map(f => ({ value: f, label: f }))
            ];
            
            fournisseurDropdown.filteredOptions = [...fournisseurDropdown.config.options];
            this.filters.renderDropdownOptions(fournisseurDropdown);
        }
        
        // Mettre à jour le dropdown magasin
        if (this.filters && this.filters.state.dropdowns.magasin) {
            const magasinDropdown = this.filters.state.dropdowns.magasin;
            
            magasinDropdown.config.options = [
                { value: '', label: 'Tous les magasins' },
                ...magasins.map(m => ({ value: m, label: m }))
            ];
            
            magasinDropdown.filteredOptions = [...magasinDropdown.config.options];
            this.filters.renderDropdownOptions(magasinDropdown);
        }
    }
    
    // ========================================
    // CRÉATION DE FACTURE
    // ========================================
    
    /**
     * Ouvrir le modal de création
     */
    openCreateModal() {
        const uploader = new PdfUploaderWidget({
            title: 'Nouvelles Factures',
            theme: 'red',
            mode: 'selection',
            maxFiles: 100,  // ✅ Permettre plusieurs fichiers
            
            // ✅ NOUVEAU : Détection de doublons par hash
            checkDuplicate: async (file, hash) => {
                return await firestoreService.verifierHashExiste(hash);
            },
            
            description: {
                icon: '📑',
                title: 'Upload de factures fournisseurs',
                text: 'Déposez vos factures (Free, EDF, Orange, etc.). Chaque fichier créera une facture séparée et sera analysé automatiquement.'
            },
            selectionOptions: [
                { value: 'a_payer', label: '💳 À payer' },
                { value: 'deja_payee', label: '✅ Déjà payée' }
            ],
            saveButtonText: '💾 Créer les factures',
            onSave: async (data) => this.handleCreateFacture(data),
            onClose: () => {
                console.log('Modal création fermé');
            }
        });
    }
    
    /**
     * Gérer la création d'une facture
     */
    async handleCreateFacture(data) {
        try {
            console.log('📁 Création de', data.files.length, 'facture(s)...');
            this.showLoader();
            
            const resultats = {
                crees: [],
                analyses: [],
                erreurs: []
            };
            
            // Charger les magasins pour l'analyse IA
            const magasins = await firestoreService.chargerMagasins?.() || [];
            
            // Traiter chaque fichier individuellement
            for (let i = 0; i < data.files.length; i++) {
                const file = data.files[i];
                const statut = data.selections?.[i] || 'deja_payee';  // Statut sélectionné pour ce fichier
                const numero = i + 1;
                
                try {
                    console.log(`\n📄 Traitement facture ${numero}/${data.files.length}: ${file.name}`);
                    
                    // ÉTAPE 1 : Upload du document
                    this.showMessage(`Upload du document ${numero}/${data.files.length}...`);
                    // ✅ MODIFICATION : Passer le hash du widget à l'upload
                    const resultatsUpload = await uploadService.uploadFactureDocument(file, file._hash);                    
                    console.log('✅ Document uploadé:', resultatsUpload);
                    
                    // ÉTAPE 2 : Créer une facture pour CE document
                    this.showMessage(`Création de la facture ${numero}/${data.files.length}...`);
                    const factureData = {
                        documents: [resultatsUpload],
                        aPayer: statut === 'a_payer',
                        dejaPayee: statut === 'deja_payee'
                    };
                    
                    const factureId = await firestoreService.creerFacture(factureData);
                    
                    console.log('✅ Facture créée avec ID:', factureId);
                    resultats.crees.push({
                        id: factureId,
                        fichier: file.name
                    });
                    
                    // ÉTAPE 3 : Analyse IA automatique
                    this.showMessage(`Analyse IA ${numero}/${data.files.length}...`);
                    try {
                        const donneesExtraites = await openaiService.analyserAvecFichier?.(
                            file,
                            magasins
                        ) || await openaiService.analyserDocument(
                            resultatsUpload.url,
                            resultatsUpload.type
                        );
                        
                        // Ajouter les données extraites à la facture
                        // ✅ RECHERCHE INTELLIGENTE DE DOUBLONS
                        const doublonsPotentiels = await firestoreService.rechercherDoublonsProbables({
                            numeroFacture: donneesExtraites.numeroFacture,
                            montantTTC: donneesExtraites.montantTTC,
                            dateFacture: donneesExtraites.dateFacture,
                            fournisseur: donneesExtraites.fournisseur?.nom
                        });

                        // Si doublon probable trouvé
                        if (doublonsPotentiels.length > 0 && doublonsPotentiels[0].id !== factureId) {
                            const doublon = doublonsPotentiels[0];
                            
                            // Formater les infos
                            let dateFacture = 'Date inconnue';
                            if (doublon.dateFacture) {
                                const d = doublon.dateFacture.toDate ? 
                                    doublon.dateFacture.toDate() : 
                                    new Date(doublon.dateFacture);
                                dateFacture = d.toLocaleDateString('fr-FR');
                            }
                            
                            const montant = new Intl.NumberFormat('fr-FR', { 
                                style: 'currency', 
                                currency: 'EUR' 
                            }).format(doublon.montantTTC || 0);
                            
                            // Déterminer le niveau d'alerte
                            let emoji = '🟡';
                            let niveau = 'POSSIBLE';
                            if (doublon.score >= 80) {
                                emoji = '🔴';
                                niveau = 'QUASI-CERTAIN';
                            } else if (doublon.score >= 60) {
                                emoji = '🟠';
                                niveau = 'PROBABLE';
                            }
                            
                            const garder = confirm(
                                `${emoji} DOUBLON ${niveau} DÉTECTÉ ! (${doublon.score}%)\n\n` +
                                `Une facture similaire existe déjà :\n` +
                                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                                `📄 N° Facture : ${doublon.numeroFacture || 'Sans numéro'}\n` +
                                `🏢 Fournisseur : ${doublon.fournisseur || 'Non défini'}\n` +
                                `📅 Date : ${dateFacture}\n` +
                                `💰 Montant : ${montant}\n` +
                                `📊 Statut : ${this.getStatutLabel(doublon.statut)}\n` +
                                `\n` +
                                `🔍 Critères correspondants :\n` +
                                doublon.details.map(d => `   ✓ ${d}`).join('\n') +
                                `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                                `Garder quand même cette nouvelle facture ?`
                            );
                            
                            if (!garder) {
                                // Supprimer la facture créée
                                console.log('🗑️ Suppression de la facture doublon créée');
                                await FacturesFournisseursService.supprimerFacture(factureId, {
                                    motif: `Doublon probable (${doublon.score}%) de ${doublon.numeroFacture || 'facture existante'}`
                                });
                                
                                this.showWarning(`Facture ${file.name} supprimée (doublon ${doublon.score}%)`);
                                
                                // ✅ RETIRER DES CRÉÉS car supprimé
                                const indexCree = resultats.crees.findIndex(c => c.id === factureId);
                                if (indexCree !== -1) {
                                    resultats.crees.splice(indexCree, 1);
                                }
                                
                                // ✅ RETIRER DES ANALYSES aussi (au cas où)
                                const indexAnalyse = resultats.analyses.findIndex(a => a.id === factureId);
                                if (indexAnalyse !== -1) {
                                    resultats.analyses.splice(indexAnalyse, 1);
                                }
                                
                                resultats.erreurs.push({
                                    fichier: file.name,
                                    erreur: `Doublon détecté (${doublon.score}% de certitude)`,
                                    type: 'doublon_intelligent',
                                    score: doublon.score
                                });
                                
                                continue; // Passer au fichier suivant
                            }
                            
                            console.log(`⚠️ Doublon ${doublon.score}% confirmé, création forcée`);
                        }

                        // Ajouter les données extraites à la facture
                        await firestoreService.ajouterDonneesExtraites(factureId, donneesExtraites);

                        console.log('✅ Analyse IA terminée:', donneesExtraites);
                        resultats.analyses.push({
                            id: factureId,
                            fichier: file.name,
                            donnees: donneesExtraites
                        });
                        
                    } catch (errorIA) {
                        console.warn('⚠️ Analyse IA échouée:', errorIA);
                        resultats.erreurs.push({
                            fichier: file.name,
                            erreur: `Analyse IA échouée: ${errorIA.message}`,
                            factureId: factureId
                        });
                    }
                    
                } catch (error) {
                    console.error(`❌ Erreur traitement ${file.name}:`, error);
                    resultats.erreurs.push({
                        fichier: file.name,
                        erreur: error.message
                    });
                }
            }
            
            // ÉTAPE 4 : Afficher le résumé
            console.log('📊 Résumé du traitement:', resultats);
            
            if (resultats.crees.length > 0) {
                this.showSuccess(`✅ ${resultats.crees.length} facture(s) créée(s)`);
            }
            
            if (resultats.analyses.length > 0) {
                this.showSuccess(`🤖 ${resultats.analyses.length} facture(s) analysée(s) avec succès`);
            }
            
            if (resultats.erreurs.length > 0) {
                resultats.erreurs.forEach(err => {
                    // Messages différents selon le type d'erreur
                    if (err.type === 'doublon' || err.type === 'doublon_intelligent') {
                        // Orange pour les doublons (c'est un choix, pas une erreur)
                        this.showWarning(`⚠️ ${err.fichier}: ${err.erreur}`);
                    } else {
                        // Rouge pour les vraies erreurs
                        this.showError(`❌ ${err.fichier}: ${err.erreur}`);
                    }
                });
            }
            
            // ÉTAPE 5 : Rafraîchir les données
            await this.loadData();
            
            this.hideLoader();
            
            // Retourner true si au moins une facture créée
            return resultats.crees.length > 0;
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur création : ' + error.message);
            console.error('Erreur complète:', error);
            throw error;
        }
    }
    
// ========================================
// AFFICHAGE DÉTAIL
// ========================================

/**
 * Ouvrir le modal de détail avec toutes les données enrichies
 */
openDetailModal(row) {
    const self = this;
    
    // Timeline
    const timeline = {
        enabled: true,
        orientation: 'horizontal',
        items: [
            { 
                label: 'Nouvelle', 
                status: row.statut === 'nouvelle' ? 'active' : 'completed',
                icon: '📄',
                date: this.formatDate(row.dates?.creation),
                description: 'Création de la facture'
            },
            { 
                label: 'À payer', 
                status: row.statut === 'a_payer' ? 'active' : 
                        ['nouvelle'].includes(row.statut) ? 'pending' : 'completed',
                icon: '💳',
                date: this.formatDate(row.dates?.verification),
                description: 'En attente de paiement'
            },
            { 
                label: 'Payée', 
                status: row.statut === 'payee' || row.statut === 'deja_payee' ? 'active' : 
                        ['nouvelle', 'a_payer'].includes(row.statut) ? 'pending' : 'completed',
                icon: '💰',
                date: this.formatDate(row.dates?.paiement || row.datePaiement),
                description: 'Paiement effectué'
            },
            { 
                label: 'Pointée', 
                status: row.statut === 'pointee' ? 'completed' : 'pending',
                icon: '✓✓',
                date: this.formatDate(row.dates?.pointage),
                description: 'Rapprochement bancaire'
            }
        ],
        theme: 'colorful',
        size: 'medium',
        showDates: true,
        showLabels: true
    };
    
    // Sections
    let sections = [];
    
    // ========================================
    // SECTION 1 : IDENTIFIANTS
    // ========================================
    sections.push({
        id: 'identifiants',
        title: '🔢 Identifiants & Références',
        fields: [
            { 
                label: 'N° Facture Fournisseur', 
                value: row.numeroFacture || row.identifiants?.numeroFacture || '-',
                bold: true
            },
            { 
                label: 'N° Facture Interne', 
                value: row.numeroInterne || '-',
                bold: true
            },
            { 
                label: 'N° Commande', 
                value: row.identifiants?.numeroCommande || row.documentsLies?.bonCommande || '-' 
            },
            { 
                label: 'N° Client (notre ref)', 
                value: row.identifiants?.numeroClient || row.client?.numeroClient || '-' 
            },
            { 
                label: 'N° TVA Intracommunautaire', 
                value: row.identifiants?.numeroTVAIntra || '-' 
            },
            { 
                label: 'SIRET', 
                value: row.identifiants?.siret || '-' 
            },
            { 
                label: 'SIREN', 
                value: row.identifiants?.siren || '-' 
            },
            { 
                label: 'Code NAF/APE', 
                value: row.identifiants?.naf || '-' 
            }
        ]
    });
    
    // ========================================
    // SECTION 2 : FOURNISSEUR DÉTAILLÉ
    // ========================================
    sections.push({
        id: 'fournisseur',
        title: '🏢 Fournisseur',
        fields: [
            { 
                label: 'Raison sociale', 
                value: row.fournisseur?.nom || '-',
                bold: true
            },
            { 
                label: 'Catégorie', 
                value: row.fournisseur?.categorie ? 
                    row.fournisseur.categorie.charAt(0).toUpperCase() + row.fournisseur.categorie.slice(1) : 
                    '-' 
            },
            { 
                label: 'Pays', 
                value: row.fournisseur?.paysDomiciliation ? 
                    `${row.fournisseur.paysDomiciliation} ${this.getFlagEmoji(row.fournisseur.paysDomiciliation)}` : 
                    '-'
            },
            { 
                label: 'Adresse', 
                value: row.fournisseur?.adresse || '-' 
            },
            { 
                label: 'Téléphone', 
                value: row.fournisseur?.telephone || '-' 
            },
            { 
                label: 'Email', 
                value: row.fournisseur?.email || '-' 
            },
            { 
                label: 'N° TVA Fournisseur', 
                value: row.fournisseur?.numeroTVA || '-' 
            },
            { 
                label: 'SIREN Fournisseur', 
                value: row.fournisseur?.siren || '-' 
            },
            { 
                label: 'Compte auxiliaire', 
                value: row.fournisseur?.compteFournisseur || '-' 
            }
        ]
    });
    
    // ========================================
    // SECTION 3 : CLIENT (NOUS)
    // ========================================
    if (row.client && Object.keys(row.client).some(k => row.client[k])) {
        sections.push({
            id: 'client',
            title: '👤 Client (Nous)',
            fields: [
                { 
                    label: 'Nom', 
                    value: row.client?.nom || row.societe || '-' 
                },
                { 
                    label: 'N° Client', 
                    value: row.client?.numeroClient || '-' 
                },
                { 
                    label: 'Adresse', 
                    value: row.client?.adresse || '-' 
                },
                { 
                    label: 'N° TVA', 
                    value: row.client?.numeroTVA || '-' 
                },
                { 
                    label: 'Point de livraison', 
                    value: row.client?.pointLivraison || '-' 
                }
            ]
        });
    }
    
    // ========================================
    // SECTION 4 : TVA DÉTAILLÉE
    // ========================================
    sections.push({
        id: 'tva',
        title: '📋 TVA & Fiscalité',
        fields: [
            { 
                label: 'Régime TVA', 
                value: row.tva?.regime || 'NATIONAL',
                formatter: (v) => {
                    const badges = {
                        'NATIONAL': '<span class="badge badge-primary">National</span>',
                        'INTRACOMMUNAUTAIRE': '<span class="badge badge-warning">Intracommunautaire</span>',
                        'EXPORT': '<span class="badge badge-info">Export</span>'
                    };
                    return badges[v] || v;
                },
                html: true
            },
            { 
                label: 'Taux appliqué', 
                value: `${row.tva?.tauxApplique || row.tauxTVA || 0}%`,
                bold: true
            },
            { 
                label: 'Exonération', 
                value: row.tva?.exoneration ? '✅ Oui' : '❌ Non' 
            },
            { 
                label: 'Motif exonération', 
                value: row.tva?.motifExoneration || '-' 
            },
            { 
                label: 'Autoliquidation', 
                value: row.tva?.autoliquidation ? '✅ Oui' : '❌ Non' 
            }
        ]
    });
    
    // Ventilation TVA si plusieurs taux
    if (row.tva?.ventilationTVA && row.tva.ventilationTVA.length > 0) {
        sections.push({
            id: 'ventilation-tva',
            title: '📊 Ventilation TVA',
            fields: row.tva.ventilationTVA.map((v, i) => ({
                label: `Taux ${v.taux}%`,
                value: `Base: ${this.formaterMontant(v.base)} | TVA: ${this.formaterMontant(v.montant)}`
            }))
        });
    }
    
    // ========================================
    // SECTION 5 : COMPTABILITÉ
    // ========================================
    sections.push({
        id: 'comptabilite',
        title: '📊 Comptabilité',
        fields: [
            { 
                label: 'Compte comptable', 
                value: row.comptabilite?.compteComptable || '-',
                formatter: (v) => v !== '-' ? `<strong>${v}</strong>` : '-',
                html: true,
                bold: true
            },
            { 
                label: 'Libellé compte', 
                value: row.comptabilite?.libelleCompte || '-' 
            },
            { 
                label: 'Catégorie détectée', 
                value: row.comptabilite?.categorieDetectee || '-' 
            },
            { 
                label: 'Justification', 
                value: row.comptabilite?.justification || '-' 
            },
            { 
                label: 'Mots-clés détectés', 
                value: row.comptabilite?.motsClesDetectes?.join(', ') || '-' 
            },
            { 
                label: 'Fiabilité', 
                value: row.comptabilite?.fiabilite ? 
                    `${row.comptabilite.fiabilite}%` : '-',
                formatter: (v) => {
                    if (v === '-') return '-';
                    const pct = parseInt(v);
                    const color = pct >= 80 ? 'success' : pct >= 60 ? 'warning' : 'danger';
                    return `<span class="badge badge-${color}">${v}</span>`;
                },
                html: true
            },
            { 
                label: 'Journal', 
                value: row.comptabilite?.journalComptable || 'HA' 
            },
            { 
                label: 'Code analytique', 
                value: row.comptabilite?.codeAnalytique || '-' 
            },
            { 
                label: 'Type dépense', 
                value: row.comptabilite?.typeDepense || '-' 
            }
        ]
    });
    
    // ========================================
    // SECTION 6 : MONTANTS DÉTAILLÉS
    // ========================================
    sections.push({
        id: 'montants',
        title: '💰 Montants',
        fields: [
            { 
                label: 'Montant HT', 
                value: this.formaterMontant(row.montantHT || row.montants?.montantHT || 0) 
            },
            { 
                label: `TVA (${row.tauxTVA || row.tva?.tauxApplique || 0}%)`, 
                value: this.formaterMontant(row.montantTVA || row.montants?.montantTVA || 0) 
            },
            { 
                label: 'Montant TTC',
                value: this.formaterMontant(row.montantTTC || row.montants?.montantTTC || 0),
                bold: true,
                formatter: (v) => `<strong style="font-size: 1.2em; color: var(--primary);">${v}</strong>`,
                html: true
            },
            { 
                label: 'Frais de port', 
                value: this.formaterMontant(row.montants?.fraisPort || 0) 
            },
            { 
                label: 'Remise', 
                value: this.formaterMontant(row.montants?.remise || 0) 
            },
            { 
                label: 'Net à payer', 
                value: this.formaterMontant(row.montants?.montantNet || row.montantTTC || 0),
                bold: true
            }
        ]
    });
    
    // ========================================
    // SECTION 7 : PAIEMENT
    // ========================================
    sections.push({
        id: 'paiement',
        title: '💳 Paiement',
        fields: [
            { 
                label: 'Mode de paiement', 
                value: row.paiement?.modePaiement || row.modePaiement || '-',
                formatter: (v) => {
                    const modes = {
                        'virement': '🏦 Virement',
                        'prelevement': '🔄 Prélèvement',
                        'cheque': '📄 Chèque',
                        'cb': '💳 Carte bancaire',
                        'especes': '💵 Espèces'
                    };
                    return modes[v] || v;
                }
            },
            { 
                label: 'Conditions', 
                value: row.paiement?.conditionsPaiement || '-' 
            },
            { 
                label: 'Référence virement', 
                value: row.paiement?.referenceVirement || row.referenceVirement || '-' 
            },
            { 
                label: 'IBAN', 
                value: row.paiement?.iban || '-',
                formatter: (v) => v !== '-' ? this.formatIBAN(v) : '-'
            },
            { 
                label: 'BIC', 
                value: row.paiement?.bic || '-' 
            },
            { 
                label: 'Référence mandat', 
                value: row.paiement?.referenceMandat || '-' 
            }
        ]
    });
    
    // Escompte si présent
    if (row.paiement?.escompte) {
        sections.push({
            id: 'escompte',
            title: '💸 Escompte',
            fields: [
                { 
                    label: 'Taux', 
                    value: `${row.paiement.escompte.taux || 0}%` 
                },
                { 
                    label: 'Date limite', 
                    value: this.formatDate(row.paiement.escompte.dateLimit) 
                },
                { 
                    label: 'Montant', 
                    value: this.formaterMontant(row.paiement.escompte.montant || 0) 
                }
            ]
        });
    }
    
    // ========================================
    // SECTION 8 : DATES
    // ========================================
    sections.push({
        id: 'dates',
        title: '📅 Dates',
        fields: [
            { 
                label: 'Date facture', 
                value: this.formatDate(row.dateFacture),
                bold: true
            },
            { 
                label: 'Date échéance', 
                value: this.formatDate(row.dateEcheance),
                formatter: (v, data) => {
                    if (!v || v === '') return '-';
                    const echeance = data.dateEcheance?.toDate ? 
                        data.dateEcheance.toDate() : 
                        new Date(data.dateEcheance);
                    const aujourd = new Date();
                    
                    if (data.statut === 'a_payer' && echeance < aujourd) {
                        const jours = Math.floor((aujourd - echeance) / (1000 * 60 * 60 * 24));
                        return `<span style="color: #dc2626; font-weight: 600;">${v} (${jours}j de retard)</span>`;
                    }
                    return v;
                },
                html: true
            },
            { 
                label: 'Date réception', 
                value: this.formatDate(row.dateReception) 
            },
            { 
                label: 'Date paiement', 
                value: this.formatDate(row.datePaiement) 
            },
            { 
                label: 'Période facturée', 
                value: row.periodeDebut && row.periodeFin ? 
                    `Du ${this.formatDate(row.periodeDebut)} au ${this.formatDate(row.periodeFin)}` : 
                    '-' 
            }
        ]
    });
    
    // ========================================
    // SECTION 9 : DOCUMENTS LIÉS
    // ========================================
    if (row.documentsLies && Object.keys(row.documentsLies).some(k => row.documentsLies[k])) {
        sections.push({
            id: 'documents-lies',
            title: '🔗 Documents liés',
            fields: [
                { 
                    label: 'Bon de commande', 
                    value: row.documentsLies?.bonCommande || '-' 
                },
                { 
                    label: 'Bon de livraison', 
                    value: row.documentsLies?.bonLivraison || '-' 
                },
                { 
                    label: 'Avoir', 
                    value: row.documentsLies?.avoir || '-' 
                },
                { 
                    label: 'Facture précédente', 
                    value: row.documentsLies?.facturePrecedente || '-' 
                },
                { 
                    label: 'Contrat', 
                    value: row.documentsLies?.contrat || '-' 
                },
                { 
                    label: 'Devis', 
                    value: row.documentsLies?.devis || '-' 
                }
            ]
        });
    }
    
    // ========================================
    // SECTION 10 : LIGNES DE DÉTAIL
    // ========================================
    if (row.lignesDetail && row.lignesDetail.length > 0) {
        sections.push({
            id: 'lignes-detail',
            title: '📝 Détail des articles',
            fields: [
                {
                    label: 'Articles',
                    key: 'lignesDetail',
                    formatter: (lignes) => {
                        return `
                            <table style="width: 100%; font-size: 0.9em;">
                                <thead>
                                    <tr style="background: #f5f5f5;">
                                        <th style="padding: 8px; text-align: left;">Référence</th>
                                        <th style="padding: 8px; text-align: left;">Désignation</th>
                                        <th style="padding: 8px; text-align: center;">Qté</th>
                                        <th style="padding: 8px; text-align: right;">PU HT</th>
                                        <th style="padding: 8px; text-align: right;">Total HT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${lignes.map(ligne => `
                                        <tr>
                                            <td style="padding: 8px;">${ligne.reference || '-'}</td>
                                            <td style="padding: 8px;">${ligne.designation || '-'}</td>
                                            <td style="padding: 8px; text-align: center;">${ligne.quantite || 1}</td>
                                            <td style="padding: 8px; text-align: right;">${self.formaterMontant(ligne.prixUnitaireHT || 0)}</td>
                                            <td style="padding: 8px; text-align: right;"><strong>${self.formaterMontant(ligne.montantHT || 0)}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `;
                    },
                    html: true
                }
            ]
        });
    }
    
    // ========================================
    // SECTION 11 : DOCUMENTS UPLOADÉS
    // ========================================
    sections.push({
        id: 'documents',
        title: '📄 Documents',
        fields: [
            {
                label: 'Fichiers uploadés',
                key: 'documents',
                formatter: (docs) => {
                    if (!docs || docs.length === 0) return 'Aucun document';
                    return docs.map(d => `
                        <div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    📎 <strong>${d.nom || d.nomOriginal}</strong>
                                    <span style="color: #6b7280; font-size: 0.9em; margin-left: 10px;">
                                        (${self.formatFileSize(d.taille)})
                                    </span>
                                </div>
                                <a href="${d.url}" target="_blank" class="btn btn-view-icon btn-sm" title="Voir le document">
                                </a>
                            </div>
                            ${d.hash ? `<div style="font-size: 0.8em; color: #9ca3af; margin-top: 4px;">Hash: ${d.hash.substring(0, 12)}...</div>` : ''}
                        </div>
                    `).join('');
                },
                html: true
            }
        ]
    });
    
    // ========================================
    // SECTION 12 : INFORMATIONS SYSTÈME
    // ========================================
    sections.push({
        id: 'systeme',
        title: '⚙️ Informations système',
        fields: [
            { 
                label: 'ID Document', 
                value: row.id || '-',
                formatter: (v) => `<code>${v}</code>`,
                html: true
            },
            { 
                label: 'Société', 
                value: row.societe || '-' 
            },
            { 
                label: 'Code magasin', 
                value: row.codeMagasin || '-' 
            },
            { 
                label: 'Uploadé par', 
                value: row.magasinUploadeur || '-' 
            },
            { 
                label: 'Créé le', 
                value: this.formatDate(row.dates?.creation) 
            },
            { 
                label: 'Analysé le', 
                value: this.formatDate(row.dates?.analyse || row.iaData?.dateAnalyse) 
            },
            { 
                label: 'Modèle IA', 
                value: row.iaData?.modeleIA || '-' 
            },
            { 
                label: 'Créé par', 
                value: row.intervenants?.creePar ? 
                    `${row.intervenants.creePar.prenom} ${row.intervenants.creePar.nom}` : 
                    '-' 
            }
        ]
    });
    
    // ========================================
    // CRÉATION DU WIDGET
    // ========================================
    
    // Créer le viewer
    const viewer = new DetailViewerWidget({
        title: `Facture ${row.numeroFacture || row.numeroInterne}`,
        subtitle: `${row.fournisseur?.nom || 'Fournisseur inconnu'} - ${row.codeMagasin}`,
        data: row,
        timeline: timeline,
        sections: sections,
        actions: [
            {
                label: '💳 Marquer à payer',
                class: 'btn btn-glass-orange btn-lg',
                onClick: async (data) => {
                    await FacturesFournisseursService.changerStatut(data.id, 'a_payer');
                    await self.loadData();
                    viewer.close();
                    self.showSuccess('✅ Facture marquée à payer');
                    return true;
                },
                show: (data) => data.statut === 'nouvelle'
            },
            {
                label: '💰 Marquer payée',
                class: 'btn btn-glass-green btn-lg',
                onClick: async (data) => {
                    await FacturesFournisseursService.changerStatut(data.id, 'payee');
                    await self.loadData();
                    viewer.close();
                    self.showSuccess('✅ Facture marquée comme payée');
                    return true;
                },
                show: (data) => data.statut === 'a_payer' || data.statut === 'en_retard'
            },
            {
                label: '✓✓ Pointer',
                class: 'btn btn-glass-blue btn-lg',
                onClick: async (data) => {
                    await FacturesFournisseursService.changerStatut(data.id, 'pointee');
                    await self.loadData();
                    viewer.close();
                    self.showSuccess('✅ Facture pointée');
                    return true;
                },
                show: (data) => data.statut === 'payee' || data.statut === 'deja_payee' || data.statut === 'a_pointer'
            },
            {
                label: '📊 Export comptable',
                class: 'btn btn-glass-purple btn-lg',
                onClick: async (data) => {
                    self.exportComptable(data);
                    return false; // Ne pas fermer
                }
            },
            {
                label: '🗑️ Supprimer',
                class: 'btn btn-glass-red btn-lg',
                onClick: async (data) => {
                    const confirmation = confirm(
                        `⚠️ Voulez-vous vraiment supprimer la facture ${data.numeroFacture || data.numeroInterne} ?\n\n` +
                        `Cette action est irréversible.`
                    );
                    
                    if (!confirmation) {
                        return false;
                    }
                    
                    try {
                        self.showLoader();
                        await FacturesFournisseursService.supprimerFacture(data.id);
                        self.showSuccess('✅ Facture supprimée');
                        await self.loadData();
                        self.hideLoader();
                        viewer.close();
                        return true;
                    } catch (error) {
                        self.hideLoader();
                        self.showError('❌ Erreur : ' + error.message);
                        return false;
                    }
                },
                closeOnClick: false
            }
        ],
        size: 'x-large',  // Plus grand pour toutes les données
        theme: 'default',
        destroyOnClose: true
    });
}

/**
 * Réinitialiser tous les filtres
 */
resetAllFilters() {
    console.log('🔄 Réinitialisation de tous les filtres');
    
    // Réinitialiser les filtres
    this.currentFilters = {
        search: '',
        statuts: [],
        fournisseur: '',
        compteComptable: '',
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
// HELPERS SUPPLÉMENTAIRES
// ========================================

/**
 * Obtenir l'emoji du drapeau pour un code pays
 */
getFlagEmoji(countryCode) {
    const flags = {
        'FR': '🇫🇷',
        'DE': '🇩🇪',
        'ES': '🇪🇸',
        'IT': '🇮🇹',
        'GB': '🇬🇧',
        'US': '🇺🇸',
        'BE': '🇧🇪',
        'NL': '🇳🇱',
        'CH': '🇨🇭',
        'LU': '🇱🇺'
    };
    return flags[countryCode] || '🏳️';
}

/**
 * Formater un IBAN pour l'affichage
 */
formatIBAN(iban) {
    if (!iban) return '-';
    // Formater par groupes de 4
    return iban.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || iban;
}

/**
 * Formater la taille d'un fichier
 */
formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    /**
     * Obtenir le label formaté d'un statut
     */
    getStatutLabel(statut) {
        const statuts = {
            'nouvelle': 'NOUVELLE',
            'a_payer': 'À PAYER',
            'deja_payee': 'DÉJÀ PAYÉE',
            'payee': 'PAYÉE',
            'a_pointer': 'À POINTER',
            'pointee': 'POINTÉE',
            'en_retard': 'EN RETARD',
            'annulee': 'ANNULÉE'
        };
        return statuts[statut] || statut?.toUpperCase() || 'INCONNU';
    }

/**
 * Export comptable avec téléchargement automatique
 * À remplacer directement dans orchestrator.js
 */
exportComptable(facture) {
    try {
        console.log('🔄 Génération export comptable...', facture);
        
        // 1. CRÉER LES ÉCRITURES COMPTABLES
        const ecritures = [];
        const dateFacture = this.formatDateSimple(facture.dateFacture);
        const numeroEcriture = `HA${Date.now()}`;
        
        // Ligne 1 : Charge (HT)
        ecritures.push({
            journal: 'HA',
            date: dateFacture,
            compte: facture.comptabilite?.compteComptable || '6064',
            libelle: `${facture.fournisseur?.nom || 'Fournisseur'} - ${facture.numeroFacture || facture.numeroInterne}`,
            debit: (facture.montantHT || 0).toFixed(2),
            credit: '0.00',
            piece: facture.numeroFacture || facture.numeroInterne,
            tiers: ''
        });
        
        // Ligne 2 : TVA (si applicable)
        if (facture.montantTVA && facture.montantTVA > 0) {
            ecritures.push({
                journal: 'HA',
                date: dateFacture,
                compte: '44566',
                libelle: `TVA ${facture.tauxTVA || 20}% - ${facture.fournisseur?.nom || 'Fournisseur'}`,
                debit: (facture.montantTVA || 0).toFixed(2),
                credit: '0.00',
                piece: facture.numeroFacture || facture.numeroInterne,
                tiers: ''
            });
        }
        
        // Ligne 3 : Fournisseur (TTC)
        const compteFournisseur = facture.fournisseur?.compteFournisseur || 
                                  this.genererCompteFournisseurSimple(facture.fournisseur?.nom);
        
        ecritures.push({
            journal: 'HA',
            date: dateFacture,
            compte: '401',
            libelle: `${facture.fournisseur?.nom || 'Fournisseur'} - ${facture.numeroFacture || facture.numeroInterne}`,
            debit: '0.00',
            credit: (facture.montantTTC || 0).toFixed(2),
            piece: facture.numeroFacture || facture.numeroInterne,
            tiers: compteFournisseur
        });
        
        // 2. GÉNÉRER LE CSV
        const csv = this.genererCSV(ecritures);
        
        // 3. TÉLÉCHARGER LE FICHIER
        this.telechargerCSV(csv, `export_${facture.numeroInterne || 'facture'}_${Date.now()}.csv`);
        
        // 4. AFFICHER UN RÉSUMÉ
        this.afficherResumeExport(ecritures);
        
    } catch (error) {
        console.error('❌ Erreur export comptable:', error);
        this.showError('Erreur lors de l\'export comptable');
    }
}

/**
 * Export comptable de plusieurs factures sélectionnées
 */
exportComptableMultiple() {
    try {
        // Vérifier qu'il y a des factures sélectionnées
        if (!this.selectedFactures || this.selectedFactures.length === 0) {
            this.showWarning('Veuillez sélectionner au moins une facture');
            return;
        }
        
        console.log(`📊 Export comptable de ${this.selectedFactures.length} facture(s)`);
        
        // Collecter toutes les écritures
        const toutesEcritures = [];
        const resume = {
            nbFactures: this.selectedFactures.length,
            totalHT: 0,
            totalTVA: 0,
            totalTTC: 0,
            parFournisseur: {},
            parCompte: {}
        };
        
        // Générer les écritures pour chaque facture
        this.selectedFactures.forEach((facture, index) => {
            const ecritures = this.genererEcrituresComptables(facture, index + 1);
            toutesEcritures.push(...ecritures);
            
            // Statistiques
            resume.totalHT += facture.montantHT || 0;
            resume.totalTVA += facture.montantTVA || 0;
            resume.totalTTC += facture.montantTTC || 0;
            
            // Par fournisseur
            const nomFournisseur = facture.fournisseur?.nom || 'Non défini';
            if (!resume.parFournisseur[nomFournisseur]) {
                resume.parFournisseur[nomFournisseur] = {
                    nombre: 0,
                    montantTTC: 0
                };
            }
            resume.parFournisseur[nomFournisseur].nombre++;
            resume.parFournisseur[nomFournisseur].montantTTC += facture.montantTTC || 0;
            
            // Par compte comptable
            const compte = facture.comptabilite?.compteComptable || '6064';
            if (!resume.parCompte[compte]) {
                resume.parCompte[compte] = {
                    libelle: this.getLibelleCompte(compte),
                    montantHT: 0
                };
            }
            resume.parCompte[compte].montantHT += facture.montantHT || 0;
        });
        
        // Générer le CSV
        const csv = this.genererCSVComptableComplet(toutesEcritures, resume);
        
        // Nom du fichier avec date et heure
        const maintenant = new Date();
        const dateStr = maintenant.toISOString().slice(0, 10).replace(/-/g, '');
        const heureStr = maintenant.toTimeString().slice(0, 5).replace(':', '');
        const nomFichier = `export_comptable_${dateStr}_${heureStr}_${this.selectedFactures.length}factures.csv`;
        
        // Télécharger
        this.telechargerCSV(csv, nomFichier);
        
        // Afficher le résumé
        this.afficherResumeExportMultiple(resume);
        
    } catch (error) {
        console.error('❌ Erreur export comptable multiple:', error);
        this.showError('Erreur lors de l\'export comptable');
    }
}

/**
 * Générer les écritures comptables pour une facture
 */
genererEcrituresComptables(facture, numeroOrdre) {
    const ecritures = [];
    const dateFacture = this.formatDateSimple(facture.dateFacture);
    const numeroEcriture = `HA${new Date().getFullYear()}${String(numeroOrdre).padStart(5, '0')}`;
    
    // Déterminer le compte comptable principal
    const compteCharge = facture.comptabilite?.compteComptable || this.determinerCompteAuto(facture) || '6064';
    
    // LIGNE 1 : Charge HT (ou plusieurs lignes si détail)
    if (facture.lignesDetail && facture.lignesDetail.length > 0) {
        // Ventilation par ligne de détail
        facture.lignesDetail.forEach((ligne, idx) => {
            ecritures.push({
                journal: 'HA',
                date: dateFacture,
                numeroEcriture: numeroEcriture,
                numeroLigne: idx + 1,
                compte: ligne.compteComptable || compteCharge,
                libelle: `${ligne.designation || facture.fournisseur?.nom} - ${facture.numeroFacture || facture.numeroInterne}`,
                debit: (ligne.montantHT || 0).toFixed(2),
                credit: '0.00',
                piece: facture.numeroFacture || facture.numeroInterne,
                tiers: '',
                codeAnalytique: facture.comptabilite?.codeAnalytique || '',
                quantite: ligne.quantite || 1,
                reference: ligne.reference || ''
            });
        });
    } else {
        // Une seule ligne de charge
        ecritures.push({
            journal: 'HA',
            date: dateFacture,
            numeroEcriture: numeroEcriture,
            numeroLigne: 1,
            compte: compteCharge,
            libelle: `${facture.fournisseur?.nom || 'Fournisseur'} - ${facture.numeroFacture || facture.numeroInterne}`,
            debit: (facture.montantHT || 0).toFixed(2),
            credit: '0.00',
            piece: facture.numeroFacture || facture.numeroInterne,
            tiers: '',
            codeAnalytique: facture.comptabilite?.codeAnalytique || '',
            quantite: 1,
            reference: facture.comptabilite?.categorieDetectee || ''
        });
    }
    
    // LIGNE 2 : TVA (si applicable)
    if (facture.tva?.ventilationTVA && facture.tva.ventilationTVA.length > 0) {
        // Ventilation TVA multiple
        facture.tva.ventilationTVA.forEach((ventil, idx) => {
            ecritures.push({
                journal: 'HA',
                date: dateFacture,
                numeroEcriture: numeroEcriture,
                numeroLigne: ecritures.length + 1,
                compte: this.getCompteTVA(ventil.taux),
                libelle: `TVA ${ventil.taux}% - ${facture.fournisseur?.nom}`,
                debit: (ventil.montant || 0).toFixed(2),
                credit: '0.00',
                piece: facture.numeroFacture || facture.numeroInterne,
                tiers: '',
                codeAnalytique: '',
                quantite: 0,
                reference: ''
            });
        });
    } else if (facture.montantTVA && facture.montantTVA > 0) {
        // TVA simple
        const compteTVA = this.determinerCompteTVA(facture);
        ecritures.push({
            journal: 'HA',
            date: dateFacture,
            numeroEcriture: numeroEcriture,
            numeroLigne: ecritures.length + 1,
            compte: compteTVA,
            libelle: `TVA ${facture.tauxTVA || facture.tva?.tauxApplique || 20}% - ${facture.fournisseur?.nom}`,
            debit: (facture.montantTVA || 0).toFixed(2),
            credit: '0.00',
            piece: facture.numeroFacture || facture.numeroInterne,
            tiers: '',
            codeAnalytique: '',
            quantite: 0,
            reference: facture.tva?.regime || 'NATIONAL'
        });
    }
    
    // LIGNE 3 : Fournisseur (TTC)
    const compteFournisseur = facture.fournisseur?.compteFournisseur || 
                              this.genererCompteFournisseurSimple(facture.fournisseur?.nom);
    
    ecritures.push({
        journal: 'HA',
        date: dateFacture,
        numeroEcriture: numeroEcriture,
        numeroLigne: ecritures.length + 1,
        compte: '401',
        libelle: `${facture.fournisseur?.nom || 'Fournisseur'} - ${facture.numeroFacture || facture.numeroInterne}`,
        debit: '0.00',
        credit: (facture.montantTTC || 0).toFixed(2),
        piece: facture.numeroFacture || facture.numeroInterne,
        tiers: compteFournisseur,
        codeAnalytique: '',
        quantite: 0,
        reference: facture.paiement?.modePaiement || ''
    });
    
    return ecritures;
}

/**
 * Générer le CSV comptable complet avec toutes les écritures
 */
genererCSVComptableComplet(ecritures, resume) {
    // En-tête avec métadonnées
    let csv = `EXPORT COMPTABLE - ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}\n`;
    csv += `Nombre de factures;${resume.nbFactures}\n`;
    csv += `Total HT;${resume.totalHT.toFixed(2).replace('.', ',')}\n`;
    csv += `Total TVA;${resume.totalTVA.toFixed(2).replace('.', ',')}\n`;
    csv += `Total TTC;${resume.totalTTC.toFixed(2).replace('.', ',')}\n`;
    csv += `\n`;
    
    // Résumé par fournisseur
    csv += `RESUME PAR FOURNISSEUR\n`;
    csv += `Fournisseur;Nombre;Montant TTC\n`;
    Object.entries(resume.parFournisseur).forEach(([nom, data]) => {
        csv += `${nom};${data.nombre};${data.montantTTC.toFixed(2).replace('.', ',')}\n`;
    });
    csv += `\n`;
    
    // Résumé par compte
    csv += `RESUME PAR COMPTE COMPTABLE\n`;
    csv += `Compte;Libellé;Montant HT\n`;
    Object.entries(resume.parCompte).forEach(([compte, data]) => {
        csv += `${compte};${data.libelle};${data.montantHT.toFixed(2).replace('.', ',')}\n`;
    });
    csv += `\n`;
    
    // Écritures détaillées
    csv += `ECRITURES COMPTABLES DETAILLEES\n`;
    const headers = [
        'Journal', 'Date', 'N°Écriture', 'N°Ligne', 'Compte', 'Tiers',
        'Libellé', 'Débit', 'Crédit', 'Pièce', 'Code Analytique', 
        'Quantité', 'Référence'
    ];
    csv += headers.join(';') + '\n';
    
    // Ajouter toutes les écritures
    ecritures.forEach(e => {
        const ligne = [
            e.journal,
            e.date,
            e.numeroEcriture,
            e.numeroLigne,
            e.compte,
            e.tiers || '',
            e.libelle.replace(/;/g, ','),
            e.debit.replace('.', ','),
            e.credit.replace('.', ','),
            e.piece,
            e.codeAnalytique || '',
            e.quantite || '',
            e.reference || ''
        ];
        csv += ligne.join(';') + '\n';
    });
    
    // Totaux de contrôle
    const totalDebit = ecritures.reduce((sum, e) => sum + parseFloat(e.debit), 0);
    const totalCredit = ecritures.reduce((sum, e) => sum + parseFloat(e.credit), 0);
    csv += `\n`;
    csv += `TOTAUX;;;;;;;${totalDebit.toFixed(2).replace('.', ',')};${totalCredit.toFixed(2).replace('.', ',')}\n`;
    csv += `EQUILIBRE;;;;;;;${Math.abs(totalDebit - totalCredit) < 0.01 ? 'OUI' : 'NON'}\n`;
    
    // Ajouter le BOM UTF-8 pour Excel
    const BOM = '\uFEFF';
    return BOM + csv;
}

/**
 * Afficher le résumé de l'export multiple
 */
afficherResumeExportMultiple(resume) {
    console.log('📊 EXPORT COMPTABLE MULTIPLE');
    console.log('═══════════════════════════════════════');
    console.log(`Nombre de factures : ${resume.nbFactures}`);
    console.log(`Total HT  : ${this.formaterMontant(resume.totalHT)}`);
    console.log(`Total TVA : ${this.formaterMontant(resume.totalTVA)}`);
    console.log(`Total TTC : ${this.formaterMontant(resume.totalTTC)}`);
    console.log('───────────────────────────────────────');
    console.log('PAR FOURNISSEUR:');
    Object.entries(resume.parFournisseur).forEach(([nom, data]) => {
        console.log(`  ${nom}: ${data.nombre} facture(s) = ${this.formaterMontant(data.montantTTC)}`);
    });
    console.log('───────────────────────────────────────');
    console.log('PAR COMPTE COMPTABLE:');
    Object.entries(resume.parCompte).forEach(([compte, data]) => {
        console.log(`  ${compte} ${data.libelle}: ${this.formaterMontant(data.montantHT)}`);
    });
    console.log('═══════════════════════════════════════');
    
    // Message de succès avec détails
    this.showSuccess(`✅ Export comptable de ${resume.nbFactures} facture(s) - Total: ${this.formaterMontant(resume.totalTTC)}`);
}

// 4️⃣ AJOUTER LES FONCTIONS HELPERS (si elles n'existent pas déjà)

/**
 * Déterminer automatiquement le compte comptable
 */
determinerCompteAuto(facture) {
    const nom = (facture.fournisseur?.nom || '').toUpperCase();
    const categorie = facture.fournisseur?.categorie;
    
    // Par catégorie
    const comptesParCategorie = {
        'telecom': '6262',
        'energie': '6061',
        'informatique': '6183',
        'fournitures': '6064',
        'eau': '6061',
        'carburant': '6221',
        'assurance': '616',
        'honoraires': '6226',
        'transport': '6241'
    };
    
    if (categorie && comptesParCategorie[categorie]) {
        return comptesParCategorie[categorie];
    }
    
    // Par nom de fournisseur
    if (nom.includes('FREE') || nom.includes('ORANGE') || nom.includes('SFR')) return '6262';
    if (nom.includes('EDF') || nom.includes('ENGIE')) return '6061';
    if (nom.includes('MICROSOFT') || nom.includes('ADOBE')) return '6265';
    
    return '6064'; // Par défaut
}

/**
 * Déterminer le compte TVA
 */
determinerCompteTVA(facture) {
    // TVA intracommunautaire
    if (facture.tva?.regime === 'INTRACOMMUNAUTAIRE') {
        return '445662';
    }
    
    // TVA autoliquidée
    if (facture.tva?.autoliquidation) {
        return '445663';
    }
    
    // TVA standard
    return '44566';
}

/**
 * Obtenir le compte TVA par taux
 */
getCompteTVA(taux) {
    // Tous les taux utilisent le même compte en France
    return '44566';
}

/**
 * Obtenir le libellé d'un compte
 */
getLibelleCompte(compte) {
    const comptes = {
        '401': 'Fournisseurs',
        '44566': 'TVA déductible',
        '445662': 'TVA intracommunautaire',
        '445663': 'TVA autoliquidée',
        '6061': 'Fournitures non stockables',
        '6064': 'Fournitures administratives',
        '616': 'Primes d\'assurances',
        '6183': 'Documentation technique',
        '6221': 'Carburants',
        '6226': 'Honoraires',
        '6241': 'Transports sur achats',
        '6262': 'Télécommunications',
        '6265': 'Logiciels',
        '627': 'Services bancaires',
        '2183': 'Matériel informatique'
    };
    
    return comptes[compte] || comptes[compte.substring(0, 4)] || comptes[compte.substring(0, 3)] || 'Compte non défini';
}

/**
 * Générer le CSV
 */
genererCSV(ecritures) {
    // En-têtes
    const headers = ['Journal', 'Date', 'Compte', 'Tiers', 'Libellé', 'Débit', 'Crédit', 'Pièce'];
    
    // Créer le CSV avec point-virgule comme séparateur (standard français)
    let csv = headers.join(';') + '\n';
    
    // Ajouter les lignes
    ecritures.forEach(e => {
        const ligne = [
            e.journal,
            e.date,
            e.compte,
            e.tiers || '',
            e.libelle.replace(/;/g, ','), // Nettoyer les point-virgules
            e.debit.replace('.', ','),    // Format français pour les nombres
            e.credit.replace('.', ','),
            e.piece
        ];
        csv += ligne.join(';') + '\n';
    });
    
    // Ajouter le BOM UTF-8 pour Excel
    const BOM = '\uFEFF';
    return BOM + csv;
}

/**
 * Télécharger le CSV
 */
telechargerCSV(contenu, nomFichier) {
    try {
        // Créer un Blob avec le bon encodage
        const blob = new Blob([contenu], { 
            type: 'text/csv;charset=utf-8;' 
        });
        
        // Créer l'URL temporaire
        const url = window.URL.createObjectURL(blob);
        
        // Créer le lien de téléchargement
        const link = document.createElement('a');
        link.href = url;
        link.download = nomFichier;
        link.style.display = 'none';
        
        // Ajouter au DOM, cliquer, et retirer
        document.body.appendChild(link);
        link.click();
        
        // Nettoyer
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
        
        console.log('✅ Fichier téléchargé:', nomFichier);
        this.showSuccess(`📊 Export téléchargé : ${nomFichier}`);
        
    } catch (error) {
        console.error('❌ Erreur téléchargement:', error);
        this.showError('Impossible de télécharger le fichier');
    }
}

/**
 * Afficher un résumé dans la console
 */
afficherResumeExport(ecritures) {
    console.log('📊 EXPORT COMPTABLE GÉNÉRÉ');
    console.log('═══════════════════════════');
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    ecritures.forEach(e => {
        console.log(`${e.compte} | ${e.libelle}`);
        console.log(`  Débit: ${e.debit} | Crédit: ${e.credit}`);
        totalDebit += parseFloat(e.debit);
        totalCredit += parseFloat(e.credit);
    });
    
    console.log('───────────────────────────');
    console.log(`TOTAUX: Débit ${totalDebit.toFixed(2)} | Crédit ${totalCredit.toFixed(2)}`);
    console.log(`Équilibré: ${Math.abs(totalDebit - totalCredit) < 0.01 ? '✅ OUI' : '❌ NON'}`);
    console.log('═══════════════════════════');
}

/**
 * Helpers
 */
formatDateSimple(date) {
    if (!date) return new Date().toISOString().split('T')[0];
    
    let d;
    if (date.toDate) {
        d = date.toDate();
    } else if (date instanceof Date) {
        d = date;
    } else {
        d = new Date(date);
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${day}/${month}/${year}`;
}

genererCompteFournisseurSimple(nomFournisseur) {
    if (!nomFournisseur) return '401000';
    
    // Prendre les 3 premières lettres en majuscules
    const code = nomFournisseur
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 3)
        .padEnd(3, 'X');
    
    return `401${code}`;
}
    
    // ========================================
    // FILTRAGE ET MISE À JOUR
    // ========================================
    
    /**
     * Appliquer les filtres
     */
    applyFilters() {
        console.log('🔍 Application des filtres:', this.currentFilters);
        
        this.filteredData = this.facturesData.filter(facture => {
            // FILTRE RECHERCHE GLOBALE - CHERCHE DANS TOUTES LES COLONNES
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                
                // Formatter la date pour la recherche
                const dateStr = facture.dateFacture ? 
                    new Date(facture.dateFacture.toDate ? facture.dateFacture.toDate() : facture.dateFacture)
                        .toLocaleDateString('fr-FR') : '';
                
                // Formatter le montant pour la recherche
                const montantStr = Math.abs(facture.montantTTC || 0).toString();
                const montantFormate = this.formaterMontant(facture.montantTTC).toLowerCase();
                
                // Type de dépense (compte comptable)
                const typeDepense = facture.comptabilite?.compteComptable || '';
                const libelleCompte = facture.comptabilite?.libelleCompte || '';
                const categorieDetectee = facture.comptabilite?.categorieDetectee || '';
                
                // Chercher dans TOUTES les colonnes
                const searchIn = [
                    dateStr,                                        // Date facture
                    (facture.numeroFacture || '').toLowerCase(),    // N° Facture
                    (facture.numeroInterne || '').toLowerCase(),    // N° Interne
                    (facture.codeMagasin || '').toLowerCase(),      // Magasin
                    (facture.fournisseur?.nom || '').toLowerCase(), // Fournisseur
                    (facture.fournisseur?.categorie || '').toLowerCase(), // Catégorie fournisseur
                    typeDepense.toLowerCase(),                      // Compte comptable
                    libelleCompte.toLowerCase(),                    // Libellé compte
                    categorieDetectee.toLowerCase(),                // Catégorie détectée
                    montantStr,                                     // Montant (nombre)
                    montantFormate,                                 // Montant (formaté)
                    (facture.statut || '').toLowerCase(),           // Statut
                    (facture.referenceVirement || '').toLowerCase(), // Référence virement
                    (facture.modePaiement || '').toLowerCase(),     // Mode paiement
                    (facture.societe || '').toLowerCase()           // Société
                ].join(' ');
                
                if (!searchIn.includes(search)) {
                    return false;
                }
            }
            
            // Filtre statuts (multiple) avec gestion des statuts groupés
            if (this.currentFilters.statuts && this.currentFilters.statuts.length > 0) {
                let match = false;
                
                for (const filterStatut of this.currentFilters.statuts) {
                    // Mapping des statuts groupés
                    if (filterStatut === 'payee') {
                        // "Payée" inclut payee ET deja_payee
                        if (facture.statut === 'payee' || facture.statut === 'deja_payee') {
                            match = true;
                            break;
                        }
                    } else if (filterStatut === 'en_retard') {
                        // "En retard" peut être un statut OU un flag
                        if (facture.statut === 'en_retard' || facture.enRetard === true) {
                            match = true;
                            break;
                        }
                    } else {
                        // Autres statuts : comparaison directe
                        if (facture.statut === filterStatut) {
                            match = true;
                            break;
                        }
                    }
                }
                
                if (!match) {
                    return false;
                }
            }
            
            // Filtre fournisseur
            if (this.currentFilters.fournisseur && facture.fournisseur?.nom !== this.currentFilters.fournisseur) {
                return false;
            }
            
            // Filtre compte comptable (type de dépense)
            if (this.currentFilters.compteComptable && facture.comptabilite?.compteComptable !== this.currentFilters.compteComptable) {
                return false;
            }
            
            // Filtre magasin
            if (this.currentFilters.magasin && facture.codeMagasin !== this.currentFilters.magasin) {
                return false;
            }
            
            // Filtre période
            if (this.currentFilters.periode !== 'all' && facture.dateFacture) {
                const date = facture.dateFacture.toDate ? facture.dateFacture.toDate() : new Date(facture.dateFacture);
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
        
        // Mettre à jour le grid
        if (this.grid) {
            this.grid.setData(this.filteredData);
            console.log(`✅ ${this.filteredData.length} factures affichées`);
        }
    }
    
    /**
     * Mettre à jour les statistiques
     */
    updateStats() {
        if (!this.stats || !this.statsData) return;
        
        // Préparer les données pour les cartes
        const cardsData = {
            nouvelle: this.statsData.parStatut?.nouvelle || 0,
            a_payer: this.statsData.parStatut?.a_payer || 0,
            en_retard: this.statsData.nombreEnRetard || 0,
            payee: (this.statsData.parStatut?.payee || 0) + (this.statsData.parStatut?.deja_payee || 0),
            pointee: this.statsData.parStatut?.pointee || 0,
            total: this.formaterMontant(this.statsData.montantAPayer || 0)
        };
        
        this.stats.updateAll(cardsData);
        console.log('📊 Stats mises à jour:', cardsData);
    }
    
    // ========================================
    // FORMATTERS
    // ========================================
    
    /**
     * Formater un montant
     */
    formaterMontant(montant) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(montant);
    }
    
    /**
     * Formater une date
     */
    formatDate(timestamp) {
        if (!timestamp) return '';
        try {
            let d;
            
            // Si c'est un Timestamp Firestore
            if (timestamp.seconds !== undefined) {
                d = new Date(timestamp.seconds * 1000);
            }
            // Si c'est déjà une Date
            else if (timestamp instanceof Date) {
                d = timestamp;
            }
            // Si c'est une string ou number
            else {
                d = new Date(timestamp);
            }
            
            // Vérifier que la date est valide
            if (isNaN(d.getTime())) return '';
            
            // Formater
            return d.toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
            }).replace(',', ' à');
            
        } catch (error) {
            console.error('Erreur formatDate:', error);
            return '';
        }
    }
    
    // ========================================
    // UI HELPERS
    // ========================================
    
    showLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.remove('hidden');
    }
    
    hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('hidden');
    }
    
    showMessage(message, type = 'info') {
        toast.info(message);
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
        console.log('🚧', message);
    }

    showInfo(message) {
        toast.info(message);
        console.log('ℹ️', message);
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const orchestrator = new FactureOrchestrator();
export default orchestrator;

/* ========================================
   HISTORIQUE
   
   [09/02/2025] - Création
   - Fusion de main.js, list.js, create.js, detail.js
   - Utilisation directe des widgets (pas de config)
   - Architecture identique à decompte-mutuelle
   - Adaptation pour factures fournisseurs
   ======================================== */