// Configuração do Firebase (mesma do script principal)
const firebaseConfig = {
  apiKey: "AIzaSyAn5SPhZJPqR6IdQecnFnMwLdDm3efy4ko",
  authDomain: "hellen-moda-fitnes.firebaseapp.com",
  projectId: "hellen-moda-fitnes",
  storageBucket: "hellen-moda-fitnes.firebasestorage.app",
  messagingSenderId: "998940228851",
  appId: "1:998940228851:web:d4e8d3ac366c26fe9e4b86"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Variáveis globais
let currentUser = null;
let products = [];
let editingProductId = null;

// Elementos DOM
const loginScreen = document.getElementById('login-screen');
const adminPanel = document.getElementById('admin-panel');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const productsList = document.getElementById('products-list');
const addProductBtn = document.getElementById('add-product-btn');
const productModal = document.getElementById('product-modal');
const closeProductModal = document.getElementById('close-product-modal');
const productForm = document.getElementById('product-form');
const productModalTitle = document.getElementById('product-modal-title');
const productIdInput = document.getElementById('product-id');
const productNameInput = document.getElementById('product-name');
const productPriceInput = document.getElementById('product-price');
const productCategoryInput = document.getElementById('product-category');
const imageInputsContainer = document.getElementById('image-inputs');
const addImageBtn = document.getElementById('add-image-btn');
const colorInputsContainer = document.getElementById('color-inputs');
const addColorBtn = document.getElementById('add-color-btn');
const saveProductBtn = document.getElementById('save-product-btn');
const inventoryTable = document.getElementById('inventory-table').querySelector('tbody');
const whatsappForm = document.getElementById('whatsapp-form');
const whatsappNumberInput = document.getElementById('whatsapp-number');
const whatsappStatus = document.getElementById('whatsapp-status');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    setupEventListeners();
    loadWhatsappNumber();
});

// Configurar autenticação
function initAuth() {
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            // Usuário logado
            loginScreen.style.display = 'none';
            adminPanel.style.display = 'block';
            loadProducts();
            loadInventory();
        } else {
            // Usuário não logado
            loginScreen.style.display = 'flex';
            adminPanel.style.display = 'none';
        }
    });
}

// Configurar event listeners
function setupEventListeners() {
    // Login
    loginForm.addEventListener('submit', handleLogin);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Abas
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Produtos
    addProductBtn.addEventListener('click', () => openProductModal());
    closeProductModal.addEventListener('click', () => productModal.classList.remove('active'));
    
    // Formulário de produto
    productForm.addEventListener('submit', handleProductSave);
    addImageBtn.addEventListener('click', addImageInput);
    addColorBtn.addEventListener('click', addColorInput);
    
    // Configurações do WhatsApp
    whatsappForm.addEventListener('submit', saveWhatsappNumber);
}

// Manipular login
function handleLogin(e) {
    e.preventDefault();
    
    const email = loginEmail.value;
    const password = loginPassword.value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Login bem-sucedido - a mudança de estado será tratada no onAuthStateChanged
            loginError.textContent = '';
            loginForm.reset();
        })
        .catch(error => {
            loginError.textContent = 'Erro no login: ' + error.message;
        });
}

// Manipular logout
function handleLogout() {
    auth.signOut()
        .then(() => {
            // Logout bem-sucedido - a mudança de estado será tratada no onAuthStateChanged
        })
        .catch(error => {
            console.error('Erro no logout:', error);
        });
}

// Alternar entre abas
function switchTab(tabId) {
    // Remover classe active de todas as abas e conteúdos
    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Adicionar classe active à aba selecionada
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}-tab`).classList.add('active');
}

// Carregar produtos
function loadProducts() {
    db.collection('products').onSnapshot(snapshot => {
        products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        displayProducts();
    }, error => {
        console.error('Erro ao carregar produtos:', error);
    });
}

// Exibir produtos
function displayProducts() {
    productsList.innerHTML = '';
    
    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'placeholder.jpg';
        
        productItem.innerHTML = `
            <img src="${mainImage}" alt="${product.name}" class="product-image">
            <h3>${product.name}</h3>
            <p>Preço: R$ ${product.price.toFixed(2)}</p>
            <p>Categoria: ${product.category}</p>
            <p>Cores: ${product.colors ? product.colors.length : 0}</p>
            <div class="product-actions">
                <button class="edit-btn" data-product-id="${product.id}">Editar</button>
                <button class="delete-btn" data-product-id="${product.id}">Excluir</button>
            </div>
        `;
        
        productsList.appendChild(productItem);
    });
    
    // Adicionar event listeners para os botões
    const editButtons = productsList.querySelectorAll('.edit-btn');
    const deleteButtons = productsList.querySelectorAll('.delete-btn');
    
    editButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-product-id');
            openProductModal(productId);
        });
    });
    
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.getAttribute('data-product-id');
            deleteProduct(productId);
        });
    });
}

// Abrir modal de produto (para adicionar ou editar)
function openProductModal(productId = null) {
    editingProductId = productId;
    
    // Limpar formulário
    productForm.reset();
    imageInputsContainer.innerHTML = '<input type="url" class="image-url" placeholder="URL da imagem 1">';
    colorInputsContainer.innerHTML = `
        <div class="color-input">
            <input type="text" class="color-name" placeholder="Nome da cor">
            <input type="color" class="color-code" value="#c8499f">
            <input type="number" class="color-stock" placeholder="Estoque" min="0">
            <button type="button" class="remove-color-btn">✕</button>
        </div>
    `;
    
    // Adicionar event listeners para remover cores
    addRemoveColorListeners();
    
    if (productId) {
        // Modo edição
        productModalTitle.textContent = 'Editar Produto';
        const product = products.find(p => p.id === productId);
        
        if (product) {
            productIdInput.value = product.id;
            productNameInput.value = product.name;
            productPriceInput.value = product.price;
            productCategoryInput.value = product.category;
            
            // Preencher imagens
            imageInputsContainer.innerHTML = '';
            if (product.images && product.images.length > 0) {
                product.images.forEach((image, index) => {
                    const input = document.createElement('input');
                    input.type = 'url';
                    input.className = 'image-url';
                    input.placeholder = `URL da imagem ${index + 1}`;
                    input.value = image;
                    imageInputsContainer.appendChild(input);
                });
            } else {
                imageInputsContainer.innerHTML = '<input type="url" class="image-url" placeholder="URL da imagem 1">';
            }
            
            // Preencher cores
            colorInputsContainer.innerHTML = '';
            if (product.colors && product.colors.length > 0) {
                product.colors.forEach((color, index) => {
                    const colorInput = document.createElement('div');
                    colorInput.className = 'color-input';
                    colorInput.innerHTML = `
                        <input type="text" class="color-name" placeholder="Nome da cor" value="${color.name}">
                        <input type="color" class="color-code" value="${color.code}">
                        <input type="number" class="color-stock" placeholder="Estoque" min="0" value="${color.stock}">
                        <button type="button" class="remove-color-btn">✕</button>
                    `;
                    colorInputsContainer.appendChild(colorInput);
                });
            } else {
                colorInputsContainer.innerHTML = `
                    <div class="color-input">
                        <input type="text" class="color-name" placeholder="Nome da cor">
                        <input type="color" class="color-code" value="#c8499f">
                        <input type="number" class="color-stock" placeholder="Estoque" min="0">
                        <button type="button" class="remove-color-btn">✕</button>
                    </div>
                `;
            }
            
            // Adicionar event listeners para remover cores
            addRemoveColorListeners();
        }
    } else {
        // Modo adição
        productModalTitle.textContent = 'Adicionar Produto';
        productIdInput.value = '';
    }
    
    productModal.classList.add('active');
}

// Adicionar input de imagem
function addImageInput() {
    const imageCount = imageInputsContainer.querySelectorAll('.image-url').length;
    if (imageCount >= 3) {
        alert('Máximo de 3 imagens permitidas!');
        return;
    }
    
    const input = document.createElement('input');
    input.type = 'url';
    input.className = 'image-url';
    input.placeholder = `URL da imagem ${imageCount + 1}`;
    imageInputsContainer.appendChild(input);
}

// Adicionar input de cor
function addColorInput() {
    const colorInput = document.createElement('div');
    colorInput.className = 'color-input';
    colorInput.innerHTML = `
        <input type="text" class="color-name" placeholder="Nome da cor">
        <input type="color" class="color-code" value="#c8499f">
        <input type="number" class="color-stock" placeholder="Estoque" min="0">
        <button type="button" class="remove-color-btn">✕</button>
    `;
    colorInputsContainer.appendChild(colorInput);
    
    // Adicionar event listener para o botão de remover
    const removeBtn = colorInput.querySelector('.remove-color-btn');
    removeBtn.addEventListener('click', () => {
        colorInput.remove();
    });
}

// Adicionar event listeners para remover cores
function addRemoveColorListeners() {
    const removeButtons = colorInputsContainer.querySelectorAll('.remove-color-btn');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (colorInputsContainer.querySelectorAll('.color-input').length > 1) {
                e.target.closest('.color-input').remove();
            } else {
                alert('Pelo menos uma cor é necessária!');
            }
        });
    });
}

// Salvar produto (adicionar ou editar)
function handleProductSave(e) {
    e.preventDefault();
    
    // Coletar dados do formulário
    const productData = {
        name: productNameInput.value,
        price: parseFloat(productPriceInput.value),
        category: productCategoryInput.value,
        images: [],
        colors: []
    };
    
    // Coletar imagens
    const imageInputs = imageInputsContainer.querySelectorAll('.image-url');
    imageInputs.forEach(input => {
        if (input.value.trim() !== '') {
            productData.images.push(input.value.trim());
        }
    });
    
    // Coletar cores
    const colorInputs = colorInputsContainer.querySelectorAll('.color-input');
    colorInputs.forEach(input => {
        const name = input.querySelector('.color-name').value.trim();
        const code = input.querySelector('.color-code').value;
        const stock = parseInt(input.querySelector('.color-stock').value) || 0;
        
        if (name !== '') {
            productData.colors.push({
                name: name,
                code: code,
                stock: stock
            });
        }
    });
    
    // Validar dados
    if (productData.images.length === 0) {
        alert('Adicione pelo menos uma imagem!');
        return;
    }
    
    if (productData.colors.length === 0) {
        alert('Adicione pelo menos uma cor!');
        return;
    }
    
    // Salvar no Firestore
    if (editingProductId) {
        // Atualizar produto existente
        db.collection('products').doc(editingProductId).update(productData)
            .then(() => {
                alert('Produto atualizado com sucesso!');
                productModal.classList.remove('active');
            })
            .catch(error => {
                console.error('Erro ao atualizar produto:', error);
                alert('Erro ao atualizar produto. Tente novamente.');
            });
    } else {
        // Adicionar novo produto
        db.collection('products').add(productData)
            .then(() => {
                alert('Produto adicionado com sucesso!');
                productModal.classList.remove('active');
                productForm.reset();
            })
            .catch(error => {
                console.error('Erro ao adicionar produto:', error);
                alert('Erro ao adicionar produto. Tente novamente.');
            });
    }
}

// Excluir produto
function deleteProduct(productId) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        db.collection('products').doc(productId).delete()
            .then(() => {
                alert('Produto excluído com sucesso!');
            })
            .catch(error => {
                console.error('Erro ao excluir produto:', error);
                alert('Erro ao excluir produto. Tente novamente.');
            });
    }
}

// Carregar e exibir estoque
function loadInventory() {
    db.collection('products').onSnapshot(snapshot => {
        inventoryTable.innerHTML = '';
        
        snapshot.forEach(doc => {
            const product = { id: doc.id, ...doc.data() };
            
            if (product.colors) {
                product.colors.forEach((color, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${product.name}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <div style="width: 20px; height: 20px; background-color: ${color.code}; border-radius: 50%; border: 1px solid #ddd;"></div>
                                ${color.name}
                            </div>
                        </td>
                        <td>
                            <input type="number" class="stock-input" value="${color.stock}" data-product-id="${product.id}" data-color-index="${index}">
                            <button class="save-stock-btn" data-product-id="${product.id}" data-color-index="${index}">Salvar</button>
                        </td>
                        <td>
                            <button class="delete-product-btn" data-product-id="${product.id}">Excluir Produto</button>
                        </td>
                    `;
                    inventoryTable.appendChild(row);
                });
            }
        });
        
        // Adicionar event listeners para salvar estoque
        const saveButtons = inventoryTable.querySelectorAll('.save-stock-btn');
        saveButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-product-id');
                const colorIndex = parseInt(e.target.getAttribute('data-color-index'));
                const stockInput = e.target.previousElementSibling;
                const newStock = parseInt(stockInput.value) || 0;
                
                updateStock(productId, colorIndex, newStock);
            });
        });
        
        // Adicionar event listeners para excluir produtos
        const deleteButtons = inventoryTable.querySelectorAll('.delete-product-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.getAttribute('data-product-id');
                deleteProduct(productId);
            });
        });
    }, error => {
        console.error('Erro ao carregar estoque:', error);
    });
}

// Atualizar estoque
function updateStock(productId, colorIndex, newStock) {
    const productRef = db.collection('products').doc(productId);
    
    db.runTransaction(transaction => {
        return transaction.get(productRef).then(doc => {
            if (!doc.exists) {
                throw new Error('Produto não encontrado!');
            }
            
            const productData = doc.data();
            const updatedColors = [...productData.colors];
            updatedColors[colorIndex].stock = newStock;
            
            transaction.update(productRef, { colors: updatedColors });
        });
    }).then(() => {
        alert('Estoque atualizado com sucesso!');
    }).catch(error => {
        console.error('Erro ao atualizar estoque:', error);
        alert('Erro ao atualizar estoque. Tente novamente.');
    });
}

// Carregar número do WhatsApp
function loadWhatsappNumber() {
    db.collection('adminSettings').doc('whatsappNumber').get()
        .then(doc => {
            if (doc.exists) {
                whatsappNumberInput.value = doc.data().number || '';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar número do WhatsApp:', error);
        });
}

// Salvar número do WhatsApp
function saveWhatsappNumber(e) {
    e.preventDefault();
    
    const number = whatsappNumberInput.value.trim();
    
    db.collection('adminSettings').doc('whatsappNumber').set({
        number: number
    })
    .then(() => {
        whatsappStatus.textContent = 'Número salvo com sucesso!';
        whatsappStatus.className = 'success';
        
        setTimeout(() => {
            whatsappStatus.textContent = '';
            whatsappStatus.className = '';
        }, 3000);
    })
    .catch(error => {
        console.error('Erro ao salvar número do WhatsApp:', error);
        whatsappStatus.textContent = 'Erro ao salvar número. Tente novamente.';
        whatsappStatus.className = 'error';
    });
}
