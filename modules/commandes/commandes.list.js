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
// - Injection de DropdownList dans DataTableFilters
// - Gestion de l'interaction StatsCards/filtres ICI
// - Les composants sont 100% autonomes
//
// DÉPENDANCES:
// - CommandesService (logique métier)
// - DataTable, DataTableFilters, DropdownList, StatsCards (composants UI)
// - COMMANDES_CONFIG (configuration)
// ========================================

import { CommandesService } from '../../src/services/commandes.service.js';
import { 
    COMMANDES_CONFIG, 
    genererOptionsFiltres,
    genererConfigStatsCards,
    formaterDonneesExport 
} from '../../src/data/commandes.data.js';
import { 
    DataTable, 
    DataTableFilters, 
    StatsCards, 
    DropdownList,
    formatDate as formatDateUtil 
} from '../../src/components/index.js';
import { state } from './commandes.main.js';
import { chargerMagasins } from '../../src/services/firebase.service.js';

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
    
    // 1. Créer l'instance DataTable
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
// INITIALISATION DATATABLE
// ========================================

function initDataTable() {
    tableCommandes = new DataTable({
        container: '.commandes-table-container',
        
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
                    const config = COMMANDES_CONFIG.TYPES_PREPARATION[value];
                    if (!config) {
                        console.warn(`Type non trouvé: "${value}"`);
                        return value || '-';
                    }
                    return `<span class="badge badge-${value.replace(/_/g, '-')}">${config.icon} ${config.label}</span>`;
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
                    <button class="btn-action" onclick="voirDetailCommande('${row.id}')">
                        👁️
                    </button>
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
            filename: `commandes_${formatDateUtil(new Date(), 'YYYY-MM-DD')}`,
            onBeforeExport: (data) => prepareExportData(data)
        },
        
        messages: {
            noData: 'Aucune commande trouvée',
            loading: 'Chargement des commandes...',
            itemsPerPage: 'Éléments par page',
            page: 'Page',
            of: 'sur',
            items: 'éléments'
        },
        
        // Callback pour gérer le changement de page
        onPageChange: (page) => {
            state.currentPage = page;
        }
    });
    
    console.log('📊 DataTable créée');
}

// ========================================
// INITIALISATION FILTRES AVEC DROPDOWN
// ========================================

async function initFiltres() {
    // Récupérer la configuration des filtres
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
    
    // Créer l'instance DataTableFilters avec DropdownList injecté
    filtresCommandes = new DataTableFilters({
        container: '.commandes-filters',
        filters: filtresAjustes,
        
        // 🔑 INJECTION DE DROPDOWNLIST
        DropdownClass: DropdownList,
        
        // Callback appelé quand les filtres changent
        onFilter: (filters) => {
            handleFilterChange(filters);
        }
    });
    
    console.log('🔍 Filtres créés avec DropdownList injecté');
}

// ========================================
// INITIALISATION STATS CARDS
// ========================================

function initStatsCards() {
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
        
        // Utiliser la même config que genererConfigStatsCards
        COMMANDES_CONFIG.STATS_CARDS_CONFIG.cartes.forEach(carte => {
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
    const config = COMMANDES_CONFIG.NIVEAUX_URGENCE[urgence];
    if (!config) return urgence;
    
    // Utiliser le template centralisé
    return COMMANDES_CONFIG.DISPLAY_TEMPLATES.urgence.getHTML(config);
}

function afficherStatut(statut) {
    const config = COMMANDES_CONFIG.STATUTS[statut];
    if (!config) return statut;
    
    // Utiliser le template centralisé
    return COMMANDES_CONFIG.DISPLAY_TEMPLATES.statut.getHTML(config);
}

/**
 * Préparer les données pour l'export
 */
function prepareExportData(data) {
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
   
   [01/02/2025] - Architecture harmonisée complète
   - Architecture IoC stricte : aucun composant ne se connaît
   - L'orchestrateur (ce fichier) gère TOUTES les connexions
   - DropdownList injecté dans DataTableFilters
   - Interaction StatsCards/filtres gérée ICI, pas dans main.js
   - Fonctions handleFilterChange() et handleStatsCardClick()
   
   [01/02/2025 v2] - Utilisation des templates centralisés
   - DISPLAY_TEMPLATES.urgence.getHTML() pour l'affichage urgence
   - DISPLAY_TEMPLATES.statut.getHTML() pour l'affichage statut
   - Plus de HTML hardcodé dans les fonctions
   
   POINTS CLÉS:
   - Les composants communiquent uniquement par callbacks
   - Aucun import entre composants UI
   - L'orchestrateur connaît tous les composants
   - L'orchestrateur connaît la logique métier
   - Les composants ne connaissent pas le métier
   - Les templates d'affichage sont dans commandes.data.js
   
   ARCHITECTURE:
   commandes.list.js (orchestrateur)
       ├── DataTable (présentation)
       ├── DataTableFilters (avec DropdownList injecté)
       └── StatsCards (cartes cliquables)
   
   FLUX:
   1. User clique sur StatsCard → handleStatsCardClick()
   2. User change un filtre → handleFilterChange()
   3. Les deux mettent à jour state.filtres
   4. Les deux appellent afficherCommandes()
   5. afficherCommandes() filtre et met à jour DataTable
   ======================================== */