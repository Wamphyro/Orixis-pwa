// ========================================
// LOGIN.JS - Logique de connexion
// Chemin: modules/login/login.js
//
// DESCRIPTION:
// Module de gestion de la connexion avec code PIN
// ========================================

import { 
    initFirebase, 
    chargerTousLesUtilisateurs, 
    verifierCodePinUtilisateur, 
    getUtilisateurDetails 
} from '../../src/services/firebase.service.js';

import Numpad from '../../src/components/ui/numpad/numpad.component.js';

// ========================================
// VARIABLES GLOBALES
// ========================================

let pinCode = '';
let attempts = 0;
const MAX_ATTEMPTS = 3;
let utilisateursData = [];
let numpad = null;

// ========================================
// INITIALISATION
// ========================================

window.addEventListener('DOMContentLoaded', async () => {
    console.log('📄 DOM prêt - Module login');
    
    // Vérifier si déjà connecté
    if (checkAuth()) {
        window.location.href = '../home/home.html';
        return;
    }
    
    // Initialiser le numpad
    const numpadContainer = document.querySelector('.numpad');
    if (numpadContainer) {
        // Vider le container et créer le numpad
        numpadContainer.innerHTML = '';
        numpad = new Numpad({
            container: numpadContainer,
            maxLength: 4,
            allowDecimal: false,
            showDisplay: false,
            showCancel: false,
            showSubmit: false,
            showClear: true,
            autoSubmitLength: 4,
            onInput: (value) => {
                pinCode = value;
                updatePinDisplay();
                
                // Auto-validation à 4 chiffres
                if (value.length === 4) {
                    validatePin();
                }
            }
        });
        
        // Ouvrir le numpad
        numpad.open();
    }
    
    // Charger tous les utilisateurs
    try {
        showLoading(true);
        
        // Initialiser Firebase
        await initFirebase();
        
        // Charger TOUS les utilisateurs actifs
        utilisateursData = await chargerTousLesUtilisateurs();
        
        if (utilisateursData && utilisateursData.length > 0) {
            console.log('✅ Utilisateurs chargés:', utilisateursData.length);
            populateUtilisateurs();
        } else {
            throw new Error('Aucun utilisateur trouvé');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error);
        showError('Erreur de chargement des données');
    } finally {
        showLoading(false);
    }
});

// ========================================
// INTERFACE UTILISATEUR
// ========================================

// Afficher/cacher le chargement
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

// Remplir le select avec les utilisateurs
function populateUtilisateurs() {
    const select = document.getElementById('utilisateur');
    select.innerHTML = '<option value="">-- Choisir un utilisateur --</option>';
    
    // Trier par nom/prénom
    const utilisateursSorted = utilisateursData.sort((a, b) => {
        const nameA = `${a.prenom} ${a.nom}`.toLowerCase();
        const nameB = `${b.prenom} ${b.nom}`.toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    utilisateursSorted.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.prenom} ${user.nom}`;
        option.dataset.magasins = JSON.stringify(user.magasins || []);
        select.appendChild(option);
    });
}

// Mettre à jour l'affichage des points
function updatePinDisplay() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`pin${i}`);
        if (i <= pinCode.length) {
            dot.textContent = '•';
            dot.classList.add('filled');
        } else {
            dot.textContent = '';
            dot.classList.remove('filled');
        }
    }
}

// ========================================
// VALIDATION DU CODE PIN
// ========================================

async function validatePin() {
    if (pinCode.length !== 4) {
        showError('Veuillez entrer un code à 4 chiffres');
        pinCode = '';
        if (numpad) numpad.clear();
        updatePinDisplay();
        return;
    }
    
    const utilisateurId = document.getElementById('utilisateur').value;
    
    if (!utilisateurId) {
        showError('Veuillez sélectionner votre nom');
        pinCode = '';
        if (numpad) numpad.clear();
        updatePinDisplay();
        return;
    }
    
    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');
    
    // Reset messages
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
    
    let isValid = false;
    
    try {
        showLoading(true);
        // Vérifier le code personnel de l'utilisateur
        isValid = await verifierCodePinUtilisateur(utilisateurId, pinCode);
    } catch (error) {
        console.error('Erreur vérification:', error);
        showError('Erreur de vérification');
        pinCode = '';
        if (numpad) numpad.clear();
        updatePinDisplay();
        return;
    } finally {
        showLoading(false);
    }
    
    if (isValid) {
        // Connexion réussie
        successMsg.style.display = 'block';
        
        // Récupérer les infos complètes
        const userData = utilisateursData.find(u => u.id === utilisateurId);
        
        if (userData) {
            // Récupérer les détails complets si possible
            try {
                const userDetails = await getUtilisateurDetails(utilisateurId);
                if (userDetails) {
                    // Sauvegarder les permissions et autorisations
                    localStorage.setItem('sav_user_permissions', JSON.stringify({
                        id: userDetails.id,
                        nom: userDetails.nom,
                        prenom: userDetails.prenom,
                        role: userDetails.role || 'technicien',
                        pagesInterdites: userDetails.pagesInterdites || [],
                        autorisations: userDetails.autorisations || {}
                    }));
                }
            } catch (error) {
                console.error('Erreur récupération détails:', error);
            }
            
            // Sauvegarder l'authentification
            const remember = document.getElementById('remember').checked;
            const expiry = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
            
            // Déterminer le magasin par défaut
            let magasinParDefaut = userData.magasinParDefaut || userData.magasins[0];
            
            const authData = {
                authenticated: true,
                magasin: magasinParDefaut,
                magasins: userData.magasins || [],
                timestamp: Date.now(),
                expiry: expiry,
                collaborateur: {
                    id: userData.id,
                    prenom: userData.prenom,
                    nom: userData.nom,
                    role: userData.role || 'technicien'
                }
            };
            
            localStorage.setItem('sav_auth', JSON.stringify(authData));
            
            // Redirection vers home
            setTimeout(() => {
                window.location.href = '../home/home.html';
            }, 1000);
        }
        
    } else {
        // Échec
        attempts++;
        
        showError(`Code incorrect. ${MAX_ATTEMPTS - attempts} tentatives restantes.`);
        
        if (attempts >= MAX_ATTEMPTS) {
            showError(`Trop de tentatives. Veuillez attendre ${MAX_ATTEMPTS} minutes.`);
            disableNumpad(true);
            setTimeout(() => {
                attempts = 0;
                disableNumpad(false);
            }, MAX_ATTEMPTS * 60 * 1000);
        }
        
        // Reset le code
        pinCode = '';
        if (numpad) numpad.clear();
        updatePinDisplay();
        
        // Animation shake
        const container = document.querySelector('.login-container');
        container.classList.add('shake');
        setTimeout(() => {
            container.classList.remove('shake');
        }, 500);
    }
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

// Afficher une erreur
function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    
    // Masquer après 5 secondes
    setTimeout(() => {
        errorMsg.style.display = 'none';
    }, 5000);
}

// Activer/désactiver le clavier
function disableNumpad(disabled) {
    if (numpad) {
        if (disabled) {
            numpad.disable();
        } else {
            numpad.enable();
        }
    }
}

// Fonction de vérification d'authentification
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

// ========================================
// FONCTIONS GLOBALES POUR LE HTML
// ========================================

window.addDigit = function(digit) {
    if (numpad) {
        numpad.inputDigit(digit);
    }
};

window.deleteDigit = function() {
    if (numpad) {
        numpad.backspace();
    }
};

window.validatePin = validatePin;

// ========================================
// EXPORT
// ========================================

console.log('✅ Module login initialisé');