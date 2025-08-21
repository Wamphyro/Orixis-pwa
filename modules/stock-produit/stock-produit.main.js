// ========================================
// STOCK-PVT.MAIN.JS - Point d'entrée et utilitaires
// Chemin: modules/stock-pvt/stock-pvt.main.js
//
// DESCRIPTION:
// Fonctions utilitaires et gestion des messages
// Point d'entrée pour l'initialisation du module
//
// VERSION: 1.0.0
// DATE: 03/02/2025
// ========================================

import { initImportStock, ouvrirModalImport } from './stock-produit.create.js';

// ========================================
// GESTION DES MESSAGES
// ========================================

/**
 * Afficher un message de succès
 */
export function afficherSucces(message) {
    console.log('✅', message);
    
    // Utiliser le toast si disponible
    if (window.toast) {
        window.toast.success(message);
        return;
    }
    
    // Sinon affichage basique
    const container = document.getElementById('messagesContainer');
    if (container) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            <strong>✅ Succès!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        container.appendChild(alert);
        
        // Auto-fermeture après 5 secondes
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

/**
 * Afficher un message d'erreur
 */
export function afficherErreur(message) {
    console.error('❌', message);
    
    // Utiliser le toast si disponible
    if (window.toast) {
        window.toast.error(message);
        return;
    }
    
    // Sinon affichage basique
    const container = document.getElementById('messagesContainer');
    if (container) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-danger alert-dismissible fade show';
        alert.innerHTML = `
            <strong>❌ Erreur!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        container.appendChild(alert);
        
        // Auto-fermeture après 7 secondes
        setTimeout(() => {
            alert.remove();
        }, 7000);
    }
}

/**
 * Afficher un message d'avertissement
 */
export function afficherAvertissement(message) {
    console.warn('⚠️', message);
    
    // Utiliser le toast si disponible
    if (window.toast) {
        window.toast.warning(message);
        return;
    }
    
    // Sinon affichage basique
    const container = document.getElementById('messagesContainer');
    if (container) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-warning alert-dismissible fade show';
        alert.innerHTML = `
            <strong>⚠️ Attention!</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        container.appendChild(alert);
        
        // Auto-fermeture après 5 secondes
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

/**
 * Afficher un message d'information
 */
export function afficherInfo(message) {
    console.info('ℹ️', message);
    
    // Utiliser le toast si disponible
    if (window.toast) {
        window.toast.info(message);
        return;
    }
    
    // Sinon affichage basique
    const container = document.getElementById('messagesContainer');
    if (container) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-info alert-dismissible fade show';
        alert.innerHTML = `
            <strong>ℹ️ Info</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        container.appendChild(alert);
        
        // Auto-fermeture après 5 secondes
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }
}

// ========================================
// INITIALISATION MODULE
// ========================================

/**
 * Initialiser le module Stock PVT
 */
export function initStockPVT() {
    console.log('🎯 Initialisation module Stock PVT');
    
    // Initialiser le module d'import
    initImportStock();
    
    // Exposer les fonctions globales
    window.ouvrirModalImportStock = ouvrirModalImport;
    window.afficherSucces = afficherSucces;
    window.afficherErreur = afficherErreur;
    window.afficherAvertissement = afficherAvertissement;
    window.afficherInfo = afficherInfo;
    
    // Gestion des modales si modalManager existe
    if (!window.modalManager) {
        window.modalManager = {
            open: (id) => {
                const modal = document.getElementById(id);
                if (modal) {
                    modal.style.display = 'block';
                    modal.classList.add('show');
                    document.body.classList.add('modal-open');
                }
            },
            close: (id) => {
                const modal = document.getElementById(id);
                if (modal) {
                    modal.style.display = 'none';
                    modal.classList.remove('show');
                    document.body.classList.remove('modal-open');
                }
            }
        };
    }
    
    window.fermerModal = window.modalManager.close;
    
    console.log('✅ Module Stock PVT prêt');
}

// ========================================
// AUTO-INIT SI CHARGÉ DIRECTEMENT
// ========================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStockPVT);
} else {
    initStockPVT();
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    initStockPVT,
    afficherSucces,
    afficherErreur,
    afficherAvertissement,
    afficherInfo
};