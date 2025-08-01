// ========================================
// COMMANDES.LIST.JS - Orchestrateur de la liste des commandes
// Chemin: modules/commandes/commandes.list.js
//
// DESCRIPTION:
// Orchestre DataTable, DataTableFilters et StatsCards
// Gère toutes les interactions entre les composants
//
// MODIFIÉ le 02/02/2025:
// - DÉPLACEMENT de toutes les configs UI ici (depuis commandes.data.js)
// - L'orchestrateur décide maintenant comment présenter les données
// ========================================

import { CommandesService } from '../../src/services/commandes.service.js';
import { 
    COMMANDES_CONFIG,
    calculerDelaiLivraison,
    genererNumeroCommande,
    formaterPrix
} from '../../src/data/commandes.data.js';
import { 
    DataTable, 
    DataTableFilters, 
    StatsCards, 
    DropdownList,
    formatDate as formatDateUtil 
} from '../../src/components/index.js';

// 🔑 IMPORT DES MODULES DATATABLE
import { DataTableSort } from '../../src/components/ui/datatable/datatable.sort.js';
import { DataTableExport } from '../../src/components/ui/datatable/datatable.export.js';
import { DataTablePagination } from '../../src/components/ui/datatable/datatable.pagination.js';
import { DataTableResize } from '../../src/components/ui/datatable/datatable.resize.js';

import { state } from './commandes.main.js';
import { chargerMagasins } from '../../src/services/firebase.service.js';

// ========================================
// 🆕 CONFIGURATION UI (DÉPLACÉE ICI)
// ========================================

// Configuration des filtres - L'ORCHESTRATEUR décide
const FILTERS_CONFIG = {
    recherche: {
        type: 'search',
        key: 'recherche',
        placeholder: 'Client, produit, n° commande...'
    },
    magasin: {
        type: 'select',
        key: 'magasin',
        label: 'Magasin',
        keepPlaceholder: true,
        searchable: true,
        options: [] // Chargé dynamiquement
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
            { value: 'month', label: 'Ce mois' }
        ]
    },
    urgence: {
        type: 'select',
        key: 'urgence',
        label: 'Urgence',
        keepPlaceholder: true,
        showIcons: true,
        options: [] // Généré depuis les constantes
    }
};

// Configuration des stats cards - L'ORCHESTRATEUR décide
const STATS_CARDS_CONFIG = {
    cartes: [
        { statut: 'nouvelle', color: 'info' },
        { statut: 'preparation', color: 'warning' },
        { statut: 'terminee', color: 'secondary' },
        { statut: 'expediee', color: 'primary' },
        { statut: 'receptionnee', color: 'info' },
        { statut: 'livree', color: 'success' }
    ]
};

// Configuration des colonnes d'export - L'ORCHESTRATEUR décide
const EXPORT_CONFIG = {
    colonnes: [
        { key: 'numeroCommande', label: 'N° Commande' },
        { key: 'date', label: 'Date', formatter: 'date' },
        { key: 'client', label: 'Client', formatter: 'client' },
        { key: 'telephone', label: 'Téléphone' },
        { key: 'typePreparation', label: 'Type', formatter: 'typePreparation' },
        { key: 'niveauUrgence', label: 'Urgence', formatter: 'urgence' },
        { key: 'statut', label: 'Statut', formatter: 'statut' },
        { key: 'magasinLivraison', label: 'Magasin Livraison' },
        { key: 'commentaires', label: 'Commentaires' }
    ]
};

// Templates d'affichage HTML - L'ORCHESTRATEUR décide
const DISPLAY_TEMPLATES = {
    urgence: {
        getHTML: (config) => `
            <span class="urgence-icon-wrapper">
                <span class="urgence-icon">${config.icon}</span>
                <span class="urgence-tooltip">${config.label} (${config.delai})</span>
            </span>
        `
    },
    statut: {
        getHTML: (config) => `
            <span class="statut-icon-wrapper">
                <span class="statut-icon">${config.icon}</span>
                <span class="statut-tooltip">${config.label}</span>
            </span>
        `
    }
};

// ========================================
// 🆕 FONCTIONS DE GÉNÉRATION (DÉPLACÉES ICI)
// ========================================

/**
 * Générer les options de filtres dynamiquement
 * DÉPLACÉ depuis commandes.data.js
 */
function genererOptionsFiltres() {
    const config = { ...FILTERS_CONFIG };
    
    // Générer les options d'urgence depuis NIVEAUX_URGENCE
    config.urgence.options = [
        { value: '', label: 'Toutes' },
        ...Object.entries(COMMANDES_CONFIG.NIVEAUX_URGENCE).map(([key, urgence]) => ({
            value: key,
            label: `${urgence.icon} ${urgence.label}`
        }))
    ];
    
    // Retourner tous les filtres sous forme de tableau
    return Object.values(config);
}

/**
 * Générer la configuration des cartes de statistiques
 * DÉPLACÉ depuis commandes.data.js
 */
function genererConfigStatsCards() {
    return STATS_CARDS_CONFIG.cartes.map(carte => {
        const statut = COMMANDES_CONFIG.STATUTS[carte.statut];
        return {
            id: carte.statut,
            label: statut.label,
            value: 0,
            icon: statut.icon,
            color: carte.color
        };
    });
}

/**
 * Formater les données pour l'export
 * DÉPLACÉ depuis commandes.data.js
 */
function formaterDonneesExport(data) {
    return data.map(row => {
        const result = {};
        
        EXPORT_CONFIG.colonnes.forEach(col => {
            switch (col.formatter) {
                case 'date':
                    result[col.label] = formatDate(row.dates?.commande);
                    break;
                case 'client':
                    result[col.label] = `${row.client.prenom} ${row.client.nom}`;
                    break;
                case 'typePreparation':
                    result[col.label] = COMMANDES_CONFIG.TYPES_PREPARATION[row.typePreparation]?.label || row.typePreparation;
                    break;
                case 'urgence':
                    result[col.label] = COMMANDES_CONFIG.NIVEAUX_URGENCE[row.niveauUrgence]?.label || row.niveauUrgence;
                    break;
                case 'statut':
                    result[col.label] = COMMANDES_CONFIG.STATUTS[row.statut]?.label || row.statut;
                    break;
                default:
                    result[col.label] = row[col.key] || '-';
            }
        });
        
        return result;
    });
}

// ========================================
// INSTANCES DES COMPOSANTS
// ========================================

let tableCommandes = null;
let filtresCommandes = null;
let statsCards = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeCommandes() {
    console.log('🚀 Initialisation orchestrateur liste commandes...');
    
    // 1. Créer l'instance DataTable avec injection
    initDataTable();
    
    // 2. Créer les filtres avec injection de DropdownList
    await initFiltres();
    
    // 3. Créer les cartes de statistiques
    initStatsCards();
    
    // 4. Connecter les composants entre eux
    connectComponents();
    
    console.log('✅ Orchestrateur liste initialisé');
}

// ... (reste du code inchangé jusqu'à initFiltres)

async function initFiltres() {
    // 🆕 Utiliser la fonction locale genererOptionsFiltres()
    let filtresConfig = genererOptionsFiltres();
    
    // Charger dynamiquement les magasins
    try {
        const magasinsData = await chargerMagasins();
        
        if (magasinsData) {
            // Transformer en tableau d'options
            const magasins = Object.entries(magasinsData)
                .filter(([id, data]) => data.actif !== false)
                .map(([id, data]) => ({
                    value: data.code || id,
                    label: data.nom || data.code || id
                }))
                .sort((a, b) => a.label.localeCompare(b.label));
            
            // Trouver le filtre magasin et ajouter les options
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
    
    // Ajuster pour séparer les icônes
    const filtresAjustes = ajusterIconesFiltres(filtresConfig);
    
    // Créer l'instance DataTableFilters avec injections
    filtresCommandes = new DataTableFilters({
        container: '.commandes-filters',
        filters: filtresAjustes,
        
        // 🔑 INJECTION DE DROPDOWNLIST
        DropdownClass: DropdownList,
        
        // 🔑 INJECTION DES CLASSES CSS
        buttonClasses: {
            reset: 'btn btn-reset pill'
        },
        
        // Callback appelé quand les filtres changent
        onFilter: (filters) => {
            handleFilterChange(filters);
        }
    });
    
    console.log('🔍 Filtres créés avec DropdownList et classes CSS injectés');
}

function initStatsCards() {
    // 🆕 Utiliser la fonction locale genererConfigStatsCards()
    const cardsConfig = genererConfigStatsCards();
    
    statsCards = new StatsCards({
        container: '.commandes-stats',
        cards: cardsConfig,
        animated: true,
        
        // 🔑 GESTION DU CLIC ICI DANS L'ORCHESTRATEUR
        onClick: (cardId) => {
            handleStatsCardClick(cardId);
        }
    });
    
    console.log('📈 StatsCards créées');
}

// ... (reste du code avec les fonctions d'affichage modifiées)

function afficherUrgence(urgence) {
    const config = COMMANDES_CONFIG.NIVEAUX_URGENCE[urgence];
    if (!config) return urgence;
    
    // 🆕 Utiliser le template local
    return DISPLAY_TEMPLATES.urgence.getHTML(config);
}

function afficherStatut(statut) {
    const config = COMMANDES_CONFIG.STATUTS[statut];
    if (!config) return statut;
    
    // 🆕 Utiliser le template local
    return DISPLAY_TEMPLATES.statut.getHTML(config);
}

/**
 * Préparer les données pour l'export
 */
function prepareExportData(data) {
    // 🆕 Utiliser la fonction locale
    return formaterDonneesExport(data);
}

// ... (reste du code inchangé)

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [02/02/2025] - Déplacement des configs UI depuis commandes.data.js
   - AJOUT : FILTERS_CONFIG (configuration des filtres)
   - AJOUT : STATS_CARDS_CONFIG (configuration des cartes)
   - AJOUT : EXPORT_CONFIG (configuration de l'export)
   - AJOUT : DISPLAY_TEMPLATES (templates HTML)
   - AJOUT : genererOptionsFiltres() (génération des options)
   - AJOUT : genererConfigStatsCards() (génération config cartes)
   - AJOUT : formaterDonneesExport() (formatage pour export)
   - L'orchestrateur contrôle maintenant TOUTE la présentation
   ======================================== */