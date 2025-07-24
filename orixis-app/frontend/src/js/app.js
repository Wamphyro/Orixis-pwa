// src/js/app.js
// Point d'entrée principal de l'application Orixis

import { Router, routes } from './router.js';
import { APP_CONFIG } from './config/app.config.js';

class OrixisApp {
    constructor() {
        this.router = new Router(routes);
        this.init();
    }

    init() {
        console.log('🚀 Orixis App v' + APP_CONFIG.app.version);
        
        // Initialiser le service worker
        this.initServiceWorker();
        
        // Démarrer le router
        this.router.start();
        
        // Événements globaux
        this.attachGlobalEvents();
        
        // Gestion du mode offline
        this.initOfflineHandling();
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('✅ Service Worker enregistré'))
                .catch(err => console.error('❌ Erreur Service Worker:', err));
        }
    }

    attachGlobalEvents() {
        // Gestion des erreurs globales
        window.addEventListener('error', (event) => {
            console.error('Erreur globale:', event.error);
            this.showNotification('Une erreur est survenue', 'error');
        });

        // Gestion des promesses rejetées
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesse rejetée:', event.reason);
            this.showNotification('Une erreur est survenue', 'error');
        });
    }

    initOfflineHandling() {
        // Détection online/offline
        window.addEventListener('online', () => {
            this.showNotification('Connexion rétablie', 'success');
            document.body.classList.remove('offline');
        });

        window.addEventListener('offline', () => {
            this.showNotification('Mode hors ligne', 'warning');
            document.body.classList.add('offline');
        });

        // Vérifier l'état initial
        if (!navigator.onLine) {
            document.body.classList.add('offline');
        }
    }

    /**
     * Affiche une notification
     * @param {string} message 
     * @param {string} type 
     */
    showNotification(message, type = 'info') {
        // Créer ou réutiliser le conteneur
        let container = document.getElementById('notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications';
            container.className = 'notifications-container';
            document.body.appendChild(container);
        }

        // Créer la notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} animate-fadeInUp`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `
            <span class="notification-icon">${icons[type]}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(notification);

        // Auto-suppression après 5 secondes
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    /**
     * Navigation programmatique
     * @param {string} path 
     */
    navigate(path) {
        this.router.navigate(path);
    }

    /**
     * Obtient l'utilisateur actuel
     */
    getCurrentUser() {
        const auth = localStorage.getItem('orixis_auth');
        if (!auth) return null;
        
        try {
            return JSON.parse(auth);
        } catch {
            return null;
        }
    }

    /**
     * Déconnexion
     */
    logout() {
        if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
            localStorage.removeItem('orixis_auth');
            localStorage.removeItem('orixis_intervention_data');
            this.navigate('/login');
        }
    }
}

// CSS pour les notifications
const style = document.createElement('style');
style.textContent = `
    .notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 350px;
    }

    .notification {
        background: white;
        border-radius: 8px;
        padding: 15px 20px;
        margin-bottom: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 10px;
        position: relative;
        padding-right: 40px;
    }

    .notification-success {
        border-left: 4px solid #27ae60;
    }

    .notification-error {
        border-left: 4px solid #e74c3c;
    }

    .notification-warning {
        border-left: 4px solid #f39c12;
    }

    .notification-info {
        border-left: 4px solid #3498db;
    }

    .notification-icon {
        font-size: 20px;
    }

    .notification-close {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .notification-close:hover {
        color: #333;
    }

    .fade-out {
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s;
    }

    body.offline::before {
        content: 'Mode hors ligne';
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #f39c12;
        color: white;
        padding: 10px 20px;
        border-radius: 20px;
        z-index: 9999;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }

    .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background: var(--bg-color);
    }

    .spinner {
        width: 50px;
        height: 50px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialiser l'application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OrixisApp();
});

// Export pour utilisation globale
export default OrixisApp;
