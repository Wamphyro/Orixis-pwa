// ========================================
// OPERATIONS-BANCAIRES.ORCHESTRATOR.JS - 🎯 ORCHESTRATEUR PRINCIPAL
// Chemin: modules/operations-bancaires/operations-bancaires.orchestrator.js
//
// DESCRIPTION:
// Orchestrateur unique pour opérations bancaires
// Basé sur l'architecture des décomptes sécu
// Gère l'import CSV, catégorisation auto, pointage et rapprochement
//
// VERSION: 2.0.0
// DATE: 03/02/2025
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
import uploadService from './operations-bancaires.upload.service.js';
import firestoreService from './operations-bancaires.firestore.service.js';

// Import Firebase
import { initFirebase } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    TYPES: {
        CREDIT: 'credit',
        DEBIT: 'debit'
    },
    
    CATEGORIES: {
        salaires: { label: 'Salaires', icon: '💰', couleur: '#d1e7dd' },
        remboursement_secu: { label: 'Remb. Sécu', icon: '🏥', couleur: '#cfe2ff' },
        remboursement_mutuelle: { label: 'Remb. Mutuelle', icon: '💊', couleur: '#e7f1ff' },
        impots: { label: 'Impôts', icon: '🏛️', couleur: '#f8d7da' },
        energie: { label: 'Énergie', icon: '⚡', couleur: '#fff3cd' },
        telecom: { label: 'Télécom', icon: '📱', couleur: '#e9ecef' },
        assurances: { label: 'Assurances', icon: '🛡️', couleur: '#f5e6ff' },
        alimentation: { label: 'Alimentation', icon: '🛒', couleur: '#ffe6e6' },
        carburant: { label: 'Carburant', icon: '⛽', couleur: '#fff0e6' },
        restaurant: { label: 'Restaurant', icon: '🍴', couleur: '#ffe6f0' },
        ecommerce: { label: 'E-commerce', icon: '🛍️', couleur: '#e6f0ff' },
        credit_immobilier: { label: 'Crédit immo', icon: '🏠', couleur: '#ffe6e6' },
        loyer: { label: 'Loyer', icon: '🏘️', couleur: '#f0e6ff' },
        sante: { label: 'Santé', icon: '⚕️', couleur: '#e6fff0' },
        retrait_especes: { label: 'Retrait', icon: '💵', couleur: '#f0f0f0' },
        virement: { label: 'Virement', icon: '↔️', couleur: '#e6e6ff' },
        cheque: { label: 'Chèque', icon: '📄', couleur: '#f0f0e6' },
        frais_bancaires: { label: 'Frais', icon: '🏦', couleur: '#ffe6e6' },
        abonnements: { label: 'Abonnements', icon: '📺', couleur: '#e6ffe6' },
        epargne: { label: 'Épargne', icon: '💎', couleur: '#e0f2fe' },
        autre: { label: 'Autre', icon: '📌', couleur: '#f8f9fa' }
    }
};

// ========================================
// CLASSE ORCHESTRATEUR
// ========================================

class OperationsBancairesOrchestrator {
    constructor() {
        // Widgets
        this.header = null;
        this.stats = null;
        this.filters = null;
        this.grid = null;
        
        // Données
        this.operationsData = [];
        this.statsData = {};
        this.filteredData = [];
        
        // État des filtres
        this.currentFilters = {
            search: '',
            type: '',
            categorie: '',
            magasin: '',  // ⚡ CHANGÉ de 'compte' à 'magasin'
            periode: 'all',
            pointees: null
        };
        
        // Sélection multiple
        this.selection = new Set();
        
        // Listes dynamiques
        this.magasinsDynamiques = new Set();  // ⚡ CHANGÉ de 'comptesDynamiques' à 'magasinsDynamiques'
        this.categoriesDynamiques = new Set();
        
        // Comptes et catégories dynamiques
        this.comptesDynamiques = new Set();
        this.categoriesDynamiques = new Set();
        
        // État de l'application
        this.isLoading = false;
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init() {
        try {
            this.showLoader();
            console.log('🚀 Initialisation orchestrateur opérations bancaires...');
            
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
    
    checkAuth() {
        const auth = localStorage.getItem('sav_auth');
        return !!auth;
    }
    
    // ========================================
    // CRÉATION DES WIDGETS
    // ========================================
    
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
        title: 'Opérations Bancaires',
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
        searchPlaceholder: 'Rechercher référence, libellé, montant...',
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
                id: 'import',
                title: 'Importer CSV',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>',
                onClick: () => this.openImportModal()
            },
            {
                id: 'export',
                title: 'Export Excel',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>',
                onClick: () => this.grid?.export('excel')
            },
            {
                id: 'stats',
                title: 'Statistiques',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
                onClick: () => this.showStatistiques()
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
            { text: 'Finance', url: '#' },
            { text: 'Opérations Bancaires' }
        ],
        
        // UTILISATEUR
        showUser: true,
        showUserDropdown: true,
        showMagasin: true,
        showLogout: true
    });
    
    // Mettre à jour le compteur et le solde après chargement
    this.updateHeaderIndicators = () => {
        if (this.header && this.operationsData) {
            // Nombre d'opérations
            this.header.updateIndicator('count', `${this.operationsData.length} opérations`);
            
            // Calcul du solde
            const solde = this.operationsData.reduce((sum, op) => {
                const montant = parseFloat(op.montant) || 0;
                return op.type === 'credit' ? sum + montant : sum - montant;
            }, 0);
            
            const soldeFormat = new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
            }).format(solde);
            
            this.header.updateIndicator('balance', `Solde: ${soldeFormat}`, 
                solde >= 0 ? 'success' : 'danger');
        }
    };
}
    
    createStatsCards() {
        this.stats = new StatsCardsWidget({
            container: '.stats-container',
            showWrapper: true,
            wrapperStyle: 'card',
            size: 'md',
            selectionMode: 'multiple',
            animated: true,
            cards: [
                { id: 'credits', label: 'Crédits', icon: '➕', value: 0, color: 'success' },
                { id: 'debits', label: 'Débits', icon: '➖', value: 0, color: 'danger' },
                { id: 'pointees', label: 'Pointées', icon: '✓', value: 'info' },
                { id: 'non_pointees', label: 'Non pointées', icon: '✗', value: 0, color: 'warning' },
            ],
            onSelect: (selectedIds) => {
                console.log('Filtres par cartes:', selectedIds);
                this.currentFilters = {
                    ...this.currentFilters,
                    cartesActives: selectedIds
                };
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
            resetButton: false,
            filters: [
                { 
                    type: 'select', 
                    key: 'categorie', 
                    label: 'Catégorie',
                    options: [
                        { value: '', label: 'Toutes catégories' }
                    ],
                    searchable: true
                },
                { 
                    type: 'select', 
                    key: 'magasin',  // ⚡ CHANGÉ de 'compte' à 'magasin'
                    label: 'Magasin',   // ⚡ CHANGÉ de 'Compte' à 'Magasin'
                    options: [
                        { value: '', label: 'Tous les magasins' }  // ⚡ CHANGÉ
                    ]
                },
                { 
                    type: 'select', 
                    key: 'periode', 
                    label: 'Période',
                    options: [
                        { value: 'all', label: 'Toutes' },
                        { value: 'today', label: "Aujourd'hui" },
                        { value: 'week', label: '7 derniers jours' },
                        { value: 'month', label: '30 derniers jours' },
                        { value: 'year', label: 'Cette année' }
                    ]
                }
            ],
            onFilter: (values) => {
                console.log('Filtres appliqués:', values);
                
                this.currentFilters = { 
                    ...this.currentFilters, 
                    categorie: values.categorie || '',
                    magasin: values.magasin || '',  // ⚡ CHANGÉ de 'compte' à 'magasin'
                    periode: values.periode || 'all'
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
        wrapperTitle: '',
        columns: [
            {
                key: 'selection',
                label: '<input type="checkbox" id="selectAll">',
                width: 40,
                formatter: (_, row) => {
                    const checked = this.selection.has(row.id);
                    return `<input type="checkbox" class="operation-checkbox" data-id="${row.id}" ${checked ? 'checked' : ''}>`;
                }
            },
            { 
                key: 'date', 
                label: 'Date',
                sortable: true,
                width: 100,
                formatter: (date) => {
                    if (!date) return '-';
                    const d = new Date(date);
                    return d.toLocaleDateString('fr-FR');
                }
            },
            { 
                key: 'libelle', 
                label: 'Libellé',
                sortable: true,
                width: 350,
                formatter: (v) => v || '-'
            },
            { 
                key: 'categorie', 
                label: 'Cat.',
                width: 60,
                html: true,
                formatter: (cat) => {
                    const config = CONFIG.CATEGORIES[cat] || CONFIG.CATEGORIES.autre;
                    return `<span class="categorie-icon" data-tooltip="${config.label}" style="font-size: 20px;">${config.icon}</span>`;
                }
            },
            { 
                key: 'montant', 
                label: 'Montant',
                sortable: true,
                width: 120,
                formatter: (v) => {
                    const classe = v >= 0 ? 'montant-credit' : 'montant-debit';
                    const signe = v >= 0 ? '+' : '';
                    return `<span class="${classe}">${signe}${this.formaterMontant(v)}</span>`;
                }
            },
            { 
                key: 'compte', 
                label: 'Compte',
                width: 100,
                formatter: (v) => v ? `•••${v.slice(-4)}` : '-'
            },
            { 
                key: 'codeMagasin',
                label: 'Magasin',
                sortable: true,
                width: 80,
                formatter: (v) => v || '-'
            },
            { 
                key: 'pointee',
                label: 'Statut',
                sortable: true,
                width: 80,
                html: true,
                formatter: (v) => {
                    if (v) {
                        return '<span class="badge badge-success">✓ Pointée</span>';
                    } else {
                        return '<span class="badge badge-warning">En attente</span>';
                    }
                }
            },
            { 
                type: 'actions',
                label: 'Actions',
                width: 80,
                actions: [
                    { 
                        type: 'view',
                        title: 'Voir détails',
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
            pagination: true,
            resize: false
        },
        pagination: {
            itemsPerPage: 50,
            pageSizeOptions: [20, 50, 100, 200],
            showPageInfo: true
        }
    });
    
    // Gérer le select all
    setTimeout(() => {
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.filteredData.forEach(op => this.selection.add(op.id));
                } else {
                    this.selection.clear();
                }
                this.updateGrid();
                this.updateSelectionInfo();
            });
        }
        
        // Gérer les checkboxes individuelles
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('operation-checkbox')) {
                const id = e.target.dataset.id;
                if (e.target.checked) {
                    this.selection.add(id);
                } else {
                    this.selection.delete(id);
                }
                this.updateSelectionInfo();
            }
        });
    }, 100);
}
    
    // ========================================
    // CHARGEMENT DES DONNÉES
    // ========================================
    
    async loadData() {
        try {
            this.showLoader();
            console.log('📊 Chargement des données...');
            
            // Charger les opérations
            const operations = await firestoreService.getOperations({ limite: 500 });
            
            this.operationsData = operations;
            console.log(`✅ ${this.operationsData.length} opérations chargées`);
            
            // Charger les stats
            this.statsData = await firestoreService.getStatistiques();
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
    
    updateDynamicLists() {
        this.magasinsDynamiques.clear();  // ⚡ CHANGÉ
        this.categoriesDynamiques.clear();
        
        this.operationsData.forEach(op => {
            if (op.codeMagasin) this.magasinsDynamiques.add(op.codeMagasin);  // ⚡ CHANGÉ
            if (op.categorie) this.categoriesDynamiques.add(op.categorie);
        });
        
        console.log('📊 Magasins détectés:', Array.from(this.magasinsDynamiques));  // ⚡ CHANGÉ
        console.log('📊 Catégories détectées:', Array.from(this.categoriesDynamiques));
    }
    
    updateFilterOptions() {
        // Créer les options de catégories
        const categorieOptions = [{ value: '', label: 'Toutes catégories' }];
        this.categoriesDynamiques.forEach(cat => {
            const config = CONFIG.CATEGORIES[cat];
            if (config) {
                categorieOptions.push({
                    value: cat,
                    label: `${config.icon} ${config.label}`
                });
            }
        });
        
        // Créer les options de magasins
        const magasinOptions = [{ value: '', label: 'Tous les magasins' }];
        this.magasinsDynamiques.forEach(magasin => {
            magasinOptions.push({
                value: magasin,
                label: magasin === '-' ? 'Non défini' : magasin
            });
        });
        
        console.log('📋 Options catégories:', categorieOptions.length - 1);
        console.log('📋 Options magasins:', magasinOptions.length - 1);
        
        // Mettre à jour les dropdowns dynamiquement (même méthode que factures-fournisseurs)
        if (this.filters && this.filters.state && this.filters.state.dropdowns) {
            // Mettre à jour le dropdown catégorie
            if (this.filters.state.dropdowns.categorie) {
                const categorieDropdown = this.filters.state.dropdowns.categorie;
                categorieDropdown.config.options = categorieOptions;
                categorieDropdown.filteredOptions = [...categorieOptions];
                this.filters.renderDropdownOptions(categorieDropdown);
            }
            
            // Mettre à jour le dropdown magasin
            if (this.filters.state.dropdowns.magasin) {
                const magasinDropdown = this.filters.state.dropdowns.magasin;
                magasinDropdown.config.options = magasinOptions;
                magasinDropdown.filteredOptions = [...magasinOptions];
                this.filters.renderDropdownOptions(magasinDropdown);
            }
        }
    }
    
    // ========================================
    // IMPORT CSV
    // ========================================
    
    openImportModal() {
        const uploader = new PdfUploaderWidget({
            title: 'Import de relevés bancaires',
            theme: 'blue',
            mode: 'simple',
            maxFiles: 10,
            acceptedTypes: ['text/csv', 'application/vnd.ms-excel'],
            description: {
                icon: '📊',
                title: 'Import multi-fichiers intelligent',
                text: 'Déposez jusqu\'à 10 fichiers CSV. Analyse automatique du format bancaire, détection des doublons et catégorisation intelligente.'
            },
            saveButtonText: '📥 Importer les opérations',
            onSave: async (data) => this.handleImport(data),
            onClose: () => {
                console.log('Modal import fermée');
            }
        });
    }
    
async handleImport(data) {
    try {
        console.log('📁 Import de', data.files.length, 'fichier(s)...');
        this.showLoader();
        
        const resultats = {
            importees: [],
            doublons: [],
            erreurs: []
        };
        
        // Traiter chaque fichier
        for (let i = 0; i < data.files.length; i++) {
            const file = data.files[i];
            
            try {
                console.log(`\n📄 Traitement fichier ${i + 1}/${data.files.length}: ${file.name}`);
                
                // Analyser le CSV
                this.showMessage(`Analyse du fichier ${i + 1}/${data.files.length}...`);
                const resultatAnalyse = await uploadService.analyserCSV(file);
                
                console.log('✅ Fichier analysé:', resultatAnalyse.stats);
                console.log('🔍 Numéro ACM:', resultatAnalyse.numeroACM);
                
                // Importer les opérations avec le numéro ACM
                this.showMessage(`Import des opérations ${i + 1}/${data.files.length}...`);
                const resultatImport = await firestoreService.importerOperations(
                    resultatAnalyse.operations,
                    file.name  // ⚡ PASSER LE NOM DU FICHIER
                );
                                
                resultats.importees.push({
                    fichier: file.name,
                    nombre: resultatImport.reussies
                });
                
                if (resultatImport.doublons > 0) {
                    resultats.doublons.push({
                        fichier: file.name,
                        nombre: resultatImport.doublons
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
        
        // Afficher le résumé
        console.log('📊 Résumé de l\'import:', resultats);
        
        const totalImportees = resultats.importees.reduce((sum, r) => sum + r.nombre, 0);
        const totalDoublons = resultats.doublons.reduce((sum, r) => sum + r.nombre, 0);
        
        if (totalImportees > 0) {
            this.showSuccess(`✅ ${totalImportees} opération(s) importée(s)`);
        }
        
        if (totalDoublons > 0) {
            this.showWarning(`⚠️ ${totalDoublons} doublon(s) ignoré(s)`);
        }
        
        if (resultats.erreurs.length > 0) {
            resultats.erreurs.forEach(err => {
                this.showError(`❌ ${err.fichier}: ${err.erreur}`);
            });
        }
        
        // Rafraîchir les données
        await this.loadData();
        
        this.hideLoader();
        
        return totalImportees > 0;
        
    } catch (error) {
        this.hideLoader();
        this.showError('Erreur import : ' + error.message);
        console.error('Erreur complète:', error);
        throw error;
    }
}
    
    // ========================================
    // ACTIONS SUR SÉLECTION
    // ========================================
    
    async categoriserSelection() {
        if (this.selection.size === 0) {
            this.showWarning('Veuillez sélectionner au moins une opération');
            return;
        }
        
        // TODO: Dialog pour choisir la catégorie
        this.showInfo('Fonctionnalité en cours de développement');
    }
    
    async pointerSelection() {
        if (this.selection.size === 0) {
            this.showWarning('Veuillez sélectionner au moins une opération');
            return;
        }
        
        try {
            let count = 0;
            for (const id of this.selection) {
                await firestoreService.pointerOperation(id, true);
                count++;
            }
            
            this.showSuccess(`✅ ${count} opération(s) pointée(s)`);
            this.selection.clear();
            await this.loadData();
            
        } catch (error) {
            this.showError('Erreur lors du pointage : ' + error.message);
        }
    }
    
    async togglePointer(operationId) {
        try {
            const operation = this.operationsData.find(op => op.id === operationId);
            if (!operation) return;
            
            await firestoreService.pointerOperation(operationId, !operation.pointee);
            
            // Mettre à jour localement
            operation.pointee = !operation.pointee;
            this.updateGrid();
            this.updateStats();
            
            this.showSuccess(operation.pointee ? 'Opération pointée' : 'Opération dépointée');
            
        } catch (error) {
            this.showError('Erreur : ' + error.message);
        }
    }
    
    updateSelectionInfo() {
        // TODO: Afficher le nombre d'éléments sélectionnés
        console.log(`Sélection: ${this.selection.size} opération(s)`);
    }
    
    // ========================================
    // AFFICHAGE DÉTAIL
    // ========================================
    
    /**
     * Afficher les statistiques détaillées
     */
    showStatistiques() {
        // TODO: Ouvrir une modal avec des statistiques détaillées
        this.showInfo('Statistiques détaillées - Fonctionnalité en développement');
    }
    
    /**
     * Réinitialiser tous les filtres
     */
    resetAllFilters() {
        console.log('🔄 Réinitialisation de tous les filtres');
        
        // Réinitialiser les filtres
        this.currentFilters = {
            search: '',
            type: '',
            categorie: '',
            magasin: '',  // ⚡ CHANGÉ de 'compte' à 'magasin'
            periode: 'all',
            pointees: null,
            cartesActives: []
        };
        
        // Désélectionner toutes les cartes stats
        if (this.stats) {
            this.stats.deselectAll();
        }
        
        // Réinitialiser les valeurs dans le widget de filtres
        if (this.filters) {
            this.filters.reset();
        }
        
        // Appliquer les filtres réinitialisés
        this.applyFilters();
        
        this.showInfo('Filtres réinitialisés');
    }

    openDetailModal(row) {
        const formatMontant = (m) => new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(m || 0);
        
        const formatDate = (date) => {
            if (!date) return '-';
            const d = new Date(date);
            return d.toLocaleDateString('fr-FR');
        };
        
        // Sections
        const sections = [];
        
        // Section 1 : Informations générales
        sections.push({
            id: 'general',
            title: '📊 Informations générales',
            fields: [
                { label: 'Date opération', value: formatDate(row.date) },
                { label: 'Date valeur', value: formatDate(row.dateValeur || row.date) },
                { label: 'Libellé', value: row.libelle, bold: true },
                { label: 'Référence', value: row.reference || '-' }
            ]
        });
        
        // Section 2 : Montant et catégorie
        const categorie = CONFIG.CATEGORIES[row.categorie] || CONFIG.CATEGORIES.autre;
        sections.push({
            id: 'montant',
            title: '💰 Montant et catégorie',
            fields: [
                { 
                    label: 'Montant', 
                    value: formatMontant(row.montant),
                    bold: true,
                    html: true,
                    formatter: () => {
                        const color = row.montant >= 0 ? '#28a745' : '#dc3545';
                        const signe = row.montant >= 0 ? '+' : '';
                        return `<span style="color: ${color}; font-size: 24px; font-weight: bold;">
                            ${signe}${formatMontant(row.montant)}
                        </span>`;
                    }
                },
                { 
                    label: 'Type', 
                    value: row.montant >= 0 ? 'Crédit' : 'Débit'
                },
                { 
                    label: 'Catégorie', 
                    value: `${categorie.icon} ${categorie.label}`
                },
                { 
                    label: 'Pointée', 
                    value: row.pointee ? '✓ Oui' : '✗ Non'
                }
            ]
        });
        
        // Section 3 : Compte
        sections.push({
            id: 'compte',
            title: '🏦 Compte bancaire',
            fields: [
                { label: 'Numéro', value: row.compte ? `•••${row.compte.slice(-4)}` : '-' },
                { label: 'Banque', value: row.banque || 'Non définie' },
                { label: 'Solde après', value: row.solde ? formatMontant(row.solde) : '-' }
            ]
        });
        
        // Créer le viewer
        const viewer = new DetailViewerWidget({
            title: `Opération du ${formatDate(row.date)}`,
            subtitle: row.libelle,
            data: row,
            sections: sections,
            actions: [
                {
                    label: row.pointee ? '✗ Dépointer' : '✓ Pointer',
                    class: 'btn btn-glass-green btn-lg',
                    onClick: async (data) => {
                        await this.togglePointer(data.id);
                        viewer.close();
                        return true;
                    }
                },
                {
                    label: '🏷️ Changer catégorie',
                    class: 'btn btn-glass-purple btn-lg',
                    onClick: async (data) => {
                        // TODO: Dialog pour changer la catégorie
                        this.showInfo('Fonctionnalité en cours');
                        return false;
                    }
                },
                {
                    label: '🗑️ Supprimer',
                    class: 'btn btn-glass-red btn-lg',
                    onClick: async (data) => {
                        if (!confirm(`Supprimer l'opération ?`)) {
                            return false;
                        }
                        
                        try {
                            await firestoreService.supprimerOperation(data.id);
                            this.showSuccess('Opération supprimée');
                            await this.loadData();
                            viewer.close();
                            return true;
                        } catch (error) {
                            this.showError('Erreur: ' + error.message);
                            return false;
                        }
                    }
                }
            ],
            size: 'large',
            theme: 'default'
        });
    }
    
    // ========================================
    // FILTRAGE ET MISE À JOUR
    // ========================================
    
    applyFilters() {
        console.log('🔍 Application des filtres:', this.currentFilters);
        
        this.filteredData = this.operationsData.filter(operation => {
            // Filtre recherche - CHERCHE DANS TOUTES LES COLONNES
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                
                // Formatter la date pour la recherche
                const dateStr = operation.date ? new Date(operation.date).toLocaleDateString('fr-FR') : '';
                
                // Récupérer le label de la catégorie
                const categConfig = CONFIG.CATEGORIES[operation.categorie] || CONFIG.CATEGORIES.autre;
                const categorieLabel = categConfig.label.toLowerCase();
                
                // Formatter le montant pour la recherche
                const montantStr = Math.abs(operation.montant || 0).toString();
                const montantFormate = this.formaterMontant(operation.montant).toLowerCase();
                
                // Statut pointée
                const statut = operation.pointee ? 'pointée' : 'en attente';
                
                // Chercher dans TOUTES les colonnes
                const searchIn = [
                    dateStr,                                    // Date
                    (operation.libelle || '').toLowerCase(),    // Libellé
                    (operation.reference || '').toLowerCase(),  // Référence
                    categorieLabel,                             // Catégorie (label)
                    operation.categorie || '',                  // Catégorie (clé)
                    montantStr,                                 // Montant (nombre)
                    montantFormate,                             // Montant (formaté)
                    operation.compte || '',                     // Compte
                    (operation.codeMagasin || '').toLowerCase(), // Magasin
                    statut,                                      // Statut
                    operation.banque || ''                      // Banque
                ].join(' ');
                
                if (!searchIn.includes(search)) {
                    return false;
                }
            }
            
            // ⚡ FILTRE CATÉGORIE - AJOUTÉ
            if (this.currentFilters.categorie && operation.categorie !== this.currentFilters.categorie) {
                return false;
            }
            
            // ⚡ FILTRE MAGASIN
            if (this.currentFilters.magasin && operation.codeMagasin !== this.currentFilters.magasin) {
                return false;
            }
            
            // ⚡ FILTRE COMPTE SUPPRIMÉ - Cette section a été retirée
            
            // Filtre cartes actives
            if (this.currentFilters.cartesActives && this.currentFilters.cartesActives.length > 0) {
                let matchCarte = false;
                
                for (const carte of this.currentFilters.cartesActives) {
                    switch (carte) {
                        case 'credits':
                            if (operation.montant >= 0) matchCarte = true;
                            break;
                        case 'debits':
                            if (operation.montant < 0) matchCarte = true;
                            break;
                        case 'pointees':
                            if (operation.pointee) matchCarte = true;
                            break;
                        case 'non_pointees':
                            if (!operation.pointee) matchCarte = true;
                            break;
                    }
                }
                
                if (!matchCarte) return false;
            }
            
            // Filtre période
            if (this.currentFilters.periode !== 'all' && operation.date) {
                const date = new Date(operation.date);
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
                        monthAgo.setDate(monthAgo.getDate() - 30);
                        if (date < monthAgo) return false;
                        break;
                    case 'year':
                        const yearStart = new Date(now.getFullYear(), 0, 1);
                        if (date < yearStart) return false;
                        break;
                }
            }
            
            return true;
        });
        
        this.updateGrid();
        console.log(`✅ ${this.filteredData.length} opérations affichées`);
    }

    updateStats() {
        if (!this.stats) return;
        
        const stats = this.statsData;
        
        const cardsData = {
            credits: stats.credits || 0,
            debits: stats.debits || 0,
            pointees: stats.pointees || 0,
            non_pointees: stats.nonPointees || 0,
        };
        
        this.stats.updateAll(cardsData);
    }
    
    updateGrid() {
        if (this.grid) {
            this.grid.setData(this.filteredData);
        }
    }
    
    // ========================================
    // FORMATTERS
    // ========================================
    
    formaterMontant(montant) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(montant || 0);
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
        switch(type) {
            case 'error':
                toast.error(message);
                break;
            case 'success':
                toast.success(message);
                break;
            case 'warning':
                toast.warning(message);
                break;
            default:
                toast.info(message);
        }
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

const orchestrator = new OperationsBancairesOrchestrator();
export default orchestrator;