// ========================================
// SUBVENTIONS.UPLOAD.SERVICE.JS - Upload documents Firebase Storage
// Chemin: modules/subventions/subventions.upload.service.js
//
// DESCRIPTION:
// Service de gestion des uploads de documents
// Utilise Firebase Storage avec compression et validation
// ========================================

import { 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject,
    listAll,
    getMetadata
} from 'firebase/storage';

import { storage } from '../../config/firebase.config.js';
import { subventionsConfig } from './subventions.config.js';
import { subventionsFirestore } from './subventions.firestore.js';

class SubventionsUploadService {
    constructor() {
        this.basePath = 'subventions';
        this.maxFileSize = subventionsConfig.business.formats.maxSize;
        this.allowedFormats = subventionsConfig.business.formats.documents;
        
        // Configuration de compression
        this.compressionOptions = {
            maxWidth: 2000,
            maxHeight: 2000,
            quality: 0.8,
            convertToJPEG: true
        };
    }
    
    // ========================================
    // UPLOAD DE FICHIERS
    // ========================================
    
    /**
     * Uploader un document
     */
    async uploadDocument(file, options = {}) {
        try {
            const {
                dossierId,
                workflow,
                documentType,
                utilisateur
            } = options;
            
            // Validation
            this.validateFile(file);
            
            // Préparer le fichier
            let fileToUpload = file;
            let fileName = file.name;
            
            // Compresser si c'est une image
            if (this.isImage(file)) {
                const compressed = await this.compressImage(file);
                fileToUpload = compressed.file;
                fileName = compressed.name;
            }
            
            // Générer le chemin
            const path = this.generatePath(dossierId, workflow, documentType, fileName);
            
            // Créer la référence
            const storageRef = ref(storage, path);
            
            // Métadonnées
            const metadata = {
                contentType: fileToUpload.type,
                customMetadata: {
                    dossierId,
                    workflow,
                    documentType,
                    originalName: file.name,
                    uploadedBy: utilisateur,
                    uploadedAt: new Date().toISOString()
                }
            };
            
            // Upload
            const snapshot = await uploadBytes(storageRef, fileToUpload, metadata);
            
            // Obtenir l'URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Préparer les données du document
            const documentData = {
                nom: fileName,
                originalName: file.name,
                url: downloadURL,
                path: path,
                taille: fileToUpload.size,
                type: fileToUpload.type,
                dateAjout: new Date(),
                ajoutePar: utilisateur
            };
            
            // Ajouter à Firestore
            await subventionsFirestore.addDocument(
                dossierId,
                workflow,
                documentType,
                documentData
            );
            
            return {
                success: true,
                document: documentData
            };
            
        } catch (error) {
            console.error('Erreur upload document:', error);
            throw error;
        }
    }
    
    /**
     * Uploader plusieurs documents
     */
    async uploadMultipleDocuments(files, options) {
        const results = [];
        const errors = [];
        
        for (let i = 0; i < files.length; i++) {
            try {
                const result = await this.uploadDocument(files[i], {
                    ...options,
                    index: i
                });
                results.push(result);
            } catch (error) {
                errors.push({
                    file: files[i].name,
                    error: error.message
                });
            }
        }
        
        return {
            success: results.length > 0,
            uploaded: results,
            errors: errors
        };
    }
    
    // ========================================
    // GESTION DES FICHIERS
    // ========================================
    
    /**
     * Supprimer un document
     */
    async deleteDocument(documentPath) {
        try {
            const storageRef = ref(storage, documentPath);
            await deleteObject(storageRef);
            return true;
        } catch (error) {
            console.error('Erreur suppression document:', error);
            throw error;
        }
    }
    
    /**
     * Obtenir tous les documents d'un dossier
     */
    async listDocuments(dossierId) {
        try {
            const path = `${this.basePath}/${dossierId}`;
            const storageRef = ref(storage, path);
            
            const result = await listAll(storageRef);
            const documents = [];
            
            for (const itemRef of result.items) {
                const metadata = await getMetadata(itemRef);
                const url = await getDownloadURL(itemRef);
                
                documents.push({
                    name: itemRef.name,
                    path: itemRef.fullPath,
                    url: url,
                    size: metadata.size,
                    contentType: metadata.contentType,
                    metadata: metadata.customMetadata,
                    timeCreated: metadata.timeCreated
                });
            }
            
            return documents;
            
        } catch (error) {
            console.error('Erreur liste documents:', error);
            throw error;
        }
    }
    
    // ========================================
    // VALIDATION
    // ========================================
    
    /**
     * Valider un fichier avant upload
     */
    validateFile(file) {
        // Vérifier la taille
        if (file.size > this.maxFileSize) {
            const sizeMB = Math.round(this.maxFileSize / 1024 / 1024);
            throw new Error(`Le fichier dépasse la taille maximale de ${sizeMB} MB`);
        }
        
        // Vérifier le format
        const extension = this.getFileExtension(file.name);
        if (!this.allowedFormats.includes(extension.toLowerCase())) {
            throw new Error(`Format de fichier non supporté. Formats acceptés : ${this.allowedFormats.join(', ')}`);
        }
        
        // Vérifier le nom du fichier
        if (!/^[\w\-. ]+$/.test(file.name)) {
            throw new Error('Le nom du fichier contient des caractères non autorisés');
        }
        
        return true;
    }
    
    /**
     * Vérifier si le fichier a expiré
     */
    isDocumentExpired(documentType, dateAjout) {
        const docConfig = subventionsConfig.business.documents[documentType];
        if (!docConfig || !docConfig.peremption) {
            return false;
        }
        
        const dateExpiration = new Date(dateAjout);
        dateExpiration.setDate(dateExpiration.getDate() + docConfig.peremption);
        
        return new Date() > dateExpiration;
    }
    
    // ========================================
    // COMPRESSION D'IMAGES
    // ========================================
    
    /**
     * Compresser une image
     */
    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculer les nouvelles dimensions
                    let { width, height } = this.calculateDimensions(
                        img.width,
                        img.height,
                        this.compressionOptions.maxWidth,
                        this.compressionOptions.maxHeight
                    );
                    
                    // Redimensionner
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convertir en blob
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                // Générer le nouveau nom
                                const name = this.generateCompressedName(file.name);
                                
                                // Créer un nouveau fichier
                                const compressedFile = new File([blob], name, {
                                    type: 'image/jpeg',
                                    lastModified: Date.now()
                                });
                                
                                resolve({
                                    file: compressedFile,
                                    name: name,
                                    originalSize: file.size,
                                    compressedSize: blob.size,
                                    compressionRatio: Math.round((1 - blob.size / file.size) * 100)
                                });
                            } else {
                                reject(new Error('Erreur lors de la compression'));
                            }
                        },
                        'image/jpeg',
                        this.compressionOptions.quality
                    );
                };
                
                img.onerror = () => reject(new Error('Erreur chargement image'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Erreur lecture fichier'));
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * Calculer les dimensions après redimensionnement
     */
    calculateDimensions(width, height, maxWidth, maxHeight) {
        if (width <= maxWidth && height <= maxHeight) {
            return { width, height };
        }
        
        const aspectRatio = width / height;
        
        if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        }
        
        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }
        
        return {
            width: Math.round(width),
            height: Math.round(height)
        };
    }
    
    // ========================================
    // UTILITAIRES
    // ========================================
    
    /**
     * Générer le chemin de stockage
     */
    generatePath(dossierId, workflow, documentType, fileName) {
        const timestamp = Date.now();
        const safeName = this.sanitizeFileName(fileName);
        
        return `${this.basePath}/${dossierId}/${workflow}/${documentType}/${timestamp}_${safeName}`;
    }
    
    /**
     * Nettoyer le nom de fichier
     */
    sanitizeFileName(fileName) {
        return fileName
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_{2,}/g, '_')
            .toLowerCase();
    }
    
    /**
     * Obtenir l'extension d'un fichier
     */
    getFileExtension(fileName) {
        return fileName.slice((fileName.lastIndexOf('.') - 1 >>> 0) + 2);
    }
    
    /**
     * Vérifier si c'est une image
     */
    isImage(file) {
        return file.type.startsWith('image/');
    }
    
    /**
     * Générer un nom pour l'image compressée
     */
    generateCompressedName(originalName) {
        const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
        const timestamp = Date.now();
        
        return `${nameWithoutExt}_compressed_${timestamp}.jpg`;
    }
    
    /**
     * Formater la taille de fichier
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Obtenir l'icône selon le type de fichier
     */
    getFileIcon(fileName) {
        const extension = this.getFileExtension(fileName).toLowerCase();
        
        const icons = {
            'pdf': '📄',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'doc': '📝',
            'docx': '📝',
            'default': '📎'
        };
        
        return icons[extension] || icons.default;
    }
    
    /**
     * Créer une miniature pour les images
     */
    async createThumbnail(file, maxSize = 200) {
        if (!this.isImage(file)) {
            return null;
        }
        
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const { width, height } = this.calculateDimensions(
                        img.width,
                        img.height,
                        maxSize,
                        maxSize
                    );
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                
                img.onerror = () => resolve(null);
                img.src = e.target.result;
            };
            
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }
}

// Export de l'instance unique
export const subventionsUploadService = new SubventionsUploadService();

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsUploadService;