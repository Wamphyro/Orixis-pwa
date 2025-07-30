// ========================================
// COMMANDES.DATA.JS - Constantes et données de référence
// Chemin: src/js/data/commandes.data.js
//
// DESCRIPTION:
// Centralise toutes les configurations liées aux commandes
// Modifié le 27/07/2025 : Ajout du statut "supprime"
// Modifié le 31/01/2025 : Correction des icônes pour cohérence avec UI
//
// STRUCTURE:
// 1. Configuration générale (lignes 15-20)
// 2. Statuts de commande (lignes 22-85)
// 3. Types de préparation (lignes 87-110)
// 4. Niveaux d'urgence (lignes 112-135)
// 5. Autres configurations (lignes 137+)
// ========================================

export const COMMANDES_CONFIG = {
    // Configuration générale
    ITEMS_PAR_PAGE: 20,
    DELAI_RECHERCHE: 300, // ms pour debounce
    
    // Statuts de commande
    STATUTS: {
        nouvelle: {
            label: 'Nouvelle',
            icon: '📋',
            couleur: '#e9ecef',
            suivant: 'preparation'
        },
        preparation: {
            label: 'En préparation',
            icon: '🔧',
            couleur: '#cfe2ff',
            suivant: 'terminee'
        },
        terminee: {
            label: 'Préparée',
            icon: '🎯',
            couleur: '#d1e7dd',
            suivant: 'expediee'
        },
        expediee: {
            label: 'Expédiée',
            icon: '📦',
            couleur: '#fff3cd',
            suivant: 'receptionnee'
        },
        receptionnee: {
            label: 'Réceptionnée',
            icon: '📥',
            couleur: '#e7f1ff',
            suivant: 'livree'
        },
        livree: {
            label: 'Livrée',
            icon: '✅',
            couleur: '#d4edda',
            suivant: null
        },
        annulee: {
            label: 'Annulée',
            icon: '❌',
            couleur: '#f8d7da',
            suivant: null
        },
        supprime: {
            label: 'Supprimée',
            icon: '🗑️',
            couleur: '#dc3545',
            suivant: null
        }
    },
    
    // Types de préparation
    TYPES_PREPARATION: {
        livraison_premiere_paire: {
            label: 'Livraison première paire',
            description: 'Première adaptation du patient'
        },
        livraison_deuxieme_paire: {
            label: 'Livraison deuxième paire',
            description: 'Paire de secours ou renouvellement'
        },
        livraison_accessoire: {
            label: 'Livraison accessoire',
            description: 'Accessoires et consommables uniquement'
        }
    },
    
    // Niveaux d'urgence
    NIVEAUX_URGENCE: {
        normal: {
            label: 'Normal',
            delai: '3-5 jours',
            couleur: '#28a745',
            icon: '🍃'  // ← Icône cohérente avec le dropdown
        },
        urgent: {
            label: 'Urgent',
            delai: '48h',
            couleur: '#ffc107',
            icon: '💨'  // ← Icône cohérente avec le dropdown
        },
        tres_urgent: {
            label: 'Très urgent',
            delai: '24h',
            couleur: '#dc3545',
            icon: '🔥'  // ← Icône cohérente avec le dropdown
        }
    },
    
    // Types de produits
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
    
    // Catégories de produits
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
    
    // Transporteurs
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
    
    // Messages et textes
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
    
    // Validations
    VALIDATIONS: {
        TELEPHONE: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        CODE_POSTAL: /^[0-9]{5}$/,
        NUMERO_SERIE: /^[A-Z0-9-]{5,}$/
    },
    
    // Formats d'affichage
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
    // Ne peut pas supprimer si déjà supprimée ou livrée
    return !['livree', 'supprime'].includes(statut);
}

// Fonction helper pour calculer le délai de livraison
export function calculerDelaiLivraison(urgence = 'normal') {
    const maintenant = new Date();
    const delais = {
        'normal': 5,
        'urgent': 2,
        'tres_urgent': 1
    };
    
    const jours = delais[urgence] || 5;
    maintenant.setDate(maintenant.getDate() + jours);
    
    // Éviter les weekends
    const jourSemaine = maintenant.getDay();
    if (jourSemaine === 0) maintenant.setDate(maintenant.getDate() + 1); // Dimanche -> Lundi
    if (jourSemaine === 6) maintenant.setDate(maintenant.getDate() + 2); // Samedi -> Lundi
    
    return maintenant;
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
   
   NOTES POUR REPRISES FUTURES:
   - Le statut "supprime" est un statut final comme "livree" et "annulee"
   - Les commandes supprimées sont filtrées dans commandes.list.js
   - La suppression nécessite une validation nom/prénom pour sécurité
   - Les icônes doivent rester cohérentes avec le dropdown des filtres
   ======================================== */