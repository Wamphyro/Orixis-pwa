import { StatsCardsWidget } from '/widgets/stats-cards/stats-cards.widget.js';

const stats = new StatsCardsWidget({
    container: '.stats',
    size: 'md',              // Taille des cartes
    columns: 'auto',         // ou 2, 3, 4, 6
    selectionMode: 'multiple',
    cards: [
        { id: 'new', label: 'Nouvelles', icon: '📥', value: 10, color: 'info' },
        { id: 'pending', label: 'En attente', icon: '⏳', value: 5, color: 'warning' }
    ],
    onSelect: (selectedIds) => {
        console.log('Sélection:', selectedIds);
    }
});

// Mise à jour
stats.updateAll({ new: 15, pending: 8 });

// Changer la taille
stats.setSize('lg');

// Sélection
stats.toggleSelect('new');


// AVEC wrapper englobant
const stats = new StatsCardsWidget({
    container: '.stats-container',
    showWrapper: true,           // ✅ Active le wrapper
    wrapperStyle: 'card',        // Style du wrapper
    wrapperTitle: 'Statistiques', // Titre optionnel
    size: 'md',
    cards: [
        { id: 'new', label: 'Nouvelles', icon: '📥', value: 10, color: 'info' }
    ]
});

// SANS wrapper (comportement normal)
const stats2 = new StatsCardsWidget({
    container: '.autre-container',
    showWrapper: false,          // Pas de wrapper
    cards: [...]
});