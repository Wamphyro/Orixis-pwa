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
import { formatDate as formatDateUtil, Button } from '../../src/components/index.js';
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
    type: {
        type: 'select',
        key: 'type',
        label: 'Type',
        keepPlaceholder: true,
        options: [
            { value: '', label: 'Tous' },
            { value: 'credit', label: '➕ Crédits', icon: '➕' },
            { value: 'debit', label: '➖ Débits', icon: '➖' }
        ]
    },
    periode: {
        type: 'select',
        key: 'periode',
        label: 'Période',
        defaultValue: 'month',
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
        { id: 'balance', label: 'Balance', icon: '💰', color: 'primary' },
        { id: 'pointees', label: 'Pointées', icon: '✓', color: 'info' },
        { id: 'non_pointees', label: 'Non pointées', icon: '✗', color: 'warning' }
    ]
};

// Configuration de l'export
const EXPORT_CONFIG = {
    colonnes: [
        { key: 'dateVirement', label: 'Date virement', formatter: 'date' },
        { key: 'numeroDecompte', label: 'N° Décompte' },
        { key: 'codeMagasin', label: 'Code magasin' },
        { key: 'client', label: 'Client', formatter: 'client' },
        { key: 'nss', label: 'NSS', formatter: 'nss' },
        { key: 'mutuelle', label: 'Mutuelle' },
        { key: 'prestataireTP', label: 'Réseau TP' },
        { key: 'montantRemboursementClient', label: 'Remboursement', formatter: 'montant' },
        { key: 'montantVirement', label: 'Virement', formatter: 'montant' },
        { key: 'typeDecompte', label: 'Type' },
        { key: 'statut', label: 'Statut', formatter: 'statut' }
    ]
};

// ========================================
// INSTANCES DES COMPOSANTS
// ========================================

let tableOperations = null;
let filtresOperations = null;
let statsCards = null;
let operationsFiltrees = []; // Cache des opérations filtrées

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
        // Charger les décomptes
        state.decomptesData = await DecomptesMutuellesService.getDecomptes();
        
        if (!state.decomptesData) {
            state.decomptesData = [];
        }
        
        // Mettre à jour les mutuelles et réseaux TP dynamiques
        if (state.decomptesData.length > 0) {
            mettreAJourMutuelles(state.decomptesData);
            mettreAJourReseauxTP(state.decomptesData);
        }
        
        console.log('✅ Données initiales chargées');
        
    } catch (error) {
        console.error('❌ Erreur chargement initial:', error);
        state.decomptesData = [];
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
                formatter: (value) => formatDate(value, 'jour')
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
                width: 150,
                formatter: (value) => {
                    const cat = OPERATIONS_CONFIG.CATEGORIES[value] || OPERATIONS_CONFIG.CATEGORIES.autre;
                    return config.HTML_TEMPLATES.categorie(cat.label, cat.icon);
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
                    <button class="${config.BUTTON_CLASSES.action}" 
                            onclick="pointerOperation('${row.id}', ${!row.pointee})"
                            title="${row.pointee ? 'Dépointer' : 'Pointer'}">
                        ${row.pointee ? '✗' : '✓'}
                    </button>
                `
            }
        ],
        
        // Callbacks
        onPageChange: (page) => {
            state.currentPage = page;
        },
        
        onRowClick: (row, event) => {
            // Si c'est un clic sur checkbox
            if (event.target.type === 'checkbox') {
                toggleSelection(row.id);
            }
        },
        
        export: {
            csv: true,
            excel: true,
            filename: `operations_${formatDateUtil(new Date(), 'YYYY-MM-DD')}`,
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
// INITIALISATION FILTRES
// ========================================

async function initFiltres() {
    let filtresConfig = genererOptionsFiltres();
    
    // Charger dynamiquement les magasins
    try {
        const magasinsData = await chargerMagasins();
        
        if (magasinsData) {
            const magasins = Object.entries(magasinsData)
                .filter(([id, data]) => data.actif !== false)
                .map(([id, data]) => ({
                    value: data.code || id,
                    label: data.nom || data.code || id
                }))
                .sort((a, b) => a.label.localeCompare(b.label));
            
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
    
    // Créer l'instance DataTableFilters
    filtresDecomptes = config.createDecomptesFilters(
        '.decomptes-filters',
        filtresConfig,
        (filters) => handleFilterChange(filters)
    );
    
    // Remplacer le bouton reset par un composant Button stylisé
    const resetBtnElement = filtresDecomptes.getResetButtonElement();
    if (resetBtnElement) {
        const styledResetBtn = new Button({
            text: '🔄 Réinitialiser',
            variant: 'secondary',  // Gris neutre
            size: 'sm',
            textColor: 'dark',     // Texte noir
            onClick: () => filtresDecomptes.reset()
        });
        
        // Remplacer l'élément
        resetBtnElement.replaceWith(styledResetBtn.getElement());
    }
    
    console.log('🔍 Filtres créés avec config locale');
}

// ========================================
// INITIALISATION STATS CARDS
// ========================================

function initStatsCards() {
    const cardsConfig = genererConfigStatsCards();
    
    statsCards = config.createDecomptesStatsCards(
        '.decomptes-stats',
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
                    !filters.magasin && 
                    !filters.mutuelle &&
                    !filters.reseauTP &&
                    filters.periode === 'all' && 
                    !filters.statut;
    
    if (isReset) {
        // Reset complet
        state.filtres = {
            recherche: '',
            magasin: '',
            mutuelle: '',
            reseauTP: '',
            periode: 'all',
            statut: '',
            statutsActifs: []
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
            magasin: filters.magasin || '',
            mutuelle: filters.mutuelle || '',
            reseauTP: filters.reseauTP || '',
            periode: filters.periode || 'all',
            statut: filters.statut || ''
        };
    }
    
    if (tableDecomptes) {
        afficherDecomptes();
    }
}

function handleStatsCardClick(cardId) {
    // Toggle le filtre par statut
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
    
    afficherDecomptes();
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
            balance: {
                value: formaterMontant(stats.balance),
                label: 'Balance',
                sublabel: stats.balance >= 0 ? 'Positive' : 'Négative',
                color: stats.balance >= 0 ? 'success' : 'danger'
            },
            pointees: {
                value: stats.pointees,
                label: 'Pointées',
                sublabel: `${Math.round((stats.pointees / stats.total) * 100)}%`
            },
            non_pointees: {
                value: stats.nonPointees,
                label: 'Non pointées',
                sublabel: `${Math.round((stats.nonPointees / stats.total) * 100)}%`
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
        
        // Filtre type
        if (state.filtres.type) {
            const type = operation.montant >= 0 ? 'credit' : 'debit';
            if (type !== state.filtres.type) {
                return false;
            }
        }
        
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
// FONCTIONS DE GÉNÉRATION CONFIG
// ========================================

function genererOptionsFiltres() {
    const config = { ...FILTERS_CONFIG };
    
    // Générer les options de mutuelle
    config.mutuelle.options = [
        { value: '', label: 'Toutes les mutuelles' },
        ...getListeMutuelles().map(mutuelle => ({
            value: mutuelle,
            label: mutuelle
        }))
    ];
    
    // Générer les options de réseau TP
    config.reseauTP.options = [
        { value: '', label: 'Tous les réseaux' },
        ...getListePrestataires().map(reseau => ({
            value: reseau,
            label: reseau
        }))
    ];
    
    // Générer les options de statut
    config.statut.options = [
        { value: '', label: 'Tous les statuts' },
        ...Object.entries(DECOMPTES_CONFIG.STATUTS)
            .filter(([key]) => key !== 'supprime')
            .map(([key, statut]) => ({
                value: key,
                label: statut.label,
                icon: statut.icon
            }))
    ];
    
    return Object.values(config);
}

function genererConfigStatsCards() {
    const cards = STATS_CARDS_CONFIG.cartes.map(carte => {
        const statut = DECOMPTES_CONFIG.STATUTS[carte.statut];
        return {
            id: carte.statut,
            label: statut.label,
            value: 0,
            icon: statut.icon,
            color: carte.color
        };
    });
    
    // Ajouter la carte montant total
    cards.push({
        id: 'montantTotal',
        label: 'Total virements',
        value: '0 €',
        icon: '💰',
        color: 'success'
    });
    
    return cards;
}

// ========================================
// FORMATTERS ET UTILITAIRES
// ========================================

function formatDate(timestamp, format) {
    return formaterDate(timestamp, format);
}

function afficherStatut(statut) {
    const configData = DECOMPTES_CONFIG.STATUTS[statut];
    if (!configData) return statut;
    
    return config.HTML_TEMPLATES.statut(configData);
}

function prepareExportData(data) {
    return data.map(row => {
        const result = {};
        
        EXPORT_CONFIG.colonnes.forEach(col => {
            switch (col.formatter) {
                case 'date':
                    result[col.label] = formatDate(row.dateVirement, 'jour');
                    break;
                case 'client':
                    result[col.label] = `${row.client.prenom} ${row.client.nom}`;
                    break;
                case 'nss':
                    result[col.label] = formaterNSS(row.client.numeroSecuriteSociale);
                    break;
                case 'montant':
                    result[col.label] = formaterMontant(row[col.key]);
                    break;
                case 'statut':
                    result[col.label] = DECOMPTES_CONFIG.STATUTS[row.statut]?.label || row.statut;
                    break;
                default:
                    result[col.label] = row[col.key] || '-';
            }
        });
        
        return result;
    });
}

// ========================================
// EXPORTS POUR COMPATIBILITÉ
// ========================================

// La fonction a été renommée, pas d'export supplémentaire nécessaire
// export { afficherOperations }; // Déjà exportée plus haut

export function resetFiltres() {
    if (filtresDecomptes) {
        filtresDecomptes.reset();
    }
    
    state.filtres.statutsActifs = [];
    
    if (statsCards && statsCards.elements.cards) {
        Object.values(statsCards.elements.cards).forEach(card => {
            card.classList.remove('active');
        });
    }
    
    afficherDecomptes();
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