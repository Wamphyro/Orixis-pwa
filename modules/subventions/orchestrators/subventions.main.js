// ========================================
// SUBVENTIONS.MAIN.JS - Version simplifiée
// Chemin: modules/subventions/orchestrators/subventions.main.js
// ========================================

class SubventionsMain {
    constructor() {
        this.dossiersMock = this.getMockData();
    }
    
    init() {
        console.log('✅ Module Subventions démarré');
        this.renderPage();
    }
    
    renderPage() {
        const app = document.getElementById('app');
        if (!app) return;
        
        app.innerHTML = `
            <div class="subventions-module">
                <header class="subventions-header">
                    <h1>📋 Gestion des Subventions</h1>
                </header>
                
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
            </div>
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
                        <div class="progress-fill" style="width: ${dossier.agefiph.progression}%"></div>
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
            },
            {
                numero: 'SUB-2024-0003',
                patient: {
                    nom: 'BERNARD',
                    prenom: 'Pierre',
                    telephone: '06 11 22 33 44'
                },
                mdph: {
                    statut: 'nouveau',
                    progression: 0
                },
                agefiph: {
                    statut: 'nouveau',
                    progression: 0
                },
                montant: 3800
            }
        ];
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    const app = new SubventionsMain();
    app.init();
});