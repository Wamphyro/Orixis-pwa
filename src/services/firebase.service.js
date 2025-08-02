// Gestion de l'authentification Firebase pour SAV Audio
import { firebaseConfig } from '../config/firebase-config.js';

// Variables pour Firebase
let db;
let auth;
let storage;

// Cache pour les rôles
let rolesCache = null;

// Initialisation de Firebase
async function initFirebase() {
    try {
        // Import dynamique des modules Firebase
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { getAuth, signInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { getStorage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js');
        
        // Initialiser Firebase
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        storage = getStorage(app);
        
        // Se connecter anonymement
        await signInAnonymously(auth);
        console.log('✅ Authentification anonyme réussie');
        
        console.log('✅ Firebase initialisé avec succès');
        return { db, auth, storage };
    } catch (error) {
        console.error('❌ Erreur initialisation Firebase:', error);
        throw error;
    }
}

// NOUVELLE FONCTION : Charger les rôles depuis Firestore
async function chargerRoles() {
    try {
        // Si les rôles sont déjà en cache, les retourner
        if (rolesCache) {
            return rolesCache;
        }
        
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const rolesRef = collection(db, 'roles');
        const snapshot = await getDocs(rolesRef);
        
        const roles = {};
        snapshot.forEach((doc) => {
            const data = doc.data();
            roles[doc.id] = {
                nom: data.nom,
                label: data.label,
                niveau: data.niveau,
                permissions: data.permissions
            };
        });
        
        // Mettre en cache pour éviter de recharger
        rolesCache = roles;
        
        console.log(`✅ ${Object.keys(roles).length} rôles chargés`);
        return roles;
    } catch (error) {
        console.error('❌ Erreur chargement rôles:', error);
        return null;
    }
}

// NOUVELLE FONCTION : Obtenir un rôle spécifique
async function getRoleDetails(roleId) {
    try {
        const roles = await chargerRoles();
        return roles ? roles[roleId] : null;
    } catch (error) {
        console.error('❌ Erreur récupération détails rôle:', error);
        return null;
    }
}

// NOUVELLE FONCTION : Vérifier si un utilisateur a une permission
async function userHasPermission(userId, permissionName) {
    try {
        const user = await getUtilisateurDetails(userId);
        if (!user || !user.role) return false;
        
        const role = await getRoleDetails(user.role);
        if (!role || !role.permissions) return false;
        
        return role.permissions[permissionName] === true;
    } catch (error) {
        console.error('❌ Erreur vérification permission:', error);
        return false;
    }
}

// Charger les magasins depuis Firestore
async function chargerMagasins() {
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const magasinsRef = collection(db, 'magasins');
        const snapshot = await getDocs(magasinsRef);
        
        const magasins = {};
        snapshot.forEach((doc) => {
            const data = doc.data();
            magasins[doc.id] = {
                nom: data.nom,
                code: data.code,
                actif: data.actif !== false
            };
        });
        
        console.log(`✅ ${Object.keys(magasins).length} magasins chargés`);
        return magasins;
    } catch (error) {
        console.error('❌ Erreur chargement magasins:', error);
        return null;
    }
}

// Charger TOUS les utilisateurs actifs
async function chargerTousLesUtilisateurs() {
    try {
        const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const utilisateursRef = collection(db, 'utilisateurs');
        const q = query(utilisateursRef, where('actif', '==', true));
        const snapshot = await getDocs(q);
        
        const utilisateurs = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            utilisateurs.push({
                id: doc.id,
                ...data
            });
        });
        
        console.log(`✅ ${utilisateurs.length} utilisateurs actifs chargés`);
        return utilisateurs;
    } catch (error) {
        console.error('❌ Erreur chargement utilisateurs:', error);
        return [];
    }
}

// Charger les utilisateurs d'un magasin
async function chargerUtilisateurs(magasinId) {
    try {
        const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const utilisateursRef = collection(db, 'utilisateurs');
        const q = query(utilisateursRef, where('magasins', 'array-contains', magasinId), where('actif', '==', true));
        const snapshot = await getDocs(q);
        
        const utilisateurs = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            utilisateurs.push({
                id: doc.id,
                nom: data.nom,
                prenom: data.prenom,
                role: data.role || 'technicien',
                pagesAutorisees: data.pagesAutorisees || null
            });
        });
        
        console.log(`✅ ${utilisateurs.length} utilisateurs chargés pour ${magasinId}`);
        return utilisateurs;
    } catch (error) {
        console.error('❌ Erreur chargement utilisateurs:', error);
        return [];
    }
}

// Obtenir les détails complets d'un utilisateur
async function getUtilisateurDetails(utilisateurId) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const utilisateurRef = doc(db, 'utilisateurs', utilisateurId);
        const utilisateurDoc = await getDoc(utilisateurRef);
        
        if (utilisateurDoc.exists()) {
            return {
                id: utilisateurDoc.id,
                ...utilisateurDoc.data()
            };
        }
        return null;
    } catch (error) {
        console.error('❌ Erreur récupération détails utilisateur:', error);
        return null;
    }
}

// Vérifier le code PIN d'un utilisateur
async function verifierCodePinUtilisateur(utilisateurId, codePin) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const utilisateurRef = doc(db, 'utilisateurs', utilisateurId);
        const utilisateurDoc = await getDoc(utilisateurRef);
        
        if (utilisateurDoc.exists()) {
            const data = utilisateurDoc.data();
            // Vérifier le code et que l'utilisateur est actif
            return data.code === codePin && data.actif === true;
        }
        return false;
    } catch (error) {
        console.error('❌ Erreur vérification code PIN utilisateur:', error);
        return false;
    }
}

// Vérifier le code PIN d'un magasin (ancien système)
async function verifierCodePin(magasinId, codePin) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const magasinRef = doc(db, 'magasins', magasinId);
        const magasinDoc = await getDoc(magasinRef);
        
        if (magasinDoc.exists()) {
            const data = magasinDoc.data();
            return data.code === codePin && data.actif !== false;
        }
        return false;
    } catch (error) {
        console.error('❌ Erreur vérification code PIN:', error);
        return false;
    }
}

// Export des fonctions
export { 
    initFirebase, 
    chargerMagasins, 
    chargerUtilisateurs,
    chargerTousLesUtilisateurs,
    verifierCodePin,
    verifierCodePinUtilisateur,
    getUtilisateurDetails,
    chargerRoles,           // NOUVEAU
    getRoleDetails,         // NOUVEAU
    userHasPermission,      // NOUVEAU
    db, // Exporter aussi la base de données
    storage // Exporter aussi le storage
};
