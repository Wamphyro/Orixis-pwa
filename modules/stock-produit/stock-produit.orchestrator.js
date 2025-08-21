// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                      STOCK-PRODUIT.ORCHESTRATOR.JS                         ║
// ║                    Orchestrateur Principal + Utilitaires                   ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║ Module: Gestion Stock Audioprothèse                                        ║
// ║ Version: 1.0.0                                                             ║
// ║ Date: 03/02/2025                                                           ║
// ╚════════════════════════════════════════════════════════════════════════════╝

// ┌────────────────────────────────────────┐
// │        SECTION 1: IMPORTS              │
// └────────────────────────────────────────┘

// ─── WIDGETS ───
import { HeaderWidget } from '../../widgets/header/header.widget.js';
import { StatsCardsWidget } from '../../widgets/stats-cards/stats-cards.widget.js';
import { SearchFiltersWidget } from '../../widgets/search-filters/search-filters.widget.js';
import { DataGridWidget } from '../../widgets/data-grid/data-grid.widget.js';
import { PdfUploaderWidget } from '../../widgets/pdf-uploader/pdf-uploader.widget.js';
import { DetailViewerWidget } from '../../widgets/detail-viewer/detail-viewer.widget.js';
import toast from '../../widgets/toast/toast.widget.js';

// ─── SERVICES ───
import uploadService from './stock-produit.upload.service.js';
import firestoreService from './stock-produit.firestore.service.js';
import { initFirebase } from '../../src/services/firebase.service.js';

// ─── MODULES ───
import { initImportStock, ouvrirModalImport } from './stock-produit.create.js';

// ╔════════════════════════════════════════╗
// ║     SECTION 2: CONFIGURATION           ║
// ╚════════════════════════════════════════╝

const CONFIG = {
    // ─── STATUTS WORKFLOW (13 statuts) ───
    STATUTS: {
        STO: { label: 'En stock', icon: '📦', color: 'success' },
        PVT: { label: 'Pré-Vente', icon: '🏷️', color: 'info' },
        VTE: { label: 'Vendu', icon: '✅', color: 'primary' },
        RSV: { label: 'Réservé', icon: '🔒', color: 'warning' },
        PRT: { label: 'En prêt', icon: '📤', color: 'purple' },
        RETA: { label: 'Retour pour avoir', icon: '↩️', color: 'orange' },
        EXT: { label: 'Externe', icon: '🌐', color: 'secondary' },
        RETE: { label: 'Retour pour échange', icon: '🔄', color: 'pink' },
        AVR: { label: 'Avoir reçu', icon: '✔️', color: 'teal' },
        ECHR: { label: 'Échange reçu', icon: '🔁', color: 'cyan' },
        SDEP: { label: 'Sortie dépôt', icon: '📦', color: 'brown' },
        CMD: { label: 'Commande', icon: '🛒', color: 'deep-purple' },
        RETF: { label: 'Retour fournisseur', icon: '❌', color: 'danger' }
    },
    
    // ─── MARQUES AUDIOPROTHÈSE ───
    MARQUES: ['PHONAK', 'UNITRON', 'OTICON', 'SIGNIA', 'STARKEY', 'WIDEX', 'RESOUND']
};

// ─── FACTORY BOUTONS (pour create.js) ───
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
                    <div class="dropzone-icon">📂</div>
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

window.stockProduitConfig = config;

// ╔════════════════════════════════════════╗
// ║   SECTION 3: CLASSE ORCHESTRATEUR      ║
// ╚════════════════════════════════════════╝

class StockProduitOrchestrator {
    constructor() {
        // ─── WIDGETS ───
        this.header = null;
        this.stats = null;
        this.filters = null;
        this.grid = null;
        
        // ─── DONNÉES ───
        this.articlesData = [];
        this.statsData = {};
        this.filteredData = [];
        
        // ─── FILTRES ACTIFS ───
        this.currentFilters = {
            search: '',
            categorie: '',
            fournisseur: '',
            magasin: '',
            statut: '',
            statutsActifs: []
        };
        
        // ─── SÉLECTION ───
        this.selection = new Set();
        
        // ─── LISTES DYNAMIQUES ───
        this.magasinsDynamiques = new Set();
        this.categoriesDynamiques = new Set();
        this.fournisseursDynamiques = new Set();
        
        // ─── ÉTAT APPLICATION ───
        this.isLoading = false;
    }
    
    // ┌────────────────────────────────────────┐
    // │    INITIALISATION PRINCIPALE           │
    // └────────────────────────────────────────┘
    
    async init() {
        try {
            this.showLoader();
            console.log('🚀 Initialisation orchestrateur stock audioprothèse...');
            
            // ─── Vérification authentification ───
            if (!this.checkAuth()) {
                this.showError('Vous devez être connecté pour accéder à cette page');
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
                return;
            }
            
            // ─── Initialisation Firebase ───
            console.log('🔥 Initialisation Firebase...');
            await initFirebase();
            console.log('✅ Firebase initialisé');
            
            // ─── Initialisation module import ───
            initImportStock();
            
            // ─── Exposition fonctions globales ───
            window.ouvrirModalImportStock = ouvrirModalImport;
            window.afficherSucces = this.showSuccess.bind(this);
            window.afficherErreur = this.showError.bind(this);
            window.afficherAvertissement = this.showWarning.bind(this);
            window.afficherInfo = this.showInfo.bind(this);
            
            // ─── Gestion modales ───
            if (!window.modalManager) {
                window.modalManager = {
                    open: (id) => {
                        const modal = document.getElementById(id);
                        if (modal) {
                            modal.style.display = 'block';
                            modal.classList.add('show');
                            document.body.classList.add('modal-open');
                        }
                    },
                    close: (id) => {
                        const modal = document.getElementById(id);
                        if (modal) {
                            modal.style.display = 'none';
                            modal.classList.remove('show');
                            document.body.classList.remove('modal-open');
                        }
                    }
                };
            }
            
            window.fermerModal = window.modalManager.close;
            
            // ─── Création widgets ───
            await this.createWidgets();
            
            // ─── Chargement données ───
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
    
    // ┌────────────────────────────────────────┐
    // │         CRÉATION DES WIDGETS           │
    // └────────────────────────────────────────┘
    
    async createWidgets() {
        console.log('🎨 Création des widgets...');
        
        this.createHeader();
        this.createStatsCards();
        this.createFilters();
        this.createDataGrid();
        
        console.log('✅ Widgets créés');
    }
    
    // ─── WIDGET: HEADER ───
    createHeader() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        this.header = new HeaderWidget({
            pageBackground: 'colorful',
            theme: 'gradient',
            
            buttonStyles: {
                back: { height: '48px', padding: '12px 24px', minWidth: '120px' },
                action: { height: '48px', width: '44px' },
                notification: { height: '48px', width: '44px' },
                userMenu: { height: '48px', padding: '6px 16px 6px 6px', maxWidth: '220px' },
                indicator: { height: '48px', padding: '10px 16px', minWidth: 'auto' }
            },
            
            title: 'Stock Produit',
            subtitle: '',
            centerTitle: true,
            
            showLogo: true,
            logoIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
            
            showBack: true,
            backText: 'Retour',
            onBack: () => {
                window.location.href = '/Orixis-pwa/modules/home/home.html';
            },
            
            showSearch: true,
            searchPlaceholder: 'Rechercher numéro série, libellé, marque...',
            searchMaxWidth: '1500px',
            searchHeight: '48px',
            onSearch: (query) => {
                this.currentFilters.search = query;
                this.applyFilters();
            },
            
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
                    id: 'delete',
                    title: 'Supprimer sélection',
                    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>',
                    onClick: () => this.deleteSelected()
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
            
            showIndicators: true,
            indicators: [
                {
                    id: 'status',
                    text: 'Connecté',
                    type: 'success',
                    animated: true
                }
            ],
            
            showNotifications: true,
            
            showBreadcrumbs: true,
            breadcrumbs: [
                { text: 'Accueil', url: '/Orixis-pwa/modules/home/home.html' },
                { text: 'Stock', url: '#' },
                { text: 'Audioprothèse' }
            ],
            
            showUser: true,
            showUserDropdown: true,
            showMagasin: true,
            showLogout: true
        });
        
        // ─── Mise à jour indicateurs après chargement ───
        this.updateHeaderIndicators = () => {
            if (this.header && this.articlesData) {
                this.header.updateIndicator('count', `${this.articlesData.length} articles`);
                
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
    
    // ─── WIDGET: STATS CARDS (13 statuts) ───
    createStatsCards() {
        this.stats = new StatsCardsWidget({
            container: '.stats-container',
            showWrapper: true,
            wrapperStyle: 'minimal',
            size: 'sm',
            autoFit: true,
            selectionMode: 'multiple',
            animated: false,
            cards: Object.entries(CONFIG.STATUTS).map(([key, config]) => ({
                id: key,
                label: key,
                icon: config.icon,
                value: 0,
                color: config.color
            })),
            onSelect: (selectedIds) => {
                console.log('Filtres par statuts:', selectedIds);
                this.currentFilters.statutsActifs = selectedIds;
                this.applyFilters();
            }
        });
    }
    
    // ─── WIDGET: FILTRES ───
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
                    key: 'fournisseur', 
                    label: 'Client',
                    options: [
                        { value: '', label: 'Tous les clients' }
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
                }
            ],
            onFilter: (values) => {
                console.log('Filtres appliqués:', values);
                
                this.currentFilters = { 
                    ...this.currentFilters, 
                    fournisseur: values.fournisseur || '',
                    magasin: values.magasin || ''
                };
                
                this.applyFilters();
            }
        });
    }
    
    // ─── WIDGET: DATA GRID ───
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
                    key: 'marque', 
                    label: 'Marque',
                    sortable: true,
                    width: 120,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'libelle', 
                    label: 'Libellé',
                    sortable: true,
                    width: 300,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'numeroSerie', 
                    label: 'N° Série',
                    sortable: true,
                    width: 150,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'magasin',
                    label: 'Magasin',
                    sortable: true,
                    width: 100,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'client',
                    label: 'Client',
                    sortable: true,
                    width: 230,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'quantite', 
                    label: 'Stock',
                    sortable: true,
                    width: 70,
                    html: true,
                    formatter: (qte) => {
                        let classe = 'stock-ok';
                        if (qte <= 0) classe = 'stock-rupture';
                        return `<span class="${classe}">${qte || 0}</span>`;
                    }
                },
                { 
                    key: 'statut',
                    label: 'Statut',
                    sortable: true,
                    width: 90,
                    html: true,
                    formatter: (statut) => {
                        const statutConfig = {
                            'STO': '#28a745',
                            'PVT': '#17a2b8',
                            'VTE': '#007bff',
                            'RSV': '#ffc107',
                            'PRT': '#6f42c1',
                            'RETA': '#fd7e14',
                            'EXT': '#6c757d',
                            'RETE': '#e83e8c',
                            'AVR': '#20c997',
                            'ECHR': '#87ceeb',
                            'SDEP': '#795548',
                            'CMD': '#9c27b0',
                            'RETF': '#dc3545'
                        };
                        
                        const code = statut || 'STO';
                        const color = statutConfig[code] || '#6c757d';
                        
                        return `<span style="
                            background: ${color}; 
                            color: white; 
                            padding: 2px 8px; 
                            border-radius: 4px; 
                            font-size: 11px;
                            font-weight: 600;
                            font-family: monospace;
                        ">${code}</span>`;
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
        
        // ─── Gestion sélection multiple ───
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
    
    // ┌────────────────────────────────────────┐
    // │      GESTION DES DONNÉES               │
    // └────────────────────────────────────────┘
    
    async loadData() {
        try {
            this.showLoader();
            console.log('📊 Chargement des données...');
            
            // ─── Chargement articles ───
            const articles = await firestoreService.getArticles({ limite: 5000 });
            
            this.articlesData = articles;
            console.log(`✅ ${this.articlesData.length} articles chargés`);
            
            // ─── Chargement statistiques ───
            this.statsData = await firestoreService.getStatistiques();
            console.log('✅ Statistiques chargées:', this.statsData);
            
            // ─── Mise à jour listes dynamiques ───
            this.updateDynamicLists();
            
            // ─── Mise à jour options filtres ───
            this.updateFilterOptions();
            
            // ─── Mise à jour affichage ───
            this.updateStats();
            this.applyFilters();
            
            // ─── Mise à jour indicateurs header ───
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
        this.fournisseursDynamiques.clear();
        
        this.articlesData.forEach(art => {
            if (art.magasin) this.magasinsDynamiques.add(art.magasin);
            if (art.client) this.fournisseursDynamiques.add(art.client);
        });
        
        console.log('📊 Magasins détectés:', Array.from(this.magasinsDynamiques));
        console.log('📊 Clients détectés:', Array.from(this.fournisseursDynamiques));
    }
    
    updateFilterOptions() {
        // ─── Options clients ───
        const fournisseurOptions = [{ value: '', label: 'Tous les clients' }];
        this.fournisseursDynamiques.forEach(client => {
            fournisseurOptions.push({
                value: client,
                label: client
            });
        });
        
        // ─── Options magasins ───
        const magasinOptions = [{ value: '', label: 'Tous les magasins' }];
        this.magasinsDynamiques.forEach(magasin => {
            magasinOptions.push({
                value: magasin,
                label: magasin === '-' ? 'Non défini' : magasin
            });
        });
        
        // ─── Mise à jour dropdowns ───
        if (this.filters && this.filters.state && this.filters.state.dropdowns) {
            if (this.filters.state.dropdowns.fournisseur) {
                const fournisseurDropdown = this.filters.state.dropdowns.fournisseur;
                fournisseurDropdown.config.options = fournisseurOptions;
                fournisseurDropdown.filteredOptions = [...fournisseurOptions];
                this.filters.renderDropdownOptions(fournisseurDropdown);
            }
            
            if (this.filters.state.dropdowns.magasin) {
                const magasinDropdown = this.filters.state.dropdowns.magasin;
                magasinDropdown.config.options = magasinOptions;
                magasinDropdown.filteredOptions = [...magasinOptions];
                this.filters.renderDropdownOptions(magasinDropdown);
            }
        }
    }
    
    // ┌────────────────────────────────────────┐
    // │         IMPORT CSV                     │
    // └────────────────────────────────────────┘
    
    openImportModal() {
        const uploader = new PdfUploaderWidget({
            title: 'Import de fichiers stock audioprothèse',
            theme: 'blue',
            mode: 'simple',
            maxFiles: 10,
            acceptedTypes: ['text/csv', 'text/plain', 'application/vnd.ms-excel'],
            description: {
                icon: '📊',
                title: 'Import multi-colonnes intelligent',
                text: 'Déposez jusqu\'à 10 fichiers CSV. Détection automatique des colonnes : Marque, Libellé, N° Série, Centre, État, Client, etc.'
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
            
            // ─── Traitement de chaque fichier ───
            for (let i = 0; i < data.files.length; i++) {
                const file = data.files[i];
                
                try {
                    console.log(`\n📄 Traitement fichier ${i + 1}/${data.files.length}: ${file.name}`);
                    
                    this.showMessage(`Analyse du fichier ${i + 1}/${data.files.length}...`);
                    const resultatAnalyse = await uploadService.analyserCSV(file);
                    
                    console.log('✅ Fichier analysé:', resultatAnalyse.stats);
                    console.log('🔍 Colonnes détectées:', resultatAnalyse.mapping.foundColumns);
                    
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
            
            // ─── Affichage résumé ───
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
            
            // ─── Rafraîchissement données ───
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
    
    // ┌────────────────────────────────────────┐
    // │      ACTIONS SUR SÉLECTION             │
    // └────────────────────────────────────────┘
    
    async deleteSelected() {
        if (this.selection.size === 0) {
            this.showWarning('Veuillez sélectionner au moins un article à supprimer');
            return;
        }
        
        const count = this.selection.size;
        const message = count === 1 
            ? 'Voulez-vous vraiment supprimer cet article ?' 
            : `Voulez-vous vraiment supprimer ces ${count} articles ?`;
        
        if (!confirm(message)) {
            return;
        }
        
        try {
            this.showLoader();
            this.showInfo(`Suppression de ${count} article(s)...`);
            
            const promises = [];
            for (const id of this.selection) {
                promises.push(firestoreService.supprimerArticle(id));
            }
            
            await Promise.all(promises);
            
            this.selection.clear();
            
            await this.loadData();
            
            this.hideLoader();
            this.showSuccess(`✅ ${count} article(s) supprimé(s)`);
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur lors de la suppression : ' + error.message);
            console.error('Erreur suppression:', error);
        }
    }
    
    updateSelectionInfo() {
        console.log(`📝 ${this.selection.size} article(s) sélectionné(s)`);
    }
    
    // ┌────────────────────────────────────────┐
    // │      AFFICHAGE DÉTAIL                  │
    // └────────────────────────────────────────┘
    
    openDetailModal(row) {
        console.log('📋 Ouverture détails article:', row);
        
        const sections = [];
        
        sections.push({
            id: 'informations',
            title: '🦻 Détails Article',
            fields: [
                { 
                    label: 'Numéro de série', 
                    value: row.numeroSerie || '-',
                    bold: true 
                },
                { 
                    label: 'Libellé', 
                    value: row.libelle || '-',
                    bold: true 
                },
                { 
                    label: 'Marque', 
                    value: row.marque || '-' 
                },
                { 
                    label: 'Client', 
                    value: row.client || '-'
                },
                { 
                    label: 'Magasin', 
                    value: row.magasin || '-'
                },
                { 
                    label: 'Quantité en stock', 
                    value: row.quantite || 0,
                    bold: true
                },
                {
                    label: 'Statut',
                    value: CONFIG.STATUTS[row.statut]?.label || row.statut || 'STO'
                }
            ]
        });
        
        if (row.dateEntree) {
            const d = new Date(row.dateEntree);
            sections[0].fields.push({
                label: 'Date d\'entrée',
                value: d.toLocaleDateString('fr-FR')
            });
        }
        
        const viewer = new DetailViewerWidget({
            title: row.libelle || 'Article',
            subtitle: `N° série: ${row.numeroSerie || '-'}`,
            data: row,
            sections: sections,
            actions: [
                {
                    label: 'Fermer',
                    class: 'btn btn-glass-blue btn-lg',
                    onClick: () => {
                        viewer.close();
                        return true;
                    }
                }
            ],
            size: 'medium',
            theme: 'default'
        });
    }
    
    resetAllFilters() {
        console.log('🔄 Réinitialisation de tous les filtres');
        
        this.currentFilters = {
            search: '',
            categorie: '',
            fournisseur: '',
            magasin: '',
            statut: '',
            statutsActifs: []
        };
        
        if (this.stats) {
            this.stats.deselectAll();
        }
        
        if (this.filters) {
            this.filters.reset();
        }
        
        this.applyFilters();
        
        this.showInfo('Filtres réinitialisés');
    }
    
    // ┌────────────────────────────────────────┐
    // │      FILTRAGE ET MISE À JOUR           │
    // └────────────────────────────────────────┘
    
    applyFilters() {
        console.log('🔍 Application des filtres:', this.currentFilters);
        
        this.filteredData = this.articlesData.filter(article => {
            // ─── Filtre recherche ───
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                
                const searchIn = [
                    (article.numeroSerie || '').toLowerCase(),
                    (article.libelle || '').toLowerCase(),
                    (article.marque || '').toLowerCase(),
                    (article.magasin || '').toLowerCase(),
                    (article.client || '').toLowerCase(),
                    (article.fournisseur || '').toLowerCase()
                ].join(' ');
                
                if (!searchIn.includes(search)) {
                    return false;
                }
            }
            
            // ─── Filtre client ───
            if (this.currentFilters.fournisseur && article.client !== this.currentFilters.fournisseur) {
                return false;
            }
            
            // ─── Filtre magasin ───
            if (this.currentFilters.magasin && article.magasin !== this.currentFilters.magasin) {
                return false;
            }
            
            // ─── Filtre statuts ───
            if (this.currentFilters.statutsActifs && this.currentFilters.statutsActifs.length > 0) {
                const statut = article.statut || 'STO';
                if (!this.currentFilters.statutsActifs.includes(statut)) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.updateGrid();
        console.log(`✅ ${this.filteredData.length} articles affichés`);
    }
    
    updateGrid() {
        if (this.grid) {
            this.grid.setData(this.filteredData);
        }
    }
    
    updateStats() {
        if (!this.stats) return;
        
        // ─── Comptage par statut ───
        const compteurStatuts = {};
        Object.keys(CONFIG.STATUTS).forEach(statut => {
            compteurStatuts[statut] = 0;
        });
        
        this.articlesData.forEach(article => {
            const statut = article.statut || 'STO';
            if (compteurStatuts.hasOwnProperty(statut)) {
                compteurStatuts[statut]++;
            }
        });
        
        const cardsData = {};
        Object.keys(compteurStatuts).forEach(statut => {
            cardsData[statut] = compteurStatuts[statut];
        });
        
        this.stats.updateAll(cardsData);
    }
    
    // ┌────────────────────────────────────────┐
    // │      UTILITAIRES MESSAGES              │
    // └────────────────────────────────────────┘
    
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
    
    // ─── FORMATTERS ───
    formaterMontant(montant) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(montant || 0);
    }
}

// ╔════════════════════════════════════════╗
// ║    SECTION 4: EXPORT SINGLETON         ║
// ╚════════════════════════════════════════╝

const orchestrator = new StockProduitOrchestrator();
export default orchestrator;