// ========================================
// SUBVENTIONS.CONFIG.JS - Configuration corrigée
// Chemin: modules/subventions/core/subventions.config.js
// ========================================

// ✅ IMPORT DIRECT - Plus d'index.js !
import { AppHeader } from '../../../src/components/ui/app-header/app-header.component.js';

export function createSubventionsHeader(userData) {
    return new AppHeader({
        container: 'body',
        title: '📋 Gestion des Subventions',
        subtitle: 'Suivi MDPH et AGEFIPH',
        backUrl: window.location.origin + '/Orixis-pwa/modules/home/home.html',
        user: userData,
        buttonClasses: {
            back: 'btn on-dark btn-pill',
            logout: 'btn btn-danger btn-sm text-white',
            userSection: 'header-user-section'
        },
        onLogout: async () => {
            localStorage.removeItem('sav_auth');
            window.location.href = '../../../index.html';
        }
    });
}

// Ajouter les factories pour les autres composants
export const factories = {
    Modal: (config) => {
        console.log('Modal factory appelée avec:', config);
        // Pour l'instant, on retourne un mock
        return {
            open: () => console.log('Modal ouverte'),
            close: () => console.log('Modal fermée')
        };
    },
    Dialog: (config) => {
        console.log('Dialog factory appelée avec:', config);
        return {
            open: () => console.log('Dialog ouverte'),
            close: () => console.log('Dialog fermée')
        };
    },
    Toast: (config) => {
        console.log('Toast affiché:', config.message);
        return {
            show: () => console.log('Toast visible'),
            hide: () => console.log('Toast caché')
        };
    },
    SearchDropdown: (config) => {
        console.log('SearchDropdown créé');
        return {
            getInput: () => document.createElement('input')
        };
    },
    ProgressTimeline: (config) => {
        console.log('ProgressTimeline créé');
        return {};
    },
    ProgressOverview: (config) => {
        console.log('ProgressOverview créé');
        return {};
    },
    DelayTracker: (config) => {
        console.log('DelayTracker créé');
        return {};
    }
};

// Ajouter les helpers
export const helpers = {
    formatMontant: (centimes) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(centimes / 100);
    },
    generateAccessCode: (nom, annee) => {
        return `${nom.substring(0, 3).toUpperCase()}-${annee}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    }
};

// Ajouter la configuration métier
export const business = {
    montantAppareilDefaut: 350000, // en centimes (3500€)
    alertes: {
        abandonDossier: 30,
        relanceDocuments: 15,
        attestationAvantExpiration: 5,
        recepisseMDPHAvant: 10
    },
    validite: {
        attestationEmployeur: 30 // jours
    },
    formats: {
        documents: ['.pdf', '.jpg', '.jpeg', '.png'],
        maxSize: 10 * 1024 * 1024, // 10 MB
        maxFiles: 10
    }
};

// Ajouter les options de formulaires
export const forms = {
    options: {
        situation: [
            { value: 'salarie', label: 'Salarié' },
            { value: 'independant', label: 'Indépendant / Profession libérale' },
            { value: 'demandeur_emploi', label: 'Demandeur d\'emploi' },
            { value: 'etudiant', label: 'Étudiant' },
            { value: 'retraite', label: 'Retraité' },
            { value: 'fonctionnaire', label: 'Fonctionnaire' }
        ]
    }
};

export default {
    createSubventionsHeader,
    factories,
    helpers,
    business,
    forms
};