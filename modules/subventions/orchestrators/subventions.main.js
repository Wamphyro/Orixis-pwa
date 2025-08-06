// ========================================
// SUBVENTIONS.MAIN.JS - Point d'entrée principal
// Chemin: modules/subventions/orchestrators/subventions.main.js
// ========================================

import { initFirebase } from '../../../src/services/firebase.service.js';
import config from '../core/subventions.config.js';
import { modalManager } from '../../../src/components/ui/modal/modal.component.js';
import { 
    initListeDossiers, 
    chargerDonnees, 
    resetFiltres,
    afficherDossiers
} from './subventions.list.js';

// ========================================
// VARIABLES GLOBALES
// ========================================

export const state = {
    dossiersData: [],
    currentPage: 1,
    itemsPerPage: 20,
    filtres: {
        recherche: '',
        statutMDPH: '',
        statutAGEFIPH: '',
        technicien: '',
        periode: 'all',
        statutsActifs: []
    }
};

// Variable pour le composant header
let appHeader = null;

// ========================================
// AUTHENTIFICATION (COPIÉ DE FACTURES)
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
// ORCHESTRATEUR UI - COPIÉ DE FACTURES
// ========================================

async function initUIComponents() {
    try {
        const userData = getUserData();
        
        // DEBUG
        console.log('🔍 DEBUG userData:', userData);
        console.log('  - name:', userData.name);
        console.log('  - store:', userData.store);
        console.log('  - showLogout:', userData.showLogout);
        
        // CONFIGURATION COMPLÈTE COMME FACTURES
        appHeader = config.createSubventionsHeader({
            // Container
            container: 'body',
            position: 'prepend',
            
            // Contenu
            title: '📋 Gestion des Subventions',
            subtitle: 'Suivi MDPH et AGEFIPH',
            theme: 'default',
            
            // Navigation
            backUrl: window.location.origin + '/Orixis-pwa/modules/home/home.html',
            
            // Utilisateur
            user: userData,
            showMagasinDropdown: false,
            showLogout: true,
            
            // Classes CSS (comme factures)
            buttonClasses: {
                back: 'btn on-dark btn-pill',
                logout: 'btn btn-danger btn-sm on-dark text-white',
                userSection: 'header-user-section'
            },
            
            // Callbacks
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
                    window.location.href = '../../../index.html';
                }
            },
            
            onUserClick: (userData) => {
                console.log('👤 Clic sur utilisateur:', userData);
            }
        });
        
        console.log('✅ AppHeader créé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur initialisation UI:', error);
        config.notify.error('Erreur lors de l\'initialisation de l\'interface');
    }
}

// ========================================
// CRÉATION DES CONTAINERS HTML
// ========================================

function createHTMLStructure() {
    // Container principal
    let mainContainer = document.querySelector('.container');
    if (!mainContainer) {
        mainContainer = document.createElement('div');
        mainContainer.className = 'container';
        document.body.appendChild(mainContainer);
    }
    
    // Structure de la page COMME FACTURES
    mainContainer.innerHTML = `
        <div class="subventions-page">
            <!-- Stats en haut -->
            <div class="subventions-stats">
                <!-- StatsCards sera généré ici -->
            </div>
            
            <!-- Actions principales -->
            <div class="subventions-actions">
                <button class="btn btn-primary btn-with-icon btn-lg pill" onclick="ouvrirNouveauDossier()">
                    <span>➕</span> Nouveau dossier
                </button>
            </div>
            
            <!-- Filtres -->
            <div class="subventions-filters section">
                <!-- DataTableFilters sera généré ici -->
            </div>
            
            <!-- Table -->
            <div class="subventions-table-container section">
                <!-- DataTable sera généré ici -->
            </div>
        </div>
    `;
    
    console.log('✅ Structure HTML créée');
}

// ========================================
// INITIALISATION PRINCIPALE (COMME FACTURES)
// ========================================

window.addEventListener('load', async () => {
    // Vérification auth
    if (!checkAuth()) {
        window.location.href = '../../../index.html';
        return;
    }
    
    try {
        console.log('🚀 Démarrage module Subventions');
        
        // 1. UI Components (Header)
        await initUIComponents();
        
        // 2. Créer la structure HTML
        createHTMLStructure();
        
        // 3. Firebase
        await initFirebase();
        console.log('✅ Firebase initialisé');
        
        // 4. Attendre un peu pour que le DOM soit prêt
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 5. Initialiser la liste (DataTable + Filtres + Stats)
        await initListeDossiers();

        // 6. Charger les données
        await chargerDonnees();
        
        // 7. Animations
        document.body.classList.add('page-loaded');
        
        // 8. Container dialogs
        if (!document.getElementById('dialog-container')) {
            const dialogContainer = document.createElement('div');
            dialogContainer.id = 'dialog-container';
            dialogContainer.className = 'dialog-container';
            document.body.appendChild(dialogContainer);
        }
        
        console.log('✅ Module Subventions prêt !');
        
    } catch (error) {
        console.error('❌ Erreur initialisation module:', error);
        config.notify.error('Erreur lors du chargement de la page');
    }
});

// ========================================
// API GLOBALE (window)
// ========================================

window.ouvrirNouveauDossier = async () => {
    console.log('📋 Ouverture création dossier subvention');
    
    try {
        // Charger le module create
        const { ouvrirNouveauDossier, initCreationSubvention } = await import('./subventions.create.js');
        
        // Initialiser le module
        initCreationSubvention();
        
        // Ouvrir le dossier
        ouvrirNouveauDossier();
        
    } catch (error) {
        console.error('❌ Erreur ouverture création:', error);
        config.notify.error('Erreur lors de l\'ouverture du formulaire');
    }
};

window.voirDetailDossier = async (dossierId) => {
    console.log('Voir détail dossier:', dossierId);
    
    try {
        // Importer le module detail
        const { subventionsDetail } = await import('./subventions.detail.js');
        
        // Initialiser avec les permissions
        await subventionsDetail.init(dossierId, {
            canEdit: true,
            canDelete: true
        });
        
    } catch (error) {
        console.error('❌ Erreur ouverture détail:', error);
        config.notify.error('Erreur lors de l\'ouverture du détail');
    }
};

// ========================================
// CLEANUP
// ========================================

window.addEventListener('beforeunload', () => {
    if (appHeader) {
        appHeader.destroy();
    }
});
window.resetFiltres = resetFiltres;