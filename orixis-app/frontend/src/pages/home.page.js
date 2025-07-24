// src/js/pages/home.page.js
import { authService } from '../services/auth.service.js';
import { interventionService } from '../services/intervention.service.js';
import { storageService } from '../services/storage.service.js';
import { $ } from '../utils/dom.utils.js';
import { formatDate } from '../utils/date.utils.js';

export class HomePage {
    constructor() {
        this.user = authService.getCurrentUser();
        this.init();
    }

    init() {
        if (!this.user) {
            window.location.href = '/index.html';
            return;
        }

        this.displayUserInfo();
        this.loadStatistics();
        this.loadRecentInterventions();
        this.attachEvents();
    }

    displayUserInfo() {
        const magasinInfo = $('#magasin-info');
        if (magasinInfo) {
            magasinInfo.textContent = `Magasin: ${this.user.magasin}`;
        }

        // Afficher un message de bienvenue selon l'heure
        const hour = new Date().getHours();
        let greeting = 'Bonjour';
        if (hour >= 18) greeting = 'Bonsoir';
        else if (hour >= 12) greeting = 'Bon après-midi';

        const welcomeMessage = $('.header p');
        if (welcomeMessage) {
            welcomeMessage.textContent = `${greeting}, ${this.user.magasin}`;
        }
    }

    loadStatistics() {
        const stats = interventionService.getStoreStatistics();
        
        // Mettre à jour les statistiques affichées
        this.updateStatDisplay('stat-today', stats.today);
        this.updateStatDisplay('stat-month', stats.thisMonth);
        this.updateStatDisplay('stat-total', stats.total);

        // Créer un graphique simple des résultats
        this.createResultsChart(stats.byResult);
    }

    updateStatDisplay(elementId, value) {
        const element = $(`#${elementId}`);
        if (element) {
            element.textContent = value || '0';
            // Animation du nombre
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.transition = 'opacity 0.5s';
                element.style.opacity = '1';
            }, 100);
        }
    }

    createResultsChart(data) {
        const chartContainer = $('#results-chart');
        if (!chartContainer || !data) return;

        // Calculer le total
        const total = Object.values(data).reduce((sum, val) => sum + val, 0);
        if (total === 0) {
            chartContainer.innerHTML = '<p class="text-muted">Aucune intervention</p>';
            return;
        }

        // Créer un graphique en barres simple
        const chartHTML = `
            <div class="results-chart">
                ${Object.entries(data).map(([result, count]) => {
                    const percentage = ((count / total) * 100).toFixed(1);
                    const color = this.getResultColor(result);
                    return `
                        <div class="chart-row">
                            <span class="chart-label">${result}</span>
                            <div class="chart-bar-container">
                                <div class="chart-bar" style="width: ${percentage}%; background: ${color};">
                                    <span class="chart-value">${count}</span>
                                </div>
                            </div>
                            <span class="chart-percentage">${percentage}%</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        chartContainer.innerHTML = chartHTML;
    }

    getResultColor(result) {
        const colors = {
            'Résolu': '#27ae60',
            'Partiel': '#f39c12',
            'SAV': '#e74c3c',
            'OK': '#3498db'
        };
        return colors[result] || '#95a5a6';
    }

    loadRecentInterventions() {
        const container = $('#recent-interventions');
        if (!container) return;

        const recentInterventions = interventionService.getRecentInterventions(5);
        
        if (recentInterventions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Aucune intervention récente</p>
                    <a href="/fiche-intervention.html" class="btn btn-primary">
                        Créer une intervention
                    </a>
                </div>
            `;
            return;
        }

        const tableHTML = `
            <table class="interventions-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Client</th>
                        <th>Type</th>
                        <th>Résultat</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentInterventions.map(intervention => `
                        <tr>
                            <td>${formatDate(intervention.date)}</td>
                            <td>${intervention.nom || 'N/A'}</td>
                            <td>${intervention.type_appareil || 'N/A'}</td>
                            <td>
                                <span class="badge badge-${this.getResultClass(intervention.resultat)}">
                                    ${intervention.resultat || 'N/A'}
                                </span>
                            </td>
                            <td>
                                <button class="btn-icon" onclick="window.orixisApp.viewIntervention('${intervention.id}')">
                                    👁️
                                </button>
                                <button class="btn-icon" onclick="window.orixisApp.printIntervention('${intervention.id}')">
                                    🖨️
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    getResultClass(result) {
        const classes = {
            'Résolu': 'success',
            'Partiel': 'warning',
            'SAV': 'danger',
            'OK': 'info'
        };
        return classes[result] || 'secondary';
    }

    attachEvents() {
        // Bouton de rafraîchissement des stats
        const refreshBtn = $('#refresh-stats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadStatistics();
                this.loadRecentInterventions();
                this.showMessage('Données actualisées', 'success');
            });
        }

        // Export des données
        const exportBtn = $('#export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
    }

    exportData() {
        const data = storageService.exportInterventions({
            magasin: this.user.magasin
        });

        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orixis-export-${this.user.magasin}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showMessage('Données exportées avec succès', 'success');
    }

    showMessage(message, type = 'info') {
        // Utiliser la méthode globale si disponible
        if (window.orixisApp && window.orixisApp.showMessage) {
            window.orixisApp.showMessage(message, type);
        } else {
            alert(message);
        }
    }
}

// Fonctions globales pour les boutons inline
window.orixisApp = window.orixisApp || {};

window.orixisApp.viewIntervention = function(id) {
    const result = interventionService.loadIntervention(id);
    if (result.success) {
        window.location.href = '/fiche-impression.html';
    }
};

window.orixisApp.printIntervention = function(id) {
    const result = interventionService.generatePDF(id);
    if (result.success) {
        window.location.href = result.printUrl;
    }
};