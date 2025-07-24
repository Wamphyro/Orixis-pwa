// Service de gestion des profils
// À placer dans src/js/services/profile.service.js

export class ProfileService {
    // Avatars par rôle
    static roleAvatars = {
        technicien: '🔧',
        audioprothesiste: '🦻',
        assistant: '📋',
        manager: '👔',
        admin: '👑'
    };
    
    // Obtenir l'avatar pour un rôle
    static getAvatar(role) {
        return this.roleAvatars[role] || '👤';
    }
    
    // Créer une carte utilisateur
    static createUserCard(user, isAdminView = false) {
        const avatar = this.getAvatar(user.role);
        const roleClass = `role-${user.role}`;
        const magasinsText = user.magasins ? user.magasins.join(', ') : 'Non assigné';
        
        // Générer le select des rôles si admin
        const roleSelect = isAdminView ? `
            <select class="role-select" data-field="role" style="display: none;">
                <option value="technicien" ${user.role === 'technicien' ? 'selected' : ''}>Technicien</option>
                <option value="audioprothesiste" ${user.role === 'audioprothesiste' ? 'selected' : ''}>Audioprothésiste</option>
                <option value="assistant" ${user.role === 'assistant' ? 'selected' : ''}>Assistant</option>
                <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
        ` : '';
        
        const editableClass = isAdminView ? 'editable' : '';
        
        return `
            <div class="user-card" id="card-${user.id}">
                <div class="card-header">
                    <div class="user-avatar">${avatar}</div>
                    <div class="user-main-info">
                        <h3>
                            <span class="${editableClass}" data-field="prenom">${user.prenom}</span>
                            <span class="${editableClass}" data-field="nom">${user.nom}</span>
                        </h3>
                        <span class="role-badge ${roleClass}" data-field="role-display">
                            ${this.getRoleLabel(user.role)}
                        </span>
                        ${roleSelect}
                    </div>
                </div>
                
                <div class="card-body">
                    <div class="info-row">
                        <span class="info-label">📍 Magasins</span>
                        <span class="info-value">${magasinsText}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">🔐 Code utilisateur</span>
                        <span class="info-value">••••</span>
                    </div>
                    
                    ${user.lastLogin ? `
                    <div class="info-row">
                        <span class="info-label">🕐 Dernière connexion</span>
                        <span class="info-value">${this.formatDate(user.lastLogin)}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="card-actions">
                    <button class="btn-action btn-pin" onclick="changePin('${user.id}')">
                        🔐 Changer le code
                    </button>
                    
                    ${isAdminView ? `
                        <button class="btn-action btn-edit" onclick="editUser('${user.id}')">
                            ✏️ Modifier
                        </button>
                        <button class="btn-action btn-save" onclick="saveUser('${user.id}')" style="display: none;">
                            💾 Enregistrer
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // Obtenir le label du rôle
    static getRoleLabel(role) {
        const labels = {
            technicien: 'Technicien',
            audioprothesiste: 'Audioprothésiste',
            assistant: 'Assistant',
            manager: 'Manager',
            admin: 'Administrateur'
        };
        return labels[role] || role;
    }
    
    // Formater une date
    static formatDate(timestamp) {
        if (!timestamp) return 'Jamais';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Si c'est aujourd'hui
        if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
            return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Si c'est hier
        if (diff < 48 * 60 * 60 * 1000) {
            return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Sinon, date complète
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Mettre à jour un utilisateur (pour admin)
    static async updateUser(userId, updates) {
        try {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('./firebase-auth.js');
            
            const userRef = doc(db, 'utilisateurs', userId);
            await updateDoc(userRef, updates);
            
            return { success: true };
        } catch (error) {
            console.error('Erreur mise à jour utilisateur:', error);
            throw error;
        }
    }
    
    // Vérifier un code PIN
    static async verifyPin(userId, pin) {
        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('./firebase-auth.js');
            
            const userRef = doc(db, 'utilisateurs', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                return userData.code === pin;
            }
            
            return false;
        } catch (error) {
            console.error('Erreur vérification PIN:', error);
            return false;
        }
    }
    
    // Mettre à jour le code PIN
    static async updatePin(userId, newPin) {
        try {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('./firebase-auth.js');
            
            const userRef = doc(db, 'utilisateurs', userId);
            await updateDoc(userRef, {
                code: newPin,
                lastPasswordChange: Date.now()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Erreur mise à jour PIN:', error);
            throw error;
        }
    }
    
    // Enregistrer la dernière connexion
    static async recordLogin(userId) {
        try {
            const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('./firebase-auth.js');
            
            const userRef = doc(db, 'utilisateurs', userId);
            await updateDoc(userRef, {
                lastLogin: Date.now()
            });
        } catch (error) {
            console.error('Erreur enregistrement connexion:', error);
        }
    }
}
