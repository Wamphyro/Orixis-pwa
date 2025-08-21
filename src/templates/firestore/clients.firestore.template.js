// ========================================
// TEMPLATE FIRESTORE - CLIENTS
// Collection: clients
// ========================================

export const CLIENT_TEMPLATE = {
    // Informations personnelles
    nom: null,                      // String
    prenom: null,                   // String
    email: null,                    // String
    telephone: null,                // String  
    telephoneFixe: null,            // String
    
    // Statut
    actif: true,                    // boolean
    
    // Relations
    magasinReference: null,         // String - Code magasin (ex: "9PAR")
    equipements: [],                // Array<Object> - Liste des équipements
    
    // Métadonnées
    dateCreation: null,             // Timestamp - serverTimestamp()
    derniereModification: null      // Timestamp - serverTimestamp()
};

export const CLIENT_RULES = {
    required: ['nom', 'prenom', 'telephone', 'magasinReference', 'actif'],
    unique: ['email'],
    indexed: ['magasinReference', 'actif', 'email']
};