// ========================================
// COMMANDES.LIST.JS - Gestion de la liste avec DataTable
// Chemin: src/js/pages/commandes/commandes.list.js
//
// DESCRIPTION:
// Gère l'affichage de la liste des commandes avec DataTable et DataTableFilters
// Refactorisé le 29/07/2025 : Migration vers DataTable + DataTableFilters
// Modifié le 31/01/2025 : Utilisation complète de la config centralisée
// ========================================

import { CommandesService } from '../../services/commandes.service.js';
import { 
    COMMANDES_CONFIG, 
    genererOptionsFiltres,
    genererConfigStatsCards,
    formaterDonneesExport 
} from '../../data/commandes.data.js';
import { DataTable, DataTableFilters, StatsCards, formatDate as formatDateUtil } from '../../shared/index.js';
import { state } from './commandes.main.js';
import { db } from '../../services/firebase.service.js';

// Variables pour les instances
let tableCommandes = null;
let filtresCommandes = null;
let statsCards = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeCommandes() {
    console.log('Initialisation DataTable et Filtres pour les commandes...');
    
    // 1. Créer d'abord l'instance DataTable
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
                        console.warn(`Type non trouvé dans COMMANDES_CONFIG: "${value}"`);
                        return value || '-';
                    }
                    return `<span class="badge badge-${value.replace(/_/g, '-')}">${config.icon} ${config.label}</span>`;
                },
                sortFunction: (a, b, direction) => {
                    const valueA = a.typePreparation || '';
                    const valueB = b.typePreparation || '';
                    return direction === 'asc' 
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
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
        
        onPageChange: (page) => {
            state.currentPage = page;
        }
    });
    
    // 2. PUIS initialiser les filtres (maintenant que tableCommandes existe)
    await initFiltres();  // ← AJOUTER await

    
    console.log('✅ DataTable et Filtres initialisés');
    
    // 3. Enfin initialiser les cartes de statistiques
    initStatsCards();
}

/**
 * Initialiser les cartes de statistiques
 * MODIFIÉ : Utilise la config centralisée
 */
function initStatsCards() {
    const cardsConfig = genererConfigStatsCards();
    
    statsCards = new StatsCards({
        container: '.commandes-stats',
        cards: cardsConfig,
        animated: true,
        onClick: (cardId) => {
            // Mise à jour directe du filtre statut dans l'état
            state.filtres.statut = cardId;
            
            // Réafficher les commandes avec le nouveau filtre
            afficherCommandes();
            
            // Optionnel : Si tu veux aussi réinitialiser les autres filtres
            // if (filtresCommandes) {
            //     filtresCommandes.reset();
            // }
        }
    });
}

/**
 * Initialiser les filtres
 * MODIFIÉ : Utilise genererOptionsFiltres() depuis commandes.data.js
 */
async function initFiltres() {  // ← AJOUTER async
    let filtresConfig = genererOptionsFiltres();
    
    // Charger les magasins depuis Firebase
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
        
        const magasins = [];
        magasinsSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.actif !== false) {
                magasins.push({
                    value: data.code || doc.id,
                    label: data.nom || data.code || doc.id
                });
            }
        });
        
        magasins.sort((a, b) => a.label.localeCompare(b.label));
        
        // Trouver le filtre magasin et ajouter les options
        const magasinFilter = filtresConfig.find(f => f.key === 'magasin');
        if (magasinFilter) {
            magasinFilter.options = [
                { value: '', label: 'Tous les magasins' },
                ...magasins
            ];
        }
    } catch (error) {
        console.error('Erreur chargement magasins:', error);
    }
    
    // Ajuster la config pour séparer les icônes du label
    const filtresConfigAjustes = filtresConfig.map(filtre => {
        if (filtre.type === 'select' && filtre.options) {
            filtre.options = filtre.options.map(option => {
                // Si c'est déjà un objet avec value et label
                if (typeof option === 'object' && option.label) {
                    // Extraire l'icône du label si elle y est
                    const iconMatch = option.label.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{25A0}-\u{25FF}]|[\u{2190}-\u{21FF}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{1F004}]|[\u{1F170}-\u{1F251}]|[0-9]\u{FE0F}?\u{20E3})/u);
                    
                    if (iconMatch && !option.icon) {
                        // Si une icône est trouvée et qu'il n'y a pas déjà d'icône séparée
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
        return filtre;
    });
    
    filtresCommandes = new DataTableFilters({
        container: '.commandes-filters',
        filters: filtresConfigAjustes,
        onFilter: (filters) => {
            state.filtres = {
                recherche: filters.recherche || '',
                magasin: filters.magasin || '',  // ← CHANGÉ ICI
                periode: filters.periode || 'all',
                urgence: filters.urgence || ''
            };
            
            if (tableCommandes) {
                afficherCommandes();
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
    // Utiliser le composant StatsCards pour mettre à jour
    if (statsCards) {
        // Créer un objet avec tous les statuts
        const allStats = {};
        
        // Parcourir tous les statuts possibles (sauf supprime)
        Object.keys(COMMANDES_CONFIG.STATUTS).forEach(statut => {
            if (statut !== 'supprime') {
                allStats[statut] = stats.parStatut[statut] || 0;
            }
        });
        
        statsCards.updateAll(allStats);
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
// FILTRES
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
        
        // 🆕 AJOUTER ICI - Filtre statut (depuis les cartes)
        if (state.filtres.statut && commande.statut !== state.filtres.statut) {
            return false;
        }
        
        // Filtre période
        if (state.filtres.periode !== 'all') {
            // ... code existant ...
        }
        
        return true;
    });
}

// ========================================
// FONCTIONS EXPORTÉES POUR COMPATIBILITÉ
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
    
    // Structure avec tooltip CSS
    return `
        <span class="urgence-icon-wrapper">
            <span class="urgence-icon">${config.icon}</span>
            <span class="urgence-tooltip">${config.label} (${config.delai})</span>
        </span>
    `;
}

function afficherStatut(statut) {
    const config = COMMANDES_CONFIG.STATUTS[statut];
    if (!config) return statut;
    
    // Structure identique avec tooltip CSS
    return `
        <span class="statut-icon-wrapper">
            <span class="statut-icon">${config.icon}</span>
            <span class="statut-tooltip">${config.label}</span>
        </span>
    `;
}

/**
 * Préparer les données pour l'export
 * MODIFIÉ : Utilise formaterDonneesExport() centralisé
 */
function prepareExportData(data) {
    return formaterDonneesExport(data);
}

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [29/07/2025] - Migration complète vers DataTable + DataTableFilters
   - Utilisation du composant DataTable pour le tableau
   - Utilisation du composant DataTableFilters pour les filtres
   - Suppression du code HTML en dur
   - Les filtres sont maintenant générés dynamiquement
   
   [31/01/2025] - Centralisation complète de la configuration
   - Import de genererOptionsFiltres, genererConfigStatsCards, formaterDonneesExport
   - initStatsCards() utilise genererConfigStatsCards()
   - initFiltres() utilise genererOptionsFiltres()
   - prepareExportData() utilise formaterDonneesExport()
   - Toute la config vient maintenant de commandes.data.js
   
   AVANTAGES:
   - Composants réutilisables
   - Code plus maintenable
   - Filtres configurables
   - Export CSV/Excel intégré
   - Configuration 100% centralisée
   - Une seule source de vérité pour toutes les configs
   
   NOTES:
   - Les fonctions filtrerCommandes et resetFiltres sont conservées pour compatibilité
   - Les IDs HTML (searchInput, etc.) ne sont plus utilisés
   - Tout est géré par les composants
   - La configuration est maintenant uniquement dans commandes.data.js
   ======================================== */