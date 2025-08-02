// ========================================
// TIMELINE.COMPONENT.JS - Composant Timeline réutilisable
// Chemin: src/components/ui/timeline/timeline.component.js
//
// DESCRIPTION:
// Composant de timeline horizontal ou vertical pour visualiser des étapes
// Support de différents états et animations
//
// MODIFIÉ le 01/02/2025:
// - Génération d'ID autonome harmonisée
// - 100% indépendant
//
// API PUBLIQUE:
// - constructor(options)
// - updateItem(id, updates)
// - setActiveItem(id)
// - getActiveItem()
// - addItem(item, position)
// - removeItem(id)
// - reset()
// - getItems()
// - updateOptions(newOptions)
// - destroy()
//
// CALLBACKS DISPONIBLES:
// - onClick: (item, index) => void
//
// EXEMPLE:
// const timeline = new Timeline({
//     container: '.timeline-container',
//     orientation: 'horizontal',
//     items: [
//         { id: 'step1', label: 'Étape 1', status: 'completed' },
//         { id: 'step2', label: 'Étape 2', status: 'active' }
//     ],
//     onClick: (item) => console.log('Clicked:', item)
// });
// ========================================

export class Timeline {
    constructor(options = {}) {
        // ✅ GÉNÉRATION D'ID HARMONISÉE
        this.id = 'timeline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
        
        this.options = {
            container: null,
            orientation: 'horizontal', // 'horizontal' ou 'vertical'
            items: [],
            showDates: true,
            showLabels: true,
            animated: true,
            clickable: false,
            onClick: null,
            theme: 'default', // 'default', 'minimal', 'colorful'
            size: 'medium', // 'small', 'medium', 'large'
            ...options
        };
        
        this.container = null;
        this.items = new Map();
        this.activeItem = null;
        
        if (this.options.container) {
            this.init();
        }
    }
    
    // ========================================
    // INITIALISATION ET CONFIGURATION
    // ========================================
    
    init() {
        // Trouver le conteneur
        this.container = typeof this.options.container === 'string' 
            ? document.querySelector(this.options.container)
            : this.options.container;
            
        if (!this.container) {
            console.error('Timeline: Conteneur non trouvé');
            return;
        }
        
        // Charger les styles
        this.loadStyles();
        
        // Configurer le conteneur
        this.setupContainer();
        
        // Rendre les items
        this.render();
        
        console.log('✅ Timeline initialisée:', this.id);
    }
    
    loadStyles() {
        // Vérifier si les styles sont déjà chargés
        if (document.getElementById('timeline-styles')) {
            return;
        }
        
        // Créer le lien vers le fichier CSS
        const link = document.createElement('link');
        link.id = 'timeline-styles';
        link.rel = 'stylesheet';
        link.href = '../../src/components/ui/timeline/timeline.css';
        document.head.appendChild(link);
        
        console.log('📦 Timeline styles chargés');
    }
    
    setupContainer() {
        // Nettoyer le conteneur
        this.container.innerHTML = '';
        
        // Ajouter les classes
        this.container.className = `timeline timeline-${this.options.orientation} timeline-${this.options.theme} timeline-${this.options.size}`;
        this.container.id = this.id;
        
        if (this.options.animated) {
            this.container.classList.add('timeline-animated');
        }
        
        if (this.options.clickable && this.options.onClick) {
            this.container.classList.add('timeline-clickable');
        }
    }
    
    // ========================================
    // RENDU ET DOM
    // ========================================
    
    render() {
        if (!this.container || !this.options.items.length) return;
        
        // Créer la ligne de connexion
        const connector = document.createElement('div');
        connector.className = 'timeline-connector';
        this.container.appendChild(connector);
        
        // Créer le conteneur des items
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'timeline-items';
        
        // Rendre chaque item
        this.options.items.forEach((item, index) => {
            const itemElement = this.createItemElement(item, index);
            itemsContainer.appendChild(itemElement);
            this.items.set(item.id || index, { element: itemElement, data: item });
        });
        
        this.container.appendChild(itemsContainer);
        
        // Mettre à jour les états
        this.updateStates();
    }
    
    createItemElement(item, index) {
        const itemEl = document.createElement('div');
        itemEl.className = `timeline-item timeline-item-${item.status || 'pending'}`;
        itemEl.dataset.id = item.id || index;
        
        // Événement click si activé
        if (this.options.clickable && this.options.onClick) {
            itemEl.addEventListener('click', () => {
                this.options.onClick(item, index);
            });
        }
        
        // Icône
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'timeline-icon-wrapper';
        
        const icon = document.createElement('div');
        icon.className = 'timeline-icon';
        
        if (item.icon) {
            // Si c'est une URL d'image
            if (item.icon.startsWith('http') || item.icon.startsWith('/')) {
                const img = document.createElement('img');
                img.src = item.icon;
                img.alt = item.label || '';
                icon.appendChild(img);
            } else {
                // Sinon, considérer comme texte/emoji
                icon.textContent = item.icon;
            }
        } else {
            // Icône par défaut selon le statut
            icon.textContent = this.getDefaultIcon(item.status);
        }
        
        iconWrapper.appendChild(icon);
        itemEl.appendChild(iconWrapper);
        
        // Contenu (label et date)
        const content = document.createElement('div');
        content.className = 'timeline-content';
        
        if (this.options.showLabels && item.label) {
            const label = document.createElement('div');
            label.className = 'timeline-label';
            label.textContent = item.label;
            content.appendChild(label);
        }
        
        if (this.options.showDates && item.date) {
            const date = document.createElement('div');
            date.className = 'timeline-date';
            date.textContent = item.date;
            content.appendChild(date);
        }
        
        // Tooltip si description fournie
        if (item.description) {
            itemEl.setAttribute('title', item.description);
        }
        
        itemEl.appendChild(content);
        
        return itemEl;
    }
    
    getDefaultIcon(status) {
        const icons = {
            completed: '✓',
            active: '●',
            pending: '○',
            disabled: '×',
            error: '!',
            warning: '⚠'
        };
        return icons[status] || '○';
    }
    
    updateStates() {
        let foundActive = false;
        
        this.items.forEach((item, id) => {
            const element = item.element;
            const status = item.data.status;
            
            // Retirer toutes les classes de statut
            element.className = element.className.replace(/timeline-item-\w+/g, '').trim();
            element.classList.add(`timeline-item-${status || 'pending'}`);
            
            // Gérer la logique de progression
            if (this.options.progression !== false) {
                if (status === 'active') {
                    foundActive = true;
                    this.activeItem = id;
                } else if (status === 'completed') {
                    // Déjà complété
                } else if (!foundActive && !status) {
                    // Marquer comme en attente
                    element.classList.add('timeline-item-pending');
                }
            }
            
            // Animation pulse sur l'élément actif
            if (status === 'active' && this.options.animated) {
                element.classList.add('timeline-pulse');
            }
        });
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    /**
     * Mettre à jour un item
     */
    updateItem(id, updates) {
        const item = this.items.get(id);
        if (!item) {
            console.warn(`Timeline: Item "${id}" non trouvé`);
            return;
        }
        
        // Mettre à jour les données
        Object.assign(item.data, updates);
        
        // Re-render l'item
        const index = Array.from(this.items.keys()).indexOf(id);
        const newElement = this.createItemElement(item.data, index);
        item.element.replaceWith(newElement);
        item.element = newElement;
        
        // Mettre à jour les états
        this.updateStates();
        
        // Animation de mise à jour
        if (this.options.animated) {
            newElement.classList.add('timeline-updated');
            setTimeout(() => {
                newElement.classList.remove('timeline-updated');
            }, 1000);
        }
    }
    
    /**
     * Définir l'item actif
     */
    setActiveItem(id) {
        // Retirer l'ancien actif
        if (this.activeItem) {
            this.updateItem(this.activeItem, { status: 'completed' });
        }
        
        // Définir le nouveau
        this.updateItem(id, { status: 'active' });
        this.activeItem = id;
    }
    
    /**
     * Obtenir l'item actif
     */
    getActiveItem() {
        return this.activeItem ? this.items.get(this.activeItem) : null;
    }
    
    /**
     * Ajouter un item
     */
    addItem(item, position = 'end') {
        const newItems = [...this.options.items];
        
        if (position === 'end') {
            newItems.push(item);
        } else if (position === 'start') {
            newItems.unshift(item);
        } else if (typeof position === 'number') {
            newItems.splice(position, 0, item);
        }
        
        this.options.items = newItems;
        this.render();
    }
    
    /**
     * Retirer un item
     */
    removeItem(id) {
        this.options.items = this.options.items.filter(item => item.id !== id);
        this.items.delete(id);
        this.render();
    }
    
    /**
     * Réinitialiser tous les items
     */
    reset() {
        this.items.forEach((item, id) => {
            this.updateItem(id, { status: 'pending' });
        });
        this.activeItem = null;
    }
    
    /**
     * Obtenir tous les items
     */
    getItems() {
        return Array.from(this.items.values()).map(item => item.data);
    }
    
    /**
     * Mettre à jour les options
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.render();
    }
    
    /**
     * Détruire le composant
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
            this.container.className = '';
        }
        this.items.clear();
        this.activeItem = null;
        
        console.log('🧹 Timeline détruite:', this.id);
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Créer une timeline rapidement
 */
export function createTimeline(container, items, options = {}) {
    return new Timeline({
        container,
        items,
        ...options
    });
}

/**
 * Timeline préconfiguré pour les commandes
 */
export function createOrderTimeline(container, commande, options = {}) {
    const statuts = ['nouvelle', 'preparation', 'terminee', 'expediee', 'receptionnee', 'livree'];
    const config = {
        nouvelle: { label: 'Nouvelle', icon: '⚪' },
        preparation: { label: 'En préparation', icon: '🔵' },
        terminee: { label: 'Préparée', icon: '🟢' },
        expediee: { label: 'Expédiée', icon: '📦' },
        receptionnee: { label: 'Réceptionnée', icon: '📥' },
        livree: { label: 'Livrée', icon: '✅' }
    };
    
    const items = statuts.map(statut => {
        const item = {
            id: statut,
            label: config[statut].label,
            icon: config[statut].icon,
            date: getDateForStatut(commande, statut)
        };
        
        // Déterminer le statut
        if (commande.statut === 'annulee') {
            item.status = 'disabled';
        } else if (statut === commande.statut) {
            item.status = 'active';
        } else if (statuts.indexOf(statut) < statuts.indexOf(commande.statut)) {
            item.status = 'completed';
        } else {
            item.status = 'pending';
        }
        
        return item;
    });
    
    return new Timeline({
        container,
        items,
        theme: 'colorful',
        ...options
    });
}

function getDateForStatut(commande, statut) {
    const dates = {
        nouvelle: commande.dates?.commande,
        preparation: commande.dates?.preparationDebut,
        terminee: commande.dates?.preparationFin,
        expediee: commande.dates?.expeditionValidee,
        receptionnee: commande.dates?.receptionValidee,
        livree: commande.dates?.livraisonClient
    };
    
    const date = dates[statut];
    if (!date) return '-';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('fr-FR');
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default Timeline;