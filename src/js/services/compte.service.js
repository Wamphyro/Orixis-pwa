import { getFirestore, doc, updateDoc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

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
    
    static async deleteUser(userId) {
        await this.init();
        try {
            const userRef = doc(this.db, 'utilisateurs', userId);
            await deleteDoc(userRef);
            return true;
        } catch (error) {
            console.error('Erreur suppression utilisateur:', error);
            throw error;
        }
    }
    
    static createUserCard(user, isAdmin = false) {
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
        
        return `
            <div class="user-card" id="card-${user.id}">
                <div class="card-header">
                    <div class="user-avatar">
                        👤
                    </div>
                    <div class="user-main-info">
                        <h3>
                            <span class="editable" data-field="prenom">${user.prenom}</span>
                            <span class="editable" data-field="nom">${user.nom}</span>
                        </h3>
                        <span class="role-badge ${roleColors[user.role] || ''}">
                            ${roleLabels[user.role] || user.role}
                        </span>
                    </div>
                </div>
                
                <div class="card-body">
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
                        <button class="btn-action btn-delete" onclick="deleteUser('${user.id}')">
                            🗑️ Supprimer
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
}
