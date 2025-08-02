// ========================================
// INDEX GLOBAL - TOUS LES TEMPLATES
// Point d'entrée unique pour tous les types de templates
// ========================================

// ========================================
// TEMPLATES FIRESTORE
// ========================================
export { 
    CLIENT_TEMPLATE, 
    CLIENT_RULES 
} from './firestore/clients.firestore.template.js';

export { 
    PRODUIT_TEMPLATE, 
    PRODUIT_RULES 
} from './firestore/produits.firestore.template.js';

export { 
    COMMANDE_TEMPLATE, 
    COMMANDE_RULES 
} from './firestore/commandes.firestore.template.js';

export { 
    MAGASIN_TEMPLATE, 
    MAGASIN_RULES 
} from './firestore/magasins.firestore.template.js';

export { 
    INTERVENTION_TEMPLATE, 
    INTERVENTION_RULES 
} from './firestore/interventions.firestore.template.js';

export { 
    FACTURE_TEMPLATE, 
    FACTURE_RULES 
} from './firestore/factures.firestore.template.js';

export { 
    FOURNISSEUR_TEMPLATE, 
    FOURNISSEUR_RULES 
} from './firestore/fournisseurs.firestore.template.js';

export { 
    DECOMPTE_TEMPLATE, 
    DECOMPTE_RULES 
} from './firestore/decomptes.firestore.template.js';

export { 
    PACK_TEMPLATE_TEMPLATE, 
    PACK_TEMPLATE_RULES 
} from './firestore/packTemplates.firestore.template.js';

export { 
    REGLE_AUTOMATIQUE_TEMPLATE, 
    REGLE_AUTOMATIQUE_RULES 
} from './firestore/reglesAutomatiques.firestore.template.js';

export { 
    PARAMETRES_COMMANDES_TEMPLATE, 
    PARAMETRES_COMMANDES_RULES 
} from './firestore/parametresCommandes.firestore.template.js';

// ========================================
// TEMPLATES EMAIL (Future)
// ========================================
// export { 
//     DECOMPTE_NOTIFICATION_EMAIL_TEMPLATE 
// } from './email/decompte-notification.email.template.js';

// ========================================
// TEMPLATES PRINT (Future)
// ========================================
// export { 
//     FACTURE_PRINT_TEMPLATE 
// } from './print/facture.print.template.js';

// ========================================
// HELPERS (Optionnel)
// ========================================

/**
 * Clone un template pour éviter les mutations
 * @param {Object} template - Le template à cloner
 * @returns {Object} Copie profonde du template
 */
export function cloneTemplate(template) {
    return JSON.parse(JSON.stringify(template));
}

/**
 * Récupère tous les templates d'un type
 * @param {string} type - Type de template ('firestore', 'email', 'print')
 * @returns {Object} Objet avec tous les templates du type
 */
export function getTemplatesByType(type) {
    const templates = {
        firestore: {
            CLIENT_TEMPLATE,
            PRODUIT_TEMPLATE,
            COMMANDE_TEMPLATE,
            MAGASIN_TEMPLATE,
            INTERVENTION_TEMPLATE,
            FACTURE_TEMPLATE,
            FOURNISSEUR_TEMPLATE,
            DECOMPTE_TEMPLATE,
            PACK_TEMPLATE_TEMPLATE,
            REGLE_AUTOMATIQUE_TEMPLATE,
            PARAMETRES_COMMANDES_TEMPLATE
        },
        email: {
            // À venir
        },
        print: {
            // À venir
        }
    };
    
    return templates[type] || {};
}