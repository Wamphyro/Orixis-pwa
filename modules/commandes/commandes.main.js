// ========================================
// COMMANDES.MAIN.JS - Point d'entrée principal (VERSION AVEC APPHEADER)
// Chemin: modules/commandes/commandes.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module commandes
// Modifié le 02/02/2025 : Suppression de la gestion des StatsCards (déléguée à list.js)
//
// ARCHITECTURE:
// - commandes.main.js : Gère l'initialisation, l'auth et le header
// - commandes.list.js : Orchestre DataTable, Filtres ET StatsCards
// - commandes.create.js : Gère la création
// - commandes.detail.js : Gère le détail
// ========================================

import { initFirebase } from '../../src/services/firebase.service.js';
import { confirmerAction } from '../../src/components/index.js';
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
import config from './commandes.config.js';
import { modalManager } from '../../src/components/index.js';


// ========================================
// VARIABLES GLOBALES (partagées entre modules)
// ========================================

export const state = {
    commandesData: [],
    currentPage: 1,
    itemsPerPage: 20,
    filtres: {
        recherche: '',
        magasin: '',
        periode: 'all',
        urgence: '',
        statuts: []  // Array pour filtrage multi-statuts
    }
};

// Variable pour le composant UI header
let appHeader = null;

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

// Obtenir les données utilisateur
function getUserData() {
    const auth = JSON.parse(localStorage.getItem('sav_auth'));
    if (auth && auth.collaborateur) {
        let storeName = '';
        
        // 1. D'abord chercher dans auth.magasin (niveau principal)
        if (auth.magasin) {
            storeName = auth.magasin;
        }
        // 2. Puis essayer dans collaborateur si pas trouvé
        else if (auth.collaborateur.magasin) {
            storeName = auth.collaborateur.magasin;
        } else if (auth.collaborateur.magasin_nom) {
            storeName = auth.collaborateur.magasin_nom;
        } else if (auth.collaborateur.store) {
            storeName = auth.collaborateur.store;
        } else if (auth.collaborateur.agence) {
            storeName = auth.collaborateur.agence;
        } else {
            // Valeur par défaut si vraiment aucun magasin trouvé
            storeName = 'NON_DEFINI';
        }
        
        let formattedStore = '';
        
        // Si c'est un code magasin (format 9XXX), on peut le garder tel quel ou le formater
        if (/^9[A-Z]{3}$/.test(storeName)) {
            formattedStore = storeName;
        } 
        // Si c'est déjà formaté ou un nom complet
        else if (storeName.startsWith('Magasin')) {
            formattedStore = storeName;
        }
        // Sinon, ajouter "Magasin" devant
        else {
            formattedStore = `Magasin ${storeName}`;
        }
        
        return {
            name: `${auth.collaborateur.prenom} ${auth.collaborateur.nom}`,
            store: formattedStore,
            showLogout: true
        };
    }
    
    // Fallback si pas d'auth
    return {
        name: 'Utilisateur',
        store: 'Magasin non défini',
        showLogout: true
    };
}

// Initialiser les composants UI
async function initUIComponents() {
    try {
        // Récupérer les données utilisateur avec magasin
        const userData = getUserData();
        
        // 1. Créer le header d'application avec la config locale
        appHeader = config.createCommandesHeader(userData);
        
        // 2. Les stats cards sont maintenant créées et gérées par commandes.list.js
        // selon la nouvelle architecture où l'orchestrateur contrôle toute l'UI
        console.log('📊 Stats cards seront initialisées par commandes.list.js');
        
        console.log('🎨 Composants UI initialisés avec magasin:', userData.store);
        
    } catch (error) {
        console.error('❌ Erreur initialisation UI:', error);
        config.notify.error('Erreur lors de l\'initialisation de l\'interface');
    }
}

// Initialisation au chargement
window.addEventListener('load', async () => {
    if (!checkAuth()) {
        window.location.href = '../../index.html';
        return;
    }
    
    try {
        // 1. Initialiser les composants UI en premier
        await initUIComponents();
        
        // 2. Initialiser Firebase
        await initFirebase();
        
        // 3. Initialiser les modales
        initModales();
        
        // 4. HACK: Retirer TOUS les event listeners du modal component
        setTimeout(() => {
            const modal = config.modalManager.get('modalNouvelleCommande');
            if (modal && modal.closeButton) {
                // Cloner le bouton pour retirer TOUS les event listeners
                const oldButton = modal.closeButton;
                const newButton = oldButton.cloneNode(true);
                oldButton.parentNode.replaceChild(newButton, oldButton);
                
                // Ajouter notre propre handler
                newButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    config.modalManager.close('modalNouvelleCommande');
                });
                
                // Mettre à jour la référence
                modal.closeButton = newButton;
            }
        }, 500);
        
        // 5. Initialiser les modules
        await initListeCommandes();
        initCreationCommande();
        
        // 6. Charger les données initiales
        await chargerDonnees();
        
        // 7. Activer les animations après le chargement
        document.body.classList.add('page-loaded');
        
        // 8. Initialiser les événements
        initEventListeners();
        
        console.log('✅ Page commandes initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        config.notify.error('Erreur lors du chargement de la page');
    }
});

// ========================================
// GESTION DES MODALES
// ========================================

function initModales() {
    // Enregistrer toutes les modales via la config
    config.registerCommandesModals();
    
    // Vérifier que les modals existent avant de les utiliser
    const modalIds = ['modalNouvelleCommande', 'modalDetailCommande', 'modalNouveauClient', 'modalNumerosSerie'];
    
    modalIds.forEach(modalId => {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) {
            console.warn(`⚠️ Modal HTML "${modalId}" non trouvé dans le DOM`);
        }
    });
    
    // Ajouter les callbacks spécifiques pour la modal nouvelle commande
    const modalNouvelleCommande = modalManager.get('modalNouvelleCommande');
    if (modalNouvelleCommande) {
        modalNouvelleCommande.options = {
            ...modalNouvelleCommande.options,
            onBeforeClose: async () => {
                // Si on est en train d'ouvrir une autre modal, ne pas demander confirmation
                if (window.skipConfirmation) {
                    window.skipConfirmation = false;
                    return true;
                }
                
                const { nouvelleCommande } = window.commandeCreateState || {};
                if (nouvelleCommande && (nouvelleCommande.produits.length > 0 || nouvelleCommande.clientId)) {
                    return await config.Dialog.confirm('Voulez-vous vraiment fermer ? Les données non sauvegardées seront perdues.');
                }
                return true;
            },
            onClose: () => {
                // Réinitialiser le formulaire via le module create
                if (window.resetNouvelleCommande) {
                    window.resetNouvelleCommande();
                }
            }
        };
    }
    
    // Ajouter les callbacks spécifiques pour la modal nouveau client
    const modalNouveauClient = config.modalManager.get('modalNouveauClient');
    if (modalNouveauClient) {
        modalNouveauClient.options = {
            ...modalNouveauClient.options,
            onClose: () => {
                const formClient = document.getElementById('formNouveauClient');
                if (formClient) formClient.reset();
                
                // Rouvrir la modal de nouvelle commande
                setTimeout(() => {
                    config.modalManager.open('modalNouvelleCommande');
                }, 300);
            }
        };
    }
}

// ========================================
// GESTION UTILISATEUR
// ========================================

// Fonction de déconnexion pour le header
async function handleLogout() {
    try {
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
            
            // Notification de déconnexion
            config.notify.success('Déconnexion réussie');
            
            // Redirection
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 1000);
        }
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        config.notify.error('Erreur lors de la déconnexion');
    }
}

// Mise à jour des informations utilisateur (si changement de magasin par exemple)
export function updateUserInfo() {
    if (appHeader) {
        const userData = getUserData();
        appHeader.setUser(userData);
        console.log('🔄 Informations utilisateur mises à jour:', userData);
    }
}

// ========================================
// EXPOSITION DES FONCTIONS GLOBALES
// ========================================

// Exposer modalManager globalement pour les autres modules
window.modalManager = config.modalManager;

// Exposer les composants UI pour les autres modules
window.appHeader = () => appHeader;
window.updateUserInfo = updateUserInfo;

// Toutes les fonctions utilisées dans le HTML avec onclick
window.ouvrirNouvelleCommande = ouvrirNouvelleCommande;
window.filtrerCommandes = () => {
    console.log('Filtrage géré automatiquement par DataTableFilters');
};
window.resetFiltres = resetFiltres;
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
window.logout = handleLogout;
window.selectionnerCote = selectionnerCote;
window.annulerSelectionCote = annulerSelectionCote;
// Exposer chargerDonnees globalement pour le module create
window.chargerDonnees = chargerDonnees;

// ========================================
// UTILITAIRES GLOBAUX
// ========================================

function fermerModal(modalId) {
    config.modalManager.close(modalId);
}

// Fonction logout legacy (pour compatibilité)
async function logout() {
    await handleLogout();
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
    config.modalManager.destroyAll();
    
    // Cleanup du composant header
    if (appHeader) {
        appHeader.destroy();
    }
});

// ========================================
// FONCTIONS UTILITAIRES EXPORTÉES
// ========================================

export function ouvrirModal(modalId) {
    config.modalManager.open(modalId);
}

export function afficherSucces(message) {
    config.notify.success(message);
}

export function afficherErreur(message) {
    config.notify.error(message);
}

// Getter pour le composant header (pour les autres modules)
export function getAppHeader() {
    return appHeader;
}

// Getter pour les données utilisateur actuelles
export function getCurrentUser() {
    return getUserData();
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [02/02/2025] - Suppression complète de la gestion des StatsCards
   Modification:
   - Suppression de l'import genererConfigStatsCards (n'existe plus)
   - Suppression de la variable statsCards
   - Suppression de updateStats() (gérée par list.js)
   - Suppression de getStatsCards()
   - Les StatsCards sont maintenant 100% gérées par commandes.list.js
   
   Architecture finale:
   - main.js : Initialisation, auth, header
   - list.js : Orchestre DataTable + Filtres + StatsCards
   - create.js : Gère la création
   - detail.js : Gère le détail
   
   NOTES POUR REPRISES FUTURES:
   - NE PAS réintroduire StatsCards ici !
   - La logique UI est dans les orchestrateurs de chaque section
   - main.js reste léger et ne gère que l'init globale
   ======================================== */