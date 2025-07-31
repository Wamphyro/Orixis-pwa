// ========================================
// DROPDOWN-LIST.COMPONENT.JS - Composant de liste déroulante custom
// ========================================
// Chemin: src/js/shared/ui/dropdown-list.component.js
//
// DESCRIPTION:
// Remplace les <select> natifs par un dropdown entièrement personnalisable.
// Permet d'appliquer des styles complexes (glassmorphism, animations, etc.)
//
// UTILISATION:
// const dropdown = new DropdownList({
//     container: '#statusFilter',
//     options: [
//         { value: 'new', label: 'Nouvelle', icon: '📋' },
//         { value: 'done', label: 'Terminée', icon: '✅' }
//     ],
//     onChange: (value, option) => { console.log('Selected:', value); }
// });
// ========================================

export class DropdownList {
    constructor(options = {}) {
        this.options = {
            container: null,
            name: '',                    // Nom du champ (pour les formulaires)
            value: '',                   // Valeur initiale
            placeholder: 'Sélectionner', // Texte par défaut
            options: [],                 // Options disponibles
            
            // Comportement
            searchable: false,           // Permettre la recherche
            multiple: false,             // Sélection multiple
            closeOnSelect: true,         // Fermer après sélection
            closeOnClickOutside: true,   // Fermer au clic extérieur
            disabled: false,             // État désactivé
            keepPlaceholder: false,      // Garder le placeholder au lieu de la valeur
            
            // Apparence
            showIcons: true,             // Afficher les icônes
            showCheckmarks: false,       // Afficher les coches
            maxHeight: 300,              // Hauteur max du panneau
            
            // Classes CSS
            className: '',               // Classes additionnelles
            theme: '',                   // Thème (glass, minimal, dark)
            size: '',                    // Taille (sm, lg)
            
            // Callbacks
            onChange: null,              // Appelé lors du changement
            onOpen: null,                // Appelé à l'ouverture
            onClose: null,               // Appelé à la fermeture
            renderOption: null,          // Rendu personnalisé des options
            
            ...options
        };
        
        // État interne
        this.isOpen = false;
        this.selectedIndex = -1;
        this.selectedValue = this.options.value;
        this.selectedOption = null;
        this.filteredOptions = this.options.options ? [...this.options.options] : [];
        this.searchQuery = '';

        // Références aux event listeners pour pouvoir les retirer
        this.boundHandleClickOutside = null;
        this.boundHandleResize = null;
        this.boundHandleModalScroll = null;
        
        // Éléments DOM
        this.container = null;
        this.wrapper = null;
        this.trigger = null;
        this.panel = null;
        this.hiddenInput = null;
        this.searchInput = null;
        
        // Mobile detection
        this.isMobile = window.innerWidth <= 768;
        
        if (this.options.container) {
            this.init();
        }
    }
    
    init() {
        // Trouver le conteneur
        this.container = typeof this.options.container === 'string'
            ? document.querySelector(this.options.container)
            : this.options.container;
            
        if (!this.container) {
            console.error('DropdownList: Conteneur non trouvé');
            return;
        }
        
        // Charger les styles
        this.loadStyles();
        
        // Si c'est un select natif, récupérer les options
        if (this.container.tagName === 'SELECT') {
            this.initFromSelect();
        }
        
        // Créer la structure
        this.createElements();
        
        // Attacher les événements
        this.attachEvents();
        
        // Définir la valeur initiale
        if (this.selectedValue) {
            this.setValue(this.selectedValue);
        }
    }
    
    loadStyles() {
        // Vérifier si les styles sont déjà chargés
        if (document.getElementById('dropdown-list-styles')) {
            return;
        }
        
        // Créer le lien vers le CSS
        const link = document.createElement('link');
        link.id = 'dropdown-list-styles';
        link.rel = 'stylesheet';
        link.href = '../src/css/shared/ui/dropdown-list.css';
        document.head.appendChild(link);
    }
    
    initFromSelect() {
        const select = this.container;
        
        // Récupérer les attributs
        this.options.name = select.name || this.options.name;
        this.options.disabled = select.disabled || this.options.disabled;
        this.selectedValue = select.value || this.options.value;
        
        // Récupérer les options
        if (this.options.options.length === 0) {
            this.options.options = Array.from(select.options).map(option => ({
                value: option.value,
                label: option.textContent,
                disabled: option.disabled,
                selected: option.selected
            }));
        }
        
        // Placeholder depuis la première option vide
        if (select.options[0] && !select.options[0].value) {
            this.options.placeholder = select.options[0].textContent;
            this.options.options.shift(); // Retirer l'option vide
        }
    }
    
    createElements() {
        // Créer le wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'dropdown-list-wrapper';
        
        // Ajouter les classes
        if (this.options.className) {
            this.wrapper.classList.add(...this.options.className.split(' '));
        }
        if (this.options.theme) {
            this.wrapper.classList.add(`dropdown-list-${this.options.theme}`);
        }
        if (this.options.size) {
            this.wrapper.classList.add(`dropdown-list-${this.options.size}`);
        }
        if (this.options.disabled) {
            this.wrapper.classList.add('disabled');
        }
        
        // Créer le trigger
        this.trigger = document.createElement('button');
        this.trigger.className = 'dropdown-list-trigger';
        this.trigger.type = 'button';
        this.trigger.disabled = this.options.disabled;
        this.trigger.innerHTML = `
            <span class="dropdown-list-value">${this.options.placeholder}</span>
            <span class="dropdown-list-arrow">
                <svg width="12" height="8" viewBox="0 0 12 8">
                    <path fill="currentColor" d="M6 8L0 0h12z"/>
                </svg>
            </span>
        `;
        
        // Créer le panneau
        this.panel = document.createElement('div');
        this.panel.className = 'dropdown-list-panel';
        this.panel.style.display = 'none';
        
        // Si recherchable, ajouter un input
        if (this.options.searchable) {
            const searchWrapper = document.createElement('div');
            searchWrapper.className = 'dropdown-list-search';
            
            this.searchInput = document.createElement('input');
            this.searchInput.type = 'text';
            this.searchInput.placeholder = 'Rechercher...';
            this.searchInput.className = 'dropdown-list-search-input';
            
            searchWrapper.appendChild(this.searchInput);
            this.panel.appendChild(searchWrapper);
        }
        
        // Créer le conteneur des options
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'dropdown-list-options';
        optionsContainer.style.maxHeight = `${this.options.maxHeight}px`;
        
        // Ajouter les options
        this.renderOptions();
        
        this.panel.appendChild(optionsContainer);
        
        // Créer l'input caché pour les formulaires
        if (this.options.name) {
            this.hiddenInput = document.createElement('input');
            this.hiddenInput.type = 'hidden';
            this.hiddenInput.name = this.options.name;
            this.hiddenInput.value = this.selectedValue;
            this.wrapper.appendChild(this.hiddenInput);
        }
        
        // Assembler
        this.wrapper.appendChild(this.trigger);
        this.wrapper.appendChild(this.panel);
        
        // Remplacer ou insérer dans le conteneur
        if (this.container.tagName === 'SELECT') {
            this.container.style.display = 'none';
            this.container.parentNode.insertBefore(this.wrapper, this.container.nextSibling);
        } else {
            this.container.innerHTML = '';
            this.container.appendChild(this.wrapper);
        }
    }
    
    renderOptions() {
        const container = this.panel.querySelector('.dropdown-list-options');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Si aucune option après filtrage
        if (this.filteredOptions.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'dropdown-list-empty';
            empty.textContent = 'Aucun résultat';
            container.appendChild(empty);
            return;
        }
        
        // Rendre chaque option
        this.filteredOptions.forEach((option, index) => {
            const optionEl = document.createElement('div');
            optionEl.className = 'dropdown-list-option';
            optionEl.dataset.value = option.value;
            optionEl.dataset.index = index;
            
            if (option.disabled) {
                optionEl.classList.add('disabled');
            }
            
            if (option.value === this.selectedValue) {
                optionEl.classList.add('selected');
            }
            
            // Contenu de l'option
            if (this.options.renderOption) {
                optionEl.innerHTML = this.options.renderOption(option);
            } else {
                let html = '';
                
                if (this.options.showIcons && option.icon) {
                    html += `<span class="dropdown-list-option-icon">${option.icon}</span>`;
                }
                
                html += `<span class="dropdown-list-option-label">${option.label}</span>`;
                
                if (this.options.showCheckmarks && option.value === this.selectedValue) {
                    html += `<span class="dropdown-list-option-checkmark">✓</span>`;
                }
                
                optionEl.innerHTML = html;
            }
            
            container.appendChild(optionEl);
        });
    }
    
    attachEvents() {
        // Trigger
        this.trigger.addEventListener('click', this.toggle.bind(this));
        
        // Options (délégation d'événements)
        this.panel.addEventListener('click', (e) => {
            const option = e.target.closest('.dropdown-list-option');
            if (option && !option.classList.contains('disabled')) {
                const index = parseInt(option.dataset.index);
                this.selectOption(this.filteredOptions[index]);
            }
        });
        
        // Hover sur les options
        this.panel.addEventListener('mouseover', (e) => {
            const option = e.target.closest('.dropdown-list-option');
            if (option && !option.classList.contains('disabled')) {
                this.highlightOption(parseInt(option.dataset.index));
            }
        });
        
        // Recherche
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.filterOptions();
            });
        }
        
        // Clavier
        this.wrapper.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Clic extérieur
        if (this.options.closeOnClickOutside) {
            this.boundHandleClickOutside = (e) => {
                // Vérifier que les éléments existent encore
                if (this.wrapper && !this.wrapper.contains(e.target) && this.isOpen) {
                    this.close();
                }
            };
            document.addEventListener('click', this.boundHandleClickOutside);
        }

        // Resize
        this.boundHandleResize = () => {
            this.isMobile = window.innerWidth <= 768;
            if (this.isOpen && this.panel) {
                this.updatePosition();
            }
        };
        window.addEventListener('resize', this.boundHandleResize);
        
        // NOUVEAU : Gérer le scroll dans les modals
        const modal = this.wrapper.closest('.modal');
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) {
                this.boundHandleModalScroll = () => {
                    if (this.isOpen && this.panel) {
                        this.updatePosition();
                    }
                };
                modalBody.addEventListener('scroll', this.boundHandleModalScroll);
            }
        }
    }
    
    handleKeydown(e) {
        if (!this.isOpen && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            this.open();
            return;
        }
        
        if (!this.isOpen) return;
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.highlightNext();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.highlightPrevious();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectOption(this.filteredOptions[this.selectedIndex]);
                }
                break;
                
            case 'Escape':
                e.preventDefault();
                this.close();
                this.trigger.focus();
                break;
                
            case 'Tab':
                // Laisser Tab fermer le dropdown
                this.close();
                break;
        }
    }
    
    highlightOption(index) {
        // Retirer la surbrillance précédente
        this.panel.querySelectorAll('.dropdown-list-option').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        // Ajouter la nouvelle surbrillance
        if (index >= 0 && index < this.filteredOptions.length) {
            this.selectedIndex = index;
            const option = this.panel.querySelector(`[data-index="${index}"]`);
            if (option) {
                option.classList.add('highlighted');
                option.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }
    
    highlightNext() {
        const newIndex = this.selectedIndex < this.filteredOptions.length - 1 
            ? this.selectedIndex + 1 
            : 0;
        this.highlightOption(newIndex);
    }
    
    highlightPrevious() {
        const newIndex = this.selectedIndex > 0 
            ? this.selectedIndex - 1 
            : this.filteredOptions.length - 1;
        this.highlightOption(newIndex);
    }
    
    filterOptions() {
        if (!this.searchQuery) {
            this.filteredOptions = [...this.options.options];
        } else {
            const query = this.searchQuery.toLowerCase();
            this.filteredOptions = this.options.options.filter(option => 
                option.label.toLowerCase().includes(query)
            );
        }
        
        this.selectedIndex = -1;
        this.renderOptions();
    }
    
    selectOption(option) {
        if (!option) return;
        
        // Mettre à jour l'état
        this.selectedValue = option.value;
        this.selectedOption = option;
        
        // Mettre à jour l'affichage
        const valueEl = this.trigger.querySelector('.dropdown-list-value');
        if (valueEl) {
            if (this.options.keepPlaceholder) {
                // Garder le placeholder, juste ajouter une classe pour indiquer qu'une valeur est sélectionnée
                this.trigger.classList.add('has-value');
            } else {
                // Comportement normal : remplacer par la valeur sélectionnée
                let html = '';
                if (this.options.showIcons && option.icon) {
                    html += `<span class="dropdown-value-icon">${option.icon}</span> `;
                }
                html += option.label;
                valueEl.innerHTML = html;
            }
        }
        
        // Mettre à jour l'input caché
        if (this.hiddenInput) {
            this.hiddenInput.value = option.value;
        }
        
        // Mettre à jour le select natif
        if (this.container.tagName === 'SELECT') {
            this.container.value = option.value;
            this.container.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Re-rendre les options pour mettre à jour la sélection
        this.renderOptions();
        
        // Fermer si nécessaire
        if (this.options.closeOnSelect) {
            this.close();
        }
        
        // Callback
        if (this.options.onChange) {
            this.options.onChange(option.value, option);
        }
        
        // Event custom
        this.wrapper.dispatchEvent(new CustomEvent('change', {
            detail: { value: option.value, option }
        }));
    }
    
    updatePosition() {
        if (!this.panel || !this.trigger) return;
        
        const triggerRect = this.trigger.getBoundingClientRect();
        const panelHeight = this.panel.offsetHeight;
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        
        // Détecter si on est dans un modal
        const isInModal = this.wrapper.closest('.modal');
        
        // Reset styles
        this.panel.style.position = '';
        this.panel.style.top = '';
        this.panel.style.bottom = '';
        this.panel.style.left = '';
        this.panel.style.right = '';
        this.panel.style.width = '';
        
        if (this.isMobile) {
            // Code mobile inchangé...
            this.panel.style.position = 'fixed';
            this.panel.style.left = '50%';
            this.panel.style.transform = 'translateX(-50%)';
            this.panel.style.width = '90%';
            this.panel.style.maxWidth = '400px';
            this.panel.style.zIndex = '9999';
            this.panel.style.top = '50%';
            this.panel.style.transform = 'translate(-50%, -50%)';
            
            if (!this.backdrop) {
                this.backdrop = document.createElement('div');
                this.backdrop.className = 'dropdown-list-backdrop';
                this.wrapper.appendChild(this.backdrop);
            }
            this.backdrop.style.display = 'block';
            
        } else {
            // Desktop
            if (isInModal) {
                // Déplacer le panel dans le body si on est dans un modal
                if (this.panel.parentElement !== document.body) {
                    document.body.appendChild(this.panel);
                }
                
                // Position fixed avec calcul de la largeur maximale
                this.panel.style.position = 'fixed';
                this.panel.style.zIndex = '10500';
                
                // NOUVEAU : Forcer le recalcul des dimensions
                const computedWidth = window.getComputedStyle(this.trigger).width;
                const actualWidth = parseFloat(computedWidth) || triggerRect.width;
                
                this.panel.style.top = `${triggerRect.bottom + 2}px`;
                this.panel.style.left = `${triggerRect.left}px`;
                
                // Calculer la largeur maximale disponible
                const maxWidth = window.innerWidth - triggerRect.left - 20;
                this.panel.style.width = `${Math.min(actualWidth, maxWidth)}px`;
                
                // Si le dropdown dépasse en bas, le mettre au-dessus
                if (triggerRect.bottom + panelHeight > viewportHeight) {
                    this.panel.style.top = `${triggerRect.top - panelHeight - 2}px`;
                }
            } else {
                // Hors modal, remettre dans le wrapper si nécessaire
                if (this.panel.parentElement === document.body) {
                    this.wrapper.appendChild(this.panel);
                }
                this.panel.style.width = `${triggerRect.width}px`;
            }
            
            // Classes pour le style
            if (spaceBelow >= panelHeight || spaceBelow > spaceAbove) {
                this.panel.classList.remove('dropdown-up');
                this.panel.classList.add('dropdown-down');
            } else {
                this.panel.classList.remove('dropdown-down');
                this.panel.classList.add('dropdown-up');
            }
        }
    }
    
    open() {
        if (this.isOpen || this.options.disabled) return;
        
        this.isOpen = true;
        this.wrapper.classList.add('open');
        this.panel.style.display = 'block';

        // S'assurer que les options sont filtrées et rendues
        this.filterOptions();
        
        // NOUVEAU : Forcer un recalcul après un court délai
        setTimeout(() => {
            this.updatePosition();
        }, 50);
        
        // Focus sur la recherche si disponible
        if (this.searchInput) {
            setTimeout(() => this.searchInput.focus(), 100);
        }
        
        // Animation
        requestAnimationFrame(() => {
            this.panel.classList.add('show');
        });
        
        // Callback
        if (this.options.onOpen) {
            this.options.onOpen();
        }
        
        // Sur mobile, empêcher le scroll du body
        if (this.isMobile) {
            document.body.style.overflow = 'hidden';
        }
    }
    
    close() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        this.wrapper.classList.remove('open');
        this.panel.classList.remove('show');
        
        // Animation de fermeture
        const transitionEnd = () => {
            this.panel.style.display = 'none';
            this.panel.removeEventListener('transitionend', transitionEnd);
            
            // NOUVEAU : Remettre le panel dans le wrapper s'il était dans le body
            if (this.panel.parentElement === document.body) {
                this.wrapper.appendChild(this.panel);
            }
            
            // Masquer le backdrop
            if (this.backdrop) {
                this.backdrop.style.display = 'none';
            }
        };
        
        this.panel.addEventListener('transitionend', transitionEnd);
        
        // Reset recherche
        if (this.searchInput) {
            this.searchInput.value = '';
            this.searchQuery = '';
            this.filterOptions();
        }
        
        // Callback
        if (this.options.onClose) {
            this.options.onClose();
        }
        
        // Restaurer le scroll sur mobile
        if (this.isMobile) {
            document.body.style.overflow = '';
        }
    }

    // AJOUTEZ CETTE MÉTHODE ICI
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    // ========================================
    // API PUBLIQUE
    // ========================================
    
    getValue() {
        return this.selectedValue;
    }
    
    setValue(value) {
        if (value === '' || value === null || value === undefined) {
            // Reset : remettre le placeholder
            this.selectedValue = '';
            this.selectedOption = null;
            
            const valueEl = this.trigger.querySelector('.dropdown-list-value');
            if (valueEl) {
                valueEl.innerHTML = this.options.placeholder;
            }
            this.trigger.classList.remove('has-value');
            
            if (this.hiddenInput) {
                this.hiddenInput.value = '';
            }
            
            this.renderOptions();
        } else {
            const option = this.options.options.find(opt => opt.value === value);
            if (option) {
                this.selectOption(option);
            }
        }
    }
    
    getSelectedOption() {
        return this.selectedOption;
    }
    
    setOptions(options) {
        this.options.options = options;
        this.filteredOptions = [...options];
        this.renderOptions();
    }
    
    addOption(option) {
        this.options.options.push(option);
        this.filteredOptions = [...this.options.options];
        this.renderOptions();
    }
    
    removeOption(value) {
        this.options.options = this.options.options.filter(opt => opt.value !== value);
        this.filteredOptions = [...this.options.options];
        if (this.selectedValue === value) {
            this.selectedValue = '';
            this.selectedOption = null;
        }
        this.renderOptions();
    }
    
    enable() {
        this.options.disabled = false;
        this.wrapper.classList.remove('disabled');
        this.trigger.disabled = false;
    }
    
    disable() {
        this.options.disabled = true;
        this.wrapper.classList.add('disabled');
        this.trigger.disabled = true;
        if (this.isOpen) {
            this.close();
        }
    }
    
    destroy() {
        // Fermer d'abord si ouvert
        if (this.isOpen) {
            this.close();
        }
        
        // Retirer TOUS les event listeners
        if (this.boundHandleClickOutside) {
            document.removeEventListener('click', this.boundHandleClickOutside);
            this.boundHandleClickOutside = null;
        }
        
        if (this.boundHandleResize) {
            window.removeEventListener('resize', this.boundHandleResize);
            this.boundHandleResize = null;
        }
        
        if (this.boundHandleModalScroll) {
            const modal = this.wrapper?.closest('.modal');
            const modalBody = modal?.querySelector('.modal-body');
            if (modalBody) {
                modalBody.removeEventListener('scroll', this.boundHandleModalScroll);
            }
            this.boundHandleModalScroll = null;
        }
        
        // Restaurer le select original si nécessaire
        if (this.container && this.container.tagName === 'SELECT') {
            this.container.style.display = '';
        }
        
        // Retirer le panel du body s'il y est
        if (this.panel && this.panel.parentElement === document.body) {
            document.body.removeChild(this.panel);
        }
        
        // Nettoyer le DOM
        if (this.wrapper && this.wrapper.parentNode) {
            this.wrapper.parentNode.removeChild(this.wrapper);
        }
        
        // Nettoyer les références
        this.container = null;
        this.wrapper = null;
        this.trigger = null;
        this.panel = null;
        this.hiddenInput = null;
        this.searchInput = null;
        this.backdrop = null;
        this.selectedOption = null;
        this.filteredOptions = [];
    }
}

// Export par défaut
export default DropdownList;

// ========================================
// UTILISATION SIMPLE
// ========================================
// 
// // Remplacer un select existant
// new DropdownList({
//     container: '#monSelect'
// });
// 
// // Créer depuis zéro
// new DropdownList({
//     container: '#conteneur',
//     options: [
//         { value: 'fr', label: 'Français', icon: '🇫🇷' },
//         { value: 'en', label: 'English', icon: '🇬🇧' }
//     ],
//     onChange: (value) => console.log('Sélectionné:', value)
// });
// ========================================