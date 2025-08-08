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
import toast from '../../widgets/toast/toast.widget.js';

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
        resetButtonClass: 'btn btn-glass-orange',
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
            
            // Mettre à jour les filtres directement
            // Si c'est une chaîne vide, on la garde vide (pas de filtrage)
            this.currentFilters = { 
                ...this.currentFilters, 
                search: values.search || '',
                mutuelle: values.mutuelle || '',
                magasin: values.magasin || '',
                periode: values.periode || 'all',
                statuts: this.currentFilters.statuts  // Préserver les statuts des cartes
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
            
            // Charger TOUS les décomptes
            const tousLesDecomptes = await firestoreService.getDecomptes({ limite: 100 });
            
            // ✅ FILTRER les supprimés
            this.decomptesData = tousLesDecomptes.filter(d => d.statut !== 'supprime');
            
            console.log(`📊 ${tousLesDecomptes.length} décomptes totaux`);
            console.log(`✅ ${this.decomptesData.length} décomptes actifs (supprimés exclus)`);
            
            // Charger les stats (déjà filtrées dans getStatistiques)
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
            maxFiles: 100,  // ✅ ON CONFIGURE ICI POUR TESTS
            
            // ✅ NOUVEAU : Détection de doublons par hash
            checkDuplicate: async (file, hash) => {
                return await firestoreService.verifierHashExiste(hash);
            },
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
                        // ✅ RECHERCHE INTELLIGENTE DE DOUBLONS APRÈS IA
                        // Utiliser le montant INDIVIDUEL du client, pas le total !
                        const montantPourRecherche = donneesExtraites.montantRemboursementClient || 
                                                    donneesExtraites.client?.montantRemboursement || 
                                                    donneesExtraites.montantVirement;

                        console.log('🔍 Montants pour recherche:', {
                            montantRemboursementClient: donneesExtraites.montantRemboursementClient,
                            montantVirement: donneesExtraites.montantVirement,
                            montantUtilise: montantPourRecherche
                        });

                        const doublonsPotentiels = await firestoreService.rechercherDoublonsProbables({
                            client: donneesExtraites.client,
                            montantVirement: montantPourRecherche,  // ✅ Montant INDIVIDUEL !
                            mutuelle: donneesExtraites.mutuelle,
                            codeMagasin: donneesExtraites.codeMagasin
                        });

                        // Si doublon probable trouvé
                        if (doublonsPotentiels.length > 0 && doublonsPotentiels[0].id !== decompteId) {
                            const doublon = doublonsPotentiels[0];
                            
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
                            
                            // ✅ CORRECTION : Afficher TOUS les clients
                            let clientInfo = '';
                            if (doublon.typeDecompte === 'groupe' && doublon.clients && doublon.clients.length > 0) {
                                // Décompte groupé : afficher TOUS les clients
                                const nomsClients = doublon.clients
                                    .map(c => `${c.prenom || ''} ${c.nom || ''}`.trim())
                                    .filter(n => n) // Enlever les vides
                                    .join(', ');
                                clientInfo = nomsClients || 'Clients multiples';
                            } else if (doublon.client) {
                                // Décompte unitaire
                                clientInfo = `${doublon.client.prenom || ''} ${doublon.client.nom || ''}`.trim();
                            } else {
                                clientInfo = 'Client non défini';
                            }

                            // ✅ DEBUG pour voir ce qu'on a
                            console.log('🔍 Doublon détecté:', {
                                type: doublon.typeDecompte,
                                clients: doublon.clients,
                                client: doublon.client,
                                clientInfo: clientInfo
                            });

                            const garder = confirm(
                                `${emoji} DOUBLON ${niveau} DÉTECTÉ ! (${doublon.score}%)\n\n` +
                                `Un décompte similaire existe déjà :\n` +
                                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                                `📄 N° Décompte : ${doublon.numeroDecompte || 'Sans numéro'}\n` +
                                `👤 Client(s) : ${clientInfo}\n` +
                                `${doublon.typeDecompte === 'groupe' ? `👥 Type : Décompte groupé (${doublon.nombreClients || doublon.clients?.length || 2} clients)\n` : ''}` +
                                `🏥 Mutuelle : ${doublon.mutuelle || 'Non définie'}\n` +
                                `💰 Montant : ${this.formaterMontant(doublon.montantVirement || 0)}\n` +
                                `\n` +
                                `🔍 Critères correspondants :\n` +
                                doublon.details.map(d => `   ✓ ${d}`).join('\n') +
                                `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                                `Garder quand même ce décompte ?`
                            );
                            
                        if (!garder) {
                            // Supprimer le décompte créé
                            console.log('🗑️ Suppression du décompte doublon');
                            await firestoreService.supprimerDecompte(decompteId, {
                                motif: `Doublon probable (${doublon.score}%) de ${doublon.numeroDecompte}`
                            });
                            
                            this.showWarning(`Décompte ${file.name} supprimé (doublon ${doublon.score}%)`);
                            
                            // ✅ RETIRER DES CRÉÉS car supprimé
                            const indexCree = resultats.crees.findIndex(c => c.id === decompteId);
                            if (indexCree !== -1) {
                                resultats.crees.splice(indexCree, 1);
                            }
                            
                            // ✅ RETIRER DES ANALYSES aussi
                            const indexAnalyse = resultats.analyses.findIndex(a => a.id === decompteId);
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
                    // Message différent selon le type d'erreur
                    if (err.type === 'doublon_intelligent') {
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
    
        // Créer le viewer ET GARDER LA RÉFÉRENCE
        const viewer = new DetailViewerWidget({
            title: `Décompte ${row.numeroDecompte}`,
            subtitle: row.typeDecompte === 'groupe' 
                ? `👥 ${row.clients?.length || row.nombreClients} clients - ${row.codeMagasin}`
                : `${row.client?.prenom || ''} ${row.client?.nom || ''} - ${row.codeMagasin}`,
            data: row,
            timeline: timeline,
            sections: sections,
            actions: [
                {
                    label: '🚧 Analyser avec IA - En travaux',
                    class: 'btn btn-glass-purple btn-lg',
                    onClick: (data) => {
                        self.showWarning('Fonction en cours de développement');
                        return false;
                    },
                    closeOnClick: false,
                    show: (data) => data.statut === 'nouveau'
                },
                {
                    label: '🚧 Valider - En travaux',
                    class: 'btn btn-glass-green btn-lg',
                    onClick: (data) => {
                        self.showWarning('Fonction en cours de développement');
                        return false;
                    },
                    closeOnClick: false,
                    show: (data) => data.statut === 'traitement_effectue'
                },
                // ✅ BOUTON SUPPRIMER AVEC FERMETURE DU MODAL
                {
                    label: '🗑️ Supprimer',
                    class: 'btn btn-glass-red btn-lg',
                    onClick: async (data) => {
                        // Confirmation simple
                        const confirmation = confirm(
                            `⚠️ Voulez-vous vraiment supprimer le décompte ${data.numeroDecompte} ?\n\n` +
                            `Cette action est irréversible.`
                        );
                        
                        if (!confirmation) {
                            return false; // Ne pas fermer
                        }
                        
                        try {
                            self.showLoader();
                            
                            // Supprimer
                            await firestoreService.supprimerDecompte(data.id, {
                                motif: 'Suppression manuelle'
                            });
                            
                            self.showSuccess('✅ Décompte supprimé');
                            
                            // Rafraîchir les données
                            await self.loadData();
                            
                            self.hideLoader();
                            
                            // ✅ FERMER LE MODAL MANUELLEMENT
                            viewer.close();
                            
                            return true;
                            
                        } catch (error) {
                            self.hideLoader();
                            self.showError('❌ Erreur : ' + error.message);
                            return false;
                        }
                    },
                    closeOnClick: false  // On gère manuellement
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
 * Mettre à jour les options de filtres dynamiquement
 */
updateFilterOptions() {
    const mutuelles = Array.from(this.mutuellesDynamiques).sort();
    const magasins = [...new Set(this.decomptesData.map(d => d.codeMagasin).filter(Boolean))].sort();
    
    console.log('🔧 Mise à jour des options:', { mutuelles, magasins });
    
    // ✅ Mettre à jour le dropdown MUTUELLE
    if (this.filters && this.filters.state.dropdowns.mutuelle) {
        const mutuelleDropdown = this.filters.state.dropdowns.mutuelle;
        
        // Créer les nouvelles options
        mutuelleDropdown.config.options = [
            { value: '', label: 'Toutes les mutuelles' },
            ...mutuelles.map(m => ({ value: m, label: m }))
        ];
        
        // Re-filtrer et re-render
        mutuelleDropdown.filteredOptions = [...mutuelleDropdown.config.options];
        this.filters.renderDropdownOptions(mutuelleDropdown);
        
        console.log('✅ Dropdown mutuelle mis à jour avec', mutuelles.length, 'options');
    }
    
    // ✅ Mettre à jour le dropdown MAGASIN
    if (this.filters && this.filters.state.dropdowns.magasin) {
        const magasinDropdown = this.filters.state.dropdowns.magasin;
        
        // Créer les nouvelles options
        magasinDropdown.config.options = [
            { value: '', label: 'Tous les magasins' },
            ...magasins.map(m => ({ value: m, label: m }))
        ];
        
        // Re-filtrer et re-render
        magasinDropdown.filteredOptions = [...magasinDropdown.config.options];
        this.filters.renderDropdownOptions(magasinDropdown);
        
        console.log('✅ Dropdown magasin mis à jour avec', magasins.length, 'options');
    }
}
    
    // ========================================
    // FORMATTERS
    // ========================================
    
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
            // Utiliser le ToastWidget selon le type
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