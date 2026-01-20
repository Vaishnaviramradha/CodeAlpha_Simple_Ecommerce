const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// In-memory "database"
let products = [
  { id: 1, name: 'Laptop', price: 70000, description: 'Powerful laptop for work and gaming' },
  { id: 2, name: 'Smartphone', price: 25000, description: 'Smartphone with great camera and battery' },
  { id: 3, name: 'Headphones', price: 3000, description: 'Noise-cancelling wireless headphones' },
  { id: 4, name: 'Smartwatch', price: 5000, description: 'Track your fitness and notifications' }
];

let users = [
  { id: 1, username: 'test', password: 'test' } // demo user
];
let nextUserId = 2;

let orders = [];
let nextOrderId = 1;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// =================== AUTH ===================

// Registration
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required' });
  }

  const existing = users.find(u => u.username === username);
  if (existing) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const newUser = {
    id: nextUserId++,
    username,
    password // NOTE: plain text for demo; hash in real app
  };
  users.push(newUser);
  res.json({ message: 'Registered successfully', userId: newUser.id });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    u => u.username === username && u.password === password
  );
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json({ message: 'Login successful', userId: user.id, username: user.username });
});

// =================== PRODUCTS ===================

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Get product by id
app.get('/api/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// =================== ORDERS ===================

// Place order
app.post('/api/orders', (req, res) => {
  const { userId, items } = req.body; // items = [{productId, quantity}]

  if (!userId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Invalid order data' });
  }

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(400).json({ message: 'Invalid user' });
  }

  // calculate total
  let total = 0;
  const detailedItems = items.map(it => {
    const product = products.find(p => p.id === it.productId);
    if (!product) return null;
    total += product.price * it.quantity;
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: it.quantity
    };
  }).filter(Boolean);

  if (detailedItems.length === 0) {
    return res.status(400).json({ message: 'No valid items in order' });
  }

  const order = {
    id: nextOrderId++,
    userId,
    items: detailedItems,
    total,
    createdAt: new Date()
  };
  orders.push(order);

  res.json({ message: 'Order placed successfully', orderId: order.id, total });
});

// Get orders for a user
app.get('/api/orders/:userId', (req, res) => {
  const userId = parseInt(req.params.userId);
  const userOrders = orders.filter(o => o.userId === userId);
  res.json(userOrders);
});

// =================== FRONTEND FALLBACK ===================

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// =================== START SERVER ===================

app.listen(PORT, () => {
  console.log(`E-commerce server running on http://localhost:${PORT}`);
});
