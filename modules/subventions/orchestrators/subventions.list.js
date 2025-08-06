// ========================================
// SUBVENTIONS.LIST.JS - Orchestrateur de la liste des dossiers
// Chemin: modules/subventions/orchestrators/subventions.list.js
// ========================================

import config from '../core/subventions.config.js';
import { state } from './subventions.main.js';

// ========================================
// CONFIGURATION UI (L'ORCHESTRATEUR DÉCIDE)
// ========================================

// Configuration des filtres
const FILTERS_CONFIG = {
    recherche: {
        type: 'search',
        key: 'recherche',
        placeholder: 'Patient, n° dossier, téléphone...'
    },
    statutMDPH: {
        type: 'select',
        key: 'statutMDPH',
        label: 'Statut MDPH',
        keepPlaceholder: true,
        options: [
            { value: '', label: 'Tous' },
            { value: 'nouveau', label: 'Nouveau' },
            { value: 'documents', label: 'Documents' },
            { value: 'depot', label: 'Dépôt' },
            { value: 'accord', label: 'Accord' },
            { value: 'refuse', label: 'Refusé' }
        ]
    },
    statutAGEFIPH: {
        type: 'select',
        key: 'statutAGEFIPH',
        label: 'Statut AGEFIPH',
        keepPlaceholder: true,
        options: [
            { value: '', label: 'Tous' },
            { value: 'nouveau', label: 'Nouveau' },
            { value: 'documents', label: 'Documents' },
            { value: 'depot', label: 'Dépôt' },
            { value: 'accord', label: 'Accord' },
            { value: 'refuse', label: 'Refusé' }
        ]
    },
    technicien: {
        type: 'select',
        key: 'technicien',
        label: 'Technicien',
        keepPlaceholder: true,
        searchable: true,
        options: [
            { value: '', label: 'Tous' },
            { value: 'jean', label: 'Jean Dupont' },
            { value: 'marie', label: 'Marie Martin' },
            { value: 'pierre', label: 'Pierre Durand' }
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

// Configuration des stats cards
const STATS_CARDS_CONFIG = {
    cartes: [
        { id: 'nouveau', label: 'Nouveaux', icon: '📄', color: 'primary' },
        { id: 'en_cours', label: 'En cours', icon: '⏳', color: 'warning' },
        { id: 'en_retard', label: 'En retard', icon: '⚠️', color: 'danger' },
        { id: 'termine', label: 'Terminés', icon: '✅', color: 'success' },
        { id: 'bloque', label: 'Bloqués', icon: '🔴', color: 'error' },
        { id: 'montant_total', label: 'Montant total', icon: '💰', color: 'info', special: true }
    ]
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
    
    const cardsConfig = STATS_CARDS_CONFIG.cartes.map(carte => ({
        id: carte.id,
        label: carte.label,
        value: carte.special && carte.id === 'montant_total' ? '0 €' : 0,
        icon: carte.icon,
        color: carte.color
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
    
    const statusClass = getStatusClass(data.statut);
    const barClass = type === 'agefiph' ? 'agefiph' : '';
    
    return `
        <div class="progress-column">
            <span class="badge badge-${statusClass}">
                ${data.statut}
            </span>
            <div class="progress-bar mini">
                <div class="progress-fill ${barClass}" style="width: ${data.progression}%"></div>
            </div>
            <span class="progress-text">${data.progression}%</span>
        </div>
    `;
}

function getStatusClass(statut) {
    const classes = {
        'nouveau': 'primary',
        'documents': 'info',
        'depot': 'warning',
        'accord': 'success',
        'refuse': 'danger'
    };
    return classes[statut] || 'secondary';
}

function formatDate(date) {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('fr-FR');
}

function formatMontant(montant) {
    return montant.toLocaleString('fr-FR', { 
        style: 'currency', 
        currency: 'EUR' 
    });
}

function calculerStatistiques() {
    const stats = {
        nouveau: 0,
        en_cours: 0,
        en_retard: 0,
        termine: 0,
        bloque: 0,
        montant_total: 0
    };
    
    state.dossiersData.forEach(dossier => {
        // Calculer le statut global
        if (dossier.statutGlobal === 'nouveau') stats.nouveau++;
        else if (dossier.statutGlobal === 'en_cours') stats.en_cours++;
        else if (dossier.statutGlobal === 'en_retard') stats.en_retard++;
        else if (dossier.statutGlobal === 'termine') stats.termine++;
        else if (dossier.statutGlobal === 'bloque') stats.bloque++;
        
        stats.montant_total += dossier.montant || 0;
    });
    
    return stats;
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
                telephone: '06 12 34 56 78'
            },
            mdph: {
                statut: 'depot',
                progression: 60
            },
            agefiph: {
                statut: 'documents',
                progression: 40
            },
            montant: 3500,
            dateCreation: '2024-01-15',
            technicien: 'jean',
            statutGlobal: 'en_cours'
        },
        {
            id: '2',
            numero: 'SUB-2024-0002',
            patient: {
                nom: 'DURAND',
                prenom: 'Marie',
                telephone: '06 98 76 54 32'
            },
            mdph: {
                statut: 'accord',
                progression: 100
            },
            agefiph: {
                statut: 'depot',
                progression: 80
            },
            montant: 4200,
            dateCreation: '2024-01-20',
            technicien: 'marie',
            statutGlobal: 'en_cours'
        },
        {
            id: '3',
            numero: 'SUB-2024-0003',
            patient: {
                nom: 'BERNARD',
                prenom: 'Paul',
                telephone: '06 45 67 89 12'
            },
            mdph: {
                statut: 'nouveau',
                progression: 0
            },
            agefiph: {
                statut: 'nouveau',
                progression: 0
            },
            montant: 2800,
            dateCreation: '2024-02-01',
            technicien: 'pierre',
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