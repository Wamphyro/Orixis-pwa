// ========================================
// INTERVENTION.DATA.JS - Configuration centralisée des interventions
// Chemin: src/js/data/intervention.data.js
//
// DESCRIPTION:
// Centralise toutes les configurations liées aux interventions
// Créé le 31/01/2025
//
// STRUCTURE:
// 1. Configuration générale
// 2. Statuts d'intervention
// 3. Types d'appareils et marques
// 4. Problèmes et actions
// 5. Configuration des filtres
// 6. Configuration des stats cards
// 7. Configuration des exports
// 8. Fonctions helpers
// ========================================

export const INTERVENTION_CONFIG = {
    // Configuration générale
    ITEMS_PAR_PAGE: 20,
    DELAI_RECHERCHE: 300, // ms pour debounce
    
    // ========================================
    // STATUTS D'INTERVENTION
    // ========================================
    STATUTS: {
        nouvelle: {
            label: 'Nouvelle',
            icon: '📝',
            couleur: '#e9ecef',
            suivant: 'en_cours'
        },
        en_cours: {
            label: 'En cours',
            icon: '🔧',
            couleur: '#cfe2ff',
            suivant: 'terminee'
        },
        terminee: {
            label: 'Terminée',
            icon: '✅',
            couleur: '#d4edda',
            suivant: null
        },
        annulee: {
            label: 'Annulée',
            icon: '❌',
            couleur: '#f8d7da',
            suivant: null
        }
    },
    
    // ========================================
    // TYPES D'APPAREILS
    // ========================================
    TYPES_APPAREILS: {
        BTE: {
            label: 'BTE (Contour)',
            icon: '🔵',
            description: 'Contour d\'oreille classique'
        },
        RIC: {
            label: 'RIC/RITE',
            icon: '🔴',
            description: 'Écouteur déporté'
        },
        ITE: {
            label: 'ITE/CIC',
            icon: '🟢',
            description: 'Intra-auriculaire'
        }
    },
    
    // ========================================
    // MARQUES D'APPAREILS
    // ========================================
    MARQUES_APPAREILS: [
        'Phonak',
        'Oticon',
        'Signia/Siemens',
        'Widex',
        'Starkey',
        'ReSound',
        'Unitron',
        'Bernafon',
        'Autre'
    ],
    
    // ========================================
    // PROBLÈMES POSSIBLES
    // ========================================
    PROBLEMES: {
        pas_de_son: {
            label: 'Pas de son / Muet',
            icon: '🔇',
            priorite: 1
        },
        son_faible: {
            label: 'Son faible',
            icon: '🔉',
            priorite: 2
        },
        sifflement: {
            label: 'Sifflement (Larsen)',
            icon: '📢',
            priorite: 3
        },
        son_intermittent: {
            label: 'Son intermittent',
            icon: '〰️',
            priorite: 4
        },
        gresille: {
            label: 'Grésille / Parasite',
            icon: '📡',
            priorite: 5
        },
        humidite: {
            label: 'Humidité / Condensation',
            icon: '💧',
            priorite: 6
        },
        inconfort: {
            label: 'Inconfort / Douleur',
            icon: '😣',
            priorite: 7
        },
        controle_routine: {
            label: 'Contrôle routine',
            icon: '🔧',
            priorite: 8
        }
    },
    
    // ========================================
    // ACTIONS POSSIBLES
    // ========================================
    ACTIONS: {
        pile_changee: {
            label: 'Pile testée / changée',
            icon: '🔋',
            categorie: 'alimentation'
        },
        nettoyage_complet: {
            label: 'Nettoyage complet',
            icon: '🧹',
            categorie: 'entretien'
        },
        filtre_change: {
            label: 'Filtre pare-cérumen changé',
            icon: '🔄',
            categorie: 'consommable'
        },
        dome_remplace: {
            label: 'Dôme remplacé',
            icon: '🔵',
            categorie: 'consommable'
        },
        tube_change: {
            label: 'Tube changé',
            icon: '📏',
            categorie: 'consommable'
        },
        sechage: {
            label: 'Séchage effectué',
            icon: '☀️',
            categorie: 'entretien'
        },
        reglage_logiciel: {
            label: 'Réglage logiciel',
            icon: '💻',
            categorie: 'technique'
        },
        verification_embout: {
            label: 'Vérification embout',
            icon: '👂',
            categorie: 'controle'
        }
    },
    
    // ========================================
    // RÉSULTATS POSSIBLES
    // ========================================
    RESULTATS: {
        Résolu: {
            label: 'Problème résolu',
            icon: '✅',
            couleur: '#28a745'
        },
        Partiel: {
            label: 'Amélioration partielle',
            icon: '⚠️',
            couleur: '#ffc107'
        },
        SAV: {
            label: 'Escalade SAV nécessaire',
            icon: '🔴',
            couleur: '#dc3545'
        },
        OK: {
            label: 'Contrôle OK',
            icon: '👍',
            couleur: '#17a2b8'
        }
    },
    
    // ========================================
    // CONFIGURATION DES FILTRES
    // ========================================
    FILTRES_CONFIG: {
        recherche: {
            type: 'search',
            key: 'recherche',
            placeholder: 'Client, appareil, n° intervention...'
        },
        
        magasin: {
            type: 'select',
            key: 'magasin',
            label: 'Magasin',
            options: [] // Chargé dynamiquement
        },
        
        periode: {
            type: 'select',
            key: 'periode',
            label: 'Période',
            defaultValue: 'all',
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
            options: [] // Généré dynamiquement
        },
        
        resultat: {
            type: 'select',
            key: 'resultat',
            label: 'Résultat',
            options: [] // Généré dynamiquement
        }
    },
    
    // ========================================
    // CONFIGURATION DES STATS CARDS
    // ========================================
    STATS_CARDS_CONFIG: {
        cartes: [
            { 
                id: 'nouvelles',
                label: 'Nouvelles',
                icon: '📝',
                color: 'info',
                statut: 'nouvelle'
            },
            { 
                id: 'en_cours',
                label: 'En cours',
                icon: '🔧',
                color: 'warning',
                statut: 'en_cours'
            },
            { 
                id: 'terminees_jour',
                label: 'Terminées aujourd\'hui',
                icon: '✅',
                color: 'success',
                filter: 'today_completed'
            },
            { 
                id: 'sav_semaine',
                label: 'SAV cette semaine',
                icon: '🔴',
                color: 'danger',
                filter: 'week_sav'
            }
        ]
    },
    
    // ========================================
    // CONFIGURATION DES COLONNES D'EXPORT
    // ========================================
    EXPORT_CONFIG: {
        colonnes: [
            { key: 'numeroIntervention', label: 'N° Intervention' },
            { key: 'dates.intervention', label: 'Date', formatter: 'date' },
            { key: 'client', label: 'Client', formatter: 'client' },
            { key: 'appareil.marque', label: 'Marque' },
            { key: 'appareil.type', label: 'Type', formatter: 'typeAppareil' },
            { key: 'problemes', label: 'Problèmes', formatter: 'array' },
            { key: 'actions', label: 'Actions', formatter: 'array' },
            { key: 'resultat', label: 'Résultat' },
            { key: 'statut', label: 'Statut', formatter: 'statut' },
            { key: 'magasin', label: 'Magasin' },
            { key: 'intervenant', label: 'Intervenant', formatter: 'intervenant' },
            { key: 'observations', label: 'Observations' }
        ]
    },
    
    // Messages et textes
    MESSAGES: {
        AUCUNE_INTERVENTION: 'Aucune intervention pour le moment',
        CHARGEMENT: 'Chargement des interventions...',
        ERREUR_CHARGEMENT: 'Erreur lors du chargement des interventions',
        INTERVENTION_CREEE: 'Intervention créée avec succès',
        INTERVENTION_MISE_A_JOUR: 'Intervention mise à jour',
        INTERVENTION_ANNULEE: 'Intervention annulée',
        
        // Confirmations
        CONFIRMER_ANNULATION: 'Êtes-vous sûr de vouloir annuler cette intervention ?',
        CONFIRMER_CLOTURE: 'Confirmer la clôture de l\'intervention ?',
        CONFIRMER_SAV: 'Confirmer l\'escalade SAV ?',
        
        // Erreurs
        ERREUR_CLIENT_REQUIS: 'Veuillez sélectionner un client',
        ERREUR_APPAREIL_REQUIS: 'Veuillez renseigner l\'appareil',
        ERREUR_PROBLEME_REQUIS: 'Veuillez sélectionner au moins un problème',
        ERREUR_ACTION_REQUISE: 'Veuillez sélectionner au moins une action',
        ERREUR_RESULTAT_REQUIS: 'Veuillez sélectionner un résultat',
        ERREUR_SIGNATURES: 'Les signatures sont requises pour terminer l\'intervention'
    }
};

// ========================================
// FONCTIONS DE GÉNÉRATION DES CONFIGS
// ========================================

/**
 * Générer les options de filtres dynamiquement
 */
export function genererOptionsFiltres() {
    const config = { ...INTERVENTION_CONFIG.FILTRES_CONFIG };
    
    // Générer les options de statut
    config.statut.options = [
        { value: '', label: 'Tous les statuts' },
        ...Object.entries(INTERVENTION_CONFIG.STATUTS).map(([key, statut]) => ({
            value: key,
            label: statut.label,
            icon: statut.icon
        }))
    ];
    
    // Générer les options de résultat
    config.resultat.options = [
        { value: '', label: 'Tous les résultats' },
        ...Object.entries(INTERVENTION_CONFIG.RESULTATS).map(([key, resultat]) => ({
            value: key,
            label: resultat.label,
            icon: resultat.icon
        }))
    ];
    
    return Object.values(config);
}

/**
 * Générer la configuration des cartes de statistiques
 */
export function genererConfigStatsCards() {
    return INTERVENTION_CONFIG.STATS_CARDS_CONFIG.cartes;
}

/**
 * Formater les données pour l'export
 */
export function formaterDonneesExport(data) {
    return data.map(row => {
        const result = {};
        
        INTERVENTION_CONFIG.EXPORT_CONFIG.colonnes.forEach(col => {
            let value = getNestedValue(row, col.key);
            
            switch (col.formatter) {
                case 'date':
                    result[col.label] = formatDate(value);
                    break;
                case 'client':
                    result[col.label] = value ? `${value.prenom} ${value.nom}` : '-';
                    break;
                case 'typeAppareil':
                    result[col.label] = INTERVENTION_CONFIG.TYPES_APPAREILS[value]?.label || value;
                    break;
                case 'statut':
                    result[col.label] = INTERVENTION_CONFIG.STATUTS[value]?.label || value;
                    break;
                case 'intervenant':
                    result[col.label] = value ? `${value.prenom} ${value.nom}` : '-';
                    break;
                case 'array':
                    result[col.label] = Array.isArray(value) ? value.join(', ') : '-';
                    break;
                default:
                    result[col.label] = value || '-';
            }
        });
        
        return result;
    });
}

// ========================================
// FONCTIONS HELPERS
// ========================================

/**
 * Générer un numéro d'intervention
 */
export function genererNumeroIntervention(magasin = '9XXX') {
    const date = new Date();
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `INT-${magasin}-${annee}${mois}${jour}-${sequence}`;
}

/**
 * Formater une date
 */
export function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR');
}

/**
 * Obtenir la valeur d'un chemin imbriqué
 */
function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Vérifier si une intervention peut être modifiée
 */
export function peutEtreModifiee(statut) {
    return ['nouvelle', 'en_cours'].includes(statut);
}

/**
 * Vérifier si une intervention peut être annulée
 */
export function peutEtreAnnulee(statut) {
    return statut !== 'annulee';
}

/**
 * Obtenir le prochain statut
 */
export function getProchainStatut(statutActuel) {
    return INTERVENTION_CONFIG.STATUTS[statutActuel]?.suivant || null;
}

/**
 * Calculer les statistiques du jour
 */
export function calculerStatsJour(interventions) {
    const aujourd'hui = new Date();
    aujourd'hui.setHours(0, 0, 0, 0);
    
    return interventions.filter(intervention => {
        const dateIntervention = intervention.dates?.intervention?.toDate ? 
            intervention.dates.intervention.toDate() : 
            new Date(intervention.dates?.intervention);
        
        return dateIntervention >= aujourd'hui;
    });
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [31/01/2025] - Création du fichier
   - Configuration centralisée de toutes les données
   - Structure similaire à commandes.data.js
   - Adaptation au contexte des interventions SAV
   
   NOTES POUR REPRISES FUTURES:
   - Toute configuration doit être dans ce fichier
   - Les icônes sont définies à UN SEUL endroit
   - Utiliser les fonctions de génération plutôt que dupliquer
   ======================================== */