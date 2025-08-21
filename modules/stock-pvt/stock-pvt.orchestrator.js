// ========================================
// STOCK-PVT.ORCHESTRATOR.JS - 🎯 ORCHESTRATEUR PRINCIPAL
// Chemin: modules/stock-pvt/stock-pvt.orchestrator.js
//
// DESCRIPTION:
// Orchestrateur unique pour stock prés-ventes
// Basé sur l'architecture des opérations bancaires
// Gère l'import CSV, catégorisation auto, stock et inventaire
//
// VERSION: 1.0.0
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
import uploadService from './stock-pvt.upload.service.js';
import firestoreService from './stock-pvt.firestore.service.js';

// Import Firebase
import { initFirebase } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    CATEGORIES: {
        alimentaire: { label: 'Alimentaire', icon: '🥐', couleur: '#d1e7dd' },
        boisson: { label: 'Boisson', icon: '🥤', couleur: '#cfe2ff' },
        textile: { label: 'Textile', icon: '👕', couleur: '#e0cffc' },
        electronique: { label: 'Électronique', icon: '📱', couleur: '#f8d7da' },
        maison: { label: 'Maison', icon: '🏠', couleur: '#fff3cd' },
        sport: { label: 'Sport', icon: '⚽', couleur: '#d2f4ea' },
        beaute: { label: 'Beauté', icon: '💄', couleur: '#f5e6ff' },
        autre: { label: 'Autre', icon: '📦', couleur: '#f8f9fa' }
    },
    
    STATUTS_STOCK: {
        OK: { label: 'Stock OK', couleur: 'success', icon: '✅' },
        BAS: { label: 'Stock bas', couleur: 'warning', icon: '⚠️' },
        RUPTURE: { label: 'Rupture', couleur: 'danger', icon: '🔴' }
    }
};

// Import config pour les boutons
const config = {
    Button: class Button {
        constructor(options) {
            this.element = document.createElement('button');
            this.element.className = `btn btn-${options.variant || 'primary'}`;
            if (options.pill) this.element.className += ' btn-pill';
            this.element.textContent = options.text;
            if (options.disabled) this.element.disabled = true;
            if (options.onClick) this.element.onclick = options.onClick;
        }
        getElement() { return this.element; }
    },
    
    createImportDropzone: (selector, options) => {
        const container = document.querySelector(selector);
        if (!container) return null;
        
        container.innerHTML = `
            <div class="dropzone-area">
                <input type="file" id="fileInput" multiple accept=".csv,.txt" style="display: none;">
                <div class="dropzone-content">
                    <div class="dropzone-icon">📁</div>
                    <div class="dropzone-text">
                        Glissez vos fichiers CSV ici<br>
                        <span class="dropzone-subtext">ou cliquez pour parcourir</span>
                    </div>
                </div>
            </div>
        `;
        
        const fileInput = container.querySelector('#fileInput');
        const dropArea = container.querySelector('.dropzone-area');
        
        dropArea.onclick = () => fileInput.click();
        
        fileInput.onchange = (e) => {
            if (e.target.files && options.onDrop) {
                options.onDrop(e.target.files);
            }
        };
        
        dropArea.ondragover = (e) => {
            e.preventDefault();
            dropArea.classList.add('dragover');
        };
        
        dropArea.ondragleave = () => {
            dropArea.classList.remove('dragover');
        };
        
        dropArea.ondrop = (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            if (e.dataTransfer.files && options.onDrop) {
                options.onDrop(e.dataTransfer.files);
            }
        };
        
        return {
            destroy: () => {
                container.innerHTML = '';
            }
        };
    }
};

// Exporter config pour create.js
window.stockPVTConfig = config;

// ========================================
// CLASSE ORCHESTRATEUR
// ========================================

class StockPVTOrchestrator {
    constructor() {
        // Widgets
        this.header = null;
        this.stats = null;
        this.filters = null;
        this.grid = null;
        
        // Données
        this.articlesData = [];
        this.statsData = {};
        this.filteredData = [];
        
        // État des filtres
        this.currentFilters = {
            search: '',
            categorie: '',
            fournisseur: '',
            magasin: '',
            statut: '',
            cartesActives: []
        };
        
        // Sélection multiple
        this.selection = new Set();
        
        // Listes dynamiques
        this.magasinsDynamiques = new Set();
        this.categoriesDynamiques = new Set();
        this.fournisseursDynamiques = new Set();
        
        // État de l'application
        this.isLoading = false;
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init() {
        try {
            this.showLoader();
            console.log('🚀 Initialisation orchestrateur stock PVT...');
            
            // Vérifier l'authentification
            if (!this.checkAuth()) {
                this.showError('Vous devez être connecté pour accéder à cette page');
                setTimeout(() => {
                    window.location.href = '/index.html';
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
    
    createHeader() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        this.header = new HeaderWidget({
            // FOND DÉGRADÉ
            pageBackground: 'colorful',
            theme: 'gradient',
            
            // PERSONNALISATION
            buttonStyles: {
                back: { height: '48px', padding: '12px 24px', minWidth: '120px' },
                action: { height: '48px', width: '44px' },
                notification: { height: '48px', width: '44px' },
                userMenu: { height: '48px', padding: '6px 16px 6px 6px', maxWidth: '220px' },
                indicator: { height: '48px', padding: '10px 16px', minWidth: 'auto' }
            },
            
            // TEXTES
            title: 'Stock Prés-Ventes',
            subtitle: '',
            centerTitle: true,
            
            // LOGO
            showLogo: true,
            logoIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
            
            // NAVIGATION
            showBack: true,
            backText: 'Retour',
            onBack: () => {
                window.location.href = '/modules/home/home.html';
            },
            
            // RECHERCHE
            showSearch: true,
            searchPlaceholder: 'Rechercher référence, désignation, code barre...',
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
                    id: 'inventaire',
                    title: 'Inventaire',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11H3v12h6V11z"></path><path d="M15 3H9v8h6V3z"></path><path d="M21 7h-6v16h6V7z"></path></svg>',
                    onClick: () => this.showInventaire()
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
            
            // INDICATEURS
            showIndicators: true,
            indicators: [
                {
                    id: 'status',
                    text: 'Connecté',
                    type: 'success',
                    animated: true
                }
            ],
            
            // NOTIFICATIONS
            showNotifications: true,
            
            // BREADCRUMBS
            showBreadcrumbs: true,
            breadcrumbs: [
                { text: 'Accueil', url: '/modules/home/home.html' },
                { text: 'Stock', url: '#' },
                { text: 'Prés-Ventes' }
            ],
            
            // UTILISATEUR
            showUser: true,
            showUserDropdown: true,
            showMagasin: true,
            showLogout: true
        });
        
        // Mettre à jour les indicateurs après chargement
        this.updateHeaderIndicators = () => {
            if (this.header && this.articlesData) {
                // Nombre d'articles
                this.header.updateIndicator('count', `${this.articlesData.length} articles`);
                
                // Valeur du stock
                const valeurStock = this.articlesData.reduce((sum, art) => {
                    return sum + ((art.quantite || 0) * (art.prixVente || 0));
                }, 0);
                
                const valeurFormat = new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                }).format(valeurStock);
                
                this.header.updateIndicator('stock', `Stock: ${valeurFormat}`, 'info');
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
                { id: 'total', label: 'Total Articles', icon: '📦', value: 0, color: 'info' },
                { id: 'valeur', label: 'Valeur Stock', icon: '💰', value: 0, color: 'success' },
                { id: 'rupture', label: 'En Rupture', icon: '🔴', value: 0, color: 'danger' },
                { id: 'bas', label: 'Stock Bas', icon: '⚠️', value: 0, color: 'warning' }
            ],
            onSelect: (selectedIds) => {
                console.log('Filtres par cartes:', selectedIds);
                this.currentFilters.cartesActives = selectedIds;
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
                    key: 'fournisseur', 
                    label: 'Fournisseur',
                    options: [
                        { value: '', label: 'Tous fournisseurs' }
                    ],
                    searchable: true
                },
                { 
                    type: 'select', 
                    key: 'magasin',
                    label: 'Magasin',
                    options: [
                        { value: '', label: 'Tous les magasins' }
                    ]
                },
                { 
                    type: 'select', 
                    key: 'statut', 
                    label: 'Statut Stock',
                    options: [
                        { value: '', label: 'Tous statuts' },
                        { value: 'ok', label: '✅ Stock OK' },
                        { value: 'bas', label: '⚠️ Stock bas' },
                        { value: 'rupture', label: '🔴 Rupture' }
                    ]
                }
            ],
            onFilter: (values) => {
                console.log('Filtres appliqués:', values);
                
                this.currentFilters = { 
                    ...this.currentFilters, 
                    categorie: values.categorie || '',
                    fournisseur: values.fournisseur || '',
                    magasin: values.magasin || '',
                    statut: values.statut || ''
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
                        return `<input type="checkbox" class="article-checkbox" data-id="${row.id}" ${checked ? 'checked' : ''}>`;
                    }
                },
                { 
                    key: 'reference', 
                    label: 'Référence',
                    sortable: true,
                    width: 120,
                    formatter: (v) => v || 'AUTO'
                },
                { 
                    key: 'designation', 
                    label: 'Désignation',
                    sortable: true,
                    width: 300,
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
                    key: 'quantite', 
                    label: 'Stock',
                    sortable: true,
                    width: 80,
                    html: true,
                    formatter: (qte, row) => {
                        let classe = 'stock-ok';
                        if (qte <= 0) classe = 'stock-rupture';
                        else if (qte <= (row.quantiteMin || 0)) classe = 'stock-bas';
                        return `<span class="${classe}">${qte || 0}</span>`;
                    }
                },
                { 
                    key: 'prixAchat', 
                    label: 'PA HT',
                    sortable: true,
                    width: 100,
                    formatter: (v) => this.formaterMontant(v)
                },
                { 
                    key: 'prixVente', 
                    label: 'PV TTC',
                    sortable: true,
                    width: 100,
                    formatter: (v) => this.formaterMontant(v)
                },
                { 
                    key: 'tauxMarge',
                    label: 'Marge',
                    sortable: true,
                    width: 80,
                    html: true,
                    formatter: (v) => {
                        const taux = parseFloat(v) || 0;
                        const color = taux >= 30 ? 'success' : taux >= 15 ? 'warning' : 'danger';
                        return `<span class="badge badge-${color}">${taux.toFixed(1)}%</span>`;
                    }
                },
                { 
                    key: 'fournisseur',
                    label: 'Fournisseur',
                    width: 120,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'codeMagasin',
                    label: 'Mag.',
                    sortable: true,
                    width: 60,
                    formatter: (v) => v || '-'
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
                        this.filteredData.forEach(art => this.selection.add(art.id));
                    } else {
                        this.selection.clear();
                    }
                    this.updateGrid();
                    this.updateSelectionInfo();
                });
            }
            
            // Gérer les checkboxes individuelles
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('article-checkbox')) {
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
            
            // Charger les articles
            const articles = await firestoreService.getArticles({ limite: 5000 });
            
            this.articlesData = articles;
            console.log(`✅ ${this.articlesData.length} articles chargés`);
            
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
            
            // Mettre à jour les indicateurs du header
            if (this.updateHeaderIndicators) {
                this.updateHeaderIndicators();
            }
            
            this.hideLoader();
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur chargement données : ' + error.message);
            console.error('Erreur complète:', error);
        }
    }
    
    updateDynamicLists() {
        this.magasinsDynamiques.clear();
        this.categoriesDynamiques.clear();
        this.fournisseursDynamiques.clear();
        
        this.articlesData.forEach(art => {
            if (art.codeMagasin) this.magasinsDynamiques.add(art.codeMagasin);
            if (art.categorie) this.categoriesDynamiques.add(art.categorie);
            if (art.fournisseur) this.fournisseursDynamiques.add(art.fournisseur);
        });
        
        console.log('📊 Magasins détectés:', Array.from(this.magasinsDynamiques));
        console.log('📊 Catégories détectées:', Array.from(this.categoriesDynamiques));
        console.log('📊 Fournisseurs détectés:', Array.from(this.fournisseursDynamiques));
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
        
        // Créer les options de fournisseurs
        const fournisseurOptions = [{ value: '', label: 'Tous fournisseurs' }];
        this.fournisseursDynamiques.forEach(fourn => {
            fournisseurOptions.push({
                value: fourn,
                label: fourn
            });
        });
        
        // Créer les options de magasins
        const magasinOptions = [{ value: '', label: 'Tous les magasins' }];
        this.magasinsDynamiques.forEach(magasin => {
            magasinOptions.push({
                value: magasin,
                label: magasin === '-' ? 'Non défini' : magasin
            });
        });
        
        // Mettre à jour les dropdowns
        if (this.filters && this.filters.state && this.filters.state.dropdowns) {
            // Catégorie
            if (this.filters.state.dropdowns.categorie) {
                const categorieDropdown = this.filters.state.dropdowns.categorie;
                categorieDropdown.config.options = categorieOptions;
                categorieDropdown.filteredOptions = [...categorieOptions];
                this.filters.renderDropdownOptions(categorieDropdown);
            }
            
            // Fournisseur
            if (this.filters.state.dropdowns.fournisseur) {
                const fournisseurDropdown = this.filters.state.dropdowns.fournisseur;
                fournisseurDropdown.config.options = fournisseurOptions;
                fournisseurDropdown.filteredOptions = [...fournisseurOptions];
                this.filters.renderDropdownOptions(fournisseurDropdown);
            }
            
            // Magasin
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
            title: 'Import de fichiers stock',
            theme: 'blue',
            mode: 'simple',
            maxFiles: 10,
            acceptedTypes: ['text/csv', 'text/plain', 'application/vnd.ms-excel'],
            description: {
                icon: '📊',
                title: 'Import multi-colonnes intelligent',
                text: 'Déposez jusqu\'à 10 fichiers CSV. Détection automatique des colonnes peu importe leur ordre, catégorisation intelligente des articles.'
            },
            saveButtonText: '📦 Importer les articles',
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
                    console.log('📍 Colonnes détectées:', resultatAnalyse.mapping.foundColumns);
                    
                    // Importer les articles
                    this.showMessage(`Import des articles ${i + 1}/${data.files.length}...`);
                    const resultatImport = await firestoreService.importerArticles(
                        resultatAnalyse.articles,
                        file.name
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
                    
                    if (resultatImport.erreurs.length > 0) {
                        resultats.erreurs.push(...resultatImport.erreurs);
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
                this.showSuccess(`✅ ${totalImportees} article(s) importé(s)`);
            }
            
            if (totalDoublons > 0) {
                this.showWarning(`⚠️ ${totalDoublons} doublon(s) ignoré(s)`);
            }
            
            if (resultats.erreurs.length > 0) {
                const uniqueErrors = [...new Set(resultats.erreurs.map(e => e.erreur || e))];
                uniqueErrors.forEach(err => {
                    this.showError(`❌ ${err}`);
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
    
    async mouvementStock() {
        if (this.selection.size === 0) {
            this.showWarning('Veuillez sélectionner au moins un article');
            return;
        }
        
        // TODO: Dialog pour saisir les mouvements
        this.showInfo('Fonctionnalité en cours de développement');
    }
    
    async categoriserSelection() {
        if (this.selection.size === 0) {
            this.showWarning('Veuillez sélectionner au moins un article');
            return;
        }
        
        // TODO: Dialog pour choisir la catégorie
        this.showInfo('Fonctionnalité en cours de développement');
    }
    
    updateSelectionInfo() {
        console.log(`Sélection: ${this.selection.size} article(s)`);
    }
    
    // ========================================
    // AFFICHAGE DÉTAIL
    // ========================================
    
    showInventaire() {
        // TODO: Ouvrir une modal d'inventaire
        this.showInfo('Module inventaire - Fonctionnalité en développement');
    }
    
    resetAllFilters() {
        console.log('🔄 Réinitialisation de tous les filtres');
        
        // Réinitialiser les filtres
        this.currentFilters = {
            search: '',
            categorie: '',
            fournisseur: '',
            magasin: '',
            statut: '',
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
        
        // Section 1 : Identification
        sections.push({
            id: 'identification',
            title: '📦 Identification',
            fields: [
                { label: 'Référence', value: row.reference || 'AUTO', bold: true },
                { label: 'Désignation', value: row.designation || '-', bold: true },
                { label: 'Code-barres', value: row.codeBarres || '-' },
                { label: 'Marque', value: row.marque || '-' }
            ]
        });
        
        // Section 2 : Stock
        const statutStock = row.quantite <= 0 ? '🔴 Rupture' : 
                          row.quantite <= (row.quantiteMin || 0) ? '⚠️ Stock bas' : 
                          '✅ Stock OK';
        sections.push({
            id: 'stock',
            title: '📊 Stock',
            fields: [
                { 
                    label: 'Quantité', 
                    value: row.quantite || 0,
                    bold: true,
                    html: true,
                    formatter: () => {
                        const color = row.quantite <= 0 ? '#dc3545' : 
                                    row.quantite <= (row.quantiteMin || 0) ? '#ffc107' : '#28a745';
                        return `<span style="color: ${color}; font-size: 24px; font-weight: bold;">
                            ${row.quantite || 0}
                        </span>`;
                    }
                },
                { label: 'Stock minimum', value: row.quantiteMin || 0 },
                { label: 'Stock maximum', value: row.quantiteMax || 0 },
                { label: 'Statut', value: statutStock },
                { label: 'Emplacement', value: row.emplacement || '-' }
            ]
        });
        
        // Section 3 : Prix et marge
        const categorie = CONFIG.CATEGORIES[row.categorie] || CONFIG.CATEGORIES.autre;
        sections.push({
            id: 'prix',
            title: '💰 Prix et marge',
            fields: [
                { label: 'Prix d\'achat HT', value: formatMontant(row.prixAchat) },
                { label: 'Prix de vente TTC', value: formatMontant(row.prixVente), bold: true },
                { label: 'Marge', value: formatMontant(row.montantMarge || 0) },
                { label: 'Taux de marge', value: `${row.tauxMarge || 0}%` },
                { label: 'Catégorie', value: `${categorie.icon} ${categorie.label}` }
            ]
        });
        
        // Section 4 : Fournisseur
        sections.push({
            id: 'fournisseur',
            title: '🚚 Approvisionnement',
            fields: [
                { label: 'Fournisseur', value: row.fournisseur || '-' },
                { label: 'Date entrée', value: formatDate(row.dateEntree) },
                { label: 'Dernier mouvement', value: formatDate(row.dateDernierMouvement) },
                { label: 'Date péremption', value: formatDate(row.datePeremption) || 'N/A' }
            ]
        });
        
        // Créer le viewer
        const viewer = new DetailViewerWidget({
            title: row.designation,
            subtitle: `Référence: ${row.reference || 'AUTO'}`,
            data: row,
            sections: sections,
            actions: [
                {
                    label: '📝 Modifier',
                    class: 'btn btn-glass-blue btn-lg',
                    onClick: async (data) => {
                        // TODO: Dialog pour modifier l'article
                        this.showInfo('Fonctionnalité en cours');
                        return false;
                    }
                },
                {
                    label: '📊 Mouvement stock',
                    class: 'btn btn-glass-green btn-lg',
                    onClick: async (data) => {
                        // TODO: Dialog pour mouvement de stock
                        this.showInfo('Fonctionnalité en cours');
                        return false;
                    }
                },
                {
                    label: '🗑️ Supprimer',
                    class: 'btn btn-glass-red btn-lg',
                    onClick: async (data) => {
                        if (!confirm(`Supprimer l'article "${data.designation}" ?`)) {
                            return false;
                        }
                        
                        try {
                            await firestoreService.supprimerArticle(data.id);
                            this.showSuccess('Article supprimé');
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
        
        this.filteredData = this.articlesData.filter(article => {
            // Filtre recherche
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                
                const searchIn = [
                    (article.reference || '').toLowerCase(),
                    (article.designation || '').toLowerCase(),
                    (article.codeBarres || '').toLowerCase(),
                    (article.fournisseur || '').toLowerCase(),
                    (article.marque || '').toLowerCase(),
                    (article.emplacement || '').toLowerCase()
                ].join(' ');
                
                if (!searchIn.includes(search)) {
                    return false;
                }
            }
            
            // Filtre catégorie
            if (this.currentFilters.categorie && article.categorie !== this.currentFilters.categorie) {
                return false;
            }
            
            // Filtre fournisseur
            if (this.currentFilters.fournisseur && article.fournisseur !== this.currentFilters.fournisseur) {
                return false;
            }
            
            // Filtre magasin
            if (this.currentFilters.magasin && article.codeMagasin !== this.currentFilters.magasin) {
                return false;
            }
            
            // Filtre statut stock
            if (this.currentFilters.statut) {
                switch (this.currentFilters.statut) {
                    case 'rupture':
                        if (article.quantite > 0) return false;
                        break;
                    case 'bas':
                        if (article.quantite <= 0 || article.quantite > (article.quantiteMin || 0)) return false;
                        break;
                    case 'ok':
                        if (article.quantite <= (article.quantiteMin || 0)) return false;
                        break;
                }
            }
            
            // Filtre cartes actives
            if (this.currentFilters.cartesActives && this.currentFilters.cartesActives.length > 0) {
                let matchCarte = false;
                
                for (const carte of this.currentFilters.cartesActives) {
                    switch (carte) {
                        case 'rupture':
                            if (article.quantite <= 0) matchCarte = true;
                            break;
                        case 'bas':
                            if (article.quantite > 0 && article.quantite <= (article.quantiteMin || 0)) matchCarte = true;
                            break;
                    }
                }
                
                if (this.currentFilters.cartesActives.includes('rupture') || this.currentFilters.cartesActives.includes('bas')) {
                    if (!matchCarte) return false;
                }
            }
            
            return true;
        });
        
        this.updateGrid();
        console.log(`✅ ${this.filteredData.length} articles affichés`);
            }
            
            updateStats() {
                if (!this.stats) return;
                
                const stats = this.statsData;
                
                const cardsData = {
                    total: stats.total || 0,
                    valeur: this.formaterMontant(stats.valeurStock || 0),
                    rupture: stats.enRupture || 0,
                    bas: stats.stockBas || 0
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

        const orchestrator = new StockPVTOrchestrator();
        export default orchestrator;