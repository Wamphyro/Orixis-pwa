// ========================================
// COMMANDES.MAIN.JS - Point d'entrée principal (VERSION COMPLÈTE)
// ========================================

import { initFirebase } from '../../services/firebase.service.js';
import { modalManager, confirmerAction, Dialog, notify } from '../../shared/index.js';
import { 
    initListeCommandes, 
    chargerDonnees, 
    filtrerCommandes, 
    resetFiltres,
    pagePrecedente,
    pageSuivante 
} from './commandes.list.js';
import { 
    initCreationCommande,
    ouvrirNouvelleCommande,
    rechercherClient,
    selectionnerClient,
    changerClient,
    ouvrirNouveauClient,
    creerNouveauClient,
    appliquerPack,
    rechercherProduit,
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
    
    // Initialiser les modules
    await initListeCommandes();
    initCreationCommande();
    
    // Charger les données initiales
    await chargerDonnees();
    
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
    
    // Modal sélection côté (si elle existe dans le HTML)
    if (document.getElementById('modalSelectionCote')) {
        modalManager.register('modalSelectionCote', {
            closeOnOverlayClick: false,
            closeOnEscape: false  // Forcer la sélection
        });
    }
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
window.filtrerCommandes = filtrerCommandes;
window.resetFiltres = resetFiltres;
window.pagePrecedente = pagePrecedente;
window.pageSuivante = pageSuivante;
window.rechercherClient = rechercherClient;
window.selectionnerClient = selectionnerClient;
window.changerClient = changerClient;
window.ouvrirNouveauClient = ouvrirNouveauClient;
window.creerNouveauClient = creerNouveauClient;
window.appliquerPack = appliquerPack;
window.rechercherProduit = rechercherProduit;
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
    
    // Fermer les résultats de recherche en cliquant ailleurs
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.client-search') && !e.target.closest('.product-search')) {
            document.querySelectorAll('.search-results').forEach(results => {
                results.classList.remove('active');
            });
        }
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