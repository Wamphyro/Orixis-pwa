📄 README pour HeaderWidget
README - HeaderWidgetDocument # 🎯 HeaderWidget - Documentation
Widget header intelligent et réutilisable avec gestion automatique de l'authentification, navigation et informations utilisateur.
🚀 Installation
javascriptimport { HeaderWidget } from '/widgets/header/header.widget.js';
📝 Utilisation basique
javascriptconst header = new HeaderWidget({
    title: 'Factures Fournisseurs',
    subtitle: 'Gestion des factures',
    icon: '📑',
    showBack: true,
    showUser: true,
    showLogout: true
});
⚙️ Configuration complète
Options principales
OptionTypeDéfautDescriptionApparencetitlestring'Application'Titre principal du headersubtitlestring''Sous-titre optionneliconstring''Emoji ou icône à afficherthemestring'gradient'Thème visuel ('gradient', 'solid', 'minimal')customClassstring''Classes CSS additionnellesheightstring'70px'Hauteur du headerNavigationshowBackbooleantrueAfficher le bouton retourbackUrlstring'/modules/home/home.html'URL de retourbackTextstring''Texte du bouton retouronBackfunctionnullCallback personnalisé pour le retourUtilisateurshowUserbooleantrueAfficher les infos utilisateurshowMagasinbooleantrueAfficher le magasinshowLogoutbooleantrueAfficher le bouton déconnexionContainercontainerstring/element'body'Où injecter le headerpositionstring'prepend'Position ('prepend', 'append', 'replace')stickybooleantrueHeader fixe en hautCallbacksonLogoutfunctiondefaultLogoutAction de déconnexiononUserClickfunctionnullClic sur zone utilisateurAuto-featuresautoAuthbooleantrueVérification auto de l'authautoRefreshbooleanfalseRafraîchissement autorefreshIntervalnumber60000Intervalle de refresh (ms)
🎨 Système de styles centralisé ✅ NOUVEAU
Chargement automatique
Le widget charge automatiquement via loadWidgetStyles() :

buttons.css - Tous les styles de boutons
badges.css - Tous les styles de badges
modal-base.css - Styles de base des modals

Classes disponibles
Grâce au système centralisé, l'orchestrator peut utiliser dans les containers :
javascript// Dans le container de retour
document.querySelector('.header-back-container').innerHTML = `
    <button class="btn btn-glass-white">← Retour</button>
`;

// Dans le container de déconnexion  
document.querySelector('.header-logout-container').innerHTML = `
    <button class="btn btn-logout-user"></button>
`;
🎯 Thèmes disponibles
gradient (défaut)
javascripttheme: 'gradient'  // Fond dégradé violet/bleu animé
solid
javascripttheme: 'solid'     // Fond uni
minimal
javascripttheme: 'minimal'   // Design épuré
👤 Données utilisateur
Le widget récupère automatiquement depuis localStorage.getItem('sav_auth') :
javascript{
    nom: 'Dupont',
    prenom: 'Jean',
    nomComplet: 'Jean Dupont',
    role: 'technicien',
    magasin: 'Magasin 9MAR',
    societe: 'ORIXIS',
    email: 'jean.dupont@orixis.fr',
    avatar: null,
    permissions: [],
    authenticated: true
}
📌 API Publique
Méthodes
javascript// Mise à jour dynamique
header.setTitle('Nouveau titre');           // Changer le titre
header.setSubtitle('Nouveau sous-titre');   // Changer le sous-titre

// Barre de progression
header.showProgress(50);                    // Afficher à 50%
header.hideProgress();                       // Masquer

// Rafraîchissement
header.refresh();                           // Rafraîchir les données utilisateur

// Destruction
header.destroy();                           // Nettoyer et retirer du DOM
Propriétés
javascriptheader.config       // Configuration complète
header.userData     // Données utilisateur actuelles
header.element      // Élément DOM du header
💡 Exemples concrets
Header complet avec toutes les options
javascriptconst header = new HeaderWidget({
    // Apparence
    title: 'Gestion des Factures',
    subtitle: 'Module comptabilité',
    icon: '📊',
    theme: 'gradient',
    height: '80px',
    
    // Navigation
    showBack: true,
    backUrl: '/dashboard.html',
    backText: '← Tableau de bord',
    
    // Utilisateur
    showUser: true,
    showMagasin: true,
    showLogout: true,
    
    // Callbacks
    onBack: () => {
        if (confirm('Quitter sans sauvegarder ?')) {
            window.location.href = '/dashboard.html';
        }
    },
    
    onUserClick: (userData) => {
        console.log('Profil de:', userData.nomComplet);
        // Ouvrir modal profil
    },
    
    onLogout: () => {
        if (confirm('Se déconnecter ?')) {
            localStorage.clear();
            window.location.href = '/login.html';
        }
    },
    
    // Auto-features
    autoAuth: true,
    autoRefresh: true,
    refreshInterval: 30000  // Toutes les 30 secondes
});
Header minimal
javascriptconst simpleHeader = new HeaderWidget({
    title: 'Mon Application',
    showBack: false,
    showUser: false,
    showLogout: false,
    theme: 'minimal'
});
Header avec progression
javascriptconst header = new HeaderWidget({
    title: 'Import en cours...',
    icon: '⏳'
});

// Simuler une progression
let progress = 0;
const interval = setInterval(() => {
    progress += 10;
    header.showProgress(progress);
    
    if (progress >= 100) {
        clearInterval(interval);
        header.setTitle('Import terminé !');
        header.setIcon('✅');
        setTimeout(() => header.hideProgress(), 2000);
    }
}, 500);
Intégration avec orchestrator
javascript// L'orchestrator peut ajouter ses boutons dans les containers
class Orchestrator {
    initHeader() {
        const header = new HeaderWidget({
            title: 'Factures',
            showBack: true,
            showLogout: true
        });
        
        // Ajouter le bouton retour personnalisé
        const backContainer = document.querySelector('.header-back-container');
        if (backContainer) {
            backContainer.innerHTML = `
                <button class="btn btn-glass-white btn-sm">
                    ← Retour au menu
                </button>
            `;
            
            backContainer.querySelector('button').onclick = () => {
                this.navigateBack();
            };
        }
        
        // Ajouter le bouton déconnexion avec icône
        const logoutContainer = document.querySelector('.header-logout-container');
        if (logoutContainer) {
            logoutContainer.innerHTML = `
                <button class="btn btn-logout-user" title="Déconnexion"></button>
            `;
        }
    }
}
⌨️ Raccourcis clavier
RaccourciActionAlt + BBouton retourAlt + LDéconnexion
🎨 Personnalisation CSS
Variables CSS disponibles :
css/* Dans votre CSS */
:root {
    --header-height: 70px;
    --header-bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --header-shadow: 0 2px 20px rgba(102, 126, 234, 0.4);
    --header-text-color: white;
}

/* Classes pour personnalisation */
.header-widget.custom-theme {
    background: var(--custom-gradient);
}
📦 Structure des fichiers
/widgets/header/
├── header.widget.js       # Logique du widget
├── header.widget.css      # Styles spécifiques
└── README.md             # Cette documentation

/src/
├── utils/
│   └── widget-styles-loader.js  # ✅ Chargeur de styles centralisé
├── css/
│   └── components/
│       ├── buttons.css          # Styles des boutons (chargé auto)
│       ├── badges.css           # Styles des badges (chargé auto)
│       └── modal-base.css       # Styles modals (chargé auto)
⚠️ Notes importantes

Authentification : Vérifie automatiquement localStorage.getItem('sav_auth')
Expiration : Redirige vers login si session expirée
Responsive : S'adapte automatiquement mobile/desktop
Sticky : Ajoute padding-top au body automatiquement
Containers vides : Pour que l'orchestrator puisse y injecter ses boutons
Styles centralisés : Charge automatiquement tous les styles communs

🔄 Cycle de vie
new HeaderWidget()
    ↓
loadCSS()
    ├── loadWidgetStyles()  // ✅ Charge styles communs
    └── Charge CSS spécifique
    ↓
init()
    ├── getUserData()      // Récupère auth
    ├── createElement()     // Crée le HTML
    ├── inject()           // Insère dans DOM
    ├── attachEvents()     // Événements
    └── animate()          // Animation entrée
    ↓
[autoRefresh] → refresh() toutes les X secondes
    ↓
destroy()                  // Nettoyage complet
📊 Changelog
v1.0.1 (09/02/2025)

✅ Intégration du système de styles centralisé
✅ Utilisation de loadWidgetStyles()
✅ Containers vides pour injection orchestrator

v1.0.0 (08/02/2025)

Version initiale
Gestion auth automatique
Thèmes multiples
Auto-refresh


Version : 1.0.1
Auteur : Assistant Claude
Date : 09/02/2025
Mise à jour : Ajout système de styles centralisé