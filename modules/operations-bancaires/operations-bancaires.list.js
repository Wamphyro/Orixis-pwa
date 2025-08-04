// ========================================
// OPERATIONS-BANCAIRES.LIST.JS - Orchestrateur de la liste des opérations
// Chemin: modules/operations-bancaires/operations-bancaires.list.js
//
// DESCRIPTION:
// Orchestre DataTable, DataTableFilters et StatsCards
// Gère toutes les interactions entre les composants
// L'orchestrateur fait TOUS les liens, les composants ne se connaissent pas
//
// ARCHITECTURE:
// - Crée les instances des composants via config
// - Connecte les composants par callbacks
// - Gère le filtrage et l'affichage
// - Contient TOUTE la logique de présentation
//
// DÉPENDANCES:
// - OperationsBancairesService (logique métier)
// - config (factories des composants)
// - data (constantes métier)
// ========================================

import { OperationsBancairesService } from './operations-bancaires.service.js';
import { 
    OPERATIONS_CONFIG,
    formaterDate,
    formaterMontant,
    detecterCategorie,
    calculerBalance,
    getComptesBancaires
} from './operations-bancaires.data.js';
import { Button, Tooltip } from '../../src/components/index.js';
import config from './operations-bancaires.config.js';
import { state } from './operations-bancaires.main.js';

// ========================================
// CONFIGURATION UI (L'ORCHESTRATEUR DÉCIDE)
// ========================================

// Configuration des filtres
const FILTERS_CONFIG = {
    recherche: {
        type: 'search',
        key: 'recherche',
        placeholder: 'Libellé, référence, montant...'
    },
    compte: {
        type: 'select',
        key: 'compte',
        label: 'Compte',
        keepPlaceholder: true,
        options: [] // Chargé dynamiquement depuis les imports
    },
    categorie: {
        type: 'select',
        key: 'categorie',
        label: 'Catégorie',
        keepPlaceholder: true,
        showIcons: true,
        options: [] // Généré depuis les constantes
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
            { value: 'week', label: '7 derniers jours' },
            { value: 'month', label: '30 derniers jours' },
            { value: 'quarter', label: '3 derniers mois' },
            { value: 'year', label: 'Cette année' }
        ]
    },
    pointees: {
        type: 'select',
        key: 'pointees',
        label: 'Pointage',
        defaultValue: 'all',
        keepPlaceholder: true,
        options: [
            { value: 'all', label: 'Toutes' },
            { value: 'oui', label: '✓ Pointées' },
            { value: 'non', label: '✗ Non pointées' }
        ]
    }
};

// Configuration des stats cards
const STATS_CARDS_CONFIG = {
    cartes: [
        { id: 'credits', label: 'Crédits', icon: '➕', color: 'success' },
        { id: 'debits', label: 'Débits', icon: '➖', color: 'danger' },
        { id: 'pointees', label: 'Pointées', icon: '✓', color: 'info' },
        { id: 'non_pointees', label: 'Non pointées', icon: '✗', color: 'warning' }
    ]
};

// Configuration de l'export
const EXPORT_CONFIG = {
    colonnes: [
        { key: 'date', label: 'Date', formatter: 'date' },
        { key: 'dateValeur', label: 'Date valeur', formatter: 'date' },
        { key: 'libelle', label: 'Libellé' },
        { key: 'categorie', label: 'Catégorie', formatter: 'categorie' },
        { key: 'type', label: 'Type', formatter: 'type' },
        { key: 'montant', label: 'Montant', formatter: 'montant' },
        { key: 'accountNumber', label: 'Compte', formatter: 'compte' },
        { key: 'pointee', label: 'Pointée', formatter: 'boolean' }
    ]
};

// ========================================
// INSTANCES DES COMPOSANTS
// ========================================

let tableOperations = null;
let filtresOperations = null;
let statsCards = null;
let operationsFiltrees = []; // Cache des opérations filtrées
let tooltipsInstances = []; // Instances des tooltips

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeOperations() {
    console.log('🚀 Initialisation orchestrateur liste opérations...');
    
    // 0. Charger les données d'abord pour avoir les comptes/catégories
    await chargerDonneesInitiales();
    
    // 1. Créer l'instance DataTable
    initDataTable();
    
    // 2. Créer les filtres (avec les bonnes options maintenant)
    await initFiltres();
    
    // 3. Créer les cartes de statistiques
    initStatsCards();
    
    // 4. Connecter les composants entre eux
    connectComponents();
    
    // 5. Ajouter les boutons d'actions groupées
    initActionsGroupees();
    
    console.log('✅ Orchestrateur liste opérations initialisé');
}

// Nouvelle fonction pour charger juste les données sans afficher
async function chargerDonneesInitiales() {
    try {
        // Charger les opérations
        state.operationsData = await OperationsBancairesService.getOperations();
        
        if (!state.operationsData) {
            state.operationsData = [];
        }
        
        // Mettre à jour les comptes et catégories dynamiques
        if (state.operationsData.length > 0) {
            mettreAJourComptes(state.operationsData);
            mettreAJourCategories(state.operationsData);
        }
        
        console.log('✅ Données initiales chargées');
        
    } catch (error) {
        console.error('❌ Erreur chargement initial:', error);
        state.operationsData = [];
    }
}

// ========================================
// INITIALISATION DATATABLE
// ========================================

function initDataTable() {
    tableOperations = config.createOperationsTable('.operations-table-container', {
        columns: [
            {
                key: 'selection',
                label: '<input type="checkbox" id="selectAll">',
                sortable: false,
                resizable: false,
                width: 40,
                formatter: (_, row) => config.HTML_TEMPLATES.checkbox(row.id, state.selection.includes(row.id))
            },
            {
                key: 'date',
                label: 'Date',
                sortable: true,
                width: 100,
                formatter: (value) => formaterDate(value, 'jour')  // Utiliser formaterDate de data.js
            },
            {
                key: 'libelle',
                label: 'Libellé',
                sortable: true,
                formatter: (value) => value || '-'
            },
            {
                key: 'categorie',
                label: 'Catégorie',
                sortable: true,
                width: 80,
                formatter: (value) => {
                    const cat = OPERATIONS_CONFIG.CATEGORIES[value] || OPERATIONS_CONFIG.CATEGORIES.autre;
                    return `<span class="categorie-icon" data-tooltip="${cat.label}" style="font-size: 20px; cursor: help;">${cat.icon}</span>`;
                }
            },
            {
                key: 'montant',
                label: 'Montant',
                sortable: true,
                width: 120,
                formatter: (value) => config.HTML_TEMPLATES.montant(value)
            },
            {
                key: 'accountNumber',
                label: 'Compte',
                sortable: true,
                width: 120,
                formatter: (value, row) => config.HTML_TEMPLATES.compteBancaire({
                    masque: row.accountNumber ? '•••' + row.accountNumber.slice(-4) : '-'
                })
            },
            {
                key: 'pointee',
                label: '✓',
                sortable: true,
                width: 40,
                formatter: (value) => value ? '✓' : ''
            },
            {
                key: 'statut',
                label: 'Statut',
                sortable: true,
                width: 120,
                formatter: (value, row) => {
                    // Déterminer le statut basé sur les propriétés
                    let statut = 'active';
                    let label = 'Active';
                    let couleur = '#4caf50';
                    
                    if (row.pointee) {
                        statut = 'pointee';
                        label = 'Pointée';
                        couleur = '#2196f3';
                    }
                    
                    if (row.rapprochee) {
                        statut = 'rapprochee';
                        label = 'Rapprochée';
                        couleur = '#9c27b0';
                    }
                    
                    return `<span class="badge badge-${statut}" style="background-color: ${couleur}; color: white;">${label}</span>`;
                }
            },
            {
                key: 'actions',
                label: 'Actions',
                sortable: false,
                resizable: false,
                exportable: false,
                formatter: (_, row) => `
                    <button class="${config.BUTTON_CLASSES.action}" 
                            onclick="voirDetailOperation('${row.id}')"
                            title="Voir le détail">
                        👁️
                    </button>
                `
            }
        ],
        
        // Callbacks
        onPageChange: (page) => {
            state.currentPage = page;
        },
        
        onRowClick: (row, event) => {
            // Vérifier que l'event existe et que c'est un checkbox
            if (event && event.target && event.target.type === 'checkbox') {
                toggleSelection(row.id);
            }
        },
        
        export: {
            csv: true,
            excel: true,
            filename: `operations_${new Date().toISOString().split('T')[0]}`,
            onBeforeExport: (data) => prepareExportData(data)
        }
    });
    
    // Gérer le "Select All"
    setTimeout(() => {
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                if (e.target.checked) {
                    // Sélectionner toutes les opérations visibles
                    const visibleIds = operationsFiltrees.map(op => op.id);
                    state.selection = [...new Set([...state.selection, ...visibleIds])];
                } else {
                    // Désélectionner tout
                    state.selection = [];
                }
                afficherOperations();
                updateActionsGroupees();
            });
        }
    }, 100);
    
    console.log('📊 DataTable créée avec sélection multiple');
}

// ========================================
// FONCTIONS DE MISE À JOUR DYNAMIQUE
// ========================================

function mettreAJourComptes(operations) {
    const comptes = new Set();
    operations.forEach(op => {
        if (op.accountNumber) {
            comptes.add(op.accountNumber);
        }
    });
    
    // Mettre à jour les options du filtre compte
    if (FILTERS_CONFIG.compte) {
        FILTERS_CONFIG.compte.options = [
            { value: '', label: 'Tous les comptes' },
            ...Array.from(comptes).map(compte => ({
                value: compte,
                label: compte.slice(-4) ? `•••${compte.slice(-4)}` : compte
            }))
        ];
    }
}

function mettreAJourCategories(operations) {
    const categories = new Set();
    operations.forEach(op => {
        if (op.categorie) {
            categories.add(op.categorie);
        }
    });
    
    // Mettre à jour les options du filtre catégorie
    if (FILTERS_CONFIG.categorie) {
        const optionsCategories = [{ value: '', label: 'Toutes les catégories' }];
        
        // Ajouter les catégories trouvées
        categories.forEach(cat => {
            const catConfig = OPERATIONS_CONFIG.CATEGORIES[cat];
            if (catConfig) {
                optionsCategories.push({
                    value: cat,
                    label: catConfig.label,
                    icon: catConfig.icon
                });
            }
        });
        
        FILTERS_CONFIG.categorie.options = optionsCategories;
    }
}

// ========================================
// INITIALISATION FILTRES
// ========================================

async function initFiltres() {
    // Utiliser directement FILTERS_CONFIG
    const filtresConfig = Object.values(FILTERS_CONFIG);
    
    // Créer l'instance DataTableFilters
    filtresOperations = config.createOperationsFilters(
        '.operations-filters',
        filtresConfig,
        (filters) => handleFilterChange(filters)
    );
    
    console.log('🔍 Filtres créés avec config locale');
}

// ========================================
// INITIALISATION STATS CARDS
// ========================================

function initStatsCards() {
    const cardsConfig = STATS_CARDS_CONFIG.cartes;
    
    statsCards = config.createOperationsStatsCards(
        '.operations-stats',
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
    console.log('🔗 Composants connectés via callbacks');
}

// ========================================
// GESTION DES INTERACTIONS
// ========================================

function handleFilterChange(filters) {
    // Détecter si c'est un reset
    const isReset = !filters.recherche && 
                    !filters.compte && 
                    !filters.categorie &&
                    filters.periode === 'all' && 
                    filters.pointees === 'all';
    
    if (isReset) {
        // Reset complet
        state.filtres = {
            recherche: '',
            compte: '',
            categorie: '',
            periode: 'all',
            pointees: 'all'
        };
        
        // Désélectionner toutes les cartes
        if (statsCards && statsCards.elements.cards) {
            Object.values(statsCards.elements.cards).forEach(card => {
                card.classList.remove('active');
            });
        }
    } else {
        // Mise à jour partielle
        state.filtres = {
            ...state.filtres,
            recherche: filters.recherche || '',
            compte: filters.compte || '',
            categorie: filters.categorie || '',
            periode: filters.periode || 'month',
            pointees: filters.pointees || 'all'
        };
    }
    
        if (tableOperations) {
            afficherOperations();
        }
}

function handleStatsCardClick(cardId) {
    // Pour les opérations bancaires, on peut filtrer par type de carte cliquée
    if (cardId === 'pointees') {
        state.filtres.pointees = state.filtres.pointees === 'oui' ? 'all' : 'oui';
    } else if (cardId === 'non_pointees') {
        state.filtres.pointees = state.filtres.pointees === 'non' ? 'all' : 'non';
    }
    
    // Mettre à jour l'état visuel de la carte
    if (statsCards && statsCards.elements.cards[cardId]) {
        const isActive = statsCards.elements.cards[cardId].classList.contains('active');
        
        // Désactiver toutes les cartes du même groupe
        if (cardId === 'credits' || cardId === 'debits') {
            ['credits', 'debits'].forEach(id => {
                if (statsCards.elements.cards[id]) {
                    statsCards.elements.cards[id].classList.remove('active');
                }
            });
        } else if (cardId === 'pointees' || cardId === 'non_pointees') {
            ['pointees', 'non_pointees'].forEach(id => {
                if (statsCards.elements.cards[id]) {
                    statsCards.elements.cards[id].classList.remove('active');
                }
            });
        }
        
        // Toggle la carte cliquée
        if (!isActive) {
            statsCards.elements.cards[cardId].classList.add('active');
        }
    }
    
    afficherOperations();
}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

export async function chargerDonnees() {
    try {
        if (tableOperations) {
            tableOperations.state.loading = true;
            tableOperations.refresh();
        }
        
        // Charger les opérations
        state.operationsData = await OperationsBancairesService.getOperations();
        
        console.log('🔍 DEBUG - Opérations chargées:', state.operationsData.length);
        
        if (!state.operationsData) {
            state.operationsData = [];
        }
        
        // Charger les statistiques
        const stats = await OperationsBancairesService.getStatistiques();
        afficherStatistiques(stats);
        
        // Afficher les opérations
        afficherOperations();
        
        // Mettre à jour les actions groupées
        updateActionsGroupees();
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
        state.operationsData = [];
        afficherStatistiques({
            total: 0,
            credits: 0,
            debits: 0,
            montantCredits: 0,
            montantDebits: 0,
            balance: 0,
            pointees: 0,
            nonPointees: 0
        });
        afficherOperations();
    } finally {
        if (tableOperations) {
            tableOperations.state.loading = false;
        }
    }
}

// ========================================
// GESTION DES TOOLTIPS
// ========================================

function initTooltips() {
    // Détruire les anciens tooltips
    if (tooltipsInstances && tooltipsInstances.length > 0) {
        tooltipsInstances.forEach(tooltip => tooltip.destroy());
        tooltipsInstances = [];
    }
    
    // Créer les nouveaux tooltips
    setTimeout(() => {
        tooltipsInstances = Tooltip.attach('[data-tooltip]', {
            theme: 'dark',
            position: 'top',
            delay: 0, // Instantané
            arrow: true
        });
    }, 100);
}

// ========================================
// AFFICHAGE DES DONNÉES
// ========================================

function afficherStatistiques(stats) {
    if (statsCards) {
        const statsToUpdate = {
            credits: {
                value: formaterMontant(stats.montantCredits),
                label: `${stats.credits} crédits`,
                sublabel: formaterMontant(stats.montantCredits)
            },
            debits: {
                value: formaterMontant(stats.montantDebits),
                label: `${stats.debits} débits`,
                sublabel: formaterMontant(-stats.montantDebits)
            },
            pointees: {
                value: stats.pointees,
                label: 'Pointées',
                sublabel: stats.total > 0 ? `${Math.round((stats.pointees / stats.total) * 100)}%` : '0%'
            },
            non_pointees: {
                value: stats.nonPointees,
                label: 'Non pointées',
                sublabel: stats.total > 0 ? `${Math.round((stats.nonPointees / stats.total) * 100)}%` : '0%'
            }
        };
        
        statsCards.updateAll(statsToUpdate);
    }
}

function afficherOperations() {
    if (!tableOperations) {
        console.error('DataTable non initialisée');
        return;
    }
    
    operationsFiltrees = filtrerOperationsLocalement();
    tableOperations.setData(operationsFiltrees);
    
    // Réinitialiser les tooltips après le rendu
    initTooltips();
}

export { afficherOperations };

// ========================================
// FILTRAGE LOCAL
// ========================================

function filtrerOperationsLocalement() {
    return state.operationsData.filter(operation => {
        // Filtre recherche
        if (state.filtres.recherche) {
            const recherche = state.filtres.recherche.toLowerCase();
            const libelle = operation.libelle?.toLowerCase() || '';
            const reference = operation.reference?.toLowerCase() || '';
            const montant = operation.montant?.toString() || '';
            const categorie = operation.categorie?.toLowerCase() || '';
            
            if (!libelle.includes(recherche) && 
                !reference.includes(recherche) && 
                !montant.includes(recherche) &&
                !categorie.includes(recherche)) {
                return false;
            }
        }
        
        // Filtre compte
        if (state.filtres.compte && operation.accountNumber !== state.filtres.compte) {
            return false;
        }
        
        // Filtre catégorie
        if (state.filtres.categorie && operation.categorie !== state.filtres.categorie) {
            return false;
        }
        
        // Filtre type retiré
        
        // Filtre pointées
        if (state.filtres.pointees !== 'all') {
            const estPointee = operation.pointee === true;
            if (state.filtres.pointees === 'oui' && !estPointee) return false;
            if (state.filtres.pointees === 'non' && estPointee) return false;
        }
        
        // Filtre période
        if (state.filtres.periode !== 'all') {
            const dateOperation = new Date(operation.date);
            const maintenant = new Date();
            const debut = new Date();
            
            switch (state.filtres.periode) {
                case 'today':
                    debut.setHours(0, 0, 0, 0);
                    if (dateOperation < debut) return false;
                    break;
                case 'week':
                    debut.setDate(debut.getDate() - 7);
                    if (dateOperation < debut) return false;
                    break;
                case 'month':
                    debut.setDate(debut.getDate() - 30);
                    if (dateOperation < debut) return false;
                    break;
                case 'quarter':
                    debut.setMonth(debut.getMonth() - 3);
                    if (dateOperation < debut) return false;
                    break;
                case 'year':
                    debut.setMonth(0, 1);
                    debut.setHours(0, 0, 0, 0);
                    if (dateOperation < debut) return false;
                    break;
            }
        }
        
        return true;
    });
}

// ========================================
// FORMATTERS ET UTILITAIRES
// ========================================

function prepareExportData(data) {
    return data.map(row => {
        return {
            'Date': formaterDate(row.date, 'jour'),
            'Date valeur': formaterDate(row.dateValeur, 'jour'),
            'Libellé': row.libelle || '-',
            'Catégorie': OPERATIONS_CONFIG.CATEGORIES[row.categorie]?.label || row.categorie,
            'Type': row.montant >= 0 ? 'Crédit' : 'Débit',
            'Montant': formaterMontant(row.montant),
            'Compte': row.accountNumber ? `•••${row.accountNumber.slice(-4)}` : '-',
            'Pointée': row.pointee ? 'Oui' : 'Non'
        };
    });
}

// ========================================
// EXPORTS POUR COMPATIBILITÉ
// ========================================

// La fonction a été renommée, pas d'export supplémentaire nécessaire
// export { afficherOperations }; // Déjà exportée plus haut

export function resetFiltres() {
    if (filtresOperations) {
        filtresOperations.reset();
    }
    
    if (statsCards && statsCards.elements.cards) {
        Object.values(statsCards.elements.cards).forEach(card => {
            card.classList.remove('active');
        });
    }
    
    afficherOperations();
}

// ========================================
// GESTION DE LA SÉLECTION
// ========================================

function toggleSelection(operationId) {
    const index = state.selection.indexOf(operationId);
    if (index > -1) {
        state.selection.splice(index, 1);
    } else {
        state.selection.push(operationId);
    }
    
    updateActionsGroupees();
}

function updateActionsGroupees() {
    const count = state.selection.length;
    const btnCategoriser = document.getElementById('btnCategoriserSelection');
    const btnSupprimer = document.getElementById('btnSupprimerSelection');
    const selectionInfo = document.getElementById('selectionInfo');
    
    if (btnCategoriser) btnCategoriser.disabled = count === 0;
    if (btnSupprimer) btnSupprimer.disabled = count === 0;
    if (selectionInfo) {
        selectionInfo.textContent = count > 0 ? `${count} sélectionnée(s)` : '';
    }
}

// ========================================
// ACTIONS GROUPÉES
// ========================================

function initActionsGroupees() {
    const actionsContainer = document.querySelector('.operations-actions-groupees');
    if (!actionsContainer) return;
    
    actionsContainer.innerHTML = `
        <div class="actions-groupees-wrapper">
            <span id="selectionInfo" class="selection-info"></span>
            <button id="btnCategoriserSelection" 
                    class="btn btn-info btn-sm" 
                    onclick="categoriserOperations()" 
                    disabled>
                🏷️ Catégoriser
            </button>
            <button id="btnSupprimerSelection" 
                    class="btn btn-danger btn-sm" 
                    onclick="supprimerOperations()" 
                    disabled>
                🗑️ Supprimer
            </button>
        </div>
    `;
}

// ========================================
// FONCTIONS GLOBALES
// ========================================

window.pointerOperation = async function(operationId, pointer) {
    try {
        await OperationsBancairesService.pointerOperation(operationId, pointer);
        
        // Mettre à jour localement
        const operation = state.operationsData.find(op => op.id === operationId);
        if (operation) {
            operation.pointee = pointer;
        }
        
        // Rafraîchir l'affichage
        afficherOperations();
        
        // Mettre à jour les stats
        const stats = await OperationsBancairesService.getStatistiques();
        afficherStatistiques(stats);
        
        config.notify.success(pointer ? 'Opération pointée' : 'Opération dépointée');
    } catch (error) {
        config.notify.error('Erreur lors du pointage');
    }
};

// ========================================
// NETTOYAGE
// ========================================

window.addEventListener('beforeunload', () => {
    // Nettoyer les tooltips
    if (tooltipsInstances && tooltipsInstances.length > 0) {
        tooltipsInstances.forEach(tooltip => tooltip.destroy());
    }
});

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [02/02/2025] - Création initiale
   - Architecture IoC stricte
   - L'orchestrateur contrôle toute la présentation
   - Configs UI locales (filtres, stats, export)
   - Connexion des composants par callbacks
   
   NOTES POUR REPRISES FUTURES:
   - Les composants ne se connaissent pas
   - Toute la logique de présentation est ICI
   - Les configs UI ne sont PAS dans data.js
   ======================================== */