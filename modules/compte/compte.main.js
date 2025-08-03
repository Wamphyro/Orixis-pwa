// ========================================
// COMPTE.MAIN.JS - Point d'entrée principal
// Chemin: modules/compte/compte.main.js
//
// DESCRIPTION:
// Point d'entrée principal du module compte utilisateur
// Gère l'initialisation, l'authentification et l'affichage
//
// ARCHITECTURE:
// - main.js : Initialisation globale et auth
// - service.js : Sauvegarde des modifications
// ========================================

import { initFirebase } from '../../src/services/firebase.service.js';
import config from './compte.config.js';
import { CompteService } from './compte.service.js';

// ========================================
// VARIABLES GLOBALES
// ========================================

export const state = {
    userData: null,
    userGroupes: [],
    userPermissions: null,
    magasinsAutorises: [],
    currentMagasin: null,
    // Pour la modification du PIN
    pinFlow: {
        step: 'ancien',
        ancienCode: '',
        nouveauCode: '',
        confirmCode: ''
    }
};

// Variable pour le composant header
let appHeader = null;

// Instances des numpads
let numpadAncien = null;
let numpadNouveau = null;
let numpadConfirm = null;

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
        localStorage.removeItem('sav_user_permissions');
        return false;
    }
    
    return authData.authenticated;
}

// Obtenir les données utilisateur
function getUserData() {
    const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
    const permissions = JSON.parse(localStorage.getItem('sav_user_permissions') || '{}');
    
    if (auth && auth.collaborateur) {
        return {
            name: `${auth.collaborateur.prenom} ${auth.collaborateur.nom}`,
            store: auth.magasin || 'NON_DEFINI',
            id: auth.collaborateur.id,
            role: auth.collaborateur.role,
            permissions: permissions,
            showLogout: true
        };
    }
    
    return null;
}

// Initialiser les composants UI
async function initUIComponents() {
    try {
        const userData = getUserData();
        if (!userData) {
            throw new Error('Données utilisateur non trouvées');
        }
        
        // Créer le header
        appHeader = config.createCompteHeader(userData);
        
        console.log('🎨 Composants UI initialisés');
        
    } catch (error) {
        console.error('❌ Erreur initialisation UI:', error);
        config.notify.error('Erreur lors de l\'initialisation de l\'interface');
    }
}

// ========================================
// CHARGEMENT DES DONNÉES
// ========================================

async function chargerDonneesUtilisateur() {
    try {
        const userData = getUserData();
        if (!userData) return;
        
        // Charger les données complètes de l'utilisateur
        const userComplet = await CompteService.getUtilisateurComplet(userData.id);
        if (!userComplet) {
            throw new Error('Utilisateur non trouvé');
        }
        
        state.userData = userComplet;
        
        // Charger les groupes
        state.userGroupes = await CompteService.getGroupesUtilisateur(userComplet.groupes || []);
        
        // Calculer les permissions
        state.userPermissions = await CompteService.calculerPermissions(
            userComplet,
            state.userGroupes,
            userData.store
        );
        
        // Charger les magasins autorisés
        state.magasinsAutorises = await CompteService.getMagasinsAutorises(userComplet);
        state.currentMagasin = userData.store;
        
        // Afficher les données
        afficherDonneesUtilisateur();
        
    } catch (error) {
        console.error('❌ Erreur chargement données:', error);
        config.notify.error('Erreur lors du chargement des données');
    }
}

// ========================================
// AFFICHAGE DES DONNÉES
// ========================================

function afficherDonneesUtilisateur() {
    // Informations personnelles
    document.getElementById('userNom').textContent = state.userData.nom || '-';
    document.getElementById('userPrenom').textContent = state.userData.prenom || '-';
    
    // Dropdown magasin
    afficherDropdownMagasin();
    
    // Groupes
    afficherGroupes();
    
    // Permissions
    afficherPermissions();
    
    // Magasins autorisés
    afficherMagasinsAutorises();
}

function afficherDropdownMagasin() {
    const container = document.getElementById('magasinSelector');
    if (!container) return;
    
    const options = state.magasinsAutorises.map(mag => ({
        value: mag.code,
        label: `${mag.code} - ${mag.nom || mag.code}`,
        icon: '🏪'
    }));
    
    const dropdown = config.createMagasinDropdown(container, {
        options,
        value: state.currentMagasin,
        onChange: async (value) => {
            await changerMagasin(value);
        }
    });
}

function afficherGroupes() {
    const container = document.getElementById('userGroupes');
    const descContainer = document.getElementById('groupesDescription');
    
    if (!container) return;
    
    // Badges des groupes
    container.innerHTML = '';
    state.userGroupes.forEach(groupe => {
        const badgeWrapper = document.createElement('span');
        badgeWrapper.className = 'groupe-badge-wrapper';
        
        const badge = config.createGroupeBadge(groupe);
        badgeWrapper.appendChild(badge.getElement());
        
        container.appendChild(badgeWrapper);
    });
    
    // Descriptions
    if (descContainer) {
        const descriptions = state.userGroupes.map(groupe => 
            `<div class="groupe-desc">
                <strong>${groupe.icon} ${groupe.nom} :</strong> ${groupe.description || 'Aucune description'}
            </div>`
        ).join('');
        
        descContainer.innerHTML = descriptions;
    }
}

function afficherPermissions() {
    // Pages accessibles
    const pagesContainer = document.getElementById('permissionsPages');
    if (pagesContainer) {
        const pagesHtml = Object.entries(state.userPermissions.pages || {})
            .map(([page, perms]) => {
                const hasAccess = perms.view === true;
                const actions = [];
                if (perms.create) actions.push('Créer');
                if (perms.edit) actions.push('Modifier');
                if (perms.delete) actions.push('Supprimer');
                if (perms.export) actions.push('Exporter');
                
                const details = actions.length > 0 ? `(${actions.join(', ')})` : '';
                
                return config.HTML_TEMPLATES.permissionItem(
                    formatPageName(page),
                    hasAccess,
                    details
                );
            })
            .join('');
        
        pagesContainer.innerHTML = pagesHtml || '<p class="no-data">Aucune page accessible</p>';
    }
    
    // Permissions spéciales
    const specialesContainer = document.getElementById('permissionsSpeciales');
    if (specialesContainer) {
        const specialesHtml = Object.entries(state.userPermissions.fonctionnalites || {})
            .map(([fonc, granted]) => {
                return config.HTML_TEMPLATES.permissionItem(
                    formatFonctionnaliteName(fonc),
                    granted
                );
            })
            .join('');
        
        specialesContainer.innerHTML = specialesHtml || '<p class="no-data">Aucune permission spéciale</p>';
    }
}

function afficherMagasinsAutorises() {
    const container = document.getElementById('magasinsAutorises');
    if (!container) return;
    
    const magasinsHtml = state.magasinsAutorises
        .map(mag => config.HTML_TEMPLATES.magasinCard(
            mag,
            mag.code === state.currentMagasin
        ))
        .join('');
    
    container.innerHTML = magasinsHtml || '<p class="no-data">Aucun magasin autorisé</p>';
}

// ========================================
// GESTION DU PIN
// ========================================

function initModalPin() {
    // Initialiser les numpads
    numpadAncien = config.createPinNumpad('#numpadAncien', {
        onInput: (value) => {
            state.pinFlow.ancienCode = value;
            updatePinDisplay('ancien', value.length);
        },
        onComplete: async (value) => {
            await verifierAncienCode(value);
        }
    });
    
    numpadNouveau = config.createPinNumpad('#numpadNouveau', {
        onInput: (value) => {
            state.pinFlow.nouveauCode = value;
            updatePinDisplay('nouveau', value.length);
        },
        onComplete: (value) => {
            passerEtapeConfirmation();
        }
    });
    
    numpadConfirm = config.createPinNumpad('#numpadConfirm', {
        onInput: (value) => {
            state.pinFlow.confirmCode = value;
            updatePinDisplay('confirm', value.length);
        },
        onComplete: async (value) => {
            await confirmerNouveauCode();
        }
    });
}

async function verifierAncienCode(code) {
    try {
        const isValid = await CompteService.verifierPin(state.userData.id, code);
        
        if (isValid) {
            // Passer à l'étape suivante
            document.getElementById('stepAncienCode').classList.remove('active');
            document.getElementById('stepNouveauCode').classList.add('active');
            state.pinFlow.step = 'nouveau';
            numpadNouveau.focus();
        } else {
            document.getElementById('errorAncien').textContent = 'Code incorrect';
            numpadAncien.clear();
            state.pinFlow.ancienCode = '';
            updatePinDisplay('ancien', 0);
        }
    } catch (error) {
        config.notify.error('Erreur lors de la vérification');
    }
}

function passerEtapeConfirmation() {
    document.getElementById('stepNouveauCode').classList.remove('active');
    document.getElementById('stepConfirmation').classList.add('active');
    state.pinFlow.step = 'confirm';
    
    // Afficher le bouton valider
    document.getElementById('btnValiderPin').style.display = 'block';
    
    numpadConfirm.focus();
}

async function confirmerNouveauCode() {
    if (state.pinFlow.confirmCode !== state.pinFlow.nouveauCode) {
        document.getElementById('errorConfirm').textContent = 'Les codes ne correspondent pas';
        numpadConfirm.clear();
        state.pinFlow.confirmCode = '';
        updatePinDisplay('confirm', 0);
        return;
    }
    
    // Activer le bouton valider
    document.getElementById('btnValiderPin').disabled = false;
}

function updatePinDisplay(step, length) {
    let selector = '';
    switch (step) {
        case 'ancien':
            selector = '#stepAncienCode .pin-dot';
            break;
        case 'nouveau':
            selector = '#stepNouveauCode .pin-dot';
            break;
        case 'confirm':
            selector = '#stepConfirmation .pin-dot';
            break;
    }
    
    const dots = document.querySelectorAll(selector);
    dots.forEach((dot, index) => {
        if (index < length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

// ========================================
// ACTIONS
// ========================================

window.ouvrirModalPin = function() {
    // Reset
    state.pinFlow = {
        step: 'ancien',
        ancienCode: '',
        nouveauCode: '',
        confirmCode: ''
    };
    
    // Reset UI
    document.querySelectorAll('.pin-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('stepAncienCode').classList.add('active');
    document.getElementById('btnValiderPin').style.display = 'none';
    document.getElementById('btnValiderPin').disabled = true;
    
    // Clear errors
    document.getElementById('errorAncien').textContent = '';
    document.getElementById('errorConfirm').textContent = '';
    
    // Clear displays
    document.querySelectorAll('.pin-dot').forEach(dot => {
        dot.classList.remove('filled');
    });
    
    // Ouvrir modal
    config.modalManager.open('modalModifierPin');
    
    // Focus numpad
    if (numpadAncien) {
        numpadAncien.clear();
        numpadAncien.focus();
    }
};

window.fermerModalPin = function() {
    config.modalManager.close('modalModifierPin');
};

window.basculerMagasin = async function(codeMagasin) {
    await changerMagasin(codeMagasin);
};

async function changerMagasin(nouveauMagasin) {
    try {
        // Mettre à jour l'auth
        const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
        auth.magasin = nouveauMagasin;
        
        // Récupérer la raison sociale du nouveau magasin
        const magasin = state.magasinsAutorises.find(m => m.code === nouveauMagasin);
        if (magasin?.societe?.raisonSociale) {
            auth.raisonSociale = magasin.societe.raisonSociale;
        }
        
        localStorage.setItem('sav_auth', JSON.stringify(auth));
        
        config.notify.success(`Changement vers le magasin ${nouveauMagasin}`);
        
        // Recharger après 1 seconde
        setTimeout(() => {
            location.reload();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur changement magasin:', error);
        config.notify.error('Erreur lors du changement de magasin');
    }
}

// Valider le nouveau PIN
document.addEventListener('DOMContentLoaded', () => {
    const btnValider = document.getElementById('btnValiderPin');
    if (btnValider) {
        btnValider.addEventListener('click', async () => {
            try {
                btnValider.disabled = true;
                btnValider.innerHTML = '⏳ Modification...';
                
                await CompteService.modifierPin(
                    state.userData.id,
                    state.pinFlow.nouveauCode
                );
                
                config.notify.success('Code PIN modifié avec succès');
                
                setTimeout(() => {
                    fermerModalPin();
                }, 1500);
                
            } catch (error) {
                console.error('❌ Erreur modification PIN:', error);
                config.notify.error('Erreur lors de la modification du code');
                btnValider.disabled = false;
                btnValider.innerHTML = '✅ Valider';
            }
        });
    }
});

// ========================================
// HELPERS
// ========================================

function formatPageName(page) {
    const mapping = {
        'interventions': '🔧 Interventions',
        'commandes': '📦 Commandes',
        'decompte-secu': '🏥 Décomptes Sécu',
        'decompte-mutuelle': '💊 Décomptes Mutuelle',
        'operations-bancaires': '💰 Opérations Bancaires',
        'clients': '👥 Clients'
    };
    
    return mapping[page] || page;
}

function formatFonctionnaliteName(fonc) {
    const mapping = {
        'voir_tous_utilisateurs': 'Voir tous les utilisateurs',
        'creer_utilisateurs': 'Créer des utilisateurs',
        'modifier_utilisateurs': 'Modifier les utilisateurs',
        'supprimer_utilisateurs': 'Supprimer des utilisateurs',
        'modifier_tous_codes_pin': 'Modifier tous les codes PIN',
        'acces_tous_magasins': 'Accès à tous les magasins',
        'gerer_parametres_magasins': 'Gérer les paramètres magasins',
        'voir_statistiques_globales': 'Voir les statistiques globales',
        'voir_statistiques_magasin': 'Voir les statistiques du magasin',
        'exporter_donnees_globales': 'Exporter les données globales',
        'gerer_parametres_systeme': 'Gérer les paramètres système'
    };
    
    return mapping[fonc] || fonc.replace(/_/g, ' ');
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
        config.registerCompteModals();
        initModalPin();
        
        // 4. Charger les données utilisateur
        await chargerDonneesUtilisateur();
        
        // 5. Container pour les dialogs
        if (!document.getElementById('dialog-container')) {
            const dialogContainer = document.createElement('div');
            dialogContainer.id = 'dialog-container';
            dialogContainer.className = 'dialog-container';
            document.body.appendChild(dialogContainer);
        }
        
        console.log('✅ Page compte initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        config.notify.error('Erreur lors du chargement de la page');
    }
});

// Cleanup au déchargement
window.addEventListener('beforeunload', () => {
    config.modalManager.destroyAll();
    
    if (appHeader) {
        appHeader.destroy();
    }
    
    if (numpadAncien) numpadAncien.destroy();
    if (numpadNouveau) numpadNouveau.destroy();
    if (numpadConfirm) numpadConfirm.destroy();
});