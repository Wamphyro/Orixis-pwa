// ========================================
// LOGIN.UI.JS - Orchestrateur UI
// Chemin: modules/login/login.ui.js
// ========================================

import config from './login.config.js';
import { authenticateUser, saveAuthentication } from './login.auth.js';
import { chargerTousLesUtilisateurs } from '../../src/services/firebase.service.js';
import { state, incrementAttempts, animateError, animateSuccess } from './login.main.js';
import { Numpad } from '../../src/components/ui/numpad/numpad.component.js';

// ========================================
// COMPOSANTS UI
// ========================================

let userDropdown = null;
let numpad = null;
let currentPin = '';
let selectedUser = null;

// ========================================
// INITIALISATION
// ========================================

export async function initLoginUI() {
    // Charger les utilisateurs
    const users = await loadUsers();
    
    if (!users || users.length === 0) {
        config.notify.error(config.LOGIN_CONFIG.messages.noUsers);
        throw new Error('Aucun utilisateur trouvé');
    }
    
    // Initialiser les composants
    initUserDropdown(users);
    initNumpad();
    updatePinDisplay('');
}

// ========================================
// CHARGEMENT UTILISATEURS
// ========================================

async function loadUsers() {
    try {
        const users = await chargerTousLesUtilisateurs();
        
        // Trier par nom
        return users.sort((a, b) => {
            const nameA = `${a.prenom} ${a.nom}`.toLowerCase();
            const nameB = `${b.prenom} ${b.nom}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });
    } catch (error) {
        console.error('❌ Erreur chargement utilisateurs:', error);
        throw error;
    }
}

// ========================================
// DROPDOWN UTILISATEURS
// ========================================

function initUserDropdown(users) {
    const container = document.getElementById('userDropdown');
    
    const options = users.map(user => ({
        value: user.id,
        label: `${user.prenom} ${user.nom}`,
        icon: getIconForRole(user.role)
    }));
    
    userDropdown = config.createUserDropdown(container, {
        options,
        onChange: (userId) => {
            selectedUser = users.find(u => u.id === userId);
            console.log('👤 Utilisateur sélectionné:', selectedUser);
            
            // Reset PIN
            resetPin();
            
            // Focus numpad
            const firstBtn = document.querySelector('.login-numpad-btn');
            if (firstBtn) firstBtn.focus();
        }
    });
}

function getIconForRole(role) {
    const icons = {
        admin: '👤',
        manager: '💼',
        technicien: '🔧',
        default: '👥'
    };
    return icons[role] || icons.default;
}

// ========================================
// NUMPAD
// ========================================

function initNumpad() {
    const container = document.getElementById('numpadContainer');
    
    // Utiliser le composant Numpad autonome
    numpad = new Numpad({
        title: 'Code d\'accès',
        maxLength: 4,
        allowDecimal: false,
        allowNegative: false,
        autoSubmitLength: 4,
        showDisplay: false,
        showCancel: false,
        showSubmit: false,
        showClear: true,
        theme: 'login',
        onInput: (value) => {
            currentPin = value;
            updatePinDisplay(value);
        },
        onSubmit: (value) => {
            handlePinSubmit(value);
        }
    });
    
    // L'insérer dans le container
    container.innerHTML = '';
    numpad.open();
    
    // Déplacer le contenu du numpad dans notre container
    const numpadContent = document.querySelector(`#${numpad.id} .numpad-buttons`);
    if (numpadContent) {
        container.appendChild(numpadContent);
    }
}

// ========================================
// AFFICHAGE PIN
// ========================================

function updatePinDisplay(pin) {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
        if (index < pin.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });
}

// ========================================
// VALIDATION PIN
// ========================================

async function handlePinSubmit(pin) {
    // Vérifications
    if (state.isLocked) {
        config.notify.warning(config.LOGIN_CONFIG.messages.tooManyAttempts);
        resetPin();
        return;
    }
    
    if (!selectedUser) {
        config.notify.warning(config.LOGIN_CONFIG.messages.selectUser);
        resetPin();
        return;
    }
    
    try {
        // Désactiver les contrôles
        setControlsDisabled(true);
        
        // Authentifier
        const isValid = await authenticateUser(selectedUser.id, pin);
        
        if (isValid) {
            handleSuccess();
        } else {
            handleFailure();
        }
    } catch (error) {
        console.error('❌ Erreur authentification:', error);
        config.notify.error(config.LOGIN_CONFIG.messages.error);
        resetPin();
        setControlsDisabled(false);
    }
}

// ========================================
// GESTION SUCCÈS/ÉCHEC
// ========================================

async function handleSuccess() {
    console.log('✅ Connexion réussie');
    
    // Animation
    animateSuccess();
    config.notify.success(config.LOGIN_CONFIG.messages.success);
    
    // Sauvegarder
    const remember = document.getElementById('remember').checked;
    await saveAuthentication(selectedUser, remember);  // AWAIT ajouté
    
    // Redirection
    setTimeout(() => {
        window.location.href = config.LOGIN_CONFIG.successRedirect;
    }, 1500);
}

function handleFailure() {
    const remaining = incrementAttempts();
    
    if (state.isLocked) {
        // Verrouillé
        config.notify.error(config.LOGIN_CONFIG.messages.tooManyAttempts);
        setControlsDisabled(true);
        
        // Réactiver après le délai
        setTimeout(() => {
            setControlsDisabled(false);
        }, config.LOGIN_CONFIG.lockDuration);
    } else {
        // Pas encore verrouillé
        config.notify.error(
            `${config.LOGIN_CONFIG.messages.invalidCode}. ${config.LOGIN_CONFIG.messages.attemptsRemaining(remaining)}`
        );
        setControlsDisabled(false);
    }
    
    // Animation et reset
    animateError();
    resetPin();
}

// ========================================
// UTILITAIRES
// ========================================

function resetPin() {
    currentPin = '';
    if (numpad) numpad.clear();
    updatePinDisplay('');
}

function setControlsDisabled(disabled) {
    // DropdownList utilise disable/enable
    if (userDropdown) {
        if (disabled) {
            userDropdown.disable();
        } else {
            userDropdown.enable();
        }
    }
    
    // Le composant Numpad n'a pas de méthode setDisabled
    // On désactive les boutons directement
    if (numpad && numpad.elements.container) {
        const buttons = numpad.elements.container.querySelectorAll('.numpad-btn');
        buttons.forEach(btn => btn.disabled = disabled);
    }
}