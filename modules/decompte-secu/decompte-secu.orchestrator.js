// ========================================
// DECOMPTE-SECU.ORCHESTRATOR.JS - 🎯 ORCHESTRATEUR PRINCIPAL
// Chemin: modules/decompte-secu/decompte-secu.orchestrator.js
//
// DESCRIPTION:
// Orchestrateur unique pour décomptes sécurité sociale audioprothèse
// Basé sur l'architecture des décomptes mutuelles
// Gère les virements CPAM avec multiples bénéficiaires
//
// VERSION: 1.0.0
// DATE: 08/01/2025
// ========================================

// Import des widgets
import { HeaderWidget } from '../../widgets/header/header.widget.js';
import { StatsCardsWidget } from '../../widgets/stats-cards/stats-cards.widget.js';
import { SearchFiltersWidget } from '../../widgets/search-filters/search-filters.widget.js';
import { DataGridWidget } from '../../widgets/data-grid/data-grid.widget.js';
import { PdfUploaderWidget } from '../../widgets/pdf-uploader/pdf-uploader.widget.js';
import { DetailViewerWidget } from '../../widgets/detail-viewer/detail-viewer.widget.js';
import { ProgressBar } from '../../src/components/ui/progress-bar/progress-bar.component.js';
import toast from '../../widgets/toast/toast.widget.js';

// Import des services
import uploadService from './decompte-secu.upload.service.js';
import firestoreService from './decompte-secu.firestore.service.js';
import openaiService from './decompte-secu.openai.service.js';

// Import Firebase
import { initFirebase } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    STATUTS: {
        NOUVEAU: 'nouveau',
        TRAITEMENT_IA: 'traitement_ia',
        TRAITEMENT_EFFECTUE: 'traitement_effectue',
        RAPPROCHEMENT_BANCAIRE: 'rapprochement_bancaire',
        SUPPRIME: 'supprime'
    },
    
    STATUTS_INFO: {
        nouveau: {
            label: 'Nouveau',
            suivant: 'traitement_ia'
        },
        traitement_ia: {
            label: 'Analyse IA',
            suivant: 'traitement_effectue'
        },
        traitement_effectue: {
            label: 'Traité',
            suivant: 'rapprochement_bancaire'
        },
        rapprochement_bancaire: {
            label: 'Rapproché',
            suivant: null
        },
        supprime: {
            label: 'Supprimé',
            suivant: null
        }
    }
};

// ========================================
// CLASSE ORCHESTRATEUR
// ========================================

class DecompteSecuOrchestrator {
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
            statuts: [],
            caisse: '',
            magasin: '',
            periode: 'all'
        };
        
        // Caisses dynamiques extraites des données
        this.caissesDynamiques = new Set();
        
        // Cache des magasins
        this.magasinsCache = null;
        
        // État de l'application
        this.isLoading = false;
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init() {
        try {
            this.showLoader();
            console.log('🚀 Initialisation orchestrateur décomptes sécu audio...');
            
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
            
            // Charger les magasins
            console.log('🏪 Chargement des magasins...');
            this.magasinsCache = await firestoreService.chargerMagasins();
            console.log(`✅ ${this.magasinsCache.length} magasins chargés`);
            
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
        
        // Ajouter les boutons d'action
        this.addActionButtons();
        
        console.log('✅ Widgets créés');
    }
    
    createHeader() {
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        
        this.header = new HeaderWidget({
            title: 'Décomptes Sécurité Sociale',
            icon: '🏥',
            subtitle: 'Gestion des remboursements régime obligatoire',
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
                { id: 'traitement_ia', label: 'Analyse IA', icon: '🤖', value: 0, color: 'info' },
                { id: 'traitement_effectue', label: 'Traité', icon: '✅', value: 0, color: 'success' },
                { id: 'rapprochement_bancaire', label: 'Rapproché', icon: '🔗', value: 0, color: 'primary' },
                { id: 'total', label: 'Total virements', icon: '💰', value: '0 €', color: 'success' }
            ],
            onSelect: (selectedIds) => {
                console.log('Filtres par statuts:', selectedIds);
                this.currentFilters.statuts = selectedIds.filter(id => id !== 'total');
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
            resetButton: true,
            resetButtonClass: 'btn btn-glass-orange',
            filters: [
                { 
                    type: 'search', 
                    key: 'search', 
                    placeholder: 'Rechercher (bénéficiaire, n° virement, caisse)...' 
                },
                { 
                    type: 'select', 
                    key: 'caisse', 
                    label: 'Caisse CPAM',
                    options: [
                        { value: '', label: 'Toutes les caisses' }
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
                    caisse: values.caisse || '',
                    magasin: values.magasin || '',
                    periode: values.periode || 'all',
                    statuts: this.currentFilters.statuts
                };
                
                this.applyFilters();
            },
            onReset: () => {
                console.log('Réinitialisation des filtres');
                this.currentFilters = {
                    search: '',
                    statuts: [],
                    caisse: '',
                    magasin: '',
                    periode: 'all'
                };
                
                if (this.stats) {
                    this.stats.deselectAll();
                }
                
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
                    key: 'numeroDecompte', 
                    label: 'N° Décompte',
                    sortable: true,
                    width: 140
                },
                { 
                    key: 'numeroVirement', 
                    label: 'Réf. Virement',
                    width: 120,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'dateVirement', 
                    label: 'Date Virement',
                    sortable: true,
                    width: 110,
                    formatter: (date) => {
                        if (!date) return '-';
                        const d = date.toDate ? date.toDate() : new Date(date);
                        return d.toLocaleDateString('fr-FR');
                    }
                },
                { 
                    key: 'nombreBeneficiaires', 
                    label: 'Patients',
                    width: 80,
                    formatter: (nb) => {
                        if (!nb || nb === 0) return '-';
                        return `<span class="badge badge-primary">${nb}</span>`;
                    }
                },
                { 
                    key: 'montantVirement', 
                    label: 'Montant',
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
                    key: 'caissePrimaire', 
                    label: 'Caisse',
                    sortable: true,
                    width: 150
                },
                { 
                    key: 'codeMagasin', 
                    label: 'Magasin',
                    sortable: true,
                    width: 80
                },
                { 
                    key: 'societe', 
                    label: 'Société',
                    width: 150,
                    formatter: (v) => v || '-'
                },
                { 
                    key: 'statutRapprochement', 
                    label: 'Rapprochement',
                    width: 120,
                    formatter: (statut) => {
                        const statuts = {
                            'en_attente': { 
                                label: 'En attente', 
                                class: 'badge-warning',
                                icon: '⏳'
                            },
                            'rapproche': { 
                                label: 'Rapproché', 
                                class: 'badge-success',
                                icon: '✅'
                            },
                            'ecart': {
                                label: 'Écart détecté',
                                class: 'badge-danger',
                                icon: '⚠️'
                            }
                        };
                        const s = statuts[statut] || statuts['en_attente'];
                        return `<span class="badge ${s.class}">${s.icon} ${s.label}</span>`;
                    }
                },
                { 
                    type: 'actions',
                    label: 'Actions',
                    width: 100,
                    actions: [
                        { 
                            type: 'view',
                            title: 'Voir détails',
                            onClick: (row) => this.openVirementDetailModal(row)
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
        });
    }
    
    addActionButtons() {
        setTimeout(() => {
            const actionsZone = document.querySelector('.data-grid-export-buttons');
            if (actionsZone) {
                const buttons = [
                    { 
                        text: '➕ Nouveau décompte', 
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
    
    async loadData() {
        try {
            this.showLoader();
            console.log('📊 Chargement des données...');
            
            // Charger TOUS les décomptes
            const tousLesDecomptes = await firestoreService.getDecomptes({ limite: 100 });
            
            // TRANSFORMATION : Aplatir les virements
            const virementsAplatis = [];
            
            tousLesDecomptes.forEach(decompte => {
                if (decompte.statut === 'supprime') return;
                
                // Si le décompte a des virements multiples
                if (decompte.virements && decompte.virements.length > 0) {
                    decompte.virements.forEach((virement, index) => {
                        virementsAplatis.push({
                            // Infos du décompte parent
                            id: `${decompte.id}_vir_${index}`,
                            decompteId: decompte.id,
                            numeroDecompte: decompte.numeroDecompte,
                            caissePrimaire: decompte.caissePrimaire,
                            codeMagasin: decompte.codeMagasin,
                            societe: decompte.societe,
                            statut: decompte.statut,
                            
                            // Infos spécifiques au virement
                            virementId: virement.id || `vir-${String(index + 1).padStart(3, '0')}`,
                            numeroVirement: virement.numeroVirement || `Vir. ${index + 1}`,
                            dateVirement: virement.dateVirement,
                            montantVirement: virement.montantVirement || 0,
                            nombreBeneficiaires: virement.nombreBeneficiaires || virement.beneficiaires?.length || 0,
                            beneficiaires: virement.beneficiaires || [],
                            
                            // ⚡ AJOUT : Statut de rapprochement
                            statutRapprochement: virement.rapprochement?.statut || 'en_attente',
                            dateRapprochement: virement.rapprochement?.dateRapprochement,
                            ecartRapprochement: virement.rapprochement?.ecart,
                            
                            // Pour le détail
                            _decompteComplet: decompte,
                            _indexVirement: index
                        });
                    });
                } 
                // Compatibilité ancienne structure (1 seul virement)
                else if (decompte.montantVirement) {
                    virementsAplatis.push({
                        id: `${decompte.id}_vir_0`,
                        decompteId: decompte.id,
                        numeroDecompte: decompte.numeroDecompte,
                        caissePrimaire: decompte.caissePrimaire,
                        codeMagasin: decompte.codeMagasin,
                        societe: decompte.societe,
                        statut: decompte.statut,
                        
                        numeroVirement: decompte.numeroVirement || 'Vir. 1',
                        dateVirement: decompte.dateVirement,
                        montantVirement: decompte.montantVirement || 0,
                        nombreBeneficiaires: decompte.nombreBeneficiaires || 0,
                        beneficiaires: decompte.beneficiaires || [],
                        
                        _decompteComplet: decompte,
                        _indexVirement: 0
                    });
                }
            });
            
            this.decomptesData = virementsAplatis;
            console.log(`✅ ${this.decomptesData.length} virements chargés`);
            
            // Charger les stats
            this.statsData = await firestoreService.getStatistiques();
            console.log('✅ Statistiques chargées:', this.statsData);
            
            // Mettre à jour les caisses dynamiques
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
     * Mettre à jour les listes dynamiques (caisses)
     */
    updateDynamicLists() {
        this.caissesDynamiques.clear();
        
        this.decomptesData.forEach(virement => {
            if (virement.caissePrimaire) {
                this.caissesDynamiques.add(virement.caissePrimaire);
            }
        });
        
        console.log('📊 Caisses détectées:', Array.from(this.caissesDynamiques));
    }
    
    // ========================================
    // CRÉATION DE DÉCOMPTE
    // ========================================
    
    openCreateModal() {
        const uploader = new PdfUploaderWidget({
            title: 'Nouveau Décompte Sécurité Sociale',
            theme: 'blue',
            mode: 'simple',
            maxFiles: 100,
            acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'text/csv', '.csv'],
            
            // Détection de doublons par hash
            checkDuplicate: async (file, hash) => {
                const result = await firestoreService.verifierHashExiste(hash);
                // PdfUploader attend false ou un objet doublon
                if (result && result.existe === true) {
                    return result; // Retourner l'objet si doublon
                }
                return false; // Retourner false si pas de doublon
            },
            description: {
                icon: '🦻',
                title: 'Upload de décomptes CPAM audioprothèse',
                text: 'Déposez vos fichiers PDF ou CSV. Chaque fichier sera analysé automatiquement pour extraire les virements et bénéficiaires.'
            },
            saveButtonText: '💾 Créer les décomptes',
            onSave: async (data) => this.handleCreateDecompte(data),
            onClose: () => {
                console.log('Modal création fermée');
            }
        });
    }
    
    async handleCreateDecompte(data) {
        try {
            console.log('📁 Création de', data.files.length, 'décompte(s)...');
            this.showLoader();
            
            const resultats = {
                crees: [],
                analyses: [],
                erreurs: []
            };
            
            // Utiliser le cache des magasins
            const magasins = this.magasinsCache || await firestoreService.chargerMagasins();
            
            // Traiter chaque fichier
            for (let i = 0; i < data.files.length; i++) {
                const file = data.files[i];
                const numero = i + 1;
                
                try {
                    console.log(`\n📄 Traitement fichier ${numero}/${data.files.length}: ${file.name}`);
                    
                    // Upload du document
                    this.showMessage(`Upload du document ${numero}/${data.files.length}...`);
                    const resultatsUpload = await uploadService.uploadDocuments([file]);
                    
                    if (resultatsUpload.erreurs.length > 0) {
                        throw new Error(resultatsUpload.erreurs[0].erreur);
                    }
                    
                    console.log('✅ Document uploadé:', resultatsUpload.reussis[0]);
                    
                    // Créer le décompte
                    this.showMessage(`Création du décompte ${numero}/${data.files.length}...`);
                    const decompteId = await firestoreService.creerDecompte({
                        documents: resultatsUpload.reussis
                    });
                    
                    console.log('✅ Décompte créé avec ID:', decompteId);
                    resultats.crees.push({
                        id: decompteId,
                        fichier: file.name
                    });
                    
                    // Analyse IA automatique
                    this.showMessage(`Analyse IA ${numero}/${data.files.length}...`);
                    try {
                        const donneesExtraites = await openaiService.analyserAvecFichier(
                            file,
                            magasins
                        );
                        
                        // Recherche de doublons - Passer TOUS les virements
                        const doublonsPotentiels = await firestoreService.rechercherDoublonsProbables({
                            virements: donneesExtraites.virements,
                            caissePrimaire: donneesExtraites.caissePrimaire
                        });
                        
                        // Si doublon probable trouvé
                        if (doublonsPotentiels.length > 0 && doublonsPotentiels[0].id !== decompteId) {
                            const doublon = doublonsPotentiels[0];
                            
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
                                `Un décompte similaire existe déjà :\n` +
                                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                                `📄 N° Décompte : ${doublon.numeroDecompte}\n` +
                                `💰 Montant : ${this.formaterMontant(doublon.montantVirement)}\n` +
                                `📅 Date : ${this.formaterDate(doublon.dateVirement)}\n` +
                                `👥 Patients : ${doublon.nombreBeneficiaires}\n` +
                                `🏥 Caisse : ${doublon.caissePrimaire || 'Non définie'}\n` +
                                `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                                `Garder quand même ce décompte ?`
                            );
                            
                            if (!garder) {
                            await firestoreService.supprimerDecompte(decompteId, {
                                motif: `Doublon probable (${doublon.score}%) de ${doublon.numeroDecompte}`,
                                doublonDetecte: true  // ⚡ Flag pour suppression COMPLÈTE
                            });
                                
                                this.showWarning(`Décompte ${file.name} supprimé (doublon ${doublon.score}%)`);
                                
                                resultats.erreurs.push({
                                    fichier: file.name,
                                    erreur: `Doublon détecté (${doublon.score}% de certitude)`,
                                    type: 'doublon_intelligent',
                                    score: doublon.score
                                });
                                
                                continue;
                            }
                        }
                        
                        // Ajouter les données extraites
                        await firestoreService.ajouterDonneesExtraites(decompteId, donneesExtraites);
                        
                        console.log('✅ Analyse IA terminée:', donneesExtraites);
                        resultats.analyses.push({
                            id: decompteId,
                            fichier: file.name,
                            donnees: donneesExtraites
                        });
                        
                    } catch (errorIA) {
                        console.warn('⚠️ Analyse IA échouée:', errorIA);
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
            
            // Afficher le résumé
            console.log('📊 Résumé du traitement:', resultats);
            
            if (resultats.crees.length > 0) {
                this.showSuccess(`✅ ${resultats.crees.length} décompte(s) créé(s)`);
            }
            
            if (resultats.analyses.length > 0) {
                this.showSuccess(`🤖 ${resultats.analyses.length} décompte(s) analysé(s)`);
            }
            
            if (resultats.erreurs.length > 0) {
                resultats.erreurs.forEach(err => {
                    if (err.type === 'doublon_intelligent') {
                        this.showWarning(`⚠️ ${err.fichier}: ${err.erreur}`);
                    } else {
                        this.showError(`❌ ${err.fichier}: ${err.erreur}`);
                    }
                });
            }
            
            // Rafraîchir les données
            await this.loadData();
            
            this.hideLoader();
            
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
    
openDetailModal(row) {
    const self = this;
    
    // Formater les montants
    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(m || 0);
    
    // Formater les dates
    const formatDate = (date) => {
        if (!date) return '-';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('fr-FR');
    };
    
    // Timeline
    const timeline = {
        enabled: true,
        orientation: 'horizontal',
        items: [
            { 
                label: 'Nouveau',
                status: row.statut === 'nouveau' ? 'active' : 'completed',
                icon: '📋',
                date: formatDate(row.dates?.creation)
            },
            { 
                label: 'Analyse IA',
                status: row.statut === 'traitement_ia' ? 'active' : 'completed',
                icon: '🤖',
                date: formatDate(row.dates?.transmissionIA)
            },
            { 
                label: 'Traité',
                status: row.statut === 'traitement_effectue' ? 'active' : 'completed',
                icon: '✅',
                date: formatDate(row.dates?.traitementEffectue)
            },
            { 
                label: 'Rapproché',
                status: row.statut === 'rapprochement_bancaire' ? 'completed' : 'pending',
                icon: '🔗',
                date: formatDate(row.dates?.rapprochementBancaire)
            }
        ]
    };
    
    // Sections
    const sections = [];
    
    // Section 1 : Informations générales
    sections.push({
        id: 'general',
        title: '📊 Informations générales',
        fields: [
            { label: 'N° Décompte', value: row.numeroDecompte },
            { label: 'Caisse CPAM', value: row.caissePrimaire || '-' },
            { label: 'Magasin', value: row.codeMagasin || '-' },
            { label: 'Société', value: row.societe || '-', bold: true },
            { label: 'FINESS détecté', value: row.extractionIA?.donneesBrutes?.informationsGenerales?.numeroFINESS || '-' },
            { label: 'Période', value: row.extractionIA?.donneesBrutes?.informationsGenerales?.periodeTraitement || '-' }
        ]
    });
    
    // Section 2 : Totaux
    sections.push({
        id: 'totaux',
        title: '💰 Totaux du décompte',
        fields: [
            { 
                label: 'Nombre de virements', 
                value: row.virements?.length || row.totaux?.nombreTotalVirements || 0,
                bold: true
            },
            { 
                label: 'Montant total', 
                value: formatMontant(row.totaux?.montantTotalVirements || 0),
                bold: true
            },
            { 
                label: 'Nombre total de patients', 
                value: row.totaux?.nombreTotalBeneficiaires || 0
            },
            { 
                label: 'Nombre total d\'appareils', 
                value: row.totaux?.nombreTotalAppareils || 0
            }
        ]
    });
    
    // Section 3 : Détail de CHAQUE virement
    if (row.virements && row.virements.length > 0) {
        row.virements.forEach((virement, index) => {
            // Section pour ce virement
            sections.push({
                id: `virement-${index}`,
                title: `💳 Virement ${index + 1} - ${formatDate(virement.dateVirement)}`,
                fields: [
                    { 
                        label: 'Date du virement', 
                        value: formatDate(virement.dateVirement)
                    },
                    { 
                        label: 'Référence', 
                        value: virement.numeroVirement || '-'
                    },
                    { 
                        label: 'Montant du virement', 
                        value: formatMontant(virement.montantVirement),
                        bold: true
                    },
                    { 
                        label: 'Nombre de bénéficiaires', 
                        value: virement.nombreBeneficiaires || virement.beneficiaires?.length || 0
                    }
                ]
            });
            
            // Liste des bénéficiaires de ce virement
            if (virement.beneficiaires && virement.beneficiaires.length > 0) {
                const beneficiairesHtml = virement.beneficiaires.map((b, idx) => `
                    <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${idx + 1}. ${b.prenom || ''} ${b.nom || ''}</strong>
                                ${b.numeroSecuriteSociale ? `<br><small>NSS: ${b.numeroSecuriteSociale}</small>` : ''}
                            </div>
                            <div style="text-align: right;">
                                <strong>${formatMontant(b.montantRemboursement)}</strong>
                                ${b.nombreAppareils ? `<br><small>${b.nombreAppareils} appareil(s)</small>` : ''}
                            </div>
                        </div>
                        ${b.appareils && b.appareils.length > 0 ? `
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #dee2e6;">
                                ${b.appareils.map(a => `
                                    <div style="display: flex; justify-content: space-between; font-size: 0.9em; color: #6c757d;">
                                        <span>👂 ${a.oreille || 'Oreille'} - ${a.codeActe || 'Acte'}</span>
                                        <span>${formatMontant(a.montantRembourse)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('');
                
                sections.push({
                    id: `beneficiaires-virement-${index}`,
                    title: `👥 Bénéficiaires du virement ${index + 1}`,
                    fields: [{
                        label: '',
                        value: beneficiairesHtml,
                        html: true
                    }]
                });
            }
        });
    }
    
    // Section 4 : Documents
    sections.push({
        id: 'documents',
        title: '📄 Documents',
        fields: [{
            label: 'Fichiers uploadés',
            key: 'documents',
            formatter: (docs) => {
                if (!docs || docs.length === 0) return 'Aucun document';
                return docs.map(d => `
                    <div style="margin: 5px 0;">
                        📎 <a href="${d.url}" target="_blank">${d.nomOriginal || d.nom}</a>
                        <small>(${(d.taille / 1024).toFixed(1)} KB)</small>
                    </div>
                `).join('');
            },
            html: true
        }]
    });
    
    // Créer le viewer
    const viewer = new DetailViewerWidget({
        title: `Décompte ${row.numeroDecompte}`,
        subtitle: `${row.virements?.length || 0} virements - ${formatMontant(row.totaux?.montantTotalVirements || 0)}`,
        data: row,
        timeline: timeline,
        sections: sections,
        actions: [
            {
                label: '🗑️ Supprimer',
                class: 'btn btn-glass-red btn-lg',
                onClick: async (data) => {
                    if (!confirm(`Supprimer le décompte ${data.numeroDecompte} ?`)) {
                        return false;
                    }
                    
                    try {
                        await firestoreService.supprimerDecompte(data.id);
                        self.showSuccess('Décompte supprimé');
                        await self.loadData();
                        viewer.close();
                        return true;
                    } catch (error) {
                        self.showError('Erreur: ' + error.message);
                        return false;
                    }
                },
                closeOnClick: false
            }
        ],
        size: 'large',
        theme: 'default'
    });
}

/**
 * Ouvrir le détail d'un virement spécifique
 */
openVirementDetailModal(virementRow) {
    const self = this;
    
    // Récupérer le décompte complet et l'index du virement
    const decompteComplet = virementRow._decompteComplet;
    const indexVirement = virementRow._indexVirement;
    
    // Formater les montants
    const formatMontant = (m) => new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(m || 0);
    
    // Formater les dates
    const formatDate = (date) => {
        if (!date) return '-';
        const d = date.toDate ? date.toDate() : new Date(date);
        return d.toLocaleDateString('fr-FR');
    };
    
    // Timeline simplifiée
    const timeline = {
        enabled: true,
        orientation: 'horizontal',
        items: [
            { 
                label: 'Créé',
                status: 'completed',
                icon: '📋',
                date: formatDate(decompteComplet.dates?.creation)
            },
            { 
                label: 'Analysé',
                status: 'completed',
                icon: '🤖',
                date: formatDate(decompteComplet.dates?.traitementEffectue)
            },
            { 
                label: 'À rapprocher',
                status: virementRow.statut === 'rapprochement_bancaire' ? 'completed' : 'active',
                icon: '🔗',
                date: virementRow.statut === 'rapprochement_bancaire' ? 'En attente' : '-'
            }
        ]
    };
    
    // Sections
    const sections = [];
    
    // Section 1 : Informations du virement
    sections.push({
        id: 'virement',
        title: '💳 Détails du virement',
        fields: [
            { 
                label: 'Date du virement', 
                value: formatDate(virementRow.dateVirement),
                bold: true
            },
            { 
                label: 'Référence', 
                value: virementRow.numeroVirement || '-'
            },
            { 
                label: 'Montant', 
                value: formatMontant(virementRow.montantVirement),
                bold: true
            },
            { 
                label: 'Nombre de patients', 
                value: virementRow.nombreBeneficiaires || 0
            },
            { 
                label: 'N° Décompte', 
                value: decompteComplet.numeroDecompte
            },
            { 
                label: 'Caisse CPAM', 
                value: decompteComplet.caissePrimaire || '-'
            },
            { 
                label: 'Magasin', 
                value: decompteComplet.codeMagasin || '-'
            },
            { 
                label: 'Société', 
                value: decompteComplet.societe || '-'
            }
        ]
    });
    
    // Section 2 : Bénéficiaires
    if (virementRow.beneficiaires && virementRow.beneficiaires.length > 0) {
        const beneficiairesHtml = virementRow.beneficiaires.map((b, idx) => `
            <div style="margin: 10px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #007bff;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h5 style="margin: 0 0 5px 0; color: #333;">
                            ${idx + 1}. ${b.prenom || ''} ${b.nom || ''}
                        </h5>
                        ${b.numeroSecuriteSociale ? `<small style="color: #6c757d;">NSS: ${self.formaterNSS(b.numeroSecuriteSociale)}</small>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <h5 style="margin: 0; color: #28a745;">${formatMontant(b.montantRemboursement || 0)}</h5>
                        ${b.nombreAppareils ? `<small style="color: #6c757d;">${b.nombreAppareils} appareil(s)</small>` : ''}
                    </div>
                </div>
                ${b.appareils && b.appareils.length > 0 ? `
                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #dee2e6;">
                        ${b.appareils.map(a => `
                            <div style="display: flex; justify-content: space-between; padding: 5px 0; font-size: 0.9em;">
                                <span>
                                    👂 <strong>${a.oreille || 'Oreille'}</strong>
                                    ${a.codeActe ? ` - Code: ${a.codeActe}` : ''}
                                </span>
                                <span style="color: #28a745; font-weight: bold;">
                                    ${formatMontant(a.montantRembourse || a.montant || 0)}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        sections.push({
            id: 'beneficiaires',
            title: `👥 Bénéficiaires (${virementRow.beneficiaires.length})`,
            fields: [{
                label: '',
                value: beneficiairesHtml,
                html: true
            }]
        });
    }
    
    // Section 3 : Documents
    if (decompteComplet.documents && decompteComplet.documents.length > 0) {
        sections.push({
            id: 'documents',
            title: '📄 Documents',
            fields: [{
                label: '',
                value: decompteComplet.documents.map(d => `
                    <div style="margin: 5px 0;">
                        📎 <a href="${d.url}" target="_blank" style="color: #007bff;">
                            ${d.nomOriginal || d.nom}
                        </a>
                        <small style="color: #6c757d;">(${(d.taille / 1024).toFixed(1)} KB)</small>
                    </div>
                `).join(''),
                html: true
            }]
        });
    }
    
    // Créer le viewer
    const viewer = new DetailViewerWidget({
        title: `Virement ${virementRow.numeroVirement}`,
        subtitle: `${formatDate(virementRow.dateVirement)} - ${formatMontant(virementRow.montantVirement)}`,
        data: virementRow,
        timeline: timeline,
        sections: sections,
        actions: [
            {
                label: '✅ Rapprocher ce virement',
                class: 'btn btn-glass-green btn-lg',
                onClick: async () => {
                    if (confirm(`Marquer ce virement de ${formatMontant(virementRow.montantVirement)} comme rapproché ?`)) {
                        try {
                            await firestoreService.marquerRapproche(virementRow.decompteId, {
                                libelle: `Virement ${virementRow.numeroVirement}`,
                                date: new Date(),
                                montant: virementRow.montantVirement
                            });
                            self.showSuccess('Virement rapproché');
                            await self.loadData();
                            viewer.close();
                        } catch (error) {
                            self.showError('Erreur: ' + error.message);
                        }
                    }
                },
                visible: virementRow.statut !== 'rapprochement_bancaire'
            },
            {
                label: '📊 Voir le décompte complet',
                class: 'btn btn-glass-blue btn-lg',
                onClick: () => {
                    viewer.close();
                    self.openDetailModal(decompteComplet);
                }
            }
        ],
        size: 'large',
        theme: 'default'
    });
}

/**
 * Action rapide de rapprochement depuis le tableau
 */
async rapprocher(row) {
    if (confirm(`Rapprocher le virement ${row.numeroVirement} de ${this.formaterMontant(row.montantVirement)} ?`)) {
        try {
            await firestoreService.marquerRapproche(row.decompteId, {
                libelle: `Virement ${row.numeroVirement}`,
                date: new Date(),
                montant: row.montantVirement
            });
            this.showSuccess('Virement rapproché');
            await this.loadData();
        } catch (error) {
            this.showError('Erreur: ' + error.message);
        }
    }
}
    
    // ========================================
    // FILTRAGE ET MISE À JOUR
    // ========================================
    
    applyFilters() {
        console.log('🔍 Application des filtres:', this.currentFilters);
        
        this.filteredData = this.decomptesData.filter(decompte => {
            // Filtre recherche
            if (this.currentFilters.search) {
                const search = this.currentFilters.search.toLowerCase();
                const numero = (decompte.numeroDecompte || '').toLowerCase();
                const numeroVirement = (decompte.numeroVirement || '').toLowerCase();
                const caisse = (decompte.caissePrimaire || '').toLowerCase();
                
                // Recherche dans les bénéficiaires
                let foundInBeneficiaires = false;
                if (decompte.beneficiaires && Array.isArray(decompte.beneficiaires)) {
                    foundInBeneficiaires = decompte.beneficiaires.some(b => {
                        const nom = `${b.prenom || ''} ${b.nom || ''}`.toLowerCase();
                        return nom.includes(search);
                    });
                }
                
                if (!numero.includes(search) && 
                    !numeroVirement.includes(search) && 
                    !caisse.includes(search) &&
                    !foundInBeneficiaires) {
                    return false;
                }
            }
            
            // Filtre statuts
            if (this.currentFilters.statuts && this.currentFilters.statuts.length > 0) {
                if (!this.currentFilters.statuts.includes(decompte.statut)) {
                    return false;
                }
            }
            
            // Filtre caisse
            if (this.currentFilters.caisse && decompte.caissePrimaire !== this.currentFilters.caisse) {
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
    
    updateStats() {
        if (!this.stats || !this.statsData) return;
        
        // Calculer le montant total depuis les décomptes
        const montantTotal = this.decomptesData.reduce((sum, d) => {
            return sum + (d.totaux?.montantTotalVirements || d.montantVirement || 0);
        }, 0);
        
        const cardsData = {
            nouveau: this.statsData.parStatut?.nouveau || 0,
            traitement_ia: this.statsData.parStatut?.traitement_ia || 0,
            traitement_effectue: this.statsData.parStatut?.traitement_effectue || 0,
            rapprochement_bancaire: this.statsData.parStatut?.rapprochement_bancaire || 0,
            total: this.formaterMontant(montantTotal)
        };
        
        this.stats.updateAll(cardsData);
    }
    
    updateFilterOptions() {
        const caisses = Array.from(this.caissesDynamiques).sort();
        const magasins = [...new Set(this.decomptesData.map(d => d.codeMagasin).filter(Boolean))].sort();
        
        // Mettre à jour le dropdown caisse
        if (this.filters && this.filters.state.dropdowns.caisse) {
            const caisseDropdown = this.filters.state.dropdowns.caisse;
            caisseDropdown.config.options = [
                { value: '', label: 'Toutes les caisses' },
                ...caisses.map(c => ({ value: c, label: c }))
            ];
            caisseDropdown.filteredOptions = [...caisseDropdown.config.options];
            this.filters.renderDropdownOptions(caisseDropdown);
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
    // FORMATTERS
    // ========================================
    
    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    formaterMontant(montant) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(montant);
    }
    
    formaterNSS(nss) {
        if (!nss) return '-';
        const nssClean = nss.replace(/\s/g, '');
        if (nssClean.length === 13) {
            return `${nssClean[0]} ${nssClean.slice(1,3)} ${nssClean.slice(3,5)} ${nssClean.slice(5,7)} ${nssClean.slice(7,10)} ${nssClean.slice(10,13)}`;
        }
        if (nssClean.length === 15) {
            return `${nssClean[0]} ${nssClean.slice(1,3)} ${nssClean.slice(3,5)} ${nssClean.slice(5,7)} ${nssClean.slice(7,10)} ${nssClean.slice(10,13)} ${nssClean.slice(13)}`;
        }
        return nss;
    }
    
    formaterDate(date) {
        if (!date) return '-';
        const d = date.toDate ? date.toDate() : new Date(date);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        }).replace(',', ' à');
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
}

// ========================================
// EXPORT SINGLETON
// ========================================

const orchestrator = new DecompteSecuOrchestrator();
export default orchestrator;

/* ========================================
   HISTORIQUE
   
   [08/01/2025] - v1.0.0
   - Création basée sur décomptes mutuelles
   - Adaptation pour audioprothèse
   - Support CSV et PDF
   - Vue par virement
   - Détection doublons intelligente
   ======================================== */