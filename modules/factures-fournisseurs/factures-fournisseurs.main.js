// ========================================
// FACTURES-FOURNISSEURS.MAIN.JS - Point d'entrée principal
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module factures fournisseurs
// Gère l'initialisation, l'authentification et le header
// Coordonne tous les orchestrateurs
//
// ARCHITECTURE:
// - main.js : Initialisation globale et auth
// - list.js : Orchestre DataTable + Filtres + StatsCards
// - create.js : Gère la création avec sélection "à payer"
// - detail.js : Gère le détail avec timeline
//
// DÉPENDANCES:
// - Firebase pour l'auth
// - config pour les factories
// - Les orchestrateurs de chaque section
// ========================================

import { initFirebase } from '../../src/services/firebase.service.js';
import { 
    initListeFactures, 
    chargerDonnees, 
    resetFiltres,
    afficherFactures
} from './factures-fournisseurs.list.js';
import { 
    initCreationFacture,
    ouvrirNouvelleFacture
} from './factures-fournisseurs.create.js';
import { 
    voirDetailFacture
} from './factures-fournisseurs.detail.js';
import config from './factures-fournisseurs.config.js';
import { modalManager } from '../../src/components/index.js';

// ========================================
// VARIABLES GLOBALES (partagées entre modules)
// ========================================

export const state = {
    facturesData: [],
    currentPage: 1,
    itemsPerPage: 20,
    filtres: {
        recherche: '',
        magasin: '',
        fournisseur: '',
        categorie: '',
        periode: 'all',
        statut: '',
        statutsActifs: [], // Array pour filtrage multi-statuts depuis cards
        aPayer: false,
        enRetard: false
    }
};

// Variable pour le composant header
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
        
        // Chercher le magasin dans l'ordre de priorité
        if (auth.magasin) {
            storeName = auth.magasin;
        } else if (auth.collaborateur.magasin) {
            storeName = auth.collaborateur.magasin;
        } else if (auth.collaborateur.magasin_nom) {
            storeName = auth.collaborateur.magasin_nom;
        } else {
            storeName = 'NON_DEFINI';
        }
        
        // Formater le nom du magasin
        let formattedStore = '';
        if (/^9[A-Z]{3}$/.test(storeName)) {
            formattedStore = storeName;
        } else if (storeName.startsWith('Magasin')) {
            formattedStore = storeName;
        } else {
            formattedStore = `Magasin ${storeName}`;
        }
        
        return {
            name: `${auth.collaborateur.prenom} ${auth.collaborateur.nom}`,
            store: formattedStore,
            showLogout: true
        };
    }
    
    return {
        name: 'Utilisateur',
        store: 'Magasin non défini',
        showLogout: true
    };
}

// Initialiser les composants UI
async function initUIComponents() {
    try {
        const userData = getUserData();
        
        // Créer le header avec la config locale
        appHeader = config.createFacturesHeader({
            ...userData,
            showMagasinSelector: false  // PAS de dropdown, juste afficher le magasin
        });
        
        console.log('🎨 Composants UI initialisés avec magasin:', userData.store);
        
    } catch (error) {
        console.error('❌ Erreur initialisation UI:', error);
        config.notify.error('Erreur lors de l\'initialisation de l\'interface');
    }
}

// ========================================
// INITIALISATION AU CHARGEMENT
// ========================================

window.addEventListener('load', async () => {
    if (!checkAuth()) {
        window.location.href = '../../index.html';
        return;
    }
    
    try {
        // 1. Initialiser les composants UI
        await initUIComponents();
        
        // 2. Initialiser Firebase
        await initFirebase();
        
        // 3. Initialiser les modales
        initModales();
        
        // 4. Initialiser les modules
        await initListeFactures();
        initCreationFacture();
        
        // 5. Afficher les factures déjà chargées
        afficherFactures();
        
        // 6. Recharger pour les stats
        await chargerDonnees();
        
        // 7. Activer les animations
        document.body.classList.add('page-loaded');
        
        // 8. Container pour les dialogs
        if (!document.getElementById('dialog-container')) {
            const dialogContainer = document.createElement('div');
            dialogContainer.id = 'dialog-container';
            dialogContainer.className = 'dialog-container';
            document.body.appendChild(dialogContainer);
        }
        
        // 9. Vérifier les retards (toutes les heures)
        verifierRetardsAutomatiquement();
        
        console.log('✅ Page factures fournisseurs initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        config.notify.error('Erreur lors du chargement de la page');
    }
});

// ========================================
// GESTION DES MODALES
// ========================================

function initModales() {
    // Enregistrer les modales via la config
    config.registerFacturesModals();
    
    // Vérifier l'existence des modales
    const modalIds = ['modalNouvelleFacture', 'modalDetailFacture'];
    
    modalIds.forEach(modalId => {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) {
            console.warn(`⚠️ Modal HTML "${modalId}" non trouvé dans le DOM`);
        }
    });
    
    // Callbacks pour la modal nouvelle facture
    const modalNouvelleFacture = modalManager.get('modalNouvelleFacture');
    if (modalNouvelleFacture) {
        modalNouvelleFacture.options = {
            ...modalNouvelleFacture.options,
            onClose: () => {
                // Réinitialiser si nécessaire
                if (window.resetNouvelleFacture) {
                    window.resetNouvelleFacture();
                }
            }
        };
    }
}

// ========================================
// VÉRIFICATION AUTOMATIQUE DES RETARDS
// ========================================

function verifierRetardsAutomatiquement() {
    // Vérifier immédiatement
    verifierRetards();
    
    // Puis toutes les heures
    setInterval(() => {
        verifierRetards();
    }, 60 * 60 * 1000); // 1 heure
}

async function verifierRetards() {
    try {
        const { FacturesFournisseursService } = await import('./factures-fournisseurs.service.js');
        const nombre = await FacturesFournisseursService.verifierRetards();
        
        if (nombre > 0) {
            config.notify.warning(`${nombre} facture(s) marquée(s) en retard`);
            // Recharger les données pour mettre à jour l'affichage
            await chargerDonnees();
        }
    } catch (error) {
        console.error('Erreur vérification retards:', error);
    }
}

// ========================================
// EXPOSITION DES FONCTIONS GLOBALES
// ========================================

// Exposer modalManager
window.modalManager = config.modalManager;

// Fonctions pour le HTML
window.ouvrirNouvelleFacture = ouvrirNouvelleFacture;
window.voirDetailFacture = voirDetailFacture;
window.resetFiltres = resetFiltres;

// Fonction fermer modal
window.fermerModal = function(modalId) {
    config.modalManager.close(modalId);
};

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

export function afficherAvertissement(message) {
    config.notify.warning(message);
}

// Cleanup au déchargement
window.addEventListener('beforeunload', () => {
    config.modalManager.destroyAll();
    
    if (appHeader) {
        appHeader.destroy();
    }
});

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création initiale
   - Architecture identique à decompte-mutuelle.main.js
   - Gestion auth et header
   - Initialisation des orchestrateurs
   - Vérification automatique des retards
   
   NOTES POUR REPRISES FUTURES:
   - main.js reste léger, juste l'init
   - Les orchestrateurs gèrent leur section
   - Les composants ne se connaissent pas
   - Vérification retards toutes les heures
   ======================================== */