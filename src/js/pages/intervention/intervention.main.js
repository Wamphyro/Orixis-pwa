// ========================================
// INTERVENTION.MAIN.JS - Point d'entrée principal
// Chemin: src/js/pages/intervention/intervention.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module intervention
// Gère l'initialisation et l'orchestration des sous-modules
// ========================================

import { initFirebase } from '../../services/firebase.service.js';
import { AppHeader, ModalManager, Dialog, notify } from '../../shared/index.js';

// Import des sous-modules intervention
import { initListeInterventions, chargerDonnees, resetFiltres } from './intervention.list.js';
import { initCreationIntervention, ouvrirNouvelleIntervention, etapePrecedente, etapeSuivante, validerIntervention, changerClient } from './intervention.create.js';
import { voirDetailIntervention, demarrerIntervention, terminerIntervention, annulerIntervention, editerResultat, annulerEditionResultat, sauvegarderResultat, envoyerSAVDetail, imprimerIntervention } from './intervention.detail.js';

// ========================================
// ÉTAT GLOBAL DU MODULE
// ========================================

export const state = {
    interventionsData: [],
    filtres: {
        recherche: '',
        magasin: '',
        periode: 'all',
        statut: '',
        resultat: '',
        statuts: []  // Pour les cartes de stats
    },
    currentPage: 1,
    itemsPerPage: 20
};

// ========================================
// INITIALISATION DU MODULE
// ========================================

// Vérifier l'authentification
function checkAuth() {
    const auth = localStorage.getItem('sav_auth');
    if (!auth) return false;
    
    const authData = JSON.parse(auth);
    const now = Date.now();
    
    if (now - authData.timestamp > authData.expiry) {
        localStorage.removeItem('sav_auth');
        return false;
    }
    
    return authData.authenticated;
}

// Initialisation au chargement
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🔧 Initialisation module interventions...');
    
    try {
        // 1. Vérifier l'authentification
        if (!checkAuth()) {
            window.location.href = '../index.html';
            return;
        }
        
        // 2. Initialiser Firebase
        await initFirebase();
        
        // 3. Initialiser le header
        new AppHeader();
        
        // 4. Initialiser le gestionnaire de modals
        window.modalManager = new ModalManager();
        
        // 5. Initialiser les sous-modules
        await initListeInterventions();
        initCreationIntervention();
        
        // 6. Charger les données
        await chargerDonnees();
        
        console.log('✅ Module interventions prêt');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        notify.error('Erreur lors du chargement de la page');
    }
});

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

export function afficherSucces(message) {
    notify.success(message);
}

export function afficherErreur(message) {
    notify.error(message);
}

export function ouvrirModal(modalId) {
    if (window.modalManager) {
        window.modalManager.open(modalId);
    }
}

export function fermerModal(modalId) {
    if (window.modalManager) {
        window.modalManager.close(modalId);
    }
}

// ========================================
// EXPOSITION DES FONCTIONS GLOBALES
// ========================================

// Fonctions pour les onclick HTML - Liste
window.ouvrirNouvelleIntervention = ouvrirNouvelleIntervention;
window.voirDetailIntervention = voirDetailIntervention;
window.resetFiltres = resetFiltres;

// Fonctions pour le modal création
window.etapePrecedente = etapePrecedente;
window.etapeSuivante = etapeSuivante;
window.validerIntervention = validerIntervention;
window.changerClient = changerClient;

// Fonctions pour le modal détail
window.demarrerIntervention = demarrerIntervention;
window.terminerIntervention = terminerIntervention;
window.annulerIntervention = annulerIntervention;
window.editerResultat = editerResultat;
window.annulerEditionResultat = annulerEditionResultat;
window.sauvegarderResultat = sauvegarderResultat;
window.envoyerSAVDetail = envoyerSAVDetail;
window.imprimerIntervention = imprimerIntervention;