const API_BASE = 'http://localhost:3000/api';

// ====== LocalStorage helpers ======
function getCart() {
  const c = localStorage.getItem('cart');
  return c ? JSON.parse(c) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function getUserId() {
  return parseInt(localStorage.getItem('userId') || '0', 10);
}

function setUser(userId, username) {
  localStorage.setItem('userId', userId.toString());
  localStorage.setItem('username', username || '');
}

function clearUser() {
  localStorage.removeItem('userId');
  localStorage.removeItem('username');
}

// ====== HOME: product list ======
if (
  location.pathname.endsWith('index.html') ||
  location.pathname === '/' ||
  location.pathname === ''
) {
  fetch(`${API_BASE}/products`)
    .then(res => res.json())
    .then(products => {
      const container = document.getElementById('product-list');
      container.innerHTML = '';
      products.forEach(p => {
        const div = document.createElement('div');
        div.className = 'product-card';
        div.innerHTML = `
          <img src="https://via.placeholder.com/300x160?text=${encodeURIComponent(p.name)}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p class="price">₹${p.price}</p>
          <p>${p.description}</p>
          <div class="actions">
            <button class="btn-secondary" onclick="location.href='product.html?id=${p.id}'">Details</button>
            <button class="btn-primary" onclick="quickAddToCart(${p.id}, '${p.name}', ${p.price})">Add to Cart</button>
          </div>
        `;
        container.appendChild(div);
      });
    })
    .catch(() => {
      const container = document.getElementById('product-list');
      container.textContent = 'Failed to load products';
    });
}

// quick add
function quickAddToCart(id, name, price) {
  const cart = getCart();
  const existing = cart.find(item => item.productId === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId: id, name, price, quantity: 1 });
  }
  saveCart(cart);
  alert('Added to cart');
}

// ====== PRODUCT DETAILS ======
if (location.pathname.endsWith('product.html')) {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  fetch(`${API_BASE}/products/${id}`)
    .then(res => res.json())
    .then(p => {
      const details = document.getElementById('product-details');
      if (!p || p.message) {
        details.textContent = 'Product not found';
        return;
      }
      details.innerHTML = `
        <img src="https://via.placeholder.com/400x220?text=${encodeURIComponent(p.name)}" alt="${p.name}">
        <div>
          <h2>${p.name}</h2>
          <p class="price">Price: ₹${p.price}</p>
          <p>${p.description}</p>
          <button class="btn-primary" id="add-to-cart">Add to Cart</button>
        </div>
      `;

      document.getElementById('add-to-cart').onclick = () => {
        quickAddToCart(p.id, p.name, p.price);
      };
    })
    .catch(() => {
      const details = document.getElementById('product-details');
      details.textContent = 'Error loading product';
    });
}

// ====== CART PAGE ======
if (location.pathname.endsWith('cart.html')) {
  const cart = getCart();
  const container = document.getElementById('cart-items');
  let total = 0;
  container.innerHTML = '';

  if (cart.length === 0) {
    container.textContent = 'Your cart is empty';
  } else {
    cart.forEach(item => {
      total += item.price * item.quantity;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <span>${item.name} (x${item.quantity})</span>
        <span>₹${item.price * item.quantity}</span>
      `;
      container.appendChild(div);
    });
  }

  document.getElementById('cart-total').textContent = `Total: ₹${total}`;

  document.getElementById('place-order').onclick = () => {
    const userId = getUserId();
    if (!userId) {
      alert('Please login first');
      location.href = 'login.html';
      return;
    }
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const items = cart.map(c => ({ productId: c.productId, quantity: c.quantity }));
    fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items })
    })
      .then(res => res.json())
      .then(data => {
        if (data.orderId) {
          alert(`Order placed! ID: ${data.orderId}, Total: ₹${data.total}`);
          saveCart([]);
          location.href = 'index.html';
        } else {
          alert(data.message || 'Failed to place order');
        }
      })
      .catch(() => {
        alert('Error placing order');
      });
  };
}

// ====== LOGIN PAGE ======
if (location.pathname.endsWith('login.html')) {
  const form = document.getElementById('login-form');
  const msg = document.getElementById('login-message');

  form.onsubmit = e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.userId) {
          setUser(data.userId, data.username);
          msg.textContent = 'Login successful!';
          msg.classList.remove('error');
          msg.classList.add('success');
          setTimeout(() => {
            location.href = 'index.html';
          }, 1000);
        } else {
          msg.textContent = data.message || 'Login failed';
          msg.classList.remove('success');
          msg.classList.add('error');
        }
      })
      .catch(() => {
        msg.textContent = 'Error logging in';
        msg.classList.remove('success');
        msg.classList.add('error');
      });
  };
}

// ====== REGISTER PAGE ======
if (location.pathname.endsWith('register.html')) {
  const form = document.getElementById('register-form');
  const msg = document.getElementById('register-message');

  form.onsubmit = e => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value.trim();

    fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        msg.textContent = data.message || 'Registered';
        if (data.userId) {
          msg.classList.remove('error');
          msg.classList.add('success');
          setTimeout(() => {
            location.href = 'login.html';
          }, 1000);
        } else {
          msg.classList.remove('success');
          msg.classList.add('error');
        }
      })
      .catch(() => {
        msg.textContent = 'Error registering';
        msg.classList.remove('success');
        msg.classList.add('error');
      });
  };
}
