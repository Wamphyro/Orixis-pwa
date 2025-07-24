// Gestion de l'authentification Firebase pour SAV Audio
import { firebaseConfig } from '../config/firebase-config.js';

// Variables pour Firebase
let db;

// Initialisation de Firebase
async function initFirebase() {
    try {
        // Import dynamique des modules Firebase
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Initialiser Firebase
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        
        console.log('✅ Firebase initialisé avec succès');
        return db;
    } catch (error) {
        console.error('❌ Erreur initialisation Firebase:', error);
        throw error;
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

// Charger les utilisateurs d'un magasin
async function chargerUtilisateurs(magasinId) {
    try {
        const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const utilisateursRef = collection(db, 'utilisateurs');
        const q = query(utilisateursRef, where('magasinId', '==', magasinId), where('actif', '==', true));
        const snapshot = await getDocs(q);
        
        const utilisateurs = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            utilisateurs.push({
                id: doc.id,
                nom: data.nom,
                prenom: data.prenom,
                role: data.role || 'technicien'
            });
        });
        
        console.log(`✅ ${utilisateurs.length} utilisateurs chargés pour ${magasinId}`);
        return utilisateurs;
    } catch (error) {
        console.error('❌ Erreur chargement utilisateurs:', error);
        return [];
    }
}

// Vérifier le code PIN
async function verifierCodePin(magasinId, codePin) {
    try {
        const magasins = await chargerMagasins();
        if (magasins && magasins[magasinId]) {
            return magasins[magasinId].code === codePin;
        }
        return false;
    } catch (error) {
        console.error('❌ Erreur vérification code PIN:', error);
        return false;
    }
}

// Export des fonctions
export { initFirebase, chargerMagasins, chargerUtilisateurs, verifierCodePin };
