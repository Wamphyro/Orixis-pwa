// ========================================
// COMPTE.CONFIG.JS - Configuration UI locale du module
// Chemin: modules/compte/compte.config.js
//
// DESCRIPTION:
// Configuration UI complète pour le module compte utilisateur
// Factories pour créer tous les composants UI
//
// ARCHITECTURE:
// - Ce fichier crée les factories pour tous les composants
// - Les orchestrateurs utiliseront ces factories
// - Communication uniquement par callbacks
// ========================================

import { 
    Button,
    Badge,
    AppHeader,
    DropdownList,
    Modal,
    modalManager,
    Dialog,
    notify,
    Numpad
} from '../../src/components/index.js';

// ========================================
// FACTORY : HEADER DU MODULE
// ========================================

export function createCompteHeader(userData) {
    return new AppHeader({
        container: 'body',
        title: '👤 Mon Compte',
        subtitle: 'Gestion de votre profil',
        backUrl: '../home/home.html',
        user: userData,
        buttonClasses: {
            back: 'btn on-dark btn-pill',
            logout: 'btn btn-danger btn-sm text-white',
            userSection: 'header-user-section'
        },
        onLogout: async () => {
            console.log('🔴 Bouton déconnexion cliqué !');
            const confirme = await Dialog.confirm(
                'Voulez-vous vraiment vous déconnecter ?',
                'Déconnexion'
            );
            if (confirme) {
                localStorage.removeItem('sav_auth');
                localStorage.removeItem('sav_user_permissions');
                window.location.href = '../../index.html';
            }
        }
    });
}

// ========================================
// FACTORY : DROPDOWN MAGASIN
// ========================================

export function createMagasinDropdown(container, options = {}) {
    return new DropdownList({
        container,
        placeholder: 'Sélectionner un magasin',
        searchable: true,
        size: 'medium',
        showIcons: true,
        ...options
    });
}

// ========================================
// FACTORY : BADGE GROUPE
// ========================================

export function createGroupeBadge(groupe, options = {}) {
    return new Badge({
        text: groupe.nom,
        icon: groupe.icon,
        size: 'large',
        variant: 'custom',
        customColor: groupe.couleur,
        ...options
    });
}

// ========================================
// FACTORY : NUMPAD
// ========================================

export function createPinNumpad(container, options = {}) {
    return new Numpad({
        container,
        maxLength: 4,
        allowDecimal: false,
        showDisplay: false,
        showCancel: false,
        showSubmit: false,
        showClear: true,
        autoSubmitLength: 4,
        ...options
    });
}

// ========================================
// FACTORY : BOUTONS DU MODULE
// ========================================

export function createButton(type, options = {}) {
    const configs = {
        // Boutons spécifiques compte
        modifierPin: {
            text: '🔐 Modifier',
            variant: 'secondary',
            size: 'sm'
        },
        validerPin: {
            text: '✅ Valider',
            variant: 'primary',
            pill: true
        },
        annuler: {
            text: 'Annuler',
            variant: 'ghost',
            pill: true
        },
        basculerMagasin: {
            text: 'Basculer',
            variant: 'primary',
            size: 'sm'
        }
    };
    
    const config = configs[type] || configs.primary;
    
    return new Button({
        ...config,
        ...options
    });
}

// ========================================
// CONFIG : CLASSES CSS
// ========================================

export const CSS_CLASSES = {
    section: 'compte-section',
    sectionHeader: 'compte-section-header',
    sectionContent: 'compte-section-content',
    infoGrid: 'info-grid',
    badge: 'groupe-badge',
    magasinCard: 'magasin-card',
    magasinCardActive: 'magasin-card active',
    permissionItem: 'permission-item',
    permissionGranted: 'permission-granted',
    permissionDenied: 'permission-denied'
};

// ========================================
// CONFIG : TEMPLATES HTML
// ========================================

export const HTML_TEMPLATES = {
    // Template pour une carte magasin
    magasinCard: (magasin, isActive) => `
        <div class="${isActive ? CSS_CLASSES.magasinCardActive : CSS_CLASSES.magasinCard}">
            <div class="magasin-header">
                <h4>🏪 ${magasin.code}</h4>
                ${isActive ? '<span class="badge-active">Actif</span>' : ''}
                ${magasin.responsable ? '<span class="badge-resp">⭐ Responsable</span>' : ''}
            </div>
            <div class="magasin-info">
                <p class="magasin-nom">${magasin.nom || magasin.code}</p>
                ${magasin.permissions?.length > 0 ? `
                    <div class="magasin-permissions">
                        <strong>Permissions spéciales :</strong>
                        <ul>
                            ${magasin.permissions.map(p => `<li>• ${p}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
            ${!isActive ? `
                <button class="btn btn-primary btn-sm" onclick="basculerMagasin('${magasin.code}')">
                    🔄 Basculer vers ce magasin
                </button>
            ` : ''}
        </div>
    `,
    
    // Template pour une permission
    permissionItem: (label, granted, details = '') => `
        <div class="${CSS_CLASSES.permissionItem} ${granted ? CSS_CLASSES.permissionGranted : CSS_CLASSES.permissionDenied}">
            <span class="permission-icon">${granted ? '✅' : '❌'}</span>
            <span class="permission-label">${label}</span>
            ${details ? `<span class="permission-details">${details}</span>` : ''}
        </div>
    `
};

// ========================================
// CONFIG : MODALES
// ========================================

export function registerCompteModals() {
    const modalsConfig = [
        { 
            id: 'modalModifierPin', 
            options: { 
                closeOnOverlayClick: false, 
                closeOnEscape: true 
            } 
        }
    ];
    
    modalsConfig.forEach(({ id, options }) => {
        const modalElement = document.getElementById(id);
        if (modalElement) {
            modalManager.register(id, options);
        }
    });
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    // Factories
    createCompteHeader,
    createMagasinDropdown,
    createGroupeBadge,
    createPinNumpad,
    createButton,
    
    // Configs
    CSS_CLASSES,
    HTML_TEMPLATES,
    registerCompteModals,
    
    // Components directs
    Button,
    Badge,
    Modal,
    Dialog,
    notify,
    modalManager
};