// ========================================
// DECOMPTE-SECU.LIST.JS - Orchestrateur de la liste des décomptes
// Chemin: modules/decompte-secu/decompte-secu.list.js
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
// - DecomptesSecuService (logique métier)
// - config (factories des composants)
// - data (constantes métier)
// ========================================

import { DecomptesSecuService } from './decompte-secu.service.js';
import { 
    DECOMPTES_SECU_CONFIG,
    formaterDate,
    formaterMontant,
    formaterNSS,
    getListeCaisses,
    mettreAJourCaisses
} from './decompte-secu.data.js';
import { formatDate as formatDateUtil, Button } from '../../src/components/index.js';
import config from './decompte-secu.config.js';
import { state } from './decompte-secu.main.js';
import { chargerMagasins } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION UI (L'ORCHESTRATEUR DÉCIDE)
// ========================================

// Configuration des filtres
const FILTERS_CONFIG = {
    recherche: {
        type: 'search',
        key: 'recherche',
        placeholder: 'Bénéficiaire, NSS, n° décompte, n° feuille soins...'
    },
    magasin: {
        type: 'select',
        key: 'magasin',
        label: 'Magasin',
        keepPlaceholder: true,
        searchable: true,
        options: [] // Chargé dynamiquement
    },
    caissePrimaire: {
        type: 'select',
        key: 'caissePrimaire',
        label: 'Caisse CPAM',
        keepPlaceholder: true,
        options: [] // Généré depuis les constantes + dynamique
    },
    regime: {
        type: 'select',
        key: 'regime',
        label: 'Régime',
        keepPlaceholder: true,
        options: [] // Généré depuis les constantes
    },
    typeActe: {
        type: 'select',
        key: 'typeActe',
        label: 'Type d\'acte',
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
            { value: 'week', label: 'Cette semaine' },
            { value: 'month', label: 'Ce mois' },
            { value: 'trimester', label: 'Ce trimestre' }
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
        { statut: 'controle_taux', color: 'warning' },
        { statut: 'traitement_effectue', color: 'success' },
        { statut: 'paiement_effectue', color: 'primary' }
    ]
};

// Configuration de l'export
const EXPORT_CONFIG = {
    colonnes: [
        { key: 'datePaiement', label: 'Date paiement', formatter: 'date' },
        { key: 'numeroDecompte', label: 'N° Décompte' },
        { key: 'numeroFeuilleSoins', label: 'N° Feuille soins' },
        { key: 'codeMagasin', label: 'Code magasin' },
        { key: 'beneficiaire', label: 'Bénéficiaire', formatter: 'beneficiaire' },
        { key: 'nss', label: 'NSS', formatter: 'nss' },
        { key: 'caissePrimaire', label: 'Caisse CPAM' },
        { key: 'regime', label: 'Régime', formatter: 'regime' },
        { key: 'montantTotalFacture', label: 'Montant facturé', formatter: 'montant' },
        { key: 'tauxMoyenRemboursement', label: 'Taux moyen', formatter: 'taux' },
        { key: 'montantTotalRembourseFinal', label: 'Montant remboursé', formatter: 'montant' },
        { key: 'montantTotalParticipations', label: 'Participations', formatter: 'montant' },
        { key: 'statut', label: 'Statut', formatter: 'statut' }
    ]
};

// ========================================
// INSTANCES DES COMPOSANTS
// ========================================

let tableDecomptesSecu = null;
let filtresDecomptesSecu = null;
let statsCards = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeDecomptesSecu() {
    console.log('🚀 Initialisation orchestrateur liste décomptes sécu...');
    
    // 0. Charger les données d'abord pour avoir les caisses dynamiques
    await chargerDonneesInitiales();
    
    // 1. Créer l'instance DataTable
    initDataTable();
    
    // 2. Créer les filtres (avec les bonnes options maintenant)
    await initFiltres();
    
    // 3. Créer les cartes de statistiques
    initStatsCards();
    
    // 4. Connecter les composants entre eux
    connectComponents();
    
    console.log('✅ Orchestrateur liste décomptes sécu initialisé');
}

// Nouvelle fonction pour charger juste les données sans afficher
async function chargerDonneesInitiales() {
    try {
        // Charger les décomptes
        state.decomptesSecuData = await DecomptesSecuService.getDecomptes();
        
        if (!state.decomptesSecuData) {
            state.decomptesSecuData = [];
        }
        
        // Mettre à jour les caisses dynamiques
        if (state.decomptesSecuData.length > 0) {
            mettreAJourCaisses(state.decomptesSecuData);
        }
        
        console.log('✅ Données initiales chargées');
        
    } catch (error) {
        console.error('❌ Erreur chargement initial:', error);
        state.decomptesSecuData = [];
    }
}

// ========================================
// INITIALISATION DATATABLE
// ========================================

function initDataTable() {
    tableDecomptesSecu = config.createDecomptesSecuTable('.decomptes-secu-table-container', {
        columns: [
            {
                key: 'datePaiement',
                label: 'Date paiement',
                sortable: true,
                width: 110,
                formatter: (value) => formatDate(value, 'jour')
            },
            {
                key: 'codeMagasin',
                label: 'Magasin',
                sortable: true,
                width: 80,
                formatter: (value) => value || '-'
            },
            {
                key: 'beneficiaire',
                label: 'Bénéficiaire',
                sortable: true,
                formatter: (beneficiaire) => {
                    if (!beneficiaire || (!beneficiaire.nom && !beneficiaire.prenom)) {
                        return '-';
                    }
                    const nom = beneficiaire.nom || '';
                    const prenom = beneficiaire.prenom || '';
                    const nomComplet = `${prenom} ${nom}`.trim();
                    return nomComplet || '-';
                },
                sortFunction: (a, b, direction) => {
                    const beneficiaireA = a || {};
                    const beneficiaireB = b || {};
                    const nameA = `${beneficiaireA.prenom || ''} ${beneficiaireA.nom || ''}`.trim().toLowerCase() || '-';
                    const nameB = `${beneficiaireB.prenom || ''} ${beneficiaireB.nom || ''}`.trim().toLowerCase() || '-';
                    return direction === 'asc' 
                        ? nameA.localeCompare(nameB, 'fr')
                        : nameB.localeCompare(nameA, 'fr');
                }
            },
            {
                key: 'caissePrimaire',
                label: 'Caisse CPAM',
                sortable: true,
                formatter: (value) => value || '-'
            },
            {
                key: 'regime',
                label: 'Régime',
                sortable: true,
                width: 120,
                formatter: (value) => config.HTML_TEMPLATES.regime(value)
            },
            {
                key: 'montantTotalFacture',
                label: 'Facturé',
                sortable: true,
                width: 100,
                formatter: (value) => config.HTML_TEMPLATES.montant(value || 0)
            },
            {
                key: 'tauxMoyenRemboursement',
                label: 'Taux',
                sortable: true,
                width: 80,
                formatter: (value) => config.HTML_TEMPLATES.taux(value || 0)
            },
            {
                key: 'montantTotalRembourseFinal',
                label: 'Remboursé',
                sortable: true,
                width: 100,
                formatter: (value) => `<span class="montant-rembourse">${config.HTML_TEMPLATES.montant(value || 0)}</span>`
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
                    <button class="${config.BUTTON_CLASSES.action}" onclick="voirDetailDecompteSecu('${row.id}')">
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
            filename: `decomptes_secu_${formatDateUtil(new Date(), 'YYYY-MM-DD')}`,
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
    filtresDecomptesSecu = config.createDecomptesSecuFilters(
        '.decomptes-secu-filters',
        filtresConfig,
        (filters) => handleFilterChange(filters)
    );
    
    // Remplacer le bouton reset par un composant Button stylisé
    const resetBtnElement = filtresDecomptesSecu.getResetButtonElement();
    if (resetBtnElement) {
        const styledResetBtn = new Button({
            text: '🔄 Réinitialiser',
            variant: 'secondary',
            size: 'sm',
            textColor: 'dark',
            onClick: () => filtresDecomptesSecu.reset()
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
    
    statsCards = config.createDecomptesSecuStatsCards(
        '.decomptes-secu-stats',
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
                    !filters.caissePrimaire &&
                    !filters.regime &&
                    !filters.typeActe &&
                    filters.periode === 'all' && 
                    !filters.statut;
    
    if (isReset) {
        // Reset complet
        state.filtres = {
            recherche: '',
            magasin: '',
            caissePrimaire: '',
            regime: '',
            typeActe: '',
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
            caissePrimaire: filters.caissePrimaire || '',
            regime: filters.regime || '',
            typeActe: filters.typeActe || '',
            periode: filters.periode || 'all',
            statut: filters.statut || ''
        };
    }
    
    if (tableDecomptesSecu) {
        afficherDecomptesSecu();
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
    
    afficherDecomptesSecu();
}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

export async function chargerDonnees() {
    try {
        if (tableDecomptesSecu) {
            tableDecomptesSecu.state.loading = true;
            tableDecomptesSecu.refresh();
        }
        
        // Charger les décomptes
        state.decomptesSecuData = await DecomptesSecuService.getDecomptes();
        
        console.log('🔍 DEBUG - Décomptes sécu chargés:', state.decomptesSecuData.length);
        console.log('🔍 DEBUG - Exemple décompte:', state.decomptesSecuData[0]);
        
        if (!state.decomptesSecuData) {
            state.decomptesSecuData = [];
        }
        
        // Mettre à jour les caisses dynamiques
        if (state.decomptesSecuData.length > 0) {
            mettreAJourCaisses(state.decomptesSecuData);
            
            console.log('✅ Caisses disponibles:', getListeCaisses());
        }
        
        // Charger les statistiques
        const stats = await DecomptesSecuService.getStatistiques();
        afficherStatistiques(stats);
        
        // Afficher les décomptes
        afficherDecomptesSecu();
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
        state.decomptesSecuData = [];
        afficherStatistiques({
            parStatut: {},
            parCaisse: {},
            parRegime: {},
            montantTotalFacture: 0,
            montantTotalRembourse: 0,
            tauxMoyenRemboursement: 0
        });
        afficherDecomptesSecu();
    } finally {
        if (tableDecomptesSecu) {
            tableDecomptesSecu.state.loading = false;
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
        
        // Ajouter une carte pour le taux moyen
        statsToUpdate.tauxMoyen = {
            value: `${Math.round(stats.tauxMoyenRemboursement || 0)}%`,
            label: 'Taux moyen',
            icon: '📊',
            color: 'info'
        };
        
        statsCards.updateAll(statsToUpdate);
    }
}

export function afficherDecomptesSecu() {
    if (!tableDecomptesSecu) {
        console.error('DataTable non initialisée');
        return;
    }
    
    const decomptesFiltres = filtrerDecomptesLocalement();
    tableDecomptesSecu.setData(decomptesFiltres);
}

// ========================================
// FILTRAGE LOCAL
// ========================================

function filtrerDecomptesLocalement() {
    return state.decomptesSecuData.filter(decompte => {
        // Exclure les supprimés
        if (decompte.statut === 'supprime') {
            return false;
        }
        
        // Filtre recherche
        if (state.filtres.recherche) {
            const recherche = state.filtres.recherche.toLowerCase();
            const beneficiaireNom = decompte.beneficiaire ? 
                `${decompte.beneficiaire.prenom} ${decompte.beneficiaire.nom}`.toLowerCase() : '';
            const numero = decompte.numeroDecompte?.toLowerCase() || '';
            const feuilleSoins = decompte.numeroFeuilleSoins?.toLowerCase() || '';
            const caisse = decompte.caissePrimaire?.toLowerCase() || '';
            const nss = decompte.beneficiaire?.numeroSecuriteSociale?.replace(/\s/g, '') || '';
            
            if (!beneficiaireNom.includes(recherche) && 
                !numero.includes(recherche) && 
                !feuilleSoins.includes(recherche) &&
                !caisse.includes(recherche) &&
                !nss.includes(recherche.replace(/\s/g, ''))) {
                return false;
            }
        }
        
        // Filtre magasin
        if (state.filtres.magasin && decompte.codeMagasin !== state.filtres.magasin) {
            return false;
        }
        
        // Filtre caisse
        if (state.filtres.caissePrimaire && decompte.caissePrimaire !== state.filtres.caissePrimaire) {
            return false;
        }
        
        // Filtre régime
        if (state.filtres.regime && decompte.regime !== state.filtres.regime) {
            return false;
        }
        
        // Filtre type d'acte principal
        if (state.filtres.typeActe && decompte.typeActePrincipal !== state.filtres.typeActe) {
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
            const datePaiement = decompte.datePaiement?.toDate ? 
                decompte.datePaiement.toDate() : 
                new Date(decompte.datePaiement);
            
            const maintenant = new Date();
            const debut = new Date();
            
            switch (state.filtres.periode) {
                case 'today':
                    debut.setHours(0, 0, 0, 0);
                    if (datePaiement < debut) return false;
                    break;
                case 'week':
                    debut.setDate(debut.getDate() - 7);
                    if (datePaiement < debut) return false;
                    break;
                case 'month':
                    debut.setMonth(debut.getMonth() - 1);
                    if (datePaiement < debut) return false;
                    break;
                case 'trimester':
                    debut.setMonth(debut.getMonth() - 3);
                    if (datePaiement < debut) return false;
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
    
    // Générer les options de caisse
    config.caissePrimaire.options = [
        { value: '', label: 'Toutes les caisses' },
        ...getListeCaisses().map(caisse => ({
            value: caisse,
            label: caisse
        }))
    ];
    
    // Générer les options de régime
    config.regime.options = [
        { value: '', label: 'Tous les régimes' },
        ...Object.entries(DECOMPTES_SECU_CONFIG.REGIMES).map(([key, regime]) => ({
            value: key,
            label: regime.label,
            icon: regime.icon
        }))
    ];
    
    // Générer les options de type d'acte
    config.typeActe.options = [
        { value: '', label: 'Tous les types' },
        ...Object.entries(DECOMPTES_SECU_CONFIG.TYPES_ACTES).map(([key, type]) => ({
            value: key,
            label: type.label,
            icon: type.icon
        }))
    ];
    
    // Générer les options de statut
    config.statut.options = [
        { value: '', label: 'Tous les statuts' },
        ...Object.entries(DECOMPTES_SECU_CONFIG.STATUTS)
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
        const statut = DECOMPTES_SECU_CONFIG.STATUTS[carte.statut];
        return {
            id: carte.statut,
            label: statut.label,
            value: 0,
            icon: statut.icon,
            color: carte.color
        };
    });
    
    // Ajouter la carte taux moyen
    cards.push({
        id: 'tauxMoyen',
        label: 'Taux moyen',
        value: '0%',
        icon: '📊',
        color: 'info'
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
    const configData = DECOMPTES_SECU_CONFIG.STATUTS[statut];
    if (!configData) return statut;
    
    return config.HTML_TEMPLATES.statut(configData);
}

function prepareExportData(data) {
    return data.map(row => {
        const result = {};
        
        EXPORT_CONFIG.colonnes.forEach(col => {
            switch (col.formatter) {
                case 'date':
                    result[col.label] = formatDate(row.datePaiement, 'jour');
                    break;
                case 'beneficiaire':
                    result[col.label] = row.beneficiaire ? 
                        `${row.beneficiaire.prenom} ${row.beneficiaire.nom}` : '-';
                    break;
                case 'nss':
                    result[col.label] = row.beneficiaire ? 
                        formaterNSS(row.beneficiaire.numeroSecuriteSociale) : '-';
                    break;
                case 'montant':
                    result[col.label] = formaterMontant(row[col.key] || 0);
                    break;
                case 'taux':
                    result[col.label] = `${row[col.key] || 0}%`;
                    break;
                case 'regime':
                    result[col.label] = DECOMPTES_SECU_CONFIG.REGIMES[row.regime]?.label || row.regime || '-';
                    break;
                case 'statut':
                    result[col.label] = DECOMPTES_SECU_CONFIG.STATUTS[row.statut]?.label || row.statut;
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

export { afficherDecomptesSecu };

export function resetFiltres() {
    if (filtresDecomptesSecu) {
        filtresDecomptesSecu.reset();
    }
    
    state.filtres.statutsActifs = [];
    
    if (statsCards && statsCards.elements.cards) {
        Object.values(statsCards.elements.cards).forEach(card => {
            card.classList.remove('active');
        });
    }
    
    afficherDecomptesSecu();
}

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [03/02/2025] - Création initiale
   - Architecture IoC stricte
   - Adaptation pour sécurité sociale
   - Filtres spécifiques (caisse, régime, type acte)
   - Colonnes adaptées (taux, participations)
   - Stats cards avec taux moyen
   
   NOTES POUR REPRISES FUTURES:
   - Les composants ne se connaissent pas
   - Toute la logique de présentation est ICI
   - Les configs UI ne sont PAS dans data.js
   - Filtres et colonnes adaptés sécu
   ======================================== */