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
        options: [
            { value: '', label: 'Toutes' },
            { value: 'telecom', label: 'Télécom', icon: '📱' },
            { value: 'energie', label: 'Énergie', icon: '⚡' },
            { value: 'services', label: 'Services', icon: '💼' },
            { value: 'informatique', label: 'Informatique', icon: '💻' },
            { value: 'fournitures', label: 'Fournitures', icon: '📦' },
            { value: 'autre', label: 'Autre', icon: '📋' }
        ]
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
    },
    statut: {
        type: 'select',
        key: 'statut',
        label: 'Statut',
        keepPlaceholder: true,
        showIcons: true,
        options: [] // Généré depuis les constantes
    },
    special: {
        type: 'select',
        key: 'special',
        label: 'Filtres spéciaux',
        keepPlaceholder: true,
        options: [
            { value: '', label: 'Aucun filtre' },
            { value: 'aPayer', label: 'À payer uniquement', icon: '💳' },
            { value: 'enRetard', label: 'En retard uniquement', icon: '⚠️' }
        ]
    }
};

// Configuration des stats cards
const STATS_CARDS_CONFIG = {
    cartes: [
        { id: 'nouvelles', statut: 'nouvelle', color: 'secondary' },
        { id: 'a_payer', statut: 'a_payer', color: 'warning' },
        { id: 'en_retard', statut: 'en_retard', color: 'danger' },
        { id: 'a_pointer', statut: 'a_pointer', color: 'purple' },
        { id: 'pointees_mois', special: true, color: 'success' },
        { id: 'total_a_payer', special: true, color: 'info' }
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
                    filters.periode === 'all' && 
                    !filters.statut &&
                    (!filters.special || filters.special === '');
    
    if (isReset) {
        // Reset complet
        state.filtres = {
            recherche: '',
            magasin: '',
            fournisseur: '',
            categorie: '',
            periode: 'all',
            statut: '',
            statutsActifs: [],
            aPayer: false,
            enRetard: false
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
            periode: filters.periode || 'all',
            statut: filters.statut || '',
            aPayer: filters.special === 'aPayer',
            enRetard: filters.special === 'enRetard'
        };
    }
    
    if (tableFactures) {
        afficherFactures();
    }
}

function handleStatsCardClick(cardId) {
    console.log('🎯 DEBUG - Clic sur carte:', cardId);
    
    // Toggle le filtre par statut (sauf cartes spéciales)
    if (!['pointees_mois', 'total_a_payer'].includes(cardId)) {
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
        
        const statsToUpdate = {};
        
        // Cartes par statut
        STATS_CARDS_CONFIG.cartes.forEach(carte => {
            if (!carte.special) {
                const valeur = stats.parStatut[carte.statut] || 0;
                statsToUpdate[carte.id] = valeur;
                console.log(`📊 DEBUG - Carte ${carte.id} (${carte.statut}):`, valeur);
            }
        });
        
        // Cartes spéciales
        statsToUpdate.en_retard = stats.nombreEnRetard || 0;
        console.log('📊 DEBUG - En retard:', stats.nombreEnRetard);
        
        // Pointées ce mois
        const pointeesMois = state.facturesData.filter(f => {
            if (f.statut !== 'pointee') return false;
            const datePointage = f.dates?.pointage;
            if (!datePointage) return false;
            
            const date = datePointage.toDate ? datePointage.toDate() : new Date(datePointage);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        }).length;
        
        console.log('📊 DEBUG - Pointées ce mois:', pointeesMois);
        
        // IMPORTANT : Pour les cartes spéciales, il faut passer juste la valeur, pas un objet
        statsToUpdate.pointees_mois = pointeesMois;
        
        // Total à payer
        const montantFormate = formaterMontant(stats.montantAPayer || 0);
        console.log('📊 DEBUG - Total à payer:', montantFormate);
        
        // IMPORTANT : Pour cette carte, on veut juste afficher le montant formaté
        statsToUpdate.total_a_payer = montantFormate;
        
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
        
        // Filtre catégorie
        if (state.filtres.categorie && facture.fournisseur?.categorie !== state.filtres.categorie) {
            return false;
        }
        
        // Filtre statut (depuis select)
        if (state.filtres.statut && facture.statut !== state.filtres.statut) {
            return false;
        }
        
        // Filtre statuts multiples (depuis cartes)
        if (state.filtres.statutsActifs.length > 0) {
            // Pour les factures en retard, vérifier si 'en_retard' est dans les filtres
            if (facture.enRetard && state.filtres.statutsActifs.includes('en_retard')) {
                return true;
            }
            
            // Sinon vérifier le statut normal
            if (!state.filtres.statutsActifs.includes(facture.statut)) {
                return false;
            }
        }
        
        // Filtres spéciaux
        if (state.filtres.aPayer && !facture.aPayer) {
            return false;
        }
        
        if (state.filtres.enRetard && !facture.enRetard) {
            return false;
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
    
    // Générer les options de statut
    config.statut.options = [
        { value: '', label: 'Tous les statuts' },
        ...Object.entries(FACTURES_CONFIG.STATUTS)
            .filter(([key]) => key !== 'annulee')
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
        if (carte.special) {
            // Cartes spéciales
            if (carte.id === 'pointees_mois') {
                return {
                    id: carte.id,
                    label: 'Pointées ce mois',
                    value: 0,
                    icon: '✓✓',
                    color: carte.color,
                    format: 'number' // Indiquer que c'est un nombre
                };
            } else if (carte.id === 'total_a_payer') {
                return {
                    id: carte.id,
                    label: 'Total à payer',
                    value: '0 €',
                    icon: '💰',
                    color: carte.color,
                    format: 'currency' // Indiquer que c'est déjà formaté
                };
            }
        } else {
            // Cartes standard
            const statut = FACTURES_CONFIG.STATUTS[carte.statut];
            return {
                id: carte.id,
                label: statut.label,
                value: 0,
                icon: statut.icon,
                color: carte.color
            };
        }
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
    const configData = FACTURES_CONFIG.STATUTS[statut];
    if (!configData) return statut;
    
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