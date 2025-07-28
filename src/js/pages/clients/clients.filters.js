/* ========================================
   CLIENTS.FILTERS.JS - Gestion des filtres clients
   Chemin: src/js/pages/clients/clients.filters.js
   
   DESCRIPTION:
   Gère les filtres de la page clients en utilisant
   le composant FilterPanel avec style glassmorphism.
   
   STRUCTURE:
   1. Import et configuration (lignes 20-40)
   2. Initialisation des filtres (lignes 41-150)
   3. Gestion des changements (lignes 151-200)
   4. Utilitaires (lignes 201-250)
   
   DÉPENDANCES:
   - filter-panel.component.js (composant filtres)
   - firebase (pour charger les magasins)
   ======================================== */

// ========================================
// IMPORTS
// ========================================
import FilterPanel from '../../shared/ui/filters/filter-panel.component.js';
import { db } from '../../services/firebase.service.js';

// ========================================
// VARIABLES
// ========================================
let filterInstance = null;
let onChangeCallback = null;
let magasinsOptions = [];

// ========================================
// INITIALISATION
// ========================================
export async function initClientsFilters(onChange) {
    console.log('🔍 Initialisation des filtres clients...');
    
    onChangeCallback = onChange;
    
    const container = document.getElementById('clientsFilters');
    if (!container) {
        console.error('❌ Container clientsFilters introuvable');
        return;
    }
    
    // Charger les options de magasins
    await loadMagasinsOptions();
    
    // Configuration des filtres
    const filters = [
        {
            field: 'search',
            type: 'text',
            label: 'Rechercher',
            placeholder: 'Nom, prénom, téléphone, email...',
            icon: '🔍',
            debounce: 300
        },
        {
            field: 'magasin',
            type: 'select',
            label: 'Magasin',
            placeholder: 'Tous les magasins',
            icon: '🏪',
            options: [
                { value: 'tous', label: 'Tous les magasins' },
                ...magasinsOptions
            ]
        },
        {
            field: 'statut',
            type: 'select',
            label: 'Statut',
            placeholder: 'Tous les statuts',
            icon: '🚦',
            options: [
                { value: 'tous', label: 'Tous les statuts' },
                { value: 'actif', label: 'Clients actifs' },
                { value: 'inactif', label: 'Clients inactifs' }
            ]
        },
        {
            field: 'dateRange',
            type: 'daterange',
            label: 'Date de création',
            placeholder: 'Période',
            icon: '📅'
        }
    ];
    
    // Créer le panneau de filtres
    filterInstance = FilterPanel.create({
        filters,
        style: 'glassmorphism',
        layout: 'horizontal',
        mode: 'simple',
        animation: 'smooth',
        features: {
            persistence: {
                enabled: true,
                storage: 'local',
                key: 'clients-filters',
                autoLoad: true,
                autoSave: true
            },
            validation: {
                enabled: true,
                realtime: true
            }
        },
        i18n: {
            clear: 'Effacer',
            clearAll: 'Tout effacer',
            apply: 'Appliquer'
        }
    });
    
    // Ajouter au container
    container.appendChild(filterInstance.container);
    
    // Écouter les changements
    filterInstance.on('filterChanged', handleFilterChange);
    filterInstance.on('filtersCleared', handleFiltersClear);
    
    // Appliquer les filtres sauvegardés
    const savedFilters = filterInstance.getActiveFilters();
    if (Object.keys(savedFilters).length > 0) {
        handleFilterChange({ filters: savedFilters });
    }
    
    console.log('✅ Filtres clients initialisés');
}

// ========================================
// GESTION DES CHANGEMENTS
// ========================================
function handleFilterChange(event) {
    console.log('🔄 Changement de filtres:', event);
    
    const filters = event.filters || filterInstance.getActiveFilters();
    const processedFilters = {};
    
    // Traiter chaque filtre
    Object.entries(filters).forEach(([field, filterData]) => {
        if (filterData.value !== null && filterData.value !== '') {
            switch (field) {
                case 'search':
                    processedFilters.search = filterData.value;
                    break;
                    
                case 'magasin':
                    processedFilters.magasin = filterData.value;
                    break;
                    
                case 'statut':
                    processedFilters.statut = filterData.value;
                    break;
                    
                case 'dateRange':
                    if (filterData.value.from || filterData.value.to) {
                        processedFilters.dateDebut = filterData.value.from;
                        processedFilters.dateFin = filterData.value.to;
                    }
                    break;
            }
        }
    });
    
    // Appeler le callback
    if (onChangeCallback) {
        onChangeCallback(processedFilters);
    }
}

function handleFiltersClear() {
    console.log('🧹 Effacement des filtres');
    
    if (onChangeCallback) {
        onChangeCallback({
            search: '',
            magasin: '',
            statut: '',
            dateDebut: null,
            dateFin: null
        });
    }
}

// ========================================
// CHARGEMENT DES OPTIONS
// ========================================
async function loadMagasinsOptions() {
    try {
        const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const q = query(
            collection(db, 'magasins'),
            where('actif', '==', true)
        );
        
        const snapshot = await getDocs(q);
        
        magasinsOptions = [];
        snapshot.forEach(doc => {
            const magasin = doc.data();
            magasinsOptions.push({
                value: doc.id,
                label: magasin.nom
            });
        });
        
        // Trier par nom
        magasinsOptions.sort((a, b) => a.label.localeCompare(b.label));
        
        console.log(`📍 ${magasinsOptions.length} magasins chargés pour les filtres`);
        
    } catch (error) {
        console.error('❌ Erreur chargement magasins:', error);
        magasinsOptions = [];
    }
}

// ========================================
// API PUBLIQUE
// ========================================
export function getActiveFilters() {
    if (!filterInstance) return {};
    return filterInstance.getActiveFilters();
}

export function clearFilters() {
    if (!filterInstance) return;
    filterInstance.clearFilters();
}

export function setFilter(field, value) {
    if (!filterInstance) return;
    filterInstance.updateFilter(field, value);
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-28] - Synchronisation filtres date range
   Solution: Conversion dateRange vers dateDebut/dateFin
   
   [2024-01-28] - Persistence des filtres
   Solution: Utilisation feature persistence du composant
   
   NOTES POUR REPRISES FUTURES:
   - Les filtres sont sauvegardés dans localStorage
   - Le debounce sur la recherche évite trop d'appels
   - Les options de magasins sont chargées dynamiquement
   ======================================== */