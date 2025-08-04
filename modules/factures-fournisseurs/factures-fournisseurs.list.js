// ========================================
// FACTURES-FOURNISSEURS.LIST.JS - Orchestrateur de la liste des factures
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.list.js
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
// - FacturesFournisseursService (logique métier)
// - config (factories des composants)
// - data (constantes métier)
// ========================================

import { FacturesFournisseursService } from './factures-fournisseurs.service.js';
import { 
    FACTURES_CONFIG,
    formaterDate,
    formaterMontant,
    getListeFournisseurs,
    mettreAJourFournisseurs
} from './factures-fournisseurs.data.js';
import { formatDate as formatDateUtil, Button } from '../../src/components/index.js';
import config from './factures-fournisseurs.config.js';
import { state } from './factures-fournisseurs.main.js';
import { chargerMagasins } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION UI (L'ORCHESTRATEUR DÉCIDE)
// ========================================

// Configuration des filtres
const FILTERS_CONFIG = {
    recherche: {
        type: 'search',
        key: 'recherche',
        placeholder: 'Fournisseur, n° facture, référence...'
    },
    magasin: {
        type: 'select',
        key: 'magasin',
        label: 'Magasin',
        keepPlaceholder: true,
        searchable: true,
        options: [] // Chargé dynamiquement
    },
    fournisseur: {
        type: 'select',
        key: 'fournisseur',
        label: 'Fournisseur',
        keepPlaceholder: true,
        searchable: true,
        options: [] // Généré depuis les factures
    },
    categorie: {
        type: 'select',
        key: 'categorie',
        label: 'Catégorie',
        keepPlaceholder: true,
        options: [] // Sera généré depuis FACTURES_CONFIG.CATEGORIES_FOURNISSEURS
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
            { value: 'quarter', label: 'Ce trimestre' }
        ]
    }
};

// Configuration des stats cards
const STATS_CARDS_CONFIG = {
    cartes: [
        { id: 'nouvelle', label: 'Nouvelle', icon: '📄', color: 'secondary' },
        { id: 'a_payer', label: 'À payer', icon: '💳', color: 'warning' },
        { id: 'en_retard', label: 'En retard', icon: '⚠️', color: 'danger' },
        { id: 'deja_payee', label: 'Déjà payée', icon: '✅', color: 'success' },
        { id: 'a_pointer', label: 'À pointer', icon: '🔍', color: 'purple' },
        { id: 'total_a_payer', label: 'Total à payer', icon: '💰', color: 'info', special: true }
    ]
};

// Configuration de l'export
const EXPORT_CONFIG = {
    colonnes: [
        { key: 'dateFacture', label: 'Date facture', formatter: 'date' },
        { key: 'numeroFacture', label: 'N° Facture' },
        { key: 'fournisseur', label: 'Fournisseur', formatter: 'fournisseur' },
        { key: 'categorie', label: 'Catégorie', formatter: 'categorie' },
        { key: 'montantHT', label: 'Montant HT', formatter: 'montant' },
        { key: 'montantTVA', label: 'TVA', formatter: 'montant' },
        { key: 'montantTTC', label: 'Montant TTC', formatter: 'montant' },
        { key: 'dateEcheance', label: 'Échéance', formatter: 'date' },
        { key: 'statut', label: 'Statut', formatter: 'statut' },
        { key: 'modePaiement', label: 'Mode paiement' },
        { key: 'referenceVirement', label: 'Référence' }
    ]
};

// ========================================
// INSTANCES DES COMPOSANTS
// ========================================

let tableFactures = null;
let filtresFactures = null;
let statsCards = null;

// ========================================
// INITIALISATION DU MODULE
// ========================================

export async function initListeFactures() {
    console.log('🚀 Initialisation orchestrateur liste factures...');
    
    // 0. Charger les données d'abord pour avoir les fournisseurs
    await chargerDonneesInitiales();
    
    // 1. Créer l'instance DataTable
    initDataTable();
    
    // 2. Créer les filtres (avec les bonnes options maintenant)
    await initFiltres();
    
    // 3. Créer les cartes de statistiques
    initStatsCards();
    
    // 4. Connecter les composants entre eux
    connectComponents();
    
    console.log('✅ Orchestrateur liste factures initialisé');
}

// Nouvelle fonction pour charger juste les données sans afficher
async function chargerDonneesInitiales() {
    try {
        // Charger les factures
        state.facturesData = await FacturesFournisseursService.getFactures();
        
        if (!state.facturesData) {
            state.facturesData = [];
        }
        
        // Mettre à jour les fournisseurs dynamiques
        if (state.facturesData.length > 0) {
            mettreAJourFournisseurs(state.facturesData);
        }
        
        console.log('✅ Données initiales chargées');
        
    } catch (error) {
        console.error('❌ Erreur chargement initial:', error);
        state.facturesData = [];
    }
}

// ========================================
// INITIALISATION DATATABLE
// ========================================

function initDataTable() {
    tableFactures = config.createFacturesTable('.factures-table-container', {
        columns: [
            {
                key: 'dateFacture',
                label: 'Date',
                sortable: true,
                width: 100,
                formatter: (value) => formatDate(value, 'jour')
            },
            {
                key: 'fournisseur',
                label: 'Fournisseur',
                sortable: true,
                formatter: (fournisseur) => config.HTML_TEMPLATES.fournisseur(fournisseur || {})
            },
            {
                key: 'numeroFacture',
                label: 'N° Facture',
                sortable: true,
                formatter: (value) => value || '-'
            },
            {
                key: 'montantTTC',
                label: 'Montant TTC',
                sortable: true,
                formatter: (value) => config.HTML_TEMPLATES.montant(value)
            },
            {
                key: 'dateEcheance',
                label: 'Échéance',
                sortable: true,
                formatter: (value, row) => config.HTML_TEMPLATES.echeance(value, row.statut)
            },
            {
                key: 'categorie',
                label: 'Catégorie',
                sortable: true,
                width: 120,
                formatter: (_, row) => afficherCategorie(row.fournisseur?.categorie)
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
                    <button class="${config.BUTTON_CLASSES.action}" onclick="voirDetailFacture('${row.id}')">
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
            filename: `factures_${formatDateUtil(new Date(), 'YYYY-MM-DD')}`,
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
    filtresFactures = config.createFacturesFilters(
        '.factures-filters',
        filtresConfig,
        (filters) => handleFilterChange(filters)
    );
    
    // Remplacer le bouton reset par un composant Button stylisé
    const resetBtnElement = filtresFactures.getResetButtonElement();
    if (resetBtnElement) {
        const styledResetBtn = new Button({
            text: '🔄 Réinitialiser',
            variant: 'secondary',
            size: 'sm',
            textColor: 'dark',
            onClick: () => filtresFactures.reset()
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
    
    statsCards = config.createFacturesStatsCards(
        '.factures-stats',
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
                    !filters.fournisseur &&
                    !filters.categorie &&
                    filters.periode === 'all';
    
    if (isReset) {
        // Reset complet
        state.filtres = {
            recherche: '',
            magasin: '',
            fournisseur: '',
            categorie: '',
            periode: 'all',
            statutsActifs: []  // On garde pour le filtrage par cartes
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
            fournisseur: filters.fournisseur || '',
            categorie: filters.categorie || '',
            periode: filters.periode || 'all'
            // SUPPRIMÉ : statut, aPayer, enRetard
        };
    }
    
    if (tableFactures) {
        afficherFactures();
    }
}

function handleStatsCardClick(cardId) {
    console.log('🎯 DEBUG - Clic sur carte:', cardId);
    
    // Les cartes spéciales ne filtrent pas
    const cartesSpeciales = ['total_a_payer'];
    if (cartesSpeciales.includes(cardId)) {
        return;
    }
    
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
    
    console.log('🎯 DEBUG - Statuts actifs après clic:', state.filtres.statutsActifs);
    afficherFactures();
}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

export async function chargerDonnees() {
    try {
        if (tableFactures) {
            tableFactures.state.loading = true;
            tableFactures.refresh();
        }
        
        // Charger les factures
        state.facturesData = await FacturesFournisseursService.getFactures();
        
        console.log('🔍 DEBUG - Factures chargées:', state.facturesData.length);
        console.log('🔍 DEBUG - Échantillon de factures:', state.facturesData.slice(0, 3));
        
        if (!state.facturesData) {
            state.facturesData = [];
        }
        
        // Mettre à jour les fournisseurs dynamiques
        if (state.facturesData.length > 0) {
            mettreAJourFournisseurs(state.facturesData);
            console.log('✅ Fournisseurs disponibles:', getListeFournisseurs());
        }
        
        // Charger les statistiques
        const stats = await FacturesFournisseursService.getStatistiques();
        
        // DEBUG COMPLET : Afficher TOUTES les clés de parStatut
        console.log('📊 DEBUG - Statistiques complètes:');
        console.log('- Total factures:', stats.total);
        console.log('- Par statut:', stats.parStatut);
        if (stats.parStatut) {
            Object.entries(stats.parStatut).forEach(([statut, count]) => {
                console.log(`  * ${statut}: ${count}`);
            });
        }
        console.log('- Nombre en retard:', stats.nombreEnRetard);
        console.log('- Montant à payer:', stats.montantAPayer);
        
        // Vérifier aussi un échantillon de factures
        if (state.facturesData.length > 0) {
            console.log('📋 Échantillon de statuts dans les factures:');
            state.facturesData.slice(0, 5).forEach((f, i) => {
                console.log(`  Facture ${i}: statut="${f.statut}", enRetard=${f.enRetard}`);
            });
        }
        
        afficherStatistiques(stats);
        
        // Afficher les factures
        afficherFactures();
        
    } catch (error) {
        console.error('Erreur chargement données:', error);
        state.facturesData = [];
        afficherStatistiques({
            parStatut: {},
            montantAPayer: 0,
            nombreEnRetard: 0
        });
        afficherFactures();
    } finally {
        if (tableFactures) {
            tableFactures.state.loading = false;
        }
    }
}

// ========================================
// AFFICHAGE DES DONNÉES
// ========================================

function afficherStatistiques(stats) {
    if (statsCards) {
        console.log('📊 DEBUG - Stats reçues:', stats);
        console.log('📊 DEBUG - Détail parStatut:', stats.parStatut);
        
        const statsToUpdate = {};
        
        // Mapping des statuts depuis stats.parStatut
        // On utilise les statuts qui existent vraiment dans les données
        statsToUpdate.nouvelle = stats.parStatut?.nouvelle || 0;
        statsToUpdate.a_payer = stats.parStatut?.a_payer || 0;
        statsToUpdate.en_retard = stats.parStatut?.en_retard || 0;
        statsToUpdate.deja_payee = stats.parStatut?.deja_payee || 0;
        
        // À pointer : inclure aussi payee et deja_payee qui doivent être pointées
        let aPointer = stats.parStatut?.a_pointer || 0;
        if (stats.parStatut?.payee) {
            aPointer += stats.parStatut.payee;
        }
        statsToUpdate.a_pointer = aPointer;
        
        // Total à payer - calculer depuis les statuts qui doivent être payés
        let totalAPayer = 0;
        state.facturesData.forEach(facture => {
            if (facture.statut === 'a_payer' || facture.statut === 'en_retard') {
                totalAPayer += facture.montantTTC || 0;
            }
        });
        
        statsToUpdate.total_a_payer = formaterMontant(totalAPayer);
        
        console.log('📊 DEBUG - Stats finales à mettre à jour:', statsToUpdate);
        
        statsCards.updateAll(statsToUpdate);
    }
}

function afficherFactures() {
    if (!tableFactures) {
        console.error('DataTable non initialisée');
        return;
    }
    
    const facturesFiltrees = filtrerFacturesLocalement();
    tableFactures.setData(facturesFiltrees);
}

// ========================================
// FILTRAGE LOCAL
// ========================================

function filtrerFacturesLocalement() {
    return state.facturesData.filter(facture => {
        // Filtre recherche (amélioré avec plus de champs)
        if (state.filtres.recherche) {
            const recherche = state.filtres.recherche.toLowerCase();
            const fournisseurNom = facture.fournisseur?.nom?.toLowerCase() || '';
            const numeroFacture = facture.numeroFacture?.toLowerCase() || '';
            const numeroInterne = facture.numeroInterne?.toLowerCase() || '';
            const referenceVirement = facture.referenceVirement?.toLowerCase() || '';
            const numeroClient = facture.fournisseur?.numeroClient?.toLowerCase() || '';
            const siren = facture.fournisseur?.siren || '';
            const montantTTC = facture.montantTTC?.toString() || '';
            const categorie = facture.fournisseur?.categorie?.toLowerCase() || '';
            
            const found = fournisseurNom.includes(recherche) || 
                         numeroFacture.includes(recherche) || 
                         numeroInterne.includes(recherche) ||
                         referenceVirement.includes(recherche) ||
                         numeroClient.includes(recherche) ||
                         siren.includes(recherche) ||
                         montantTTC.includes(recherche) ||
                         categorie.includes(recherche);
            
            if (!found) {
                return false;
            }
        }
        
        // Filtre magasin
        if (state.filtres.magasin && facture.codeMagasin !== state.filtres.magasin) {
            return false;
        }
        
        // Filtre fournisseur
        if (state.filtres.fournisseur && facture.fournisseur?.nom !== state.filtres.fournisseur) {
            return false;
        }
        
        // Filtre catégorie - CORRECTION : le filtre était déjà là mais il manquait la gestion de la valeur vide
        if (state.filtres.categorie && state.filtres.categorie !== '') {
            if (!facture.fournisseur?.categorie || facture.fournisseur.categorie !== state.filtres.categorie) {
                return false;
            }
        }
        
        // SUPPRIMÉ : Filtres spéciaux (aPayer, enRetard depuis select)
        
        // Filtre statuts multiples (depuis cartes)
        if (state.filtres.statutsActifs.length > 0) {
            // Vérifier le statut de la facture
            if (!state.filtres.statutsActifs.includes(facture.statut)) {
                return false;
            }
        }

        // Filtre période
        if (state.filtres.periode !== 'all') {
            const dateFacture = facture.dateFacture?.toDate ? 
                facture.dateFacture.toDate() : 
                new Date(facture.dateFacture);
            
            const maintenant = new Date();
            const debut = new Date();
            
            switch (state.filtres.periode) {
                case 'today':
                    debut.setHours(0, 0, 0, 0);
                    if (dateFacture < debut) return false;
                    break;
                case 'week':
                    debut.setDate(debut.getDate() - 7);
                    if (dateFacture < debut) return false;
                    break;
                case 'month':
                    debut.setMonth(debut.getMonth() - 1);
                    if (dateFacture < debut) return false;
                    break;
                case 'quarter':
                    debut.setMonth(debut.getMonth() - 3);
                    if (dateFacture < debut) return false;
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
    
    // Générer les options de fournisseur
    config.fournisseur.options = [
        { value: '', label: 'Tous les fournisseurs' },
        ...getListeFournisseurs().map(fournisseur => ({
            value: fournisseur,
            label: fournisseur
        }))
    ];
    
    // Générer les options de catégorie depuis les données métier
    config.categorie.options = [
        { value: '', label: 'Toutes' },
        ...Object.entries(FACTURES_CONFIG.CATEGORIES_FOURNISSEURS).map(([key, cat]) => ({
            value: key,
            label: cat.label,
            icon: cat.icon
        }))
    ];
    
    return Object.values(config);
}

function genererConfigStatsCards() {
    // Utiliser directement la configuration avec labels et icônes
    return STATS_CARDS_CONFIG.cartes.map(carte => ({
        id: carte.id,
        label: carte.label,
        value: carte.special && carte.id === 'total_a_payer' ? '0 €' : 0,
        icon: carte.icon,
        color: carte.color
    }));
}

// ========================================
// FORMATTERS ET UTILITAIRES
// ========================================

function formatDate(timestamp, format) {
    return formaterDate(timestamp, format);
}

function afficherStatut(statut) {
    const configData = FACTURES_CONFIG.STATUTS[statut];
    if (!configData) return statut;
    
    return config.HTML_TEMPLATES.statut(configData);
}

function afficherCategorie(categorie) {
    if (!categorie) return '-';
    
    // Utiliser les données métier
    const configData = FACTURES_CONFIG.CATEGORIES_FOURNISSEURS[categorie] || { 
        label: categorie, 
        icon: '📋' 
    };
    
    // Utiliser le MÊME template que les statuts pour l'harmonisation
    return config.HTML_TEMPLATES.statut(configData);
}

function prepareExportData(data) {
    return data.map(row => {
        const result = {};
        
        EXPORT_CONFIG.colonnes.forEach(col => {
            switch (col.formatter) {
                case 'date':
                    result[col.label] = formatDate(row[col.key], 'jour');
                    break;
                case 'fournisseur':
                    result[col.label] = row.fournisseur?.nom || '-';
                    break;
                case 'categorie':
                    result[col.label] = row.fournisseur?.categorie || '-';
                    break;
                case 'montant':
                    result[col.label] = formaterMontant(row[col.key]);
                    break;
                case 'statut':
                    result[col.label] = FACTURES_CONFIG.STATUTS[row.statut]?.label || row.statut;
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

export { afficherFactures };

export function resetFiltres() {
    if (filtresFactures) {
        filtresFactures.reset();
    }
    
    state.filtres.statutsActifs = [];
    
    if (statsCards && statsCards.elements.cards) {
        Object.values(statsCards.elements.cards).forEach(card => {
            card.classList.remove('active');
        });
    }
    
    afficherFactures();
}

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [03/02/2025] - Création initiale
   - Architecture IoC stricte
   - L'orchestrateur contrôle toute la présentation
   - Configs UI locales (filtres, stats, export)
   - Gestion des factures en retard
   - Filtres spéciaux (à payer, en retard)
   
   NOTES POUR REPRISES FUTURES:
   - Les composants ne se connaissent pas
   - Toute la logique de présentation est ICI
   - Les configs UI ne sont PAS dans data.js
   - Gestion des statuts spéciaux (en retard)
   ======================================== */