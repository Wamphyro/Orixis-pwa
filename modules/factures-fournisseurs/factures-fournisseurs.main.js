// ========================================
// FACTURES-FOURNISSEURS.MAIN.JS - Point d'entrée principal
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module factures fournisseurs
// ORCHESTRATEUR PRINCIPAL - Décide de toute la configuration
// Coordonne tous les sous-orchestrateurs
//
// ARCHITECTURE:
// - main.js : Orchestrateur principal + config UI
// - list.js : Sous-orchestrateur DataTable + Filtres + StatsCards
// - create.js : Sous-orchestrateur création
// - detail.js : Sous-orchestrateur détail
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
import { modalManager } from '../../src/components/ui/modal/modal.component.js';

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
        statutsActifs: []
    }
};

// Variable pour le composant header
let appHeader = null;

// ========================================
// AUTHENTIFICATION
// ========================================

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

// ========================================
// ORCHESTRATEUR UI - MAIN.JS DÉCIDE DE TOUT
// ========================================

async function initUIComponents() {
    try {
        const userData = getUserData();
        
        // DEBUG
        console.log('🔍 DEBUG userData:', userData);
        console.log('  - name:', userData.name);
        console.log('  - store:', userData.store);
        console.log('  - showLogout:', userData.showLogout);
        
        // MAIN.JS EST L'ORCHESTRATEUR - TOUTE LA CONFIG ICI
        appHeader = config.createFacturesHeader({
            // Container
            container: 'body',
            position: 'prepend',
            
            // Contenu
            title: '📑 Factures Fournisseurs',
            subtitle: 'Gestion des factures à payer',
            theme: 'default',
            
            // Navigation
            backUrl: window.location.origin + '/Orixis-pwa/modules/home/home.html',
            
            // Utilisateur
            user: userData,
            showMagasinDropdown: false,
            showLogout: true,
            
            // Classes CSS (orchestrateur décide)
            buttonClasses: {
                back: 'btn on-dark btn-pill',
                logout: 'btn btn-danger btn-sm on-dark text-white',
                userSection: 'header-user-section'
            },
            
            // Callbacks (orchestrateur gère)
            onBack: null,  // Utilise backUrl
            
            onLogout: async () => {
                console.log('🔴 Déconnexion demandée');
                const confirme = await config.Dialog.confirm(
                    'Voulez-vous vraiment vous déconnecter ?',
                    'Déconnexion'
                );
                if (confirme) {
                    console.log('✅ Déconnexion confirmée');
                    localStorage.removeItem('sav_auth');
                    window.location.href = '../../index.html';
                }
            },
            
            onUserClick: (userData) => {
                console.log('👤 Clic sur utilisateur:', userData);
                // Possibilité d'ajouter une action future
            }
        });
        
        console.log('✅ AppHeader créé avec succès');
        console.log('🎨 Config complète définie par main.js');
        
    } catch (error) {
        console.error('❌ Erreur initialisation UI:', error);
        config.notify.error('Erreur lors de l\'initialisation de l\'interface');
    }
}

// ========================================
// INITIALISATION PRINCIPALE
// ========================================

window.addEventListener('load', async () => {
    // Vérification auth
    if (!checkAuth()) {
        window.location.href = '../../index.html';
        return;
    }
    
    try {
        console.log('🚀 Démarrage module Factures Fournisseurs');
        
        // 1. UI Components (Header)
        await initUIComponents();
        
        // 2. Firebase
        await initFirebase();
        console.log('✅ Firebase initialisé');
        
        // 3. Modales
        initModales();
        console.log('✅ Modales initialisées');
        
        // 4. Sous-orchestrateurs
        await initListeFactures();
        initCreationFacture();
        console.log('✅ Sous-orchestrateurs initialisés');
        
        // 5. Données initiales
        afficherFactures();
        await chargerDonnees();
        console.log('✅ Données chargées');
        
        // 6. Animations
        document.body.classList.add('page-loaded');
        
        // 7. Container dialogs
        if (!document.getElementById('dialog-container')) {
            const dialogContainer = document.createElement('div');
            dialogContainer.id = 'dialog-container';
            dialogContainer.className = 'dialog-container';
            document.body.appendChild(dialogContainer);
        }
        
        // 8. Surveillance retards
        verifierRetardsAutomatiquement();
        
        console.log('✅ Module Factures Fournisseurs prêt !');
        
    } catch (error) {
        console.error('❌ Erreur initialisation module:', error);
        config.notify.error('Erreur lors du chargement de la page');
    }
});

// ========================================
// GESTION DES MODALES
// ========================================

function initModales() {
    // Enregistrer les modales
    config.registerFacturesModals();
    
    // Vérifier leur présence
    const modalIds = ['modalNouvelleFacture', 'modalDetailFacture'];
    modalIds.forEach(modalId => {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) {
            console.warn(`⚠️ Modal "${modalId}" non trouvée dans le DOM`);
        }
    });
    
    // Configuration callbacks
    const modalNouvelleFacture = modalManager.get('modalNouvelleFacture');
    if (modalNouvelleFacture) {
        modalNouvelleFacture.options.onClose = () => {
            if (window.resetNouvelleFacture) {
                window.resetNouvelleFacture();
            }
        };
    }
}

// ========================================
// VÉRIFICATION AUTOMATIQUE DES RETARDS
// ========================================

function verifierRetardsAutomatiquement() {
    // Vérification immédiate
    verifierRetards();
    
    // Puis toutes les heures
    setInterval(() => {
        verifierRetards();
    }, 60 * 60 * 1000);
}

async function verifierRetards() {
    try {
        const { FacturesFournisseursService } = await import('./factures-fournisseurs.service.js');
        const nombre = await FacturesFournisseursService.verifierRetards();
        
        if (nombre > 0) {
            config.notify.warning(`${nombre} facture(s) marquée(s) en retard`);
            await chargerDonnees();
        }
    } catch (error) {
        console.error('Erreur vérification retards:', error);
    }
}

// ========================================
// API GLOBALE (window)
// ========================================

window.modalManager = config.modalManager;
window.ouvrirNouvelleFacture = ouvrirNouvelleFacture;
window.voirDetailFacture = voirDetailFacture;
window.resetFiltres = resetFiltres;
window.fermerModal = (modalId) => config.modalManager.close(modalId);

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

// ========================================
// CLEANUP
// ========================================

window.addEventListener('beforeunload', () => {
    config.modalManager.destroyAll();
    if (appHeader) {
        appHeader.destroy();
    }
});

/* ========================================
   HISTORIQUE
   
   [05/02/2025] - Refactoring Option 1
   - main.js est maintenant L'ORCHESTRATEUR
   - Toute la configuration UI dans main.js
   - config.js = simples factories
   - Architecture IoC respectée
   ======================================== */