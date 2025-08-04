// ========================================
// OPERATIONS-BANCAIRES.MAIN.JS - Point d'entrée principal
// Chemin: modules/operations-bancaires/operations-bancaires.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module opérations bancaires
// Gère l'initialisation, l'authentification et le header
// Coordonne tous les orchestrateurs
//
// ARCHITECTURE:
// - main.js : Initialisation globale et auth
// - list.js : Orchestre DataTable + Filtres + StatsCards
// - import.service.js : Gère l'import CSV/Excel
// - create.js : Gère l'ajout manuel d'opérations
//
// DÉPENDANCES:
// - Firebase pour l'auth
// - config pour les factories
// - Les orchestrateurs de chaque section
// ========================================

import { initFirebase } from '../../src/services/firebase.service.js';
import { 
    initListeOperations, 
    chargerDonnees, 
    resetFiltres,
    afficherOperations
} from './operations-bancaires.list.js';
import { OperationsBancairesService } from './operations-bancaires.service.js';
import { 
    initImportOperations,
    ouvrirModalImport
} from './operations-bancaires.create.js';
import { voirDetailOperation } from './operations-bancaires.detail.js';
import config from './operations-bancaires.config.js';
import { modalManager } from '../../src/components/index.js';

// ========================================
// VARIABLES GLOBALES (partagées entre modules)
// ========================================

export const state = {
    operationsData: [],
    currentPage: 1,
    itemsPerPage: 50,
    filtres: {
        recherche: '',
        compte: '',
        categorie: '',
        periode: 'all', // Changé pour afficher TOUTES les opérations par défaut
        dateDebut: null,
        dateFin: null,
        pointees: 'all', // all, oui, non
        cartesActives: [] // Pour le filtrage par cartes de stats
    },
    selection: [] // IDs des opérations sélectionnées
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
        appHeader = config.createOperationsHeader({
            ...userData,
            showMagasinSelector: false  // PAS de dropdown, juste afficher le magasin
        });
        
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
        await initListeOperations();
        initImportOperations();
        
        // 5. Afficher les opérations déjà chargées
        afficherOperations();
        
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
        
        console.log('✅ Page opérations bancaires initialisée avec succès');
        
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
    config.registerOperationsModals();
    
    // Vérifier l'existence des modales
    const modalIds = ['modalImportCSV', 'modalDetailOperation', 'modalCategoriser'];
    
    modalIds.forEach(modalId => {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) {
            console.warn(`⚠️ Modal HTML "${modalId}" non trouvé dans le DOM`);
        }
    });
    
    // Callbacks pour la modal import
    const modalImport = modalManager.get('modalImportCSV');
    if (modalImport) {
        modalImport.options = {
            ...modalImport.options,
            onClose: () => {
                // Réinitialiser si nécessaire
                if (window.resetImport) {
                    window.resetImport();
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

// La fonction voirDetailOperation est maintenant importée depuis operations-bancaires.detail.js

// Fonctions pour le HTML
window.ouvrirModalImport = ouvrirModalImport;
window.voirDetailOperation = voirDetailOperation;
window.resetFiltres = resetFiltres;
// categoriserOperations sera ajouté après sa définition

// Fonction fermer modal
window.fermerModal = function(modalId) {
    config.modalManager.close(modalId);
};

// Fonction pour catégoriser des opérations
async function categoriserOperations() {
    const selection = state.selection;
    if (selection.length === 0) {
        config.notify.warning('Veuillez sélectionner au moins une opération');
        return;
    }
    
    // TODO: Ouvrir modal de catégorisation
    console.log('Catégoriser', selection.length, 'opérations');
}

// Exposer la fonction après sa définition
window.categoriserOperations = categoriserOperations;

// Fonction pour confirmer la catégorisation
window.confirmerCategorisation = async function() {
    // TODO: Implémenter la catégorisation
    console.log('Confirmer catégorisation');
    config.modalManager.close('modalCategoriser');
};

// Fonction pour supprimer des opérations
window.supprimerOperations = async function() {
    const selection = state.selection;
    if (selection.length === 0) {
        config.notify.warning('Veuillez sélectionner au moins une opération');
        return;
    }
    
    const confirme = await config.Dialog.confirm(
        `Êtes-vous sûr de vouloir supprimer ${selection.length} opération(s) ?`,
        'Suppression',
        {
            confirmText: 'Supprimer',
            confirmClass: 'danger'
        }
    );
    
    if (confirme) {
        // TODO: Implémenter la suppression
        console.log('Supprimer', selection.length, 'opérations');
    }
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
   
   [03/02/2025] - Création basée sur decompte-mutuelle
   - Adaptation pour opérations bancaires
   - Support sélection multiple
   - Fonctions de catégorisation et suppression groupée
   - Import CSV au lieu de création manuelle
   
   NOTES POUR REPRISES FUTURES:
   - main.js reste léger, juste l'init
   - Les orchestrateurs gèrent leur section
   - Les composants ne se connaissent pas
   - La sélection est gérée dans state.selection
   ======================================== */