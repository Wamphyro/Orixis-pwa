// src/js/config/app.config.js
// Configuration globale de l'application Orixis

export const APP_CONFIG = {
    // Informations de l'application
    app: {
        name: 'Orixis',
        version: '1.0.0',
        description: 'Application de gestion SAV',
        author: 'Orixis Team',
        year: 2025
    },
    
    // Configuration du stockage
    storage: {
        prefix: 'orixis_',
        keys: {
            auth: 'orixis_auth',
            intervention: 'orixis_intervention_data',
            settings: 'orixis_settings',
            cache: 'orixis_cache'
        },
        authExpiry: {
            remember: 30 * 24 * 60 * 60 * 1000, // 30 jours
            default: 24 * 60 * 60 * 1000         // 24 heures
        }
    },
    
    // Configuration EmailJS
    emailjs: {
        publicKey: 'wJtv5MrJPzvMuGSyL',
        serviceId: 'service_6juwjvq',
        templates: {
            sav: 'template_51rhrbr',
            confirmation: 'template_confirmation',
            rappel: 'template_rappel'
        }
    },
    
    // Configuration des magasins
    stores: {
        "ADMIN": { code: "1988" },
        "9AVA": { code: "0234" },
        "9BEA": { code: "5678" },
        "9BOM": { code: "9012" },
        "9CHE": { code: "3456" },
        "9DIJ": { code: "7890" },
        "9DIT": { code: "2345" },
        "9DOL": { code: "6789" },
        "9KBO": { code: "0123" },
        "9KNE": { code: "4567" },
        "9KOV": { code: "8901" },
        "9MAR": { code: "1357" },
        "9QUE": { code: "2468" }
    },
    
    // Configuration des contacts SAV
    contacts: {
        sav: [
            {
                name: 'Estelle Boulay',
                role: 'Assistante SAV Audio',
                email: 'boulay@BROKERAUDIOLOGIE88.onmicrosoft.com',
                phone: '+33759578076',
                displayPhone: '07 59 57 80 76'
            },
            {
                name: 'Marie Christine Douare',
                role: 'Assistante SAV Audio',
                email: 'douare@BROKERAUDIOLOGIE88.onmicrosoft.com',
                phone: '+33661761692',
                displayPhone: '06 61 76 16 92'
            }
        ]
    },
    
    // Configuration PWA
    pwa: {
        name: 'Orixis',
        shortName: 'Orixis',
        theme: '#667eea',
        background: '#f5f6fa',
        display: 'standalone',
        orientation: 'portrait',
        cacheName: 'orixis-app-v1'
    },
    
    // URLs et endpoints
    urls: {
        home: '/home.html',
        login: '/index.html',
        intervention: '/fiche-intervention.html',
        signatureClient: '/signature-client.html',
        signatureIntervenant: '/signature-intervenant.html',
        print: '/fiche-impression.html',
        guide: '/guide-sav.html',
        contacts: '/contacts.html'
    },
    
    // Configuration des validations
    validation: {
        phoneRegex: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
        pinLength: 4,
        maxLoginAttempts: 3,
        lockoutDuration: 3 * 60 * 1000 // 3 minutes
    },
    
    // Messages de l'application
    messages: {
        errors: {
            authRequired: 'Authentification requise',
            invalidPin: 'Code incorrect',
            invalidStore: 'Magasin invalide',
            networkError: 'Erreur réseau',
            formInvalid: 'Veuillez remplir tous les champs obligatoires'
        },
        success: {
            loginSuccess: 'Connexion réussie',
            interventionSaved: 'Intervention enregistrée',
            emailSent: 'Email envoyé avec succès',
            signatureSaved: 'Signature enregistrée'
        },
        confirmations: {
            logout: 'Voulez-vous vraiment vous déconnecter ?',
            resetForm: 'Êtes-vous sûr de vouloir effacer tous les champs ?',
            sendSAV: 'Confirmer l\'envoi de l\'escalade SAV aux assistantes ?',
            signatureValid: 'La signature est-elle complète et valide ?'
        }
    }
};

// Fonction helper pour obtenir une clé de stockage
export function getStorageKey(key) {
    return APP_CONFIG.storage.keys[key] || `${APP_CONFIG.storage.prefix}${key}`;
}

// Fonction helper pour obtenir un message
export function getMessage(type, key) {
    return APP_CONFIG.messages[type]?.[key] || key;
}

// Export par défaut
export default APP_CONFIG;