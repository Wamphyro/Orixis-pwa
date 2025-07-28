// ========================================
// INTERVENTION.MAIN.JS - Point d'entrée principal
// Chemin: src/js/pages/intervention/intervention.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module intervention
// Coordonne les différents modules
//
// STRUCTURE:
// 1. Imports
// 2. Initialisation
// 3. Exposition des fonctions globales
// ========================================

import { initFirebase } from '../../services/firebase.service.js';
import { Dialog, notify } from '../../shared/index.js';
import { initClientSearch, getClientSelectionne } from './intervention.client.js';
import { initFormHandlers, resetForm, envoyerSAV } from './intervention.form.js';

// ========================================
// INITIALISATION
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
    console.log('🔧 Initialisation module intervention');
    
    // Vérifier l'authentification
    if (!checkAuth()) {
        window.location.href = '../index.html';
        return;
    }
    
    // Initialiser Firebase
    await initFirebase();
    
    // Initialiser la date et l'heure
    initDateHeure();
    
    // Initialiser les modules
    await initClientSearch();
    initFormHandlers();
    
    console.log('✅ Module intervention prêt');
});

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function initDateHeure() {
    const now = new Date();
    const dateInput = document.getElementById('date');
    const heureInput = document.getElementById('heure');
    
    if (dateInput) {
        dateInput.value = now.toISOString().split('T')[0];
        dateInput.readOnly = true;
        dateInput.style.backgroundColor = '#f8f9fa';
        dateInput.style.cursor = 'not-allowed';
        dateInput.style.opacity = '0.8';
        
        // Désactiver aussi le clic (pour mobile)
        dateInput.addEventListener('click', (e) => e.preventDefault());
        dateInput.addEventListener('touchstart', (e) => e.preventDefault());
    }
    
    if (heureInput) {
        heureInput.value = now.toTimeString().slice(0, 5);
        heureInput.readOnly = true;
        heureInput.style.backgroundColor = '#f8f9fa';
        heureInput.style.cursor = 'not-allowed';
        heureInput.style.opacity = '0.8';
        
        // Désactiver aussi le clic (pour mobile)
        heureInput.addEventListener('click', (e) => e.preventDefault());
        heureInput.addEventListener('touchstart', (e) => e.preventDefault());
    }
}

// ========================================
// EXPOSITION DES FONCTIONS GLOBALES
// ========================================

// Exposer les fonctions pour les onclick HTML
window.resetForm = resetForm;
window.envoyerSAV = envoyerSAV;

// ========================================
// HISTORIQUE DES DIFFICULTÉS
//
// [28/01/2025] - Création du module
// - Architecture modulaire similaire à commandes
// - Séparation des responsabilités
//
// NOTES POUR REPRISES FUTURES:
// - checkAuth est dupliqué, pourrait être dans shared
// - initDateHeure pourrait être dans intervention.form.js
// ========================================