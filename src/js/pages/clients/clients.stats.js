/* ========================================
   CLIENTS.STATS.JS - Gestion des statistiques clients
   Chemin: src/js/pages/clients/clients.stats.js
   
   DESCRIPTION:
   Calcule et affiche les statistiques des clients
   avec animations fluides.
   
   STRUCTURE:
   1. Configuration (lignes 20-30)
   2. Mise à jour des stats (lignes 31-100)
   3. Animations (lignes 101-150)
   4. Calculs spécifiques (lignes 151-250)
   
   DÉPENDANCES:
   - Aucune dépendance externe
   ======================================== */

// ========================================
// CONFIGURATION
// ========================================
const ANIMATION_DURATION = 1000; // ms
const ANIMATION_STEPS = 30;

// ========================================
// MISE À JOUR DES STATISTIQUES
// ========================================
export function updateClientsStats(allClients, filteredClients) {
    console.log('📊 Mise à jour des statistiques clients...');
    
    // Calculer les statistiques
    const stats = calculateStats(allClients, filteredClients);
    
    // Mettre à jour l'affichage avec animation
    animateNumber('statTotal', stats.total);
    animateNumber('statActifs', stats.actifs);
    animateNumber('statNouveaux', stats.nouveaux);
    animateNumber('statMagasin', stats.magasin);
}

// ========================================
// CALCULS DES STATISTIQUES
// ========================================
function calculateStats(allClients, filteredClients) {
    const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
    const currentMagasin = auth.magasin;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Total des clients (filtrés)
    const total = filteredClients.length;
    
    // Clients actifs (parmi les filtrés)
    const actifs = filteredClients.filter(client => client.actif !== false).length;
    
    // Nouveaux clients ce mois (parmi les filtrés)
    const nouveaux = filteredClients.filter(client => {
        const dateCreation = getClientDate(client.dateCreation);
        return dateCreation >= startOfMonth;
    }).length;
    
    // Clients du magasin actuel (parmi les filtrés)
    const magasin = currentMagasin 
        ? filteredClients.filter(client => client.magasinReference === currentMagasin).length
        : 0;
    
    console.log('📈 Stats calculées:', { total, actifs, nouveaux, magasin });
    
    return { total, actifs, nouveaux, magasin };
}

// ========================================
// ANIMATIONS
// ========================================
function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Récupérer la valeur actuelle
    const currentValue = parseInt(element.textContent) || 0;
    
    // Si pas de changement, ne pas animer
    if (currentValue === targetValue) return;
    
    // Calculer le pas d'animation
    const step = (targetValue - currentValue) / ANIMATION_STEPS;
    const stepDuration = ANIMATION_DURATION / ANIMATION_STEPS;
    
    let current = currentValue;
    let stepCount = 0;
    
    // Fonction d'animation
    const animate = () => {
        stepCount++;
        
        if (stepCount < ANIMATION_STEPS) {
            current += step;
            element.textContent = Math.round(current);
            setTimeout(animate, stepDuration);
        } else {
            // Dernière étape : s'assurer d'avoir la valeur exacte
            element.textContent = targetValue;
            
            // Effet de pulsation à la fin
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    };
    
    // Démarrer l'animation
    animate();
}

// ========================================
// UTILITAIRES
// ========================================
function getClientDate(dateField) {
    if (!dateField) return new Date(0);
    
    // Si c'est un timestamp Firestore
    if (dateField.toDate && typeof dateField.toDate === 'function') {
        return dateField.toDate();
    }
    
    // Si c'est une date JavaScript
    if (dateField instanceof Date) {
        return dateField;
    }
    
    // Si c'est une string ou un nombre
    return new Date(dateField);
}

// ========================================
// STATISTIQUES AVANCÉES (pour futur)
// ========================================
export function getAdvancedStats(clients) {
    // Cette fonction peut être étendue pour des stats plus complexes
    const stats = {
        // Répartition par magasin
        parMagasin: {},
        
        // Évolution mensuelle
        evolutionMensuelle: [],
        
        // Top magasins
        topMagasins: [],
        
        // Taux d'activité
        tauxActivite: 0
    };
    
    // Répartition par magasin
    clients.forEach(client => {
        const magasin = client.magasinReference || 'Non défini';
        stats.parMagasin[magasin] = (stats.parMagasin[magasin] || 0) + 1;
    });
    
    // Top 5 magasins
    stats.topMagasins = Object.entries(stats.parMagasin)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([magasin, count]) => ({ magasin, count }));
    
    // Taux d'activité
    const actifs = clients.filter(c => c.actif !== false).length;
    stats.tauxActivite = clients.length > 0 ? (actifs / clients.length * 100).toFixed(1) : 0;
    
    // Évolution mensuelle (6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    for (let i = 0; i < 6; i++) {
        const monthStart = new Date(sixMonthsAgo);
        monthStart.setMonth(monthStart.getMonth() + i);
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        
        const count = clients.filter(client => {
            const date = getClientDate(client.dateCreation);
            return date >= monthStart && date < monthEnd;
        }).length;
        
        stats.evolutionMensuelle.push({
            mois: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
            nouveaux: count
        });
    }
    
    return stats;
}

// ========================================
// EXPORT DE STATS
// ========================================
export function exportStats(clients) {
    const stats = getAdvancedStats(clients);
    
    // Format pour export
    const exportData = {
        date: new Date().toLocaleDateString('fr-FR'),
        heure: new Date().toLocaleTimeString('fr-FR'),
        totalClients: clients.length,
        clientsActifs: clients.filter(c => c.actif !== false).length,
        tauxActivite: stats.tauxActivite + '%',
        repartitionMagasins: stats.parMagasin,
        top5Magasins: stats.topMagasins
    };
    
    return exportData;
}

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [2024-01-28] - Animation fluide des nombres
   Solution: RequestAnimationFrame remplacé par setTimeout
   
   [2024-01-28] - Dates Firestore vs JS
   Solution: Fonction getClientDate pour normaliser
   
   NOTES POUR REPRISES FUTURES:
   - Les animations peuvent être désactivées si besoin
   - Les stats avancées sont prêtes mais non utilisées
   - L'export de stats est disponible
   ======================================== */