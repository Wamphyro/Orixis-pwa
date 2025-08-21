export class MagasinsAutorisesComponent {
    static render(currentUser, currentAuth) {
        const autorisations = currentUser.autorisations || {};
        const magasins = Object.keys(autorisations).filter(mag => autorisations[mag].acces === true);
        
        return `
            <div class="compte-section-container">
                <div class="compte-section-header">
                    <h2>🏪 Mes magasins autorisés</h2>
                </div>
                <div class="compte-section-content">
                    ${magasins.length === 0 ? 
                        '<p class="no-data">Aucun magasin autorisé</p>' :
                        `<div class="magasins-grid">
                            ${this.renderMagasinCards(magasins, autorisations, currentAuth.magasin)}
                        </div>`
                    }
                </div>
            </div>
        `;
    }
    
    static renderMagasinCards(magasins, autorisations, magasinActuel) {
        return magasins.map(magasin => {
            const isActive = magasin === magasinActuel;
            const permissions = autorisations[magasin];
            
            return `
                <div class="magasin-card ${isActive ? 'active' : ''}">
                    <div class="magasin-header">
                        <h4>${magasin}</h4>
                        ${isActive ? '<span class="badge-active">Actif</span>' : ''}
                    </div>
                    <div class="magasin-info">
                        <p><strong>Accès:</strong> ${permissions?.acces ? '✅ Autorisé' : '❌ Refusé'}</p>
                        ${permissions?.permissions ? 
                            `<p><strong>Permissions:</strong></p>
                             <ul class="permissions-list">
                                ${permissions.permissions.map(p => `<li>• ${p}</li>`).join('')}
                             </ul>` 
                            : ''
                        }
                    </div>
                    ${!isActive ? 
                        `<button class="btn-switch-magasin" onclick="switchMagasin('${magasin}')">
                            Basculer vers ce magasin
                        </button>` : ''
                    }
                </div>
            `;
        }).join('');
    }
}
