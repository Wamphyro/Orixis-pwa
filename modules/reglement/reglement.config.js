// ========================================
// REGLEMENT.CONFIG.JS - Configuration et factories
// Chemin: modules/reglement/reglement.config.js
//
// DESCRIPTION:
// Configuration centralisée et factories de composants
// Basé sur stock-produit.config.js
//
// VERSION: 1.0.0
// DATE: 03/02/2025
// ========================================

// ========================================
// FACTORIES DE COMPOSANTS
// ========================================

class Button {
    constructor(options) {
        this.element = document.createElement('button');
        this.element.className = `btn btn-${options.variant || 'primary'}`;
        if (options.pill) this.element.className += ' btn-pill';
        this.element.textContent = options.text;
        if (options.disabled) this.element.disabled = true;
        if (options.onClick) this.element.onclick = options.onClick;
    }
    
    getElement() {
        return this.element;
    }
}

// ========================================
// DROPZONE IMPORT
// ========================================

function createImportDropzone(selector, options) {
    const container = document.querySelector(selector);
    if (!container) return null;
    
    // État interne
    const state = {
        files: [],
        maxFiles: 10
    };
    
    // Créer la structure HTML
    container.innerHTML = `
        <div class="dropzone-area">
            <input type="file" id="fileInput" multiple accept=".csv,.txt,.tsv" style="display: none;">
            <div class="dropzone-content">
                <div class="dropzone-icon">💰</div>
                <div class="dropzone-text">
                    Glissez vos fichiers CSV ici<br>
                    <span class="dropzone-subtext">ou cliquez pour parcourir (max ${state.maxFiles} fichiers)</span>
                </div>
            </div>
            <div class="dropzone-files" style="display: none;">
                <div class="files-list"></div>
            </div>
        </div>
    `;
    
    const fileInput = container.querySelector('#fileInput');
    const dropArea = container.querySelector('.dropzone-area');
    const filesContainer = container.querySelector('.dropzone-files');
    const filesList = container.querySelector('.files-list');
    
    // Fonction pour afficher les fichiers
    const displayFiles = () => {
        if (state.files.length === 0) {
            filesContainer.style.display = 'none';
            return;
        }
        
        filesContainer.style.display = 'block';
        filesList.innerHTML = state.files.map((file, index) => `
            <div class="file-item" data-index="${index}">
                <span class="file-icon">📄</span>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${formatFileSize(file.size)})</span>
                <button class="file-remove" data-index="${index}">✕</button>
            </div>
        `).join('');
        
        // Ajouter les listeners pour supprimer
        filesList.querySelectorAll('.file-remove').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                state.files.splice(index, 1);
                displayFiles();
                if (options.onRemove) {
                    options.onRemove(state.files[index], index);
                }
            };
        });
    };
    
    // Fonction pour formater la taille
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };
    
    // Fonction pour ajouter des fichiers
    const addFiles = (newFiles) => {
        const filesToAdd = Array.from(newFiles);
        
        // Vérifier la limite
        if (state.files.length + filesToAdd.length > state.maxFiles) {
            alert(`Maximum ${state.maxFiles} fichiers autorisés`);
            return;
        }
        
        // Ajouter les fichiers
        state.files = [...state.files, ...filesToAdd];
        displayFiles();
        
        // Callback
        if (options.onDrop) {
            options.onDrop(filesToAdd);
        }
    };
    
    // Event listeners
    dropArea.onclick = () => fileInput.click();
    
    fileInput.onchange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
            fileInput.value = ''; // Reset pour permettre le même fichier
        }
    };
    
    // Drag & Drop
    dropArea.ondragover = (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    };
    
    dropArea.ondragleave = () => {
        dropArea.classList.remove('dragover');
    };
    
    dropArea.ondrop = (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    };
    
    // API publique
    return {
        getFiles: () => state.files,
        
        clear: () => {
            state.files = [];
            displayFiles();
        },
        
        destroy: () => {
            container.innerHTML = '';
        }
    };
}

// ========================================
// EXPORT
// ========================================

export default {
    Button,
    createImportDropzone
};