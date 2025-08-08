📄 README.md pour ToastWidget
# 🔔 ToastWidget

Widget autonome de notifications toast pour applications web.

## 📋 Description

Le **ToastWidget** est un système de notifications non-intrusives qui affiche des messages temporaires à l'utilisateur. Il gère automatiquement une pile de notifications avec animations fluides et support de différents types de messages.

## ✨ Caractéristiques

- 🎨 **4 types de notifications** : Success, Error, Warning, Info
- 🎯 **Singleton global** : Une seule instance partagée
- 📍 **4 positions** : Coins de l'écran configurables
- 🎭 **3 thèmes** : Gradient (défaut), Solid, Glass
- 📏 **3 tailles** : Small, Medium, Large
- ⏱️ **Auto-fermeture** : Durée configurable
- 🖱️ **Pause sur survol** : Arrête le timer automatiquement
- 📊 **Barre de progression** : Indicateur visuel du temps restant
- 🔄 **Gestion de pile** : Limite configurable du nombre de toasts
- 📱 **Responsive** : S'adapte aux petits écrans
- 🌙 **Dark mode** : Support automatique

## 📦 Installation

```bash
/widgets/toast/
├── toast.widget.js       # Classe principale
├── toast.widget.css      # Styles (chargé automatiquement)
└── README.md            # Documentation

🚀 Utilisation
Import et utilisation basique
javascriptimport toast from '/widgets/toast/toast.widget.js';

// Messages simples
toast.success('Opération réussie !');
toast.error('Une erreur est survenue');
toast.warning('Attention : action irréversible');
toast.info('Nouvelle mise à jour disponible');

// Avec durée personnalisée (ms)
toast.success('Message court', 2000);
toast.error('Message long', 10000);
Configuration avancée
javascriptimport { ToastWidget } from '/widgets/toast/toast.widget.js';

const customToast = new ToastWidget({
    position: 'bottom-right',    // Position des toasts
    maxToasts: 3,                // Nombre max affiché
    duration: 5000,              // Durée par défaut (ms)
    animated: true,              // Animations activées
    pauseOnHover: true,          // Pause sur survol
    showProgress: true,          // Barre de progression
    theme: 'glass',              // Theme visuel
    size: 'lg'                   // Taille des toasts
});

customToast.success('Configuration personnalisée !');
⚙️ Options de configuration
OptionTypeDéfautDescriptionpositionstring'top-right'Position : top-right, top-left, bottom-right, bottom-leftmaxToastsnumber5Nombre maximum de toasts affichés simultanémentdurationnumber4000Durée d'affichage par défaut en millisecondesanimatedbooleantrueActive/désactive les animationspauseOnHoverbooleantrueMet en pause le timer au survolshowProgressbooleantrueAffiche la barre de progressionthemestring'gradient'Thème visuel : gradient, solid, glasssizestring'md'Taille : sm, md, lg
📖 API Publique
Méthodes principales
show(message, type, duration)
Affiche un toast personnalisé.
javascripttoast.show('Message custom', 'info', 3000);
success(message, duration)
Affiche un toast de succès.
javascripttoast.success('✅ Fichier uploadé');
error(message, duration)
Affiche un toast d'erreur.
javascripttoast.error('❌ Connexion échouée');
warning(message, duration)
Affiche un toast d'avertissement.
javascripttoast.warning('⚠️ Espace disque faible');
info(message, duration)
Affiche un toast d'information.
javascripttoast.info('ℹ️ Mise à jour disponible');
clear()
Supprime tous les toasts affichés.
javascripttoast.clear();
destroy()
Détruit complètement le widget et nettoie les ressources.
javascripttoast.destroy();
🎨 Personnalisation CSS
Variables CSS disponibles
css:root {
    /* Couleurs par type */
    --toast-success-start: #10b981;
    --toast-success-end: #34d399;
    --toast-error-start: #ef4444;
    --toast-error-end: #f87171;
    --toast-warning-start: #f59e0b;
    --toast-warning-end: #fbbf24;
    --toast-info-start: #3b82f6;
    --toast-info-end: #60a5fa;
    
    /* Espacements */
    --toast-gap: 12px;
    --toast-padding: 12px 20px;
    
    /* Transitions */
    --toast-transition: all 0.3s ease;
}
Surcharge de styles
