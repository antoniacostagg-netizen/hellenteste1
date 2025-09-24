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
    console.log('Iniciando aplicação...');
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
            console.log('Usuário logado:', user.email);
            adminLink.style.display = 'block';
        } else {
            console.log('Usuário não logado');
            adminLink.style.display = 'none';
        }
    });
}

// Carregar produtos do Firestore
function loadProducts() {
    console.log('Carregando produtos...');
    db.collection('products').onSnapshot(snapshot => {
        products = [];
        snapshot.forEach(doc => {
            const productData = doc.data();
            products.push({ 
                id: doc.id, 
                ...productData,
                // Garantir que arrays existam
                images: productData.images || [],
                colors: productData.colors || []
            });
        });
        console.log('Produtos carregados:', products.length);
        displayProducts();
    }, error => {
        console.error('Erro ao carregar produtos:', error);
    });
}

// Exibir produtos na grade
function displayProducts() {
    console.log('Exibindo produtos para categoria:', currentCategory);
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
    
    const mainImage = product.images && product.images.length > 0 
        ? product.images[0] 
        : 'https://via.placeholder.com/300x300/ffffff/c8499f?text=Sem+Imagem';
    
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${mainImage}" alt="${product.name}" class="product-image" data-product-id="${product.id}">
        </div>
        <div class="product-thumbnails">
            ${product.images.slice(0, 3).map((img, index) => 
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
    console.log('Configurando event listeners...');
    
    // Menu lateral
    menuBtn.addEventListener('click', openSideMenu);
    closeMenuBtn.addEventListener('click', closeSideMenu);
    modalOverlay.addEventListener('click', closeAllModals);
    
    // Categorias
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = link.getAttribute('data-category');
            console.log('Categoria selecionada:', currentCategory);
            
            displayProducts();
            closeSideMenu();
        });
    });
    
    // Home
    homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentCategory = 'all';
        console.log('Voltando para home');
        displayProducts();
    });
    
    // Carrinho
    cartBtn.addEventListener('click', openCartModal);
    closeCartModal.addEventListener('click', closeCartModal);
    
    // Finalizar compra
    checkoutBtn.addEventListener('click', openCheckoutModal);
    floatingCheckoutBtn.addEventListener('click', openCheckoutModal);
    
    closeCheckoutModal.addEventListener('click', closeCheckoutModal);
    
    // Formulário de finalização
    checkoutForm.addEventListener('submit', handleCheckout);
    
    // Modal de produto
    closeProductModal.addEventListener('click', closeProductModal);
    
    // Delegação de eventos para produtos dinâmicos
    productsGrid.addEventListener('click', handleProductGridClick);
    
    console.log('Event listeners configurados');
}

// Funções de abertura/fechamento de modais
function openSideMenu() {
    console.log('Abrindo menu lateral');
    sideMenu.classList.add('active');
    modalOverlay.classList.add('active');
}

function closeSideMenu() {
    console.log('Fechando menu lateral');
    sideMenu.classList.remove('active');
    modalOverlay.classList.remove('active');
}

function openCartModal() {
    console.log('Abrindo carrinho');
    cartModal.classList.add('active');
    modalOverlay.classList.add('active');
}

function closeCartModal() {
    console.log('Fechando carrinho');
    cartModal.classList.remove('active');
    modalOverlay.classList.remove('active');
}

function openCheckoutModal() {
    console.log('Abrindo checkout');
    
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

function closeCheckoutModal() {
    console.log('Fechando checkout');
    checkoutModal.classList.remove('active');
    modalOverlay.classList.remove('active');
}

function closeProductModal() {
    console.log('Fechando modal do produto');
    productModal.classList.remove('active');
    modalOverlay.classList.remove('active');
}

function closeAllModals() {
    console.log('Fechando todos os modais');
    sideMenu.classList.remove('active');
    cartModal.classList.remove('active');
    checkoutModal.classList.remove('active');
    productModal.classList.remove('active');
    modalOverlay.classList.remove('active');
}

// Manipular cliques na grade de produtos
function handleProductGridClick(e) {
    const target = e.target;
    console.log('Clique na grade:', target.className);
    
    if (target.classList.contains('product-image') || 
        target.classList.contains('thumbnail') ||
        target.classList.contains('buy-btn')) {
        
        const productId = target.getAttribute('data-product-id');
        console.log('Abrindo produto:', productId);
        
        if (productId) {
            openProductModal(productId);
        }
    }
}

// Abrir modal do produto
function openProductModal(productId) {
    console.log('Abrindo modal do produto:', productId);
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        console.error('Produto não encontrado:', productId);
        return;
    }
    
    console.log('Produto encontrado:', product.name);
    
    productDetails.innerHTML = `
        <div class="product-images">
            <div class="main-image-container">
                <img src="${product.images[0] || 'https://via.placeholder.com/400x400'}" 
                     alt="${product.name}" 
                     class="main-image" 
                     id="main-product-image">
            </div>
            <div class="thumbnails-container" id="thumbnails-container">
                ${product.images.map((img, index) => 
                    `<img src="${img}" 
                         class="thumbnail ${index === 0 ? 'active' : ''}" 
                         data-index="${index}"
                         alt="Miniatura ${index + 1}">`
                ).join('')}
            </div>
        </div>
        <div class="product-info-details">
            <h2>${product.name}</h2>
            <p class="product-price-details">R$ ${product.price.toFixed(2)}</p>
            
            <div class="color-options">
                <h3>Escolha a cor e quantidade:</h3>
                ${product.colors.length > 0 ? 
                    product.colors.map((color, index) => `
                        <div class="color-option">
                            <div class="color-swatch" style="background-color: ${color.code}"></div>
                            <div class="color-info">
                                <div class="color-name">${color.name}</div>
                                <div class="color-stock">Estoque: ${color.stock} unidades</div>
                            </div>
                            <input type="number" 
                                   class="quantity-input" 
                                   min="0" 
                                   max="${color.stock}" 
                                   data-color-index="${index}" 
                                   placeholder="0" 
                                   value="0">
                        </div>
                    `).join('') : 
                    '<p>Nenhuma cor disponível no momento.</p>'
                }
            </div>
            
            <button class="add-to-cart-btn" id="add-to-cart-btn" data-product-id="${product.id}">
                Adicionar ao Carrinho
            </button>
        </div>
    `;
    
    // Configurar eventos das miniaturas
    setupThumbnailEvents(product.images);
    
    // Configurar evento do botão adicionar ao carrinho
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    addToCartBtn.addEventListener('click', () => {
        console.log('Adicionando ao carrinho:', product.name);
        addToCart(product);
    });
    
    // Configurar swipe para mobile
    setupSwipeEvents(product.images);
    
    productModal.classList.add('active');
    modalOverlay.classList.add('active');
}

// Configurar eventos das miniaturas
function setupThumbnailEvents(images) {
    const thumbnails = document.querySelectorAll('.thumbnails-container .thumbnail');
    const mainImage = document.getElementById('main-product-image');
    
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const index = parseInt(thumb.getAttribute('data-index'));
            console.log('Mudando para imagem:', index);
            
            // Atualizar imagem principal
            mainImage.src = images[index];
            
            // Atualizar estado ativo
            thumbnails.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        });
    });
}

// Configurar eventos de swipe
function setupSwipeEvents(images) {
    const mainImageContainer = document.querySelector('.main-image-container');
    let touchStartX = 0;
    let currentImageIndex = 0;
    
    mainImageContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    mainImageContainer.addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > 50) { // Limite mínimo para considerar swipe
            if (diff > 0) {
                // Swipe left - próxima imagem
                currentImageIndex = (currentImageIndex + 1) % images.length;
            } else {
                // Swipe right - imagem anterior
                currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
            }
            
            updateMainImage(images, currentImageIndex);
        }
    });
}

// Atualizar imagem principal
function updateMainImage(images, index) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.querySelectorAll('.thumbnails-container .thumbnail');
    
    mainImage.src = images[index];
    
    // Atualizar miniaturas ativas
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

// Adicionar produto ao carrinho
function addToCart(product) {
    console.log('Processando adição ao carrinho para:', product.name);
    
    const quantityInputs = document.querySelectorAll('.quantity-input');
    let hasItems = false;
    let totalItems = 0;
    
    quantityInputs.forEach(input => {
        const quantity = parseInt(input.value) || 0;
        
        if (quantity > 0) {
            const colorIndex = parseInt(input.getAttribute('data-color-index'));
            const color = product.colors[colorIndex];
            
            console.log(`Cor: ${color.name}, Quantidade: ${quantity}`);
            
            if (quantity > color.stock) {
                alert(`❌ Quantidade solicitada para ${color.name} excede o estoque disponível!`);
                return;
            }
            
            // Verificar se o item já está no carrinho
            const existingItemIndex = cart.findIndex(item => 
                item.productId === product.id && item.colorIndex === colorIndex
            );
            
            if (existingItemIndex !== -1) {
                // Atualizar quantidade existente
                cart[existingItemIndex].quantity += quantity;
                console.log('Item existente atualizado');
            } else {
                // Adicionar novo item
                cart.push({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    colorIndex: colorIndex,
                    colorName: color.name,
                    colorCode: color.code,
                    quantity: quantity,
                    image: product.images[0] || 'https://via.placeholder.com/100x100'
                });
                console.log('Novo item adicionado');
            }
            
            hasItems = true;
            totalItems += quantity;
            
            // Redução temporária do estoque
            updateTemporaryStock(product.id, colorIndex, quantity, 'decrease');
        }
    });
    
    if (hasItems) {
        saveCart();
        updateCartUI();
        alert(`✅ ${totalItems} peça(s) adicionada(s) ao carrinho!`);
        closeProductModal();
    } else {
        alert('⚠️ Selecione pelo menos uma cor e quantidade!');
    }
}

// Atualizar estoque temporário no Firestore
function updateTemporaryStock(productId, colorIndex, quantity, operation) {
    console.log(`Atualizando estoque: ${operation} ${quantity} unidades`);
    
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
    }).then(() => {
        console.log('Estoque atualizado com sucesso');
    }).catch(error => {
        console.error('Erro ao atualizar estoque:', error);
    });
}

// Salvar carrinho no localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Carrinho salvo no localStorage');
}

// Atualizar UI do carrinho
function updateCartUI() {
    console.log('Atualizando UI do carrinho');
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
        cartTotalValue.textContent = '0,00';
        floatingCheckoutBtn.style.display = 'none';
        return;
    }
    
    floatingCheckoutBtn.style.display = 'flex';
    
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
                    <span class="item-quantity">${item.quantity}</span>
                    <button class="quantity-btn increase" data-index="${index}">+</button>
                </div>
                <button class="remove-item" data-index="${index}" title="Remover item">✕</button>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    // Atualizar totais
    cartTotalValue.textContent = total.toFixed(2);
    floatingCartCount.textContent = totalItems;
    
    // Adicionar event listeners aos botões do carrinho
    addCartEventListeners();
    
    console.log('Carrinho atualizado. Total de itens:', totalItems, 'Valor total: R$', total.toFixed(2));
}

// Adicionar event listeners aos itens do carrinho
function addCartEventListeners() {
    // Botões de diminuir quantidade
    document.querySelectorAll('.decrease').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.decrease').getAttribute('data-index'));
            updateCartItemQuantity(index, -1);
        });
    });
    
    // Botões de aumentar quantidade
    document.querySelectorAll('.increase').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.increase').getAttribute('data-index'));
            updateCartItemQuantity(index, 1);
        });
    });
    
    // Botões de remover item
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.remove-item').getAttribute('data-index'));
            removeFromCart(index);
        });
    });
}

// Atualizar quantidade do item no carrinho
function updateCartItemQuantity(index, change) {
    const item = cart[index];
    const product = products.find(p => p.id === item.productId);
    
    if (!product) {
        console.error('Produto não encontrado para atualização');
        return;
    }
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 1) {
        removeFromCart(index);
        return;
    }
    
    // Verificar estoque
    const color = product.colors[item.colorIndex];
    if (newQuantity > color.stock + (change > 0 ? 0 : item.quantity)) {
        alert('❌ Quantidade solicitada excede o estoque disponível!');
        return;
    }
    
    // Atualizar estoque temporário
    updateTemporaryStock(item.productId, item.colorIndex, Math.abs(change), change > 0 ? 'decrease' : 'increase');
    
    // Atualizar carrinho
    item.quantity = newQuantity;
    saveCart();
    updateCartUI();
}

// Remover item do carrinho
function removeFromCart(index) {
    const item = cart[index];
    console.log('Removendo item do carrinho:', item.name);
    
    if (confirm(`Tem certeza que deseja remover ${item.name} - ${item.colorName} do carrinho?`)) {
        // Restaurar estoque temporário
        updateTemporaryStock(item.productId, item.colorIndex, item.quantity, 'increase');
        
        // Remover do carrinho
        cart.splice(index, 1);
        saveCart();
        updateCartUI();
        
        alert('✅ Item removido do carrinho!');
    }
}

// Atualizar resumo do pedido
function updateOrderSummary() {
    console.log('Atualizando resumo do pedido');
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
    console.log('Resumo atualizado. Total: R$', total.toFixed(2));
}

// Processar finalização de compra
function handleCheckout(e) {
    e.preventDefault();
    console.log('Processando finalização de compra...');
    
    const formData = new FormData(checkoutForm);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Validar pedido mínimo
    if (totalItems < 10) {
        alert('❌ Pedido mínimo de 10 peças!');
        return;
    }
    
    // Coletar dados do formulário
    const orderData = {
        name: formData.get('name').trim(),
        cep: formData.get('cep').trim(),
        address: formData.get('address').trim(),
        delivery: formData.get('delivery'),
        phone: formData.get('phone').trim(),
        items: [...cart], // Copiar array do carrinho
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString(),
        status: 'pendente'
    };
    
    // Validar dados obrigatórios
    if (!orderData.name || !orderData.cep || !orderData.address || !orderData.delivery || !orderData.phone) {
        alert('❌ Preencha todos os campos obrigatórios!');
        return;
    }
    
    console.log('Dados do pedido:', orderData);
    
    // Salvar pedido no Firestore
    db.collection('orders').add(orderData)
        .then(docRef => {
            console.log('✅ Pedido salvo com ID:', docRef.id);
            
            // Enviar pedido via WhatsApp
            sendWhatsAppOrder(orderData);
            
            // Limpar carrinho
            cart = [];
            saveCart();
            updateCartUI();
            
            // Fechar modais e resetar formulário
            closeCheckoutModal();
            checkoutForm.reset();
            
        })
        .catch(error => {
            console.error('❌ Erro ao salvar pedido:', error);
            alert('❌ Erro ao processar pedido. Tente novamente.');
        });
}

// Enviar pedido via WhatsApp
function sendWhatsAppOrder(orderData) {
    console.log('Preparando envio via WhatsApp...');
    
    // Buscar número do WhatsApp do admin
    db.collection('adminSettings').doc('whatsappNumber').get()
        .then(doc => {
            let whatsappNumber = '5585989408154'; // Número padrão
            
            if (doc.exists && doc.data().number) {
                whatsappNumber = doc.data().number.replace(/\D/g, ''); // Remover caracteres não numéricos
                console.log('Número do WhatsApp encontrado:', whatsappNumber);
            } else {
                console.log('Usando número padrão do WhatsApp');
            }
            
            // Formatar mensagem
            let message = `*NOVO PEDIDO - HELLEN MODA FITNESS*%0A%0A`;
            message += `*Cliente:* ${orderData.name}%0A`;
            message += `*Telefone:* ${orderData.phone}%0A`;
            message += `*CEP:* ${orderData.cep}%0A`;
            message += `*Endereço:* ${orderData.address}%0A`;
            message += `*Entrega:* ${orderData.delivery}%0A%0A`;
            message += `*ITENS DO PEDIDO:*%0A%0A`;
            
            orderData.items.forEach((item, index) => {
                message += `*${index + 1}. ${item.name}*%0A`;
                message += `Cor: ${item.colorName}%0A`;
                message += `Quantidade: ${item.quantity}x%0A`;
                message += `Valor unitário: R$ ${item.price.toFixed(2)}%0A`;
                message += `Subtotal: R$ ${(item.price * item.quantity).toFixed(2)}%0A%0A`;
            });
            
            message += `*TOTAL DO PEDIDO: R$ ${orderData.total.toFixed(2)}*%0A%0A`;
            message += `*Forma de pagamento:* PIX%0A`;
            message += `*Data/hora:* ${new Date().toLocaleString('pt-BR')}%0A`;
            message += `*Status:* ✅ Pedido mínimo atendido (${orderData.items.reduce((sum, item) => sum + item.quantity, 0)} peças)`;
            
            // Criar link do WhatsApp
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
            
            console.log('URL do WhatsApp gerada');
            
            // Abrir WhatsApp em nova aba
            window.open(whatsappUrl, '_blank');
            
            alert('✅ Pedido enviado com sucesso! Em breve entraremos em contato via WhatsApp.');
            
        })
        .catch(error => {
            console.error('Erro ao buscar número do WhatsApp:', error);
            
            // Usar número padrão em caso de erro
            const whatsappUrl = `https://wa.me/55997720832?text=Pedido%20Hellen%20Moda%20Fitness`;
            window.open(whatsappUrl, '_blank');
            
            alert('✅ Pedido enviado com sucesso! Em breve entraremos em contato via WhatsApp.');
        });
}

// Função auxiliar para debug
window.debugCart = function() {
    console.log('=== DEBUG CARRINHO ===');
    console.log('Itens no carrinho:', cart);
    console.log('Produtos carregados:', products);
    console.log('LocalStorage:', localStorage.getItem('cart'));
};
