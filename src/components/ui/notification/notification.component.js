// ========================================
// NOTIFICATION.COMPONENT.JS - Système de notifications toast
// Chemin: src/components/ui/notification/notification.component.js
//
// DESCRIPTION:
// Système de notifications toast élégantes et animées
// Support de différents types et durées personnalisables
//
// MODIFIÉ le 01/02/2025:
// - Génération d'ID autonome harmonisée
// - 100% indépendant
//
// API PUBLIQUE:
// - success(message, title, options)
// - error(message, title, options)
// - warning(message, title, options)
// - info(message, title, options)
// - custom(options)
// - hide(id)
// - hideAll()
//
// EXEMPLE:
// notify.success('Opération réussie !');
// notify.error('Une erreur est survenue', 'Erreur');
// const id = notify.info('Chargement...', '', { duration: 0 });
// notify.hide(id);
// ========================================

export class NotificationManager {
    static instance = null;
    
    constructor() {
        if (NotificationManager.instance) {
            return NotificationManager.instance;
        }
        
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'notif-manager-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        this.container = null;
        this.notifications = new Map();
        this.init();
        NotificationManager.instance = this;
    }
    
    // ========================================
    // INITIALISATION ET CONFIGURATION
    // ========================================
    
    init() {
        // Créer le conteneur si inexistant
        if (!document.getElementById('notification-container')) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('notification-container');
        }
        
        // Charger les styles
        this.loadStyles();
        
        console.log('✅ NotificationManager initialisé:', this.id);
    }
    
    loadStyles() {
        // Vérifier si les styles sont déjà chargés
        if (document.getElementById('notification-styles')) {
            return;
        }
        
        // Créer le lien vers le fichier CSS
        const link = document.createElement('link');
        link.id = 'notification-styles';
        link.rel = 'stylesheet';
        link.href = '../src/components/ui/notification/notification.css';
        document.head.appendChild(link);
        
        console.log('📦 Notification styles chargés');
    }
    
    // ========================================
    // MÉTHODE PRINCIPALE SHOW
    // ========================================
    
    show(options) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 4000,
            showClose = true,
            showProgress = true,
            onClick = null
        } = options;
        
        // Générer un ID unique pour cette notification
        const notifId = Date.now() + Math.random();
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification ${type}`;
        notificationEl.dataset.id = notifId;
        
        const icon = this.getIcon(type);
        
        notificationEl.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                ${message ? `<div class="notification-message">${message}</div>` : ''}
            </div>
            ${showClose ? '<button class="notification-close">×</button>' : ''}
            ${showProgress && duration ? `<div class="notification-progress" style="animation-duration: ${duration}ms"></div>` : ''}
        `;
        
        // Ajouter au conteneur
        this.container.appendChild(notificationEl);
        this.notifications.set(notifId, notificationEl);
        
        // Gérer le clic
        if (onClick) {
            notificationEl.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notification-close')) {
                    onClick();
                    this.hide(notifId);
                }
            });
        }
        
        // Gérer le bouton de fermeture
        const closeBtn = notificationEl.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide(notifId);
            });
        }
        
        // Auto-hide après duration
        if (duration) {
            setTimeout(() => this.hide(notifId), duration);
        }
        
        return notifId;
    }
    
    hide(notifId) {
        const notification = this.notifications.get(notifId);
        if (!notification) return;
        
        notification.classList.add('hiding');
        
        setTimeout(() => {
            notification.remove();
            this.notifications.delete(notifId);
        }, 300);
    }
    
    hideAll() {
        this.notifications.forEach((notification, notifId) => {
            this.hide(notifId);
        });
    }
    
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '!',
            info: 'i'
        };
        return icons[type] || icons.info;
    }
}

// Instance unique
const manager = new NotificationManager();

// ========================================
// API PUBLIQUE
// ========================================

export const notify = {
    success: (message, title = '', options = {}) => {
        return manager.show({
            type: 'success',
            message,
            title,
            duration: 6000,
            ...options
        });
    },
    
    error: (message, title = '', options = {}) => {
        return manager.show({
            type: 'error',
            message,
            title,
            duration: 6000,
            ...options
        });
    },
    
    warning: (message, title = '', options = {}) => {
        return manager.show({
            type: 'warning',
            message,
            title,
            duration: 6000,
            ...options
        });
    },
    
    info: (message, title = '', options = {}) => {
        return manager.show({
            type: 'info',
            message,
            title,
            duration: 6000,
            ...options
        });
    },
    
    custom: (options) => {
        return manager.show(options);
    },
    
    hide: (notifId) => {
        manager.hide(notifId);
    },
    
    hideAll: () => {
        manager.hideAll();
    }
};

export default notify;