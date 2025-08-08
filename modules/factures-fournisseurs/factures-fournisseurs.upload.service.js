// ========================================
// FACTURES-FOURNISSEURS.UPLOAD.SERVICE.JS - 📁 GESTION STOCKAGE FICHIERS
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.upload.service.js
//
// DESCRIPTION:
// Service d'upload des factures fournisseurs vers Firebase Storage
// Gère le hash, la structure des dossiers et les métadonnées
// Adapté à l'architecture decompte-mutuelle
// ========================================

import { storage } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION
// ========================================

const STORAGE_BASE_PATH = 'factures-fournisseurs';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// ========================================
// FONCTIONS D'UPLOAD
// ========================================

/**
 * Upload une facture vers Firebase Storage
 */
export async function uploadFactureDocument(file) {
    try {
        // Importer les fonctions Firebase Storage
        const { ref, uploadBytes, getDownloadURL } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
        );
        
        // Validation du fichier
        validateFile(file);
        
        // Calculer le hash pour détecter les doublons
        const hash = await calculateFileHash(file);
        
        // Créer le chemin de stockage
        const timestamp = Date.now();
        const date = new Date();
        const annee = date.getFullYear();
        const mois = String(date.getMonth() + 1).padStart(2, '0');
        const jour = String(date.getDate()).padStart(2, '0');
        
        // Récupérer les infos utilisateur
        const userInfo = getUserInfo();
        
        // Créer un nom standardisé avec UUID court
        const dateStr = `${annee}${mois}${jour}`;
        const timeStr = date.toTimeString().slice(0,8).replace(/:/g, '');
        const shortUUID = crypto.randomUUID().substring(0, 8);
        const extension = file.name.split('.').pop().toLowerCase();
        const nomFichier = `FF_${userInfo.societe}_${dateStr}_${timeStr}_${shortUUID}.${extension}`;
        
        // Chemin complet : factures-fournisseurs/ORIXIS/inbox/2025/02/09/FF_ORIXIS_20250209_143029_550e8400.pdf
        const chemin = `${STORAGE_BASE_PATH}/${userInfo.societe}/inbox/${annee}/${mois}/${jour}/${nomFichier}`;
        
        console.log('📤 Upload vers:', chemin);
        
        // Créer la référence Storage
        const storageRef = ref(storage, chemin);
        
        // Métadonnées personnalisées
        const metadata = {
            contentType: file.type,
            customMetadata: {
                uploadePar: userInfo.name,
                magasinUploadeur: userInfo.magasin,
                societeUploadeur: userInfo.societe,
                nomOriginal: file.name,
                hash: hash,
                dateUpload: new Date().toISOString(),
                taille: String(file.size)
            }
        };
        
        // Upload du fichier
        const snapshot = await uploadBytes(storageRef, file, metadata);
        console.log('✅ Upload réussi:', snapshot.ref.fullPath);
        
        // Obtenir l'URL de téléchargement
        const url = await getDownloadURL(snapshot.ref);
        
        // Retourner les métadonnées
        return {
            nom: nomFichier,
            nomOriginal: file.name,
            chemin: chemin,
            url: url,
            taille: file.size,
            type: file.type,
            hash: hash,
            dateUpload: new Date()
        };
        
    } catch (error) {
        console.error('❌ Erreur upload:', error);
        throw new Error(`Erreur lors de l'upload: ${error.message}`);
    }
}

/**
 * Upload plusieurs factures
 */
export async function uploadMultipleDocuments(files) {
    const resultats = [];
    const erreurs = [];
    
    for (const file of files) {
        try {
            const metadata = await uploadFactureDocument(file);
            resultats.push(metadata);
        } catch (error) {
            erreurs.push({
                fichier: file.name,
                erreur: error.message
            });
        }
    }
    
    if (erreurs.length > 0) {
        console.warn('⚠️ Certains uploads ont échoué:', erreurs);
    }
    
    return {
        reussis: resultats,
        erreurs: erreurs
    };
}

// ========================================
// FONCTIONS DE GESTION
// ========================================

/**
 * Supprimer un document de Storage
 */
export async function deleteDocument(chemin) {
    try {
        const { ref, deleteObject } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
        );
        
        const storageRef = ref(storage, chemin);
        await deleteObject(storageRef);
        
        console.log('🗑️ Document supprimé:', chemin);
        
    } catch (error) {
        console.error('❌ Erreur suppression:', error);
        throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
}

/**
 * Obtenir l'URL d'un document existant
 */
export async function getDocumentUrl(chemin) {
    try {
        const { ref, getDownloadURL } = await import(
            'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js'
        );
        
        const storageRef = ref(storage, chemin);
        return await getDownloadURL(storageRef);
        
    } catch (error) {
        console.error('❌ Erreur récupération URL:', error);
        throw new Error(`Document introuvable: ${chemin}`);
    }
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

/**
 * Calculer le hash SHA-256 d'un fichier
 */
export async function calculateFileHash(file) {
    try {
        // Lire le fichier comme ArrayBuffer
        const buffer = await file.arrayBuffer();
        
        // Calculer le hash SHA-256
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        
        // Convertir en hexadécimal
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        return hashHex;
        
    } catch (error) {
        console.error('❌ Erreur calcul hash:', error);
        return 'hash-error-' + Date.now();
    }
}

/**
 * Valider un fichier avant upload
 */
function validateFile(file) {
    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
        throw new Error(`Fichier trop volumineux (max ${sizeMB}MB)`);
    }
    
    // Vérifier le type
    if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error(`Type de fichier non autorisé. Utilisez PDF, JPG ou PNG`);
    }
}

/**
 * Récupérer les infos de l'utilisateur connecté
 */
function getUserInfo() {
    const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
    
    // Extraire la société
    let societe = auth.societe || auth.raisonSociale || 'ORIXIS';
    
    // Simplifier le nom de société pour le chemin
    societe = societe.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    return {
        name: auth.collaborateur ? `${auth.collaborateur.prenom} ${auth.collaborateur.nom}` : 'Inconnu',
        magasin: auth.magasin || auth.collaborateur?.magasin || 'XXX',
        societe: societe,
        id: auth.collaborateur?.id || 'unknown'
    };
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    uploadFactureDocument,
    uploadMultipleDocuments,
    deleteDocument,
    getDocumentUrl,
    calculateFileHash
};