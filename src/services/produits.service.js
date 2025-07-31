// ========================================
// PRODUITS.SERVICE.JS - Gestion des produits Firebase
// ========================================

import { db } from './firebase.service.js';
import { COMMANDES_CONFIG } from '../data/commandes.data.js';

// Variables locales
let produitsCache = new Map();
let lastFetch = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Service de gestion des produits
 */
export class ProduitsService {
    
    /**
     * Créer un nouveau produit
     * @param {Object} produitData - Données du produit
     * @returns {Promise<string>} ID du produit créé
     */
    static async creerProduit(produitData) {
        try {
            // Validation des données
            if (!produitData.reference || !produitData.designation) {
                throw new Error('Référence et désignation requises');
            }
            
            if (produitData.prix && produitData.prix < 0) {
                throw new Error('Le prix doit être positif');
            }
            
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Préparer les données
            const nouveauProduit = {
                actif: true,
                reference: produitData.reference.toUpperCase(),
                codeProduit: produitData.codeProduit || produitData.reference,
                designation: produitData.designation,
                type: produitData.type || 'consommable',
                categorie: produitData.categorie || '',
                marque: produitData.marque || '',
                prix: produitData.prix || 0,
                fournisseur: produitData.fournisseur || '',
                
                // Gestion spécifique selon le type
                gestionNumeroSerie: COMMANDES_CONFIG.TYPES_PRODUITS[produitData.type]?.gestionNumeroSerie || false,
                necessiteCote: COMMANDES_CONFIG.TYPES_PRODUITS[produitData.type]?.necessiteCote || false,
                
                // Stock optionnel
                gestionStock: {
                    actif: false,
                    quantiteDisponible: 0,
                    seuilAlerte: 5,
                    derniereMAJ: serverTimestamp()
                },
                
                dateCreation: serverTimestamp(),
                derniereModification: serverTimestamp()
            };
            
            // Créer dans Firebase
            const docRef = await addDoc(collection(db, 'produits'), nouveauProduit);
            
            // Ajouter au cache
            produitsCache.set(docRef.id, { id: docRef.id, ...nouveauProduit });
            
            console.log('✅ Produit créé:', docRef.id);
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création produit:', error);
            throw error;
        }
    }
    
    /**
     * Récupérer un produit par son ID
     * @param {string} produitId - ID du produit
     * @returns {Promise<Object>} Données du produit
     */
    static async getProduit(produitId) {
        try {
            // Vérifier le cache
            if (produitsCache.has(produitId)) {
                return produitsCache.get(produitId);
            }
            
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const produitDoc = await getDoc(doc(db, 'produits', produitId));
            
            if (produitDoc.exists()) {
                const produitData = { id: produitDoc.id, ...produitDoc.data() };
                produitsCache.set(produitId, produitData);
                return produitData;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération produit:', error);
            return null;
        }
    }
    
    /**
     * Rechercher des produits
     * @param {string} recherche - Terme de recherche
     * @param {Object} filtres - Filtres additionnels
     * @returns {Promise<Array>} Liste des produits trouvés
     */
    static async rechercherProduits(recherche, filtres = {}) {
        try {
            // Charger tous les produits si cache expiré
            if (Date.now() - lastFetch > CACHE_DURATION) {
                await this.chargerTousLesProduits();
            }
            
            let resultats = Array.from(produitsCache.values());
            
            // Filtrer par recherche
            if (recherche && recherche.length >= 2) {
                const termeRecherche = recherche.toLowerCase();
                resultats = resultats.filter(produit => {
                    return produit.reference.toLowerCase().includes(termeRecherche) ||
                           produit.designation.toLowerCase().includes(termeRecherche) ||
                           produit.codeProduit?.toLowerCase().includes(termeRecherche) ||
                           produit.marque?.toLowerCase().includes(termeRecherche);
                });
            }
            
            // Appliquer les filtres
            if (filtres.type) {
                resultats = resultats.filter(p => p.type === filtres.type);
            }
            
            if (filtres.categorie) {
                resultats = resultats.filter(p => p.categorie === filtres.categorie);
            }
            
            if (filtres.marque) {
                resultats = resultats.filter(p => p.marque === filtres.marque);
            }
            
            if (filtres.necessiteCote !== undefined) {
                resultats = resultats.filter(p => p.necessiteCote === filtres.necessiteCote);
            }
            
            // Trier par pertinence
            resultats.sort((a, b) => {
                // Priorité aux références exactes
                if (recherche) {
                    const aExact = a.reference.toLowerCase() === recherche.toLowerCase();
                    const bExact = b.reference.toLowerCase() === recherche.toLowerCase();
                    if (aExact && !bExact) return -1;
                    if (!aExact && bExact) return 1;
                }
                
                // Puis par désignation alphabétique
                return a.designation.localeCompare(b.designation);
            });
            
            return resultats.slice(0, 20); // Limiter à 20 résultats
            
        } catch (error) {
            console.error('❌ Erreur recherche produits:', error);
            return [];
        }
    }
    
    /**
     * Charger tous les produits actifs
     * @returns {Promise<Array>} Liste de tous les produits
     */
    static async chargerTousLesProduits() {
        try {
            const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = query(
                collection(db, 'produits'),
                where('actif', '==', true)
            );
            
            const snapshot = await getDocs(q);
            
            // Vider et remplir le cache
            produitsCache.clear();
            const produits = [];
            
            snapshot.forEach((doc) => {
                const produitData = { id: doc.id, ...doc.data() };
                produitsCache.set(doc.id, produitData);
                produits.push(produitData);
            });
            
            lastFetch = Date.now();
            console.log(`✅ ${produits.length} produits chargés`);
            
            return produits;
            
        } catch (error) {
            console.error('❌ Erreur chargement produits:', error);
            return [];
        }
    }
    
    /**
     * Récupérer les produits par type
     * @param {string} type - Type de produit
     * @returns {Promise<Array>} Liste des produits du type
     */
    static async getProduitsByType(type) {
        try {
            // Utiliser le cache si disponible
            if (Date.now() - lastFetch < CACHE_DURATION) {
                return Array.from(produitsCache.values())
                    .filter(p => p.type === type && p.actif);
            }
            
            const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = query(
                collection(db, 'produits'),
                where('type', '==', type),
                where('actif', '==', true)
            );
            
            const snapshot = await getDocs(q);
            const produits = [];
            
            snapshot.forEach((doc) => {
                produits.push({ id: doc.id, ...doc.data() });
            });
            
            return produits;
            
        } catch (error) {
            console.error('❌ Erreur récupération produits par type:', error);
            return [];
        }
    }
    
    /**
     * Récupérer les produits par marque
     * @param {string} marque - Marque des produits
     * @returns {Promise<Array>} Liste des produits de la marque
     */
    static async getProduitsByMarque(marque) {
        try {
            const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const q = query(
                collection(db, 'produits'),
                where('marque', '==', marque),
                where('actif', '==', true)
            );
            
            const snapshot = await getDocs(q);
            const produits = [];
            
            snapshot.forEach((doc) => {
                produits.push({ id: doc.id, ...doc.data() });
            });
            
            return produits;
            
        } catch (error) {
            console.error('❌ Erreur récupération produits par marque:', error);
            return [];
        }
    }
    
    /**
     * Mettre à jour un produit
     * @param {string} produitId - ID du produit
     * @param {Object} updates - Données à mettre à jour
     * @returns {Promise<boolean>} Succès de la mise à jour
     */
    static async mettreAJourProduit(produitId, updates) {
        try {
            const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Validation du prix si modifié
            if (updates.prix !== undefined && updates.prix < 0) {
                throw new Error('Le prix doit être positif');
            }
            
            // Ajouter la date de modification
            updates.derniereModification = serverTimestamp();
            
            // Mettre à jour dans Firebase
            await updateDoc(doc(db, 'produits', produitId), updates);
            
            // Mettre à jour le cache
            if (produitsCache.has(produitId)) {
                const produitActuel = produitsCache.get(produitId);
                produitsCache.set(produitId, { ...produitActuel, ...updates });
            }
            
            console.log('✅ Produit mis à jour:', produitId);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour produit:', error);
            throw error;
        }
    }
    
    /**
     * Obtenir toutes les marques disponibles
     * @returns {Promise<Array>} Liste des marques
     */
    static async getMarques() {
        try {
            // Charger les produits si nécessaire
            if (Date.now() - lastFetch > CACHE_DURATION) {
                await this.chargerTousLesProduits();
            }
            
            // Extraire les marques uniques
            const marques = new Set();
            produitsCache.forEach(produit => {
                if (produit.marque) {
                    marques.add(produit.marque);
                }
            });
            
            return Array.from(marques).sort();
            
        } catch (error) {
            console.error('❌ Erreur récupération marques:', error);
            return [];
        }
    }
    
    /**
     * Obtenir toutes les catégories disponibles
     * @returns {Promise<Array>} Liste des catégories
     */
    static async getCategories() {
        try {
            // Charger les produits si nécessaire
            if (Date.now() - lastFetch > CACHE_DURATION) {
                await this.chargerTousLesProduits();
            }
            
            // Extraire les catégories uniques
            const categories = new Set();
            produitsCache.forEach(produit => {
                if (produit.categorie) {
                    categories.add(produit.categorie);
                }
            });
            
            return Array.from(categories).sort();
            
        } catch (error) {
            console.error('❌ Erreur récupération catégories:', error);
            return [];
        }
    }
    
    /**
     * Mettre à jour le stock d'un produit
     * @param {string} produitId - ID du produit
     * @param {number} quantite - Nouvelle quantité
     * @returns {Promise<boolean>} Succès de la mise à jour
     */
    static async mettreAJourStock(produitId, quantite) {
        try {
            const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            await updateDoc(doc(db, 'produits', produitId), {
                'gestionStock.quantiteDisponible': quantite,
                'gestionStock.derniereMAJ': serverTimestamp(),
                derniereModification: serverTimestamp()
            });
            
            // Mettre à jour le cache
            if (produitsCache.has(produitId)) {
                const produit = produitsCache.get(produitId);
                produit.gestionStock.quantiteDisponible = quantite;
            }
            
            console.log('✅ Stock mis à jour:', produitId, quantite);
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour stock:', error);
            throw error;
        }
    }
    
    /**
     * Vider le cache (utile après des modifications importantes)
     */
    static viderCache() {
        produitsCache.clear();
        lastFetch = 0;
    }
}