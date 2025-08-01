// ========================================
// COMMANDES.MAIN.JS - Point d'entrée principal (VERSION AVEC APPHEADER + MAGASIN)
// Chemin: modules/commandes/commandes.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module commandes
// Modifié le 30/01/2025 : Intégration du composant AppHeader avec magasin
// Modifié le 31/01/2025 : Utilisation de la config centralisée pour les stats cards
// Modifié le 01/02/2025 : Mise à jour des chemins d'import pour la nouvelle structure
// Modifié le 01/02/2025 : Ajout des buttonClasses pour personnaliser les boutons du header
//
// STRUCTURE:
// 1. Imports (lignes 16-41)
// 2. Variables globales (lignes 43-55)
// 3. Initialisation (lignes 57-160)
// 4. Gestion des modales (lignes 162-230)
// 5. Exposition des fonctions (lignes 232-285)
// 6. Utilitaires (lignes 287-340)
// ========================================

import { initFirebase } from '../../src/services/firebase.service.js';
import { 
    AppHeader,
    StatsCards,
    modalManager, 
    confirmerAction, 
    Dialog, 
    notify 
} from '../../src/components/index.js';
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
import { genererConfigStatsCards } from './commandes.data.js';
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
        magasin: '',
        periode: 'all',
        urgence: '',
        statuts: []  // 🔍 Vérifier : "statuts" (avec S) et array []
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
        
        // 1. Créer le header d'application avec classes personnalisées
        appHeader = new AppHeader({
            container: 'body',
            title: '📦 Gestion des Commandes',
            subtitle: 'Commandes d\'appareils et accessoires',
            backUrl: 'home.html',
            user: userData,
            
            // 🆕 L'ORCHESTRATEUR décide des classes CSS pour les boutons
            buttonClasses: {
                back: 'btn on-dark pill',              // Bouton retour arrondi sur fond sombre
                logout: 'header-logout-button pill',   // Bouton déconnexion arrondi
                userSection: 'header-user-section'     // Section utilisateur glassmorphism
            },
            
            onLogout: handleLogout,
            onBack: () => {
                console.log('Retour vers l\'accueil');
            },
            onUserClick: (user) => {
                console.log('Clic sur utilisateur:', user);
                // Possibilité d'ouvrir un menu utilisateur ou profil
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

// Mise à jour des informations utilisateur (si changement de magasin par exemple)
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

// Getter pour les données utilisateur actuelles
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
   
   [31/01/2025] - Centralisation de la config des stats cards
   Modification:
   - Import de genererConfigStatsCards depuis commandes.data.js
   - Les cartes de stats utilisent maintenant la config centralisée
   - Plus de duplication des icônes et labels
   
   [01/02/2025] - Mise à jour des chemins d'import
   Modification:
   - Chemins services: ../../src/js/services/ → ../../src/services/
   - Chemins components: ../../src/js/shared/ → ../../src/components/
   - Chemins data: ../../src/js/data/ → ../../src/data/
   - Adaptation à la nouvelle structure modules/commandes/
   
   [01/02/2025] - Ajout des buttonClasses pour personnalisation
   Modification:
   - Ajout de buttonClasses dans la config AppHeader
   - L'orchestrateur décide maintenant des classes CSS des boutons
   - Bouton retour avec classe 'btn on-dark pill' (arrondi sur fond sombre)
   - Bouton déconnexion avec classe 'header-logout-button pill'
   - Section utilisateur avec classe 'header-user-section' (glassmorphism)
   - Le composant AppHeader reste indépendant (Inversion of Control)
   
   Impact: 
   - Header maintenant géré par composant (plus de HTML statique)
   - Stats cards avec animation et interactions
   - Configuration des stats cards centralisée dans commandes.data.js
   - Déconnexion unifiée entre bouton header et fonction legacy
   - Affichage magasin utilisateur dans le header
   - Possibilité de mise à jour dynamique des infos utilisateur
   - Chemins alignés avec la nouvelle structure de dossiers
   - Personnalisation complète de l'apparence des boutons depuis l'orchestrateur
   
   NOTES POUR REPRISES FUTURES:
   - AppHeader remplace complètement le header HTML statique
   - StatsCards remplace les cartes statiques du HTML
   - La fonction updateStats() doit être appelée depuis list.js
   - Les composants UI sont accessibles via getters pour autres modules
   - Cleanup automatique des composants au déchargement
   - Le magasin est auto-détecté depuis plusieurs champs possibles
   - Format final: "Magasin [nom]" affiché dans le header
   - Les stats cards sont maintenant générées depuis commandes.data.js
   - Structure: modules/[module]/ pour les modules, src/ pour le code partagé
   - Les classes CSS des boutons sont passées par l'orchestrateur (IoC)
   ======================================== */