// src/js/router.js
// Système de routing pour Single Page Application

export class Router {
    constructor(routes) {
        this.routes = routes;
        this.currentRoute = null;
        this.appContainer = document.getElementById('app');
        
        // Écouter les changements d'URL
        window.addEventListener('popstate', () => this.handleRoute());
        
        // Intercepter les clics sur les liens
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-link]')) {
                e.preventDefault();
                this.navigate(e.target.href);
            }
        });
    }

    /**
     * Navigation vers une route
     * @param {string} url 
     */
    navigate(url) {
        history.pushState(null, null, url);
        this.handleRoute();
    }

    /**
     * Gère le routing
     */
    async handleRoute() {
        // Obtenir le path actuel
        const path = window.location.pathname;
        
        // Trouver la route correspondante
        const route = this.routes.find(route => {
            if (route.path instanceof RegExp) {
                return route.path.test(path);
            }
            return route.path === path;
        }) || this.routes.find(route => route.path === '*');

        if (!route) {
            this.render404();
            return;
        }

        // Vérifier l'authentification si nécessaire
        if (route.auth && !this.checkAuth()) {
            this.navigate('/login');
            return;
        }

        // Charger et afficher la vue
        try {
            this.currentRoute = route;
            await this.loadView(route);
        } catch (error) {
            console.error('Erreur chargement route:', error);
            this.render404();
        }
    }

    /**
     * Charge une vue
     * @param {Object} route 
     */
    async loadView(route) {
        // Afficher un loader
        this.showLoader();

        // Charger le module de la page
        const module = await import(route.component);
        const PageClass = module.default || module[route.name + 'Page'];

        // Charger le template HTML si nécessaire
        let template = '';
        if (route.template) {
            template = await this.loadTemplate(route.template);
        }

        // Afficher le template
        this.appContainer.innerHTML = template;

        // Initialiser la page
        if (PageClass) {
            this.currentPage = new PageClass(this);
        }

        // Mettre à jour le titre
        document.title = `Orixis - ${route.title || 'Application SAV'}`;
    }

    /**
     * Charge un template HTML
     * @param {string} templatePath 
     */
    async loadTemplate(templatePath) {
        try {
            const response = await fetch(templatePath);
            if (!response.ok) throw new Error('Template non trouvé');
            return await response.text();
        } catch (error) {
            console.error('Erreur chargement template:', error);
            return '<div class="error">Erreur de chargement</div>';
        }
    }

    /**
     * Vérifie l'authentification
     */
    checkAuth() {
        const auth = localStorage.getItem('orixis_auth');
        if (!auth) return false;
        
        try {
            const authData = JSON.parse(auth);
            const now = Date.now();
            
            // Vérifier l'expiration
            if (now - authData.timestamp > (authData.expiry || 86400000)) {
                localStorage.removeItem('orixis_auth');
                return false;
            }
            
            return authData.authenticated === true;
        } catch {
            return false;
        }
    }

    /**
     * Affiche le loader
     */
    showLoader() {
        this.appContainer.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Chargement...</p>
            </div>
        `;
    }

    /**
     * Affiche la page 404
     */
    render404() {
        this.appContainer.innerHTML = `
            <div class="error-page">
                <h1>404</h1>
                <p>Page non trouvée</p>
                <a href="/" data-link>Retour à l'accueil</a>
            </div>
        `;
    }

    /**
     * Démarre le router
     */
    start() {
        this.handleRoute();
    }
}

// Configuration des routes
export const routes = [
    {
        path: '/',
        name: 'Login',
        component: '/src/js/pages/login.page.js',
        template: '/src/views/login.html',
        title: 'Connexion',
        auth: false
    },
    {
        path: '/login',
        name: 'Login',
        component: '/src/js/pages/login.page.js',
        template: '/src/views/login.html',
        title: 'Connexion',
        auth: false
    },
    {
        path: '/home',
        name: 'Home',
        component: '/src/js/pages/home.page.js',
        template: '/src/views/home.html',
        title: 'Accueil',
        auth: true
    },
    {
        path: '/intervention',
        name: 'Intervention',
        component: '/src/js/pages/intervention.page.js',
        template: '/src/views/intervention.html',
        title: 'Nouvelle intervention',
        auth: true
    },
    {
        path: '/intervention/:id',
        name: 'InterventionEdit',
        component: '/src/js/pages/intervention.page.js',
        template: '/src/views/intervention.html',
        title: 'Modifier intervention',
        auth: true
    },
    {
        path: '/signature/client',
        name: 'SignatureClient',
        component: '/src/js/pages/signature.page.js',
        template: '/src/views/signature.html',
        title: 'Signature client',
        auth: true
    },
    {
        path: '/signature/intervenant',
        name: 'SignatureIntervenant',
        component: '/src/js/pages/signature.page.js',
        template: '/src/views/signature.html',
        title: 'Signature intervenant',
        auth: true
    },
    {
        path: '/print/:id',
        name: 'Print',
        component: '/src/js/pages/print.page.js',
        template: '/src/views/print.html',
        title: 'Impression',
        auth: true
    },
    {
        path: '/guide',
        name: 'Guide',
        component: '/src/js/pages/guide.page.js',
        template: '/src/views/guide.html',
        title: 'Guide SAV',
        auth: true
    },
    {
        path: '/contacts',
        name: 'Contacts',
        component: '/src/js/pages/contacts.page.js',
        template: '/src/views/contacts.html',
        title: 'Contacts',
        auth: true
    },
    {
        path: '*',
        name: 'NotFound',
        component: null,
        template: null,
        title: '404'
    }
];
