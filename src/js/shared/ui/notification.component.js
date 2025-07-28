// ========================================
// NOTIFICATION.COMPONENT.JS - Système de notifications toast
// ========================================
// Chemin: src/js/shared/ui/notification.component.js
//
// Version mise à jour : loadStyles() réactivé
// Charge maintenant : src/css/shared/ui/notification.css
// ========================================

export class NotificationManager {
    static instance = null;
    
    constructor() {
        if (NotificationManager.instance) {
            return NotificationManager.instance;
        }
        
        this.container = null;
        this.notifications = new Map();
        this.init();
        NotificationManager.instance = this;
    }
    
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
        
        console.log('✅ NotificationManager initialisé avec styles autonomes');
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
        link.href = '/src/css/shared/ui/notification.css';
        document.head.appendChild(link);
        
        console.log('✅ Notification styles chargés : /src/css/shared/ui/notification.css');
    }
    
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
        
        const id = Date.now() + Math.random();
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification ${type}`;
        notificationEl.dataset.id = id;
        
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
        this.notifications.set(id, notificationEl);
        
        // Gérer le clic
        if (onClick) {
            notificationEl.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notification-close')) {
                    onClick();
                    this.hide(id);
                }
            });
        }
        
        // Gérer le bouton de fermeture
        const closeBtn = notificationEl.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide(id);
            });
        }
        
        // Auto-hide après duration
        if (duration) {
            setTimeout(() => this.hide(id), duration);
        }
        
        return id;
    }
    
    hide(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        notification.classList.add('hiding');
        
        setTimeout(() => {
            notification.remove();
            this.notifications.delete(id);
        }, 300);
    }
    
    hideAll() {
        this.notifications.forEach((notification, id) => {
            this.hide(id);
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
            duration: 3000,
            ...options
        });
    },
    
    error: (message, title = '', options = {}) => {
        return manager.show({
            type: 'error',
            message,
            title,
            duration: 5000,
            ...options
        });
    },
    
    warning: (message, title = '', options = {}) => {
        return manager.show({
            type: 'warning',
            message,
            title,
            duration: 4000,
            ...options
        });
    },
    
    info: (message, title = '', options = {}) => {
        return manager.show({
            type: 'info',
            message,
            title,
            duration: 3000,
            ...options
        });
    },
    
    custom: (options) => {
        return manager.show(options);
    },
    
    hide: (id) => {
        manager.hide(id);
    },
    
    hideAll: () => {
        manager.hideAll();
    }
};

export default notify;