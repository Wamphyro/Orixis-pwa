// Configuration globale de l'application
export const APP_CONFIG = {
    // Configuration des magasins avec leurs codes d'accès
    magasins: {
        "ADMIN": {
            code: "1988"
        },
        "9AVA": {
            code: "0234"
        },
        "9BEA": {
            code: "5678"
        },
        "9BOM": {
            code: "9012"
        },
        "9CHE": {
            code: "3456"
        },
        "9DIJ": {
            code: "7890"
        },
        "9DIT": {
            code: "2345"
        },
        "9DOL": {
            code: "6789"
        },
        "9KBO": {
            code: "0123"
        },
        "9KNE": {
            code: "4567"
        },
        "9KOV": {
            code: "8901"
        },
        "9MAR": {
            code: "1357"
        },
        "9QUE": {
            code: "2468"
        }
    },
    
    // Durées de session
    session: {
        defaultDuration: 24 * 60 * 60 * 1000,  // 24 heures
        rememberDuration: 30 * 24 * 60 * 60 * 1000  // 30 jours
    },
    
    // Configuration de sécurité
    security: {
        maxLoginAttempts: 3,
        lockoutDuration: 3 * 60 * 1000  // 3 minutes
    },
    
    // Clés de localStorage
    storageKeys: {
        auth: 'sav_auth',
        intervention: 'sav_intervention_data'
    }
};

// Fonction utilitaire pour vérifier si un magasin existe
export function magasinExists(code) {
    return APP_CONFIG.magasins.hasOwnProperty(code);
}

// Fonction utilitaire pour obtenir les infos d'un magasin
export function getMagasinInfo(code) {
    return APP_CONFIG.magasins[code] || null;
}