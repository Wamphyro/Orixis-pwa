// ========================================
// COMMANDES.MAIN.JS - Point d'entrée principal (VERSION AVEC APPHEADER + MAGASIN)
// Chemin: src/js/pages/commandes/commandes.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module commandes
// Modifié le 30/01/2025 : Intégration du composant AppHeader avec magasin
//
// STRUCTURE:
// 1. Imports (lignes 15-40)
// 2. Variables globales (lignes 42-54)
// 3. Initialisation (lignes 56-150)
// 4. Gestion des modales (lignes 152-220)
// 5. Exposition des fonctions (lignes 222-271)
// 6. Utilitaires (lignes 273-320)
// ========================================

import { initFirebase } from '../../services/firebase.service.js';
import { 
    AppHeader,
    StatsCards,
    modalManager, 
    confirmerAction, 
    Dialog, 
    notify 
} from '../../shared/index.js';
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

// Variables pour les composants UI
let appHeader = null;
let statsCards = null;

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

// 🆕 Récupérer les données utilisateur pour le header (avec magasin)
function getUserData() {
    const auth = JSON.parse(localStorage.getItem('sav_auth'));
    if (auth && auth.collaborateur) {
        // 🆕 Gestion du magasin - plusieurs formats possibles
        let storeName = '';
        
        // Essayer différents champs possibles pour le magasin
        if (auth.collaborateur.magasin) {
            storeName = auth.collaborateur.magasin;
        } else if (auth.collaborateur.magasin_nom) {
            storeName = auth.collaborateur.magasin_nom;
        } else if (auth.collaborateur.store) {
            storeName = auth.collaborateur.store;
        } else if (auth.collaborateur.agence) {
            storeName = auth.collaborateur.agence;
        } else {
            // Valeur par défaut si aucun magasin trouvé
            storeName = 'Magasin principal';
        }
        
        // 🆕 Formater le nom du magasin
        const formattedStore = storeName.startsWith('Magasin') ? storeName : `Magasin ${storeName}`;
        
        return {
            name: `${auth.collaborateur.prenom} ${auth.collaborateur.nom}`,
            store: formattedStore, // 🆕 Ajout du magasin
            showLogout: true
        };
    }
    
    // Fallback si pas d'auth
    return {
        name: 'Utilisateur',
        store: 'Magasin non défini', // 🆕 Fallback magasin
        showLogout: true
    };
}

// Initialiser les composants UI
async function initUIComponents() {
    try {
        // 🆕 Récupérer les données utilisateur avec magasin
        const userData = getUserData();
        
        // 1. Créer le header d'application
        appHeader = new AppHeader({
            container: 'body',  // Injecter en début de body
            title: '📦 Gestion des Commandes',
            subtitle: 'Commandes d\'appareils et accessoires',
            backUrl: 'home.html',
            user: userData, // 🆕 Données complètes avec magasin
            onLogout: handleLogout,  // Utiliser notre fonction logout
            onBack: () => {
                // Optionnel : logique custom avant retour
                console.log('Retour vers l\'accueil');
            },
            onUserClick: (user) => {
                // 🆕 Optionnel : Action au clic sur la section utilisateur
                console.log('Clic sur utilisateur:', user);
                // Ici on pourrait ouvrir un menu utilisateur ou un profil
            }
        });
        
        // 2. Créer les cartes de statistiques
        statsCards = new StatsCards({
            container: '.commandes-stats',
            cards: [
                { 
                    id: 'nouvelle', 
                    label: 'Nouvelles', 
                    value: 0, 
                    icon: '📋', 
                    color: 'info' 
                },
                { 
                    id: 'preparation', 
                    label: 'En préparation', 
                    value: 0, 
                    icon: '🔧', 
                    color: 'warning' 
                },
                { 
                    id: 'expediee', 
                    label: 'Expédiées', 
                    value: 0, 
                    icon: '📦', 
                    color: 'primary' 
                },
                { 
                    id: 'livree', 
                    label: 'Livrées', 
                    value: 0, 
                    icon: '✅', 
                    color: 'success' 
                }
            ],
            onClick: (cardId, cardData) => {
                // Optionnel : filtrer par statut au clic
                console.log(`Filtre par statut: ${cardId}`, cardData);
                // Ici on pourrait déclencher un filtre automatique
            }
        });
        
        console.log('🎨 Composants UI initialisés avec magasin:', userData.store);
        
    } catch (error) {
        console.error('❌ Erreur initialisation UI:', error);
        notify.error('Erreur lors de l\'initialisation de l\'interface');
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
        notify.error('Erreur lors du chargement de la page');
    }
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
            notify.success('Déconnexion réussie');
            
            // Redirection
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 1000);
        }
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        notify.error('Erreur lors de la déconnexion');
    }
}

// 🆕 Mise à jour des informations utilisateur (si changement de magasin par exemple)
export function updateUserInfo() {
    if (appHeader) {
        const userData = getUserData();
        appHeader.setUser(userData);
        console.log('🔄 Informations utilisateur mises à jour:', userData);
    }
}

// Mise à jour des statistiques (appelée depuis commandes.list.js)
export function updateStats(stats) {
    if (statsCards) {
        statsCards.updateAll({
            nouvelle: stats.nouvelle || 0,
            preparation: stats.preparation || 0,
            expediee: stats.expediee || 0,
            livree: stats.livree || 0
        });
    }
}

// ========================================
// EXPOSITION DES FONCTIONS GLOBALES
// ========================================

// Exposer modalManager globalement pour les autres modules
window.modalManager = modalManager;

// Exposer les composants UI pour les autres modules
window.appHeader = () => appHeader;
window.statsCards = () => statsCards;
window.updateStats = updateStats;
window.updateUserInfo = updateUserInfo; // 🆕 Fonction de mise à jour utilisateur

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
window.logout = handleLogout; // Pointer vers la nouvelle fonction
window.selectionnerCote = selectionnerCote;
window.annulerSelectionCote = annulerSelectionCote;

// ========================================
// UTILITAIRES GLOBAUX
// ========================================

function fermerModal(modalId) {
    modalManager.close(modalId);
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
    modalManager.destroyAll();
    
    // Cleanup des composants UI
    if (appHeader) {
        appHeader.destroy();
    }
    if (statsCards) {
        statsCards.destroy();
    }
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

// Getters pour les composants (pour les autres modules)
export function getAppHeader() {
    return appHeader;
}

export function getStatsCards() {
    return statsCards;
}

// 🆕 Getter pour les données utilisateur actuelles
export function getCurrentUser() {
    return getUserData();
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [28/01/2025] - Suppression des imports rechercherClient/rechercherProduit
   Modification: Ces fonctions ont été remplacées par SearchDropdown
   Impact: Plus besoin de les importer ni de les exposer globalement
   
   [30/01/2025] - Intégration AppHeader et StatsCards
   Modification: 
   - Ajout imports AppHeader et StatsCards
   - Création fonction initUIComponents()
   - Nouvelle fonction handleLogout() pour le header
   - Export updateStats() pour mise à jour depuis list.js
   - Cleanup des composants au beforeunload
   - Getters pour accès aux composants depuis autres modules
   
   [30/01/2025] - Ajout gestion magasin utilisateur
   Modification:
   - Extension getUserData() pour inclure le magasin
   - Support de plusieurs formats de champs magasin (magasin, magasin_nom, store, agence)
   - Formatage automatique du nom de magasin
   - Ajout callback onUserClick au header
   - Export updateUserInfo() pour mise à jour dynamique
   - Export getCurrentUser() pour accès aux données utilisateur
   
   Impact: 
   - Header maintenant géré par composant (plus de HTML statique)
   - Stats cards avec animation et interactions
   - Déconnexion unifiée entre bouton header et fonction legacy
   - Affichage magasin utilisateur dans le header
   - Possibilité de mise à jour dynamique des infos utilisateur
   
   NOTES POUR REPRISES FUTURES:
   - AppHeader remplace complètement le header HTML statique
   - StatsCards remplace les cartes statiques du HTML
   - La fonction updateStats() doit être appelée depuis list.js
   - Les composants UI sont accessibles via getters pour autres modules
   - Cleanup automatique des composants au déchargement
   - Le magasin est auto-détecté depuis plusieurs champs possibles
   - Format final: "Magasin [nom]" affiché dans le header
   ======================================== */