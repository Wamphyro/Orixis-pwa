// ========================================
// DECOMPTE-MUTUELLE.MAIN.JS - Point d'entrée principal
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module décomptes mutuelles
// Gère l'initialisation, l'authentification et le header
// Coordonne tous les orchestrateurs
//
// ARCHITECTURE:
// - main.js : Initialisation globale et auth
// - list.js : Orchestre DataTable + Filtres + StatsCards
// - create.js : Gère la création (vide pour l'instant)
// - detail.js : Gère le détail avec timeline
//
// DÉPENDANCES:
// - Firebase pour l'auth
// - config pour les factories
// - Les orchestrateurs de chaque section
// ========================================

import { initFirebase } from '../../src/services/firebase.service.js';
import { 
    initListeDecomptes, 
    chargerDonnees, 
    resetFiltres
} from './decompte-mutuelle.list.js';
import { 
    initCreationDecompte,
    ouvrirNouveauDecompte
} from './decompte-mutuelle.create.js';
import { 
    voirDetailDecompte
} from './decompte-mutuelle.detail.js';
import config from './decompte-mutuelle.config.js';
import { modalManager } from '../../src/components/index.js';

// ========================================
// VARIABLES GLOBALES (partagées entre modules)
// ========================================

export const state = {
    decomptesData: [],
    currentPage: 1,
    itemsPerPage: 20,
    filtres: {
        recherche: '',
        magasin: '',
        mutuelle: '',
        periode: 'all',
        statut: '',
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
        
        // Charger les magasins pour vérifier s'il y en a plusieurs
        const { chargerMagasins } = await import('../../src/services/firebase.service.js');
        const magasinsData = await chargerMagasins();
        const magasinsArray = magasinsData ? 
            Object.entries(magasinsData)
                .filter(([id, data]) => data.actif !== false)
                .map(([id, data]) => ({
                    code: data.code || id,
                    nom: data.nom || data.code || id
                })) : [];
        
        // Créer le header avec la config locale
        appHeader = config.createDecomptesHeader({
            ...userData,
            showMagasinSelector: magasinsArray.length > 1  // Seulement si plusieurs magasins
        });
        
        // Si plusieurs magasins, ajouter le dropdown après que le header soit rendu
        if (magasinsArray.length > 1) {
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            setTimeout(() => {
                addMagasinDropdown(magasinsArray, auth.magasin);
            }, 100);
        }
        
        console.log('🎨 Composants UI initialisés avec magasin:', userData.store);
        
    } catch (error) {
        console.error('❌ Erreur initialisation UI:', error);
        config.notify.error('Erreur lors de l\'initialisation de l\'interface');
    }
}

// Fonction pour ajouter le dropdown de magasin
function addMagasinDropdown(magasins, magasinActuel) {
    const dropdownContainer = document.getElementById('magasinDropdownHeader');
    if (!dropdownContainer) return;
    
    // Créer la DropdownList
    state.magasinSelector = config.createDropdown(dropdownContainer, {
        options: magasins.map(mag => ({
            value: mag.code,
            label: mag.nom,
            icon: '🏪'
        })),
        value: magasinActuel,
        searchable: magasins.length > 5,
        size: 'small',
        theme: 'compact',
        onChange: async (value) => {
            // Mettre à jour l'auth
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            auth.magasin = value;
            
            // Récupérer la raison sociale du nouveau magasin
            const { chargerMagasins } = await import('../../src/services/firebase.service.js');
            const magasinsData = await chargerMagasins();
            const magasin = Object.values(magasinsData).find(m => m.code === value);
            if (magasin?.societe?.raisonSociale) {
                auth.raisonSociale = magasin.societe.raisonSociale;
            }
            
            localStorage.setItem('sav_auth', JSON.stringify(auth));
            
            // Notification
            config.notify.success(`Changement de magasin : ${value}`);
            
            // Recharger après 1 seconde
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    });
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
        await initListeDecomptes();
        initCreationDecompte();
        
        // 5. Charger les données initiales
        await chargerDonnees();
        
        // 6. Activer les animations
        document.body.classList.add('page-loaded');
        
        // 7. Container pour les dialogs
        if (!document.getElementById('dialog-container')) {
            const dialogContainer = document.createElement('div');
            dialogContainer.id = 'dialog-container';
            dialogContainer.className = 'dialog-container';
            document.body.appendChild(dialogContainer);
        }
        
        console.log('✅ Page décomptes mutuelles initialisée avec succès');
        
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
    config.registerDecomptesModals();
    
    // Vérifier l'existence des modales
    const modalIds = ['modalNouveauDecompte', 'modalDetailDecompte'];
    
    modalIds.forEach(modalId => {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) {
            console.warn(`⚠️ Modal HTML "${modalId}" non trouvé dans le DOM`);
        }
    });
    
    // Callbacks pour la modal nouveau décompte
    const modalNouveauDecompte = modalManager.get('modalNouveauDecompte');
    if (modalNouveauDecompte) {
        modalNouveauDecompte.options = {
            ...modalNouveauDecompte.options,
            onClose: () => {
                // Réinitialiser si nécessaire
                if (window.resetNouveauDecompte) {
                    window.resetNouveauDecompte();
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
window.ouvrirNouveauDecompte = ouvrirNouveauDecompte;
window.voirDetailDecompte = voirDetailDecompte;
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

// Cleanup au déchargement
window.addEventListener('beforeunload', () => {
    config.modalManager.destroyAll();
    
    if (appHeader) {
        appHeader.destroy();
    }
});

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [02/02/2025] - Création initiale
   - Architecture identique à commandes.main.js
   - Gestion auth et header
   - Initialisation des orchestrateurs
   - Container dialog pour les popups custom
   
   NOTES POUR REPRISES FUTURES:
   - main.js reste léger, juste l'init
   - Les orchestrateurs gèrent leur section
   - Les composants ne se connaissent pas
   ======================================== */