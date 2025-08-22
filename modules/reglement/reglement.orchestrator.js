// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                        REGLEMENT.ORCHESTRATOR.JS                           ║
// ║                    Orchestrateur Principal + Utilitaires                   ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║ Module: Gestion Règlements                                                 ║
// ║ Version: 2.0.0                                                             ║
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
import uploadService from './reglement.upload.service.js';
import firestoreService from './reglement.firestore.service.js';
import { initFirebase } from '../../src/services/firebase.service.js';

// ─── MODULES ───
import { initImportReglement, ouvrirModalImport } from './reglement.create.js';

// ╔════════════════════════════════════════╗
// ║     SECTION 2: CONFIGURATION           ║
// ╚════════════════════════════════════════╝

const CONFIG = {
    // ─── TYPES DE RÈGLEMENT (CODES TRANSFORMÉS) ───
    TYPES_REGLEMENT: {
        // Paiements classiques
        CB: { label: 'CB', icon: '💳', color: 'success' },
        CHEQUE: { label: 'Chèque', icon: '📝', color: 'primary' },
        ESPECES: { label: 'Espèces', icon: '💵', color: 'warning' },
        VIREMENT: { label: 'Virement', icon: '🏦', color: 'info' },
        
        // Bons et avoirs
        BON_ACHAT: { label: 'Bon d\'achat', icon: '🎁', color: 'purple' },
        
        // Tiers payeurs SÉPARÉS
        TP_SECU: { label: 'TP Sécu', icon: '🏥', color: 'danger' },
        TP_MUTUELLE: { label: 'TP Mutuelle', icon: '🏥', color: 'secondary' },
        
        // Financements
        COFIDIS: { label: 'Cofidis', icon: '💰', color: 'info' },
        FRANFINANCE: { label: 'Franfinance', icon: '💰', color: 'info' },
        EUROSSUR: { label: 'Eurossur', icon: '💰', color: 'info' },
        SOFEMO: { label: 'Sofemo', icon: '💰', color: 'info' },
        PAIEMENT_NFOIS: { label: 'Paiement N fois', icon: '🔄', color: 'secondary' },
        
        // Organismes
        MDPH: { label: 'MDPH', icon: '♿', color: 'primary' },
        AGEFIPH: { label: 'AGEFIPH', icon: '♿', color: 'primary' },
        FIPHFP: { label: 'FIPHFP', icon: '♿', color: 'primary' },
        
        // Autres
        WEB_STORE: { label: 'Web Store', icon: '🛒', color: 'success' },
        OD: { label: 'Opération Diverse', icon: '📋', color: 'secondary' },
        AUTRE: { label: 'Autre', icon: '❓', color: 'secondary' }
    }
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

window.reglementConfig = config;

// ╔════════════════════════════════════════╗
// ║   SECTION 3: CLASSE ORCHESTRATEUR      ║
// ╚════════════════════════════════════════╝

class ReglementOrchestrator {
    constructor() {
        // ─── WIDGETS ───
        this.header = null;
        this.stats = null;
        this.filters = null;
        this.grid = null;
        
        // ─── DONNÉES ───
        this.reglementsData = [];
        this.statsData = {};
        this.filteredData = [];
        
        // ─── FILTRES ACTIFS (CORRIGÉ - TOUT EN ARRAYS) ───
        this.currentFilters = {
            search: '',
            clients: [],        // Array pour sélection multiple
            magasins: [],       // Array pour sélection multiple
            typesReglement: []  // Array pour filtrage par type
        };
        
        // ─── SÉLECTION ───
        this.selection = new Set();
        
        // ─── LISTES DYNAMIQUES ───
        this.clientsDynamiques = new Set();
        this.magasinsDynamiques = new Set();
        
        // ─── ÉTAT APPLICATION ───
        this.isLoading = false;
    }
    
    // ┌────────────────────────────────────────┐
    // │    INITIALISATION PRINCIPALE           │
    // └────────────────────────────────────────┘
    
    async init() {
        try {
            this.showLoader();
            console.log('🚀 Initialisation orchestrateur règlements...');
            
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
            initImportReglement();
            
            // ─── Exposition fonctions globales ───
            window.ouvrirModalImportReglement = ouvrirModalImport;
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
            
            title: 'Règlements',
            subtitle: '',
            centerTitle: true,
            
            showLogo: true,
            logoIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
            
            showBack: true,
            backText: 'Retour',
            onBack: () => {
                window.location.href = '/modules/home/home.html';
            },
            
            showSearch: true,
            searchPlaceholder: 'Rechercher client, montant, type...',
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
                { text: 'Accueil', url: '/modules/home/home.html' },
                { text: 'Finance', url: '#' },
                { text: 'Règlements' }
            ],
            
            showUser: true,
            showUserDropdown: true,
            showMagasin: true,
            showLogout: true
        });
        
        // ─── Mise à jour indicateurs après chargement ───
        this.updateHeaderIndicators = () => {
            if (this.header && this.reglementsData) {
                this.header.updateIndicator('count', `${this.filteredData.length} règlements`);
                
                const totalEncaisse = this.filteredData.reduce((sum, reg) => {
                    return sum + (reg.montant || 0);
                }, 0);
                
                const montantFormat = new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                }).format(totalEncaisse);
                
                this.header.updateIndicator('total', `Total: ${montantFormat}`, 'info');
            }
        };
    }
    
// ─── WIDGET: STATS CARDS ───
createStatsCards() {
    this.stats = new StatsCardsWidget({
        container: '.stats-container',
        showWrapper: true,
        wrapperStyle: 'minimal',
        size: 'sm',
        autoFit: true,
        selectionMode: 'multiple',  // ✅ AJOUT MODE MULTIPLE
        animated: false,
        clickable: true,
        
        cards: [
            {
                id: 'type_cb',
                label: 'Carte Bancaire',
                icon: '💳',
                value: 0,
                color: 'success'
            },
            {
                id: 'type_cheque',
                label: 'Chèques',
                icon: '📝',
                value: 0,
                color: 'primary'
            },
            {
                id: 'type_especes',
                label: 'Espèces',
                icon: '💵',
                value: 0,
                color: 'warning'
            },
            {
                id: 'type_virement',
                label: 'Virements',
                icon: '🏦',
                value: 0,
                color: 'info'
            },
            {
                id: 'type_tp_secu',
                label: 'TP Sécu',
                icon: '🏥',
                value: 0,
                color: 'danger'
            },
            {
                id: 'type_tp_mutuelle',
                label: 'TP Mutuelle',
                icon: '🏥',
                value: 0,
                color: 'secondary'
            },
            {
                id: 'type_financement',
                label: 'Financements',
                icon: '💰',
                value: 0,
                color: 'purple'
            },
            {
                id: 'type_autres',
                label: 'Autres',
                icon: '❓',
                value: 0,
                color: 'secondary'
            }
        ],
        
        // ✅ NOUVEAU CALLBACK POUR MULTI-SÉLECTION
        onSelect: (selectedIds) => {
            console.log('📊 Cards sélectionnées:', selectedIds);
            
            // Mapping des cards vers les types de règlement
            const typeMap = {
                'type_cb': ['CB'],
                'type_cheque': ['CHEQUE'],
                'type_especes': ['ESPECES'],
                'type_virement': ['VIREMENT'],
                'type_tp_secu': ['TP_SECU'],
                'type_tp_mutuelle': ['TP_MUTUELLE'],
                'type_financement': ['COFIDIS', 'FRANFINANCE', 'EUROSSUR', 'SOFEMO', 'PAIEMENT_NFOIS'],
                'type_autres': ['BON_ACHAT', 'OD', 'MDPH', 'AGEFIPH', 'FIPHFP', 'WEB_STORE', 'AUTRE']
            };
            
            // Construire la liste des types sélectionnés
            const typesSelectionnes = [];
            selectedIds.forEach(cardId => {
                if (typeMap[cardId]) {
                    typesSelectionnes.push(...typeMap[cardId]);
                }
            });
            
            this.currentFilters.typesReglement = typesSelectionnes;
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
                key: 'clients',  // ✅ PLURIEL
                label: 'Clients',
                placeholder: 'Sélectionner des clients',
                options: [],
                searchable: true,
                multiple: true  // ✅ AJOUT MULTIPLE
            },
            { 
                type: 'select',
                key: 'magasins',  // ✅ PLURIEL
                label: 'Magasins',
                placeholder: 'Sélectionner des magasins',
                options: [],
                multiple: true  // ✅ AJOUT MULTIPLE
            },
            {
                type: 'date',
                key: 'dateDebut',
                label: 'Date début'
            },
            {
                type: 'date',
                key: 'dateFin',
                label: 'Date fin'
            }
        ],
        
        onFilter: (values) => {
            console.log('🔍 Valeurs reçues des filtres:', values);
            
            // ✅ GESTION CORRECTE DES ARRAYS
            this.currentFilters.clients = values.clients || [];
            this.currentFilters.magasins = values.magasins || [];
            this.currentFilters.dateDebut = values.dateDebut || '';
            this.currentFilters.dateFin = values.dateFin || '';
            
            console.log('📋 Filtres actuels:', this.currentFilters);
            
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
                        return `<input type="checkbox" class="reglement-checkbox" data-id="${row.id}" ${checked ? 'checked' : ''}>`;
                    }
                },
                {
                    key: 'date',
                    label: 'Date',
                    sortable: true,
                    width: 100,
                    formatter: (v) => {
                        if (!v) return '-';
                        const d = new Date(v);
                        return d.toLocaleDateString('fr-FR');
                    }
                },
                {
                    key: 'client',
                    label: 'Client',
                    sortable: true,
                    width: 250,
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
                    key: 'typeReglement',
                    label: 'Type règlement',
                    sortable: true,
                    width: 150,
                    html: true,
                    formatter: (type) => {
                        // ✅ Utilise CONFIG avec les codes transformés
                        const typeConfig = CONFIG.TYPES_REGLEMENT[type] || 
                                        { label: type || 'AUTRE', icon: '❓', color: 'secondary' };
                        
                        return `<span style="
                            background: var(--bs-${typeConfig.color}); 
                            color: white; 
                            padding: 2px 8px; 
                            border-radius: 4px; 
                            font-size: 11px;
                            font-weight: 600;
                            white-space: nowrap;
                        ">${typeConfig.icon} ${typeConfig.label}</span>`;
                    }
                },
                {
                    key: 'montant',
                    label: 'Montant',
                    sortable: true,
                    width: 120,
                    html: true,
                    formatter: (montant) => {
                        const formatted = new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR'
                        }).format(montant || 0);
                        
                        const color = montant > 0 ? '#28a745' : '#dc3545';
                        return `<span style="color: ${color}; font-weight: 600;">${formatted}</span>`;
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
                        this.filteredData.forEach(reg => this.selection.add(reg.id));
                    } else {
                        this.selection.clear();
                    }
                    this.updateGrid();
                    this.updateSelectionInfo();
                });
            }
            
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('reglement-checkbox')) {
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
            
            // ─── Chargement règlements ───
            const reglements = await firestoreService.getReglements({ limite: 5000 });
            
            this.reglementsData = reglements;
            console.log(`✅ ${this.reglementsData.length} règlements chargés`);
            
            // ─── Chargement statistiques ───
            this.statsData = await firestoreService.getStatistiques();
            console.log('✅ Statistiques chargées:', this.statsData);
            
            // ─── Mise à jour listes dynamiques ───
            this.updateDynamicLists();
            
            // ─── Mise à jour options filtres ───
            this.updateFilterOptions();
            
            // ─── Mise à jour affichage ───
            this.applyFilters();
            this.updateCardSelection();
            
            this.hideLoader();
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur chargement données : ' + error.message);
            console.error('Erreur complète:', error);
        }
    }
    
    updateDynamicLists() {
        this.clientsDynamiques.clear();
        this.magasinsDynamiques.clear();
        
        this.reglementsData.forEach(reg => {
            if (reg.client) this.clientsDynamiques.add(reg.client);
            if (reg.magasin) this.magasinsDynamiques.add(reg.magasin);
        });
        
        console.log('📊 Clients détectés:', Array.from(this.clientsDynamiques));
        console.log('📊 Magasins détectés:', Array.from(this.magasinsDynamiques));
    }
    
updateFilterOptions() {
    // Options clients
    const clientOptions = [];
    Array.from(this.clientsDynamiques)
        .sort()
        .forEach(client => {
            clientOptions.push({
                value: client,
                label: client
            });
        });
    
    // Options magasins  
    const magasinOptions = [];
    Array.from(this.magasinsDynamiques)
        .sort()
        .forEach(magasin => {
            magasinOptions.push({
                value: magasin,
                label: magasin === '-' ? 'Non défini' : magasin
            });
        });
    
    // ✅ CORRECTION - Utiliser les dropdowns directement
    if (this.filters && this.filters.state && this.filters.state.dropdowns) {
        // Pour clients
        const clientDropdown = this.filters.state.dropdowns.clients;
        if (clientDropdown) {
            clientDropdown.config.options = clientOptions;
            clientDropdown.filteredOptions = [...clientOptions];
            this.filters.renderDropdownOptions(clientDropdown);
        }
        
        // Pour magasins
        const magasinDropdown = this.filters.state.dropdowns.magasins;
        if (magasinDropdown) {
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
            title: 'Import de fichiers règlements',
            theme: 'blue',
            mode: 'simple',
            maxFiles: 10,
            acceptedTypes: ['text/csv', 'text/plain', 'application/vnd.ms-excel'],
            description: {
                icon: '💰',
                title: 'Import CSV règlements',
                text: 'Déposez jusqu\'à 10 fichiers CSV. Format détecté automatiquement.'
            },
            saveButtonText: '💰 Importer les règlements',
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
                    
                    this.showMessage(`Import des règlements ${i + 1}/${data.files.length}...`);
                    const resultatImport = await firestoreService.importerReglements(
                        resultatAnalyse.reglements,
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
            const totalImportees = resultats.importees.reduce((sum, r) => sum + r.nombre, 0);
            const totalDoublons = resultats.doublons.reduce((sum, r) => sum + r.nombre, 0);
            
            if (totalImportees > 0) {
                this.showSuccess(`✅ ${totalImportees} règlement(s) importé(s)`);
            }
            
            if (totalDoublons > 0) {
                this.showWarning(`⚠️ ${totalDoublons} doublon(s) ignoré(s)`);
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
            this.showWarning('Veuillez sélectionner au moins un règlement à supprimer');
            return;
        }
        
        const count = this.selection.size;
        const message = count === 1 
            ? 'Voulez-vous vraiment supprimer ce règlement ?' 
            : `Voulez-vous vraiment supprimer ces ${count} règlements ?`;
        
        if (!confirm(message)) {
            return;
        }
        
        try {
            this.showLoader();
            this.showInfo(`Suppression de ${count} règlement(s)...`);
            
            const promises = [];
            for (const id of this.selection) {
                promises.push(firestoreService.supprimerReglement(id));
            }
            
            await Promise.all(promises);
            
            this.selection.clear();
            
            await this.loadData();
            
            this.hideLoader();
            this.showSuccess(`✅ ${count} règlement(s) supprimé(s)`);
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur lors de la suppression : ' + error.message);
            console.error('Erreur suppression:', error);
        }
    }
    
    updateSelectionInfo() {
        console.log(`📝 ${this.selection.size} règlement(s) sélectionné(s)`);
    }
    
    // ┌────────────────────────────────────────┐
    // │      AFFICHAGE DÉTAIL                  │
    // └────────────────────────────────────────┘
    
    openDetailModal(row) {
        console.log('📋 Ouverture détails règlement:', row);
        
        const sections = [];
        
        sections.push({
            id: 'informations',
            title: '💰 Détails Règlement',
            fields: [
                { 
                    label: 'Date', 
                    value: row.date ? new Date(row.date).toLocaleDateString('fr-FR') : '-'
                },
                { 
                    label: 'Client', 
                    value: row.client || '-',
                    bold: true 
                },
                { 
                    label: 'Magasin', 
                    value: row.magasin || '-'
                },
                { 
                    label: 'Type de règlement', 
                    value: CONFIG.TYPES_REGLEMENT[row.typeReglement]?.label || row.typeReglement || '-'
                },
                { 
                    label: 'Montant', 
                    value: this.formaterMontant(row.montant || 0),
                    bold: true
                }
            ]
        });
        
        // Si données complémentaires
        if (row.numeroClient || row.numeroSecu || row.numeroCheque || row.tiersPayeur) {
            const fields = [];
            if (row.numeroClient) fields.push({ label: 'N° Client', value: row.numeroClient });
            if (row.numeroSecu) fields.push({ label: 'N° Sécu', value: row.numeroSecu });
            if (row.numeroCheque) fields.push({ label: 'N° Chèque', value: row.numeroCheque });
            if (row.tiersPayeur) fields.push({ label: 'Tiers Payeur', value: row.tiersPayeur });
            
            sections.push({
                id: 'complementaire',
                title: '📄 Informations complémentaires',
                fields: fields
            });
        }
        
        const viewer = new DetailViewerWidget({
            title: `Règlement ${row.reference || ''}`,
            subtitle: `${row.client || '-'} - ${this.formaterMontant(row.montant || 0)}`,
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
            clients: [],
            magasins: [],
            typesReglement: [],
            dateDebut: '',
            dateFin: ''
        };
        
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
    
    this.filteredData = this.reglementsData.filter(reglement => {
        // Filtre recherche
        if (this.currentFilters.search) {
            const search = this.currentFilters.search.toLowerCase();
            const searchIn = [
                (reglement.client || '').toLowerCase(),
                (reglement.magasin || '').toLowerCase(),
                (reglement.typeReglement || '').toLowerCase(),
                (reglement.montant || '').toString()
            ].join(' ');
            
            if (!searchIn.includes(search)) {
                return false;
            }
        }
        
        // ✅ FILTRE CLIENTS MULTIPLE
        if (this.currentFilters.clients && this.currentFilters.clients.length > 0) {
            if (!this.currentFilters.clients.includes(reglement.client)) {
                return false;
            }
        }
        
        // ✅ FILTRE MAGASINS MULTIPLE
        if (this.currentFilters.magasins && this.currentFilters.magasins.length > 0) {
            if (!this.currentFilters.magasins.includes(reglement.magasin)) {
                return false;
            }
        }
        
        // ✅ FILTRE TYPES (depuis les cards)
        if (this.currentFilters.typesReglement && this.currentFilters.typesReglement.length > 0) {
            if (!this.currentFilters.typesReglement.includes(reglement.typeReglement)) {
                return false;
            }
        }
        
        // Filtres dates
        if (this.currentFilters.dateDebut && reglement.date < this.currentFilters.dateDebut) {
            return false;
        }
        
        if (this.currentFilters.dateFin && reglement.date > this.currentFilters.dateFin) {
            return false;
        }
        
        return true;
    });
    
    this.updateGrid();
    this.updateStats();
    
    if (this.updateHeaderIndicators) {
        this.updateHeaderIndicators();
    }
    
    console.log(`✅ ${this.filteredData.length} règlements affichés`);
}
    
    updateGrid() {
        if (this.grid) {
            this.grid.setData(this.filteredData);
        }
    }
    
updateStats() {
    if (!this.stats) return;
    
    const statsParType = {
        cb: { montant: 0, nombre: 0 },
        cheque: { montant: 0, nombre: 0 },
        especes: { montant: 0, nombre: 0 },
        virement: { montant: 0, nombre: 0 },
        tp_secu: { montant: 0, nombre: 0 },
        tp_mutuelle: { montant: 0, nombre: 0 },
        financement: { montant: 0, nombre: 0 },
        autres: { montant: 0, nombre: 0 }
    };
    
    // ✅ COMPTER AVEC LES CODES TRANSFORMÉS
    this.filteredData.forEach(reglement => {
        const type = reglement.typeReglement || '';
        
        if (type === 'CB') {
            statsParType.cb.nombre++;
        }
        else if (type === 'CHEQUE') {  // ✅ Code transformé
            statsParType.cheque.nombre++;
        }
        else if (type === 'ESPECES') {  // ✅ Code transformé
            statsParType.especes.nombre++;
        }
        else if (type === 'VIREMENT') {  // ✅ Code transformé
            statsParType.virement.nombre++;
        }
        else if (type === 'TP_SECU') {  // ✅ Code transformé
            statsParType.tp_secu.nombre++;
        }
        else if (type === 'TP_MUTUELLE') {  // ✅ Code transformé
            statsParType.tp_mutuelle.nombre++;
        }
        else if (type === 'COFIDIS' || type === 'FRANFINANCE' || 
                 type === 'EUROSSUR' || type === 'SOFEMO' || 
                 type === 'PAIEMENT_NFOIS') {
            statsParType.financement.nombre++;
        }
        else if (type === 'BON_ACHAT' || type === 'OD' || 
                 type === 'MDPH' || type === 'AGEFIPH' || 
                 type === 'FIPHFP' || type === 'WEB_STORE' || 
                 type === 'AUTRE') {
            statsParType.autres.nombre++;
        }
        else {
            console.log('⚠️ Type non comptabilisé:', type);
            statsParType.autres.nombre++;
        }
    });
    
    // Mise à jour des cards
    this.stats.updateCard('type_cb', statsParType.cb.nombre);
    this.stats.updateCard('type_cheque', statsParType.cheque.nombre);
    this.stats.updateCard('type_especes', statsParType.especes.nombre);
    this.stats.updateCard('type_virement', statsParType.virement.nombre);
    this.stats.updateCard('type_tp_secu', statsParType.tp_secu.nombre);
    this.stats.updateCard('type_tp_mutuelle', statsParType.tp_mutuelle.nombre);
    this.stats.updateCard('type_financement', statsParType.financement.nombre);
    this.stats.updateCard('type_autres', statsParType.autres.nombre);
    
    console.log('📊 Stats calculées:', statsParType);
}
    
    // ─── MISE À JOUR VISUELLE DES CARDS SÉLECTIONNÉES ───
updateCardSelection() {
    if (!this.stats) return;
    
    // ✅ MAPPING AVEC LES CODES TRANSFORMÉS
    const typeMap = {
        'type_cb': ['CB'],
        'type_cheque': ['CHEQUE'],
        'type_especes': ['ESPECES'],
        'type_virement': ['VIREMENT'],
        'type_tp_secu': ['TP_SECU'],
        'type_tp_mutuelle': ['TP_MUTUELLE'],
        'type_financement': ['COFIDIS', 'FRANFINANCE', 'EUROSSUR', 'SOFEMO', 'PAIEMENT_NFOIS'],
        'type_autres': ['BON_ACHAT', 'OD', 'MDPH', 'AGEFIPH', 'FIPHFP', 'WEB_STORE', 'AUTRE']
    };
    
    // Pour chaque card, vérifier si elle est sélectionnée
    Object.keys(typeMap).forEach(cardId => {
        const types = typeMap[cardId];
        const isSelected = this.currentFilters.typesReglement && 
                          this.currentFilters.typesReglement.some(t => types.includes(t));
        
        // Ajouter/retirer classe active
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardElement) {
            if (isSelected) {
                cardElement.classList.add('active', 'selected');
            } else {
                cardElement.classList.remove('active', 'selected');
            }
        }
    });
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

const orchestrator = new ReglementOrchestrator();
export default orchestrator;