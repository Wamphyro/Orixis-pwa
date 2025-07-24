import { CompteService } from '../services/compte.service.js';

export class InfosPersonnellesComponent {
    static render(currentUser, currentAuth) {
        const magasinActuel = currentAuth.magasin;
        
        return `
            <div class="compte-section-container">
                <div class="compte-section-header">
                    <h2>👤 Mes informations personnelles</h2>
                </div>
                <div class="compte-section-content">
                    <div class="user-info-card">
                        <div class="user-info-content">
                            <div class="user-avatar">
                                ${this.getInitials(currentUser.prenom, currentUser.nom)}
                            </div>
                            <div class="user-details">
                                <h3>${currentUser.prenom} ${currentUser.nom}</h3>
                                <p class="user-role">${this.getRoleLabel(currentUser.role)}</p>
                                <p class="user-id">ID: ${currentUser.id}</p>
                                <p class="current-magasin">
                                    <strong>Magasin actuel:</strong> 
                                    <span class="magasin-badge">${magasinActuel}</span>
                                </p>
                            </div>
                            <div class="user-actions">
                                <button class="btn-primary" onclick="changePin('${currentUser.id}')">
                                    🔐 Changer mon code PIN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    static getInitials(prenom, nom) {
        return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
    }
    
    static getRoleLabel(role) {
        const labels = {
            'admin': '👑 Administrateur',
            'Administrateur': '👑 Administrateur',
            'manager': '👔 Manager',
            'audioprothesiste': '🦻 Audioprothésiste',
            'assistant': '📋 Assistant SAV',
            'technicien': '🔧 Technicien'
        };
        return labels[role] || role;
    }
}
