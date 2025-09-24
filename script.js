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
const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutModal = document.getElementById('close-checkout-modal');
const checkoutForm = document.getElementById('checkout-form');
const productModal = document.getElementById('product-modal');
const closeProductModal = document.getElementById('close-product-modal');
const productDetails = document.getElementById('product-details');
const adminLink = document.getElementById('admin-link');

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
    
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Criar card de produto
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const mainImage = product.images && product.images.length > 0 ? product.images[0] : 'placeholder.jpg';
    
    card.innerHTML = `
        <img src="${mainImage}" alt="${product.name}" class="product-image" data-product-id="${product.id}">
        <div class="product-thumbnails">
            ${product.images && product.images.slice(0, 3).map((img, index) => 
                `<img src="${img}" class="thumbnail" data-product-id="${product.id}" data-image-index="${index}">`
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
    menuBtn.addEventListener('click', () => sideMenu.classList.add('active'));
    closeMenuBtn.addEventListener('click', () => sideMenu.classList.remove('active'));
    
    // Categorias
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = link.getAttribute('data-category');
            displayProducts();
            sideMenu.classList.remove('active');
        });
    });
    
    // Home
    homeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentCategory = 'all';
        displayProducts();
    });
    
    // Carrinho
    cartBtn.addEventListener('click', () => cartModal.classList.add('active'));
    closeCartModal.addEventListener('click', () => cartModal.classList.remove('active'));
    
    // Finalizar compra
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems < 10) {
            alert('Pedido mínimo de 10 peças!');
            return;
        }
        
        cartModal.classList.remove('active');
        checkoutModal.classList.add('active');
    });
    
    floatingCheckoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems < 10) {
            alert('Pedido mínimo de 10 peças!');
            return;
        }
        
        checkoutModal.classList.add('active');
    });
    
    closeCheckoutModal.addEventListener('click', () => checkoutModal.classList.remove('active'));
    
    // Formulário de finalização
    checkoutForm.addEventListener('submit', handleCheckout);
    
    // Modal de produto
    closeProductModal.addEventListener('click', () => productModal.classList.remove('active'));
    
    // Delegação de eventos para produtos dinâmicos
    productsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('product-image') || 
            e.target.classList.contains('thumbnail')) {
            const productId = e.target.getAttribute('data-product-id');
            openProductModal(productId);
        }
        
        if (e.target.classList.contains('buy-btn')) {
            const productId = e.target.getAttribute('data-product-id');
            openProductModal(productId);
        }
    });
}

// Abrir modal do produto
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    productDetails.innerHTML = `
        <div class="product-images">
            <img src="${product.images[0]}" alt="${product.name}" class="main-image" id="main-product-image">
            <div class="thumbnails-container">
                ${product.images.map((img, index) => 
                    `<img src="${img}" class="thumbnail" data-index="${index}">`
                ).join('')}
            </div>
        </div>
        <div class="product-info">
            <h2>${product.name}</h2>
            <p class="product-price">R$ ${product.price.toFixed(2)}</p>
            <div class="color-options">
                ${product.colors ? product.colors.map((color, index) => `
                    <div class="color-option">
                        <div class="color-swatch" style="background-color: ${color.code}"></div>
                        <span>${color.name} (Estoque: ${color.stock})</span>
                        <input type="number" class="quantity-input" min="0" max="${color.stock}" 
                               data-color-index="${index}" placeholder="Qtd" value="0">
                    </div>
                `).join('') : '<p>Sem opções de cor disponíveis</p>'}
            </div>
            <button class="add-to-cart-btn" data-product-id="${product.id}">Adicionar ao Carrinho</button>
        </div>
    `;
    
    // Event listeners para as miniaturas
    const thumbnails = productDetails.querySelectorAll('.thumbnail');
    const mainImage = productDetails.getElementById('main-product-image');
    
    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const index = thumb.getAttribute('data-index');
            mainImage.src = product.images[index];
        });
    });
    
    // Event listener para o botão de adicionar ao carrinho
    const addToCartBtn = productDetails.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', () => {
        addToCart(product);
    });
    
    productModal.classList.add('active');
}

// Adicionar produto ao carrinho
function addToCart(product) {
    const quantityInputs = productDetails.querySelectorAll('.quantity-input');
    let hasItems = false;
    
    quantityInputs.forEach(input => {
        const quantity = parseInt(input.value) || 0;
        if (quantity > 0) {
            const colorIndex = input.getAttribute('data-color-index');
            const color = product.colors[colorIndex];
            
            if (quantity > color.stock) {
                alert(`Quantidade solicitada para ${color.name} excede o estoque disponível!`);
                return;
            }
            
            // Verificar se o item já está no carrinho
            const existingItemIndex = cart.findIndex(item => 
                item.productId === product.id && item.colorIndex === parseInt(colorIndex)
            );
            
            if (existingItemIndex !== -1) {
                cart[existingItemIndex].quantity += quantity;
            } else {
                cart.push({
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    colorIndex: parseInt(colorIndex),
                    colorName: color.name,
                    colorCode: color.code,
                    quantity: quantity,
                    image: product.images[0]
                });
            }
            
            hasItems = true;
            
            // Redução temporária do estoque
            updateTemporaryStock(product.id, colorIndex, quantity, 'decrease');
        }
    });
    
    if (hasItems) {
        saveCart();
        updateCartUI();
        alert('Produto(s) adicionado(s) ao carrinho!');
        productModal.classList.remove('active');
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
                // Garantir que o estoque não fique negativo
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
        cartItems.innerHTML = '<p>Seu carrinho está vazio</p>';
        cartTotalValue.textContent = '0,00';
        floatingCheckoutBtn.style.display = 'none';
        return;
    }
    
    floatingCheckoutBtn.style.display = 'block';
    
    let total = 0;
    
    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <p><strong>${item.name}</strong> - ${item.colorName}</p>
                <p>R$ ${item.price.toFixed(2)} x ${item.quantity} = R$ ${itemTotal.toFixed(2)}</p>
            </div>
            <div class="cart-item-actions">
                <button class="remove-item" data-index="${index}">✕</button>
            </div>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    cartTotalValue.textContent = total.toFixed(2);
    
    // Adicionar event listeners para remover itens
    const removeButtons = cartItems.querySelectorAll('.remove-item');
    removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            removeFromCart(index);
        });
    });
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

// Processar finalização de compra
function handleCheckout(e) {
    e.preventDefault();
    
    const formData = new FormData(checkoutForm);
    const orderData = {
        name: formData.get('name'),
        cep: formData.get('cep'),
        address: formData.get('address'),
        delivery: formData.get('delivery'),
        phone: formData.get('phone'),
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString()
    };
    
    // Salvar pedido no Firestore
    db.collection('orders').add(orderData)
        .then(docRef => {
            console.log('Pedido salvo com ID: ', docRef.id);
            
            // Enviar pedido via WhatsApp
            sendWhatsAppOrder(orderData);
            
            // Limpar carrinho
            cart = [];
            saveCart();
            updateCartUI();
            
            // Fechar modais
            checkoutModal.classList.remove('active');
            checkoutForm.reset();
            
            alert('Pedido enviado com sucesso! Em breve entraremos em contato via WhatsApp.');
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
            let whatsappNumber = '(85) 99772-0832'; // Número padrão
            
            if (doc.exists) {
                whatsappNumber = doc.data().number || whatsappNumber;
            }
            
            // Formatar mensagem
            let message = `*NOVO PEDIDO - HELLEN MODA FITNESS*%0A%0A`;
            message += `*Cliente:* ${orderData.name}%0A`;
            message += `*Telefone:* ${orderData.phone}%0A`;
            message += `*CEP:* ${orderData.cep}%0A`;
            message += `*Endereço:* ${orderData.address}%0A`;
            message += `*Entrega:* ${orderData.delivery}%0A%0A`;
            message += `*ITENS DO PEDIDO:*%0A`;
            
            orderData.items.forEach(item => {
                message += `- ${item.name} (${item.colorName}) - R$ ${item.price.toFixed(2)} x ${item.quantity}%0A`;
            });
            
            message += `%0A*TOTAL: R$ ${orderData.total.toFixed(2)}*%0A`;
            message += `*Forma de pagamento:* PIX%0A`;
            message += `*Data:* ${new Date().toLocaleString('pt-BR')}`;
            
            // Criar link do WhatsApp
            const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${message}`;
            
            // Abrir WhatsApp em nova aba
            window.open(whatsappUrl, '_blank');
        })
        .catch(error => {
            console.error('Erro ao buscar número do WhatsApp:', error);
        });
}
