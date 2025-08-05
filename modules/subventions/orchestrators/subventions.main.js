// ========================================
// SUBVENTIONS.MAIN.JS - Version simplifiée
// Chemin: modules/subventions/orchestrators/subventions.main.js
// ========================================

// Depuis orchestrators/, aller dans core/
import config from '../core/subventions.config.js';

class SubventionsMain {
    constructor() {
        this.dossiersMock = this.getMockData();
        this.appHeader = null;
    }
    
    async init() {
        console.log('✅ Module Subventions démarré');
        
        // Créer le header
        this.initHeader();
        
        // Ajouter la classe pour les animations
        document.body.classList.add('page-loaded');
        
        // Rendre la page
        this.renderPage();
    }
    
    initHeader() {
        // Données utilisateur (mock pour l'instant)
        const userData = {
            name: 'Jean Dupont',
            store: 'Magasin Paris',
            showLogout: true
        };
        
        // Créer le header avec la factory
        this.appHeader = config.createSubventionsHeader(userData);
    }
    
    renderPage() {
        // Créer un container pour le contenu (après le header)
        let container = document.getElementById('subventions-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'subventions-container';
            container.className = 'subventions-container';
            document.body.appendChild(container);
        }
        
        container.innerHTML = `
            <main class="subventions-content">
                <div class="container">
                    <h2>Liste des dossiers</h2>
                    
                    <!-- Tableau simple -->
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>N° Dossier</th>
                                    <th>Patient</th>
                                    <th>MDPH</th>
                                    <th>AGEFIPH</th>
                                    <th>Montant</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderTableRows()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        `;
    }
    
    renderTableRows() {
        return this.dossiersMock.map(dossier => `
            <tr>
                <td>${dossier.numero}</td>
                <td>
                    <strong>${dossier.patient.nom} ${dossier.patient.prenom}</strong><br>
                    <small>${dossier.patient.telephone}</small>
                </td>
                <td>
                    <span class="badge badge-${this.getStatusClass(dossier.mdph.statut)}">
                        ${dossier.mdph.statut}
                    </span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${dossier.mdph.progression}%"></div>
                    </div>
                </td>
                <td>
                    <span class="badge badge-${this.getStatusClass(dossier.agefiph.statut)}">
                        ${dossier.agefiph.statut}
                    </span>
                    <div class="progress-bar">
                        <div class="progress-fill agefiph" style="width: ${dossier.agefiph.progression}%"></div>
                    </div>
                </td>
                <td>${dossier.montant}€</td>
                <td>
                    <button class="btn-icon" onclick="alert('Voir dossier ${dossier.numero}')">
                        👁️
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    getStatusClass(statut) {
        const classes = {
            'nouveau': 'primary',
            'documents': 'info',
            'depot': 'warning',
            'accord': 'success'
        };
        return classes[statut] || 'secondary';
    }
    
    getMockData() {
        return [
            {
                numero: 'SUB-2024-0001',
                patient: {
                    nom: 'MARTIN',
                    prenom: 'Jean',
                    telephone: '06 12 34 56 78'
                },
                mdph: {
                    statut: 'depot',
                    progression: 60
                },
                agefiph: {
                    statut: 'documents',
                    progression: 40
                },
                montant: 3500
            },
            {
                numero: 'SUB-2024-0002',
                patient: {
                    nom: 'DURAND',
                    prenom: 'Marie',
                    telephone: '06 98 76 54 32'
                },
                mdph: {
                    statut: 'accord',
                    progression: 100
                },
                agefiph: {
                    statut: 'depot',
                    progression: 80
                },
                montant: 4200
            }
        ];
    }
}

// Initialiser au chargement
window.addEventListener('load', () => {
    const app = new SubventionsMain();
    app.init();
});