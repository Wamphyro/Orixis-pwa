// Import
import { ProgressOverview } from '/src/components/ui/progress-overview/progress-overview.component.js';

// Création
const overview = new ProgressOverview({
    container: '#progress-container',
    title: 'VUE D\'ENSEMBLE DU PARCOURS',
    items: [
        { 
            id: 'mdph', 
            label: 'MDPH', 
            value: 75, 
            status: 'EN RETARD',
            color: 'red'
        },
        { 
            id: 'agefiph', 
            label: 'AGEFIPH', 
            value: 35, 
            status: 'EN ATTENTE',
            color: 'orange'
        },
        { 
            id: 'global', 
            label: 'GLOBAL', 
            value: 55, 
            status: 'BLOQUÉ',
            color: 'auto' // couleur basée sur la valeur
        }
    ],
    onItemClick: (item) => {
        console.log('Clicked:', item.label);
    }
});

// Mise à jour dynamique
overview.updateItem('mdph', { value: 80, status: 'EN COURS' });