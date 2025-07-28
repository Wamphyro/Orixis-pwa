// ========================================
// COMMANDES.LIST.JS - Gestion de la liste avec TableComponent glassmorphism
// Chemin: src/js/pages/commandes/commandes.list.js
//
// DESCRIPTION:
// Gère l'affichage de la liste des commandes avec TableComponent moderne
// Modifié le 29/07/2025 : Migration complète vers TableComponent
//
// STRUCTURE:
// 1. Imports et configuration (lignes 20-100)
// 2. Initialisation du module (lignes 102-110)
// 3. Chargement des données (lignes 112-140)
// 4. Affichage avec TableComponent (lignes 142-280)
// 5. Fonctions badges (lignes 282-350)
// 6. Filtres (lignes 352-440)
// 7. Export état global (lignes 442-450)
// ========================================

import { CommandesService } from '../../services/commandes.service.js';
import { COMMANDES_CONFIG } from '../../data/commandes.data.js';
import { formatDate as formatDateUtil, formatMoney } from '../../shared/index.js';
import { state } from './commandes.main.js';
import { StatusBadgeComponent } from '../../shared/ui/elements/status-badge.component.js';

// Import du nouveau TableComponent
import TableComponent from '../../shared/ui/data-display/table.component.js';

// ========================================
// CONFIGURATION DES BADGES
// ========================================

// Configuration des badges pour les statuts
const BADGES_STATUTS = {
    'nouvelle': { 
        icon: 'sparkles',
        color: '#a855f7',
        label: 'Nouvelle'
    },
    'preparation': { 
        icon: 'loader',
        color: '#3b82f6',
        label: 'En préparation',
        animation: 'spin'
    },
    'terminee': { 
        icon: 'check-circle',
        color: '#10b981',
        label: 'Terminée'
    },
    'expediee': { 
        icon: 'truck',
        color: '#6366f1',
        label: 'Expédiée'
    },
    'receptionnee': { 
        icon: 'package-check',
        color: '#0ea5e9',
        label: 'Réceptionnée'
    },
    'livree': { 
        icon: 'check-double',
        color: '#22c55e',
        label: 'Livrée'
    },
    'annulee': { 
        icon: 'x-octagon',
        color: '#ef4444',
        label: 'Annulée'
    },
    'supprime': { 
        icon: 'trash-2',
        color: '#dc3545',
        label: 'Supprimée',
        special: true
    }
};

// Configuration des badges pour les urgences
const BADGES_URGENCES = {
    'normal': { 
        icon: 'clock',
        color: '#22c55e',
        label: 'Normal'
    },
    'urgent': { 
        icon: 'alert-triangle',
        color: '#f59e0b',
        label: 'Urgent',
        pulse: true
    },
    'tres_urgent': { 
        icon: 'flame',
        color: '#ef4444',
        label: 'Très urgent',
        animation: 'flame'
    }
};

// Instance de la table
let tableInstance = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeCommandes() {
    console.log('Module liste commandes initialisé avec TableComponent glassmorphism');
    
    // Initialiser les event listeners pour les filtres
    initEventListeners();
}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

export async function chargerDonnees() {
    try {
        // Charger les commandes
        state.commandesData = await CommandesService.getCommandes();
        
        if (!state.commandesData) {
            state.commandesData = [];
        }
        
        // Charger les statistiques
        const stats = await CommandesService.getStatistiques();
        afficherStatistiques(stats);
        
        // Afficher les commandes avec TableComponent
        await afficherCommandes();
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
        state.commandesData = [];
        afficherStatistiques({
            parStatut: {},
            parUrgence: {},
            retards: 0
        });
        await afficherCommandes();
    }
}

// ========================================
// AFFICHAGE AVEC TABLECOMPONENT
// ========================================

function afficherStatistiques(stats) {
    document.getElementById('statNouvelles').textContent = stats.parStatut.nouvelle || 0;
    document.getElementById('statPreparation').textContent = stats.parStatut.preparation || 0;
    document.getElementById('statExpediees').textContent = stats.parStatut.expediee || 0;
    document.getElementById('statLivrees').textContent = stats.parStatut.livree || 0;
}

async function afficherCommandes() {
    // Conteneur de la table
    const container = document.getElementById('commandesTableContainer');
    if (!container) {
        console.error('Container commandesTableContainer non trouvé');
        return;
    }
    
    // Filtrer les commandes
    const commandesFiltrees = filtrerCommandesLocalement();
    
    // Préparer les données pour TableComponent
    const dataForTable = commandesFiltrees.map(commande => ({
        id: commande.id,
        numeroCommande: commande.numeroCommande,
        dateCommande: commande.dates.commande,
        clientNom: `${commande.client.prenom} ${commande.client.nom}`,
        typePreparation: COMMANDES_CONFIG.TYPES_PREPARATION[commande.typePreparation]?.label || commande.typePreparation,
        niveauUrgence: commande.niveauUrgence,
        statut: commande.statut,
        // Données complètes pour les actions
        _raw: commande
    }));
    
    // Configuration des colonnes
    const columns = [
        { 
            key: 'numeroCommande', 
            label: 'N° Commande', 
            type: 'text',
            sortable: true,
            searchable: true,
            width: '150px'
        },
        { 
            key: 'dateCommande', 
            label: 'Date', 
            type: 'date',
            sortable: true,
            searchable: false,
            width: '120px'
        },
        { 
            key: 'clientNom', 
            label: 'Client', 
            type: 'text',
            sortable: true,
            searchable: true,
            minWidth: '200px'
        },
        { 
            key: 'typePreparation', 
            label: 'Type', 
            type: 'text',
            sortable: true,
            searchable: true,
            width: '150px'
        },
        { 
            key: 'niveauUrgence', 
            label: 'Urgence',
            type: 'status',
            sortable: true,
            searchable: false,
            width: '130px',
            render: (value) => renderUrgenceBadge(value)
        },
        { 
            key: 'statut', 
            label: 'Statut',
            type: 'status',
            sortable: true,
            searchable: true,
            width: '150px',
            render: (value) => renderStatutBadge(value)
        },
        { 
            key: 'actions', 
            label: 'Actions',
            type: 'actions',
            sortable: false,
            searchable: false,
            width: '100px',
            actions: [
                {
                    icon: '👁️',
                    tooltip: 'Voir les détails',
                    className: 'btn-action',
                    handler: (row) => {
                        window.voirDetailCommande(row._raw.id);
                    }
                }
            ]
        }
    ];
    
    // Si la table existe déjà, mettre à jour les données
    if (tableInstance) {
        await tableInstance.setData(dataForTable);
        return;
    }
    
    // Créer la table avec TableComponent
    tableInstance = new TableComponent({
        columns: columns,
        data: dataForTable,
        style: 'glassmorphism',
        animation: 'smooth',
        className: 'commandes-table',
        features: {
            // Pagination
            pagination: {
                enabled: true,
                pageSize: state.itemsPerPage || 20,
                pageSizeOptions: [10, 20, 50, 100],
                position: 'bottom',
                style: 'numbers',
                showInfo: true,
                showGoTo: true
            },
            // Recherche globale (on garde nos filtres custom)
            search: {
                enabled: false  // On utilise nos propres filtres
            },
            // Tri
            sort: {
                enabled: true,
                multi: true,
                defaultDirection: 'desc',
                locale: 'fr-FR'
            },
            // Export
            export: {
                enabled: true,
                formats: ['excel', 'csv', 'pdf'],
                filename: `commandes_${new Date().toISOString().split('T')[0]}`
            },
            // Sélection
            selection: {
                enabled: false  // Pour l'instant
            },
            // Colonnes
            columns: {
                resize: true,
                reorder: true,
                hide: false
            },
            // Lignes
            rows: {
                hover: true,
                striped: false,
                border: true,
                height: 'normal'
            },
            // Responsive
            responsive: {
                enabled: true,
                cardView: true
            }
        },
        // Messages en français
        messages: {
            noData: 'Aucune commande trouvée',
            loading: 'Chargement...',
            error: 'Erreur lors du chargement',
            itemsPerPage: 'Éléments par page',
            page: 'Page',
            of: 'sur',
            items: 'commandes',
            first: 'Première',
            last: 'Dernière',
            previous: 'Précédente',
            next: 'Suivante'
        },
        // Callbacks
        onPageChange: (page) => {
            state.currentPage = page;
        }
    });
    
    // Vider le container et ajouter la table
    container.innerHTML = '';
    container.appendChild(tableInstance.getElement());
}

// ========================================
// FONCTIONS DE RENDU DES BADGES
// ========================================

/**
 * Rendre un badge de statut
 */
function renderStatutBadge(statut) {
    const config = BADGES_STATUTS[statut];
    
    if (!config) {
        return `<span class="status-badge">${statut}</span>`;
    }
    
    // Créer le badge avec StatusBadgeComponent
    const badge = StatusBadgeComponent.create({
        status: statut,
        customIcon: config.icon,
        customColor: config.color,
        text: config.label,
        style: 'glassmorphism',
        size: 'small',
        showText: true,
        showPulse: config.pulse || false,
        animation: config.animation || 'subtle'
    });
    
    // Cas spécial pour "supprimé"
    if (config.special && statut === 'supprime') {
        badge.style.textDecoration = 'line-through';
        badge.style.opacity = '0.8';
    }
    
    return badge;
}

/**
 * Rendre un badge d'urgence
 */
function renderUrgenceBadge(urgence) {
    const config = BADGES_URGENCES[urgence];
    
    if (!config) {
        return `<span class="urgence-badge">${urgence}</span>`;
    }
    
    // Créer le badge avec StatusBadgeComponent
    const badge = StatusBadgeComponent.create({
        status: urgence,
        customIcon: config.icon,
        customColor: config.color,
        text: config.label,
        style: 'glassmorphism',
        size: 'small',
        showText: true,
        showPulse: config.pulse || false,
        animation: config.animation || 'subtle'
    });
    
    return badge;
}

// ========================================
// FILTRES
// ========================================

function filtrerCommandesLocalement() {
    return state.commandesData.filter(commande => {
        // Exclure les commandes supprimées
        if (commande.statut === 'supprime') {
            return false;
        }
        
        // Filtre recherche
        if (state.filtres.recherche) {
            const recherche = state.filtres.recherche.toLowerCase();
            const clientNom = `${commande.client.prenom} ${commande.client.nom}`.toLowerCase();
            const numero = commande.numeroCommande?.toLowerCase() || '';
            
            if (!clientNom.includes(recherche) && !numero.includes(recherche)) {
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

/**
 * Initialiser les event listeners pour les filtres
 */
function initEventListeners() {
    // Recherche
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            state.filtres.recherche = e.target.value;
            afficherCommandes();
        }, 300));
    }
    
    // Filtre statut
    const filterStatut = document.getElementById('filterStatut');
    if (filterStatut) {
        filterStatut.addEventListener('change', (e) => {
            state.filtres.statut = e.target.value;
            afficherCommandes();
        });
    }
    
    // Filtre période
    const filterPeriode = document.getElementById('filterPeriode');
    if (filterPeriode) {
        filterPeriode.addEventListener('change', (e) => {
            state.filtres.periode = e.target.value;
            afficherCommandes();
        });
    }
    
    // Filtre urgence
    const filterUrgence = document.getElementById('filterUrgence');
    if (filterUrgence) {
        filterUrgence.addEventListener('change', (e) => {
            state.filtres.urgence = e.target.value;
            afficherCommandes();
        });
    }
    
    // Bouton reset
    const btnReset = document.querySelector('.btn-reset');
    if (btnReset) {
        btnReset.addEventListener('click', resetFiltres);
    }
}

/**
 * Fonction debounce pour optimiser les performances
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Réinitialiser les filtres
 */
export function resetFiltres() {
    // Réinitialiser l'état
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
// EXPORT POUR COMPATIBILITÉ
// ========================================

// Ces fonctions ne sont plus utilisées avec TableComponent
// mais on les garde pour compatibilité
export function filtrerCommandes() {
    afficherCommandes();
}

export function pagePrecedente() {
    // Géré par TableComponent
}

export function pageSuivante() {
    // Géré par TableComponent
}

// Fonction utilitaire
function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDateUtil(date, 'DD/MM/YYYY');
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [29/07/2025] - Migration complète vers TableComponent
   Modification: Remplacement du tableau HTML par TableComponent
   Raison: Modernisation avec glassmorphism et fonctionnalités avancées
   Impact: Interface plus moderne avec tri, export, animations
   
   Nouveautés:
   - Style glassmorphism automatique
   - Tri multi-colonnes (Shift+Click)
   - Export Excel/CSV/PDF
   - Pagination moderne
   - Responsive avec card view mobile
   - Animations fluides
   - Badges avec StatusBadgeComponent
   
   NOTES POUR REPRISES FUTURES:
   - TableComponent gère sa propre pagination
   - Les filtres restent externes (nos inputs)
   - Les badges utilisent StatusBadgeComponent
   - La recherche globale est désactivée (on garde nos filtres)
   ======================================== */