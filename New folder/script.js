// Shakmen - Script.js
// This script manages PWA installation prompt and simple cart interactions.

let deferredPrompt;
const installBtn = document.getElementById('installBtn');
const homeBtn = document.getElementById('homeBtn');
const welcomeBanner = document.getElementById('welcomeBanner');
const cartCountEl = document.getElementById('cartCount');
let cartCount = parseInt(localStorage.getItem('cartCount') || '0', 10);
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const clearCartBtn = document.getElementById('clearCart');
// Details modal elements
const detailsOverlay = document.getElementById('detailsOverlay');
const detailsModal = document.getElementById('detailsModal');
const detailsClose = document.getElementById('detailsClose');
const detailsImage = document.getElementById('detailsImage');
const detailsTitle = document.getElementById('detailsTitle');
const detailsPrice = document.getElementById('detailsPrice');
const detailsAbout = document.getElementById('detailsAbout');
const detailsSizeSelect = document.getElementById('detailsSizeSelect');
const detailsOrigin = document.getElementById('detailsOrigin');
const modalQtyMinus = document.getElementById('modalQtyMinus');
const modalQtyPlus = document.getElementById('modalQtyPlus');
const modalQtyInput = document.getElementById('modalQtyInput');
const modalAddBtn = document.getElementById('modalAddBtn');
let currentProduct = null;
let cartItems = [];

try {
  cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
  if (!Array.isArray(cartItems)) cartItems = [];
} catch { cartItems = []; }

function updateCartCount() {
  if (cartCountEl) {
    cartCountEl.textContent = String(cartCount);
  }
  localStorage.setItem('cartCount', String(cartCount));
}

function saveCart() {
  localStorage.setItem('cartItems', JSON.stringify(cartItems));
}

function formatCurrency(num) {
  try { return new Intl.NumberFormat('en-GH', { style:'currency', currency:'GHS' }).format(num); }
  catch { return `₵${num.toFixed(2)}`; }
}

function renderCart() {
  if (!cartItemsEl || !cartTotalEl) return;
  if (cartItems.length === 0) {
    cartItemsEl.innerHTML = '<p>Your cart is empty.</p>';
    cartTotalEl.textContent = formatCurrency(0);
    cartCount = 0;
    updateCartCount();
    return;
  }
  let total = 0;
  let totalItems = 0;
  cartItemsEl.innerHTML = '';
  cartItems.forEach((item, index) => {
    total += item.price * item.qty;
    totalItems += item.qty;
    const line = document.createElement('div');
    line.className = 'cart-line';
    line.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div>
        <div class="title">${item.title}</div>
        <div class="meta">${formatCurrency(item.price)} × ${item.qty}</div>
        <div class="cart-line-controls" data-index="${index}">
          <button class="cart-line-btn line-minus" aria-label="Decrease quantity">−</button>
          <button class="cart-line-btn line-plus" aria-label="Increase quantity">+</button>
          <button class="cart-line-btn line-remove" aria-label="Remove item">✕</button>
        </div>
      </div>
      <div>${formatCurrency(item.price * item.qty)}</div>
    `;
    cartItemsEl.appendChild(line);
  });
  cartTotalEl.textContent = formatCurrency(total);
  // ensure the navbar count reflects sum of quantities
  cartCount = totalItems;
  updateCartCount();
}

function openCart() {
  if (!cartDrawer || !cartOverlay) return;
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  cartOverlay.setAttribute('aria-hidden', 'false');
}

function closeCartDrawer() {
  if (!cartDrawer || !cartOverlay) return;
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartOverlay.setAttribute('aria-hidden', 'true');
}

// Listen for 'beforeinstallprompt' to enable PWA installation
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'inline-block';
});

// Show install prompt when button clicked
installBtn && installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    console.log('User choice', choice);
    deferredPrompt = null;
  } else {
    alert('To install on iOS: tap Share ▸ Add to Home Screen');
  }
});

// Scroll to top when Home button is clicked
homeBtn && homeBtn.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));

// Show banner message on load
window.addEventListener('DOMContentLoaded', () => {
  if (welcomeBanner) {
    welcomeBanner.textContent = 'Install the app for faster, offline access!';
    welcomeBanner.style.display = 'block';
  }
  renderCart();
});

// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(reg => console.log('Service Worker Registered:', reg.scope))
    .catch(err => console.warn('SW registration failed:', err));
}

// Quantity controls and add-to-cart feedback
document.querySelectorAll('.product-card').forEach(card => {
  const minusBtn = card.querySelector('.qty-minus');
  const plusBtn = card.querySelector('.qty-plus');
  const qtyInput = card.querySelector('.qty-input');
  const addBtn = card.querySelector('.add-btn');

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  if (minusBtn && plusBtn && qtyInput) {
    minusBtn.addEventListener('click', () => {
      const current = parseInt(qtyInput.value || '1', 10);
      qtyInput.value = String(clamp(current - 1, 1, 99));
    });
    plusBtn.addEventListener('click', () => {
      const current = parseInt(qtyInput.value || '1', 10);
      qtyInput.value = String(clamp(current + 1, 1, 99));
    });
  }

  if (addBtn && qtyInput) {
    addBtn.addEventListener('click', () => {
      const qty = parseInt(qtyInput.value || '1', 10);
      const originalText = addBtn.textContent;
      // Build item from DOM
      const titleEl = null; // use dataset instead
      const priceEl = null;
      const imgEl = card.querySelector('img');
      const title = card.getAttribute('data-name') || 'Item';
      const price = parseFloat(card.getAttribute('data-price') || '0');
      const image = imgEl ? imgEl.getAttribute('src') : '';

      // Merge with existing if same title
      const existing = cartItems.find(i => i.title === title);
      if (existing) existing.qty += qty; else cartItems.push({ title, price, image, qty });
      cartCount += qty;
      updateCartCount();
      saveCart();
      renderCart();

      addBtn.textContent = `Added × ${qty} ✓`;
      addBtn.disabled = true;
      setTimeout(() => {
        addBtn.textContent = originalText;
        addBtn.disabled = false;
      }, 1200);
    });
  }
});

// Cart open/close handlers
const cartBtn = document.getElementById('cartBtn');
cartBtn && cartBtn.addEventListener('click', () => { renderCart(); openCart(); });
closeCart && closeCart.addEventListener('click', closeCartDrawer);
cartOverlay && cartOverlay.addEventListener('click', closeCartDrawer);

// Product details modal handlers
function openDetails() {
  if (!detailsOverlay || !detailsModal) return;
  detailsOverlay.classList.add('open');
  detailsModal.classList.add('open');
  detailsOverlay.setAttribute('aria-hidden','false');
  detailsModal.setAttribute('aria-hidden','false');
}
function closeDetails() {
  if (!detailsOverlay || !detailsModal) return;
  detailsOverlay.classList.remove('open');
  detailsModal.classList.remove('open');
  detailsOverlay.setAttribute('aria-hidden','true');
  detailsModal.setAttribute('aria-hidden','true');
}
detailsClose && detailsClose.addEventListener('click', closeDetails);
detailsOverlay && detailsOverlay.addEventListener('click', closeDetails);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetails(); });

// Intercept image clicks to show details
document.querySelectorAll('.product-card .image-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const card = link.closest('.product-card');
    if (!card) return;
    const img = card.querySelector('img');
    if (detailsImage && img) detailsImage.src = img.getAttribute('src') || '';

    const dataName = card.getAttribute('data-name') || '';
    const dataPrice = card.getAttribute('data-price') || '';
    const dataAbout = card.getAttribute('data-about') || '';
    const dataOrigin = card.getAttribute('data-origin') || '';
    const dataSizes = (card.getAttribute('data-sizes') || '').split(',').map(s => s.trim()).filter(Boolean);

    // Default populate
    if (detailsTitle) detailsTitle.textContent = dataName;
    if (detailsPrice) detailsPrice.textContent = dataPrice ? `₵${Number(dataPrice).toFixed(2)}` : '';
    if (detailsAbout) detailsAbout.textContent = dataAbout;
    if (detailsOrigin) detailsOrigin.textContent = dataOrigin;
    if (detailsSizeSelect) {
      detailsSizeSelect.innerHTML = '';
      dataSizes.forEach(sz => {
        const opt = document.createElement('option');
        opt.value = sz; opt.textContent = sz;
        detailsSizeSelect.appendChild(opt);
      });
    }
    // Default behavior uses card data attributes only; no extra enrichment
    if (modalQtyInput) modalQtyInput.value = '1';
    currentProduct = { title: dataName, price: Number(dataPrice || 0), image: (img && img.getAttribute('src')) || '', sizes: dataSizes };
    openDetails();
  });
});

// Modal quantity controls
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
modalQtyMinus && modalQtyMinus.addEventListener('click', () => {
  if (!modalQtyInput) return; const cur = parseInt(modalQtyInput.value||'1',10); modalQtyInput.value = String(clamp(cur-1,1,99));
});
modalQtyPlus && modalQtyPlus.addEventListener('click', () => {
  if (!modalQtyInput) return; const cur = parseInt(modalQtyInput.value||'1',10); modalQtyInput.value = String(clamp(cur+1,1,99));
});

// Modal add to cart
modalAddBtn && modalAddBtn.addEventListener('click', () => {
  if (!currentProduct) return;
  const qty = modalQtyInput ? parseInt(modalQtyInput.value||'1',10) : 1;
  const selectedSize = detailsSizeSelect ? detailsSizeSelect.value : '';
  const titleWithSize = selectedSize ? `${currentProduct.title} (${selectedSize})` : currentProduct.title;
  const existing = cartItems.find(i => i.title === titleWithSize);
  if (existing) existing.qty += qty; else cartItems.push({ title: titleWithSize, price: currentProduct.price, image: currentProduct.image, qty });
  cartCount += qty; updateCartCount(); saveCart(); renderCart();
  // quick feedback
  const original = modalAddBtn.textContent; modalAddBtn.textContent = `Added × ${qty} ✓`; modalAddBtn.disabled = true;
  setTimeout(()=>{ modalAddBtn.textContent = original; modalAddBtn.disabled = false; }, 1000);
});

// Clear cart
clearCartBtn && clearCartBtn.addEventListener('click', () => {
  cartItems = [];
  cartCount = 0;
  saveCart();
  renderCart();
});

// Quantity adjust/remove inside cart via event delegation
cartItemsEl && cartItemsEl.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const parent = target.closest('.cart-line-controls');
  if (!parent) return;
  const index = parseInt(parent.getAttribute('data-index') || '-1', 10);
  if (isNaN(index) || index < 0 || index >= cartItems.length) return;
  if (target.classList.contains('line-minus')) {
    cartItems[index].qty = Math.max(0, cartItems[index].qty - 1);
    if (cartItems[index].qty === 0) cartItems.splice(index, 1);
  } else if (target.classList.contains('line-plus')) {
    cartItems[index].qty = Math.min(99, cartItems[index].qty + 1);
  } else if (target.classList.contains('line-remove')) {
    cartItems.splice(index, 1);
  } else {
    return;
  }
  saveCart();
  renderCart();
});
