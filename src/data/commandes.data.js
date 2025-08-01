// ========================================
// COMMANDES.DATA.JS - Données métier UNIQUEMENT
// Chemin: src/data/commandes.data.js
//
// DESCRIPTION:
// Contient UNIQUEMENT les constantes et données de référence métier
// PAS de configuration UI, PAS de fonctions de génération pour l'UI
//
// MODIFIÉ le 02/02/2025:
// - Suppression de toutes les configs UI (FILTRES_CONFIG, STATS_CARDS_CONFIG, etc.)
// - Suppression des fonctions genererOptionsFiltres, genererConfigStatsCards
// - Conservation UNIQUEMENT des données métier pures
// ========================================

export const COMMANDES_CONFIG = {
    // ========================================
    // STATUTS DE COMMANDE (données métier)
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
    // TYPES DE PRÉPARATION (données métier)
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
    // NIVEAUX D'URGENCE (données métier)
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
    // TRANSPORTEURS (données métier)
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
    // TYPES DE PRODUITS (données métier)
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
    // CATÉGORIES DE PRODUITS (données métier)
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
    // MESSAGES ET TEXTES
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
    // VALIDATIONS (regex métier)
    // ========================================
    VALIDATIONS: {
        TELEPHONE: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        CODE_POSTAL: /^[0-9]{5}$/,
        NUMERO_SERIE: /^[A-Z0-9-]{5,}$/
    },
    
    // ========================================
    // FORMATS D'AFFICHAGE (données métier)
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
// FONCTIONS HELPERS MÉTIER (pas UI)
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

// Fonction helper pour vérifier si une commande peut être supprimée
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

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [02/02/2025] - Nettoyage complet pour architecture propre
   - SUPPRIMÉ : FILTRES_CONFIG (déplacé dans commandes.list.js)
   - SUPPRIMÉ : STATS_CARDS_CONFIG (déplacé dans commandes.list.js)
   - SUPPRIMÉ : TIMELINE_CONFIG (déplacé dans commandes.detail.js)
   - SUPPRIMÉ : DISPLAY_TEMPLATES (déplacé dans les orchestrateurs)
   - SUPPRIMÉ : EXPORT_CONFIG (déplacé dans commandes.list.js)
   - SUPPRIMÉ : UI_SELECTS (déplacé dans les orchestrateurs)
   - SUPPRIMÉ : genererOptionsFiltres() (fait dans l'orchestrateur)
   - SUPPRIMÉ : genererConfigStatsCards() (fait dans l'orchestrateur)
   - SUPPRIMÉ : genererOptionsUrgence() (fait dans l'orchestrateur)
   - SUPPRIMÉ : genererOptionsTransporteurs() (fait dans l'orchestrateur)
   - SUPPRIMÉ : genererOptionsTypesPreparation() (fait dans l'orchestrateur)
   - SUPPRIMÉ : formaterDonneesExport() (fait dans l'orchestrateur)
   - SUPPRIMÉ : formaterDate() (utilise le composant partagé)
   
   CONSERVÉ : Uniquement les données métier et helpers métier purs
   ======================================== */