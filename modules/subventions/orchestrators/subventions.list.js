// ========================================
// SUBVENTIONS.LIST.JS - Orchestrateur de la liste des dossiers
// Chemin: modules/subventions/orchestrators/subventions.list.js
// ========================================

import config from '../core/subventions.config.js';
import { state } from './subventions.main.js';
import { subventionsData } from '../core/subventions.data.js';

// ========================================
// CONFIGURATION UI (adaptée à votre data.js)
// ========================================

// Configuration des filtres - UTILISE VOTRE DATA
const FILTERS_CONFIG = {
    recherche: {
        type: 'search',
        key: 'recherche',
        placeholder: 'Patient, n° dossier, téléphone...'
    },
    etapeMDPH: {
        type: 'select',
        key: 'etapeMDPH',
        label: 'Étape MDPH',
        keepPlaceholder: true,
        options: [
            { value: '', label: 'Toutes' },
            ...subventionsData.workflowMDPH.etapes.map(etape => ({
                value: etape.id,
                label: `${etape.icon} ${etape.label}`
            }))
        ]
    },
    etapeAGEFIPH: {
        type: 'select',
        key: 'etapeAGEFIPH',
        label: 'Étape AGEFIPH',
        keepPlaceholder: true,
        options: [
            { value: '', label: 'Toutes' },
            ...subventionsData.workflowAGEFIPH.etapes.map(etape => ({
                value: etape.id,
                label: `${etape.icon} ${etape.label}`
            }))
        ]
    },
    casParticulier: {
        type: 'select',
        key: 'casParticulier',
        label: 'Situation',
        keepPlaceholder: true,
        searchable: true,
        options: [
            { value: '', label: 'Toutes' },
            ...Object.entries(subventionsData.casParticuliers).map(([key, cas]) => ({
                value: key,
                label: cas.label,
                disabled: cas.eligible === false
            }))
        ]
    },
    departement: {
        type: 'select',
        key: 'departement',
        label: 'Département',
        keepPlaceholder: true,
        searchable: true,
        options: [
            { value: '', label: 'Tous' },
            ...Object.entries(subventionsData.delaisMDPH)
                .filter(([key]) => key !== 'default')
                .map(([code, dept]) => ({
                    value: code,
                    label: `${code} - ${dept.nom} (${dept.delai}j)`
                }))
        ]
    },
    periode: {
        type: 'select',
        key: 'periode',
        label: 'Période',
        defaultValue: 'all',
        keepPlaceholder: true,
        options: [
            { value: 'all', label: 'Toutes' },
            { value: 'today', label: "Aujourd'hui" },
            { value: 'week', label: 'Cette semaine' },
            { value: 'month', label: 'Ce mois' },
            { value: 'quarter', label: 'Ce trimestre' }
        ]
    }
};

// ========================================
// INSTANCES DES COMPOSANTS
// ========================================

let tableDossiers = null;
let filtresDossiers = null;
let statsCards = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeDossiers() {
    console.log('🚀 Initialisation orchestrateur liste dossiers...');
    
    // 1. Charger les données d'abord
    await chargerDonneesInitiales();
    
    // 2. Créer l'instance DataTable
    initDataTable();
    
    // 3. Créer les filtres
    initFiltres();
    
    // 4. Créer les cartes de statistiques
    initStatsCards();
    
    // 5. Connecter les composants entre eux
    connectComponents();
    
    console.log('✅ Orchestrateur liste dossiers initialisé');
}

// ========================================
// CHARGEMENT DONNÉES INITIALES
// ========================================

async function chargerDonneesInitiales() {
    try {
        // TODO: Charger depuis Firebase
        // Pour l'instant, utiliser les données mock
        state.dossiersData = getMockData();
        console.log('✅ Données initiales chargées');
    } catch (error) {
        console.error('❌ Erreur chargement initial:', error);
        state.dossiersData = [];
    }
}

// ========================================
// INITIALISATION DATATABLE
// ========================================

function initDataTable() {
    const container = document.querySelector('.subventions-table-container');
    if (!container) {
        console.error('❌ Container .subventions-table-container introuvable !');
        return;
    }
    
    tableDossiers = config.createSubventionsTable(container, {
        columns: [
            {
                key: 'numero',
                label: 'N° Dossier',
                sortable: true,
                width: 150,
                formatter: (value) => `<strong>${value}</strong>`
            },
            {
                key: 'patient',
                label: 'Patient',
                sortable: true,
                formatter: (patient) => config.HTML_TEMPLATES.patient(patient || {})
            },
            {
                key: 'mdph',
                label: 'MDPH',
                sortable: true,
                formatter: (mdph) => renderProgressColumn(mdph, 'mdph')
            },
            {
                key: 'agefiph',
                label: 'AGEFIPH',
                sortable: true,
                formatter: (agefiph) => renderProgressColumn(agefiph, 'agefiph')
            },
            {
                key: 'montant',
                label: 'Montant',
                sortable: true,
                formatter: (value) => config.HTML_TEMPLATES.montant(value)
            },
            {
                key: 'dateCreation',
                label: 'Créé le',
                sortable: true,
                formatter: (value) => formatDate(value)
            },
            {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                resizable: false,
                exportable: false,
                formatter: (_, row) => `
                    <button class="btn-icon" onclick="voirDetailDossier('${row.id}')">
                        👁️
                    </button>
                `
            }
        ],
        
        onPageChange: (page) => {
            state.currentPage = page;
        }
    });
    
    console.log('📊 DataTable créée avec config locale');
}

// ========================================
// INITIALISATION FILTRES
// ========================================

function initFiltres() {
    const filtresConfig = Object.values(FILTERS_CONFIG);
    
    const filtresContainer = document.querySelector('.subventions-filters');
    if (!filtresContainer) {
        console.error('❌ Container .subventions-filters introuvable !');
        return;
    }

    filtresDossiers = config.createSubventionsFilters(
        filtresContainer,
        filtresConfig,
        (filters) => handleFilterChange(filters)
    );
    
    console.log('🔍 Filtres créés avec config locale');
}

// ========================================
// INITIALISATION STATS CARDS
// ========================================

function initStatsCards() {
    const statsContainer = document.querySelector('.subventions-stats');
    if (!statsContainer) {
        console.error('❌ Container .subventions-stats introuvable !');
        return;
    }
    
    // Utiliser les données depuis subventions.data.js
    const cardsConfig = Object.entries(subventionsData.statsCards).map(([id, config]) => ({
        id,
        label: config.label,
        value: config.special && id === 'montant_total' ? '0 €' : 0,
        icon: config.icon,
        color: config.color
    }));
    
    statsCards = config.createSubventionsStatsCards(
        statsContainer,
        cardsConfig,
        (cardId) => handleStatsCardClick(cardId)
    );
    
    console.log('📈 StatsCards créées avec config locale');
}

// ========================================
// CONNEXION DES COMPOSANTS
// ========================================

function connectComponents() {
    console.log('🔗 Composants connectés via callbacks');
}

// ========================================
// GESTION DES INTERACTIONS
// ========================================

function handleFilterChange(filters) {
    state.filtres = {
        ...state.filtres,
        recherche: filters.recherche || '',
        statutMDPH: filters.statutMDPH || '',
        statutAGEFIPH: filters.statutAGEFIPH || '',
        technicien: filters.technicien || '',
        periode: filters.periode || 'all'
    };
    
    afficherDossiers();
}

function handleStatsCardClick(cardId) {
    console.log('🎯 Clic sur carte:', cardId);
    
    // Les cartes spéciales ne filtrent pas
    if (cardId === 'montant_total') return;
    
    // Toggle le filtre
    const index = state.filtres.statutsActifs.indexOf(cardId);
    
    if (index > -1) {
        state.filtres.statutsActifs.splice(index, 1);
        if (statsCards.elements.cards[cardId]) {
            statsCards.elements.cards[cardId].classList.remove('active');
        }
    } else {
        state.filtres.statutsActifs.push(cardId);
        if (statsCards.elements.cards[cardId]) {
            statsCards.elements.cards[cardId].classList.add('active');
        }
    }
    
    afficherDossiers();
}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

export async function chargerDonnees() {
    try {
        if (tableDossiers) {
            tableDossiers.state.loading = true;
            tableDossiers.refresh();
        }
        
        // TODO: Charger depuis Firebase
        state.dossiersData = getMockData();
        
        // Calculer les statistiques
        const stats = calculerStatistiques();
        afficherStatistiques(stats);
        
        // Afficher les dossiers
        afficherDossiers();
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
        state.dossiersData = [];
        afficherDossiers();
    } finally {
        if (tableDossiers) {
            tableDossiers.state.loading = false;
        }
    }
}

// ========================================
// AFFICHAGE DES DONNÉES
// ========================================

function afficherStatistiques(stats) {
    if (statsCards) {
        statsCards.updateAll({
            nouveau: stats.nouveau || 0,
            en_cours: stats.en_cours || 0,
            en_retard: stats.en_retard || 0,
            termine: stats.termine || 0,
            bloque: stats.bloque || 0,
            montant_total: formatMontant(stats.montant_total || 0)
        });
    }
}

export function afficherDossiers() {
    if (!tableDossiers) {
        console.error('DataTable non initialisée');
        return;
    }
    
    const dossiersFiltres = filtrerDossiersLocalement();
    tableDossiers.setData(dossiersFiltres);
}

// ========================================
// FILTRAGE LOCAL
// ========================================

function filtrerDossiersLocalement() {
    return state.dossiersData.filter(dossier => {
        // Filtre recherche
        if (state.filtres.recherche) {
            const recherche = state.filtres.recherche.toLowerCase();
            const patientNom = `${dossier.patient?.nom} ${dossier.patient?.prenom}`.toLowerCase();
            const numero = dossier.numero?.toLowerCase() || '';
            const telephone = dossier.patient?.telephone || '';
            
            if (!patientNom.includes(recherche) && 
                !numero.includes(recherche) && 
                !telephone.includes(recherche)) {
                return false;
            }
        }
        
        // Filtre statut MDPH
        if (state.filtres.statutMDPH && dossier.mdph?.statut !== state.filtres.statutMDPH) {
            return false;
        }
        
        // Filtre statut AGEFIPH
        if (state.filtres.statutAGEFIPH && dossier.agefiph?.statut !== state.filtres.statutAGEFIPH) {
            return false;
        }
        
        // Filtre technicien
        if (state.filtres.technicien && dossier.technicien !== state.filtres.technicien) {
            return false;
        }
        
        // Filtre statuts actifs (depuis cartes)
        if (state.filtres.statutsActifs && state.filtres.statutsActifs.length > 0) {
            if (!state.filtres.statutsActifs.includes(dossier.statutGlobal)) {
                return false;
            }
        }
        
        return true;
    });
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function renderProgressColumn(data, type) {
    if (!data) return '-';
    
    // Trouver l'étape dans le workflow
    const workflow = type === 'mdph' ? 
        subventionsData.workflowMDPH : 
        subventionsData.workflowAGEFIPH;
    
    const etape = workflow.etapes.find(e => e.id === data.etape);
    if (!etape) return '-';
    
    // Déterminer la classe de couleur
    let statusClass = 'info';
    if (etape.progression === 100) statusClass = 'success';
    else if (etape.progression >= 60) statusClass = 'warning';
    else if (etape.progression <= 20) statusClass = 'primary';
    
    // Si bloqué
    if (type === 'agefiph' && etape.bloquePar) {
        statusClass = 'danger';
    }
    
    return `
        <div class="progress-column">
            <span class="badge badge-${statusClass}">
                ${etape.icon} ${etape.label}
            </span>
            <div class="progress-bar mini">
                <div class="progress-fill ${type === 'agefiph' ? 'agefiph' : ''}" 
                     style="width: ${etape.progression}%"></div>
            </div>
            <span class="progress-text">${etape.progression}%</span>
            ${etape.bloquePar ? `
                <small class="text-danger">
                    Bloqué par ${etape.bloquePar}
                </small>
            ` : ''}
        </div>
    `;
}

function calculerRetardMDPH(dossier) {
    if (!dossier.mdph?.dateDepot) return false;
    
    const departement = dossier.patient?.departement || 'default';
    const delaiConfig = subventionsData.delaisMDPH[departement] || 
                       subventionsData.delaisMDPH.default;
    
    const dateDepot = new Date(dossier.mdph.dateDepot);
    const joursEcoules = Math.floor((new Date() - dateDepot) / (1000 * 60 * 60 * 24));
    
    return joursEcoules > delaiConfig.alerte;
}

// ========================================
// DONNÉES MOCK
// ========================================

function getMockData() {
    return [
        {
            id: '1',
            numero: 'SUB-2024-0001',
            patient: {
                nom: 'MARTIN',
                prenom: 'Jean',
                telephone: '06 12 34 56 78',
                departement: '75'
            },
            mdph: {
                etape: 'depot',
                dateDepot: '2024-01-25'
            },
            agefiph: {
                etape: 'documents',
                bloquePar: null
            },
            montant: 3500,
            dateCreation: '2024-01-15',
            casParticulier: 'salarie',
            statutGlobal: 'en_cours'
        },
        {
            id: '2',
            numero: 'SUB-2024-0002',
            patient: {
                nom: 'DURAND',
                prenom: 'Marie',
                telephone: '06 98 76 54 32',
                departement: '93'
            },
            mdph: {
                etape: 'recepisse',
                dateDepot: '2023-12-01'
            },
            agefiph: {
                etape: 'attente_recepisse',
                bloquePar: 'mdph.recepisse'
            },
            montant: 4200,
            dateCreation: '2023-11-20',
            casParticulier: 'independant',
            statutGlobal: 'en_retard' // 93 = 150 jours de délai
        },
        {
            id: '3',
            numero: 'SUB-2024-0003',
            patient: {
                nom: 'BERNARD',
                prenom: 'Paul',
                telephone: '06 45 67 89 12',
                departement: '78'
            },
            mdph: {
                etape: 'nouveau',
                dateDepot: null
            },
            agefiph: {
                etape: 'attente',
                bloquePar: null
            },
            montant: 2800,
            dateCreation: '2024-02-01',
            casParticulier: 'demandeur_emploi',
            statutGlobal: 'nouveau'
        }
    ];
}

// ========================================
// EXPORTS
// ========================================

export function resetFiltres() {
    if (filtresDossiers) {
        filtresDossiers.reset();
    }
    
    state.filtres.statutsActifs = [];
    
    if (statsCards && statsCards.elements.cards) {
        Object.values(statsCards.elements.cards).forEach(card => {
            card.classList.remove('active');
        });
    }
    
    afficherDossiers();
}