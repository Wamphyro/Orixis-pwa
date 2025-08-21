import { SearchFiltersWidget } from '/widgets/search-filters/search-filters.widget.js';

const filters = new SearchFiltersWidget({
    container: '.filters-zone',
    showWrapper: true,
    wrapperStyle: 'card',
    wrapperTitle: 'Filtres',
    filters: [
        { type: 'search', key: 'search', placeholder: 'Rechercher...' },
        { type: 'select', key: 'status', label: 'Statut', options: [
            { value: 'active', label: 'Actif', icon: '✅' },
            { value: 'inactive', label: 'Inactif', icon: '❌' }
        ], searchable: true },
        { type: 'select', key: 'tags', label: 'Tags', options: [...], multiple: true },
        { type: 'date', key: 'date', label: 'Date' }
    ],
    onFilter: (values) => console.log('Filtres:', values)
});