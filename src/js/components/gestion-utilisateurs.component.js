import { chargerTousLesUtilisateurs, chargerRoles } from '../services/firebase.service.js';
import { CompteService } from '../services/compte.service.js';

export class GestionUtilisateursComponent {
    static allUsers = [];
    static filteredUsers = [];
    static currentFilter = 'all';
    static rolesData = null;
    
    static async render() {
        // Charger les rôles avant de rendre le composant
        this.rolesData = await chargerRoles();
        
        return `
            <!-- Bouton création en haut -->
            <div class="admin-top-actions">
                <button class="btn-primary" id="btnCreateUser">
                    ➕ Créer un nouveau profil
                </button>
            </div>
            
            <!-- Contrôles de recherche et filtres -->
            <div class="admin-controls">
                <div class="search-bar">
                    <input type="text" 
                           id="searchUser" 
                           placeholder="🔍 Rechercher un utilisateur..." 
                           autocomplete="off">
                </div>
                <div class="filter-buttons">
                    <button class="filter-btn active" data-role="all">Tous</button>
                    ${this.generateRoleFilters()}
                </div>
            </div>
            
            <!-- Conteneur des cartes utilisateur -->
            <div id="userCardsContainer" class="user-cards-container">
                <div class="loading-message">
                    <div class="spinner"></div>
                    <p>Chargement des utilisateurs...</p>
                </div>
            </div>
            
            <!-- Modal création utilisateur -->
            <div id="createUserModal" class="modal">
                <div class="modal-content modal-large">
                    <div class="modal-header">
                        <h2>➕ Créer un nouveau profil utilisateur</h2>
                        <button class="modal-close" id="closeCreateModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <form id="createUserForm">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Prénom *</label>
                                    <input type="text" id="newUserPrenom" required>
                                </div>
                                <div class="form-group">
                                    <label>Nom *</label>
                                    <input type="text" id="newUserNom" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Rôle *</label>
                                <select id="newUserRole" required>
                                    <option value="">-- Sélectionner un rôle --</option>
                                    ${this.generateRoleOptions()}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Code PIN (4 chiffres) *</label>
                                <input type="password" id="newUserPin" pattern="[0-9]{4}" maxlength="4" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Magasin par défaut</label>
                                <select id="newUserMagasinDefaut">
                                    <option value="">-- Sélectionner --</option>
                                    <option value="9DIJ">9DIJ</option>
                                    <option value="9AVA">9AVA</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Autorisations magasins</label>
                                <div class="magasins-checkboxes">
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="9DIJ" name="magasinAuth">
                                        <span>9DIJ</span>
                                    </label>
                                    <label class="checkbox-label">
                                        <input type="checkbox" value="9AVA" name="magasinAuth">
                                        <span>9AVA</span>
                                    </label>
                                </div>
                            </div>
                            
                            <div id="rolePermissionsInfo" class="role-info" style="display: none;">
                                <h4>Permissions du rôle sélectionné :</h4>
                                <div id="permissionsList"></div>
                            </div>
                            
                            <div class="error-message" id="createUserError"></div>
                            <div class="success-message" id="createUserSuccess"></div>
                            
                            <div class="modal-actions">
                                <button type="button" class="btn-secondary" id="cancelCreate">Annuler</button>
                                <button type="submit" class="btn-primary">Créer le profil</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Générer les boutons de filtre dynamiquement
    static generateRoleFilters() {
        if (!this.rolesData) return '';
        
        // Trier les rôles par niveau décroissant
        const sortedRoles = Object.entries(this.rolesData)
            .sort((a, b) => b[1].niveau - a[1].niveau);
        
        return sortedRoles.map(([roleId, roleData]) => 
            `<button class="filter-btn" data-role="${roleId}">${roleData.label}</button>`
        ).join('');
    }
    
    // Générer les options de rôle dynamiquement
    static generateRoleOptions() {
        if (!this.rolesData) return '';
        
        // Trier les rôles par niveau décroissant
        const sortedRoles = Object.entries(this.rolesData)
            .sort((a, b) => b[1].niveau - a[1].niveau);
        
        return sortedRoles.map(([roleId, roleData]) => 
            `<option value="${roleId}">${roleData.label} (Niveau ${roleData.niveau})</option>`
        ).join('');
    }
    
    static async init() {
        // Charger les rôles si pas déjà fait
        if (!this.rolesData) {
            this.rolesData = await chargerRoles();
        }
        
        // Charger les utilisateurs
        await this.loadUsers();
        
        // Initialiser les événements
        this.initEventListeners();
    }
    
    static async loadUsers() {
        try {
            this.allUsers = await chargerTousLesUtilisateurs();
            this.filteredUsers = [...this.allUsers];
            this.displayUsers();
        } catch (error) {
            console.error('Erreur chargement utilisateurs:', error);
            document.getElementById('userCardsContainer').innerHTML = 
                '<p class="error-message">Erreur lors du chargement des utilisateurs</p>';
        }
    }
    
    static async displayUsers() {
        const container = document.getElementById('userCardsContainer');
        
        if (this.filteredUsers.length === 0) {
            container.innerHTML = '<p class="no-data">Aucun utilisateur trouvé</p>';
            return;
        }
        
        // Attendre que CompteService charge les rôles
        await CompteService.init();
        
        container.innerHTML = '';
        for (const user of this.filteredUsers) {
            container.innerHTML += await CompteService.createUserCard(user, true);
        }
    }
    
    static initEventListeners() {
        // Recherche
        const searchInput = document.getElementById('searchUser');
        let searchTimeout;
        searchInput?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterUsers(e.target.value);
            }, 300);
        });
        
        // Filtres par rôle
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.role;
                this.applyFilters();
            });
        });
        
        // Bouton créer utilisateur
        document.getElementById('btnCreateUser')?.addEventListener('click', () => {
            this.openCreateModal();
        });
        
        // Modal création
        document.getElementById('closeCreateModal')?.addEventListener('click', () => {
            this.closeCreateModal();
        });
        
        document.getElementById('cancelCreate')?.addEventListener('click', () => {
            this.closeCreateModal();
        });
        
        // Formulaire création
        document.getElementById('createUserForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCreateUser();
        });
        
        // Afficher les permissions quand on sélectionne un rôle
        document.getElementById('newUserRole')?.addEventListener('change', (e) => {
            this.displayRolePermissions(e.target.value);
        });
    }
    
    static displayRolePermissions(roleId) {
        const infoDiv = document.getElementById('rolePermissionsInfo');
        const permissionsDiv = document.getElementById('permissionsList');
        
        if (!roleId || !this.rolesData || !this.rolesData[roleId]) {
            infoDiv.style.display = 'none';
            return;
        }
        
        const role = this.rolesData[roleId];
        infoDiv.style.display = 'block';
        
        const permissionsHTML = Object.entries(role.permissions)
            .map(([perm, value]) => {
                const permLabels = {
                    gererUtilisateurs: "Gérer les utilisateurs",
                    supprimerUtilisateurs: "Supprimer des utilisateurs",
                    creerUtilisateurs: "Créer des utilisateurs",
                    modifierTousLesCodes: "Modifier tous les codes PIN",
                    voirStatistiques: "Voir les statistiques",
                    accesTousLesMagasins: "Accès à tous les magasins"
                };
                
                return `<div class="permission-item">
                    ${value ? '✅' : '❌'} ${permLabels[perm] || perm}
                </div>`;
            }).join('');
        
        permissionsDiv.innerHTML = permissionsHTML;
    }
    
    static filterUsers(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredUsers = this.allUsers.filter(user => {
            const matchesSearch = !term || 
                user.nom.toLowerCase().includes(term) ||
                user.prenom.toLowerCase().includes(term) ||
                Object.keys(user.autorisations || {}).some(m => m.toLowerCase().includes(term));
            
            const matchesRole = this.currentFilter === 'all' || 
                user.role === this.currentFilter ||
                (this.currentFilter === 'admin' && user.role === 'Administrateur');
            
            return matchesSearch && matchesRole;
        });
        
        this.displayUsers();
    }
    
    static applyFilters() {
        const searchTerm = document.getElementById('searchUser').value;
        this.filterUsers(searchTerm);
    }
    
    static openCreateModal() {
        document.getElementById('createUserModal').classList.add('active');
    }
    
    static closeCreateModal() {
        document.getElementById('createUserModal').classList.remove('active');
        document.getElementById('createUserForm').reset();
        document.getElementById('createUserError').textContent = '';
        document.getElementById('createUserSuccess').textContent = '';
        document.getElementById('rolePermissionsInfo').style.display = 'none';
    }
    
    static async handleCreateUser() {
        const prenom = document.getElementById('newUserPrenom').value;
        const nom = document.getElementById('newUserNom').value;
        const role = document.getElementById('newUserRole').value;
        const pin = document.getElementById('newUserPin').value;
        const magasinDefaut = document.getElementById('newUserMagasinDefaut').value;
        
        // Récupérer les magasins autorisés
        const magasinsAuth = Array.from(document.querySelectorAll('input[name="magasinAuth"]:checked'))
            .map(cb => cb.value);
        
        if (magasinsAuth.length === 0) {
            this.showCreateError('Sélectionnez au moins un magasin');
            return;
        }
        
        // Créer l'objet autorisations
        const autorisations = {};
        magasinsAuth.forEach(mag => {
            autorisations[mag] = { acces: true };
        });
        
        // Générer un ID unique
        const userId = `${nom.toLowerCase()}${Date.now().toString().slice(-3)}`;
        
        try {
            // Vérifier l'état de l'authentification
            const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const auth = getAuth();
            console.log('Utilisateur actuel:', auth.currentUser);
            console.log('UID:', auth.currentUser?.uid);
            
            // Afficher les données pour debug
            console.log('Tentative de création utilisateur:', {
                id: userId,
                prenom: prenom,
                nom: nom,
                role: role,
                autorisations: autorisations
            });
            
            // Créer le nouveau profil
            await CompteService.createUser({
                id: userId,
                prenom: prenom,
                nom: nom,
                role: role,
                code: pin,
                actif: true,
                autorisations: autorisations,
                magasinParDefaut: magasinDefaut || magasinsAuth[0],
                dateCreation: new Date().toISOString()
            });
            
            this.showCreateSuccess('Profil créé avec succès !');
            
            // Recharger la liste
            await this.loadUsers();
            
            setTimeout(() => this.closeCreateModal(), 2000);
            
        } catch (error) {
            console.error('Erreur création:', error);
            this.showCreateError('Erreur lors de la création du profil');
        }
    }
    
    static showCreateError(message) {
        document.getElementById('createUserError').textContent = message;
        document.getElementById('createUserSuccess').textContent = '';
    }
    
    static showCreateSuccess(message) {
        document.getElementById('createUserSuccess').textContent = message;
        document.getElementById('createUserError').textContent = '';
    }
}
