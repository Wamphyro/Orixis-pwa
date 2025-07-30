// ========================================
// COMMANDES.MAIN.JS - Point d'entrée principal (VERSION CORRIGÉE)
// Chemin: src/js/pages/commandes/commandes.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module commandes
// Modifié le 28/01/2025 : Suppression des imports rechercherClient/rechercherProduit
//
// STRUCTURE:
// 1. Imports (lignes 15-36)
// 2. Variables globales (lignes 38-50)
// 3. Initialisation (lignes 52-130)
// 4. Gestion des modales (lignes 132-200)
// 5. Exposition des fonctions (lignes 202-251)
// 6. Utilitaires (lignes 253-300)
// ========================================

import { initFirebase } from '../../services/firebase.service.js';
import { modalManager, confirmerAction, Dialog, notify } from '../../shared/index.js';
import { 
    initListeCommandes, 
    chargerDonnees, 
    filtrerCommandes, 
    resetFiltres
} from './commandes.list.js';
import { 
    initCreationCommande,
    ouvrirNouvelleCommande,
    selectionnerClient,
    changerClient,
    ouvrirNouveauClient,
    creerNouveauClient,
    appliquerPack,
    ajouterProduit,
    retirerProduit,
    etapePrecedente,
    etapeSuivante,
    validerCommande,
    selectionnerCote,
    annulerSelectionCote
} from './commandes.create.js';
import { 
    voirDetailCommande, 
    changerStatutCommande 
} from './commandes.detail.js';
import './commandes.serial.js'; // Import du module de gestion des NS

// ========================================
// VARIABLES GLOBALES (partagées entre modules)
// ========================================

export const state = {
    commandesData: [],
    currentPage: 1,
    itemsPerPage: 20,
    filtres: {
        recherche: '',
        statut: '',
        periode: 'all',
        urgence: ''
    }
};

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
window.addEventListener('load', async () => {
    if (!checkAuth()) {
        window.location.href = '../../index.html';
        return;
    }
    
    // Afficher les infos utilisateur
    afficherInfosUtilisateur();
    
    // Initialiser Firebase
    await initFirebase();
    
    // Initialiser les modales
    initModales();
    
    // HACK: Retirer TOUS les event listeners du modal component
    setTimeout(() => {
        const modal = modalManager.get('modalNouvelleCommande');
        if (modal && modal.closeButton) {
            // Cloner le bouton pour retirer TOUS les event listeners
            const oldButton = modal.closeButton;
            const newButton = oldButton.cloneNode(true);
            oldButton.parentNode.replaceChild(newButton, oldButton);
            
            // Ajouter notre propre handler
            newButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                modalManager.close('modalNouvelleCommande');
            });
            
            // Mettre à jour la référence
            modal.closeButton = newButton;
        }
    }, 500);
    
    // Initialiser les modules
    await initListeCommandes();
    initCreationCommande();
    
    // Charger les données initiales
    await chargerDonnees();
    
    // Activer les animations après le chargement
    document.body.classList.add('page-loaded');
    
    // Initialiser les événements
    initEventListeners();
});

// ========================================
// GESTION DES MODALES
// ========================================

function initModales() {
    // Modal nouvelle commande
    modalManager.register('modalNouvelleCommande', {
        closeOnOverlayClick: false,
        closeOnEscape: true,
        onBeforeClose: async () => {
            // Si on est en train d'ouvrir une autre modal, ne pas demander confirmation
            if (window.skipConfirmation) {
                window.skipConfirmation = false;
                return true;
            }
            
            const { nouvelleCommande } = window.commandeCreateState || {};
            if (nouvelleCommande && (nouvelleCommande.produits.length > 0 || nouvelleCommande.clientId)) {
                return await Dialog.confirm('Voulez-vous vraiment fermer ? Les données non sauvegardées seront perdues.');
            }
            return true;
        },
        onClose: () => {
            // Réinitialiser le formulaire via le module create
            if (window.resetNouvelleCommande) {
                window.resetNouvelleCommande();
            }
        }
    });
    
    // Modal détail commande
    modalManager.register('modalDetailCommande', {
        closeOnOverlayClick: false,
        closeOnEscape: true
    });
    
    // Modal nouveau client
    modalManager.register('modalNouveauClient', {
        closeOnOverlayClick: false,
        closeOnEscape: true,
        onClose: () => {
            const formClient = document.getElementById('formNouveauClient');
            if (formClient) formClient.reset();
            
            // Rouvrir la modal de nouvelle commande
            setTimeout(() => {
                modalManager.open('modalNouvelleCommande');
            }, 300);
        }
    });
}

// ========================================
// AFFICHAGE DES INFOS UTILISATEUR
// ========================================

function afficherInfosUtilisateur() {
    const auth = JSON.parse(localStorage.getItem('sav_auth'));
    if (auth && auth.collaborateur) {
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = `${auth.collaborateur.prenom} ${auth.collaborateur.nom}`;
        }
    }
}

// ========================================
// EXPOSITION DES FONCTIONS GLOBALES
// ========================================

// Exposer modalManager globalement pour les autres modules
window.modalManager = modalManager;

// Toutes les fonctions utilisées dans le HTML avec onclick
window.ouvrirNouvelleCommande = ouvrirNouvelleCommande;
// Dans commandes.main.js, les window.XXX restent mais pointent vers les nouvelles fonctions
window.filtrerCommandes = () => {
    console.log('Filtrage géré automatiquement par DataTableFilters');
};
window.resetFiltres = resetFiltres; // Pointe vers la fonction de commandes.list.js
window.selectionnerClient = selectionnerClient;
window.changerClient = changerClient;
window.ouvrirNouveauClient = ouvrirNouveauClient;
window.creerNouveauClient = creerNouveauClient;
window.appliquerPack = appliquerPack;
window.ajouterProduit = ajouterProduit;
window.retirerProduit = retirerProduit;
window.etapePrecedente = etapePrecedente;
window.etapeSuivante = etapeSuivante;
window.validerCommande = validerCommande;
window.voirDetailCommande = voirDetailCommande;
window.changerStatutCommande = changerStatutCommande;
window.fermerModal = fermerModal;
window.logout = logout;
window.selectionnerCote = selectionnerCote;
window.annulerSelectionCote = annulerSelectionCote;

// ========================================
// NOUVELLE EXPOSITION : supprimerCommande
// Ajoutée le 27/07/2025
// Note: La fonction est définie dans commandes.detail.js
// ========================================
// window.supprimerCommande est définie dans commandes.detail.js

// ========================================
// UTILITAIRES GLOBAUX
// ========================================

function fermerModal(modalId) {
    modalManager.close(modalId);
}

async function logout() {
    const confirme = await confirmerAction({
        titre: 'Déconnexion',
        message: 'Voulez-vous vraiment vous déconnecter ?',
        boutonConfirmer: 'Déconnexion',
        boutonAnnuler: 'Annuler',
        danger: true
    });
    
    if (confirme) {
        localStorage.removeItem('sav_auth');
        localStorage.removeItem('sav_user_permissions');
        window.location.href = '../../index.html';
    }
}

// ========================================
// EVENT LISTENERS
// ========================================

function initEventListeners() {
    // Écouter les changements d'urgence pour mettre à jour la date
    const urgenceInputs = document.querySelectorAll('input[name="urgence"]');
    urgenceInputs.forEach(input => {
        input.addEventListener('change', () => {
            // Appeler la fonction du module create
            if (window.setDateLivraisonDefaut) {
                window.setDateLivraisonDefaut();
            }
        });
    });
}

// Cleanup au déchargement de la page
window.addEventListener('beforeunload', () => {
    modalManager.destroyAll();
});

// ========================================
// FONCTIONS UTILITAIRES EXPORTÉES
// ========================================

export function ouvrirModal(modalId) {
    modalManager.open(modalId);
}

export function afficherSucces(message) {
    notify.success(message);
}

export function afficherErreur(message) {
    notify.error(message);
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [28/01/2025] - Suppression des imports rechercherClient/rechercherProduit
   Modification: Ces fonctions ont été remplacées par SearchDropdown
   Impact: Plus besoin de les importer ni de les exposer globalement
   
   [27/07/2025] - Ajout de la fonction supprimerCommande
   Modification: Exposition de la fonction window.supprimerCommande
   Raison: Permettre la suppression sécurisée depuis le tableau
   Impact: La fonction est définie dans commandes.detail.js
   
   [27/07/2025] - Import du module serial
   Modification: Ajout de l'import './commandes.serial.js'
   Raison: Gestion des numéros de série
   
   NOTES POUR REPRISES FUTURES:
   - rechercherClient/rechercherProduit ont été remplacées par SearchDropdown
   - supprimerCommande est définie dans detail.js, pas ici
   - Elle nécessite une validation nom/prénom
   - Elle change le statut en "supprime" (soft delete)
   - Le module serial est importé pour side-effects
   ======================================== */