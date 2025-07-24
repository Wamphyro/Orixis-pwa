// Gestion de l'authentification Firebase pour SAV Audio
import { firebaseConfig } from '../config/firebase-config.js';

// Variables pour Firebase
let db;
let auth;

// Initialisation de Firebase
async function initFirebase() {
    try {
        // Import dynamique des modules Firebase
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const { getAuth, signInAnonymously } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        
        // Initialiser Firebase
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        
        // Se connecter anonymement
        await signInAnonymously(auth);
        console.log('✅ Authentification anonyme réussie');
        
        console.log('✅ Firebase initialisé avec succès');
        return { db, auth };
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

// Vérifier le code PIN (version sécurisée)
async function verifierCodePin(magasinId, codePin) {
    try {
        // Pour la production, on ne charge pas tous les magasins
        // On vérifie directement celui demandé
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const magasinRef = doc(db, 'magasins', magasinId);
        const magasinDoc = await getDoc(magasinRef);
        
        if (magasinDoc.exists()) {
            const data = magasinDoc.data();
            // Comparaison sécurisée
            return data.code === codePin && data.actif !== false;
        }
        return false;
    } catch (error) {
        console.error('❌ Erreur vérification code PIN:', error);
        return false;
    }
}

// Sauvegarder une intervention
async function sauvegarderIntervention(interventionData) {
    try {
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Ajouter les timestamps
        interventionData.dateCreation = serverTimestamp();
        interventionData.dateDerniereMaj = serverTimestamp();
        
        const interventionsRef = collection(db, 'interventions');
        const docRef = await addDoc(interventionsRef, interventionData);
        
        console.log('✅ Intervention sauvegardée avec ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Erreur sauvegarde intervention:', error);
        throw error;
    }
}

// Déconnexion
async function deconnexion() {
    try {
        if (auth) {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            await signOut(auth);
            console.log('✅ Déconnexion réussie');
        }
    } catch (error) {
        console.error('❌ Erreur déconnexion:', error);
    }
}

// Export des fonctions
export { 
    initFirebase, 
    chargerMagasins, 
    chargerUtilisateurs, 
    verifierCodePin, 
    sauvegarderIntervention,
    deconnexion 
};
