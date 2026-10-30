/**
 * Wadfan Studio (วาดฝัน สตูดิโอ) - Storefront Script v2
 * Sells Digital Art / Images & Educational Worksheets
 * Integrated with Supabase Data Provider (window.wadfanData)
 */

// State
let productsList = [];
let categoriesList = [];
let currentMainType = "all"; // 'all' | 'image' | 'worksheet'
let currentCategoryFilter = "all";
let currentSearch = "";
let selectedVariantForModal = null;
let currentPreviewProduct = null;
let customerAttachedFiles = [];
let customerSlipFile = null;
let isSubmittingOrder = false;
let isManualNavClick = false;
let manualNavTimer = null;
const MAX_TOTAL_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB max

// Cart State (stored in localStorage)
let shoppingCart = [];

// DOM Elements
const productsGrid = document.getElementById("productsGrid");
const categoriesGrid = document.getElementById("categoriesGrid");
const filterTabs = document.getElementById("filterTabs");
const searchInput = document.getElementById("productSearchInput");
const cartBtn = document.getElementById("cartBtn");
const cartDrawer = document.getElementById("cartDrawer");
const cartBackdrop = document.getElementById("cartBackdrop");
const cartCloseBtn = document.getElementById("cartCloseBtn");
const cartCountBadge = document.getElementById("cartCount");
const cartItemsContainer = document.getElementById("cartItemsContainer");
const cartTotalItemsCount = document.getElementById("cartTotalItemsCount");
const cartTotalPrice = document.getElementById("cartTotalPrice");
const checkoutBtn = document.getElementById("checkoutBtn");
const toastContainer = document.getElementById("toastContainer");

// Preview Modal Elements
const previewModal = document.getElementById("previewModal");
const previewModalContent = document.getElementById("previewModalContent");
const modalCloseBtn = document.getElementById("modalCloseBtn");

// Mobile Drawer Elements
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileDrawer = document.getElementById("mobileDrawer");
const drawerCloseBtn = document.getElementById("drawerCloseBtn");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const drawerLinks = document.querySelectorAll(".drawer-link");

// Checkout Modal Elements
const checkoutModal = document.getElementById("checkoutModal");
const checkoutCloseBtn = document.getElementById("checkoutCloseBtn");
const checkoutDueAmount = document.getElementById("checkoutDueAmount");
const checkoutImageUploadBox = document.getElementById("checkoutImageUploadBox");
const customerImageFileInput = document.getElementById("customerImageFile");
const fileUploadPreview = document.getElementById("fileUploadPreview");
const dropzoneText = document.getElementById("dropzoneText");
const checkoutSlipUploadBox = document.getElementById("checkoutSlipUploadBox");
const customerSlipFileInput = document.getElementById("customerSlipFile");
const slipUploadPreview = document.getElementById("slipUploadPreview");
const slipDropzoneText = document.getElementById("slipDropzoneText");
const orderSuccessModal = document.getElementById("orderSuccessModal");
const orderSuccessContent = document.getElementById("orderSuccessContent");

// Freebie Form
const freebieSubmitBtn = document.getElementById("freebieSubmitBtn");
const freebieEmail = document.getElementById("freebieEmail");

// ==============================================================================
// 1. Initialization
// ==============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadStoreData();
  setupEventListeners();
  loadCartFromStorage();
  setupAccordion();
});

async function loadStoreData() {
  try {
    categoriesList = await window.wadfanData.getCategories();
  } catch (e) {
    console.warn("Could not load categories:", e);
    categoriesList = [];
  }

  try {
    productsList = await window.wadfanData.getProducts({ status: "active" });
  } catch (e) {
    console.warn("Could not load products:", e);
    productsList = [];
  }

  renderCategoriesGrid();
  renderSubFilterTabs();
  renderProducts();
}

// ==============================================================================
// 2. Categories & Filter Tabs
// ==============================================================================
function renderCategoriesGrid() {
  if (!categoriesGrid) return;

  if (categoriesList.length === 0) {
    categoriesGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">
        <i class="fa-solid fa-shapes" style="font-size: 2rem; margin-bottom: 8px;"></i>
        <p>ยังไม่มีหมวดหมู่สินค้า</p>
      </div>
    `;
    return;
  }

  // Cute icons and colors cycle
  const iconPalette = [
    { icon: "🎨", bg: "bg-pink-light" },
    { icon: "📱", bg: "bg-blue-light" },
    { icon: "✨", bg: "bg-yellow-light" },
    { icon: "🖼️", bg: "bg-purple-light" },
    { icon: "ก", bg: "bg-pink-light" },
    { icon: "123", bg: "bg-blue-light" },
    { icon: "ABC", bg: "bg-purple-light" },
    { icon: "✂️", bg: "bg-yellow-light" }
  ];

  categoriesGrid.innerHTML = categoriesList
    .map((c, idx) => {
      const palette = iconPalette[idx % iconPalette.length];
      const typeLabel = c.product_type === "image" ? "รูปภาพดิจิทัล" : "ใบงานเด็ก";

      return `
      <div class="category-card" onclick="window.filterByCategorySlug('${c.slug}')">
        <div class="cat-icon-wrapper ${palette.bg}">
          <span class="cat-emoji">${palette.icon}</span>
        </div>
        <h3>${c.name}</h3>
        <p>คลิกเพื่อเลือกชมผลงานในหมวดหมู่นี้</p>
        <span class="cat-count">${typeLabel}</span>
      </div>
    `;
    })
    .join("");
}

function renderSubFilterTabs() {
  if (!filterTabs) return;

  let filteredCats = categoriesList;
  if (currentMainType !== "all") {
    filteredCats = categoriesList.filter((c) => c.product_type === currentMainType);
  }

  filterTabs.innerHTML = `
    <button class="filter-btn ${currentCategoryFilter === 'all' ? 'active' : ''}" data-filter="all">ทั้งหมด</button>
    ${filteredCats
      .map(
        (c) => `
      <button class="filter-btn ${currentCategoryFilter === c.slug ? 'active' : ''}" data-filter="${c.slug}">
        ${c.name}
      </button>
    `
      )
      .join("")}
    <button class="filter-btn highlight-free-tab ${currentCategoryFilter === 'free' ? 'active' : ''}" data-filter="free">🎁 โหลดฟรี</button>
  `;
}

window.filterByMainType = function (mainType) {
  currentMainType = mainType;
  currentCategoryFilter = "all";

  // ล็อค Scrollspy ชั่วคราวไม่ให้เขียนทับ Highlight ขณะเลื่อนจอ
  isManualNavClick = true;
  if (manualNavTimer) clearTimeout(manualNavTimer);
  manualNavTimer = setTimeout(() => {
    isManualNavClick = false;
  }, 1200);

  document.querySelectorAll(".main-type-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.maintype === mainType);
  });

  // อัปเดตสถานะ Active บน Navbar และ Drawer Menu
  document.querySelectorAll(".nav-link, .drawer-link").forEach((link) => {
    const onclickAttr = link.getAttribute("onclick") || "";
    if (onclickAttr.includes(`filterByMainType('${mainType}')`)) {
      link.classList.add("active");
    } else if (onclickAttr.includes("filterByMainType") || link.getAttribute("href") === "#hero") {
      link.classList.remove("active");
    }
  });

  renderSubFilterTabs();
  renderProducts();

  const prodSection = document.getElementById("products");
  if (prodSection) prodSection.scrollIntoView({ behavior: "smooth" });
};

window.filterByCategorySlug = function (slug) {
  const cat = categoriesList.find((c) => c.slug === slug);
  if (cat) {
    currentMainType = cat.product_type;
    currentCategoryFilter = slug;

    // ล็อค Scrollspy ชั่วคราว
    isManualNavClick = true;
    if (manualNavTimer) clearTimeout(manualNavTimer);
    manualNavTimer = setTimeout(() => {
      isManualNavClick = false;
    }, 1200);

    document.querySelectorAll(".main-type-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.maintype === currentMainType);
    });

    // กำหนด Active ไปที่หมวดหมู่สินค้า
    document.querySelectorAll(".nav-link, .drawer-link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const onclickAttr = link.getAttribute("onclick") || "";
      if (href === "#categories" && !onclickAttr) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    renderSubFilterTabs();
    renderProducts();

    const prodSection = document.getElementById("products");
    if (prodSection) prodSection.scrollIntoView({ behavior: "smooth" });
  }
};

// ==============================================================================
// 3. Render Products Grid
// ==============================================================================
function renderProducts() {
  if (!productsGrid) return;

  const filtered = productsList.filter((item) => {
    if (currentMainType !== "all" && item.product_type !== currentMainType) return false;

    if (currentCategoryFilter === "free") {
      const hasFree = item.base_price === 0 || (item.variants && item.variants.some((v) => v.price === 0));
      if (!hasFree) return false;
    } else if (currentCategoryFilter !== "all") {
      const cat = categoriesList.find((c) => c.slug === currentCategoryFilter);
      if (cat && item.category_id !== cat.id) return false;
    }

    if (currentSearch.trim() !== "") {
      const q = currentSearch.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.short_desc && item.short_desc.toLowerCase().includes(q);
      const matchCat = item.category_name && item.category_name.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 20px; border: 1px dashed #CBD5E1;">
        <i class="fa-solid fa-magnifying-glass" style="font-size: 2.5rem; color: #94A3B8; margin-bottom: 12px; display: block;"></i>
        <h3 style="font-size: 1.2rem; color: #334155; margin-bottom: 6px;">ไม่พบสินค้าที่ตรงกับการค้นหา</h3>
        <p style="font-size: 0.9rem; color: #64748B;">ลองเลือกหมวดหมู่อื่น หรือกดดูสินค้าทั้งหมด</p>
        <button class="btn-secondary" style="margin-top: 16px;" onclick="window.filterByMainType('all')">ดูสินค้าทั้งหมด</button>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = filtered
    .map((item) => {
      const isImage = item.product_type === "image";
      const isFree = item.base_price === 0;

      const typePillClass = isImage ? "pill-image" : "pill-worksheet";
      const typePillLabel = isImage ? "🎨 รูปภาพดิจิทัล" : "📄 ใบงานการเรียนรู้";

      let metaInfoHtml = "";
      if (isImage) {
        const res = item.metadata ? item.metadata.resolution || "High-Res" : "High-Res";
        const variantsCount = item.variants ? item.variants.length : 1;
        metaInfoHtml = `<span><i class="fa-solid fa-expand"></i> ${res}</span> <span>${variantsCount} ตัวเลือก</span>`;
      } else {
        const grade = item.metadata ? item.metadata.grade_level || "ปฐมวัย" : "ปฐมวัย";
        const pages = item.metadata ? item.metadata.total_pages || 20 : 20;
        metaInfoHtml = `<span><i class="fa-solid fa-graduation-cap"></i> ${grade}</span> <span>${pages} หน้า (PDF)</span>`;
      }

      return `
      <article class="product-card" data-id="${item.id}">
        <div class="product-thumb-container">
          <span class="product-tag tag-best">${item.tag || "แนะนำ"}</span>
          <span class="product-type-pill ${typePillClass}">${typePillLabel}</span>

          <img src="${item.cover_image_url || 'https://via.placeholder.com/400'}" class="product-cover-img" alt="${item.title}" onerror="this.src='https://via.placeholder.com/400?text=Wadfan+Studio'">

          <button class="quick-preview-btn" onclick="window.openProductPreview('${item.id}')">
            <i class="fa-regular fa-eye"></i> ดูตัวเลือก & ขนาด
          </button>
        </div>

        <div class="product-info">
          <div class="product-meta">
            ${metaInfoHtml}
          </div>

          <h3 class="product-title">${item.title}</h3>
          <p class="product-desc">${item.short_desc || ""}</p>

          <div class="product-footer">
            <div class="product-price-box">
              ${
                isFree
                  ? `<span class="price-current is-free">แจกฟรี!</span>`
                  : `<span class="price-current">เริ่มต้น ฿${item.base_price}</span>`
              }
            </div>

            <button class="btn-primary btn-sm" onclick="window.openProductPreview('${item.id}')">
              <span>เลือกขนาด & สั่งซื้อ</span> <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </article>
    `;
    })
    .join("");
}

// ==============================================================================
// 4. Quick Preview & Variant Selector Modal
// ==============================================================================
window.openProductPreview = function (productId) {
  const product = productsList.find((p) => p.id === productId);
  if (!product || !previewModalContent || !previewModal) return;

  currentPreviewProduct = product;
  const isImage = product.product_type === "image";
  const variants = product.variants && product.variants.length > 0 ? product.variants : [
    {
      id: "def-1",
      name: "ขนาดมาตรฐาน",
      dimension_or_detail: "พร้อมใช้งานทันที",
      file_format: isImage ? "PNG/JPG" : "PDF",
      price: product.base_price,
      download_file_url: product.download_url || ""
    }
  ];

  selectedVariantForModal = variants[0];

  const variantsListHtml = variants
    .map(
      (v, idx) => `
    <div class="variant-option-card ${idx === 0 ? 'active' : ''}" data-variant-id="${v.id}" onclick="window.selectModalVariant('${v.id}')">
      <div class="variant-opt-info">
        <strong>${v.name}</strong>
        <small>${v.dimension_or_detail || ''} (${v.file_format || 'Digital File'})</small>
      </div>
      <div class="variant-opt-price">${v.price === 0 ? 'ฟรี' : '฿' + v.price}</div>
    </div>
  `
    )
    .join("");

  previewModalContent.innerHTML = `
    <div class="preview-modal-body">
      <div class="preview-badge-row">
        <span class="meta-grade">
          <i class="${isImage ? 'fa-solid fa-palette text-blue' : 'fa-solid fa-file-pdf text-pink'}"></i> 
          ${isImage ? 'Digital Artwork & Image' : 'Educational Worksheet'}
        </span>
        <span class="meta-grade"><i class="fa-solid fa-cloud text-blue"></i> Google Drive Cloud Delivery</span>
      </div>

      <h2 class="preview-title">${product.title}</h2>
      <p class="preview-desc-full">${product.full_desc || product.short_desc || ""}</p>

      <div class="preview-grid-details">
        <div style="border-radius: 14px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06); height: 260px; background: #FAF9F8;">
          <img src="${product.cover_image_url}" style="width: 100%; height: 100%; object-fit: cover;" alt="${product.title}">
        </div>

        <div class="preview-details-info">
          <div class="variant-selector-box">
            <div class="variant-selector-title">
              <i class="fa-solid fa-tags text-pink"></i> 
              <span>${isImage ? 'เลือกขนาดรูปภาพที่ต้องการ:' : 'เลือกรูปแบบชุดใบงาน:'}</span>
            </div>
            <div class="variant-options-list" id="modalVariantsList">
              ${variantsListHtml}
            </div>
          </div>

          <div class="preview-actions-row" style="margin-top: 14px;">
            <button class="btn-primary full-width" id="modalAddToCartBtn" onclick="window.addSelectedVariantToCart()">
              <i class="fa-solid fa-basket-shopping"></i> 
              <span id="modalBtnText">ใส่ตะกร้า ${selectedVariantForModal.price === 0 ? '(ฟรี)' : '฿' + selectedVariantForModal.price}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  previewModal.classList.add("open");
};

window.selectModalVariant = function (variantId) {
  if (!currentPreviewProduct) return;
  const v = (currentPreviewProduct.variants || []).find((item) => item.id === variantId);
  if (!v) return;

  selectedVariantForModal = v;

  document.querySelectorAll(".variant-option-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.variantId === variantId);
  });

  const btnText = document.getElementById("modalBtnText");
  if (btnText) {
    btnText.textContent = v.price === 0 ? "ดาวน์โหลดฟรีทันที" : `ใส่ตะกร้า ฿${v.price}`;
  }
};

window.addSelectedVariantToCart = function () {
  if (!currentPreviewProduct || !selectedVariantForModal) return;

  const cartItem = {
    cartItemId: `${currentPreviewProduct.id}-${selectedVariantForModal.id}`,
    productId: currentPreviewProduct.id,
    variantId: selectedVariantForModal.id,
    title: currentPreviewProduct.title,
    variantName: selectedVariantForModal.name,
    productType: currentPreviewProduct.product_type,
    coverUrl: currentPreviewProduct.cover_image_url,
    downloadUrl: selectedVariantForModal.download_file_url || currentPreviewProduct.download_url || "",
    fileFormat: selectedVariantForModal.file_format || "Digital File",
    price: selectedVariantForModal.price
  };

  const exists = shoppingCart.some((i) => i.cartItemId === cartItem.cartItemId);
  if (exists) {
    showToast(`"${cartItem.title} (${cartItem.variantName})" อยู่ในตะกร้าแล้ว`, "info");
  } else {
    shoppingCart.push(cartItem);
    saveCartToStorage();
    updateCartUI();
    showToast(`เพิ่ม "${cartItem.title} - ${cartItem.variantName}" ลงในตะกร้าเรียบร้อย!`, "success");
  }

  window.closePreviewModal();
  openCartDrawer();
};

window.closePreviewModal = function () {
  if (previewModal) previewModal.classList.remove("open");
};

// ==============================================================================
// 5. Shopping Cart Operations
// ==============================================================================
window.removeFromCart = function (cartItemId) {
  shoppingCart = shoppingCart.filter((i) => i.cartItemId !== cartItemId);
  saveCartToStorage();
  updateCartUI();
  showToast("ลบรายการออกจากตะกร้าแล้ว", "info");
};

function updateCartUI() {
  if (cartCountBadge) cartCountBadge.textContent = shoppingCart.length;
  if (cartTotalItemsCount) cartTotalItemsCount.textContent = `${shoppingCart.length} รายการ`;

  const total = shoppingCart.reduce((sum, item) => sum + item.price, 0);
  if (cartTotalPrice) cartTotalPrice.textContent = `฿${total}`;
  if (checkoutDueAmount) checkoutDueAmount.textContent = `฿${total}`;

  if (checkoutBtn) {
    checkoutBtn.disabled = shoppingCart.length === 0;
  }

  if (!cartItemsContainer) return;

  if (shoppingCart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <div class="cart-empty-icon"><i class="fa-solid fa-basket-shopping"></i></div>
        <h4>ตะกร้าว่างเปล่า</h4>
        <p style="font-size: 0.85rem; margin-top: 4px;">เลือกชมภาพวาดและใบงานน่ารักๆ เพื่อเริ่มต้นครับ</p>
      </div>
    `;
    return;
  }

  cartItemsContainer.innerHTML = shoppingCart
    .map(
      (item) => `
    <div class="cart-item-row">
      <img src="${item.coverUrl || 'https://via.placeholder.com/50'}" class="cart-item-icon" style="object-fit: cover;" onerror="this.src='https://via.placeholder.com/50'">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-price">฿${item.price} <span style="font-size: 0.75rem; color: #94a3b8; font-weight: normal;">(${item.variantName})</span></div>
      </div>
      <button class="cart-item-remove" onclick="window.removeFromCart('${item.cartItemId}')" title="ลบออก">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `
    )
    .join("");
}

function openCartDrawer() {
  if (cartDrawer && cartBackdrop) {
    cartDrawer.classList.add("open");
    cartBackdrop.classList.add("open");
  }
}

function closeCartDrawer() {
  if (cartDrawer && cartBackdrop) {
    cartDrawer.classList.remove("open");
    cartBackdrop.classList.remove("open");
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem("wadfan_cart", JSON.stringify(shoppingCart));
  } catch (e) {
    console.error("Local storage cart error:", e);
  }
}

function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem("wadfan_cart");
    if (saved) {
      shoppingCart = JSON.parse(saved);
      updateCartUI();
    }
  } catch (e) {
    console.error("Failed to load cart storage:", e);
  }
}

// ==============================================================================
// 6. Checkout Flow (Orders & Google Drive File Upload)
// ==============================================================================
function openCheckoutModal() {
  if (shoppingCart.length === 0) return;
  closeCartDrawer();

  // If cart contains image products, show upload section
  const hasImage = shoppingCart.some((i) => i.productType === "image");
  if (checkoutImageUploadBox) {
    checkoutImageUploadBox.style.display = hasImage ? "block" : "none";
  }

  // Toggle Slip upload box based on total amount
  const totalAmount = shoppingCart.reduce((sum, item) => sum + item.price, 0);
  const isFree = totalAmount === 0;
  if (checkoutSlipUploadBox) {
    checkoutSlipUploadBox.style.display = isFree ? "none" : "block";
  }

  // Reset file inputs
  customerAttachedFiles = [];
  renderCustomerFilesPreview();

  customerSlipFile = null;
  if (customerSlipFileInput) customerSlipFileInput.value = "";
  if (slipUploadPreview) slipUploadPreview.style.display = "none";
  if (slipDropzoneText) slipDropzoneText.textContent = "คลิกเพื่อแนบสลิปการโอนเงิน (JPG, PNG)";

  if (checkoutModal) checkoutModal.classList.add("open");
}

function closeCheckoutModal() {
  if (checkoutModal) checkoutModal.classList.remove("open");
}

// Multi-file Attachment Handler for Customer Photos (Up to 100 MB)
function renderCustomerFilesPreview() {
  if (!fileUploadPreview || !dropzoneText) return;

  if (customerAttachedFiles.length === 0) {
    fileUploadPreview.style.display = "none";
    fileUploadPreview.innerHTML = "";
    dropzoneText.textContent = "คลิกเพื่อเลือกรูปภาพจากเครื่อง (เลือกได้หลายรูป รวมไม่เกิน 100 MB)";
    return;
  }

  const totalBytes = customerAttachedFiles.reduce((acc, f) => acc + f.size, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  dropzoneText.textContent = `เลือกแล้ว ${customerAttachedFiles.length} รูป (รวม ${totalMB} MB) - คลิกเพื่อเพิ่มรูปอีก`;
  fileUploadPreview.style.display = "block";

  fileUploadPreview.innerHTML = `
    <div style="background: #FFF0F3; border: 1.5px solid #FBCFE8; border-radius: 12px; padding: 12px; margin-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.85rem; color: #9D174D; font-weight: 600;">
        <span><i class="fa-solid fa-images"></i> รูปภาพที่ลูกค้าแนบ (${customerAttachedFiles.length} รูป)</span>
        <span style="font-size: 0.8rem; color: #64748B; font-weight: normal;">รวม ${totalMB} MB / สูงสุด 100 MB</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; padding-right: 4px;">
        ${customerAttachedFiles
          .map(
            (file, idx) => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: #FFF; border-radius: 8px; border: 1px solid #FBCFE8; font-size: 0.84rem;">
            <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 82%;">
              <i class="fa-solid fa-file-image text-pink"></i>
              <span style="font-weight: 500; color: #334155; overflow: hidden; text-overflow: ellipsis;">${file.name}</span>
              <span style="color: #94A3B8; font-size: 0.76rem;">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
            <button type="button" onclick="window.removeAttachedFile(${idx})" style="color: #EF4444; border: none; background: transparent; font-size: 1.2rem; cursor: pointer; padding: 0 4px;" title="ลบรูปนี้">&times;</button>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `;
}

if (customerImageFileInput) {
  customerImageFileInput.addEventListener("change", (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    let currentTotal = customerAttachedFiles.reduce((acc, f) => acc + f.size, 0);

    for (const file of selectedFiles) {
      if (currentTotal + file.size > MAX_TOTAL_UPLOAD_SIZE) {
        showToast(`ขนาดไฟล์รวมเกิน 100 MB! ไฟล์ "${file.name}" ไม่ถูกเพิ่ม`, "error");
        continue;
      }

      // ป้องกันการเลือกไฟล์ซ้ำชื่อและขนาดเดิม
      if (!customerAttachedFiles.some((f) => f.name === file.name && f.size === file.size)) {
        customerAttachedFiles.push(file);
        currentTotal += file.size;
      }
    }

    // Reset input เพื่อให้กดเลือกเพิ่มได้อีก
    customerImageFileInput.value = "";
    renderCustomerFilesPreview();
  });
}

window.removeAttachedFile = function (index) {
  if (index >= 0 && index < customerAttachedFiles.length) {
    customerAttachedFiles.splice(index, 1);
    renderCustomerFilesPreview();
  }
};

window.clearAttachedFile = function () {
  customerAttachedFiles = [];
  if (customerImageFileInput) customerImageFileInput.value = "";
  renderCustomerFilesPreview();
};

// Payment Slip Attachment Handler
if (customerSlipFileInput) {
  customerSlipFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      customerSlipFile = file;
      if (slipDropzoneText) slipDropzoneText.textContent = `สลิปที่เลือก: ${file.name}`;
      if (slipUploadPreview) {
        slipUploadPreview.style.display = "block";
        slipUploadPreview.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #DCFCE7; border: 1px solid #86EFAC; border-radius: 8px; margin-top: 8px; font-size: 0.85rem;">
            <span><i class="fa-solid fa-file-invoice-dollar text-green"></i> ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            <button type="button" style="color: #EF4444; font-size: 1.2rem; cursor: pointer; border: none; background: transparent;" onclick="window.clearSlipFile()">&times;</button>
          </div>
        `;
      }
    }
  });
}

window.clearSlipFile = function () {
  customerSlipFile = null;
  if (customerSlipFileInput) customerSlipFileInput.value = "";
  if (slipUploadPreview) slipUploadPreview.style.display = "none";
  if (slipDropzoneText) slipDropzoneText.textContent = "คลิกเพื่อแนบสลิปการโอนเงิน (JPG, PNG)";
};

window.handleOrderSubmit = async function () {
  if (isSubmittingOrder) return;

  const submitBtn = document.getElementById("confirmOrderSubmitBtn");
  const loadingOverlay = document.getElementById("checkoutLoadingOverlay");
  const loadingSub = document.getElementById("checkoutLoadingSub");
  const originalBtnContent = submitBtn ? submitBtn.innerHTML : "";

  const name = document.getElementById("orderName").value.trim();
  const email = document.getElementById("orderEmail").value.trim();
  const phone = document.getElementById("orderPhone").value.trim();

  if (!name || !email) {
    showToast("กรุณากรอกชื่อและอีเมลให้ครบถ้วน", "error");
    return;
  }

  const totalAmount = shoppingCart.reduce((sum, item) => sum + item.price, 0);
  const isFree = totalAmount === 0;

  // เริ่มต้นป้องกัน Double Submit และแสดง Loading Spinner ทันที
  isSubmittingOrder = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <i class="fa-solid fa-circle-notch fa-spin" style="margin-right: 8px;"></i>
      <span>กำลังประมวลผลคำสั่งซื้อ... กรุณารอสักครู่</span>
    `;
  }
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex";
  }

  try {
    // 1. อ่านข้อมูลสลิปโอนเงิน (ถ้ามี)
    let slipData = null;
    if (customerSlipFile) {
      if (loadingSub) loadingSub.textContent = "กำลังประมวลผลสลิปโอนเงิน...";
      const slipDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(customerSlipFile);
      });

      slipData = {
        name: customerSlipFile.name,
        size: customerSlipFile.size,
        type: customerSlipFile.type,
        dataUrl: slipDataUrl,
        file_raw: customerSlipFile
      };
    }

    // 2. ประมวลผลรูปภาพทั้งหมดที่ลูกค้าแนบมา (รองรับหลายรูป สูงสุด 100 MB)
    const uploadedFiles = [];
    if (customerAttachedFiles.length > 0) {
      for (let i = 0; i < customerAttachedFiles.length; i++) {
        const file = customerAttachedFiles[i];
        if (loadingSub) {
          loadingSub.textContent = `กำลังประมวลผลรูปภาพ (${i + 1}/${customerAttachedFiles.length}): ${file.name}...`;
        }

        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });

        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type || "image/png",
          dataUrl: dataUrl,
          file_raw: file
        });
      }
    }

    if (loadingSub) {
      loadingSub.textContent = "กำลังบันทึกคำสั่งซื้อและส่งไฟล์ขึ้น Google Drive ของร้าน...";
    }

    // 3. จัดเตรียมรายการสินค้า
    const items = shoppingCart.map((i) => ({
      product_title: i.title,
      variant_name: i.variantName,
      product_type: i.productType || "worksheet",
      download_url: i.downloadUrl || "",
      price: i.price
    }));

    const orderData = {
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      total_amount: totalAmount,
      payment_slip_file: slipData,
      uploaded_files: uploadedFiles
    };

    const result = await window.wadfanData.createOrder(orderData, items);

    if (result.success) {
      // ส่งอีเมลแจ้งเตือนคำสั่งซื้อใหม่ไปยังแอดมิน wongsakorn.pr1996@gmail.com
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: "wongsakorn.pr1996@gmail.com",
          subject: `🎨 [Wadfan Studio] มีคำสั่งซื้อใหม่ #${result.order_number} (${name})`,
          message: `เรียน คุณวรศากร,\n\nมีคำสั่งซื้อใหม่เข้ามาในร้าน Wadfan Studio เรียบร้อยแล้วครับ:\n\n• เลขที่คำสั่งซื้อ: ${result.order_number}\n• ชื่อลูกค้า: ${name}\n• อีเมลลูกค้า: ${email}\n• เบอร์โทร: ${phone || '-'}\n• ยอดชำระ: ฿${totalAmount}\n\nคุณสามารถเข้าจัดการออเดอร์ ดูรูปภาพ และยืนยันการจัดส่งได้ที่:\nhttps://wadfunstudio.vercel.app/admin`
        })
      }).catch(() => {});
    }

    closeCheckoutModal();

    // Reset Cart
    shoppingCart = [];
    saveCartToStorage();
    updateCartUI();

    // Reset File State
    customerAttachedFiles = [];
    customerSlipFile = null;
    renderCustomerFilesPreview();
    if (customerSlipFileInput) customerSlipFileInput.value = "";
    if (slipUploadPreview) slipUploadPreview.style.display = "none";

    // แสดงหน้าต่างขอบคุณสั่งซื้อสำเร็จ
    if (orderSuccessContent && orderSuccessModal) {
      const hasWorksheets = items.some((i) => i.product_type === "worksheet");
      const hasImages = items.some((i) => i.product_type === "image");

      let instructionHtml = "";

      if (isFree) {
        const freeWorksheet = items.find((i) => i.download_url);
        const downloadLink = freeWorksheet ? freeWorksheet.download_url : "https://drive.google.com/drive/folders/wadfan-freebies";
        instructionHtml = `
          <div style="background: #D1FAE5; color: #065F46; padding: 16px; border-radius: 12px; margin: 16px 0; text-align: left;">
            <strong><i class="fa-solid fa-gift"></i> ดาวน์โหลดฟรีได้ทันที:</strong>
            <p style="font-size: 0.9rem; margin-top: 4px;">เราได้เตรียมไฟล์ใน Google Drive ให้คุณแล้ว สามารถคลิกดาวน์โหลดได้ทันทีครับ</p>
            <a href="${downloadLink}" target="_blank" class="btn-primary" style="margin-top: 10px; display: inline-flex;">
              <i class="fa-solid fa-cloud-arrow-down"></i> เปิด Google Drive ดาวน์โหลดไฟล์
            </a>
          </div>
        `;
      } else {
        instructionHtml = `
          <div style="background: #FAF9F8; border: 1px solid #E2E8F0; padding: 16px; border-radius: 12px; margin: 16px 0; text-align: left; font-size: 0.9rem; line-height: 1.6;">
            <p><strong><i class="fa-solid fa-envelope-circle-check text-pink"></i> การจัดส่งไฟล์และสินค้า:</strong></p>
            ${
              hasWorksheets
                ? `<p>📄 <strong>ใบงานออนไลน์:</strong> ทันทีที่แอดมินกดยืนยันยอดชำระเงิน ระบบจะส่งลิงก์ดาวน์โหลดไฟล์ Google Drive ไปยังอีเมล <strong>${email}</strong> อัตโนมัติทันที</p>`
                : ""
            }
            ${
              hasImages
                ? `<p>🎨 <strong>รูปภาพ/งานสั่งทำ:</strong> ทีมงานได้รับไฟล์รูปของคุณ (${uploadedFiles.length} รูป) เรียบร้อยแล้ว และจะแจ้งเลขพัสดุ (Tracking) ทางอีเมลเมื่อทำการจัดส่งครับ</p>`
                : ""
            }
          </div>
        `;
      }

      orderSuccessContent.innerHTML = `
        <div style="font-size: 3.5rem; color: #10B981; margin-bottom: 10px;">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h2 style="font-size: 1.45rem; color: #334155; margin-bottom: 6px;">สั่งซื้อสำเร็จเรียบร้อย!</h2>
        <p style="color: #64748B; font-size: 0.92rem; margin-bottom: 12px;">หมายเลขคำสั่งซื้อของคุณ: <strong style="color: #FF758F;">${result.order_number}</strong></p>
        ${instructionHtml}
        <button class="btn-primary full-width" onclick="document.getElementById('orderSuccessModal').classList.remove('open');">
          <i class="fa-solid fa-check"></i> เสร็จสิ้น
        </button>
      `;

      orderSuccessModal.classList.add("open");
    }

    showToast("บันทึกคำสั่งซื้อของคุณเรียบร้อยแล้ว!", "success");
  } catch (err) {
    console.error("Order submit error:", err);
    showToast(`เกิดข้อผิดพลาด: ${err.message}`, "error");
  } finally {
    // ปลดล็อก Double Submit และซ่อน Loading Overlay
    isSubmittingOrder = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
    }
    if (loadingOverlay) {
      loadingOverlay.style.display = "none";
    }
  }
};

function handleFreebieSubmit() {
  const emailVal = freebieEmail ? freebieEmail.value.trim() : "";
  if (!emailVal || !emailVal.includes("@")) {
    showToast("กรุณากรอกอีเมลที่ถูกต้องเพื่อรับไฟล์ของขวัญ", "info");
    return;
  }

  showToast(`✨ ส่งลิงก์ดาวน์โหลดของขวัญ Google Drive ฟรีไปยัง ${emailVal} แล้ว!`, "success");
  if (freebieEmail) freebieEmail.value = "";
}

// ==============================================================================
// 7. Event Listeners & Accordion
// ==============================================================================
function setupEventListeners() {
  document.querySelectorAll(".main-type-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      window.filterByMainType(tab.dataset.maintype);
    });
  });

  if (filterTabs) {
    filterTabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-btn");
      if (!btn) return;
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategoryFilter = btn.dataset.filter;
      renderProducts();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value;
      renderProducts();
    });
  }

  if (cartBtn) cartBtn.addEventListener("click", openCartDrawer);
  if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCartDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener("click", closeCartDrawer);

  if (modalCloseBtn) modalCloseBtn.addEventListener("click", closePreviewModal);
  if (previewModal) {
    previewModal.addEventListener("click", (e) => {
      if (e.target === previewModal) closePreviewModal();
    });
  }

  if (checkoutBtn) checkoutBtn.addEventListener("click", openCheckoutModal);
  if (checkoutCloseBtn) checkoutCloseBtn.addEventListener("click", closeCheckoutModal);

  if (freebieSubmitBtn) {
    freebieSubmitBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleFreebieSubmit();
    });
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      mobileDrawer.classList.add("open");
      drawerBackdrop.classList.add("open");
    });
  }

  const closeMobileNav = () => {
    mobileDrawer.classList.remove("open");
    drawerBackdrop.classList.remove("open");
  };

  if (drawerCloseBtn) drawerCloseBtn.addEventListener("click", closeMobileNav);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeMobileNav);
  drawerLinks.forEach((l) => l.addEventListener("click", closeMobileNav));

  // Desktop & Mobile Navbar Active Tab Switcher & Scrollspy
  const allNavClickableLinks = document.querySelectorAll(".nav-link, .drawer-link");
  allNavClickableLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // ล็อค scrollspy ไม่ให้เขียนทับค่า active เป็นเวลา 1.2 วินาที ขณะที่หน้าจอกำลัง Smooth Scroll
      isManualNavClick = true;
      if (manualNavTimer) clearTimeout(manualNavTimer);
      manualNavTimer = setTimeout(() => {
        isManualNavClick = false;
      }, 1200);

      // ลบสถานะ active เดิมทั้งหมด
      document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
      document.querySelectorAll(".drawer-link").forEach((l) => l.classList.remove("active"));
      this.classList.add("active");

      // ซิงค์แท็บที่มี href หรือ onclick เดียวกันระหว่าง Desktop และ Mobile Drawer
      const href = this.getAttribute("href");
      const onclickAttr = this.getAttribute("onclick") || "";
      document.querySelectorAll(".nav-link, .drawer-link").forEach((other) => {
        if (other === this) return;
        const otherHref = other.getAttribute("href");
        const otherOnclick = other.getAttribute("onclick") || "";
        if (onclickAttr && otherOnclick === onclickAttr) {
          other.classList.add("active");
        } else if (!onclickAttr && otherHref === href) {
          other.classList.add("active");
        }
      });
    });
  });

  // Accurate Viewport Scrollspy (คำนวณตามตำแหน่งจริงบนจอ)
  window.addEventListener(
    "scroll",
    () => {
      // หากผู้ใช้เพิ่งคลิกเลือกแท็บจากเมนู ห้าม scrollspy มาเขียนทับเด็ดขาด
      if (isManualNavClick) return;

      const scrollY = window.scrollY;

      // หากอยู่ที่บนสุดของหน้า (ภายใน 180px) ให้คงสถานะหน้าแรก
      if (scrollY < 180) {
        document.querySelectorAll(".nav-link").forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === "#hero");
        });
        return;
      }

      const sections = [
        { id: "faq", href: "#faq" },
        { id: "features", href: "#features" },
        { id: "products", href: "#products" },
        { id: "categories", href: "#categories" },
        { id: "hero", href: "#hero" }
      ];

      for (const item of sections) {
        const sec = document.getElementById(item.id);
        if (!sec) continue;
        const rect = sec.getBoundingClientRect();

        // ตรวจสอบว่า Section นี้อยู่ในช่วงมุมมองของสายตา
        if (rect.top <= 250 && rect.bottom >= 150) {
          document.querySelectorAll(".nav-link").forEach((link) => {
            const href = link.getAttribute("href") || "";
            const onclickAttr = link.getAttribute("onclick") || "";

            if (item.id === "products") {
              if (currentMainType === "image" && onclickAttr.includes("'image'")) {
                link.classList.add("active");
              } else if (currentMainType === "worksheet" && onclickAttr.includes("'worksheet'")) {
                link.classList.add("active");
              } else if (currentMainType === "all" && href === "#products" && onclickAttr.includes("'image'")) {
                link.classList.add("active");
              } else {
                link.classList.remove("active");
              }
            } else if (href === item.href && !onclickAttr) {
              link.classList.add("active");
            } else {
              link.classList.remove("active");
            }
          });
          break;
        }
      }
    },
    { passive: true }
  );
}

function setupAccordion() {
  const accordionItems = document.querySelectorAll(".accordion-item");
  accordionItems.forEach((item) => {
    const header = item.querySelector(".accordion-header");
    if (!header) return;

    header.addEventListener("click", () => {
      const isOpen = item.classList.contains("active");
      accordionItems.forEach((other) => other.classList.remove("active"));
      if (!isOpen) item.classList.add("active");
    });
  });
}

function showToast(message, type = "info") {
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="${type === "success" ? "fa-solid fa-circle-check text-green" : "fa-solid fa-circle-info text-blue"}"></i>
    <span>${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(12px)";
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}
