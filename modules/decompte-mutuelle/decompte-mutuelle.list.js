// ========================================
// DECOMPTE-MUTUELLE.LIST.JS - Orchestrateur de la liste des décomptes
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.list.js
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
// - DecomptesMutuellesService (logique métier)
// - config (factories des composants)
// - data (constantes métier)
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
import config from './decompte-mutuelle.config.js';
import { state } from './decompte-mutuelle.main.js';
import { chargerMagasins } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION UI (L'ORCHESTRATEUR DÉCIDE)
// ========================================

// Configuration des filtres
const FILTERS_CONFIG = {
    recherche: {
        type: 'search',
        key: 'recherche',
        placeholder: 'Client, NSS, n° décompte, virement...'
    },
    magasin: {
        type: 'select',
        key: 'magasin',
        label: 'Magasin',
        keepPlaceholder: true,
        searchable: true,
        options: [] // Chargé dynamiquement
    },
    mutuelle: {
        type: 'select',
        key: 'mutuelle',
        label: 'Mutuelle',
        keepPlaceholder: true,
        options: [] // Généré depuis les constantes
    },
    reseauTP: {
        type: 'select',
        key: 'reseauTP',
        label: 'Réseau TP',
        keepPlaceholder: true,
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
            { value: 'week', label: 'Cette semaine' },
            { value: 'month', label: 'Ce mois' }
        ]
    },
    statut: {
        type: 'select',
        key: 'statut',
        label: 'Statut',
        keepPlaceholder: true,
        showIcons: true,
        options: [] // Généré depuis les constantes
    }
};

// Configuration des stats cards
const STATS_CARDS_CONFIG = {
    cartes: [
        { statut: 'nouveau', color: 'secondary' },
        { statut: 'traitement_ia', color: 'info' },
        { statut: 'traitement_effectue', color: 'success' },
        { statut: 'traitement_manuel', color: 'warning' },
        { statut: 'rapprochement_bancaire', color: 'primary' }
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

let tableDecomptes = null;
let filtresDecomptes = null;
let statsCards = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeDecomptes() {
    console.log('🚀 Initialisation orchestrateur liste décomptes...');
    
    // 0. Charger les données d'abord pour avoir les mutuelles/prestataires
    await chargerDonneesInitiales();
    
    // 1. Créer l'instance DataTable
    initDataTable();
    
    // 2. Créer les filtres (avec les bonnes options maintenant)
    await initFiltres();
    
    // 3. Créer les cartes de statistiques
    initStatsCards();
    
    // 4. Connecter les composants entre eux
    connectComponents();
    
    console.log('✅ Orchestrateur liste décomptes initialisé');
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
    tableDecomptes = config.createDecomptesTable('.decomptes-table-container', {
        columns: [
            {
                key: 'dateVirement',
                label: 'Date virement',
                sortable: true,
                width: 110,
                formatter: (value) => formatDate(value, 'jour')
            },
            {
                key: 'codeMagasin',
                label: 'Code magasin',
                sortable: true,
                width: 100,
                formatter: (value) => value || '-'
            },
            {
                key: 'client',
                label: 'Client',
                sortable: true,
                formatter: (client) => {
                    if (!client || (!client.nom && !client.prenom)) {
                        return '-';
                    }
                    const nom = client.nom || '';
                    const prenom = client.prenom || '';
                    const nomComplet = `${prenom} ${nom}`.trim();
                    return nomComplet || '-';
                },
                sortFunction: (a, b, direction) => {
                    const clientA = a || {};
                    const clientB = b || {};
                    const nameA = `${clientA.prenom || ''} ${clientA.nom || ''}`.trim().toLowerCase() || '-';
                    const nameB = `${clientB.prenom || ''} ${clientB.nom || ''}`.trim().toLowerCase() || '-';
                    return direction === 'asc' 
                        ? nameA.localeCompare(nameB, 'fr')
                        : nameB.localeCompare(nameA, 'fr');
                }
            },
            {
                key: 'mutuelle',
                label: 'Mutuelle',
                sortable: true,
                formatter: (value) => value || '-'
            },
            {
                key: 'prestataireTP',
                label: 'Réseau TP',
                sortable: true,
                formatter: (value) => value || '-'
            },
            {
                key: 'montantVirement',
                label: 'Montant',
                sortable: true,
                formatter: (value) => config.HTML_TEMPLATES.montant(value)
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
                    <button class="${config.BUTTON_CLASSES.action}" onclick="voirDetailDecompte('${row.id}')">
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
            filename: `decomptes_${new Date().toISOString().split('T')[0]}`,
            onBeforeExport: (data) => prepareExportData(data)
        }
    });
    
    console.log('📊 DataTable créée avec config locale');
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
        const styledResetBtn = config.Button({
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
        if (tableDecomptes) {
            tableDecomptes.state.loading = true;
            tableDecomptes.refresh();
        }
        
        // Charger les décomptes
        state.decomptesData = await DecomptesMutuellesService.getDecomptes();
        
        console.log('🔍 DEBUG - Décomptes chargés:', state.decomptesData.length);
        console.log('🔍 DEBUG - Exemple décompte:', state.decomptesData[0]);
        
        if (!state.decomptesData) {
            state.decomptesData = [];
        }
        
        // Mettre à jour les mutuelles et réseaux TP dynamiques
        if (state.decomptesData.length > 0) {
            mettreAJourMutuelles(state.decomptesData);
            mettreAJourReseauxTP(state.decomptesData);
            
            // Ne pas recréer les filtres, ils seront mis à jour au prochain init
            // Les mutuelles et prestataires ont été mis à jour dans les Sets
            console.log('✅ Mutuelles disponibles:', getListeMutuelles());
            console.log('✅ Prestataires disponibles:', getListePrestataires());
        }
        
        // Charger les statistiques
        const stats = await DecomptesMutuellesService.getStatistiques();
        afficherStatistiques(stats);
        
        // Afficher les décomptes
        afficherDecomptes();
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
        state.decomptesData = [];
        afficherStatistiques({
            parStatut: {},
            parMutuelle: {},
            montantTotal: 0,
            montantMoyen: 0
        });
        afficherDecomptes();
    } finally {
        if (tableDecomptes) {
            tableDecomptes.state.loading = false;
        }
    }
}

// ========================================
// AFFICHAGE DES DONNÉES
// ========================================

function afficherStatistiques(stats) {
    if (statsCards) {
        const statsToUpdate = {};
        
        STATS_CARDS_CONFIG.cartes.forEach(carte => {
            statsToUpdate[carte.statut] = stats.parStatut[carte.statut] || 0;
        });
        
        // Ajouter une carte pour le montant total
        statsToUpdate.montantTotal = {
            value: formaterMontant(stats.montantTotal),
            label: 'Total virements',
            icon: '💰',
            color: 'success'
        };
        
        statsCards.updateAll(statsToUpdate);
    }
}

function afficherDecomptes() {
    if (!tableDecomptes) {
        console.error('DataTable non initialisée');
        return;
    }
    
    const decomptesFiltres = filtrerDecomptesLocalement();
    tableDecomptes.setData(decomptesFiltres);
}

// ========================================
// FILTRAGE LOCAL
// ========================================

function filtrerDecomptesLocalement() {
    return state.decomptesData.filter(decompte => {
        // Exclure les supprimés
        if (decompte.statut === 'supprime') {
            return false;
        }
        
        // Filtre recherche
        if (state.filtres.recherche) {
            const recherche = state.filtres.recherche.toLowerCase();
            const clientNom = `${decompte.client.prenom} ${decompte.client.nom}`.toLowerCase();
            const numero = decompte.numeroDecompte?.toLowerCase() || '';
            const virement = decompte.virementId?.toLowerCase() || '';
            const mutuelle = decompte.mutuelle?.toLowerCase() || '';
            const nss = decompte.client.numeroSecuriteSociale?.replace(/\s/g, '') || '';
            
            if (!clientNom.includes(recherche) && 
                !numero.includes(recherche) && 
                !virement.includes(recherche) &&
                !mutuelle.includes(recherche) &&
                !nss.includes(recherche.replace(/\s/g, ''))) {
                return false;
            }
        }
        
        // Filtre magasin
        if (state.filtres.magasin && decompte.codeMagasin !== state.filtres.magasin) {
            return false;
        }
        
        // Filtre mutuelle
        if (state.filtres.mutuelle && decompte.mutuelle !== state.filtres.mutuelle) {
            return false;
        }
        
        // Filtre réseau TP
        if (state.filtres.reseauTP && decompte.prestataireTP !== state.filtres.reseauTP) {
            return false;
        }
        
        // Filtre statut (depuis select)
        if (state.filtres.statut && decompte.statut !== state.filtres.statut) {
            return false;
        }
        
        // Filtre statuts multiples (depuis cartes)
        if (state.filtres.statutsActifs.length > 0 && !state.filtres.statutsActifs.includes(decompte.statut)) {
            return false;
        }
        
        // Filtre période
        if (state.filtres.periode !== 'all') {
            const dateVirement = decompte.dateVirement?.toDate ? 
                decompte.dateVirement.toDate() : 
                new Date(decompte.dateVirement);
            
            const maintenant = new Date();
            const debut = new Date();
            
            switch (state.filtres.periode) {
                case 'today':
                    debut.setHours(0, 0, 0, 0);
                    if (dateVirement < debut) return false;
                    break;
                case 'week':
                    debut.setDate(debut.getDate() - 7);
                    if (dateVirement < debut) return false;
                    break;
                case 'month':
                    debut.setMonth(debut.getMonth() - 1);
                    if (dateVirement < debut) return false;
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

export { afficherDecomptes };

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