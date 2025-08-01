// ========================================
// LOGIN.UI.JS - Orchestrateur UI
// Chemin: modules/login/login.ui.js
//
// DESCRIPTION:
// Gère l'interface utilisateur et la coordination des composants
// ========================================

import config from './login.config.js';
import { authenticateUser, saveAuthentication } from './login.auth.js';
import { chargerTousLesUtilisateurs } from '../../src/services/firebase.service.js';
import { state, incrementAttempts, animateError, animateSuccess } from './login.main.js';

// ========================================
// VARIABLES
// ========================================

let userDropdown = null;
let numpad = null;
let currentPin = '';
let selectedUserId = null;
let selectedUserData = null;

// ========================================
// INITIALISATION UI
// ========================================

export async function initLoginUI() {
    console.log('📋 Initialisation de l\'interface...');
    
    // Charger les utilisateurs
    const users = await loadUsers();
    
    if (users.length === 0) {
        config.notify.error(config.LOGIN_CONFIG.messages.noUsers);
        return;
    }
    
    // Créer le dropdown
    initUserDropdown(users);
    
    // Créer le numpad
    initNumpad();
    
    // Initialiser l'affichage PIN
    updatePinDisplay('');
    
    console.log('✅ Interface prête');
}

// ========================================
// CHARGEMENT DES UTILISATEURS
// ========================================

async function loadUsers() {
    try {
        console.log('👥 Chargement des utilisateurs...');
        const users = await chargerTousLesUtilisateurs();
        console.log(`✅ ${users.length} utilisateurs chargés`);
        
        // Trier par nom
        return users.sort((a, b) => {
            const nameA = `${a.prenom} ${a.nom}`.toLowerCase();
            const nameB = `${b.prenom} ${b.nom}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });
    } catch (error) {
        console.error('❌ Erreur chargement utilisateurs:', error);
        config.notify.error('Impossible de charger les utilisateurs');
        return [];
    }
}

// ========================================
// DROPDOWN UTILISATEURS
// ========================================

function initUserDropdown(users) {
    const container = document.getElementById('userDropdown');
    if (!container) {
        console.error('❌ Container userDropdown non trouvé');
        return;
    }
    
    // Préparer les options
    const options = users.map(user => ({
        value: user.id,
        label: `${user.prenom} ${user.nom}`,
        icon: user.role === 'admin' ? '👤' : '🔧'
    }));
    
    // Créer le dropdown
    userDropdown = config.createUserDropdown(container, {
        options,
        onChange: (userId) => {
            selectedUserId = userId;
            selectedUserData = users.find(u => u.id === userId);
            console.log('👤 Utilisateur sélectionné:', selectedUserData);
            
            // Reset le PIN
            if (numpad) {
                numpad.clear();
            }
            currentPin = '';
            updatePinDisplay('');
            
            // Focus sur le numpad
            if (numpad) {
                const firstButton = document.querySelector('.numpad-btn');
                if (firstButton) firstButton.focus();
            }
        }
    });
}

// ========================================
// NUMPAD
// ========================================

function initNumpad() {
    const container = document.getElementById('numpadContainer');
    if (!container) {
        console.error('❌ Container numpadContainer non trouvé');
        return;
    }
    
    // Créer le numpad intégré
    numpad = config.createLoginNumpad(container, {
        maxLength: 4,
        onInput: (value) => {
            currentPin = value;
            updatePinDisplay(value);
            
            // Si 4 chiffres, valider automatiquement
            if (value.length === 4) {
                setTimeout(() => handlePinSubmit(value), 100);
            }
        }
    });
}

// ========================================
// AFFICHAGE PIN
// ========================================

function updatePinDisplay(pin) {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`pin${i}`);
        if (dot) {
            if (i <= pin.length) {
                dot.textContent = '•';
                dot.classList.add('filled');
            } else {
                dot.textContent = '';
                dot.classList.remove('filled');
            }
        }
    }
}

// ========================================
// VALIDATION PIN
// ========================================

async function handlePinSubmit(pin) {
    // Vérifier si verrouillé
    if (state.isLocked) {
        config.notify.warning(config.LOGIN_CONFIG.messages.tooManyAttempts);
        numpad.clear();
        currentPin = '';
        updatePinDisplay('');
        return;
    }
    
    // Vérifier qu'un utilisateur est sélectionné
    if (!selectedUserId) {
        config.notify.warning(config.LOGIN_CONFIG.messages.selectUser);
        numpad.clear();
        currentPin = '';
        updatePinDisplay('');
        return;
    }
    
    try {
        // Désactiver le numpad pendant la vérification
        numpad.setDisabled(true);
        
        // Tenter l'authentification
        const isValid = await authenticateUser(selectedUserId, pin);
        
        if (isValid) {
            // Succès
            handleLoginSuccess();
        } else {
            // Échec
            handleLoginFailure();
        }
    } catch (error) {
        console.error('❌ Erreur authentification:', error);
        config.notify.error(config.LOGIN_CONFIG.messages.error);
        resetPinInput();
    } finally {
        // Réactiver le numpad
        if (!state.isLocked) {
            numpad.setDisabled(false);
        }
    }
}

// ========================================
// GESTION SUCCÈS/ÉCHEC
// ========================================

function handleLoginSuccess() {
    console.log('✅ Connexion réussie');
    
    // Animation de succès
    animateSuccess();
    config.notify.success(config.LOGIN_CONFIG.messages.success);
    
    // Sauvegarder l'authentification
    const remember = document.getElementById('remember').checked;
    saveAuthentication(selectedUserData, remember);
    
    // Désactiver les contrôles
    if (userDropdown) userDropdown.disable();
    if (numpad) numpad.setDisabled(true);
    
    // Redirection après délai
    setTimeout(() => {
        window.location.href = config.LOGIN_CONFIG.successRedirect;
    }, 1500);
}

function handleLoginFailure() {
    incrementAttempts();
    
    const remaining = config.LOGIN_CONFIG.maxAttempts - state.attempts;
    
    if (state.isLocked) {
        // Verrouillé
        config.notify.error(config.LOGIN_CONFIG.messages.tooManyAttempts);
        
        // Désactiver les contrôles
        if (userDropdown) userDropdown.disable();
        if (numpad) numpad.setDisabled(true);
        
        // Réactiver après le délai
        setTimeout(() => {
            if (userDropdown) userDropdown.enable();
            if (numpad) numpad.setDisabled(false);
            config.notify.info('Vous pouvez réessayer');
        }, config.LOGIN_CONFIG.lockDuration);
    } else {
        // Pas encore verrouillé
        config.notify.error(
            `${config.LOGIN_CONFIG.messages.invalidCode}. ${config.LOGIN_CONFIG.messages.attemptsRemaining(remaining)}`
        );
    }
    
    // Animation d'erreur
    animateError();
    
    // Reset PIN
    resetPinInput();
}

function resetPinInput() {
    if (numpad) {
        numpad.clear();
    }
    currentPin = '';
    updatePinDisplay('');
}

// ========================================
// EXPORTS
// ========================================

export { handlePinSubmit };