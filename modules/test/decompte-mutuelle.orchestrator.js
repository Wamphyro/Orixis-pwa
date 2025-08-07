// ========================================
// DECOMPTE-MUTUELLE.ORCHESTRATOR.JS - 🎯 ORCHESTRATEUR PRINCIPAL
// Chemin: modules/test/decompte-mutuelle.orchestrator.js
//
// DESCRIPTION:
// Orchestre toute la logique métier et coordonne les widgets
// Centralise les workflows, la gestion d'état et les interactions
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

// Import des services
import uploadService from './decompte-mutuelle.upload.service.js';
import firestoreService from './decompte-mutuelle.firestore.service.js';
import openaiService from './decompte-mutuelle.openai.service.js';

// Import Firebase
import { initFirebase } from '../../src/services/firebase.service.js';

// ========================================
// CLASSE ORCHESTRATEUR
// ========================================

class DecompteOrchestrator {
    constructor() {
        // Widgets
        this.header = null;
        this.stats = null;
        this.filters = null;
        this.grid = null;
        
        // Données
        this.decomptesData = [];
        this.statsData = {};
        this.filteredData = [];
        
        // État des filtres
        this.currentFilters = {
            search: '',
            statuts: [],  // Changé en tableau pour multi-sélection
            mutuelle: '',
            magasin: '',
            periode: 'all'
        };
        
        // Mutuelles et réseaux dynamiques
        this.mutuellesDynamiques = new Set();
        this.reseauxTPDynamiques = new Set();
        
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
            console.log('🚀 Initialisation de l\'orchestrateur...');
            
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
            title: 'Décomptes Mutuelles',
            icon: '📋',
            subtitle: 'Gestion des remboursements mutuelles',
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
                { id: 'nouveau', label: 'Nouveau', icon: '📋', value: 0, color: 'secondary' },
                { id: 'traitement_ia', label: 'Traitement IA', icon: '🤖', value: 0, color: 'info' },
                { id: 'traitement_effectue', label: 'Traité', icon: '✅', value: 0, color: 'success' },
                { id: 'traitement_manuel', label: 'Manuel', icon: '✏️', value: 0, color: 'warning' },
                { id: 'rapprochement_bancaire', label: 'Rapproché', icon: '🔗', value: 0, color: 'primary' },
                { id: 'total', label: 'Total virements', icon: '💰', value: '0 €', color: 'success' }
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
        filters: [
            { 
                type: 'search', 
                key: 'search', 
                placeholder: 'Rechercher (client, NSS, n° décompte)...' 
            },
            { 
                type: 'select', 
                key: 'mutuelle', 
                label: 'Mutuelle',
                options: [
                    { value: '', label: 'Toutes les mutuelles' }
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
            // Ne pas écraser statuts qui vient des cards
            this.currentFilters = { 
                ...this.currentFilters, 
                ...values,
                statuts: this.currentFilters.statuts  // Préserver les statuts
            };
            this.applyFilters();
        },
        onReset: () => {
            console.log('Réinitialisation de tous les filtres');
            // Réinitialiser tout
            this.currentFilters = {
                search: '',
                statuts: [],
                mutuelle: '',
                magasin: '',
                periode: 'all'
            };
            // Désélectionner toutes les cartes
            if (this.stats) {
                this.stats.deselectAll();
            }
            // Réappliquer les filtres (afficher tout)
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
                    key: 'numeroDecompte', 
                    label: 'N° Décompte', 
                    sortable: true, 
                    width: 140,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'dateVirement', 
                    label: 'Date virement', 
                    sortable: true, 
                    width: 110,
                    formatter: (v) => {
                        if (!v) return '-';
                        const date = v.toDate ? v.toDate() : new Date(v);
                        return date.toLocaleDateString('fr-FR');
                    }
                },
                { 
                    key: 'codeMagasin', 
                    label: 'Magasin', 
                    sortable: true, 
                    width: 80,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'client', 
                    label: 'Client(s)', 
                    sortable: true, 
                    width: 200,
                    formatter: (client, row) => {
                        // Si décompte groupé, afficher le nombre de clients
                        if (row && row.typeDecompte === 'groupe' && row.nombreClients > 1) {
                            const nomPrincipal = client ? `${client.prenom || ''} ${client.nom || ''}`.trim() : 'Clients multiples';
                            return `<strong>${nomPrincipal}</strong><br><small>+ ${row.nombreClients - 1} autre(s)</small>`;
                        }
                        // Sinon affichage normal
                        if (!client || (!client.nom && !client.prenom)) return '-';
                        return `${client.prenom || ''} ${client.nom || ''}`.trim() || '-';
                    }
                },
                { 
                    key: 'mutuelle', 
                    label: 'Mutuelle', 
                    sortable: true, 
                    width: 150,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'montantVirement', 
                    label: 'Montant', 
                    sortable: true, 
                    width: 100,
                    formatter: (v, row) => {
                        const montant = new Intl.NumberFormat('fr-FR', { 
                            style: 'currency', 
                            currency: 'EUR' 
                        }).format(v || 0);
                        // Ajouter une icône pour les décomptes groupés
                        if (row && row.typeDecompte === 'groupe' && row.nombreClients > 1) {
                            return `${montant} <span title="${row.nombreClients} clients">👥</span>`;
                        }
                        return montant;
                    }
                },
                { 
                    key: 'statut', 
                    label: 'Statut', 
                    sortable: true,
                    width: 120,
                    formatter: (v) => {
                        const statuts = {
                            'nouveau': { label: 'Nouveau', class: 'badge-secondary' },
                            'traitement_ia': { label: 'IA', class: 'badge-info' },
                            'traitement_effectue': { label: 'Traité', class: 'badge-success' },
                            'traitement_manuel': { label: 'Manuel', class: 'badge-warning' },
                            'rapprochement_bancaire': { label: 'Rapproché', class: 'badge-primary' },
                            'supprime': { label: 'Supprimé', class: 'badge-danger' }
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
                itemsPerPage: 10,
                pageSizeOptions: [10, 20, 50, 100],
                showPageInfo: true
            }
            // onRowClick désactivé - utiliser le bouton œil pour voir les détails
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
                        text: '➕ Nouveaux décomptes', 
                        class: 'btn btn-glass-blue btn-lg', 
                        action: () => this.openCreateModal()
                    },
                    { 
                        text: '🤖 Analyser non traités', 
                        class: 'btn btn-glass-purple btn-lg', 
                        action: () => this.analyserDecomptesNonTraites()
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
            
            // Charger les décomptes
            this.decomptesData = await firestoreService.getDecomptes({ limite: 100 });
            console.log(`✅ ${this.decomptesData.length} décomptes chargés`);
            
            // Charger les stats
            this.statsData = await firestoreService.getStatistiques();
            console.log('✅ Statistiques chargées:', this.statsData);
            
            // Mettre à jour les mutuelles dynamiques
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
        this.mutuellesDynamiques.clear();
        this.reseauxTPDynamiques.clear();
        
        this.decomptesData.forEach(decompte => {
            if (decompte.mutuelle) {
                this.mutuellesDynamiques.add(decompte.mutuelle);
            }
            if (decompte.prestataireTP) {
                this.reseauxTPDynamiques.add(decompte.prestataireTP);
            }
        });
        
        console.log('📊 Mutuelles:', Array.from(this.mutuellesDynamiques));
        console.log('📊 Réseaux TP:', Array.from(this.reseauxTPDynamiques));
    }
    
    // ========================================
    // ANALYSE IA
    // ========================================
    
    /**
     * Analyser un décompte existant avec l'IA
     */
    async analyserDecompteExistant(decompteId) {
        try {
            console.log('🤖 Analyse du décompte existant:', decompteId);
            this.showLoader();
            this.showMessage('Analyse IA en cours...');
            
            // Récupérer le décompte
            const decompte = await firestoreService.getDecompteById(decompteId);
            if (!decompte) {
                throw new Error('Décompte introuvable');
            }
            
            if (!decompte.documents || decompte.documents.length === 0) {
                throw new Error('Aucun document à analyser');
            }
            
            // Charger les magasins pour FINESS
            const magasins = await firestoreService.chargerMagasins();
            
            // Analyser le premier document
            const document = decompte.documents[0];
            console.log('📄 Analyse du document:', document.nom);
            
            // Analyser avec l'URL du document
            const donneesExtraites = await openaiService.analyserDocument(
                document.url,
                document.type,
                magasins
            );
            
            console.log('📊 Données extraites:', donneesExtraites);
            
            // Ajouter les données au décompte
            await firestoreService.ajouterDonneesExtraites(decompteId, donneesExtraites);
            
            this.showSuccess('Analyse IA terminée avec succès !');
            
            // Rafraîchir les données
            await this.loadData();
            
            this.hideLoader();
            return donneesExtraites;
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur analyse IA : ' + error.message);
            console.error('Erreur complète:', error);
            throw error;
        }
    }
    
    /**
     * Analyser tous les décomptes non traités
     */
    async analyserDecomptesNonTraites() {
        const decomptesNonTraites = this.decomptesData.filter(d => 
            d.statut === 'nouveau' && d.documents && d.documents.length > 0
        );
        
        if (decomptesNonTraites.length === 0) {
            this.showMessage('Aucun décompte à analyser');
            return;
        }
        
        const confirmation = confirm(`Analyser ${decomptesNonTraites.length} décompte(s) non traité(s) ?`);
        if (!confirmation) return;
        
        for (const decompte of decomptesNonTraites) {
            try {
                console.log(`📋 Analyse du décompte ${decompte.numeroDecompte}...`);
                await this.analyserDecompteExistant(decompte.id);
            } catch (error) {
                console.error(`❌ Erreur analyse ${decompte.numeroDecompte}:`, error);
            }
        }
        
        this.showSuccess(`Analyse terminée pour ${decomptesNonTraites.length} décompte(s)`);
    }
    
    // ========================================
    // CRÉATION DE DÉCOMPTE
    // ========================================
    
    /**
     * Ouvrir le modal de création
     */
    openCreateModal() {
        const uploader = new PdfUploaderWidget({
            title: 'Nouveaux Décomptes',
            theme: 'purple',
            mode: 'simple',
            description: {
                icon: '📄',
                title: 'Upload de décomptes mutuelles',
                text: 'Déposez vos fichiers PDF ou images. Chaque fichier créera un décompte séparé et sera analysé automatiquement.'
            },
            saveButtonText: '💾 Créer les décomptes',
            onSave: async (data) => this.handleCreateDecompte(data),
            onClose: () => {
                console.log('Modal création fermé');
            }
        });
    }
    
    /**
     * Gérer la création d'un décompte
     */
    async handleCreateDecompte(data) {
        try {
            console.log('📁 Création de', data.files.length, 'décompte(s)...');
            this.showLoader();
            
            const resultats = {
                crees: [],
                analyses: [],
                erreurs: []
            };
            
            // Charger les magasins une seule fois
            const magasins = await firestoreService.chargerMagasins();
            
            // TRAITER CHAQUE FICHIER INDIVIDUELLEMENT
            for (let i = 0; i < data.files.length; i++) {
                const file = data.files[i];
                const numero = i + 1;
                
                try {
                    console.log(`\n📄 Traitement fichier ${numero}/${data.files.length}: ${file.name}`);
                    
                    // ÉTAPE 1 : Upload du document
                    this.showMessage(`Upload du document ${numero}/${data.files.length}...`);
                    const resultatsUpload = await uploadService.uploadDocuments([file]);
                    
                    if (resultatsUpload.erreurs.length > 0) {
                        throw new Error(resultatsUpload.erreurs[0].erreur);
                    }
                    
                    if (resultatsUpload.reussis.length === 0) {
                        throw new Error('Upload échoué');
                    }
                    
                    console.log('✅ Document uploadé:', resultatsUpload.reussis[0]);
                    
                    // ÉTAPE 2 : Créer un décompte pour CE document
                    this.showMessage(`Création du décompte ${numero}/${data.files.length}...`);
                    const decompteId = await firestoreService.creerDecompte({
                        documents: resultatsUpload.reussis
                    });
                    
                    console.log('✅ Décompte créé avec ID:', decompteId);
                    resultats.crees.push({
                        id: decompteId,
                        fichier: file.name
                    });
                    
                    // ÉTAPE 3 : Analyse IA automatique pour CE décompte
                    this.showMessage(`Analyse IA ${numero}/${data.files.length}...`);
                    try {
                        // Passer directement le fichier original pour éviter CORS
                        const donneesExtraites = await openaiService.analyserAvecFichier(
                            file, // Fichier original
                            magasins // Magasins pour FINESS
                        );
                        
                        // Ajouter les données extraites au décompte
                        await firestoreService.ajouterDonneesExtraites(decompteId, donneesExtraites);
                        
                        console.log('✅ Analyse IA terminée:', donneesExtraites);
                        resultats.analyses.push({
                            id: decompteId,
                            fichier: file.name,
                            donnees: donneesExtraites
                        });
                        
                    } catch (errorIA) {
                        console.warn('⚠️ Analyse IA échouée:', errorIA);
                        // Le décompte est créé mais l'analyse a échoué
                        resultats.erreurs.push({
                            fichier: file.name,
                            erreur: `Analyse IA échouée: ${errorIA.message}`,
                            decompteId: decompteId
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
                this.showSuccess(`✅ ${resultats.crees.length} décompte(s) créé(s)`);
            }
            
            if (resultats.analyses.length > 0) {
                this.showSuccess(`🤖 ${resultats.analyses.length} décompte(s) analysé(s) avec succès`);
            }
            
            if (resultats.erreurs.length > 0) {
                resultats.erreurs.forEach(err => {
                    this.showError(`❌ ${err.fichier}: ${err.erreur}`);
                });
            }
            
            // ÉTAPE 5 : Rafraîchir les données
            await this.loadData();
            
            this.hideLoader();
            
            // Retourner true si au moins un décompte créé
            return resultats.crees.length > 0;
            
        } catch (error) {
            this.hideLoader();
            this.showError('Erreur création : ' + error.message);
            console.error('Erreur complète:', error);
            throw error; // Empêche la fermeture du modal
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
    
    // Timeline (existant)
// Formater les dates (compatible Firestore Timestamp)
const formatDate = (date) => {
    if (!date) return '';
    try {
        let d;
        
        // Si c'est un Timestamp Firestore
        if (date.seconds !== undefined) {
            d = new Date(date.seconds * 1000);
        }
        // Si c'est déjà une Date
        else if (date instanceof Date) {
            d = date;
        }
        // Si c'est une string ou number
        else {
            d = new Date(date);
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
};

const timeline = {
    enabled: true,
    orientation: 'horizontal',
    items: [
        { 
            label: 'Nouveau', 
            status: row.statut === 'nouveau' ? 'active' : 'completed',
            icon: '📋',
            date: formatDate(row.dates?.creation),
            description: 'Création du décompte'
        },
        { 
            label: 'Traitement IA', 
            status: row.statut === 'traitement_ia' ? 'active' : 
                    ['nouveau'].includes(row.statut) ? 'pending' : 'completed',
            icon: '🤖',
            date: formatDate(row.dates?.transmissionIA),
            description: 'Analyse automatique'
        },
        { 
            label: 'Traité', 
            status: row.statut === 'traitement_effectue' ? 'active' : 
                    ['nouveau', 'traitement_ia'].includes(row.statut) ? 'pending' : 'completed',
            icon: '✅',
            date: formatDate(row.dates?.traitementEffectue),
            description: 'Validation des données'
        },
        { 
            label: 'Rapproché', 
            status: row.statut === 'rapprochement_bancaire' ? 'completed' : 'pending',
            icon: '🔗',
            date: formatDate(row.dates?.rapprochementBancaire),
            description: 'Virement confirmé'
        }
    ],
    theme: 'colorful',
    size: 'medium',  // Changé de 'small' à 'medium' pour avoir plus de place
    showDates: true,   // ✅ Pour afficher les dates
    showLabels: true   // ✅ Pour afficher les labels
};
    
    // Sections dynamiques
    let sections = [];
    
    // Si décompte groupé avec plusieurs clients
    if (row.typeDecompte === 'groupe' && row.clients && row.clients.length > 1) {
        // Section récapitulatif
        sections.push({
            id: 'recap',
            title: `👥 Décompte Groupé - ${row.clients.length} clients`,
            fields: [
                { label: 'Type', value: 'Décompte groupé' },
                { label: 'Nombre de clients', value: row.clients.length },
                { label: 'Magasin', key: 'codeMagasin' },
                { 
                    label: 'Montant total virement', 
                    value: self.formaterMontant(row.montantVirement || 0),
                    bold: true
                }
            ]
        });
        
        // Section pour CHAQUE client
        row.clients.forEach((client, index) => {
            sections.push({
                id: `client-${index}`,
                title: `👤 Client ${index + 1}: ${client.prenom || ''} ${client.nom || ''}`,
                fields: [
                    { label: 'Nom', value: client.nom || '-' },
                    { label: 'Prénom', value: client.prenom || '-' },
                    { label: 'NSS', value: self.formaterNSS(client.numeroSecuriteSociale) },
                    { label: 'N° Adhérent', value: client.numeroAdherent || '-' },
                    { 
                        label: 'Montant remboursement', 
                        value: self.formaterMontant(client.montantRemboursement || 0),
                        bold: true
                    }
                ]
            });
        });
        
    } else {
        // Décompte simple (1 seul client)
        sections.push({
            id: 'client',
            title: '👤 Informations Client',
            fields: [
                { label: 'Client', value: `${row.client?.prenom || ''} ${row.client?.nom || ''}`.trim() || '-' },
                { label: 'NSS', value: self.formaterNSS(row.client?.numeroSecuriteSociale) },
                { label: 'N° Adhérent', value: row.client?.numeroAdherent || '-' },
                { label: 'Magasin', key: 'codeMagasin' }
            ]
        });
    }
    
    // Section financière (commune)
    sections.push({
        id: 'financier',
        title: '💰 Données Financières',
        fields: [
            { label: 'Mutuelle', key: 'mutuelle' },
            { label: 'Prestataire TP', key: 'prestataireTP' },
            { 
                label: row.typeDecompte === 'groupe' ? 'Montant total virement' : 'Montant virement',
                key: 'montantVirement',
                formatter: (v) => self.formaterMontant(v || 0),
                bold: true
            }
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
                            📎 ${d.nomOriginal || d.nom}
                            <a href="${d.url}" target="_blank" style="margin-left: 10px;">Voir</a>
                        </div>
                    `).join('');
                },
                html: true
            }
        ]
    });
    
    // Créer le viewer
    new DetailViewerWidget({
        title: `Décompte ${row.numeroDecompte}`,
        subtitle: row.typeDecompte === 'groupe' 
            ? `👥 ${row.clients?.length || row.nombreClients} clients - ${row.codeMagasin}`
            : `${row.client?.prenom || ''} ${row.client?.nom || ''} - ${row.codeMagasin}`,
        data: row,
        timeline: timeline,
        sections: sections,
        actions: [
            {
                label: '🤖 Analyser avec IA',
                class: 'btn btn-glass-purple btn-lg',
                onClick: async (data) => {
                    try {
                        await self.analyserDecompteExistant(data.id);
                        return true;
                    } catch (error) {
                        self.showError('Erreur analyse : ' + error.message);
                        return false;
                    }
                },
                closeOnClick: true,
                show: (data) => data.statut === 'nouveau'
            },
            {
                label: '✅ Valider',
                class: 'btn btn-glass-green btn-lg',
                onClick: async (data) => {
                    try {
                        await firestoreService.changerStatut(data.id, 'rapprochement_bancaire');
                        self.showSuccess('Décompte validé !');
                        await self.loadData();
                        return true;
                    } catch (error) {
                        self.showError('Erreur validation : ' + error.message);
                        return false;
                    }
                },
                closeOnClick: true,
                show: (data) => data.statut === 'traitement_effectue'
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
        console.log('🔍 Application des filtres:', {
            ...this.currentFilters,
            nbStatutsSelectionnes: this.currentFilters.statuts.length
        });
        
        this.filteredData = this.decomptesData.filter(decompte => {
            // Filtre recherche
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                const clientNom = `${decompte.client?.prenom || ''} ${decompte.client?.nom || ''}`.toLowerCase();
                const numero = (decompte.numeroDecompte || '').toLowerCase();
                const nss = (decompte.client?.numeroSecuriteSociale || '').replace(/\s/g, '');
                
                if (!clientNom.includes(search) && 
                    !numero.includes(search) && 
                    !nss.includes(search.replace(/\s/g, ''))) {
                    return false;
                }
            }
            
            // Filtre statuts (multiple)
            if (this.currentFilters.statuts && this.currentFilters.statuts.length > 0) {
                if (!this.currentFilters.statuts.includes(decompte.statut)) {
                    return false;
                }
            }
            
            // Filtre mutuelle
            if (this.currentFilters.mutuelle && decompte.mutuelle !== this.currentFilters.mutuelle) {
                return false;
            }
            
            // Filtre magasin
            if (this.currentFilters.magasin && decompte.codeMagasin !== this.currentFilters.magasin) {
                return false;
            }
            
            // Filtre période
            if (this.currentFilters.periode !== 'all' && decompte.dateVirement) {
                const date = decompte.dateVirement.toDate ? decompte.dateVirement.toDate() : new Date(decompte.dateVirement);
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
            console.log(`✅ ${this.filteredData.length} décomptes affichés`);
        }
    }
    
    /**
     * Mettre à jour les statistiques
     */
    updateStats() {
        if (!this.stats || !this.statsData) return;
        
        // Préparer les données pour les cartes
        const cardsData = {
            nouveau: this.statsData.parStatut?.nouveau || 0,
            traitement_ia: this.statsData.parStatut?.traitement_ia || 0,
            traitement_effectue: this.statsData.parStatut?.traitement_effectue || 0,
            traitement_manuel: this.statsData.parStatut?.traitement_manuel || 0,
            rapprochement_bancaire: this.statsData.parStatut?.rapprochement_bancaire || 0,
            total: this.formaterMontant(this.statsData.montantTotal || 0)
        };
        
        this.stats.updateAll(cardsData);
        console.log('📊 Stats mises à jour:', cardsData);
    }
    
    /**
     * Mettre à jour les options de filtres
     */
    updateFilterOptions() {
        // Récupérer les mutuelles et magasins uniques
        const mutuelles = Array.from(this.mutuellesDynamiques).sort();
        const magasins = [...new Set(this.decomptesData.map(d => d.codeMagasin).filter(Boolean))].sort();
        
        // TODO: Mettre à jour les options des filtres dynamiquement
        // (nécessite une méthode updateOptions dans SearchFiltersWidget)
        
        console.log('📋 Mutuelles disponibles:', mutuelles);
        console.log('🏪 Magasins disponibles:', magasins);
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
     * Formater un NSS
     */
    formaterNSS(nss) {
        if (!nss) return '-';
        
        // Retirer tous les espaces existants
        const nssClean = nss.replace(/\s/g, '');
        
        // Formater : 1 85 05 78 006 048 22
        if (nssClean.length === 13) {
            return `${nssClean[0]} ${nssClean.slice(1,3)} ${nssClean.slice(3,5)} ${nssClean.slice(5,7)} ${nssClean.slice(7,10)} ${nssClean.slice(10,13)}`;
        }
        
        if (nssClean.length === 15) {
            return `${nssClean[0]} ${nssClean.slice(1,3)} ${nssClean.slice(3,5)} ${nssClean.slice(5,7)} ${nssClean.slice(7,10)} ${nssClean.slice(10,13)} ${nssClean.slice(13)}`;
        }
        
        return nss; // Retourner tel quel si format incorrect
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
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        
        const div = document.createElement('div');
        div.className = type === 'error' ? 'error-message' : 'success-message';
        div.textContent = message;
        container.appendChild(div);
        
        setTimeout(() => {
            div.remove();
        }, 5000);
    }
    
    showError(message) {
        this.showMessage(message, 'error');
        console.error('❌', message);
    }
    
    showSuccess(message) {
        this.showMessage(message, 'success');
        console.log('✅', message);
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const orchestrator = new DecompteOrchestrator();
export default orchestrator;

/* ========================================
   HISTORIQUE
   
   [08/02/2025] - Création
   - Orchestrateur principal
   - Centralise toute la logique métier
   - Coordonne les widgets et services
   - Gère l'état de l'application
   ======================================== */