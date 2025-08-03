// ========================================
// COMMANDES.LIST.JS - Orchestrateur de la liste des commandes
// Chemin: modules/commandes/commandes.list.js
//
// DESCRIPTION:
// Orchestre DataTable, DataTableFilters et StatsCards
// Gère toutes les interactions entre les composants
//
// MODIFIÉ le 01/02/2025:
// - Architecture IoC stricte : aucun composant ne se connaît
// - Injection de tous les modules et classes CSS
// - L'orchestrateur fait TOUS les liens
//
// MODIFIÉ le 02/02/2025:
// - DÉPLACEMENT de toutes les configs UI ici (depuis commandes.data.js)
// - L'orchestrateur décide maintenant comment présenter les données
//
// MODIFIÉ le 29/12/2024:
// - Intégration de ui.config.js pour les styles de boutons
// ========================================

import { DecomptesMutuellesService } from './decompte-mutuelle.service.js';
import { 
    DECOMPTES_CONFIG,
    formaterDate,
    formaterMontant,
    formaterNSS,
    getListeMutuelles,
    getListePrestataires,
    mettreAJourMutuelles,
    mettreAJourReseauxTP
} from './decompte-mutuelle.data.js';
import { formatDate as formatDateUtil } from '../../src/components/index.js';
import config from './decompte-mutuelle.config.js';
import { state } from './decompte-mutuelle.main.js';
import { chargerMagasins } from '../../src/services/firebase.service.js';
import { Button } from '../../src/components/ui/button/button.component.js';

// ========================================
// CONFIGURATION UI (L'ORCHESTRATEUR DÉCIDE)
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
// 🆕 FONCTIONS DE GÉNÉRATION (DÉPLACÉES ICI DEPUIS COMMANDES.DATA.JS)
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

// ========================================
// INITIALISATION DATATABLE AVEC INJECTIONS
// ========================================

function initDataTable() {
    tableCommandes = config.createCommandesTable('.commandes-table-container', {
        columns: [
            {
                key: 'dates.commande',
                label: 'Date',
                sortable: true,
                width: 100,
                formatter: (value) => formatDate(value)
            },
            {
                key: 'magasinLivraison',
                label: 'Magasin',
                sortable: true,
                width: 80,
                formatter: (value) => value || '-'
            },
            {
                key: 'client',
                label: 'Client',
                sortable: true,
                formatter: (client) => `${client.prenom} ${client.nom}`,
                sortFunction: (a, b, direction) => {
                    const nameA = `${a.prenom} ${a.nom}`.toLowerCase();
                    const nameB = `${b.prenom} ${b.nom}`.toLowerCase();
                    return direction === 'asc' 
                        ? nameA.localeCompare(nameB, 'fr')
                        : nameB.localeCompare(nameA, 'fr');
                }
            },
            {
                key: 'typePreparation',
                label: 'Type de préparation',
                sortable: true,
                formatter: (value) => {
                    const configData = COMMANDES_CONFIG.TYPES_PREPARATION[value];
                    if (!configData) {
                        console.warn(`Type non trouvé: "${value}"`);
                        return value || '-';
                    }
                    const badge = config.createBadge(configData.label, {
    type: value.replace(/_/g, '-'),
    icon: configData.icon
});
return badge.toString();
                }
            },
            {
                key: 'niveauUrgence',
                label: 'Urgence',
                sortable: true,
                formatter: (value) => afficherUrgence(value)
            },
            {
                key: 'statut',
                label: 'Statut',
                sortable: true,
                formatter: (value) => afficherStatut(value)
            },
            {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                resizable: false,
                exportable: false,
                formatter: (_, row) => `
                    <button class="${config.BUTTON_CLASSES.action}" onclick="voirDetailCommande('${row.id}')">
                        👁️
                    </button>
                `
            }
        ],
        
        // Callback pour gérer le changement de page
        onPageChange: (page) => {
            state.currentPage = page;
        },
        
        export: {
            csv: true,
            excel: true,
            filename: `commandes_${formatDateUtil(new Date(), 'YYYY-MM-DD')}`,
            onBeforeExport: (data) => prepareExportData(data)
        }
    });
    
    console.log('📊 DataTable créée avec config locale');
}

// ========================================
// INITIALISATION FILTRES AVEC INJECTIONS
// ========================================

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
    
    // Créer l'instance DataTableFilters avec la config locale
    filtresCommandes = config.createCommandesFilters(
        '.commandes-filters',
        filtresAjustes,
        (filters) => handleFilterChange(filters)
    );
    
    console.log('🔍 Filtres créés avec config locale');
}

// ========================================
// INITIALISATION STATS CARDS
// ========================================

function initStatsCards() {
    // 🆕 Utiliser la fonction locale genererConfigStatsCards()
    const cardsConfig = genererConfigStatsCards();
    
    statsCards = config.createCommandesStatsCards(
        '.commandes-stats',
        cardsConfig,
        (cardId) => handleStatsCardClick(cardId)
    );
    
    console.log('📈 StatsCards créées avec config locale');
}

// ========================================
// CONNEXION DES COMPOSANTS
// ========================================

function connectComponents() {
    // Les composants sont déjà connectés via leurs callbacks
    // Cette fonction pourrait servir pour des connexions additionnelles
    console.log('🔗 Composants connectés via callbacks');
}

// ========================================
// GESTION DES INTERACTIONS
// ========================================

/**
 * Gestion du changement de filtres
 * Appelé par DataTableFilters via callback
 */
function handleFilterChange(filters) {
    // Détecter si c'est un reset
    const isReset = !filters.recherche && 
                    !filters.magasin && 
                    filters.periode === 'all' && 
                    !filters.urgence;
    
    if (isReset) {
        // Reset complet incluant les statuts
        state.filtres = {
            recherche: '',
            magasin: '',
            periode: 'all',
            urgence: '',
            statuts: []  // Reset les statuts
        };
        
        // Désélectionner visuellement toutes les cartes
        if (statsCards && statsCards.elements.cards) {
            Object.values(statsCards.elements.cards).forEach(card => {
                card.classList.remove('active');
            });
        }
    } else {
        // Mise à jour partielle, conserver les statuts
        state.filtres = {
            ...state.filtres,  // Conserver les statuts existants
            recherche: filters.recherche || '',
            magasin: filters.magasin || '',  
            periode: filters.periode || 'all',
            urgence: filters.urgence || ''
        };
    }
    
    // Rafraîchir l'affichage
    if (tableCommandes) {
        afficherCommandes();
    }
}

/**
 * Gestion du clic sur une carte de statistiques
 * Toggle le filtre par statut
 */
function handleStatsCardClick(cardId) {
    // Toggle : ajouter ou retirer du filtre
    const index = state.filtres.statuts.indexOf(cardId);
    
    if (index > -1) {
        // Le statut est déjà sélectionné, on le retire
        state.filtres.statuts.splice(index, 1);
        // Retirer la classe active de la carte
        if (statsCards.elements.cards[cardId]) {
            statsCards.elements.cards[cardId].classList.remove('active');
        }
    } else {
        // Le statut n'est pas sélectionné, on l'ajoute
        state.filtres.statuts.push(cardId);
        // Ajouter la classe active à la carte
        if (statsCards.elements.cards[cardId]) {
            statsCards.elements.cards[cardId].classList.add('active');
        }
    }
    
    // Réafficher les commandes avec le nouveau filtre
    afficherCommandes();
}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

export async function chargerDonnees() {
    try {
        // Afficher le loader
        if (tableCommandes) {
            tableCommandes.state.loading = true;
            tableCommandes.refresh();
        }
        
        // Charger les commandes
        state.commandesData = await CommandesService.getCommandes();
        
        // Si pas de commandes, initialiser un tableau vide
        if (!state.commandesData) {
            state.commandesData = [];
        }
        
        // Charger les statistiques
        const stats = await CommandesService.getStatistiques();
        afficherStatistiques(stats);
        
        // Afficher les commandes
        afficherCommandes();
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
        // En cas d'erreur, initialiser avec des données vides
        state.commandesData = [];
        afficherStatistiques({
            parStatut: {},
            parUrgence: {},
            retards: 0
        });
        afficherCommandes();
    } finally {
        if (tableCommandes) {
            tableCommandes.state.loading = false;
        }
    }
}

// ========================================
// AFFICHAGE DES DONNÉES
// ========================================

function afficherStatistiques(stats) {
    if (statsCards) {
        // Ne mettre à jour que les statuts qui ont des cartes
        const statsToUpdate = {};
        
        // 🆕 Utiliser la config locale STATS_CARDS_CONFIG
        STATS_CARDS_CONFIG.cartes.forEach(carte => {
            statsToUpdate[carte.statut] = stats.parStatut[carte.statut] || 0;
        });
        
        statsCards.updateAll(statsToUpdate);
    }
}

function afficherCommandes() {
    if (!tableCommandes) {
        console.error('DataTable non initialisée');
        return;
    }
    
    // Filtrer les commandes
    const commandesFiltrees = filtrerCommandesLocalement();
    
    // Envoyer les données à DataTable
    tableCommandes.setData(commandesFiltrees);
}

// ========================================
// FILTRAGE LOCAL
// ========================================

function filtrerCommandesLocalement() {
    return state.commandesData.filter(commande => {
        // Exclure systématiquement les commandes supprimées
        if (commande.statut === 'supprime') {
            return false;
        }
        
        // Filtre recherche
        if (state.filtres.recherche) {
            const recherche = state.filtres.recherche.toLowerCase();
            const clientNom = `${commande.client.prenom} ${commande.client.nom}`.toLowerCase();
            const numero = commande.numeroCommande?.toLowerCase() || '';
            const produits = commande.produits?.map(p => p.designation.toLowerCase()).join(' ') || '';
            
            if (!clientNom.includes(recherche) && 
                !numero.includes(recherche) && 
                !produits.includes(recherche)) {
                return false;
            }
        }
        
        // Filtre magasin
        if (state.filtres.magasin && commande.magasinLivraison !== state.filtres.magasin) {
            return false;
        }
        
        // Filtre urgence
        if (state.filtres.urgence && commande.niveauUrgence !== state.filtres.urgence) {
            return false;
        }
        
        // 🔑 Filtre statuts multiples (depuis les cartes)
        if (state.filtres.statuts.length > 0 && !state.filtres.statuts.includes(commande.statut)) {
            return false;
        }
        
        // Filtre période
        if (state.filtres.periode !== 'all') {
            const dateCommande = commande.dates.commande?.toDate ? 
                commande.dates.commande.toDate() : 
                new Date(commande.dates.commande);
            
            const maintenant = new Date();
            const debut = new Date();
            
            switch (state.filtres.periode) {
                case 'today':
                    debut.setHours(0, 0, 0, 0);
                    if (dateCommande < debut) return false;
                    break;
                case 'week':
                    debut.setDate(debut.getDate() - 7);
                    if (dateCommande < debut) return false;
                    break;
                case 'month':
                    debut.setMonth(debut.getMonth() - 1);
                    if (dateCommande < debut) return false;
                    break;
            }
        }
        
        return true;
    });
}

// ========================================
// FONCTIONS EXPOSÉES POUR COMPATIBILITÉ
// ========================================

export function filtrerCommandes() {
    // Cette fonction est appelée par le HTML mais n'est plus nécessaire
    // Les filtres sont gérés automatiquement par DataTableFilters
    console.log('Filtrage géré automatiquement par DataTableFilters');
}

export function resetFiltres() {
    // Utiliser la méthode reset du composant
    if (filtresCommandes) {
        filtresCommandes.reset();
    }
    
    // Réinitialiser aussi les statuts sélectionnés
    state.filtres.statuts = [];
    
    // Retirer la classe active de toutes les cartes
    if (statsCards && statsCards.elements.cards) {
        Object.values(statsCards.elements.cards).forEach(card => {
            card.classList.remove('active');
        });
    }
    
    // Réafficher les commandes sans filtres
    afficherCommandes();
}

// ========================================
// FORMATTERS ET UTILITAIRES
// ========================================

function formatDate(timestamp) {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDateUtil(date, 'DD/MM/YYYY');
}

function afficherUrgence(urgence) {
    const configData = COMMANDES_CONFIG.NIVEAUX_URGENCE[urgence];
    if (!configData) return urgence;
    
    return config.HTML_TEMPLATES.urgence(configData);
}

function afficherStatut(statut) {
    const configData = COMMANDES_CONFIG.STATUTS[statut];
    if (!configData) return statut;
    
    return config.HTML_TEMPLATES.statut(configData);
}

/**
 * Préparer les données pour l'export
 */
function prepareExportData(data) {
    // 🆕 Utiliser la fonction locale formaterDonneesExport
    return formaterDonneesExport(data);
}

/**
 * Ajuster les options pour séparer les icônes du label
 */
function ajusterIconesFiltres(filtresConfig) {
    return filtresConfig.map(filtre => {
        if (filtre.type === 'select' && filtre.options) {
            filtre.options = filtre.options.map(option => {
                if (typeof option === 'object' && option.label) {
                    // Extraire l'icône du label si présente
                    const iconMatch = option.label.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
                    
                    if (iconMatch && !option.icon) {
                        return {
                            value: option.value,
                            label: option.label.substring(iconMatch[0].length).trim(),
                            icon: iconMatch[0]
                        };
                    }
                }
                return option;
            });
        }
        
        // Activer keepPlaceholder sur tous les filtres select
        if (filtre.type === 'select') {
            return {
                ...filtre,
                keepPlaceholder: true
            };
        }
        
        return filtre;
    });
}

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [01/02/2025] - Architecture harmonisée avec injection complète
   - Import des modules DataTable (Sort, Export, Pagination, Resize)
   - Injection des modules dans DataTable via config.modules
   - Injection des classes CSS dans DataTable via config.buttonClasses
   - Injection des classes CSS dans DataTableFilters
   - L'orchestrateur fait TOUS les liens, les composants ne se connaissent pas
   
   [02/02/2025] - Déplacement des configs UI depuis commandes.data.js
   - AJOUT : FILTERS_CONFIG (configuration des filtres)
   - AJOUT : STATS_CARDS_CONFIG (configuration des cartes)
   - AJOUT : EXPORT_CONFIG (configuration de l'export)
   - AJOUT : DISPLAY_TEMPLATES (templates HTML)
   - AJOUT : genererOptionsFiltres() (génération des options)
   - AJOUT : genererConfigStatsCards() (génération config cartes)
   - AJOUT : formaterDonneesExport() (formatage pour export)
   - L'orchestrateur contrôle maintenant TOUTE la présentation
   
   ARCHITECTURE FINALE:
   commandes.list.js (orchestrateur)
       ├── DataTable (reçoit modules et classes CSS)
       ├── DataTableFilters (reçoit DropdownList et classes CSS)
       └── StatsCards (indépendant)
   
   Les composants communiquent uniquement par callbacks.
   L'orchestrateur est le seul à connaître tous les composants.
   ======================================== */