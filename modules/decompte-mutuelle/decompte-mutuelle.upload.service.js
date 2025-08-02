// ========================================
// DECOMPTE-MUTUELLE.UPLOAD.SERVICE.JS - Gestion des uploads Firebase Storage
// Chemin: modules/decompte-mutuelle/decompte-mutuelle.upload.service.js
//
// DESCRIPTION:
// Service d'upload des documents décomptes vers Firebase Storage
// Gère le hash, la structure des dossiers et les métadonnées
//
// FONCTIONS PUBLIQUES:
// - uploadDecompteDocument(file, magasin) : Upload un document
// - uploadMultipleDocuments(files, magasin) : Upload plusieurs documents
// - deleteDocument(chemin) : Supprimer un document
// - getDocumentUrl(chemin) : Obtenir l'URL d'un document
// - calculateFileHash(file) : Calculer le hash SHA-256
//
// STRUCTURE STORAGE:
// decomptes-mutuelles/[magasin]/[année]/[mois]/[fichier]
// ========================================

import { storage } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION
// ========================================

const STORAGE_BASE_PATH = 'decomptes-mutuelles';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// ========================================
// FONCTIONS D'UPLOAD
// ========================================

/**
 * Upload un document décompte vers Firebase Storage
 * @param {File} file - Le fichier à uploader
 * @param {string} magasin - Code du magasin (ex: '9PAR')
 * @returns {Promise<Object>} Métadonnées du document uploadé
 */
export async function uploadDecompteDocument(file, magasin) {
    try {
        // Importer les fonctions Firebase Storage dynamiquement
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
        
        // Nettoyer le nom du fichier
        const nomNettoye = cleanFileName(file.name);
        const nomFichier = `${timestamp}_${nomNettoye}`;
        
        // Chemin complet : decomptes-mutuelles/9PAR/2025/02/1234567890_decompte.pdf
        const chemin = `${STORAGE_BASE_PATH}/${magasin}/${annee}/${mois}/${nomFichier}`;
        
        console.log('📤 Upload vers:', chemin);
        
        // Créer la référence Storage
        const storageRef = ref(storage, chemin);
        
        // Métadonnées personnalisées
        const metadata = {
            contentType: file.type,
            customMetadata: {
                magasin: magasin,
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
            dateUpload: new Date(),
            magasin: magasin
        };
        
    } catch (error) {
        console.error('❌ Erreur upload:', error);
        throw new Error(`Erreur lors de l'upload: ${error.message}`);
    }
}

/**
 * Upload plusieurs documents
 * @param {File[]} files - Les fichiers à uploader
 * @param {string} magasin - Code du magasin
 * @returns {Promise<Object[]>} Tableau des métadonnées
 */
export async function uploadMultipleDocuments(files, magasin) {
    const resultats = [];
    const erreurs = [];
    
    for (const file of files) {
        try {
            const metadata = await uploadDecompteDocument(file, magasin);
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
 * @param {string} chemin - Le chemin du document
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
 * @param {string} chemin - Le chemin du document
 * @returns {Promise<string>} L'URL de téléchargement
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
 * @param {File} file - Le fichier
 * @returns {Promise<string>} Le hash en hexadécimal
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
 * @param {File} file - Le fichier à valider
 * @throws {Error} Si le fichier n'est pas valide
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
 * Nettoyer le nom du fichier
 * @param {string} fileName - Le nom original
 * @returns {string} Le nom nettoyé
 */
function cleanFileName(fileName) {
    // Remplacer les caractères spéciaux
    return fileName
        .toLowerCase()
        .replace(/[àáäâ]/g, 'a')
        .replace(/[èéëê]/g, 'e')
        .replace(/[ìíïî]/g, 'i')
        .replace(/[òóöô]/g, 'o')
        .replace(/[ùúüû]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[ç]/g, 'c')
        .replace(/[^\w\s.-]/g, '') // Garder lettres, chiffres, -, ., espaces
        .replace(/\s+/g, '_')       // Espaces → underscores
        .replace(/_+/g, '_')        // Multiple underscores → un seul
        .replace(/^_|_$/g, '');     // Retirer underscores début/fin
}

// ========================================
// EXPORT PAR DÉFAUT
// ========================================

export default {
    uploadDecompteDocument,
    uploadMultipleDocuments,
    deleteDocument,
    getDocumentUrl,
    calculateFileHash
};

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création initiale
   - Service d'upload complet avec hash
   - Structure automatique des dossiers
   - Gestion des erreurs et validation
   
   NOTES POUR REPRISES FUTURES:
   - Le hash permet de détecter les doublons
   - Les dossiers sont créés automatiquement
   - Les métadonnées sont stockées dans customMetadata
   ======================================== */