import { getFirestore, doc, updateDoc, getDoc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { chargerRoles } from '../services/firebase.service.js';

export class CompteService {
    static db = null;
    static rolesData = null;
    
    static async init() {
        if (!this.db) {
            this.db = getFirestore();
        }
        // Charger les rôles au démarrage
        if (!this.rolesData) {
            this.rolesData = await chargerRoles();
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
    
    static async createUserCard(user, isAdmin = false) {
        // S'assurer que les rôles sont chargés
        await this.init();
        
        // Utiliser les rôles de la base de données
        const roleData = this.rolesData && this.rolesData[user.role] ? 
            this.rolesData[user.role] : 
            { label: user.role, nom: user.role };
        
        // Générer la couleur CSS basée sur le rôle
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
                            <span class="editable" data-field="prenom" data-user="${user.id}">${user.prenom}</span>
                            <span class="editable" data-field="nom" data-user="${user.id}">${user.nom}</span>
                        </h3>
                        <span class="role-badge ${roleColors[user.role] || ''}" title="Niveau ${roleData.niveau || 0}" data-user="${user.id}">
                            ${roleData.label}
                        </span>
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="info-row">
                        <span class="info-label">📍 Magasins</span>
                        <span class="info-value editable-magasins" data-user="${user.id}">${magasins.length > 0 ? magasins.join(', ') : 'Non assigné'}</span>
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
                    
                    <!-- Sélecteur de rôle caché pour la modification -->
                    <div class="role-selector" style="display: none;">
                        <select class="role-select" data-user="${user.id}">
                            ${this.generateRoleOptions(user.role)}
                        </select>
                    </div>
                </div>
                
                <div class="card-actions">
                    <button class="btn-action btn-pin" onclick="changePin('${user.id}')">
                        🔐 Changer
                    </button>
                    ${isAdmin ? `
                        <button class="btn-action btn-edit" onclick="editUser('${user.id}')">
                            ✏️ Modifier
                        </button>
                        <button class="btn-action btn-cancel" style="display: none;" onclick="cancelEdit('${user.id}')">
                            ❌ Annuler
                        </button>
                        <button class="btn-action btn-save" style="display: none;" onclick="saveUser('${user.id}')">
                            💾 Sauvegarder
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteUser('${user.id}')">
                            🗑️ Supprimer
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    static generateRoleOptions(currentRole) {
        if (!this.rolesData) return '';
        
        const sortedRoles = Object.entries(this.rolesData)
            .sort((a, b) => b[1].niveau - a[1].niveau);
        
        return sortedRoles.map(([roleId, roleData]) => 
            `<option value="${roleId}" ${roleId === currentRole ? 'selected' : ''}>${roleData.label}</option>`
        ).join('');
    }
}
