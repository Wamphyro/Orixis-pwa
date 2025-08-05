// ========================================
// SUBVENTIONS.MAIN.JS - Point d'entrée principal
// Chemin: modules/subventions/subventions.main.js
//
// DESCRIPTION:
// Point d'entrée du module subventions
// Gère l'authentification, le routing et l'initialisation
// ========================================

import { authService } from '../../services/auth.service.js';
import { navigationService } from '../../services/navigation.service.js';
import { subventionsConfig } from './subventions.config.js';
import { subventionsList } from './subventions.list.js';
import { subventionsCreate } from './subventions.create.js';
import { subventionsDetail } from './subventions.detail.js';
import { subventionsDocuments } from './subventions.documents.js';
import { subventionsWorkflow } from './subventions.workflow.js';
import { subventionsAlerts } from './subventions.alerts.js';

class SubventionsMain {
    constructor() {
        this.currentView = null;
        this.currentDossierId = null;
        this.permissions = null;
        this.initialized = false;
        
        // Routes du module
        this.routes = {
            'list': () => this.showList(),
            'create': () => this.showCreate(),
            'detail/:id': (id) => this.showDetail(id),
            'edit/:id': (id) => this.showEdit(id),
            'documents/:id': (id) => this.showDocuments(id),
            'workflow/:id': (id) => this.showWorkflow(id),
            'alerts': () => this.showAlerts()
        };
    }
    
    // ========================================
    // INITIALISATION
    // ========================================
    
    async init() {
        try {
            // Vérifier l'authentification
            const isAuthenticated = await this.checkAuth();
            if (!isAuthenticated) {
                window.location.href = '/login';
                return;
            }
            
            // Charger les permissions
            await this.loadPermissions();
            
            // Initialiser la navigation
            this.initNavigation();
            
            // Charger les styles
            this.loadStyles();
            
            // Rendre le layout principal
            this.renderLayout();
            
            // Router vers la vue par défaut
            this.route(window.location.hash || '#subventions/list');
            
            this.initialized = true;
            
        } catch (error) {
            console.error('Erreur initialisation module subventions:', error);
            this.showError(error);
        }
    }
    
    async checkAuth() {
        const user = await authService.getCurrentUser();
        if (!user) return false;
        
        // Vérifier les rôles autorisés
        const authorizedRoles = ['admin', 'technicien', 'commercial'];
        return authorizedRoles.includes(user.role);
    }
    
    async loadPermissions() {
        const user = await authService.getCurrentUser();
        
        this.permissions = {
            canCreate: ['admin', 'technicien'].includes(user.role),
            canEdit: ['admin', 'technicien'].includes(user.role),
            canDelete: user.role === 'admin',
            canValidate: ['admin', 'technicien'].includes(user.role),
            canExport: true,
            userId: user.uid,
            userName: user.displayName || user.email,
            userRole: user.role,
            magasin: user.magasin || '9PAR'
        };
    }
    
    loadStyles() {
        if (!document.getElementById('subventions-styles')) {
            const link = document.createElement('link');
            link.id = 'subventions-styles';
            link.rel = 'stylesheet';
            link.href = '/modules/subventions/subventions.css';
            document.head.appendChild(link);
        }
    }
    
    // ========================================
    // NAVIGATION ET ROUTING
    // ========================================
    
    initNavigation() {
        // Écouter les changements de hash
        window.addEventListener('hashchange', () => {
            this.route(window.location.hash);
        });
        
        // Gérer le bouton retour
        window.addEventListener('popstate', () => {
            this.route(window.location.hash);
        });
    }
    
    route(hash) {
        // Parser le hash
        const parts = hash.replace('#subventions/', '').split('/');
        const view = parts[0] || 'list';
        const id = parts[1] || null;
        
        // Trouver la route correspondante
        let routeFound = false;
        
        for (const [pattern, handler] of Object.entries(this.routes)) {
            if (pattern.includes(':id')) {
                const basePattern = pattern.replace('/:id', '');
                if (view === basePattern && id) {
                    handler(id);
                    routeFound = true;
                    break;
                }
            } else if (pattern === view) {
                handler();
                routeFound = true;
                break;
            }
        }
        
        if (!routeFound) {
            this.showList();
        }
    }
    
    navigate(path) {
        window.location.hash = `#subventions/${path}`;
    }
    
    // ========================================
    // RENDU DU LAYOUT
    // ========================================
    
    renderLayout() {
        const app = document.getElementById('app');
        if (!app) return;
        
        app.innerHTML = `
            <div class="subventions-module">
                <!-- Header -->
                <header class="subventions-header">
                    <div class="header-content">
                        <div class="header-left">
                            <button class="btn-back" id="btn-back">
                                <i class="icon-arrow-left"></i>
                            </button>
                            <h1 class="header-title">
                                <i class="icon-folder"></i>
                                <span id="header-title">Subventions</span>
                            </h1>
                        </div>
                        
                        <div class="header-center">
                            <nav class="header-nav">
                                <a href="#subventions/list" class="nav-link" data-view="list">
                                    <i class="icon-list"></i>
                                    <span>Liste</span>
                                </a>
                                ${this.permissions.canCreate ? `
                                    <a href="#subventions/create" class="nav-link" data-view="create">
                                        <i class="icon-plus"></i>
                                        <span>Nouveau</span>
                                    </a>
                                ` : ''}
                                <a href="#subventions/alerts" class="nav-link" data-view="alerts">
                                    <i class="icon-bell"></i>
                                    <span>Alertes</span>
                                    <span class="badge-count" id="alerts-count"></span>
                                </a>
                            </nav>
                        </div>
                        
                        <div class="header-right">
                            <div class="header-user">
                                <span class="user-name">${this.permissions.userName}</span>
                                <span class="user-role">${this.permissions.userRole}</span>
                            </div>
                            <button class="btn-menu" id="btn-menu">
                                <i class="icon-menu"></i>
                            </button>
                        </div>
                    </div>
                </header>
                
                <!-- Breadcrumb -->
                <div class="subventions-breadcrumb" id="breadcrumb">
                    <a href="#subventions/list">Subventions</a>
                </div>
                
                <!-- Content -->
                <main class="subventions-content" id="subventions-content">
                    <!-- Le contenu sera injecté ici -->
                </main>
                
                <!-- Menu latéral -->
                <aside class="subventions-sidebar" id="sidebar">
                    <div class="sidebar-header">
                        <h3>Actions rapides</h3>
                        <button class="btn-close" id="btn-close-sidebar">×</button>
                    </div>
                    <div class="sidebar-content">
                        <button class="sidebar-action" data-action="export">
                            <i class="icon-download"></i>
                            Exporter la liste
                        </button>
                        <button class="sidebar-action" data-action="import">
                            <i class="icon-upload"></i>
                            Importer des dossiers
                        </button>
                        <hr>
                        <button class="sidebar-action" data-action="stats">
                            <i class="icon-chart"></i>
                            Statistiques
                        </button>
                        <button class="sidebar-action" data-action="settings">
                            <i class="icon-settings"></i>
                            Paramètres
                        </button>
                    </div>
                </aside>
            </div>
        `;
        
        this.attachLayoutEvents();
        this.updateAlertsCount();
    }
    
    attachLayoutEvents() {
        // Bouton retour
        document.getElementById('btn-back')?.addEventListener('click', () => {
            window.history.back();
        });
        
        // Menu
        document.getElementById('btn-menu')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.toggle('active');
        });
        
        document.getElementById('btn-close-sidebar')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.remove('active');
        });
        
        // Actions sidebar
        document.querySelectorAll('.sidebar-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleSidebarAction(action);
            });
        });
        
        // Navigation active
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }
    
    // ========================================
    // GESTION DES VUES
    // ========================================
    
    async showList() {
        try {
            this.setView('list');
            this.updateBreadcrumb(['Liste des dossiers']);
            
            const content = document.getElementById('subventions-content');
            content.innerHTML = '<div class="loading">Chargement...</div>';
            
            // Nettoyer la vue précédente
            if (this.currentView && this.currentView.destroy) {
                this.currentView.destroy();
            }
            
            // Initialiser la liste
            content.innerHTML = '<div id="subventions-list-container"></div>';
            await subventionsList.init();
            
            this.currentView = subventionsList;
            
        } catch (error) {
            console.error('Erreur affichage liste:', error);
            this.showError(error);
        }
    }
    
    async showCreate() {
        if (!this.permissions.canCreate) {
            this.showError('Vous n\'avez pas les droits pour créer un dossier');
            return;
        }
        
        try {
            this.setView('create');
            this.updateBreadcrumb(['Nouveau dossier']);
            
            const content = document.getElementById('subventions-content');
            content.innerHTML = '<div id="subventions-create-container"></div>';
            
            // Initialiser la création
            await subventionsCreate.init(this.permissions);
            
            this.currentView = subventionsCreate;
            
        } catch (error) {
            console.error('Erreur création dossier:', error);
            this.showError(error);
        }
    }
    
    async showDetail(dossierId) {
        try {
            this.setView('detail');
            this.currentDossierId = dossierId;
            
            const content = document.getElementById('subventions-content');
            content.innerHTML = '<div class="loading">Chargement du dossier...</div>';
            
            // Nettoyer la vue précédente
            if (this.currentView && this.currentView.destroy) {
                this.currentView.destroy();
            }
            
            // Initialiser le détail
            content.innerHTML = '<div id="subventions-detail-container"></div>';
            await subventionsDetail.init(dossierId, this.permissions);
            
            this.currentView = subventionsDetail;
            
        } catch (error) {
            console.error('Erreur affichage détail:', error);
            this.showError(error);
        }
    }
    
    async showEdit(dossierId) {
        if (!this.permissions.canEdit) {
            this.showError('Vous n\'avez pas les droits pour modifier un dossier');
            return;
        }
        
        // Réutiliser la vue détail en mode édition
        await this.showDetail(dossierId);
        if (this.currentView && this.currentView.enableEditMode) {
            this.currentView.enableEditMode();
        }
    }
    
    async showDocuments(dossierId) {
        try {
            this.setView('documents');
            this.currentDossierId = dossierId;
            
            const content = document.getElementById('subventions-content');
            content.innerHTML = '<div id="subventions-documents-container"></div>';
            
            await subventionsDocuments.init(dossierId, this.permissions);
            
            this.currentView = subventionsDocuments;
            
        } catch (error) {
            console.error('Erreur affichage documents:', error);
            this.showError(error);
        }
    }
    
    async showWorkflow(dossierId) {
        try {
            this.setView('workflow');
            this.currentDossierId = dossierId;
            
            const content = document.getElementById('subventions-content');
            content.innerHTML = '<div id="subventions-workflow-container"></div>';
            
            await subventionsWorkflow.init(dossierId, this.permissions);
            
            this.currentView = subventionsWorkflow;
            
        } catch (error) {
            console.error('Erreur affichage workflow:', error);
            this.showError(error);
        }
    }
    
    async showAlerts() {
        try {
            this.setView('alerts');
            this.updateBreadcrumb(['Alertes et rappels']);
            
            const content = document.getElementById('subventions-content');
            content.innerHTML = '<div id="subventions-alerts-container"></div>';
            
            await subventionsAlerts.init(this.permissions);
            
            this.currentView = subventionsAlerts;
            
        } catch (error) {
            console.error('Erreur affichage alertes:', error);
            this.showError(error);
        }
    }
    
    // ========================================
    // ACTIONS SIDEBAR
    // ========================================
    
    async handleSidebarAction(action) {
        document.getElementById('sidebar')?.classList.remove('active');
        
        switch (action) {
            case 'export':
                await this.exportData();
                break;
            case 'import':
                await this.importData();
                break;
            case 'stats':
                await this.showStats();
                break;
            case 'settings':
                await this.showSettings();
                break;
        }
    }
    
    async exportData() {
        if (this.currentView && this.currentView.exportData) {
            await this.currentView.exportData();
        } else {
            const toast = subventionsConfig.factories.Toast({
                type: 'info',
                message: 'Export disponible uniquement depuis la liste'
            });
            toast.show();
        }
    }
    
    async importData() {
        // TODO: Implémenter l'import
        const toast = subventionsConfig.factories.Toast({
            type: 'info',
            message: 'Fonctionnalité d\'import à venir'
        });
        toast.show();
    }
    
    async showStats() {
        // TODO: Implémenter les statistiques
        const modal = subventionsConfig.factories.Modal({
            title: 'Statistiques',
            content: '<div class="stats-placeholder">Statistiques à venir...</div>'
        });
        modal.open();
    }
    
    async showSettings() {
        // TODO: Implémenter les paramètres
        const modal = subventionsConfig.factories.Modal({
            title: 'Paramètres',
            content: '<div class="settings-placeholder">Paramètres à venir...</div>'
        });
        modal.open();
    }
    
    // ========================================
    // UTILITAIRES
    // ========================================
    
    setView(view) {
        this.currentView = view;
        
        // Mettre à jour la navigation active
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === view) {
                link.classList.add('active');
            }
        });
        
        // Mettre à jour le titre
        const titles = {
            'list': 'Liste des dossiers',
            'create': 'Nouveau dossier',
            'detail': 'Détail du dossier',
            'documents': 'Documents',
            'workflow': 'Workflow',
            'alerts': 'Alertes et rappels'
        };
        
        document.getElementById('header-title').textContent = titles[view] || 'Subventions';
    }
    
    updateBreadcrumb(items = []) {
        const breadcrumb = document.getElementById('breadcrumb');
        if (!breadcrumb) return;
        
        const base = '<a href="#subventions/list">Subventions</a>';
        const parts = [base, ...items.map(item => `<span>${item}</span>`)];
        
        breadcrumb.innerHTML = parts.join(' <span class="separator">›</span> ');
    }
    
    async updateAlertsCount() {
        try {
            // TODO: Récupérer le nombre réel d'alertes
            const count = 5; // Temporaire
            
            const badge = document.getElementById('alerts-count');
            if (badge) {
                badge.textContent = count > 0 ? count : '';
                badge.style.display = count > 0 ? 'block' : 'none';
            }
        } catch (error) {
            console.error('Erreur mise à jour alertes:', error);
        }
    }
    
    showError(error) {
        const content = document.getElementById('subventions-content');
        if (content) {
            content.innerHTML = `
                <div class="error-container">
                    <i class="icon-alert-circle"></i>
                    <h2>Une erreur est survenue</h2>
                    <p>${error.message || error}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Rafraîchir la page
                    </button>
                </div>
            `;
        }
    }
    
    // ========================================
    // NETTOYAGE
    // ========================================
    
    destroy() {
        // Nettoyer la vue courante
        if (this.currentView && this.currentView.destroy) {
            this.currentView.destroy();
        }
        
        // Retirer les event listeners
        window.removeEventListener('hashchange', this.route);
        window.removeEventListener('popstate', this.route);
        
        // Nettoyer le DOM
        const app = document.getElementById('app');
        if (app) {
            app.innerHTML = '';
        }
    }
}

// Initialiser le module au chargement
document.addEventListener('DOMContentLoaded', () => {
    window.subventionsMain = new SubventionsMain();
    window.subventionsMain.init();
});

// Export pour utilisation externe
export const subventionsMain = window.subventionsMain;

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default SubventionsMain;