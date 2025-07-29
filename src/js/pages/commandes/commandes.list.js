// ========================================
// COMMANDES.LIST.JS - Gestion de la liste avec DataTable
// Chemin: src/js/pages/commandes/commandes.list.js
//
// DESCRIPTION:
// Gère l'affichage de la liste des commandes avec DataTable
// Refactorisé le 29/07/2025 : Migration vers DataTable
//
// STRUCTURE:
// 1. Imports et variables (lignes 15-25)
// 2. Initialisation DataTable (lignes 27-120)
// 3. Chargement des données (lignes 122-155)
// 4. Filtres (lignes 157-245)
// 5. Formatters et utilitaires (lignes 247-300)
// ========================================

import { CommandesService } from '../../services/commandes.service.js';
import { COMMANDES_CONFIG } from '../../data/commandes.data.js';
import { DataTable, formatDate as formatDateUtil } from '../../shared/index.js';
import { state } from './commandes.main.js';

// Variable pour l'instance DataTable
let tableCommandes = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeCommandes() {
    console.log('Initialisation DataTable pour les commandes...');
    
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
            selection: false, // Peut être activé plus tard
            pagination: true
        },
        
        pagination: {
            itemsPerPage: state.itemsPerPage || 20,
            pageSizeOptions: [10, 20, 50, 100]
        },
        
        export: {
    csv: true,              // AJOUTER
    excel: true,            // AJOUTER
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
    
    console.log('✅ DataTable initialisée');
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
    document.getElementById('statNouvelles').textContent = stats.parStatut.nouvelle || 0;
    document.getElementById('statPreparation').textContent = stats.parStatut.preparation || 0;
    document.getElementById('statExpediees').textContent = stats.parStatut.expediee || 0;
    document.getElementById('statLivrees').textContent = stats.parStatut.livree || 0;
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

export function filtrerCommandes() {
    // Récupérer les valeurs des filtres
    state.filtres.recherche = document.getElementById('searchInput').value;
    state.filtres.statut = document.getElementById('filterStatut').value;
    state.filtres.periode = document.getElementById('filterPeriode').value;
    state.filtres.urgence = document.getElementById('filterUrgence').value;
    
    // Réafficher
    afficherCommandes();
}

export function resetFiltres() {
    // Réinitialiser les filtres
    state.filtres = {
        recherche: '',
        statut: '',
        periode: 'all',
        urgence: ''
    };
    
    // Réinitialiser les inputs
    document.getElementById('searchInput').value = '';
    document.getElementById('filterStatut').value = '';
    document.getElementById('filterPeriode').value = 'all';
    document.getElementById('filterUrgence').value = '';
    
    // Réafficher
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
    return `<span class="urgence-badge ${urgence}">${config.icon} ${config.label}</span>`;
}

function afficherStatut(statut) {
    const config = COMMANDES_CONFIG.STATUTS[statut];
    if (!config) return statut;
    return `<span class="status-badge status-${statut}">${config.icon} ${config.label}</span>`;
}

/**
 * Préparer les données pour l'export
 */
function prepareExportData(data) {
    return data.map(row => ({
        'N° Commande': row.numeroCommande,
        'Date': formatDate(row.dates.commande),
        'Client': `${row.client.prenom} ${row.client.nom}`,
        'Téléphone': row.client.telephone || '-',
        'Type': COMMANDES_CONFIG.TYPES_PREPARATION[row.typePreparation]?.label || row.typePreparation,
        'Urgence': COMMANDES_CONFIG.NIVEAUX_URGENCE[row.niveauUrgence]?.label || row.niveauUrgence,
        'Statut': COMMANDES_CONFIG.STATUTS[row.statut]?.label || row.statut,
        'Magasin Livraison': row.magasinLivraison || '-',
        'Commentaires': row.commentaires || '-'
    }));
}

// ========================================
// SUPPRESSION DES ANCIENNES FONCTIONS
// ========================================

// Les fonctions suivantes sont supprimées car gérées par DataTable :
// - pagePrecedente()
// - pageSuivante()
// - updatePagination()
// - afficherProduits() [non utilisée]
// - peutSupprimer() [désactivée]

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [29/07/2025] - Migration complète vers DataTable
   - Suppression de tout le code de pagination manuelle
   - Suppression de la génération HTML du tableau
   - Utilisation du composant DataTable shared
   - Ajout de l'export CSV/Excel
   - Conservation des filtres existants
   
   AVANTAGES:
   - Code réduit de 50%
   - Fonctionnalités ajoutées : tri, export, redimensionnement
   - Maintenance simplifiée
   - Cohérence avec les autres pages
   
   NOTES POUR REPRISES FUTURES:
   - La sélection multiple est désactivée mais peut être activée
   - Les filtres restent côté client (peuvent passer côté serveur)
   - L'export peut être personnalisé via onBeforeExport
   ======================================== */