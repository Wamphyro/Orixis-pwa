// ========================================
// FACTURES-FOURNISSEURS.UPLOAD.SERVICE.JS - 📁 GESTION STOCKAGE FICHIERS
// Chemin: modules/factures-fournisseurs/factures-fournisseurs.upload.service.js
//
// DESCRIPTION:
// Service d'upload des factures fournisseurs vers Firebase Storage
// Gère le hash, la structure des dossiers et les métadonnées
//
// FONCTIONS PUBLIQUES:
// - uploadFactureDocument(file) : Upload une facture
// - uploadMultipleDocuments(files) : Upload plusieurs factures
// - deleteDocument(chemin) : Supprimer un document
// - getDocumentUrl(chemin) : Obtenir l'URL d'un document
// - calculateFileHash(file) : Calculer le hash SHA-256
//
// STRUCTURE STORAGE:
// factures-fournisseurs/[société]/inbox/[année]/[mois]/[jour]/[fichier]
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
 * @param {File} file - Le fichier à uploader
 * @returns {Promise<Object>} Métadonnées du document uploadé
 */
export async function uploadFactureDocument(file) {
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
        const jour = String(date.getDate()).padStart(2, '0');
        
        // Récupérer les infos utilisateur
        const userInfo = getUserInfo();
        
        // Créer un nom standardisé avec UUID court
        const dateStr = `${annee}${mois}${jour}`;
        const timeStr = date.toTimeString().slice(0,8).replace(/:/g, '');
        const shortUUID = crypto.randomUUID().substring(0, 8);
        const extension = file.name.split('.').pop().toLowerCase();
        const nomFichier = `FF_${userInfo.societe}_${dateStr}_${timeStr}_${shortUUID}.${extension}`;
        
        // Chemin complet : factures-fournisseurs/BA/inbox/2025/02/03/FF_BA_20250203_143029_550e8400.pdf
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
 * @param {File[]} files - Les fichiers à uploader
 * @returns {Promise<Object>} Résultats avec succès et erreurs
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

/**
 * Récupérer les infos de l'utilisateur connecté
 */
function getUserInfo() {
    const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
    
    // Extraire la société du code magasin si pas définie
    let societe = auth.societe || auth.raisonSociale || '';
    
    if (!societe && auth.magasin) {
        // Déterminer la société selon le préfixe du magasin
        if (auth.magasin.startsWith('9')) {
            societe = 'BA'; // Boucle Auditive
        } else if (auth.magasin.startsWith('8')) {
            societe = 'ORIXIS';
        } else {
            societe = 'XXX';
        }
    }
    
    return {
        name: auth.collaborateur ? `${auth.collaborateur.prenom} ${auth.collaborateur.nom}` : 'Inconnu',
        magasin: auth.magasin || auth.collaborateur?.magasin || 'XXX',
        societe: societe || 'XXX',
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

/* ========================================
   HISTORIQUE DES DIFFICULTÉS
   
   [03/02/2025] - Création initiale
   - Service d'upload adapté pour factures
   - Structure : factures-fournisseurs/[société]/inbox/[année]/[mois]/[jour]/
   - Nom fichier : FF_[société]_[date]_[heure]_[uuid].pdf
   
   NOTES POUR REPRISES FUTURES:
   - Le hash permet de détecter les doublons
   - Les dossiers sont créés automatiquement
   - Les métadonnées sont stockées dans customMetadata
   ======================================== */