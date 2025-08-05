// Import
import { ProgressTimeline } from '/src/components/ui/progress-timeline/progress-timeline.component.js';

// Création
const timeline = new ProgressTimeline({
    container: '#timeline-container',
    title: 'PROGRESSION GLOBALE',
    items: [
        { label: 'Créé', status: 'completed', date: '15/12', icon: '✅' },
        { label: 'Docs', status: 'completed', date: '20/12', icon: '✅' },
        { label: 'Dépôt', status: 'completed', date: '25/01', icon: '✅' },
        { label: 'BLOQUÉ', status: 'current', date: 'ICI', icon: '🔴' },
        { label: 'Récép', status: 'pending', date: '???', icon: '⏳' },
        { label: 'Attest', status: 'pending', date: '???', icon: '⏳' },
        { label: 'AGEF', status: 'pending', date: '???', icon: '⏳' },
        { label: 'Final', status: 'pending', date: '???', icon: '⏳' }
    ],
    onItemClick: (item, index) => {
        console.log('Clicked:', item.label, index);
    },
    onProgressChange: (progress) => {
        console.log('Progress:', progress + '%');
    }
});