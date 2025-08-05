// Import
import { DelayTracker } from '/src/components/ui/delay-tracker/delay-tracker.component.js';

// Création
const tracker = new DelayTracker({
    container: '#delay-tracker-container',
    title: 'FOCUS : RÉCÉPISSÉ MDPH EN RETARD',
    startDate: '2024-01-25',
    startLabel: 'Dépôt MDPH',
    currentLabel: 'Aujourd\'hui',
    warningDays: 60,
    criticalDays: 75,
    onDelayChange: (days, status) => {
        console.log(`${days} jours écoulés - Statut: ${status}`);
    },
    onMarkerClick: (marker) => {
        console.log('Marqueur cliqué:', marker);
    }
});

// Mise à jour dynamique
tracker.updateDates('2024-01-25', new Date(), '2024-06-30');