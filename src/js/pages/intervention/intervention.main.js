// ========================================
// INTERVENTION.MAIN.JS - Point d'entrée principal (VERSION CORRIGÉE)
// Chemin: src/js/pages/intervention/intervention.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module intervention
// Gère l'initialisation et l'orchestration des sous-modules
//
// STRUCTURE:
// 1. Imports et configuration
// 2. État global du module
// 3. Initialisation
// 4. Exposition des fonctions globales
// ========================================

import { initFirebase } from '../../services/firebase.service.js';
import { AppHeader, ModalManager, Dialog, notify } from '../../shared/index.js';

// Import des sous-modules intervention
import { initListeInterventions, chargerDonnees, resetFiltres } from './intervention.list.js';
import { initCreationIntervention, ouvrirNouvelleIntervention } from './intervention.create.js';
import { voirDetailIntervention } from './intervention.detail.js';

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

// Fonctions pour les onclick HTML
window.ouvrirNouvelleIntervention = ouvrirNouvelleIntervention;
window.voirDetailIntervention = voirDetailIntervention;
window.resetFiltres = resetFiltres;

// Fonctions depuis intervention.create.js
window.etapePrecedente = () => window.interventionCreateModule?.etapePrecedente();
window.etapeSuivante = () => window.interventionCreateModule?.etapeSuivante();
window.validerIntervention = () => window.interventionCreateModule?.validerIntervention();
window.changerClient = () => window.interventionCreateModule?.changerClient();

// Fonctions depuis intervention.detail.js
window.demarrerIntervention = (id) => window.interventionDetailModule?.demarrerIntervention(id);
window.terminerIntervention = (id) => window.interventionDetailModule?.terminerIntervention(id);
window.annulerIntervention = (id) => window.interventionDetailModule?.annulerIntervention(id);
window.editerResultat = () => window.interventionDetailModule?.editerResultat();
window.annulerEditionResultat = () => window.interventionDetailModule?.annulerEditionResultat();
window.sauvegarderResultat = () => window.interventionDetailModule?.sauvegarderResultat();
window.envoyerSAVDetail = (id) => window.interventionDetailModule?.envoyerSAVDetail(id);
window.imprimerIntervention = (id) => window.interventionDetailModule?.imprimerIntervention(id);

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [02/02/2025] - Refonte complète
   - Migration vers architecture modulaire
   - Suppression des imports form.js et client.js
   - Ajout du ModalManager
   - Exposition correcte des fonctions globales
   
   NOTES POUR REPRISES FUTURES:
   - L'architecture suit maintenant le modèle commandes
   - Les anciens fichiers form.js et client.js sont obsolètes
   - Tous les modules utilisent le ModalManager partagé
   ======================================== */