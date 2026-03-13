const API_KEY = "APIKEY";

let conversations = JSON.parse(localStorage.getItem("all_chats")) || {};
let currentChatId = localStorage.getItem("current_chat_id");

// --- INITIALISATION ---
function init() {
    try {
        const keys = Object.keys(conversations);
        if (keys.length === 0 || !currentChatId || !conversations[currentChatId]) {
            createNewChat();
        } else {
            renderSidebar();
            renderMessages();
        }
    } catch (e) {
        console.error("Erreur init:", e);
        createNewChat();
    }
}

function createNewChat() {
    const id = "chat_" + Date.now();
    conversations[id] = {
        title: "Nouvelle discussion",
        messages: [],
        icon: "fa-comment-dots", // Icône par défaut
        pinned: false,           // Non épinglé par défaut
        order: Date.now()        // Ordre par défaut basé sur le temps
    };
    currentChatId = id;
    save();
    renderSidebar();
    renderMessages();
}

function save() {
    localStorage.setItem("all_chats", JSON.stringify(conversations));
    localStorage.setItem("current_chat_id", currentChatId);
}

// --- GESTION DES FICHIERS ---
document.getElementById("file-input").onchange = function() {
    const preview = document.getElementById("preview-container");
    preview.innerHTML = ""; 
    
    Array.from(this.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const container = document.createElement("div");
            container.className = "preview-thumb";
            if (file.type.startsWith("image/")) {
                container.innerHTML = `<img src="${e.target.result}">`;
            } else {
                container.classList.add("doc-preview");
                container.innerHTML = `<i class="fas fa-file-alt"></i><span class="doc-name">${file.name}</span>`;
            }
            preview.appendChild(container);
        };
        reader.readAsDataURL(file);
    });
};

// --- ENVOI ET APPEL API ---
async function sendMessage() {
    const input = document.getElementById("prompt-input");
    const fileInput = document.getElementById("file-input");
    const chatBox = document.getElementById("chat-box");
    const selectedModel = document.getElementById("model-select").value;
    
    const text = input.value.trim();
    if (!text && fileInput.files.length === 0) return;

    // Ajouter le message utilisateur à l'interface
    let userParts = [];
    if (text) userParts.push({ text: text });
    
    for (let file of fileInput.files) {
        const base64 = await toBase64(file);
        userParts.push({ inline_data: { mime_type: file.type, data: base64.split(",")[1] } });
    }

    conversations[currentChatId].messages.push({ role: "user", parts: userParts });
    
    // Titre automatique au premier message
    if (conversations[currentChatId].title === "Nouvelle discussion" && text) {
        conversations[currentChatId].title = text.substring(0, 30);
    }

    // Reset UI
    input.value = "";
    fileInput.value = "";
    document.getElementById("preview-container").innerHTML = ""; 
    renderMessages();
    save();

    // Loader
    const loader = document.createElement("div");
    loader.className = "model-message";
    loader.innerHTML = `<i>Appel à ${selectedModel}...</i>`;
    chatBox.appendChild(loader);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // LIMITATION DE L'HISTORIQUE : On n'envoie que les 8 derniers messages pour économiser le quota
        const historyLimit = conversations[currentChatId].messages.slice(-8);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: historyLimit })
        });

        const data = await response.json();
        loader.remove();

        if (data.error) {
            if (data.error.code === 429) {
                throw new Error("Quota épuisé sur ce modèle. Change de modèle dans la barre latérale !");
            }
            throw new Error(data.error.message);
        }

        if (data.candidates && data.candidates[0].content) {
            conversations[currentChatId].messages.push(data.candidates[0].content);
            save();
            renderMessages();
            renderSidebar();
        }

    } catch (e) {
        loader.remove();
        const errorDiv = document.createElement("div");
        errorDiv.className = "model-message";
        errorDiv.style.border = "1px solid red";
        errorDiv.innerHTML = `<b style="color:red">Erreur :</b> ${e.message}`;
        chatBox.appendChild(errorDiv);
    }
}

// --- FONCTION DE RENOMMAGE ---
function renameCurrentChat() {
    const chat = conversations[currentChatId];
    if (!chat) return;

    const oldTitle = chat.title;
    const newTitle = prompt("Nouveau nom de la discussion :", oldTitle);
    
    if (newTitle && newTitle.trim() !== "") {
        conversations[currentChatId].title = newTitle.trim();
        save();
        renderSidebar(); 
        document.getElementById("current-chat-title").innerText = newTitle.trim();
    }
}

// --- RENDU DES MESSAGES ---
function renderMessages() {
    const box = document.getElementById("chat-box");
    const titleDisplay = document.getElementById("current-chat-title");
    
    box.innerHTML = "";
    const chat = conversations[currentChatId];
    if(!chat) return;

    // Mise à jour du titre dans le header
    titleDisplay.innerText = chat.title;

    chat.messages.forEach(m => {
        const div = document.createElement("div");
        div.className = m.role === "user" ? "user-message" : "model-message";
        
        m.parts.forEach(p => {
            if (p.text) {
                const textEl = document.createElement("p");
                textEl.innerHTML = p.text.replace(/\n/g, "<br>");
                div.appendChild(textEl);
            }
            if (p.inline_data) {
                const img = document.createElement("img");
                img.src = `data:${p.inline_data.mime_type};base64,${p.inline_data.data}`;
                img.className = "chat-img";
                div.appendChild(img);
            }
        });
        box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
}


// =====================================================================
// NOUVELLES FONCTIONNALITÉS : ÉPINGLES, ICÔNES ET DRAG & DROP
// =====================================================================

// --- FONCTION ÉPINGLER ---
function togglePin(id, event) {
    event.stopPropagation();
    conversations[id].pinned = !conversations[id].pinned;
    save();
    renderSidebar();
}

// --- FONCTION CHANGER ICÔNE ---
function changeIcon(id, event) {
    event.stopPropagation();
    const icons = ["fa-comment-dots", "fa-code", "fa-book", "fa-lightbulb", "fa-rocket", "fa-user", "fa-robot"];
    const currentIdx = icons.indexOf(conversations[id].icon || "fa-comment-dots");
    const nextIdx = (currentIdx + 1) % icons.length;
    conversations[id].icon = icons[nextIdx];
    save();
    renderSidebar();
}

// --- LOGIQUE DE TRI ---
function getSortedChatIds() {
    return Object.keys(conversations).sort((a, b) => {
        const chatA = conversations[a];
        const chatB = conversations[b];

        // 1. Les épinglés en priorité absolue (en haut)
        if (chatA.pinned !== chatB.pinned) {
            return chatA.pinned ? -1 : 1; 
        }

        // 2. Ordre manuel (si l'utilisateur a fait un drag & drop)
        if (chatA.order !== undefined && chatB.order !== undefined) {
            return chatA.order - chatB.order;
        }

        // 3. Par défaut : les plus récents en premier
        return b.split('_')[1] - a.split('_')[1];
    });
}

// --- LOGIQUE DU GLISSER-DÉPOSER ---
function reorderChats(draggedId, targetId) {
    let sortedKeys = getSortedChatIds();
    const fromIndex = sortedKeys.indexOf(draggedId);
    const toIndex = sortedKeys.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    // Retire l'élément de son ancienne position et l'insère à la nouvelle
    sortedKeys.splice(fromIndex, 1);
    sortedKeys.splice(toIndex, 0, draggedId);

    // L'élément glissé hérite de l'état "épinglé" de la cible (pour l'auto-épinglage)
    conversations[draggedId].pinned = conversations[targetId].pinned;

    // Enregistre le nouvel ordre
    sortedKeys.forEach((id, index) => {
        conversations[id].order = index;
    });

    save();
    renderSidebar();
}

// --- RENDU DE LA SIDEBAR (Avec Drag & Drop, Épingles et Icônes) ---
function renderSidebar() {
    const list = document.getElementById("conversations-list");
    if (!list) return;
    list.innerHTML = "";

    const sortedKeys = getSortedChatIds();

    sortedKeys.forEach(id => {
        const chat = conversations[id];
        const item = document.createElement("div");
        
        item.className = `chat-item ${id === currentChatId ? 'active' : ''} ${chat.pinned ? 'pinned' : ''}`;
        item.draggable = true; 
        item.dataset.id = id;  
        
        item.innerHTML = `
            <i class="fas ${chat.icon || 'fa-comment-dots'} chat-icon-btn" title="Changer l'icône"></i>
            <span class="chat-item-title">${chat.title}</span>
            <i class="fas fa-thumbtack pin-btn" title="Épingler"></i>
        `;

        // Événements de clics
        item.onclick = () => { currentChatId = id; save(); renderSidebar(); renderMessages(); };
        item.querySelector(".chat-icon-btn").onclick = (e) => changeIcon(id, e);
        item.querySelector(".pin-btn").onclick = (e) => togglePin(id, e);

        // Événements Drag & Drop
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', id);
            setTimeout(() => this.classList.add('dragging'), 0);
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault(); 
        });

        item.addEventListener('dragenter', function(e) {
            e.preventDefault();
            this.classList.add('drag-over'); 
        });

        item.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });

        item.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            const draggedId = e.dataTransfer.getData('text/plain');
            if (draggedId !== id) {
                reorderChats(draggedId, id);
            }
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('drag-over'));
        });

        list.appendChild(item);
    });
}

// =====================================================================
// HELPERS & EVENTS GLOBAUX
// =====================================================================

async function toBase64(file) {
    return new Promise((r, j) => {
        const rd = new FileReader(); rd.readAsDataURL(file);
        rd.onload = () => r(rd.result); rd.onerror = j;
    });
}

// Events
document.getElementById("submit-btn").onclick = sendMessage;
document.getElementById("new-chat-btn").onclick = createNewChat;
document.getElementById("delete-chat-btn").onclick = () => {
    if (confirm("Supprimer cette discussion ?")) {
        delete conversations[currentChatId];
        const keys = Object.keys(conversations);
        if (keys.length === 0) createNewChat();
        else { 
            // Prendre le premier élément selon le tri actuel
            const sortedKeys = getSortedChatIds();
            currentChatId = sortedKeys[0]; 
            save(); 
            renderSidebar(); 
            renderMessages(); 
        }
    }
};

document.getElementById("prompt-input").onkeydown = (e) => { 
    if(e.key === "Enter" && !e.shiftKey) { 
        e.preventDefault(); 
        sendMessage(); 
    }
};

document.getElementById("current-chat-title").onclick = renameCurrentChat;

// Lancement de l'application

init();
