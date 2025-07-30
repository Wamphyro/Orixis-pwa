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

// Variables pour les instances
let tableCommandes = null;
let filtresCommandes = null;
let statsCards = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeCommandes() {
    console.log('Initialisation DataTable et Filtres pour les commandes...');
    
    // Initialiser les filtres
    initFiltres();
    
    // Créer l'instance DataTable
    tableCommandes = new DataTable({
        container: '.commandes-table-container',
        
                columns: [
            {
                key: 'numeroCommande',
                label: 'N° Commande',
                sortable: true,
                width: 150,
                formatter: (value) => `<strong>${value}</strong>`
            },
            {
                key: 'dates.commande',
                label: 'Date',
                sortable: true,
                width: 100,
                formatter: (value) => formatDate(value)
            },
            // 🆕 NOUVELLE COLONNE MAGASIN
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
                key: 'magasinLivraison',  // ou 'client.magasinReference'
                label: 'Magasin',
                sortable: true,
                width: 100,
                formatter: (value) => value || '-'
            },
            {
                key: 'typePreparation',
                label: 'Type',
                sortable: false,
                formatter: (value) => {
                    const type = COMMANDES_CONFIG.TYPES_PREPARATION[value];
                    return type?.label || value;
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
    
    console.log('✅ DataTable et Filtres initialisés');
    
    // Initialiser les cartes de statistiques
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
            if (filtresCommandes) {
                filtresCommandes.setValue('statut', cardId);
            }
        }
    });
}

/**
 * Initialiser les filtres
 * MODIFIÉ : Utilise genererOptionsFiltres() depuis commandes.data.js
 */
function initFiltres() {
    const filtresConfig = genererOptionsFiltres();
    
    filtresCommandes = new DataTableFilters({
        container: '.commandes-filters',
        filters: filtresConfig,
        onFilter: (filters) => {
            state.filtres = {
                recherche: filters.recherche || '',
                statut: filters.statut || '',
                periode: filters.periode || 'all',
                urgence: filters.urgence || ''
            };
            
            afficherCommandes();
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
        statsCards.updateAll({
            'nouvelle': stats.parStatut.nouvelle || 0,
            'preparation': stats.parStatut.preparation || 0,
            'expediee': stats.parStatut.expediee || 0,
            'livree': stats.parStatut.livree || 0
        });
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
        
        // Filtre statut
        if (state.filtres.statut && commande.statut !== state.filtres.statut) {
            return false;
        }
        
        // Filtre urgence
        if (state.filtres.urgence && commande.niveauUrgence !== state.filtres.urgence) {
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
    return `<span class="urgence-badge ${urgence}">${config.icon} ${config.label}</span>`;
}

function afficherStatut(statut) {
    const config = COMMANDES_CONFIG.STATUTS[statut];
    if (!config) return statut;
    return `<span class="status-badge status-${statut}">${config.icon} ${config.label}</span>`;
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