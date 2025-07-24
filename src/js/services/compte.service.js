import { getFirestore, doc, updateDoc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export class CompteService {
    static db = null;
    
    static async init() {
        if (!this.db) {
            this.db = getFirestore();
        }
    }
    
    static async verifyPin(userId, pin) {
        await this.init();
        try {
            const userRef = doc(this.db, 'utilisateurs', userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                return userData.code === pin;
            }
            return false;
        } catch (error) {
            console.error('Erreur vérification PIN:', error);
            return false;
        }
    }
    
    static async updatePin(userId, newPin) {
        await this.init();
        try {
            const userRef = doc(this.db, 'utilisateurs', userId);
            await updateDoc(userRef, {
                code: newPin,
                lastPasswordChange: Date.now()
            });
            return true;
        } catch (error) {
            console.error('Erreur mise à jour PIN:', error);
            throw error;
        }
    }
    
    static async updateUser(userId, data) {
        await this.init();
        try {
            const userRef = doc(this.db, 'utilisateurs', userId);
            await updateDoc(userRef, data);
            return true;
        } catch (error) {
            console.error('Erreur mise à jour utilisateur:', error);
            throw error;
        }
    }
    
    static async createUser(userData) {
        await this.init();
        try {
            const userRef = doc(this.db, 'utilisateurs', userData.id);
            await setDoc(userRef, userData);
            return true;
        } catch (error) {
            console.error('Erreur création utilisateur:', error);
            throw error;
        }
    }
    
    static createUserCard(user, isAdmin = false, showMagasins = false) {
        const roleLabels = {
            'admin': '👑 Administrateur',
            'manager': '👔 Manager', 
            'audioprothesiste': '🦻 Audioprothésiste',
            'assistant': '📋 Assistant',
            'technicien': '🔧 Technicien'
        };
        
        const roleColors = {
            'admin': 'role-admin',
            'manager': 'role-manager',
            'audioprothesiste': 'role-audioprothesiste',
            'assistant': 'role-assistant',
            'technicien': 'role-technicien'
        };
        
        // Récupérer les magasins depuis les autorisations
        const autorisations = user.autorisations || {};
        const magasins = Object.keys(autorisations).filter(mag => autorisations[mag].acces === true);
        const magasinActuel = user.magasinActuel || user.magasinParDefaut || magasins[0] || 'Non assigné';
        
        return `
            <div class="user-card" id="card-${user.id}">
                <div class="card-header">
                    <div class="user-avatar">
                        ${user.prenom.charAt(0)}${user.nom.charAt(0)}
                    </div>
                    <div class="user-main-info">
                        <h3>
                            <span class="editable" data-field="prenom">${user.prenom}</span>
                            <span class="editable" data-field="nom">${user.nom}</span>
                        </h3>
                        <span class="role-badge ${roleColors[user.role]}">
                            ${isAdmin ? 
                                `<select class="role-select" data-field="role" style="display: none;">
                                    <option value="technicien" ${user.role === 'technicien' ? 'selected' : ''}>🔧 Technicien</option>
                                    <option value="audioprothesiste" ${user.role === 'audioprothesiste' ? 'selected' : ''}>🦻 Audioprothésiste</option>
                                    <option value="assistant" ${user.role === 'assistant' ? 'selected' : ''}>📋 Assistant</option>
                                    <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>👔 Manager</option>
                                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>👑 Administrateur</option>
                                </select>
                                <span class="role-text">${roleLabels[user.role]}</span>`
                                : roleLabels[user.role]
                            }
                        </span>
                    </div>
                </div>
                
                <div class="card-body">
                    ${showMagasins && magasins.length > 0 ? `
                        <div class="info-row">
                            <span class="info-label">📍 Magasin actuel</span>
                            <span class="info-value">
                                <strong class="magasin-badge">${magasinActuel}</strong>
                            </span>
                        </div>
                    ` : ''}
                    
                    <div class="info-row">
                        <span class="info-label">📍 Magasins</span>
                        <span class="info-value">${magasins.length > 0 ? magasins.join(', ') : 'Non assigné'}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">🔐 Code utilisateur</span>
                        <span class="info-value">••••</span>
                    </div>
                    
                    ${user.id ? `
                        <div class="info-row">
                            <span class="info-label">🆔 ID</span>
                            <span class="info-value">${user.id}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="card-actions">
                    <button class="btn-action btn-pin" onclick="changePin('${user.id}')">
                        🔐 Changer le code
                    </button>
                    ${isAdmin ? `
                        <button class="btn-action btn-edit" onclick="editUser('${user.id}')">
                            ✏️ Modifier
                        </button>
                        <button class="btn-action btn-save" style="display: none;" onclick="saveUser('${user.id}')">
                            💾 Sauvegarder
                        </button>
                    ` : ''}
                </div>
                
                ${showMagasins && magasins.length > 0 ? `
                    <div class="magasins-section">
                        <h4>🏪 Magasins autorisés</h4>
                        <div class="magasins-list">
                            ${magasins.map(mag => `
                                <div class="magasin-item ${mag === magasinActuel ? 'active' : ''}">
                                    <span class="magasin-name">${mag}</span>
                                    ${autorisations[mag].permissions ? 
                                        `<span class="permissions-count">${autorisations[mag].permissions.length} permissions</span>` 
                                        : '<span class="permissions-count">Accès complet</span>'
                                    }
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
}
