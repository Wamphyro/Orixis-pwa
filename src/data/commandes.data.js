// ========================================
// COMMANDES.DATA.JS - Constantes et données de référence
// Chemin: src/js/data/commandes.data.js
//
// DESCRIPTION:
// Centralise toutes les configurations liées aux commandes
// Modifié le 27/07/2025 : Ajout du statut "supprime"
// Modifié le 31/01/2025 : Correction des icônes pour cohérence avec UI
// Modifié le 31/01/2025 : Centralisation COMPLÈTE de toutes les configs UI
// Modifié le 01/02/2025 : Ajout TIMELINE_CONFIG, DISPLAY_TEMPLATES et icônes manquantes
//
// STRUCTURE:
// 1. Configuration générale (lignes 15-20)
// 2. Statuts de commande (lignes 22-85)
// 3. Configuration Timeline (lignes 87-110)
// 4. Types de préparation (lignes 112-135)
// 5. Niveaux d'urgence (lignes 137-160)
// 6. Templates d'affichage (lignes 162-180)
// 7. Configuration des filtres (lignes 182-225)
// 8. Configuration des stats cards (lignes 227-245)
// 9. Configuration des selects UI (lignes 247-295)
// 10. Configuration des exports (lignes 297-325)
// 11. Autres configurations (lignes 327+)
// ========================================

export const COMMANDES_CONFIG = {
    // Configuration générale
    ITEMS_PAR_PAGE: 20,
    DELAI_RECHERCHE: 300, // ms pour debounce
    
    // ========================================
    // Statuts de commande
    // ========================================
    STATUTS: {
        nouvelle: {
            label: 'Nouvelle',
            icon: '📋',
            couleur: '#e9ecef',
            suivant: 'preparation',
            description: 'Commande créée, en attente de traitement'
        },
        preparation: {
            label: 'En préparation',
            icon: '🔧',
            couleur: '#cfe2ff',
            suivant: 'terminee',
            description: 'Commande en cours de préparation'
        },
        terminee: {
            label: 'Préparée',
            icon: '🎯',
            couleur: '#d1e7dd',
            suivant: 'expediee',
            description: 'Préparation terminée, prête à expédier'
        },
        expediee: {
            label: 'Expédiée',
            icon: '📦',
            couleur: '#fff3cd',
            suivant: 'receptionnee',
            description: 'Colis expédié vers le magasin'
        },
        receptionnee: {
            label: 'Réceptionnée',
            icon: '📥',
            couleur: '#e7f1ff',
            suivant: 'livree',
            description: 'Colis reçu au magasin'
        },
        livree: {
            label: 'Livrée',
            icon: '✅',
            couleur: '#d4edda',
            suivant: null,
            description: 'Commande remise au patient'
        },
        annulee: {
            label: 'Annulée',
            icon: '❌',
            couleur: '#f8d7da',
            suivant: null,
            description: 'Commande annulée'
        },
        supprime: {
            label: 'Supprimée',
            icon: '🗑️',
            couleur: '#dc3545',
            suivant: null,
            description: 'Commande supprimée (soft delete)'
        }
    },
    
    // ========================================
    // Configuration de la Timeline
    // ========================================
    TIMELINE_CONFIG: {
        // Ordre d'affichage des statuts dans la timeline
        sequence: ['nouvelle', 'preparation', 'terminee', 'expediee', 'receptionnee', 'livree'],
        
        // Mapping statuts -> champs de dates dans l'objet commande
        dateFields: {
            nouvelle: 'commande',
            preparation: 'preparationDebut',
            terminee: 'preparationFin',
            expediee: 'expeditionValidee',
            receptionnee: 'receptionValidee',
            livree: 'livraisonClient'
        },
        
        // Configuration par défaut pour Timeline
        defaultOptions: {
            theme: 'colorful',
            orientation: 'horizontal',
            animated: true,
            showDates: true,
            showLabels: true,
            clickable: false
        }
    },
    
    // ========================================
    // Types de préparation
    // ========================================
    TYPES_PREPARATION: {
        livraison_premiere_paire: {
            label: 'Livraison première paire',
            description: 'Première adaptation du patient',
            icon: '1️⃣'
        },
        livraison_deuxieme_paire: {
            label: 'Livraison deuxième paire',
            description: 'Paire de secours ou renouvellement',
            icon: '2️⃣'
        },
        livraison_accessoire: {
            label: 'Livraison accessoire',
            description: 'Accessoires et consommables uniquement',
            icon: '🎧'
        }
    },
    
    // ========================================
    // Niveaux d'urgence
    // ========================================
    NIVEAUX_URGENCE: {
        normal: {
            label: 'Normal',
            delai: '3-5 jours',
            couleur: '#28a745',
            icon: '🍃',
            joursLivraison: 5
        },
        urgent: {
            label: 'Urgent',
            delai: '48h',
            couleur: '#ffc107',
            icon: '💨',
            joursLivraison: 2
        },
        tres_urgent: {
            label: 'Très urgent',
            delai: '24h',
            couleur: '#dc3545',
            icon: '🔥',
            joursLivraison: 1
        }
    },
    
    // ========================================
    // Templates d'affichage HTML
    // ========================================
    DISPLAY_TEMPLATES: {
        urgence: {
            wrapper: 'urgence-icon-wrapper',
            className: 'urgence-icon',
            tooltipClass: 'urgence-tooltip',
            getHTML: (config) => `
                <span class="urgence-icon-wrapper">
                    <span class="urgence-icon">${config.icon}</span>
                    <span class="urgence-tooltip">${config.label} (${config.delai})</span>
                </span>
            `
        },
        statut: {
            wrapper: 'statut-icon-wrapper',
            className: 'statut-icon',
            tooltipClass: 'statut-tooltip',
            getHTML: (config) => `
                <span class="statut-icon-wrapper">
                    <span class="statut-icon">${config.icon}</span>
                    <span class="statut-tooltip">${config.label}</span>
                </span>
            `
        }
    },
    
    // ========================================
    // Configuration des filtres
    // ========================================
    FILTRES_CONFIG: {
        recherche: {
            type: 'search',
            key: 'recherche',
            placeholder: 'Client, produit, n° commande...'
        },
        
        magasin: {
            type: 'select',
            key: 'magasin',
            label: 'Magasin',
            keepPlaceholder: true,
            searchable: true,
            options: [] // Chargé dynamiquement
        },
        
        statut: {
            type: 'select',
            key: 'statut',
            label: 'Statut',
            keepPlaceholder: true,
            options: [] // Généré dynamiquement
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
        
        urgence: {
            type: 'select',
            key: 'urgence',
            label: 'Urgence',
            keepPlaceholder: true,
            showIcons: true,
            options: [] // Généré dynamiquement
        }
    },
    
    // ========================================
    // Configuration des cartes de statistiques
    // ========================================
    STATS_CARDS_CONFIG: {
        cartes: [
            { statut: 'nouvelle', color: 'info' },
            { statut: 'preparation', color: 'warning' },
            { statut: 'expediee', color: 'primary' },
            { statut: 'livree', color: 'success' }
        ]
    },
    
    // ========================================
    // Configuration des selects UI
    // ========================================
    UI_SELECTS: {
        transporteurs: [
            { value: 'Colissimo', label: 'Colissimo' },
            { value: 'Chronopost', label: 'Chronopost' },
            { value: 'UPS', label: 'UPS' },
            { value: 'DHL', label: 'DHL' },
            { value: 'Fedex', label: 'Fedex' },
            { value: 'GLS', label: 'GLS' },
            { value: 'Autre', label: 'Autre' }
        ]
    },
    
    // ========================================
    // Configuration des colonnes d'export
    // ========================================
    EXPORT_CONFIG: {
        colonnes: [
            { key: 'numeroCommande', label: 'N° Commande' },
            { key: 'date', label: 'Date', formatter: 'date' },
            { key: 'client', label: 'Client', formatter: 'client' },
            { key: 'telephone', label: 'Téléphone' },
            { key: 'typePreparation', label: 'Type', formatter: 'typePreparation' },
            { key: 'niveauUrgence', label: 'Urgence', formatter: 'urgence' },
            { key: 'statut', label: 'Statut', formatter: 'statut' },
            { key: 'magasinLivraison', label: 'Magasin Livraison' },
            { key: 'commentaires', label: 'Commentaires' }
        ]
    },
    
    // ========================================
    // Types de produits
    // ========================================
    TYPES_PRODUITS: {
        appareil_auditif: {
            label: 'Appareil auditif',
            necessiteCote: true,
            gestionNumeroSerie: true
        },
        accessoire: {
            label: 'Accessoire',
            necessiteCote: false,
            gestionNumeroSerie: true
        },
        consommable: {
            label: 'Consommable',
            necessiteCote: false,
            gestionNumeroSerie: false
        }
    },
    
    // ========================================
    // Catégories de produits
    // ========================================
    CATEGORIES_PRODUITS: {
        // Appareils
        'contour': 'Contour d\'oreille',
        'intra': 'Intra-auriculaire',
        'ric': 'RIC (écouteur déporté)',
        
        // Accessoires
        'chargeur': 'Chargeur',
        'telecommande': 'Télécommande',
        'connectivite': 'Accessoire connectivité',
        
        // Consommables
        'dome': 'Dômes',
        'filtre': 'Filtres',
        'pile': 'Piles',
        'entretien': 'Produits d\'entretien'
    },
    
    // ========================================
    // Transporteurs (config détaillée)
    // ========================================
    TRANSPORTEURS: {
        colissimo: {
            nom: 'Colissimo',
            delaiMax: 3,
            formatNumero: /^[0-9A-Z]{13}$/
        },
        chronopost: {
            nom: 'Chronopost',
            delaiMax: 1,
            formatNumero: /^[0-9A-Z]{13}$/
        },
        ups: {
            nom: 'UPS',
            delaiMax: 2,
            formatNumero: /^1Z[0-9A-Z]{16}$/
        },
        interne: {
            nom: 'Livraison interne',
            delaiMax: 1,
            formatNumero: null
        }
    },
    
    // ========================================
    // Messages et textes
    // ========================================
    MESSAGES: {
        AUCUNE_COMMANDE: 'Aucune commande pour le moment',
        CHARGEMENT: 'Chargement des commandes...',
        ERREUR_CHARGEMENT: 'Erreur lors du chargement des commandes',
        COMMANDE_CREEE: 'Commande créée avec succès',
        COMMANDE_MISE_A_JOUR: 'Commande mise à jour',
        COMMANDE_ANNULEE: 'Commande annulée',
        COMMANDE_SUPPRIMEE: 'Commande supprimée avec succès',
        
        // Confirmations
        CONFIRMER_ANNULATION: 'Êtes-vous sûr de vouloir annuler cette commande ?',
        CONFIRMER_VALIDATION: 'Confirmer la validation de cette étape ?',
        CONFIRMER_EXPEDITION: 'Confirmer l\'expédition ? Le numéro de suivi est-il correct ?',
        CONFIRMER_SUPPRESSION: 'Êtes-vous sûr de vouloir supprimer cette commande ?',
        
        // Erreurs
        ERREUR_CLIENT_REQUIS: 'Veuillez sélectionner un client',
        ERREUR_PRODUITS_REQUIS: 'Veuillez ajouter au moins un produit',
        ERREUR_SCAN_REQUIS: 'Veuillez scanner le code-barres du colis',
        ERREUR_NUMERO_SERIE: 'Veuillez saisir les numéros de série',
        ERREUR_DROITS: 'Vous n\'avez pas les droits pour cette action',
        ERREUR_VALIDATION_NOM: 'Le nom et prénom saisis ne correspondent pas au client'
    },
    
    // ========================================
    // Validations
    // ========================================
    VALIDATIONS: {
        TELEPHONE: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        CODE_POSTAL: /^[0-9]{5}$/,
        NUMERO_SERIE: /^[A-Z0-9-]{5,}$/
    },
    
    // ========================================
    // Formats d'affichage
    // ========================================
    FORMATS: {
        DATE: {
            jour: 'DD/MM/YYYY',
            heure: 'HH:mm',
            complet: 'DD/MM/YYYY à HH:mm'
        },
        NUMERO_COMMANDE: 'CMD-{YYYY}{MM}{DD}-{XXXX}', // XXXX = numéro séquentiel
        PRIX: {
            devise: '€',
            decimales: 2
        }
    }
};

// ========================================
// FONCTIONS DE GÉNÉRATION DES CONFIGS
// ========================================

/**
 * Générer les options de filtres dynamiquement
 */
export function genererOptionsFiltres() {
    const config = { ...COMMANDES_CONFIG.FILTRES_CONFIG };
    
    // Générer les options de statut depuis STATUTS
    config.statut.options = [
        { value: '', label: 'Tous les statuts' },
        ...Object.entries(COMMANDES_CONFIG.STATUTS)
            .filter(([key]) => key !== 'supprime') // Exclure le statut supprimé
            .map(([key, statut]) => ({
                value: key,
                label: `${statut.icon} ${statut.label}`
            }))
    ];
    
    // Générer les options d'urgence depuis NIVEAUX_URGENCE
    config.urgence.options = [
        { value: '', label: 'Toutes' },
        ...Object.entries(COMMANDES_CONFIG.NIVEAUX_URGENCE).map(([key, urgence]) => ({
            value: key,
            label: `${urgence.icon} ${urgence.label}`
        }))
    ];
    
    return Object.values(config);
}

/**
 * Générer la configuration des cartes de statistiques
 */
export function genererConfigStatsCards() {
    return COMMANDES_CONFIG.STATS_CARDS_CONFIG.cartes.map(carte => {
        const statut = COMMANDES_CONFIG.STATUTS[carte.statut];
        return {
            id: carte.statut,
            label: statut.label,
            value: 0,
            icon: statut.icon,
            color: carte.color
        };
    });
}

/**
 * Générer les options pour un select d'urgence
 */
export function genererOptionsUrgence() {
    return Object.entries(COMMANDES_CONFIG.NIVEAUX_URGENCE).map(([key, urgence]) => ({
        value: key,
        label: `${urgence.icon} ${urgence.label}`
    }));
}

/**
 * Générer les options pour un select de transporteurs
 */
export function genererOptionsTransporteurs() {
    return COMMANDES_CONFIG.UI_SELECTS.transporteurs;
}

/**
 * Générer les options pour un select de types de préparation
 */
export function genererOptionsTypesPreparation() {
    return Object.entries(COMMANDES_CONFIG.TYPES_PREPARATION).map(([key, type]) => ({
        value: key,
        label: type.label,
        description: type.description,
        icon: type.icon
    }));
}

/**
 * Formater les données pour l'export selon la config
 */
export function formaterDonneesExport(data) {
    return data.map(row => {
        const result = {};
        
        COMMANDES_CONFIG.EXPORT_CONFIG.colonnes.forEach(col => {
            switch (col.formatter) {
                case 'date':
                    result[col.label] = formatDate(row.dates?.commande);
                    break;
                case 'client':
                    result[col.label] = `${row.client.prenom} ${row.client.nom}`;
                    break;
                case 'typePreparation':
                    result[col.label] = COMMANDES_CONFIG.TYPES_PREPARATION[row.typePreparation]?.label || row.typePreparation;
                    break;
                case 'urgence':
                    result[col.label] = COMMANDES_CONFIG.NIVEAUX_URGENCE[row.niveauUrgence]?.label || row.niveauUrgence;
                    break;
                case 'statut':
                    result[col.label] = COMMANDES_CONFIG.STATUTS[row.statut]?.label || row.statut;
                    break;
                default:
                    result[col.label] = row[col.key] || '-';
            }
        });
        
        return result;
    });
}

// ========================================
// FONCTIONS HELPERS EXISTANTES
// ========================================

// Fonction helper pour générer un numéro de commande
export function genererNumeroCommande() {
    const date = new Date();
    const annee = date.getFullYear();
    const mois = String(date.getMonth() + 1).padStart(2, '0');
    const jour = String(date.getDate()).padStart(2, '0');
    const sequence = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    return `CMD-${annee}${mois}${jour}-${sequence}`;
}

// Fonction helper pour formater un prix
export function formaterPrix(montant) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(montant);
}

// Fonction helper pour formater une date
export function formaterDate(timestamp, format = 'complet') {
    if (!timestamp) return '-';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    switch (format) {
        case 'jour':
            return date.toLocaleDateString('fr-FR');
        case 'heure':
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        case 'complet':
        default:
            return `${date.toLocaleDateString('fr-FR')} à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
}

// Fonction helper pour valider un téléphone
export function validerTelephone(telephone) {
    return COMMANDES_CONFIG.VALIDATIONS.TELEPHONE.test(telephone.replace(/\s/g, ''));
}

// Fonction helper pour valider un email
export function validerEmail(email) {
    return COMMANDES_CONFIG.VALIDATIONS.EMAIL.test(email);
}

// Fonction helper pour obtenir le prochain statut
export function getProchainStatut(statutActuel) {
    return COMMANDES_CONFIG.STATUTS[statutActuel]?.suivant || null;
}

// Fonction helper pour vérifier si une commande peut être annulée
export function peutEtreAnnulee(statut) {
    return !['livree', 'annulee', 'supprime'].includes(statut);
}

// Vérifier si une commande peut être supprimée
export function peutEtreSupprimee(statut) {
    return !['livree', 'supprime'].includes(statut);
}

// Fonction helper pour calculer le délai de livraison
export function calculerDelaiLivraison(urgence = 'normal') {
    const maintenant = new Date();
    const config = COMMANDES_CONFIG.NIVEAUX_URGENCE[urgence];
    const jours = config?.joursLivraison || 5;
    
    maintenant.setDate(maintenant.getDate() + jours);
    
    // Éviter les weekends
    const jourSemaine = maintenant.getDay();
    if (jourSemaine === 0) maintenant.setDate(maintenant.getDate() + 1); // Dimanche -> Lundi
    if (jourSemaine === 6) maintenant.setDate(maintenant.getDate() + 2); // Samedi -> Lundi
    
    return maintenant;
}

// Fonction helper private pour formater les dates (utilisée en interne)
function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR');
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [27/07/2025] - Ajout du statut "supprime"
   Problème: Besoin de supprimer des commandes sans perte de données
   Solution: Ajout d'un statut "supprime" pour soft delete
   Impact: Les commandes supprimées restent en base mais n'apparaissent plus
   
   [31/01/2025] - Correction des icônes pour cohérence UI
   Problème: Icônes différentes entre dropdown et tableau
   Solution: Uniformisation des icônes dans toute l'interface
   - Statuts: 📋 Nouvelle, 🔧 En préparation, etc.
   - Urgences: 🍃 Normal, 💨 Urgent, 🔥 Très urgent
   
   [31/01/2025] - Centralisation COMPLÈTE de toutes les configs
   Problème: Duplication des configs dans plusieurs fichiers
   Solution: Tout centralisé dans commandes.data.js
   - FILTRES_CONFIG + genererOptionsFiltres()
   - STATS_CARDS_CONFIG + genererConfigStatsCards()
   - UI_SELECTS pour les transporteurs et autres
   - EXPORT_CONFIG pour les colonnes d'export
   - Nouvelles fonctions de génération d'options
   
   [01/02/2025] - Ajout TIMELINE_CONFIG et DISPLAY_TEMPLATES
   Problème: Configuration timeline et templates éparpillés dans le code
   Solution: Centralisation dans commandes.data.js
   - TIMELINE_CONFIG avec séquence et mapping des dates
   - DISPLAY_TEMPLATES pour les templates HTML d'urgence et statut
   - Ajout des icônes manquantes dans TYPES_PREPARATION
   - Description pour chaque statut
   - joursLivraison dans NIVEAUX_URGENCE
   
   NOTES POUR REPRISES FUTURES:
   - Toute configuration UI doit être dans ce fichier
   - Utiliser les fonctions de génération plutôt que dupliquer
   - Les icônes sont définies à UN SEUL endroit
   - Les templates HTML sont dans DISPLAY_TEMPLATES
   - La séquence des statuts est dans TIMELINE_CONFIG.sequence
   ======================================== */