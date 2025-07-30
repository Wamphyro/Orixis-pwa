// ========================================
// DATATABLE-FILTERS.COMPONENT.JS - Filtres réutilisables avec DropdownList
// Chemin: src/js/shared/ui/datatable-filters.component.js
//
// MODIFICATIONS:
// [01/02/2025] - Intégration de DropdownList pour tous les selects
// ========================================

import { generateId } from '../index.js';
import DropdownList from './dropdown-list.component.js';

export class DataTableFilters {
    constructor(options = {}) {
        this.options = {
            container: '.datatable-filters',
            filters: [],
            onFilter: () => {},
            debounceDelay: 300,
            ...options
        };
        
        this.container = typeof this.options.container === 'string' 
            ? document.querySelector(this.options.container)
            : this.options.container;
            
        if (!this.container) {
            console.error('DataTableFilters: Container non trouvé');
            return;
        }
        
        this.filters = {};
        this.values = {};
        this.dropdowns = {}; // Pour stocker les instances DropdownList
        this.debounceTimer = null;
        
        this.init();
    }
    
    init() {
        this.render();
        this.attachEventListeners();
    }
    
    render() {
        const filtersHtml = this.options.filters.map(filter => {
            const filterId = `filter-${filter.id}-${generateId()}`;
            this.filters[filter.id] = filterId;
            
            return `
                <div class="filter-group">
                    <label class="filter-label" for="${filterId}">${filter.label}</label>
                    ${this.renderFilter(filter, filterId)}
                </div>
            `;
        }).join('');
        
        this.container.innerHTML = `
            <div class="filters-container">
                <div class="filters-row">
                    ${filtersHtml}
                </div>
                <div class="filters-actions">
                    <button class="btn btn-secondary btn-sm reset-filters">
                        🔄 Réinitialiser
                    </button>
                </div>
            </div>
        `;
        
        // Initialiser les DropdownList après le rendu HTML
        this.initializeDropdowns();
    }
    
    renderFilter(filter, filterId) {
        switch (filter.type) {
            case 'text':
            case 'search':
                return `
                    <input type="text" 
                           id="${filterId}" 
                           class="filter-input" 
                           placeholder="${filter.placeholder || ''}"
                           value="${filter.defaultValue || ''}">
                `;
                
            case 'date':
                return `
                    <input type="date" 
                           id="${filterId}" 
                           class="filter-input" 
                           value="${filter.defaultValue || ''}">
                `;
                
            case 'daterange':
                return `
                    <div class="date-range">
                        <input type="date" 
                               id="${filterId}-start" 
                               class="filter-input" 
                               placeholder="Du">
                        <span class="date-separator">→</span>
                        <input type="date" 
                               id="${filterId}-end" 
                               class="filter-input" 
                               placeholder="Au">
                    </div>
                `;
                
            case 'select':
                // On crée juste un div container pour DropdownList
                return `<div id="${filterId}" class="filter-dropdown-container"></div>`;
                
            case 'checkbox':
                return `
                    <label class="checkbox-label">
                        <input type="checkbox" 
                               id="${filterId}" 
                               class="filter-checkbox"
                               ${filter.defaultValue ? 'checked' : ''}>
                        <span class="checkbox-text">${filter.checkboxLabel || ''}</span>
                    </label>
                `;
                
            default:
                return '';
        }
    }
    
    initializeDropdowns() {
        // Parcourir tous les filtres de type select
        this.options.filters.forEach(filter => {
            if (filter.type === 'select') {
                const filterId = this.filters[filter.id];
                const container = document.getElementById(filterId);
                
                if (container) {
                    // Préparer les options avec icônes si disponibles
                    const options = filter.options.map(opt => {
                        const option = {
                            value: opt.value,
                            label: opt.label
                        };
                        
                        // Ajouter l'icône si elle existe
                        if (opt.icon) {
                            option.icon = opt.icon;
                        }
                        
                        // Pour les descriptions
                        if (opt.description) {
                            option.description = opt.description;
                        }
                        
                        return option;
                    });
                    
                    // Créer l'instance DropdownList
                    this.dropdowns[filter.id] = new DropdownList({
                        container: `#${filterId}`,
                        placeholder: filter.placeholder || `Tous les ${filter.label.toLowerCase()}`,
                        options: options,
                        value: filter.defaultValue || '',
                        showIcons: filter.showIcons !== false, // Par défaut true si des icônes existent
                        searchable: filter.searchable || false,
                        onChange: (value) => {
                            this.values[filter.id] = value;
                            this.handleFilterChange();
                        }
                    });
                    
                    // Initialiser la valeur
                    if (filter.defaultValue) {
                        this.values[filter.id] = filter.defaultValue;
                    }
                }
            }
        });
    }
    
    attachEventListeners() {
        // Inputs text et date
        this.container.addEventListener('input', (e) => {
            if (e.target.matches('.filter-input')) {
                const filterId = Object.keys(this.filters).find(key => 
                    this.filters[key] === e.target.id ||
                    this.filters[key] + '-start' === e.target.id ||
                    this.filters[key] + '-end' === e.target.id
                );
                
                if (filterId) {
                    const filter = this.options.filters.find(f => f.id === filterId);
                    
                    if (filter.type === 'daterange') {
                        const start = document.getElementById(this.filters[filterId] + '-start').value;
                        const end = document.getElementById(this.filters[filterId] + '-end').value;
                        this.values[filterId] = { start, end };
                    } else {
                        this.values[filterId] = e.target.value;
                    }
                    
                    this.handleFilterChange();
                }
            }
        });
        
        // Checkboxes
        this.container.addEventListener('change', (e) => {
            if (e.target.matches('.filter-checkbox')) {
                const filterId = Object.keys(this.filters).find(key => 
                    this.filters[key] === e.target.id
                );
                
                if (filterId) {
                    this.values[filterId] = e.target.checked;
                    this.handleFilterChange();
                }
            }
        });
        
        // Bouton reset
        const resetBtn = this.container.querySelector('.reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    }
    
    handleFilterChange() {
        clearTimeout(this.debounceTimer);
        
        this.debounceTimer = setTimeout(() => {
            this.options.onFilter(this.getValues());
        }, this.options.debounceDelay);
    }
    
    getValues() {
        return { ...this.values };
    }
    
    setValue(filterId, value) {
        this.values[filterId] = value;
        
        const filter = this.options.filters.find(f => f.id === filterId);
        if (!filter) return;
        
        const elementId = this.filters[filterId];
        
        switch (filter.type) {
            case 'select':
                // Utiliser DropdownList
                if (this.dropdowns[filterId]) {
                    this.dropdowns[filterId].setValue(value);
                }
                break;
                
            case 'text':
            case 'search':
            case 'date':
                const input = document.getElementById(elementId);
                if (input) input.value = value;
                break;
                
            case 'daterange':
                if (value && typeof value === 'object') {
                    const startInput = document.getElementById(elementId + '-start');
                    const endInput = document.getElementById(elementId + '-end');
                    if (startInput) startInput.value = value.start || '';
                    if (endInput) endInput.value = value.end || '';
                }
                break;
                
            case 'checkbox':
                const checkbox = document.getElementById(elementId);
                if (checkbox) checkbox.checked = !!value;
                break;
        }
        
        this.handleFilterChange();
    }
    
    reset() {
        this.values = {};
        
        this.options.filters.forEach(filter => {
            const elementId = this.filters[filter.id];
            
            switch (filter.type) {
                case 'select':
                    // Reset DropdownList
                    if (this.dropdowns[filter.id]) {
                        this.dropdowns[filter.id].setValue(filter.defaultValue || '');
                    }
                    break;
                    
                case 'text':
                case 'search':
                case 'date':
                    const input = document.getElementById(elementId);
                    if (input) input.value = filter.defaultValue || '';
                    break;
                    
                case 'daterange':
                    const startInput = document.getElementById(elementId + '-start');
                    const endInput = document.getElementById(elementId + '-end');
                    if (startInput) startInput.value = '';
                    if (endInput) endInput.value = '';
                    break;
                    
                case 'checkbox':
                    const checkbox = document.getElementById(elementId);
                    if (checkbox) checkbox.checked = !!filter.defaultValue;
                    break;
            }
            
            if (filter.defaultValue !== undefined) {
                this.values[filter.id] = filter.defaultValue;
            }
        });
        
        this.handleFilterChange();
    }
    
    destroy() {
        // Détruire toutes les instances DropdownList
        Object.values(this.dropdowns).forEach(dropdown => {
            if (dropdown && typeof dropdown.destroy === 'function') {
                dropdown.destroy();
            }
        });
        
        this.dropdowns = {};
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        clearTimeout(this.debounceTimer);
    }
}

/* ========================================
   HISTORIQUE DES MODIFICATIONS
   
   [01/02/2025] - Intégration complète de DropdownList
   - Remplacement de tous les <select> natifs par DropdownList
   - Support des icônes dans les options
   - Gestion du destroy() pour nettoyer les dropdowns
   - Conservation de la compatibilité avec l'API existante
   
   AVANTAGES:
   - Interface homogène sur tout le site
   - Support des icônes et descriptions
   - Recherche possible dans les dropdowns
   - Style glassmorphism cohérent
   - Position fixed pour éviter les problèmes dans les modals
   
   NOTES:
   - Les filtres de type 'select' utilisent maintenant DropdownList
   - L'option showIcons est true par défaut si des icônes existent
   - L'option searchable peut être activée par filtre
   ======================================== */