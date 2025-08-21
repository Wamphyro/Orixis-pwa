// ========================================
// STOCK-PVT.FIRESTORE.SERVICE.JS - 🗄️ SERVICE FIRESTORE
// Chemin: modules/stock-pvt/stock-pvt.firestore.service.js
//
// DESCRIPTION:
// Service CRUD Firestore pour stock prés-ventes
// Inclut template, détection catégories et import CSV
//
// VERSION: 1.0.0
// DATE: 03/02/2025
// ========================================

import { db } from '../../src/services/firebase.service.js';

// ========================================
// CONFIGURATION
// ========================================

const COLLECTION_NAME = 'stockPVT';

// ========================================
// TEMPLATE DE DONNÉES
// ========================================

const PVT_TEMPLATE = {
    // Identification
    reference: null,              // String - Référence article
    designation: null,            // String - Nom/description
    codeBarres: null,            // String - EAN/GTIN
    
    // Stock
    quantite: 0,                 // Number - Quantité en stock
    quantiteMin: 0,              // Number - Stock minimum
    quantiteMax: 0,              // Number - Stock maximum
    emplacement: null,           // String - Localisation
    
    // Prix
    prixAchat: 0,               // Number - Prix d'achat HT
    prixVente: 0,               // Number - Prix de vente TTC
    tauxMarge: 0,               // Number - Taux de marge %
    montantMarge: 0,            // Number - Marge en euros
    
    // Classification
    categorie: null,            // String - Catégorie principale
    famille: null,              // String - Sous-catégorie
    fournisseur: null,          // String - Fournisseur
    marque: null,               // String - Marque
    
    // Dates
    dateEntree: null,           // String - Date entrée stock
    dateDernierMouvement: null, // String - Dernier mouvement
    datePeremption: null,       // String - DLC/DLUO
    
    // Statut
    actif: true,                // Boolean - Article actif
    enRupture: false,           // Boolean - En rupture
    aCommander: false,          // Boolean - À commander
    
    // Import
    codeMagasin: null,          // String - Code magasin
    importSource: null,         // String - Fichier source
    dateImport: null,           // Timestamp - Date import
    hash: null,                 // String - Hash pour doublons
    
    // Workflow
    dates: {
        creation: null,         // Timestamp
        modification: null      // Timestamp
    },
    
    intervenants: {
        creePar: null,
        modifiePar: null
    },
    
    // Historique
    historique: []
};

// ========================================
// RÈGLES DE DÉTECTION DES CATÉGORIES
// ========================================

const DETECTION_RULES = [
    // Alimentaire
    { pattern: /PAIN|BAGUETTE|VIENNOISERIE|CROISSANT/, categorie: 'alimentaire', famille: 'boulangerie' },
    { pattern: /VIANDE|POULET|BOEUF|PORC|AGNEAU/, categorie: 'alimentaire', famille: 'boucherie' },
    { pattern: /POISSON|SAUMON|CREVETTE|CRUSTACE/, categorie: 'alimentaire', famille: 'poissonnerie' },
    { pattern: /FROMAGE|YAOURT|LAIT|BEURRE|CREME/, categorie: 'alimentaire', famille: 'crémerie' },
    { pattern: /FRUIT|POMME|BANANE|ORANGE|LEGUME/, categorie: 'alimentaire', famille: 'fruits_legumes' },
    { pattern: /PATES|RIZ|CONSERVE|SAUCE|HUILE/, categorie: 'alimentaire', famille: 'épicerie' },
    
    // Boissons
    { pattern: /EAU|COCA|SODA|JUS|LIMONADE/, categorie: 'boisson', famille: 'soft' },
    { pattern: /BIERE|VIN|CHAMPAGNE|ALCOOL|WHISKY/, categorie: 'boisson', famille: 'alcool' },
    { pattern: /CAFE|THE|INFUSION|CHOCOLAT CHAUD/, categorie: 'boisson', famille: 'chaude' },
    
    // Textile
    { pattern: /CHEMISE|PANTALON|JEAN|ROBE|JUPE/, categorie: 'textile', famille: 'vetement' },
    { pattern: /CHAUSSURE|BASKET|BOTTE|SANDALE/, categorie: 'textile', famille: 'chaussure' },
    { pattern: /SAC|CEINTURE|CHAPEAU|ECHARPE/, categorie: 'textile', famille: 'accessoire' },
    
    // Électronique
    { pattern: /TELEPHONE|SMARTPHONE|IPHONE|SAMSUNG/, categorie: 'electronique', famille: 'telephonie' },
    { pattern: /ORDINATEUR|PC|LAPTOP|TABLETTE|IPAD/, categorie: 'electronique', famille: 'informatique' },
    { pattern: /TELEVISION|TV|ECRAN|MONITEUR/, categorie: 'electronique', famille: 'audiovisuel' },
    { pattern: /CABLE|CHARGEUR|BATTERIE|ECOUTEUR/, categorie: 'electronique', famille: 'accessoire' },
    
    // Maison
    { pattern: /MEUBLE|TABLE|CHAISE|CANAPE|LIT/, categorie: 'maison', famille: 'mobilier' },
    { pattern: /ASSIETTE|VERRE|COUVERT|CASSEROLE/, categorie: 'maison', famille: 'cuisine' },
    { pattern: /DRAP|COUETTE|OREILLER|SERVIETTE/, categorie: 'maison', famille: 'linge' },
    { pattern: /AMPOULE|LAMPE|LUMINAIRE|ECLAIRAGE/, categorie: 'maison', famille: 'eclairage' },
    
    // Sport
    { pattern: /BALLON|RAQUETTE|VELO|TROTTINETTE/, categorie: 'sport', famille: 'equipement' },
    { pattern: /MAILLOT|SHORT SPORT|SURVETEMENT/, categorie: 'sport', famille: 'vetement_sport' },
    { pattern: /POIDS|HALTERE|TAPIS|ELASTIQUE/, categorie: 'sport', famille: 'fitness' },
    
    // Beauté
    { pattern: /CREME|SERUM|MASQUE|SOIN|LOTION/, categorie: 'beaute', famille: 'soin' },
    { pattern: /PARFUM|EAU DE TOILETTE|DEODORANT/, categorie: 'beaute', famille: 'parfumerie' },
    { pattern: /MAQUILLAGE|ROUGE|MASCARA|FOND DE TEINT/, categorie: 'beaute', famille: 'maquillage' },
    { pattern: /SHAMPOING|GEL DOUCHE|SAVON/, categorie: 'beaute', famille: 'hygiene' }
];

// ========================================
// SERVICE FIRESTORE
// ========================================

class StockPVTFirestoreService {
    
    // ========================================
    // CRÉATION
    // ========================================
    
    async creerArticle(data) {
        try {
            const { collection, addDoc, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            console.log('📦 Création article...');
            
            // Créer le template de base
            const article = this.createNewArticle();
            
            // Générer la référence si pas fournie
            if (!data.reference) {
                article.reference = await this.genererReference();
            } else {
                article.reference = data.reference;
            }
            
            // Récupérer les infos utilisateur
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            
            // Remplir les données
            article.designation = data.designation;
            article.codeBarres = data.codeBarres || null;
            article.quantite = parseFloat(data.quantite) || 0;
            article.quantiteMin = parseFloat(data.quantiteMin) || 0;
            article.quantiteMax = parseFloat(data.quantiteMax) || 999;
            article.emplacement = data.emplacement || null;
            article.prixAchat = parseFloat(data.prixAchat) || 0;
            article.prixVente = parseFloat(data.prixVente) || 0;
            
            // Calculer les marges
            if (article.prixAchat > 0 && article.prixVente > 0) {
                article.montantMarge = article.prixVente - article.prixAchat;
                article.tauxMarge = ((article.montantMarge / article.prixAchat) * 100).toFixed(2);
            }
            
            // Catégorisation
            article.categorie = data.categorie || this.detecterCategorie(data.designation);
            article.famille = data.famille || null;
            article.fournisseur = data.fournisseur || null;
            article.marque = data.marque || null;
            
            // Dates
            article.dateEntree = data.dateEntree || new Date().toISOString().split('T')[0];
            article.dateDernierMouvement = new Date().toISOString().split('T')[0];
            article.datePeremption = data.datePeremption || null;
            
            // Statuts
            article.enRupture = article.quantite <= 0;
            article.aCommander = article.quantite <= article.quantiteMin;
            
            // Import
            article.codeMagasin = data.codeMagasin || '-';
            article.importSource = data.importSource || null;
            
            // Métadonnées
            article.dates.creation = serverTimestamp();
            article.intervenants.creePar = {
                id: auth.collaborateur?.id || 'import',
                nom: auth.collaborateur?.nom || 'Import',
                prenom: auth.collaborateur?.prenom || 'CSV'
            };
            
            // Historique initial
            article.historique = [{
                date: new Date().toISOString(),
                action: 'creation',
                details: 'Article importé',
                utilisateur: article.intervenants.creePar
            }];
            
            // Créer dans Firestore
            const docRef = await addDoc(collection(db, COLLECTION_NAME), article);
            
            console.log('✅ Article créé:', article.reference, 'ID:', docRef.id);
            
            return docRef.id;
            
        } catch (error) {
            console.error('❌ Erreur création article:', error);
            throw new Error(`Erreur création: ${error.message}`);
        }
    }
    
    createNewArticle() {
        return JSON.parse(JSON.stringify(PVT_TEMPLATE));
    }
    
    async genererReference() {
        const date = new Date();
        const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `PVT-${dateStr}-${random}`;
    }
    
    // ========================================
    // LECTURE
    // ========================================
    
    async getArticles(filtres = {}) {
        try {
            const { collection, query, where, orderBy, limit, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            let q = collection(db, COLLECTION_NAME);
            const constraints = [];
            
            // Filtre par catégorie
            if (filtres.categorie) {
                constraints.push(where('categorie', '==', filtres.categorie));
            }
            
            // Filtre par fournisseur
            if (filtres.fournisseur) {
                constraints.push(where('fournisseur', '==', filtres.fournisseur));
            }
            
            // Filtre par magasin
            if (filtres.magasin) {
                constraints.push(where('codeMagasin', '==', filtres.magasin));
            }
            
            // Filtre rupture
            if (filtres.enRupture !== undefined) {
                constraints.push(where('enRupture', '==', filtres.enRupture));
            }
            
            // Tri par défaut
            constraints.push(orderBy('designation', 'asc'));
            
            // Limite
            if (filtres.limite) {
                constraints.push(limit(filtres.limite));
            }
            
            // Appliquer les contraintes
            if (constraints.length > 0) {
                q = query(q, ...constraints);
            }
            
            // Exécuter la requête
            const snapshot = await getDocs(q);
            
            const articles = [];
            snapshot.forEach((doc) => {
                articles.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`📊 ${articles.length} articles trouvés`);
            return articles;
            
        } catch (error) {
            console.error('❌ Erreur récupération articles:', error);
            return [];
        }
    }
    
    async getStatistiques() {
        try {
            const articles = await this.getArticles({ limite: 5000 });
            
            const stats = {
                total: articles.length,
                valeurStock: 0,
                valeurAchat: 0,
                margeGlobale: 0,
                enRupture: 0,
                stockBas: 0,
                stockOk: 0,
                parCategorie: {},
                parFournisseur: {},
                parMagasin: {}
            };
            
            articles.forEach(article => {
                // Valeurs
                const qte = article.quantite || 0;
                stats.valeurStock += qte * (article.prixVente || 0);
                stats.valeurAchat += qte * (article.prixAchat || 0);
                
                // Statuts
                if (article.enRupture) {
                    stats.enRupture++;
                } else if (article.aCommander) {
                    stats.stockBas++;
                } else {
                    stats.stockOk++;
                }
                
                // Par catégorie
                const cat = article.categorie || 'autre';
                if (!stats.parCategorie[cat]) {
                    stats.parCategorie[cat] = {
                        nombre: 0,
                        valeur: 0,
                        quantite: 0
                    };
                }
                stats.parCategorie[cat].nombre++;
                stats.parCategorie[cat].valeur += qte * (article.prixVente || 0);
                stats.parCategorie[cat].quantite += qte;
                
                // Par fournisseur
                const fourn = article.fournisseur || 'inconnu';
                if (!stats.parFournisseur[fourn]) {
                    stats.parFournisseur[fourn] = {
                        nombre: 0,
                        valeur: 0
                    };
                }
                stats.parFournisseur[fourn].nombre++;
                stats.parFournisseur[fourn].valeur += qte * (article.prixVente || 0);
                
                // Par magasin
                const mag = article.codeMagasin || '-';
                if (!stats.parMagasin[mag]) {
                    stats.parMagasin[mag] = {
                        nombre: 0,
                        valeur: 0
                    };
                }
                stats.parMagasin[mag].nombre++;
                stats.parMagasin[mag].valeur += qte * (article.prixVente || 0);
            });
            
            // Marge globale
            stats.margeGlobale = stats.valeurStock - stats.valeurAchat;
            
            return stats;
            
        } catch (error) {
            console.error('❌ Erreur calcul statistiques:', error);
            return {
                total: 0,
                valeurStock: 0,
                valeurAchat: 0,
                margeGlobale: 0,
                enRupture: 0,
                stockBas: 0,
                stockOk: 0,
                parCategorie: {},
                parFournisseur: {},
                parMagasin: {}
            };
        }
    }
    
    // ========================================
    // MISE À JOUR
    // ========================================
    
    async mettreAJourArticle(articleId, updates) {
        try {
            const { doc, updateDoc, serverTimestamp, arrayUnion } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const auth = JSON.parse(localStorage.getItem('sav_auth') || '{}');
            const utilisateur = {
                id: auth.collaborateur?.id || 'unknown',
                nom: auth.collaborateur?.nom || 'Inconnu',
                prenom: auth.collaborateur?.prenom || ''
            };
            
            // Recalculer les marges si prix modifiés
            if (updates.prixAchat !== undefined || updates.prixVente !== undefined) {
                const pa = updates.prixAchat || 0;
                const pv = updates.prixVente || 0;
                if (pa > 0 && pv > 0) {
                    updates.montantMarge = pv - pa;
                    updates.tauxMarge = ((updates.montantMarge / pa) * 100).toFixed(2);
                }
            }
            
            // Vérifier les statuts si quantité modifiée
            if (updates.quantite !== undefined) {
                updates.enRupture = updates.quantite <= 0;
                updates.aCommander = updates.quantite <= (updates.quantiteMin || 0);
                updates.dateDernierMouvement = new Date().toISOString().split('T')[0];
            }
            
            const updatesAvecMeta = {
                ...updates,
                'dates.modification': serverTimestamp(),
                'intervenants.modifiePar': utilisateur,
                historique: arrayUnion({
                    date: new Date().toISOString(),
                    action: 'modification',
                    details: 'Article modifié',
                    utilisateur: utilisateur
                })
            };
            
            await updateDoc(doc(db, COLLECTION_NAME, articleId), updatesAvecMeta);
            
            console.log('✅ Article mis à jour');
            return true;
            
        } catch (error) {
            console.error('❌ Erreur mise à jour:', error);
            throw error;
        }
    }
    
    async mouvementStock(articleId, quantite, type = 'entree') {
        try {
            const article = await this.getArticleById(articleId);
            if (!article) throw new Error('Article introuvable');
            
            const nouvelleQte = type === 'entree' 
                ? article.quantite + quantite 
                : article.quantite - quantite;
            
            if (nouvelleQte < 0) {
                throw new Error('Stock insuffisant');
            }
            
            await this.mettreAJourArticle(articleId, {
                quantite: nouvelleQte,
                dateDernierMouvement: new Date().toISOString().split('T')[0]
            });
            
            return true;
        } catch (error) {
            console.error('❌ Erreur mouvement stock:', error);
            throw error;
        }
    }
    
    // ========================================
    // SUPPRESSION
    // ========================================
    
    async supprimerArticle(articleId) {
        try {
            const { doc, deleteDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            await deleteDoc(doc(db, COLLECTION_NAME, articleId));
            
            console.log('✅ Article supprimé:', articleId);
            
        } catch (error) {
            console.error('❌ Erreur suppression:', error);
            throw new Error('Impossible de supprimer l\'article');
        }
    }
    
    // ========================================
    // IMPORT
    // ========================================
    
    async trouverCodeParACM(nomFichier) {
        if (!nomFichier) return '-';
        
        try {
            const { collection, getDocs } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Nettoyer le nom du fichier
            const nomNettoye = nomFichier.replace(/\.[^/.]+$/, '');
            console.log('🔍 Recherche ACM dans le nom:', nomNettoye);
            
            // Rechercher dans les magasins
            const magasinsSnapshot = await getDocs(collection(db, 'magasins'));
            for (const doc of magasinsSnapshot.docs) {
                const magasin = doc.data();
                const numeroACM = magasin.identification?.numeroCompteACM;
                if (numeroACM && nomNettoye.includes(numeroACM)) {
                    console.log(`✅ Magasin trouvé: ${magasin.code} (ACM: ${numeroACM})`);
                    return magasin.code;
                }
            }
            
            // Rechercher dans les sociétés
            const societesSnapshot = await getDocs(collection(db, 'societes'));
            for (const doc of societesSnapshot.docs) {
                const societe = doc.data();
                const numeroACM = societe.identification?.numeroCompteACM;
                if (numeroACM && nomNettoye.includes(numeroACM)) {
                    console.log(`✅ Société trouvée: ${societe.code} (ACM: ${numeroACM})`);
                    return societe.code;
                }
            }
            
            console.log(`⚠️ Aucune correspondance ACM dans: ${nomNettoye}`);
            return '-';
            
        } catch (error) {
            console.error('❌ Erreur recherche ACM:', error);
            return '-';
        }
    }
    
    async importerArticles(articles, nomFichier = null) {
        try {
            const { collection, addDoc, query, where, limit, getDocs, serverTimestamp } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            // Trouver le code magasin depuis le nom du fichier
            let codeMagasin = '-';
            if (nomFichier) {
                codeMagasin = await this.trouverCodeParACM(nomFichier);
                console.log(`🔍 Code magasin trouvé: ${codeMagasin} pour fichier: ${nomFichier}`);
            }
            
            const resultats = {
                reussies: 0,
                doublons: 0,
                erreurs: []
            };
            
            for (const article of articles) {
                try {
                    // Vérifier si doublon (par référence)
                    if (article.reference) {
                        const doublonQuery = query(
                            collection(db, COLLECTION_NAME),
                            where('reference', '==', article.reference),
                            where('codeMagasin', '==', codeMagasin),
                            limit(1)
                        );
                        const existant = await getDocs(doublonQuery);
                        
                        if (!existant.empty) {
                            console.log('⚠️ Doublon détecté:', article.reference);
                            resultats.doublons++;
                            continue;
                        }
                    }
                    
                    // Générer un hash pour détection doublons sans référence
                    const hash = this.genererHashArticle(article);
                    const hashQuery = query(
                        collection(db, COLLECTION_NAME),
                        where('hash', '==', hash),
                        limit(1)
                    );
                    const existantHash = await getDocs(hashQuery);
                    
                    if (!existantHash.empty) {
                        console.log('⚠️ Doublon détecté (hash):', article.designation);
                        resultats.doublons++;
                        continue;
                    }
                    
                    // Enrichir avec métadonnées
                    const articleEnrichi = {
                        ...article,
                        codeMagasin: codeMagasin,
                        hash: hash,
                        categorie: article.categorie || this.detecterCategorie(article.designation),
                        dateImport: serverTimestamp(),
                        importSource: nomFichier,
                        enRupture: (article.quantite || 0) <= 0,
                        aCommander: (article.quantite || 0) <= (article.quantiteMin || 0),
                        actif: true,
                        dates: {
                            creation: serverTimestamp()
                        },
                        intervenants: {
                            creePar: {
                                id: 'import',
                                nom: 'Import CSV',
                                prenom: ''
                            }
                        },
                        historique: [{
                            date: new Date().toISOString(),
                            action: 'import',
                            details: `Importé depuis ${nomFichier || 'CSV'}`
                        }]
                    };
                    
                    // Calculer les marges
                    if (articleEnrichi.prixAchat > 0 && articleEnrichi.prixVente > 0) {
                        articleEnrichi.montantMarge = articleEnrichi.prixVente - articleEnrichi.prixAchat;
                        articleEnrichi.tauxMarge = ((articleEnrichi.montantMarge / articleEnrichi.prixAchat) * 100).toFixed(2);
                    }
                    
                    // Sauvegarder
                    await addDoc(collection(db, COLLECTION_NAME), articleEnrichi);
                    resultats.reussies++;
                    
                } catch (error) {
                    console.error('❌ Erreur import article:', error);
                    resultats.erreurs.push({
                        article: article.designation || article.reference,
                        erreur: error.message
                    });
                }
            }
            
            console.log('✅ Import terminé:', resultats);
            return resultats;
            
        } catch (error) {
            console.error('❌ Erreur import articles:', error);
            throw error;
        }
    }
    
    genererHashArticle(article) {
        const str = `${article.reference || ''}_${article.designation || ''}_${article.codeBarres || ''}`;
        return btoa(str).substring(0, 16);
    }
    
    async getArticleById(id) {
        try {
            const { doc, getDoc } = await import(
                'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
            );
            
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return {
                    id: docSnap.id,
                    ...docSnap.data()
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erreur récupération article:', error);
            return null;
        }
    }
    
    // ========================================
    // DÉTECTION DE CATÉGORIE
    // ========================================
    
    detecterCategorie(designation) {
        if (!designation) return 'autre';
        
        const designationUpper = designation.toUpperCase();
        
        for (const rule of DETECTION_RULES) {
            if (rule.pattern.test(designationUpper)) {
                return rule.categorie;
            }
        }
        
        return 'autre';
    }
}

// ========================================
// EXPORT SINGLETON
// ========================================

const service = new StockPVTFirestoreService();
export default service;