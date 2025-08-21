// ========================================
// ADMIN.CONFIG.JS - Configuration UI locale du module
// Chemin: modules/admin/admin.config.js
//
// DESCRIPTION:
// Configuration UI complète pour le module administration
// Factories pour créer tous les composants UI
// ========================================

import { 
    Button,
    Badge,
    AppHeader,
    DataTable,
    Modal,
    modalManager,
    Dialog,
    notify
} from '../../src/components/index.js';

// ========================================
// FACTORY : HEADER DU MODULE
// ========================================

export function createAdminHeader(userData) {
    return new AppHeader({
        container: 'body',
        title: '👑 Administration',
        subtitle: 'Gestion des utilisateurs et permissions',
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
                window.location.href = '../login/login.html';
            }
        }
    });
}

// ========================================
// FACTORY : DATATABLE UTILISATEURS
// ========================================

export function createUsersTable(container, options = {}) {
    return new DataTable({
        container,
        features: {
            sort: true,
            search: false, // On gère la recherche nous-mêmes
            pagination: true,
            selection: false
        },
        pagination: {
            itemsPerPage: 20,
            pageSizeOptions: [10, 20, 50]
        },
        messages: {
            noData: 'Aucun utilisateur trouvé',
            loading: 'Chargement des utilisateurs...'
        },
        ...options
    });
}

// ========================================
// FACTORY : BADGES
// ========================================

export function createGroupeBadge(groupe, options = {}) {
    return new Badge({
        text: groupe.nom,
        icon: groupe.icon,
        size: 'medium',
        variant: 'custom',
        customColor: groupe.couleur,
        ...options
    });
}

export function createRoleBadge(role) {
    const configs = {
        technicien: { text: 'Technicien', variant: 'info' },
        responsable: { text: 'Responsable', variant: 'warning' },
        admin: { text: 'Admin', variant: 'danger' }
    };
    
    const config = configs[role] || configs.technicien;
    
    return new Badge({
        size: 'small',
        ...config
    });
}

// ========================================
// CONFIG : PERMISSIONS DISPONIBLES
// ========================================

export const PERMISSIONS_CONFIG = {
    pages: {
        interventions: {
            nom: 'Interventions',
            icon: '🔧',
            actions: ['view', 'create', 'edit', 'delete', 'export']
        },
        commandes: {
            nom: 'Commandes',
            icon: '📦',
            actions: ['view', 'create', 'edit', 'delete', 'export']
        },
        'decompte-mutuelle': {
            nom: 'Décomptes Mutuelle',
            icon: '💊',
            actions: ['view', 'create', 'edit', 'delete', 'export']
        },
        'decompte-secu': {
            nom: 'Décomptes Sécu',
            icon: '🏥',
            actions: ['view', 'create', 'edit', 'delete', 'export']
        },
        'operations-bancaires': {
            nom: 'Opérations Bancaires',
            icon: '💰',
            actions: ['view', 'export']
        },
        clients: {
            nom: 'Clients',
            icon: '👥',
            actions: ['view', 'create', 'edit', 'delete', 'export']
        }
    },
    
    fonctionnalites: {
        voir_tous_utilisateurs: 'Voir tous les utilisateurs',
        creer_utilisateurs: 'Créer des utilisateurs',
        modifier_utilisateurs: 'Modifier les utilisateurs',
        supprimer_utilisateurs: 'Supprimer des utilisateurs',
        modifier_tous_codes_pin: 'Modifier tous les codes PIN',
        acces_tous_magasins: 'Accès à tous les magasins',
        gerer_parametres_magasins: 'Gérer les paramètres magasins',
        voir_statistiques_globales: 'Voir les statistiques globales',
        voir_statistiques_magasin: 'Voir les statistiques du magasin',
        exporter_donnees_globales: 'Exporter les données globales',
        gerer_parametres_systeme: 'Gérer les paramètres système'
    }
};

// ========================================
// CONFIG : TEMPLATES HTML
// ========================================

export const HTML_TEMPLATES = {
    // Template carte groupe
    groupeCard: (groupe) => `
        <div class="groupe-card" data-id="${groupe.id}">
            <div class="groupe-header" style="background: ${groupe.couleur}20; border-left: 4px solid ${groupe.couleur}">
                <h3>
                    <span class="groupe-icon">${groupe.icon}</span>
                    ${groupe.nom}
                </h3>
                <div class="groupe-actions">
                    <button class="btn-icon" onclick="editerGroupe('${groupe.id}')" title="Modifier">
                        ✏️
                    </button>
                    <button class="btn-icon" onclick="supprimerGroupe('${groupe.id}')" title="Supprimer">
                        🗑️
                    </button>
                </div>
            </div>
            <div class="groupe-body">
                <p class="groupe-description">${groupe.description || 'Aucune description'}</p>
                <div class="groupe-stats">
                    <span>👤 ${groupe.membresCount || 0} membres</span>
                    <span>🔐 ${Object.keys(groupe.permissions?.pages || {}).length} pages</span>
                </div>
            </div>
        </div>
    `,
    
    // Template checkbox permission
    permissionCheckbox: (pageId, action, checked = false, disabled = false) => `
        <label class="permission-checkbox">
            <input type="checkbox" 
                   name="perm_${pageId}_${action}" 
                   value="${action}"
                   ${checked ? 'checked' : ''}
                   ${disabled ? 'disabled' : ''}>
            <span>${action.charAt(0).toUpperCase() + action.slice(1)}</span>
        </label>
    `,
    
    // Template ligne magasin
    magasinRow: (magasin, autorisations = {}) => `
        <div class="magasin-row">
            <div class="magasin-info">
                <strong>🏪 ${magasin.code}</strong>
                <span>${magasin.nom || magasin.code}</span>
            </div>
            <div class="magasin-options">
                <label class="checkbox-label">
                    <input type="checkbox" 
                           name="magasin_${magasin.code}_acces"
                           ${autorisations.acces ? 'checked' : ''}>
                    Accès
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" 
                           name="magasin_${magasin.code}_responsable"
                           ${autorisations.responsable ? 'checked' : ''}>
                    Responsable
                </label>
            </div>
        </div>
    `
};

// ========================================
// CONFIG : MODALES
// ========================================

export function registerAdminModals() {
    const modalsConfig = [
        { id: 'modalGroupe', options: { closeOnOverlayClick: false } },
        { id: 'modalUtilisateur', options: { closeOnOverlayClick: false } },
        { id: 'modalPage', options: { closeOnOverlayClick: false } }
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
    createAdminHeader,
    createUsersTable,
    createGroupeBadge,
    createRoleBadge,
    
    // Configs
    PERMISSIONS_CONFIG,
    HTML_TEMPLATES,
    registerAdminModals,
    
    // Components directs
    Button,
    Badge,
    Modal,
    Dialog,
    notify,
    modalManager
};