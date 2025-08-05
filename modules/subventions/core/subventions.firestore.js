// ========================================
// SUBVENTIONS.FIRESTORE.JS - Accès base de données
// Chemin: modules/subventions/subventions.firestore.js
//
// DESCRIPTION:
// Service d'accès à Firestore pour les dossiers de subvention
// Gère toutes les opérations CRUD et requêtes complexes
// ========================================

// Firebase n'est pas chargé comme module ES6, utiliser l'objet global
const { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    orderBy, 
    limit,
    startAfter,
    onSnapshot,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    increment
} = firebase.firestore;

// Supposer que firebase est déjà initialisé globalement
const db = firebase.firestore();
import { subventionsConfig } from './subventions.config.js';

class SubventionsFirestore {
    constructor() {
        this.collectionName = 'dossiersSubvention';
        this.collection = collection(db, this.collectionName);
        
        // Collections liées
        this.patientsCollection = collection(db, 'patients');
        this.compteurCollection = collection(db, 'compteurs');
        
        // Cache local pour optimisation
        this.cache = new Map();
        this.listeners = new Map();
    }
    
    // ========================================
    // OPÉRATIONS CRUD DE BASE
    // ========================================
    
    /**
     * Créer un nouveau dossier
     */
    async createDossier(data) {
        try {
            // Générer le numéro de dossier
            const numeroDossier = await this.generateNumeroDossier();
            
            // Préparer les données
            const dossier = {
                ...data,
                numeroDossier,
                workflow: {
                    mdph: {
                        statut: 'nouveau',
                        progression: 0,
                        dates: {
                            creation: serverTimestamp()
                        }
                    },
                    agefiph: {
                        statut: 'attente',
                        progression: 0,
                        bloque: false,
                        dates: {}
                    }
                },
                documents: {
                    mdph: {},
                    agefiph: {}
                },
                historique: [{
                    date: serverTimestamp(),
                    action: 'creation',
                    utilisateur: data.organisation.technicien.nom,
                    details: 'Création du dossier'
                }],
                acces: {
                    code: subventionsConfig.helpers.generateAccessCode(
                        data.patient.nom,
                        new Date().getFullYear()
                    ),
                    actif: true,
                    documentsManquants: 0,
                    actionsRequises: []
                },
                dates: {
                    creation: serverTimestamp(),
                    modification: serverTimestamp()
                }
            };
            
            // Créer le document
            const docRef = doc(this.collection);
            await setDoc(docRef, dossier);
            
            // Retourner avec l'ID
            return { 
                id: docRef.id, 
                ...dossier,
                dates: {
                    creation: new Date(),
                    modification: new Date()
                }
            };
            
        } catch (error) {
            console.error('Erreur création dossier:', error);
            throw error;
        }
    }
    
    /**
     * Obtenir un dossier par ID
     */
    async getDossier(dossierId) {
        try {
            // Vérifier le cache
            if (this.cache.has(dossierId)) {
                return this.cache.get(dossierId);
            }
            
            const docRef = doc(this.collection, dossierId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const dossier = { id: docSnap.id, ...docSnap.data() };
                this.cache.set(dossierId, dossier);
                return dossier;
            } else {
                throw new Error('Dossier non trouvé');
            }
            
        } catch (error) {
            console.error('Erreur récupération dossier:', error);
            throw error;
        }
    }
    
    /**
     * Mettre à jour un dossier
     */
    async updateDossier(dossierId, updates) {
        try {
            const docRef = doc(this.collection, dossierId);
            
            // Ajouter la date de modification
            const dataToUpdate = {
                ...updates,
                'dates.modification': serverTimestamp()
            };
            
            // Ajouter à l'historique si spécifié
            if (updates.addToHistory) {
                const historyEntry = updates.addToHistory;
                delete dataToUpdate.addToHistory;
                
                dataToUpdate.historique = arrayUnion({
                    date: serverTimestamp(),
                    ...historyEntry
                });
            }
            
            await updateDoc(docRef, dataToUpdate);
            
            // Invalider le cache
            this.cache.delete(dossierId);
            
            return await this.getDossier(dossierId);
            
        } catch (error) {
            console.error('Erreur mise à jour dossier:', error);
            throw error;
        }
    }
    
    /**
     * Supprimer un dossier
     */
    async deleteDossier(dossierId) {
        try {
            const docRef = doc(this.collection, dossierId);
            await deleteDoc(docRef);
            
            // Nettoyer le cache
            this.cache.delete(dossierId);
            
            // Supprimer les listeners
            if (this.listeners.has(dossierId)) {
                this.listeners.get(dossierId)();
                this.listeners.delete(dossierId);
            }
            
            return true;
            
        } catch (error) {
            console.error('Erreur suppression dossier:', error);
            throw error;
        }
    }
    
    // ========================================
    // REQUÊTES COMPLEXES
    // ========================================
    
    /**
     * Obtenir la liste des dossiers avec filtres
     */
    async getDossiers(options = {}) {
        try {
            let q = this.collection;
            
            // Construire la requête
            const constraints = [];
            
            // Filtre par technicien
            if (options.technicien) {
                constraints.push(where('organisation.technicien.id', '==', options.technicien));
            }
            
            // Filtre par statut
            if (options.statut) {
                if (options.statut === 'retard') {
                    // Cas spécial pour les retards
                    constraints.push(where('alertes.niveau', '==', 'urgent'));
                } else {
                    constraints.push(where('workflow.statutGlobal', '==', options.statut));
                }
            }
            
            // Filtre par patient
            if (options.patientId) {
                constraints.push(where('patient.id', '==', options.patientId));
            }
            
            // Filtre par période
            if (options.dateDebut) {
                constraints.push(where('dates.creation', '>=', options.dateDebut));
            }
            if (options.dateFin) {
                constraints.push(where('dates.creation', '<=', options.dateFin));
            }
            
            // Tri
            if (options.orderBy) {
                constraints.push(orderBy(...options.orderBy));
            }
            
            // Limite
            if (options.limit) {
                constraints.push(limit(options.limit));
            }
            
            // Pagination
            if (options.startAfter) {
                constraints.push(startAfter(options.startAfter));
            }
            
            // Exécuter la requête
            q = query(this.collection, ...constraints);
            const querySnapshot = await getDocs(q);
            
            const dossiers = [];
            querySnapshot.forEach((doc) => {
                dossiers.push({ id: doc.id, ...doc.data() });
            });
            
            return dossiers;
            
        } catch (error) {
            console.error('Erreur récupération dossiers:', error);
            throw error;
        }
    }
    
    /**
     * Rechercher des dossiers
     */
    async searchDossiers(searchTerm) {
        try {
            // Recherche dans plusieurs champs
            // Note: Firestore ne supporte pas la recherche full-text native
            // Pour une vraie recherche, utiliser Algolia ou ElasticSearch
            
            const searchLower = searchTerm.toLowerCase();
            const dossiers = await this.getDossiers();
            
            return dossiers.filter(dossier => {
                const nom = dossier.patient.nom.toLowerCase();
                const prenom = dossier.patient.prenom.toLowerCase();
                const numero = dossier.numeroDossier.toLowerCase();
                
                return nom.includes(searchLower) || 
                       prenom.includes(searchLower) || 
                       numero.includes(searchLower);
            });
            
        } catch (error) {
            console.error('Erreur recherche dossiers:', error);
            throw error;
        }
    }
    
    /**
     * Obtenir les statistiques
     */
    async getStatistiques(options = {}) {
        try {
            const dossiers = await this.getDossiers(options);
            
            const stats = {
                total: dossiers.length,
                parStatut: {
                    nouveau: 0,
                    enCours: 0,
                    attente: 0,
                    retard: 0,
                    termine: 0
                },
                parWorkflow: {
                    mdph: {},
                    agefiph: {}
                },
                parTechnicien: {},
                montantTotal: 0,
                delaiMoyen: 0
            };
            
            // Calculer les statistiques
            for (const dossier of dossiers) {
                // Par statut global
                const statutGlobal = this.getStatutGlobal(dossier);
                stats.parStatut[statutGlobal]++;
                
                // Par workflow
                const mdphStatut = dossier.workflow.mdph.statut;
                const agefiStatut = dossier.workflow.agefiph.statut;
                
                stats.parWorkflow.mdph[mdphStatut] = (stats.parWorkflow.mdph[mdphStatut] || 0) + 1;
                stats.parWorkflow.agefiph[agefiStatut] = (stats.parWorkflow.agefiph[agefiStatut] || 0) + 1;
                
                // Par technicien
                const tech = dossier.organisation.technicien.nom;
                stats.parTechnicien[tech] = (stats.parTechnicien[tech] || 0) + 1;
                
                // Montant total
                stats.montantTotal += dossier.montants.appareil || 0;
                
                // Délai moyen (si terminé)
                if (dossier.workflow.mdph.dates.accord) {
                    const debut = new Date(dossier.dates.creation);
                    const fin = new Date(dossier.workflow.mdph.dates.accord);
                    const delai = Math.floor((fin - debut) / (1000 * 60 * 60 * 24));
                    stats.delaiMoyen += delai;
                }
            }
            
            // Finaliser délai moyen
            const dossiersTermines = stats.parStatut.termine;
            if (dossiersTermines > 0) {
                stats.delaiMoyen = Math.round(stats.delaiMoyen / dossiersTermines);
            }
            
            return stats;
            
        } catch (error) {
            console.error('Erreur calcul statistiques:', error);
            throw error;
        }
    }
    
    // ========================================
    // GESTION DES DOCUMENTS
    // ========================================
    
    /**
     * Ajouter un document à un dossier
     */
    async addDocument(dossierId, workflow, documentType, documentData) {
        try {
            const path = `documents.${workflow}.${documentType}`;
            
            const updates = {
                [path]: {
                    statut: 'en_attente_validation',
                    fichiers: arrayUnion(documentData),
                    dateAjout: serverTimestamp()
                },
                addToHistory: {
                    action: 'document_ajoute',
                    utilisateur: documentData.ajoutePar,
                    details: `Document ajouté : ${documentType}`
                }
            };
            
            return await this.updateDossier(dossierId, updates);
            
        } catch (error) {
            console.error('Erreur ajout document:', error);
            throw error;
        }
    }
    
    /**
     * Valider un document
     */
    async validateDocument(dossierId, workflow, documentType, validateur) {
        try {
            const path = `documents.${workflow}.${documentType}`;
            
            const updates = {
                [`${path}.statut`]: 'valide',
                [`${path}.dateValidation`]: serverTimestamp(),
                [`${path}.validateurPar`]: validateur,
                addToHistory: {
                    action: 'document_valide',
                    utilisateur: validateur,
                    details: `Document validé : ${documentType}`
                }
            };
            
            return await this.updateDossier(dossierId, updates);
            
        } catch (error) {
            console.error('Erreur validation document:', error);
            throw error;
        }
    }
    
    // ========================================
    // GESTION DU WORKFLOW
    // ========================================
    
    /**
     * Faire progresser le workflow
     */
    async progressWorkflow(dossierId, workflow, newStatut, utilisateur) {
        try {
            // Récupérer le dossier actuel
            const dossier = await this.getDossier(dossierId);
            const currentStatut = dossier.workflow[workflow].statut;
            
            // Calculer la nouvelle progression
            const progression = this.calculateProgression(workflow, newStatut);
            
            const updates = {
                [`workflow.${workflow}.statut`]: newStatut,
                [`workflow.${workflow}.progression`]: progression,
                [`workflow.${workflow}.dates.${newStatut}`]: serverTimestamp(),
                addToHistory: {
                    action: 'workflow_progression',
                    utilisateur: utilisateur,
                    details: `${workflow.toUpperCase()} : ${currentStatut} → ${newStatut}`
                }
            };
            
            // Gérer les cas spéciaux
            if (workflow === 'mdph' && newStatut === 'recepisse') {
                // Débloquer AGEFIPH
                updates['workflow.agefiph.bloque'] = false;
                updates['workflow.agefiph.raisonBlocage'] = null;
            }
            
            return await this.updateDossier(dossierId, updates);
            
        } catch (error) {
            console.error('Erreur progression workflow:', error);
            throw error;
        }
    }
    
    // ========================================
    // LISTENERS TEMPS RÉEL
    // ========================================
    
    /**
     * Écouter les changements d'un dossier
     */
    subscribeToDossier(dossierId, callback) {
        try {
            const docRef = doc(this.collection, dossierId);
            
            const unsubscribe = onSnapshot(docRef, (doc) => {
                if (doc.exists()) {
                    const dossier = { id: doc.id, ...doc.data() };
                    this.cache.set(dossierId, dossier);
                    callback(dossier);
                }
            });
            
            // Stocker la fonction de désinscription
            this.listeners.set(dossierId, unsubscribe);
            
            return unsubscribe;
            
        } catch (error) {
            console.error('Erreur subscription dossier:', error);
            throw error;
        }
    }
    
    /**
     * Écouter les changements de la liste
     */
    subscribeToList(options, callback) {
        try {
            let q = this.collection;
            
            // Appliquer les mêmes filtres que getDossiers
            const constraints = [];
            if (options.orderBy) {
                constraints.push(orderBy(...options.orderBy));
            }
            if (options.limit) {
                constraints.push(limit(options.limit));
            }
            
            q = query(this.collection, ...constraints);
            
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const dossiers = [];
                querySnapshot.forEach((doc) => {
                    dossiers.push({ id: doc.id, ...doc.data() });
                });
                callback(dossiers);
            });
            
            return unsubscribe;
            
        } catch (error) {
            console.error('Erreur subscription liste:', error);
            throw error;
        }
    }
    
    // ========================================
    // MÉTHODES UTILITAIRES
    // ========================================
    
    /**
     * Générer un numéro de dossier unique
     */
    async generateNumeroDossier() {
        try {
            const year = new Date().getFullYear();
            const compteurRef = doc(this.compteurCollection, `subventions-${year}`);
            
            // Incrémenter le compteur de façon atomique
            await updateDoc(compteurRef, {
                value: increment(1)
            }).catch(async () => {
                // Si le document n'existe pas, le créer
                await setDoc(compteurRef, { value: 1 });
            });
            
            // Récupérer la valeur
            const compteurDoc = await getDoc(compteurRef);
            const numero = compteurDoc.data().value;
            
            // Formater le numéro
            return `SUB-${year}-${String(numero).padStart(4, '0')}`;
            
        } catch (error) {
            console.error('Erreur génération numéro:', error);
            // Fallback
            return `SUB-${Date.now()}`;
        }
    }
    
    /**
     * Calculer le statut global d'un dossier
     */
    getStatutGlobal(dossier) {
        // Réutiliser la logique du service
        if (dossier.alertes && dossier.alertes.niveau === 'urgent') {
            return 'retard';
        }
        
        if (dossier.workflow.agefiph.bloque) {
            return 'attente';
        }
        
        if (dossier.workflow.mdph.statut === 'accord' && 
            dossier.workflow.agefiph.statut === 'decision') {
            return 'termine';
        }
        
        if (dossier.workflow.mdph.statut === 'nouveau') {
            return 'nouveau';
        }
        
        return 'enCours';
    }
    
    /**
     * Calculer la progression
     */
    calculateProgression(workflow, statut) {
        const etapes = workflow === 'mdph' 
            ? ['nouveau', 'documents', 'formulaire', 'depot', 'recepisse', 'accord']
            : ['attente', 'documents', 'formulaire', 'attente_recepisse', 'finalisation', 'soumis', 'decision'];
            
        const index = etapes.indexOf(statut);
        if (index === -1) return 0;
        
        return Math.round((index / (etapes.length - 1)) * 100);
    }
    
    /**
     * Vider le cache
     */
    clearCache() {
        this.cache.clear();
    }
    
    /**
     * Nettoyer les listeners
     */
    cleanup() {
        // Désinscrire tous les listeners
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners.clear();
        
        // Vider le cache
        this.clearCache();
    }
}

// Export de l'instance unique
export const subventionsFirestore = new SubventionsFirestore();

/* ========================================
   EXPORT PAR DÉFAUT
   ======================================== */

export default subventionsFirestore;