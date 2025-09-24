// Configuração do Firebase
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
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'all';
let currentProductImages = [];
let currentImageIndex = 0;

// Elementos DOM
const productsGrid = document.getElementById('products-grid');
const sideMenu = document.getElementById('side-menu');
const menuBtn = document.getElementById('menu-btn');
const closeMenuBtn = document.getElementById('close-menu');
const categoryLinks = document.querySelectorAll('.menu-items a');
const homeBtn = document.getElementById('home-btn');
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const closeCartModal = document.getElementById('close-cart-modal');
const cartItems = document.getElementById('cart-items');
const cartTotalValue = document.getElementById('cart-total-value');
const checkoutBtn = document.getElementById('checkout-btn');
const floatingCheckoutBtn = document.getElementById('floating-checkout-btn');
const floatingCartCount = document.getElementById('floating-cart-count');
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutModal = document.getElementById('close-checkout-modal');
const checkoutForm = document.getElementById('checkout-form');
const orderItemsList = document.getElementById('order-items-list');
const orderTotalValue = document.getElementById('order-total-value');
const productModal = document.getElementById('product-modal');
const closeProductModal = document.getElementById('close-product-modal');
const productDetails = document.getElementById('product-details');
const adminLink = document.getElementById('admin-link');
const modalOverlay = document.getElementById('modal-overlay');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
    loadProducts();
    setupEventListeners();
    updateCartUI();
});

// Configurar autenticação
function initAuth() {
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            adminLink.style.display = 'block';
        } else {
            adminLink.style.display = 'none';
        }
    });
}

// Carregar produtos do Firestore
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

// Exibir produtos na grade
function displayProducts() {
    productsGrid.innerHTML = '';
    
    const filteredProducts = currentCategory === 'all' 
        ? products 
        : products.filter(product => product.category === currentCategory);
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">Nenhum produto encontrado nesta categoria.</p>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Criar card de produto
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/300x300?text=Produto+Sem+Imagem';
    
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${mainImage}" alt="${product.name}" class="product-image" data-product-id="${product.id}">
        </div>
        <div class="product-thumbnails">
            ${product.images && product.images.slice(0, 3).map((img, index) => 
                `<img src="${img}" class="thumbnail ${index === 0 ? 'active' : ''}" 
                      data-product-id="${product.id}" data-image-index="${index}">`
            ).join('')}
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-price">R$ ${product.price.toFixed(2)}</p>
            <button class="buy-btn" data-product-id="${product.id}">Comprar</button>
        </div>
    `;
    
    return card;
}

// Configurar event listeners
function setupEventListeners() {
    // Menu lateral
    menuBtn.addEventListener('click', openSideMenu);
    closeMenuBtn.addEventListener('click', closeSideMenu);
    modalOverlay.addEventListener('click', closeAllModals);
    
    // Categorias
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = link.getAttribute('data-category');
            
            // Atualizar estado ativo do menu
            categoryLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            displayProducts();
            closeSideMenu();
        });
    });
    
    // Home
    homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentCategory = 'all';
        categoryLinks.forEach(l => l.classList.remove('active'));
        displayProducts();
    });
    
    // Carrinho
    cartBtn.addEventListener('click', openCartModal);
    closeCartModal.addEventListener('click', closeCartModalFunc);
    
    // Finalizar compra
    checkoutBtn.addEventListener('click', openCheckoutModal);
    floatingCheckoutBtn.addEventListener('click', openCheckoutModal);
    
    closeCheckoutModal.addEventListener('click', closeCheckoutModalFunc);
    
    // Formulário de finalização
    checkoutForm.addEventListener('submit', handleCheckout);
    
    // Modal de produto
    closeProductModal.addEventListener('click', closeProductModalFunc);
    
    // Delegação de eventos para produtos dinâmicos
    productsGrid.addEventListener('click', handleProductGridClick);
}

// Funções de abertura/fechamento de modais
function openSideMenu() {
    sideMenu.classList.add('active');
    modalOverlay.classList.add('active');
}

function closeSideMenu() {
    sideMenu.classList.remove('active');
    modalOverlay.classList.remove('active');
}

function openCartModal() {
    cartModal.classList.add('active');
    modalOverlay.classList.add('active');
}

function closeCartModalFunc() {
    cartModal.classList.remove('active');
    modalOverlay.classList.remove('active');
}

function openCheckoutModal() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems < 10) {
        alert('Pedido mínimo de 10 peças!');
        return;
    }
    
    updateOrderSummary();
    checkoutModal.classList.add('active');
    modalOverlay.classList.add('active');
}

function closeCheckoutModalFunc() {
    checkoutModal.classList.remove('active');
    modalOverlay.classList.remove('active');
}

function closeProductModalFunc() {
    productModal.classList.remove('active');
    modalOverlay.classList.remove('active');
}

function closeAllModals() {
    sideMenu.classList.remove('active');
    cartModal.classList.remove('active');
    checkoutModal.classList.remove('active');
    productModal.classList.remove('active');
    modalOverlay.classList.remove('active');
}

// Manipular cliques na grade de produtos
function handleProductGridClick(e) {
    const target = e.target;
    
    if (target.classList.contains('product-image') || 
        target.classList.contains('thumbnail') ||
        target.classList.contains('buy-btn')) {
        
        const productId = target.getAttribute('data-product-id');
        if (productId) {
            openProductModal(productId);
        }
    }
}

// Abrir modal do produto
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    currentProductImages = product.images || [];
    currentImageIndex = 0;
    
    productDetails.innerHTML = `
        <div class="product-images">
            <div class="main-image-container">
                <img src="${currentProductImages[0]}" alt="${product.name}" class="main-image" id="main-product-image">
            </div>
            <div class="thumbnails-container">
                ${currentProductImages.map((img, index) => 
                    `<img src="${img}" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">`
                ).join('')}
            </div>
        </div>
        <div class="product-info-details">
            <h2>${product.name}</h2>
            <p class="product-price-details">R$ ${product.price.toFixed(2)}</p>
            
            <div class="color-options">
                <h3>Escolha a cor e quantidade:</h3>
                ${product.colors && product.colors.length > 0 ? 
                    product.colors.map((color, index) => `
                        <div class="color-option">
                            <div class="color-swatch" style="background-color: ${color.code}"></div>
                            <div class="color-info">
                                <div class="color-name">${color.name}</div>
                                <div class="color-stock">Estoque: ${color.stock} unidades</div>
                            </div>
                            <input type="number" class="quantity-input" min="0" max="${color.stock}" 
                                   data-color-index="${index}" placeholder="0" value="0">
                        </div>
                    `).join('') : 
                    '<p>Nenhuma cor disponível no momento.</p>'
                }
            </div>
            
            <button class="add-to-cart-btn" data-product-id="${product.id}">
                Adicionar ao Carrinho
            </button>
        </div>
    `;
    
    // Event listeners para as miniaturas
    const thumbnails = productDetails.querySelectorAll('.thumbnail');
    const mainImage = productDetails.getElementById('main-product-image');
    
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const index = parseInt(thumb.getAttribute('data-index'));
            currentImageIndex = index;
            mainImage.src = currentProductImages[index];
            
            // Atualizar estado ativo
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });
    
    // Event listener para o botão de adicionar ao carrinho
    const addToCartBtn = productDetails.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', () => {
        addToCart(product);
    });
    
    // Permitir navegação por swipe (para mobile)
    let touchStartX = 0;
    let touchEndX = 0;
    
    const mainImageContainer = productDetails.querySelector('.main-image-container');
    mainImageContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    mainImageContainer.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        if (touchEndX < touchStartX - 50) {
            // Swipe left - próxima imagem
            nextImage();
        } else if (touchEndX > touchStartX + 50) {
            // Swipe right - imagem anterior
            prevImage();
        }
    }
    
    function nextImage() {
        if (currentProductImages.length > 1) {
            currentImageIndex = (currentImageIndex + 1) % currentProductImages.length;
            updateMainImage();
        }
    }
    
    function prevImage() {
        if (currentProductImages.length > 1) {
            currentImageIndex = (currentImageIndex - 1 + currentProductImages.length) % currentProductImages.length;
            updateMainImage();
        }
    }
    
    function updateMainImage() {
        mainImage.src = currentProductImages[currentImageIndex];
        thumbnails.forEach((t, i) => {
            t.classList.toggle('active', i === currentImageIndex);
        });
    }
    
    productModal.classList.add('active');
    modalOverlay.classList.add('active');
}

// Adicionar produto ao carrinho
function addToCart(product) {
    const quantityInputs = productDetails.querySelectorAll('.quantity-input');
    let hasItems = false;
    let itemsAdded = 0;
    
    quantityInputs.forEach(input => {
        const quantity = parseInt(input.value) || 0;
        if (quantity > 0) {
            const colorIndex = parseInt(input.getAttribute('data-color-index'));
            const color = product.colors[colorIndex];
            
            if (quantity > color.stock) {
                alert(`Quantidade solicitada para ${color.name} excede o estoque disponível!`);
                return;
            }
            
            // Verificar se o item já está no carrinho
            const existingItemIndex = cart.findIndex(item => 
                item.productId === product.id && item.colorIndex === colorIndex
            );
            
            if (existingItemIndex !== -1) {
                cart[existingItemIndex].quantity += quantity;
            } else {
                cart.push({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    colorIndex: colorIndex,
                    colorName: color.name,
                    colorCode: color.code,
                    quantity: quantity,
                    image: product.images[0]
                });
            }
            
            hasItems = true;
            itemsAdded += quantity;
            
            // Redução temporária do estoque
            updateTemporaryStock(product.id, colorIndex, quantity, 'decrease');
        }
    });
    
    if (hasItems) {
        saveCart();
        updateCartUI();
        alert(`${itemsAdded} peça(s) adicionada(s) ao carrinho!`);
        closeProductModalFunc();
    } else {
        alert('Selecione pelo menos uma cor e quantidade!');
    }
}

// Atualizar estoque temporário no Firestore
function updateTemporaryStock(productId, colorIndex, quantity, operation) {
    const productRef = db.collection('products').doc(productId);
    
    db.runTransaction(transaction => {
        return transaction.get(productRef).then(doc => {
            if (!doc.exists) {
                throw new Error('Produto não encontrado!');
            }
            
            const productData = doc.data();
            const updatedColors = [...productData.colors];
            
            if (operation === 'decrease') {
                updatedColors[colorIndex].stock -= quantity;
                if (updatedColors[colorIndex].stock < 0) {
                    updatedColors[colorIndex].stock = 0;
                }
            } else if (operation === 'increase') {
                updatedColors[colorIndex].stock += quantity;
            }
            
            transaction.update(productRef, { colors: updatedColors });
        });
    }).catch(error => {
        console.error('Erro ao atualizar estoque temporário:', error);
    });
}

// Salvar carrinho no localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Atualizar UI do carrinho
function updateCartUI() {
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
        cartTotalValue.textContent = '0,00';
        floatingCheckoutBtn.classList.remove('visible');
        return;
    }
    
    floatingCheckoutBtn.classList.add('visible');
    
    let total = 0;
    let totalItems = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalItems += item.quantity;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-color">Cor: ${item.colorName}</div>
                <div class="cart-item-price">R$ ${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-actions">
                <div class="quantity-controls">
                    <button class="quantity-btn decrease" data-index="${index}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn increase" data-index="${index}">+</button>
                </div>
                <button class="remove-item" data-index="${index}">✕</button>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    cartTotalValue.textContent = total.toFixed(2);
    floatingCartCount.textContent = totalItems;
    
    // Adicionar event listeners para os controles de quantidade
    const decreaseButtons = cartItems.querySelectorAll('.decrease');
    const increaseButtons = cartItems.querySelectorAll('.increase');
    const removeButtons = cartItems.querySelectorAll('.remove-item');
    
    decreaseButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            updateCartItemQuantity(index, -1);
        });
    });
    
    increaseButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            updateCartItemQuantity(index, 1);
        });
    });
    
    removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            removeFromCart(index);
        });
    });
}

// Atualizar quantidade do item no carrinho
function updateCartItemQuantity(index, change) {
    const item = cart[index];
    const product = products.find(p => p.id === item.productId);
    
    if (!product) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    const colorStock = product.colors[item.colorIndex].stock;
    
    if (newQuantity > colorStock + (change > 0 ? 0 : item.quantity)) {
        alert('Quantidade solicitada excede o estoque disponível!');
        return;
    }
    
    // Atualizar estoque temporário
    updateTemporaryStock(item.productId, item.colorIndex, Math.abs(change), change > 0 ? 'decrease' : 'increase');
    
    item.quantity = newQuantity;
    saveCart();
    updateCartUI();
}

// Remover item do carrinho
function removeFromCart(index) {
    const item = cart[index];
    
    // Restaurar estoque temporário
    updateTemporaryStock(item.productId, item.colorIndex, item.quantity, 'increase');
    
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

// Atualizar resumo do pedido
function updateOrderSummary() {
    orderItemsList.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <span>${item.name} - ${item.colorName} (${item.quantity}x)</span>
            <span>R$ ${itemTotal.toFixed(2)}</span>
        `;
        orderItemsList.appendChild(orderItem);
    });
    
    orderTotalValue.textContent = total.toFixed(2);
}

// Processar finalização de compra
function handleCheckout(e) {
    e.preventDefault();
    
    const formData = new FormData(checkoutForm);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    if (totalItems < 10) {
        alert('Pedido mínimo de 10 peças!');
        return;
    }
    
    const orderData = {
        name: formData.get('name'),
        cep: formData.get('cep'),
        address: formData.get('address'),
        delivery: formData.get('delivery'),
        phone: formData.get('phone'),
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString(),
        status: 'pendente'
    };
    
    // Salvar pedido no Firestore
    db.collection('orders').add(orderData)
        .then(docRef => {
            console.log('Pedido salvo com ID: ', docRef.id);
            
            // Enviar pedido via WhatsApp
            sendWhatsAppOrder(orderData);
            
            // Limpar carrinho (estoque já foi reduzido permanentemente)
            cart = [];
            saveCart();
            updateCartUI();
            
            // Fechar modais
            closeCheckoutModalFunc();
            checkoutForm.reset();
        })
        .catch(error => {
            console.error('Erro ao salvar pedido:', error);
            alert('Erro ao processar pedido. Tente novamente.');
        });
}

// Enviar pedido via WhatsApp
function sendWhatsAppOrder(orderData) {
    // Buscar número do WhatsApp do admin
    db.collection('adminSettings').doc('whatsappNumber').get()
        .then(doc => {
            let whatsappNumber = '55997720832'; // Número padrão
            
            if (doc.exists) {
                whatsappNumber = doc.data().number || whatsappNumber;
            }
            
            // Formatar mensagem
            let message = `*NOVO PEDIDO - HELLEN MODA FITNESS*%0A%0A`;
            message += `*Cliente:* ${orderData.name}%0A`;
            message += `*Telefone:* ${orderData.phone}%0A`;
            message += `*CEP:* ${orderData.cep}%0A`;
            message += `*Endereço:* ${orderData.address}%0A`;
            message += `*Tipo de Entrega:* ${orderData.delivery}%0A%0A`;
            message += `*ITENS DO PEDIDO:*%0A`;
            
            orderData.items.forEach(item => {
                message += `• ${item.quantity}x ${item.name} - ${item.colorName}%0A`;
                message += `  R$ ${item.price.toFixed(2)} cada = R$ ${(item.price * item.quantity).toFixed(2)}%0A`;
            });
            
            message += `%0A*TOTAL: R$ ${orderData.total.toFixed(2)}*%0A`;
            message += `*Forma de pagamento:* PIX%0A`;
            message += `*Data:* ${new Date().toLocaleString('pt-BR')}%0A`;
            message += `*Pedido Mínimo:* ✅ Atendido (${orderData.items.reduce((sum, item) => sum + item.quantity, 0)} peças)`;
            
            // Criar link do WhatsApp
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
            
            // Abrir WhatsApp em nova aba
            window.open(whatsappUrl, '_blank');
            
            alert('Pedido enviado com sucesso! Em breve entraremos em contato via WhatsApp.');
        })
        .catch(error => {
            console.error('Erro ao buscar número do WhatsApp:', error);
            // Usar número padrão em caso de erro
            const whatsappUrl = `https://wa.me/55997720832?text=Pedido%20Hellen%20Moda%20Fitness`;
            window.open(whatsappUrl, '_blank');
        });
}
