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
import { FacturesFournisseursService } from './factures-fournisseurs.service.js';

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
        
        // Ajouter les boutons d'action
        this.addActionButtons();
        
        console.log('✅ Widgets créés');
    }
    
    /**
     * Créer le header
     */
    createHeader() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        this.header = new HeaderWidget({
            title: '📑 Factures Fournisseurs',
            icon: '📑',
            subtitle: 'Gestion des factures à payer',
            showBack: true,
            showUser: true,
            showLogout: true
        });
        
        // Personnaliser les boutons
        setTimeout(() => {
            const backContainer = document.querySelector(`#header-back-${this.header.id}`);
            if (backContainer) {
                const backBtn = document.createElement('button');
                backBtn.className = 'btn btn-glass-solid-ice btn-sm';
                backBtn.innerHTML = '<<';
                backBtn.onclick = () => {
                    console.log('Retour cliqué');
                    window.location.href = '/modules/home/home.html';
                };
                backContainer.appendChild(backBtn);
            }
            
            const logoutContainer = document.querySelector(`#header-logout-${this.header.id}`);
            if (logoutContainer) {
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'btn btn-logout-user';
                logoutBtn.innerHTML = 'Déconnexion';
                logoutBtn.onclick = () => {
                    this.header.defaultLogout();
                };
                logoutContainer.appendChild(logoutBtn);
            }
        }, 100);
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
            resetButton: true,
            resetButtonClass: 'btn btn-glass-orange',
            filters: [
                { 
                    type: 'search', 
                    key: 'search', 
                    placeholder: 'Rechercher (fournisseur, n° facture, référence)...' 
                },
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
                    key: 'categorie', 
                    label: 'Catégorie',
                    options: [
                        { value: '', label: 'Toutes les catégories' },
                        { value: 'telecom', label: 'Télécom' },
                        { value: 'energie', label: 'Énergie' },
                        { value: 'services', label: 'Services' },
                        { value: 'informatique', label: 'Informatique' },
                        { value: 'fournitures', label: 'Fournitures' },
                        { value: 'autre', label: 'Autre' }
                    ]
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
                    categorie: values.categorie || '',
                    magasin: values.magasin || '',
                    periode: values.periode || 'all',
                    statuts: this.currentFilters.statuts  // Préserver les statuts des cartes
                };
                
                this.applyFilters();
            },
            onReset: () => {
                console.log('Réinitialisation de tous les filtres');
                this.currentFilters = {
                    search: '',
                    statuts: [],
                    fournisseur: '',
                    categorie: '',
                    magasin: '',
                    periode: 'all'
                };
                // Désélectionner toutes les cartes
                if (this.stats) {
                    this.stats.deselectAll();
                }
                this.applyFilters();
            }
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
                    key: 'numeroFacture', 
                    label: 'N° Facture', 
                    sortable: true, 
                    width: 140,
                    formatter: (v, row) => v || row.numeroInterne || '-'
                },
                { 
                    key: 'dateFacture', 
                    label: 'Date facture', 
                    sortable: true, 
                    width: 110,
                    formatter: (v) => {
                        if (!v) return '-';
                        const date = v.toDate ? v.toDate() : new Date(v);
                        return date.toLocaleDateString('fr-FR');
                    }
                },
                { 
                    key: 'fournisseur', 
                    label: 'Fournisseur', 
                    sortable: true, 
                    width: 200,
                    formatter: (fournisseur) => {
                        if (!fournisseur || !fournisseur.nom) return '-';
                        return `<strong>${fournisseur.nom}</strong>${fournisseur.categorie ? `<br><small>${fournisseur.categorie}</small>` : ''}`;
                    }
                },
                { 
                    key: 'montantTTC', 
                    label: 'Montant TTC', 
                    sortable: true, 
                    width: 120,
                    formatter: (v) => {
                        return new Intl.NumberFormat('fr-FR', { 
                            style: 'currency', 
                            currency: 'EUR' 
                        }).format(v || 0);
                    }
                },
                { 
                    key: 'dateEcheance', 
                    label: 'Échéance', 
                    sortable: true, 
                    width: 130,
                    formatter: (v, row) => {
                        if (!v) return '-';
                        const date = v.toDate ? v.toDate() : new Date(v);
                        const dateStr = date.toLocaleDateString('fr-FR');
                        
                        // Vérifier si en retard
                        if (row.statut === 'a_payer' || row.statut === 'en_retard') {
                            const aujourd = new Date();
                            if (date < aujourd) {
                                const jours = Math.floor((aujourd - date) / (1000 * 60 * 60 * 24));
                                return `<span style="color: #dc2626; font-weight: 600;">${dateStr} (${jours}j de retard)</span>`;
                            } else if ((date - aujourd) / (1000 * 60 * 60 * 24) <= 7) {
                                return `<span style="color: #f97316;">${dateStr}</span>`;
                            }
                        }
                        return dateStr;
                    }
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
                selection: false,
                pagination: true,
                resize: false
            },
            pagination: {
                itemsPerPage: 20,
                pageSizeOptions: [10, 20, 50, 100],
                showPageInfo: true
            }
        });
    }
    
    /**
     * Ajouter les boutons d'action
     */
    addActionButtons() {
        setTimeout(() => {
            const actionsZone = document.querySelector('.data-grid-export-buttons');
            if (actionsZone) {
                const buttons = [
                    { 
                        text: '➕ Nouvelles factures', 
                        class: 'btn btn-glass-blue btn-lg', 
                        action: () => this.openCreateModal()
                    },
                    { 
                        text: '📄 Export CSV', 
                        class: 'btn btn-glass-blue btn-lg', 
                        action: () => this.grid.export('csv')
                    },
                    { 
                        text: '📊 Export Excel', 
                        class: 'btn btn-glass-blue btn-lg', 
                        action: () => this.grid.export('excel')
                    }
                ];
                
                buttons.forEach(btn => {
                    const button = document.createElement('button');
                    button.className = btn.class;
                    button.innerHTML = btn.text;
                    button.onclick = btn.action;
                    actionsZone.appendChild(button);
                });
            }
        }, 100);
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
            theme: 'red',  // Rouge pour factures (vs purple pour décomptes)
            mode: 'advanced',  // Mode avancé avec sélection du statut
            description: {
                icon: '📑',
                title: 'Upload de factures fournisseurs',
                text: 'Déposez vos factures (Free, EDF, Orange, etc.). Chaque fichier créera une facture séparée et sera analysé automatiquement.'
            },
            // Options pour sélection du statut initial
            statusOptions: [
                { value: 'a_payer', label: '💳 À payer', default: false },
                { value: 'deja_payee', label: '✅ Déjà payée', default: true }
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
                    const resultatsUpload = await uploadService.uploadFactureDocument(file);
                    
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
                    this.showError(`❌ ${err.fichier}: ${err.erreur}`);
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
     * Ouvrir le modal de détail
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
                    date: this.formatDate(row.dates?.paiement),
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
        
        // Section fournisseur
        sections.push({
            id: 'fournisseur',
            title: '🏢 Informations Fournisseur',
            fields: [
                { label: 'Nom', value: row.fournisseur?.nom || '-' },
                { label: 'Catégorie', value: row.fournisseur?.categorie || '-' },
                { label: 'N° Client', value: row.fournisseur?.numeroClient || '-' },
                { label: 'SIREN', value: row.fournisseur?.siren || '-' }
            ]
        });
        
        // Section financière
        sections.push({
            id: 'financier',
            title: '💰 Données Financières',
            fields: [
                { label: 'Montant HT', value: self.formaterMontant(row.montantHT || 0) },
                { label: `TVA (${row.tauxTVA || 20}%)`, value: self.formaterMontant(row.montantTVA || 0) },
                { 
                    label: 'Montant TTC',
                    value: self.formaterMontant(row.montantTTC || 0),
                    bold: true
                }
            ]
        });
        
        // Section dates
        sections.push({
            id: 'dates',
            title: '📅 Dates',
            fields: [
                { label: 'Date facture', value: this.formatDate(row.dateFacture) },
                { label: 'Date échéance', value: this.formatDate(row.dateEcheance) },
                { label: 'Date réception', value: this.formatDate(row.dateReception) }
            ]
        });
        
        // Section documents
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
                            <div style="margin: 5px 0;">
                                📎 ${d.nom}
                                <a href="${d.url}" target="_blank" style="margin-left: 10px;">Voir</a>
                            </div>
                        `).join('');
                    },
                    html: true
                }
            ]
        });
        
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
            size: 'large',
            theme: 'default',
            destroyOnClose: true
        });
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
            // Filtre recherche
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                const fournisseurNom = facture.fournisseur?.nom?.toLowerCase() || '';
                const numeroFacture = (facture.numeroFacture || '').toLowerCase();
                const numeroInterne = (facture.numeroInterne || '').toLowerCase();
                const referenceVirement = (facture.referenceVirement || '').toLowerCase();
                
                if (!fournisseurNom.includes(search) && 
                    !numeroFacture.includes(search) && 
                    !numeroInterne.includes(search) &&
                    !referenceVirement.includes(search)) {
                    return false;
                }
            }
            
            // Filtre statuts (multiple)
            if (this.currentFilters.statuts && this.currentFilters.statuts.length > 0) {
                if (!this.currentFilters.statuts.includes(facture.statut)) {
                    return false;
                }
            }
            
            // Filtre fournisseur
            if (this.currentFilters.fournisseur && facture.fournisseur?.nom !== this.currentFilters.fournisseur) {
                return false;
            }
            
            // Filtre catégorie
            if (this.currentFilters.categorie && facture.fournisseur?.categorie !== this.currentFilters.categorie) {
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