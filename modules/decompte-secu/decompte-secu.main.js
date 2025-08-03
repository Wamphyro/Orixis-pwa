// ========================================
// DECOMPTE-SECU.MAIN.JS - Point d'entrée principal
// Chemin: modules/decompte-secu/decompte-secu.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module décomptes sécurité sociale
// Gère l'initialisation, l'authentification et le header
// Coordonne tous les orchestrateurs
//
// ARCHITECTURE:
// - main.js : Initialisation globale et auth
// - list.js : Orchestre DataTable + Filtres + StatsCards
// - create.js : Gère la création
// - detail.js : Gère le détail avec timeline
//
// DÉPENDANCES:
// - Firebase pour l'auth
// - config pour les factories
// - Les orchestrateurs de chaque section
// ========================================

import { initFirebase } from '../../src/services/firebase.service.js';
import { 
    initListeDecomptesSecu, 
    chargerDonnees, 
    resetFiltres,
    afficherDecomptesSecu
} from './decompte-secu.list.js';
import { 
    initCreationDecompteSecu,
    ouvrirNouveauDecompteSecu
} from './decompte-secu.create.js';
import { 
    voirDetailDecompteSecu
} from './decompte-secu.detail.js';
import config from './decompte-secu.config.js';
import { modalManager } from '../../src/components/index.js';

// ========================================
// VARIABLES GLOBALES (partagées entre modules)
// ========================================

export const state = {
    decomptesSecuData: [],
    currentPage: 1,
    itemsPerPage: 20,
    filtres: {
        recherche: '',
        magasin: '',
        caissePrimaire: '',
        regime: '',
        periode: 'all',
        statut: '',
        typeActe: '',
        statutsActifs: [] // Array pour filtrage multi-statuts depuis cards
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
        appHeader = config.createDecomptesSecuHeader({
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
        await initListeDecomptesSecu();
        initCreationDecompteSecu();
        
        // 5. Afficher les décomptes déjà chargés
        afficherDecomptesSecu();
        
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
        
        console.log('✅ Page décomptes sécurité sociale initialisée avec succès');
        
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
    config.registerDecomptesSecuModals();
    
    // Vérifier l'existence des modales
    const modalIds = ['modalNouveauDecompteSecu', 'modalDetailDecompteSecu'];
    
    modalIds.forEach(modalId => {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) {
            console.warn(`⚠️ Modal HTML "${modalId}" non trouvé dans le DOM`);
        }
    });
    
    // Callbacks pour la modal nouveau décompte
    const modalNouveauDecompte = modalManager.get('modalNouveauDecompteSecu');
    if (modalNouveauDecompte) {
        modalNouveauDecompte.options = {
            ...modalNouveauDecompte.options,
            onClose: () => {
                // Réinitialiser si nécessaire
                if (window.resetNouveauDecompteSecu) {
                    window.resetNouveauDecompteSecu();
                }
            }
        };
    }
}

// ========================================
// EXPOSITION DES FONCTIONS GLOBALES
// ========================================

// Exposer modalManager
window.modalManager = config.modalManager;

// Fonctions pour le HTML
window.ouvrirNouveauDecompteSecu = ouvrirNouveauDecompteSecu;
window.voirDetailDecompteSecu = voirDetailDecompteSecu;
window.resetFiltres = resetFiltres;

// Fonction fermer modal
window.fermerModal = function(modalId) {
    config.modalManager.close(modalId);
};

// Fonction refresh après création
window.refreshDecomptesSecuList = async () => {
    if (window.chargerDonnees) {
        await window.chargerDonnees();
    }
};

// Exposer chargerDonnees pour refresh
window.chargerDonnees = chargerDonnees;

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

export function afficherInfo(message) {
    config.notify.info(message);
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
   - Adaptation depuis decompte-mutuelle.main.js
   - Gestion auth et header identique
   - Initialisation des orchestrateurs sécu
   - Container dialog pour les popups custom
   
   NOTES POUR REPRISES FUTURES:
   - main.js reste léger, juste l'init
   - Les orchestrateurs gèrent leur section
   - Les composants ne se connaissent pas
   - Filtres adaptés (caisse, régime, type acte)
   ======================================== */