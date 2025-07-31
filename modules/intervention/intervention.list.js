// ========================================
// INTERVENTION.LIST.JS - Gestion de la liste des interventions
// Chemin: src/js/pages/intervention/intervention.list.js
//
// DESCRIPTION:
// Gère l'affichage de la liste des interventions avec DataTable et DataTableFilters
// Modifié le 01/02/2025 : Utilisation de chargerMagasins() au lieu de dupliquer le code
// ========================================

import { db, chargerMagasins } from '../../src/js/services/firebase.service.js';  // ← MODIFIÉ : ajout de chargerMagasins
import { InterventionService } from '../../src/js/services/intervention.service.js';
import { 
    INTERVENTION_CONFIG, 
    genererOptionsFiltres,
    genererConfigStatsCards,
    formaterDonneesExport,
    formatDate as formatDateUtil 
} from '../../src/js/data/intervention.data.js';
import { DataTable, DataTableFilters, StatsCards } from '../../src/js/shared/index.js';
import { state } from './intervention.main.js';

// ========================================
// VARIABLES DU MODULE
// ========================================

let tableInterventions = null;
let filtresInterventions = null;
let statsCards = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeInterventions() {
    console.log('🔧 Initialisation DataTable et Filtres pour les interventions...');
    
    // 1. Créer l'instance DataTable
    tableInterventions = new DataTable({
        container: '.interventions-table-container',
        
        columns: [
            {
                key: 'dates.intervention',
                label: 'Date',
                sortable: true,
                width: 100,
                formatter: (value) => formatDate(value)
            },
            {
                key: 'numeroIntervention',
                label: 'N° Intervention',
                sortable: true,
                width: 150,
                formatter: (value) => `<code>${value}</code>`
            },
            {
                key: 'client',
                label: 'Client',
                sortable: true,
                formatter: (client) => {
                    return `
                        <div class="client-info">
                            <strong>${client.prenom} ${client.nom}</strong>
                            <small>${client.telephone || '-'}</small>
                        </div>
                    `;
                },
                sortFunction: (a, b, direction) => {
                    const nameA = `${a.prenom} ${a.nom}`.toLowerCase();
                    const nameB = `${b.prenom} ${b.nom}`.toLowerCase();
                    return direction === 'asc' 
                        ? nameA.localeCompare(nameB, 'fr')
                        : nameB.localeCompare(nameA, 'fr');
                }
            },
            {
                key: 'appareil',
                label: 'Appareil',
                sortable: true,
                formatter: (appareil) => {
                    const type = INTERVENTION_CONFIG.TYPES_APPAREILS[appareil.type];
                    return `
                        <div class="appareil-info">
                            <span class="appareil-type">${type?.icon || ''} ${appareil.marque}</span>
                            <small>${type?.label || appareil.type}</small>
                        </div>
                    `;
                }
            },
            {
                key: 'resultat',
                label: 'Résultat',
                sortable: true,
                width: 120,
                formatter: (value) => {
                    const config = INTERVENTION_CONFIG.RESULTATS[value];
                    if (!config) return value || '-';
                    
                    return `<span class="badge badge-resultat-${value.toLowerCase()}">${config.icon} ${config.label}</span>`;
                }
            },
            {
                key: 'statut',
                label: 'Statut',
                sortable: true,
                width: 100,
                formatter: (value) => afficherStatut(value)
            },
            {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                resizable: false,
                exportable: false,
                width: 80,
                formatter: (_, row) => `
                    <div class="table-actions">
                        <button class="btn-action" onclick="voirDetailIntervention('${row.id}')" title="Voir le détail">
                            👁️
                        </button>
                        ${row.statut === 'nouvelle' ? `
                            <button class="btn-action" onclick="demarrerIntervention('${row.id}')" title="Démarrer">
                                ▶️
                            </button>
                        ` : ''}
                    </div>
                `
            }
        ],
        
        features: {
            sort: true,
            resize: true,
            export: true,
            selection: false,
            pagination: true
        },
        
        pagination: {
            itemsPerPage: state.itemsPerPage || 20,
            pageSizeOptions: [10, 20, 50, 100]
        },
        
        export: {
            csv: true,
            excel: true,
            filename: `interventions_${formatDateUtil(new Date(), 'YYYY-MM-DD')}`,
            onBeforeExport: (data) => formaterDonneesExport(data)
        },
        
        messages: {
            noData: 'Aucune intervention trouvée',
            loading: 'Chargement des interventions...',
            itemsPerPage: 'Éléments par page',
            page: 'Page',
            of: 'sur',
            items: 'éléments'
        },
        
        onPageChange: (page) => {
            state.currentPage = page;
        }
    });
    
    // 2. Initialiser les filtres
    await initFiltres();
    
    console.log('✅ DataTable et Filtres initialisés');
    
    // 3. Initialiser les cartes de statistiques
    initStatsCards();
}

// ========================================
// INITIALISATION DES STATS CARDS
// ========================================

function initStatsCards() {
    const cardsConfig = genererConfigStatsCards();
    
    statsCards = new StatsCards({
        container: '.interventions-stats',
        cards: cardsConfig.map(card => ({
            id: card.id,
            label: card.label,
            value: 0,
            color: card.color,
            icon: card.icon
        })),
        animated: true,
        onClick: (cardId) => {
            const card = cardsConfig.find(c => c.id === cardId);
            
            if (card.statut) {
                // Filtrer par statut
                if (state.filtres.statuts.includes(card.statut)) {
                    state.filtres.statuts = state.filtres.statuts.filter(s => s !== card.statut);
                    statsCards.elements.cards[cardId]?.classList.remove('active');
                } else {
                    state.filtres.statuts.push(card.statut);
                    statsCards.elements.cards[cardId]?.classList.add('active');
                }
            } else if (card.filter) {
                // Filtres spéciaux (aujourd'hui, cette semaine, etc.)
                handleSpecialFilter(card.filter);
            }
            
            afficherInterventions();
        }
    });
}

// ========================================
// INITIALISATION DES FILTRES
// ========================================

async function initFiltres() {
    let filtresConfig = genererOptionsFiltres();
    
    // ========================================
    // MODIFIÉ : Utiliser le service au lieu d'importer Firebase directement
    // ========================================
    try {
        // Utiliser la fonction existante du service
        const magasinsData = await chargerMagasins();
        
        if (magasinsData) {
            // Transformer le format { id: {nom, code, actif} } en tableau d'options
            const magasins = Object.entries(magasinsData)
                .filter(([id, data]) => data.actif !== false)
                .map(([id, data]) => ({
                    value: data.code || id,
                    label: data.nom || data.code || id
                }))
                .sort((a, b) => a.label.localeCompare(b.label));
            
            // Ajouter les options au filtre magasin
            const magasinFilter = filtresConfig.find(f => f.key === 'magasin');
            if (magasinFilter) {
                magasinFilter.options = [
                    { value: '', label: 'Tous les magasins' },
                    ...magasins
                ];
            }
        }
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
    }
    
    // Activer keepPlaceholder sur tous les filtres select
    const filtresAvecKeepPlaceholder = filtresConfig.map(filtre => {
        if (filtre.type === 'select') {
            return {
                ...filtre,
                keepPlaceholder: true
            };
        }
        return filtre;
    });
    
    filtresInterventions = new DataTableFilters({
        container: '.interventions-filters',
        filters: filtresAvecKeepPlaceholder,
        onFilter: (filters) => {
            // Détecter si c'est un reset
            const isReset = !filters.recherche && 
                           !filters.magasin && 
                           filters.periode === 'all' && 
                           !filters.statut &&
                           !filters.resultat;
            
            if (isReset) {
                state.filtres = {
                    recherche: '',
                    magasin: '',
                    periode: 'all',
                    statut: '',
                    resultat: '',
                    statuts: []
                };
                
                // Désélectionner toutes les cartes
                if (statsCards && statsCards.elements.cards) {
                    Object.values(statsCards.elements.cards).forEach(card => {
                        card.classList.remove('active');
                    });
                }
            } else {
                state.filtres = {
                    ...state.filtres,
                    recherche: filters.recherche || '',
                    magasin: filters.magasin || '',
                    periode: filters.periode || 'all',
                    statut: filters.statut || '',
                    resultat: filters.resultat || ''
                };
            }
            
            if (tableInterventions) {
                afficherInterventions();
            }
        }
    });
}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

export async function chargerDonnees() {
    try {
        // Afficher le loader
        if (tableInterventions) {
            tableInterventions.state.loading = true;
            tableInterventions.refresh();
        }
        
        // Charger les interventions depuis Firebase
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const interventionsQuery = query(
            collection(db, 'interventions'),
            orderBy('dates.intervention', 'desc')
        );
        
        const snapshot = await getDocs(interventionsQuery);
        state.interventionsData = [];
        
        snapshot.forEach((doc) => {
            state.interventionsData.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Calculer les statistiques
        calculerStatistiques();
        
        // Afficher les interventions
        afficherInterventions();
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
        state.interventionsData = [];
        afficherInterventions();
    } finally {
        if (tableInterventions) {
            tableInterventions.state.loading = false;
        }
    }
}

// ========================================
// AFFICHAGE ET STATISTIQUES
// ========================================

function calculerStatistiques() {
    const stats = {
        nouvelles: 0,
        en_cours: 0,
        terminees_jour: 0,
        sav_semaine: 0
    };
    
    const aujourd_hui = new Date();
    aujourd_hui.setHours(0, 0, 0, 0);
    
    const debutSemaine = new Date();
    debutSemaine.setDate(debutSemaine.getDate() - 7);
    debutSemaine.setHours(0, 0, 0, 0);
    
    state.interventionsData.forEach(intervention => {
        // Compter par statut
        if (intervention.statut === 'nouvelle') stats.nouvelles++;
        else if (intervention.statut === 'en_cours') stats.en_cours++;
        
        // Terminées aujourd'hui
        if (intervention.statut === 'terminee' && intervention.dates?.cloture) {
            let dateCloture;
            if (intervention.dates.cloture.toDate) {
                dateCloture = intervention.dates.cloture.toDate();
            } else {
                dateCloture = new Date(intervention.dates.cloture);
            }
            
            if (dateCloture >= aujourd_hui) {
                stats.terminees_jour++;
            }
        }
        
        // SAV cette semaine
        if (intervention.resultat === 'SAV' && intervention.dates?.intervention) {
            let dateIntervention;
            if (intervention.dates.intervention.toDate) {
                dateIntervention = intervention.dates.intervention.toDate();
            } else {
                dateIntervention = new Date(intervention.dates.intervention);
            }
            
            if (dateIntervention >= debutSemaine) {
                stats.sav_semaine++;
            }
        }
    });
    
    // Mettre à jour les cartes
    if (statsCards) {
        statsCards.updateAll(stats);
    }
}

function afficherInterventions() {
    if (!tableInterventions) {
        console.error('DataTable non initialisée');
        return;
    }
    
    // Filtrer les interventions
    const interventionsFiltrees = filtrerInterventions();
    
    // Envoyer les données à DataTable
    tableInterventions.setData(interventionsFiltrees);
}

// ========================================
// FILTRAGE
// ========================================

function filtrerInterventions() {
    return state.interventionsData.filter(intervention => {
        // Filtre recherche
        if (state.filtres.recherche) {
            const recherche = state.filtres.recherche.toLowerCase();
            const clientNom = `${intervention.client.prenom} ${intervention.client.nom}`.toLowerCase();
            const numero = intervention.numeroIntervention?.toLowerCase() || '';
            const marque = intervention.appareil?.marque?.toLowerCase() || '';
            
            if (!clientNom.includes(recherche) && 
                !numero.includes(recherche) && 
                !marque.includes(recherche)) {
                return false;
            }
        }
        
        // Filtre magasin
        if (state.filtres.magasin && intervention.magasin !== state.filtres.magasin) {
            return false;
        }
        
        // Filtre statut simple
        if (state.filtres.statut && intervention.statut !== state.filtres.statut) {
            return false;
        }
        
        // Filtre statuts multiples (depuis les cartes)
        if (state.filtres.statuts.length > 0 && !state.filtres.statuts.includes(intervention.statut)) {
            return false;
        }
        
        // Filtre résultat
        if (state.filtres.resultat && intervention.resultat !== state.filtres.resultat) {
            return false;
        }
        
        // Filtre période
        if (state.filtres.periode !== 'all') {
            let dateIntervention;
            
            // Gestion correcte de la date Firebase
            if (intervention.dates?.intervention) {
                if (intervention.dates.intervention.toDate) {
                    dateIntervention = intervention.dates.intervention.toDate();
                } else {
                    dateIntervention = new Date(intervention.dates.intervention);
                }
            } else {
                // Si pas de date, on ignore cette intervention
                return false;
            }
            
            const maintenant = new Date();
            const debut = new Date();
            
            switch (state.filtres.periode) {
                case 'today':
                    debut.setHours(0, 0, 0, 0);
                    if (dateIntervention < debut) return false;
                    break;
                case 'week':
                    debut.setDate(debut.getDate() - 7);
                    if (dateIntervention < debut) return false;
                    break;
                case 'month':
                    debut.setMonth(debut.getMonth() - 1);
                    if (dateIntervention < debut) return false;
                    break;
            }
        }
        
        return true;
    });
}

// ========================================
// ACTIONS
// ========================================

function handleSpecialFilter(filter) {
    switch (filter) {
        case 'today_completed':
            state.filtres.periode = 'today';
            state.filtres.statut = 'terminee';
            filtresInterventions.setFilter('periode', 'today');
            filtresInterventions.setFilter('statut', 'terminee');
            break;
            
        case 'week_sav':
            state.filtres.periode = 'week';
            state.filtres.resultat = 'SAV';
            filtresInterventions.setFilter('periode', 'week');
            filtresInterventions.setFilter('resultat', 'SAV');
            break;
    }
}

// ========================================
// HELPERS ET FORMATTERS
// ========================================

function formatDate(timestamp) {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDateUtil(date, 'DD/MM/YYYY');
}

function afficherStatut(statut) {
    const config = INTERVENTION_CONFIG.STATUTS[statut];
    if (!config) return statut;
    
    return `
        <span class="statut-icon-wrapper">
            <span class="statut-icon">${config.icon}</span>
            <span class="statut-tooltip">${config.label}</span>
        </span>
    `;
}

// ========================================
// EXPORTS POUR COMPATIBILITÉ
// ========================================

export function resetFiltres() {
    if (filtresInterventions) {
        filtresInterventions.reset();
    }
    
    state.filtres.statuts = [];
    
    if (statsCards && statsCards.elements.cards) {
        Object.values(statsCards.elements.cards).forEach(card => {
            card.classList.remove('active');
        });
    }
    
    afficherInterventions();
}

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [01/02/2025] - Découplage Firebase des composants
   - Utilisation de chargerMagasins() depuis firebase.service.js
   - Suppression de l'import direct de Firebase dans initFiltres()
   - Transformation du format { id: {...} } en tableau d'options
   - Réduction de la duplication de code
   
   AVANTAGES:
   - Pas de duplication du code de chargement des magasins
   - Séparation des responsabilités (UI vs Services)
   - Code plus maintenable
   - Un seul endroit pour modifier la logique de chargement
   
   NOTES:
   - chargerDonnees() utilise toujours Firebase directement car elle gère les interventions
   - Cela pourrait aussi être déplacé dans InterventionService plus tard
   ======================================== */