// src/js/app.js
// Point d'entrée principal de l'application Orixis

import { APP_CONFIG } from './config/app.config.js';
import { authService } from './services/auth.service.js';
import { $, $$ } from './utils/dom.utils.js';

class OrixisApp {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    init() {
        // Initialiser le service worker
        this.initServiceWorker();
        
        // Vérifier l'authentification
        this.checkAuth();
        
        // Initialiser la page courante
        this.initCurrentPage();
        
        // Événements globaux
        this.attachGlobalEvents();
    }

    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('Service Worker enregistré', reg))
                .catch(err => console.error('Erreur Service Worker:', err));
        }
    }

    checkAuth() {
        // Pages qui ne nécessitent pas d'authentification
        const publicPages = ['index.html', 'login.html'];
        
        if (!publicPages.includes(this.currentPage)) {
            authService.checkAuthAndRedirect(this.currentPage);
        }
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        return page;
    }

    initCurrentPage() {
        // Initialiser les fonctionnalités spécifiques à chaque page
        switch (this.currentPage) {
            case 'index.html':
                this.initLoginPage();
                break;
            case 'home.html':
                this.initHomePage();
                break;
            case 'fiche-intervention.html':
                this.initInterventionPage();
                break;
            case 'signature-client.html':
                this.initSignatureClientPage();
                break;
            case 'signature-intervenant.html':
                this.initSignatureIntervenantPage();
                break;
            case 'fiche-impression.html':
                this.initPrintPage();
                break;
            case 'guide-sav.html':
                this.initGuidePage();
                break;
            case 'contacts.html':
                this.initContactsPage();
                break;
        }
    }

    attachGlobalEvents() {
        // Boutons de déconnexion
        $$('.btn-logout').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm(APP_CONFIG.messages.confirmations.logout)) {
                    authService.logout();
                    window.location.href = APP_CONFIG.urls.login;
                }
            });
        });

        // Boutons retour
        $$('.back-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const href = btn.getAttribute('href');
                if (href) {
                    window.location.href = href;
                } else {
                    window.history.back();
                }
            });
        });

        // Gestion du mode hors ligne
        window.addEventListener('online', () => {
            this.showMessage('Connexion rétablie', 'success');
        });

        window.addEventListener('offline', () => {
            this.showMessage('Mode hors ligne - Les données seront synchronisées à la reconnexion', 'warning');
        });
    }

    // Pages spécifiques - Ces méthodes seront importées depuis des modules séparés
    initLoginPage() {
        import('./pages/login.page.js').then(module => {
            new module.LoginPage();
        });
    }

    initHomePage() {
        import('./pages/home.page.js').then(module => {
            new module.HomePage();
        });
    }

    initInterventionPage() {
        import('./pages/intervention.page.js').then(module => {
            new module.InterventionPage();
        });
    }

    initSignatureClientPage() {
        import('./pages/signature-client.page.js').then(module => {
            new module.SignatureClientPage();
        });
    }

    initSignatureIntervenantPage() {
        import('./pages/signature-intervenant.page.js').then(module => {
            new module.SignatureIntervenantPage();
        });
    }

    initPrintPage() {
        import('./pages/print.page.js').then(module => {
            new module.PrintPage();
        });
    }

    initGuidePage() {
        // Animation au scroll pour le guide
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        $$('.section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'all 0.6s ease-out';
            observer.observe(section);
        });
    }

    initContactsPage() {
        import('./pages/contacts.page.js').then(module => {
            new module.ContactsPage();
        });
    }

    // Méthodes utilitaires
    showMessage(message, type = 'info') {
        // Créer ou réutiliser le conteneur de messages
        let messageContainer = $('#app-messages');
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'app-messages';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 350px;
            `;
            document.body.appendChild(messageContainer);
        }

        // Créer le message
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type} animate-fadeInUp`;
        messageEl.style.cssText = `
            margin-bottom: 10px;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 10px;
        `;

        // Icône selon le type
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        messageEl.innerHTML = `
            <span style="font-size: 20px;">${icons[type]}</span>
            <span>${message}</span>
        `;

        messageContainer.appendChild(messageEl);

        // Auto-suppression après 5 secondes
        setTimeout(() => {
            messageEl.style.opacity = '0';
            messageEl.style.transform = 'translateX(100px)';
            setTimeout(() => messageEl.remove(), 300);
        }, 5000);
    }
}

// Initialiser l'application au chargement
document.addEventListener('DOMContentLoaded', () => {
    window.orixisApp = new OrixisApp();
});

// Export pour utilisation dans d'autres modules
export default OrixisApp;