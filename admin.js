/**
 * Wadfan Studio - Admin Management Dashboard Logic v2
 * Comprehensive Features:
 * 1. Admin Authentication Gate (ระบบล็อกอินป้องกันลูกค้า)
 * 2. Product Management (พร้อม Google Drive Download URL)
 * 3. Category Management (สร้าง/แก้ไข/ลบหมวดหมู่ได้เอง)
 * 4. Order Management (ยืนยันชำระเงิน, ส่งลิงก์ Google Drive อัตโนมัติ, บันทึกขนส่ง & Tracking)
 */

// State
let allProducts = [];
let allCategories = [];
let allOrders = [];

let currentAdminTab = "products"; // 'products' | 'categories' | 'orders'
let currentProductTypeFilter = "all";
let productSearchQuery = "";

let currentOrderStatusFilter = "all";
let orderSearchQuery = "";

let editingProductId = null;
let editingCategoryId = null;
let currentViewingOrder = null;

// DOM Elements - Auth
const adminAuthOverlay = document.getElementById("adminAuthOverlay");
const adminMainWrapper = document.getElementById("adminMainWrapper");
const adminPasscode = document.getElementById("adminPasscode");

// Connection Elements
const dbStatusDot = document.getElementById("dbStatusDot");
const dbStatusText = document.getElementById("dbStatusText");
const supabaseSettingsBtn = document.getElementById("supabaseSettingsBtn");
const supabaseModal = document.getElementById("supabaseModal");
const closeSupabaseModalBtn = document.getElementById("closeSupabaseModalBtn");
const supabaseUrlInput = document.getElementById("supabaseUrlInput");
const supabaseKeyInput = document.getElementById("supabaseKeyInput");
const googleScriptUrlInput = document.getElementById("googleScriptUrlInput");
const testConnectionBtn = document.getElementById("testConnectionBtn");
const saveSupabaseConfigBtn = document.getElementById("saveSupabaseConfigBtn");
const connectionTestResult = document.getElementById("connectionTestResult");

// SQL Modal
const openSqlModalBtn = document.getElementById("openSqlModalBtn");
const sqlModal = document.getElementById("sqlModal");
const closeSqlModalBtn = document.getElementById("closeSqlModalBtn");
const sqlCodeBlock = document.getElementById("sqlCodeBlock");
const copySqlBtn = document.getElementById("copySqlBtn");

// Tab 1: Products Elements
const adminProductsTableBody = document.getElementById("adminProductsTableBody");
const adminFilterPills = document.getElementById("adminFilterPills");
const adminSearchInput = document.getElementById("adminSearchInput");
const statTotalProducts = document.getElementById("statTotalProducts");
const statTotalImages = document.getElementById("statTotalImages");
const statTotalWorksheets = document.getElementById("statTotalWorksheets");
const statTotalVariants = document.getElementById("statTotalVariants");
const addNewProductBtn = document.getElementById("addNewProductBtn");
const productModal = document.getElementById("productModal");
const closeProductModalBtn = document.getElementById("closeProductModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const productForm = document.getElementById("productForm");
const modalProductTitle = document.getElementById("modalProductTitle");
const formProductId = document.getElementById("formProductId");

// Form Inputs - Product
const typeRadios = document.querySelectorAll('input[name="product_type"]');
const formCategory = document.getElementById("formCategory");
const formTitle = document.getElementById("formTitle");
const formCoverUrl = document.getElementById("formCoverUrl");
const formDownloadUrl = document.getElementById("formDownloadUrl");
const formTag = document.getElementById("formTag");
const formStatus = document.getElementById("formStatus");
const formShortDesc = document.getElementById("formShortDesc");
const formFullDesc = document.getElementById("formFullDesc");
const imageFieldsBox = document.getElementById("imageFieldsBox");
const worksheetFieldsBox = document.getElementById("worksheetFieldsBox");
const formOrientation = document.getElementById("formOrientation");
const formResolution = document.getElementById("formResolution");
const formPalette = document.getElementById("formPalette");
const formGradeLevel = document.getElementById("formGradeLevel");
const formTotalPages = document.getElementById("formTotalPages");
const formHasAnswerKey = document.getElementById("formHasAnswerKey");
const variantsContainer = document.getElementById("variantsContainer");
const addVariantRowBtn = document.getElementById("addVariantRowBtn");
const applyPresetBtn = document.getElementById("applyPresetBtn");

// Tab 2: Category Elements
const adminCategoriesTableBody = document.getElementById("adminCategoriesTableBody");
const addNewCategoryBtn = document.getElementById("addNewCategoryBtn");
const categoryModal = document.getElementById("categoryModal");
const closeCategoryModalBtn = document.getElementById("closeCategoryModalBtn");
const modalCategoryTitle = document.getElementById("modalCategoryTitle");
const formCategoryId = document.getElementById("formCategoryId");
const categoryNameInput = document.getElementById("categoryNameInput");
const categorySlugInput = document.getElementById("categorySlugInput");
const categoryProductTypeInput = document.getElementById("categoryProductTypeInput");
const categorySortOrderInput = document.getElementById("categorySortOrderInput");

// Tab 3: Orders Elements
const adminOrdersTableBody = document.getElementById("adminOrdersTableBody");
const adminOrderFilterPills = document.getElementById("adminOrderFilterPills");
const adminOrderSearchInput = document.getElementById("adminOrderSearchInput");
const pendingOrdersCountBadge = document.getElementById("pendingOrdersCountBadge");
const orderDetailModal = document.getElementById("orderDetailModal");
const orderDetailModalBody = document.getElementById("orderDetailModalBody");
const emailPreviewModal = document.getElementById("emailPreviewModal");
const emailPreviewModalContent = document.getElementById("emailPreviewModalContent");
const adminToastContainer = document.getElementById("adminToastContainer");

// ==============================================================================
// 1. Initialization & Authentication Gate
// ==============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  checkAdminAuth();
  updateConnectionStatusUI();
  await loadCategories();
  await refreshProductsTable();
  await refreshOrdersTable();
  setupEventListeners();
  loadSqlSchemaPreview();
});

function checkAdminAuth() {
  const isAuth = sessionStorage.getItem("wadfan_admin_auth");
  if (isAuth === "true") {
    if (adminAuthOverlay) adminAuthOverlay.style.display = "none";
    if (adminMainWrapper) adminMainWrapper.style.display = "block";
  } else {
    if (adminAuthOverlay) adminAuthOverlay.style.display = "flex";
    if (adminMainWrapper) adminMainWrapper.style.display = "none";
  }
}

window.handleAdminLogin = function () {
  const passcode = adminPasscode ? adminPasscode.value.trim() : "";
  // รหัสผ่านเริ่มต้นคือ wadfan1234
  if (passcode === "wadfan1234") {
    sessionStorage.setItem("wadfan_admin_auth", "true");
    adminAuthOverlay.style.display = "none";
    adminMainWrapper.style.display = "block";
    showAdminToast("เข้าสู่ระบบผู้ดูแลเรียบร้อยแล้ว", "success");
  } else {
    showAdminToast("รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้นคือ wadfan1234)", "error");
  }
};

window.handleAdminLogout = function () {
  sessionStorage.removeItem("wadfan_admin_auth");
  adminAuthOverlay.style.display = "flex";
  adminMainWrapper.style.display = "none";
  if (adminPasscode) adminPasscode.value = "";
  showAdminToast("ออกจากระบบเรียบร้อยแล้ว", "info");
};

// ==============================================================================
// 2. Navigation Tabs (Products / Categories / Orders)
// ==============================================================================
window.switchAdminTab = function (tabName) {
  currentAdminTab = tabName;

  document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  document.getElementById("tabContentProducts").style.display = tabName === "products" ? "block" : "none";
  document.getElementById("tabContentCategories").style.display = tabName === "categories" ? "block" : "none";
  document.getElementById("tabContentOrders").style.display = tabName === "orders" ? "block" : "none";

  if (tabName === "products") refreshProductsTable();
  else if (tabName === "categories") renderCategoriesTable();
  else if (tabName === "orders") refreshOrdersTable();
};

function updateConnectionStatusUI() {
  const isConnected = window.wadfanData.isSupabaseConnected;
  if (isConnected) {
    dbStatusDot.className = "status-indicator-dot connected";
    dbStatusText.textContent = "เชื่อมต่อ Supabase แล้ว";
  } else {
    dbStatusDot.className = "status-indicator-dot local";
    dbStatusText.textContent = "โหมดฐานข้อมูลจำลอง (Local DB)";
  }
}

// ==============================================================================
// 3. TAB 1: Products Logic (With Google Drive download_url)
// ==============================================================================
async function loadCategories() {
  try {
    allCategories = await window.wadfanData.getCategories();

    if (window.wadfanData.isSupabaseConnected && allCategories.length === 0) {
      console.warn("ไม่พบ Category ใน Supabase, กำลังเพิ่มหมวดหมู่เริ่มต้น...");
      if (typeof window.wadfanData.seedCategoriesToSupabase === "function") {
        await window.wadfanData.seedCategoriesToSupabase();
        allCategories = await window.wadfanData.getCategories();
      }
    }
  } catch (err) {
    allCategories = [];
    console.error("Load Categories Error:", err);
  }
}

async function refreshProductsTable() {
  allProducts = await window.wadfanData.getProducts();
  updateStats();
  renderProductsTable();
}

function updateStats() {
  const total = allProducts.length;
  const images = allProducts.filter((p) => p.product_type === "image").length;
  const worksheets = allProducts.filter((p) => p.product_type === "worksheet").length;
  const totalVariants = allProducts.reduce((sum, p) => sum + (p.variants ? p.variants.length : 0), 0);

  if (statTotalProducts) statTotalProducts.textContent = total;
  if (statTotalImages) statTotalImages.textContent = images;
  if (statTotalWorksheets) statTotalWorksheets.textContent = worksheets;
  if (statTotalVariants) statTotalVariants.textContent = totalVariants;
}

function renderProductsTable() {
  if (!adminProductsTableBody) return;

  const filtered = allProducts.filter((p) => {
    const matchesType = currentProductTypeFilter === "all" || p.product_type === currentProductTypeFilter;
    const q = productSearchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      p.title.toLowerCase().includes(q) ||
      (p.category_name && p.category_name.toLowerCase().includes(q)) ||
      (p.short_desc && p.short_desc.toLowerCase().includes(q));

    return matchesType && matchesSearch;
  });

  if (filtered.length === 0) {
    adminProductsTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 48px 20px; color: #64748b;">
          <i class="fa-solid fa-box-open" style="font-size: 2.2rem; color: #cbd5e1; margin-bottom: 8px; display: block;"></i>
          <strong>ไม่พบข้อมูลสินค้า</strong>
          <p style="font-size: 0.85rem; margin-top: 4px;">ลองเปลี่ยนตัวกรอง หรือกดปุ่ม "เพิ่มสินค้าใหม่" ด้านบน</p>
        </td>
      </tr>
    `;
    return;
  }

  adminProductsTableBody.innerHTML = filtered
    .map((item) => {
      const isImage = item.product_type === "image";
      const typeLabel = isImage ? "รูปภาพดิจิทัล" : "ใบงานการเรียนรู้";
      const typeClass = isImage ? "type-badge-image" : "type-badge-worksheet";
      const typeIcon = isImage ? "fa-palette" : "fa-book-open";

      const variantsHtml = (item.variants || [])
        .map((v) => `<span class="variant-chip">${v.name}: <strong>฿${v.price}</strong></span>`)
        .join("");

      const driveBadge = item.download_url
        ? `<a href="${item.download_url}" target="_blank" class="drive-badge-link" title="${item.download_url}"><i class="fa-brands fa-google-drive"></i> เปิด Drive</a>`
        : `<span style="font-size: 0.78rem; color: #94A3B8;">-</span>`;

      const tableThumbUrl = formatGoogleDriveImageUrl(item.cover_image_url) || 'https://via.placeholder.com/60';
      return `
      <tr>
        <td>
          <img src="${tableThumbUrl}" class="table-prod-thumb" alt="${item.title}" onerror="if(this.src.includes('lh3.googleusercontent.com/d/')){const fid=this.src.split('/d/')[1];this.src='https://drive.google.com/thumbnail?id='+fid+'&sz=w300';}else{this.src='https://via.placeholder.com/60?text=No+Img';}">
        </td>
        <td>
          <div class="table-prod-info">
            <span class="table-prod-title">${item.title}</span>
            <span class="table-prod-meta">${item.short_desc || "ไม่มีคำอธิบายย่อ"}</span>
          </div>
        </td>
        <td>
          <span class="type-badge ${typeClass}">
            <i class="fa-solid ${typeIcon}"></i> ${typeLabel}
          </span>
        </td>
        <td>
          <span style="font-size: 0.85rem; color: #475569;">${item.category_name || "ทั่วไป"}</span>
        </td>
        <td>
          <div class="variant-chips-wrap">
            ${variantsHtml || '<span style="font-size: 0.8rem; color: #94a3b8;">ยังไม่มีขนาด</span>'}
          </div>
        </td>
        <td>${driveBadge}</td>
        <td>
          <span class="status-badge ${item.status === 'active' ? 'status-active' : 'status-draft'}">
            ${item.status === 'active' ? 'เผยแพร่' : 'ฉบับร่าง'}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="action-icon-btn" onclick="window.editProduct('${item.id}')" title="แก้ไข">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="action-icon-btn delete-btn" onclick="window.deleteProduct('${item.id}')" title="ลบสินค้า">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

// แปลงลิงก์แชร์ Google Drive ให้กลายเป็น Direct Image URL ที่นำไปแสดงใน <img> ได้ทันที
function formatGoogleDriveImageUrl(url) {
  if (!url || typeof url !== "string") return url || "";
  const trimmed = url.trim();

  if (trimmed.includes("lh3.googleusercontent.com/d/")) return trimmed;

  if (trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com")) {
    const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                        trimmed.match(/id=([a-zA-Z0-9_-]+)/) ||
                        trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
  }

  return trimmed;
}

function updateCoverUrlPreview(url) {
  const previewBox = document.getElementById("coverUrlPreviewBox");
  const previewImg = document.getElementById("coverUrlPreviewImg");
  const previewStatus = document.getElementById("coverUrlPreviewStatus");
  const previewNote = document.getElementById("coverUrlPreviewNote");

  if (!previewBox || !previewImg) return;

  if (!url || !url.trim()) {
    previewBox.style.display = "none";
    previewImg.src = "";
    return;
  }

  const convertedUrl = formatGoogleDriveImageUrl(url);
  previewBox.style.display = "block";
  previewImg.src = convertedUrl;

  previewImg.onload = function () {
    if (previewStatus) {
      previewStatus.innerHTML = `<i class="fa-solid fa-circle-check text-green"></i> รูปภาพแสดงผลได้สมบูรณ์ (พร้อมใช้งาน)`;
    }
    if (previewNote) {
      previewNote.textContent = convertedUrl.includes("googleusercontent.com")
        ? "แปลงจากลิงก์ Google Drive สำเร็จ รูปภาพเชื่อมต่อเรียบร้อย"
        : "ตรวจสอบลิงก์รูปภาพสำเร็จ พร้อมแสดงในการ์ดสินค้า";
    }
  };

  previewImg.onerror = function () {
    if (previewStatus) {
      previewStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #EAB308;"></i> รูปภาพยังไม่แสดงผล`;
    }
    if (previewNote) {
      previewNote.innerHTML = convertedUrl.includes("googleusercontent.com")
        ? `<strong>คำแนะนำ:</strong> ใน Google Drive ให้คลิกขวาที่รูป &gt; <em>แชร์ (Share)</em> &gt; เปลี่ยนสิทธิ์เป็น <strong>"ทุกคนที่มีลิงก์ (Anyone with the link)"</strong> นะครับ`
        : `กรุณาตรวจสอบว่า URL รูปภาพถูกต้องและสามารถเข้าถึงได้จากอินเทอร์เน็ต`;
    }
  };
}

function openProductModal(product = null) {
  editingProductId = product ? product.id : null;
  formProductId.value = editingProductId || "";

  if (product) {
    modalProductTitle.textContent = "แก้ไขสินค้า";
    formTitle.value = product.title || "";
    formCoverUrl.value = product.cover_image_url || "";
    formDownloadUrl.value = product.download_url || "";
    formTag.value = product.tag || "มาใหม่";
    formStatus.value = product.status || "active";
    formShortDesc.value = product.short_desc || "";
    formFullDesc.value = product.full_desc || "";
    updateCoverUrlPreview(product.cover_image_url || "");

    const currentType = product.product_type || "image";
    switchProductTypeForm(currentType);
    populateCategoryDropdown(currentType, product.category_id);

    const meta = product.metadata || {};
    if (currentType === "image") {
      formOrientation.value = meta.orientation || "portrait";
      formResolution.value = meta.resolution || "";
      formPalette.value = Array.isArray(meta.color_palette) ? meta.color_palette.join(", ") : "";
    } else {
      formGradeLevel.value = meta.grade_level || "";
      formTotalPages.value = meta.total_pages || "";
      formHasAnswerKey.value = meta.has_answer_key ? "true" : "false";
    }

    variantsContainer.innerHTML = "";
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v) => appendVariantRow(v));
    } else {
      appendVariantRow();
    }
  } else {
    modalProductTitle.textContent = "เพิ่มสินค้าใหม่";
    productForm.reset();
    formProductId.value = "";
    formDownloadUrl.value = "";
    switchProductTypeForm("image");
    variantsContainer.innerHTML = "";
    applyDefaultPresets("image");
    updateCoverUrlPreview("");
  }

  productModal.classList.add("open");
}

function closeProductModal() {
  productModal.classList.remove("open");
}

function switchProductTypeForm(type) {
  document.querySelectorAll(".type-radio-card").forEach((card) => {
    const radio = card.querySelector('input[type="radio"]');
    if (radio && radio.value === type) {
      card.classList.add("active");
      radio.checked = true;
    } else {
      card.classList.remove("active");
    }
  });

  populateCategoryDropdown(type);

  if (type === "image") {
    imageFieldsBox.style.display = "block";
    worksheetFieldsBox.style.display = "none";
  } else {
    imageFieldsBox.style.display = "none";
    worksheetFieldsBox.style.display = "block";
  }
}

function populateCategoryDropdown(type, selectedCatId = null) {
  if (!formCategory) return;
  const filteredCats = allCategories.filter((c) => c.product_type === type);

  if (filteredCats.length === 0) {
    formCategory.innerHTML = `<option value="">ไม่มีหมวดหมู่ (กรุณาเพิ่มในแท็บจัดการหมวดหมู่)</option>`;
    return;
  }

  formCategory.innerHTML = filteredCats
    .map((c) => `<option value="${c.id}" ${selectedCatId === c.id ? "selected" : ""}>${c.name}</option>`)
    .join("");
}

function appendVariantRow(variant = null) {
  const row = document.createElement("div");
  row.className = "variant-row";

  const nameVal = variant ? variant.name : "";
  const detailVal = variant ? variant.dimension_or_detail || "" : "";
  const formatVal = variant ? variant.file_format || "PNG/PDF" : "PNG/PDF";
  const priceVal = variant ? variant.price : 49;

  row.innerHTML = `
    <input type="text" class="v-name" placeholder="ชื่อขนาด/แพ็กเกจ (เช่น ขนาด S / PDF)" value="${nameVal}" required>
    <input type="text" class="v-detail" placeholder="มิติ/รายละเอียด (เช่น 1080x1440px หรือ 30 หน้า)" value="${detailVal}">
    <input type="text" class="v-format" placeholder="รูปแบบ (PNG/PDF)" value="${formatVal}">
    <div style="display: flex; align-items: center; gap: 4px;">
      <span style="font-weight: 600; color: #ff758f; font-size: 0.9rem;">฿</span>
      <input type="number" class="v-price" placeholder="ราคา" min="0" value="${priceVal}" required style="width: 100%;">
    </div>
    <button type="button" class="btn-remove-variant" onclick="this.closest('.variant-row').remove()" title="ลบตัวเลือกนี้">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  variantsContainer.appendChild(row);
}

function applyDefaultPresets(type) {
  variantsContainer.innerHTML = "";
  if (type === "image") {
    appendVariantRow({ name: "ขนาด S (Web / Social)", dimension_or_detail: "1080 x 1440 px (72 DPI)", file_format: "JPG/PNG", price: 39 });
    appendVariantRow({ name: "ขนาด M (High-Res Print)", dimension_or_detail: "3000 x 4000 px (300 DPI)", file_format: "PNG", price: 79 });
    appendVariantRow({ name: "พิมพ์ใส่กรอบรูป A4 จัดส่งพัสดุ", dimension_or_detail: "กรอบไม้สีขาว จัดส่ง EMS ถึงบ้าน", file_format: "Physical Frame", price: 299 });
  } else {
    appendVariantRow({ name: "ชุดมาตรฐาน (Standard PDF)", dimension_or_detail: "ขนาด A4 พร้อมแบบฝึกหัด", file_format: "PDF 300 DPI", price: 69 });
    appendVariantRow({ name: "ชุดพรีเมียม (PDF + เฉลยละเอียด)", dimension_or_detail: "รวมแบบฝึกหัด + เฉลยและคู่มือ", file_format: "PDF Pack", price: 89 });
  }
}

async function handleSaveProduct() {
  const selectedType = document.querySelector('input[name="product_type"]:checked').value;
  const title = formTitle.value.trim();
  const categoryId = formCategory.value;
  const coverUrl = formatGoogleDriveImageUrl(formCoverUrl.value.trim());
  const downloadUrl = formDownloadUrl.value.trim();
  const tag = formTag.value;
  const status = formStatus.value;
  const shortDesc = formShortDesc.value.trim();
  const fullDesc = formFullDesc.value.trim();

  let metadata = {};
  if (selectedType === "image") {
    metadata = {
      orientation: formOrientation.value,
      resolution: formResolution.value.trim(),
      color_palette: formPalette.value.split(",").map((c) => c.trim()).filter(Boolean)
    };
  } else {
    metadata = {
      grade_level: formGradeLevel.value.trim(),
      total_pages: parseInt(formTotalPages.value) || 0,
      has_answer_key: formHasAnswerKey.value === "true"
    };
  }

  const variantRows = variantsContainer.querySelectorAll(".variant-row");
  const variants = [];
  variantRows.forEach((row, idx) => {
    const vName = row.querySelector(".v-name").value.trim();
    const vDetail = row.querySelector(".v-detail").value.trim();
    const vFormat = row.querySelector(".v-format").value.trim();
    const vPrice = parseFloat(row.querySelector(".v-price").value) || 0;

    if (vName) {
      variants.push({
        name: vName,
        dimension_or_detail: vDetail,
        file_format: vFormat,
        price: vPrice,
        download_file_url: downloadUrl,
        is_default: idx === 0
      });
    }
  });

  const basePrice = variants.length > 0 ? variants[0].price : 0;
  const matchedCat = allCategories.find((c) => c.id === categoryId);

  const payload = {
    id: editingProductId || undefined,
    title,
    product_type: selectedType,
    category_id: categoryId,
    category_name: matchedCat ? matchedCat.name : "ทั่วไป",
    short_desc: shortDesc,
    full_desc: fullDesc,
    cover_image_url: coverUrl,
    download_url: downloadUrl,
    base_price: basePrice,
    tag,
    status,
    metadata
  };

  const saveBtn = document.getElementById("saveProductBtn");
  const origBtnContent = saveBtn ? saveBtn.innerHTML : "";
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>กำลังบันทึกสินค้า...</span>`;
  }

  try {
    const result = await window.wadfanData.saveProduct(payload, variants);

    if (result.success) {
      showAdminToast("บันทึกข้อมูลสินค้าเรียบร้อยแล้ว", "success");
      closeProductModal();
      await refreshProductsTable();
    } else {
      showAdminToast(`เกิดข้อผิดพลาด: ${result.message}`, "error");
    }
  } catch (err) {
    showAdminToast(`เกิดข้อผิดพลาด: ${err.message}`, "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = origBtnContent;
    }
  }
}

window.editProduct = function (productId) {
  const prod = allProducts.find((p) => p.id === productId);
  if (prod) openProductModal(prod);
};

window.deleteProduct = async function (productId) {
  const prod = allProducts.find((p) => p.id === productId);
  const name = prod ? prod.title : "สินค้านี้";
  if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${name}"?`)) return;

  const res = await window.wadfanData.deleteProduct(productId);
  if (res.success) {
    showAdminToast(`ลบ "${name}" สำเร็จ`, "info");
    await refreshProductsTable();
  } else {
    showAdminToast(`ไม่สามารถลบได้: ${res.message}`, "error");
  }
};

// ==============================================================================
// 4. TAB 2: Categories Logic (เพิ่ม/แก้ไข/ลบหมวดหมู่ได้เอง)
// ==============================================================================
function renderCategoriesTable() {
  if (!adminCategoriesTableBody) return;

  if (allCategories.length === 0) {
    adminCategoriesTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 48px; color: #94A3B8;">
          <i class="fa-solid fa-tags" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
          ยังไม่มีหมวดหมู่สินค้า กดปุ่ม "+ เพิ่มหมวดหมู่ใหม่" ด้านบนเพื่อเริ่มต้น
        </td>
      </tr>
    `;
    return;
  }

  adminCategoriesTableBody.innerHTML = allCategories
    .map(
      (cat, idx) => `
    <tr>
      <td><span style="font-weight: 600; color: #94A3B8;">#${cat.sort_order || idx + 1}</span></td>
      <td><strong style="color: #334155; font-size: 0.95rem;">${cat.name}</strong></td>
      <td><code style="background: #F1F5F9; padding: 3px 8px; border-radius: 6px; font-size: 0.85rem;">${cat.slug}</code></td>
      <td>
        <span class="type-badge ${cat.product_type === 'image' ? 'type-badge-image' : 'type-badge-worksheet'}">
          <i class="fa-solid ${cat.product_type === 'image' ? 'fa-palette' : 'fa-book-open'}"></i>
          ${cat.product_type === 'image' ? 'รูปภาพดิจิทัล' : 'ใบงานการเรียนรู้'}
        </span>
      </td>
      <td>
        <div class="table-actions">
          <button class="action-icon-btn" onclick="window.editCategory('${cat.id}')" title="แก้ไขหมวดหมู่">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="action-icon-btn delete-btn" onclick="window.deleteCategory('${cat.id}')" title="ลบหมวดหมู่">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join("");
}

window.autoGenerateCategorySlug = function (text) {
  if (editingCategoryId) return;
  // สร้าง slug ภาษาอังกฤษแบบง่าย หรือทับศัพท์
  const clean = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (clean && categorySlugInput) categorySlugInput.value = clean;
};

function openCategoryModal(cat = null) {
  editingCategoryId = cat ? cat.id : null;
  formCategoryId.value = editingCategoryId || "";

  if (cat) {
    modalCategoryTitle.textContent = "แก้ไขหมวดหมู่";
    categoryNameInput.value = cat.name;
    categorySlugInput.value = cat.slug;
    categoryProductTypeInput.value = cat.product_type;
    categorySortOrderInput.value = cat.sort_order || 1;
  } else {
    modalCategoryTitle.textContent = "เพิ่มหมวดหมู่ใหม่";
    document.getElementById("categoryForm").reset();
    formCategoryId.value = "";
    categorySortOrderInput.value = allCategories.length + 1;
  }

  categoryModal.classList.add("open");
}

window.editCategory = function (catId) {
  const cat = allCategories.find((c) => c.id === catId);
  if (cat) openCategoryModal(cat);
};

window.handleSaveCategory = async function () {
  const name = categoryNameInput.value.trim();
  const slug = categorySlugInput.value.trim().toLowerCase();
  const product_type = categoryProductTypeInput.value;
  const sort_order = parseInt(categorySortOrderInput.value) || 0;

  if (!name || !slug) {
    showAdminToast("กรุณากรอกชื่อและ Slug ของหมวดหมู่ให้ครบถ้วน", "error");
    return;
  }

  const payload = {
    id: editingCategoryId || undefined,
    name,
    slug,
    product_type,
    sort_order
  };

  const saveCatBtn = document.getElementById("saveCategoryBtn");
  const origCatBtn = saveCatBtn ? saveCatBtn.innerHTML : "";
  if (saveCatBtn) {
    saveCatBtn.disabled = true;
    saveCatBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>กำลังบันทึกหมวดหมู่...</span>`;
  }

  try {
    const res = await window.wadfanData.saveCategory(payload);
    if (res.success) {
      showAdminToast("บันทึกหมวดหมู่เรียบร้อยแล้ว", "success");
      categoryModal.classList.remove("open");
      await loadCategories();
      renderCategoriesTable();
    } else {
      showAdminToast(`เกิดข้อผิดพลาด: ${res.message}`, "error");
    }
  } catch (err) {
    showAdminToast(`เกิดข้อผิดพลาด: ${err.message}`, "error");
  } finally {
    if (saveCatBtn) {
      saveCatBtn.disabled = false;
      saveCatBtn.innerHTML = origCatBtn;
    }
  }
};

window.deleteCategory = async function (catId) {
  const cat = allCategories.find((c) => c.id === catId);
  if (!cat) return;
  if (!confirm(`คุณต้องการลบหมวดหมู่ "${cat.name}" หรือไม่?`)) return;

  const res = await window.wadfanData.deleteCategory(catId);
  if (res.success) {
    showAdminToast(`ลบหมวดหมู่ "${cat.name}" สำเร็จ`, "info");
    await loadCategories();
    renderCategoriesTable();
  } else {
    showAdminToast(`ไม่สามารถลบได้: ${res.message}`, "error");
  }
};

// ==============================================================================
// 5. TAB 3: Orders Logic (ยืนยันชำระ, ส่ง Drive Link, ใส่ Tracking)
// ==============================================================================
async function refreshOrdersTable() {
  allOrders = await window.wadfanData.getOrders();

  // Pending count badge
  const pendingCount = allOrders.filter((o) => o.payment_status === "pending").length;
  if (pendingOrdersCountBadge) {
    if (pendingCount > 0) {
      pendingOrdersCountBadge.style.display = "inline-block";
      pendingOrdersCountBadge.textContent = pendingCount;
    } else {
      pendingOrdersCountBadge.style.display = "none";
    }
  }

  renderOrdersTable();
}

function renderOrdersTable() {
  if (!adminOrdersTableBody) return;

  const filtered = allOrders.filter((o) => {
    const isShippedOrder = o.payment_status === "shipped" || (o.tracking_number && o.tracking_number.trim() !== "");
    const matchesStatus =
      currentOrderStatusFilter === "all" ||
      (currentOrderStatusFilter === "shipped" && isShippedOrder) ||
      (currentOrderStatusFilter === "paid" && o.payment_status === "paid" && !isShippedOrder) ||
      (currentOrderStatusFilter === o.payment_status);
    const q = orderSearchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_email.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  if (filtered.length === 0) {
    adminOrdersTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 48px; color: #94A3B8;">
          <i class="fa-solid fa-receipt" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
          ยังไม่มีรายการคำสั่งซื้อในสถานะนี้
        </td>
      </tr>
    `;
    return;
  }

  adminOrdersTableBody.innerHTML = filtered
    .map((o) => {
      let statusBadge = "";
      if (o.payment_status === "shipped" || (o.tracking_number && o.tracking_number.trim() !== "")) {
        statusBadge = `<span class="status-badge status-shipped"><i class="fa-solid fa-truck"></i> จัดส่งแล้ว (${o.tracking_carrier || 'พัสดุ'})</span>`;
      } else if (o.payment_status === "paid") {
        statusBadge = `<span class="status-badge status-paid"><i class="fa-solid fa-circle-check"></i> ชำระแล้ว / ส่งไฟล์แล้ว</span>`;
      } else {
        statusBadge = `<span class="status-badge status-pending"><i class="fa-solid fa-clock"></i> รอตรวจสอบชำระเงิน</span>`;
      }

      // Customer files indicator (สามารถคลิกเปิดโฟลเดอร์ Google Drive จากตารางได้ทันที)
      const filesCount = o.customer_uploaded_files ? o.customer_uploaded_files.length : 0;
      let filesBadge = "";
      if (o.google_drive_folder_url) {
        filesBadge = `
          <a href="${o.google_drive_folder_url}" target="_blank" class="file-chip-drive-link" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #E8F5E9; color: #166534; border: 1.5px solid #86EFAC; border-radius: 99px; text-decoration: none; font-weight: 600; font-size: 0.82rem; transition: all 0.2s; box-shadow: 0 2px 6px rgba(22, 101, 52, 0.1);" title="คลิกเพื่อเปิดโฟลเดอร์ Google Drive ของออเดอร์นี้">
            <i class="fa-brands fa-google-drive" style="color: #16A34A; font-size: 0.95rem;"></i>
            <span>${filesCount > 0 ? filesCount : 1} ไฟล์ใน Drive</span>
            <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem; color: #166534;"></i>
          </a>
        `;
      } else if (filesCount > 0) {
        filesBadge = `
          <a href="javascript:void(0)" onclick="window.openOrderDetailModal('${o.id}')" class="file-chip-drive-link" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #E0F2FE; color: #0369A1; border: 1.5px solid #7DD3FC; border-radius: 99px; text-decoration: none; font-weight: 600; font-size: 0.82rem; transition: all 0.2s; box-shadow: 0 2px 6px rgba(3, 105, 161, 0.1);" title="คลิกเพื่อเปิดดูไฟล์แนบของออเดอร์นี้">
            <i class="fa-brands fa-google-drive" style="color: #0284C7; font-size: 0.95rem;"></i>
            <span>${filesCount} ไฟล์แนบ</span>
            <i class="fa-solid fa-eye" style="font-size: 0.72rem;"></i>
          </a>
        `;
      } else {
        filesBadge = `<span style="font-size: 0.8rem; color: #94A3B8;">ไม่มีไฟล์แนบ</span>`;
      }

      const itemsSummary = (o.items || [])
        .map((i) => `<div style="font-size: 0.85rem; color: #334155;">• ${i.product_title} (${i.variant_name})</div>`)
        .join("");

      return `
      <tr>
        <td><strong style="color: #FF758F; font-size: 0.95rem;">${o.order_number}</strong><br><small style="color: #94A3B8;">${new Date(o.created_at).toLocaleString('th-TH')}</small></td>
        <td>
          <div style="font-weight: 600; color: #334155;">${o.customer_name}</div>
          <small style="color: #64748B;"><i class="fa-regular fa-envelope"></i> ${o.customer_email}</small><br>
          <small style="color: #64748B;"><i class="fa-solid fa-phone"></i> ${o.customer_phone || '-'}</small>
        </td>
        <td>
          <span class="type-badge ${o.order_type === 'image' ? 'type-badge-image' : 'type-badge-worksheet'}">
            ${o.order_type === 'image' ? '🎨 รูปภาพ' : o.order_type === 'worksheet' ? '📄 ใบงาน' : 'ผสม (รูป+ใบงาน)'}
          </span>
        </td>
        <td><div style="max-width: 260px;">${itemsSummary || '-'}</div></td>
        <td><strong style="color: #FF758F; font-size: 1.05rem;">฿${o.total_amount}</strong></td>
        <td>${filesBadge}</td>
        <td>${statusBadge}</td>
        <td>
          <div class="table-actions">
            <button class="btn-primary btn-sm" onclick="window.openOrderDetailModal('${o.id}')">
              <i class="fa-solid fa-eye"></i> จัดการคำสั่งซื้อ
            </button>
          </div>
        </td>
      </tr>
    `;
    })
    .join("");
}

window.openOrderDetailModal = function (orderId) {
  const order = allOrders.find((o) => o.id === orderId);
  if (!order || !orderDetailModalBody) return;

  currentViewingOrder = order;

  const hasWorksheets = (order.items || []).some((i) => i.product_type === "worksheet");
  const hasImages = (order.items || []).some((i) => i.product_type === "image");
  const isPaid = order.payment_status === "paid" || order.payment_status === "shipped";
  const isShipped = order.payment_status === "shipped";

  // Uploaded files list with preview & download actions
  const filesListHtml = (order.customer_uploaded_files || [])
    .map(
      (f, idx) => `
    <div class="customer-file-card" style="background: #FFF; padding: 14px; border-radius: 12px; border: 1.5px solid #BAE6FD; margin-top: 10px; box-shadow: 0 2px 8px rgba(79, 163, 209, 0.08);">
      <div style="display: flex; gap: 14px; align-items: center;">
        ${
          f.file_url
            ? `<div style="position: relative; width: 80px; height: 80px; flex-shrink: 0; cursor: pointer; border-radius: 8px; overflow: hidden; border: 1px solid #CBD5E1;" onclick="window.openImageFull('${f.file_url}')" title="คลิกเพื่อดูรูปขนาดเต็ม">
                 <img src="${f.file_url}" style="width: 100%; height: 100%; object-fit: cover;">
                 <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.65rem; padding: 1px 4px; border-radius: 4px;"><i class="fa-solid fa-magnifying-glass-plus"></i> ขยาย</span>
               </div>`
            : `<div style="width: 60px; height: 60px; background: #F1F5F9; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #64748B;"><i class="fa-solid fa-file-image"></i></div>`
        }
        <div style="flex-grow: 1;">
          <div style="font-weight: 600; color: #0284C7; font-size: 0.95rem; word-break: break-all;">
            <i class="fa-solid fa-file-image"></i> ${f.file_name} <span style="font-size: 0.8rem; color: #64748B; font-weight: normal;">(${f.file_size || ''})</span>
          </div>
          <div style="font-size: 0.78rem; color: #64748B; margin-top: 4px;">
            📁 บันทึกลง: <code>${f.google_drive_path}</code>
          </div>

          <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
            ${
              f.file_url
                ? `
              <button type="button" class="btn-primary btn-sm" onclick="window.openImageFull('${f.file_url}')" style="font-size: 0.8rem; padding: 5px 14px;">
                <i class="fa-solid fa-eye"></i> ดูรูปภาพต้นฉบับ
              </button>
              <a href="${f.file_url}" download="${f.file_name}" class="btn-secondary btn-sm" style="font-size: 0.8rem; padding: 5px 14px;">
                <i class="fa-solid fa-download"></i> ดาวน์โหลดลงเครื่อง
              </a>
            `
                : `<span style="font-size: 0.8rem; color: #DC2626;">(ออเดอร์นี้ทำรายการก่อนอัปเดตระบบไฟล์ กรุณาทดสอบสั่งใหม่อีกครั้งเพื่อเปิดดูรูปจริงได้ทันที)</span>`
            }
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  // Create Gmail forward link to wongsakorn.pr1996@gmail.com
  const adminEmail = "wongsakorn.pr1996@gmail.com";
  const gmailSubject = encodeURIComponent(`[Wadfan Studio] คำสั่งซื้อใหม่: ${order.order_number} (${order.customer_name})`);
  const gmailBodyText = encodeURIComponent(
    `เรียน คุณวรศากร (แอดมิน Wadfan Studio),\n\n` +
    `มีคำสั่งซื้อใหม่เข้ามาในระบบ รายละเอียดดังนี้ครับ:\n` +
    `=========================================\n` +
    `• เลขคำสั่งซื้อ: ${order.order_number}\n` +
    `• วันที่สั่งซื้อ: ${new Date(order.created_at).toLocaleString('th-TH')}\n` +
    `• ลูกค้า: ${order.customer_name}\n` +
    `• อีเมล: ${order.customer_email}\n` +
    `• เบอร์โทรศัพท์: ${order.customer_phone || '-'}\n` +
    `• ยอดชำระสุทธิ: ฿${order.total_amount}\n` +
    `• สถานะการชำระ: ${order.payment_status}\n` +
    `=========================================\n` +
    `รายการสินค้าที่สั่งซื้อ:\n` +
    (order.items || []).map((i) => ` - ${i.product_title} (${i.variant_name}) ราคา ฿${i.price}`).join('\n') +
    `\n=========================================\n` +
    (order.customer_uploaded_files && order.customer_uploaded_files.length > 0
      ? `รูปภาพที่ลูกค้าแนบมา:\n` +
        order.customer_uploaded_files
          .map(
            (f) =>
              ` • ไฟล์: ${f.file_name} (${f.file_size || ''})\n   ลิงก์เปิดดูรูป: ${f.file_url || '(ยังไม่มีลิงก์รูป)'}\n   โฟลเดอร์ Drive: ${f.google_drive_path}`
          )
          .join('\n')
      : `(ไม่มีไฟล์รูปแนบ)`) +
    `\n=========================================\n` +
    `เปิดระบบจัดการหลังบ้าน: https://your-domain.vercel.app/admin\n`
  );

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(adminEmail)}&su=${gmailSubject}&body=${gmailBodyText}`;

  // Items list
  const itemsListHtml = (order.items || [])
    .map(
      (i) => `
    <div class="order-item-card">
      <div>
        <strong>${i.product_title}</strong>
        <div style="font-size: 0.8rem; color: #64748B;">ตัวเลือก: ${i.variant_name}</div>
        ${i.download_url ? `<a href="${i.download_url}" target="_blank" style="font-size: 0.78rem; color: #0284C7;"><i class="fa-brands fa-google-drive"></i> ดูไฟล์ใบงานใน Google Drive</a>` : ''}
      </div>
      <div style="font-weight: 700; color: #FF758F;">฿${i.price}</div>
    </div>
  `
    )
    .join("");

  orderDetailModalBody.innerHTML = `
    <div class="order-detail-grid">
      
      <!-- Left Box: Order & Customer Details -->
      <div class="order-customer-box">
        <h3 class="order-box-title"><i class="fa-solid fa-receipt text-blue"></i> ข้อมูลคำสั่งซื้อ: ${order.order_number}</h3>
        
        ${
          order.google_drive_folder_url
            ? `
          <div style="margin-bottom: 16px;">
            <a href="${order.google_drive_folder_url}" target="_blank" class="btn-primary full-width" style="background: linear-gradient(135deg, #0F9D58, #34A853); color: #FFF; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 16px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(15, 157, 88, 0.25);">
              <i class="fa-brands fa-google-drive" style="font-size: 1.25rem;"></i> เปิดโฟลเดอร์ Google Drive ของออเดอร์นี้
            </a>
          </div>
        `
            : ''
        }

        <p style="font-size: 0.9rem; margin-bottom: 6px;"><strong>ลูกค้า:</strong> ${order.customer_name}</p>
        <p style="font-size: 0.9rem; margin-bottom: 6px;"><strong>อีเมล:</strong> ${order.customer_email}</p>
        <p style="font-size: 0.9rem; margin-bottom: 14px;"><strong>เบอร์โทร:</strong> ${order.customer_phone || '-'}</p>

        <h4 style="font-size: 0.95rem; margin-top: 14px; color: #334155;"><i class="fa-solid fa-basket-shopping text-pink"></i> รายการสินค้าที่สั่งซื้อ:</h4>
        <div class="order-item-list">
          ${itemsListHtml}
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 14px; padding-top: 12px; border-top: 1px dashed #CBD5E1; font-weight: 700; font-size: 1.15rem;">
          <span>ยอดรวมสุทธิ</span>
          <span style="color: #FF758F;">฿${order.total_amount}</span>
        </div>

        <!-- Payment Slip Section (หลักฐานการโอนเงิน) -->
        ${
          order.payment_slip_url
            ? `
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #E2E8F0;">
            <h4 style="font-size: 0.92rem; color: #15803D; margin-bottom: 10px;">
              <i class="fa-solid fa-file-invoice-dollar text-green"></i> หลักฐานการโอนเงิน (สลิป PromptPay):
            </h4>
            <div style="background: #F0FDF4; border: 1.5px solid #86EFAC; border-radius: 12px; padding: 12px; display: flex; gap: 14px; align-items: center;">
              <div style="position: relative; width: 80px; height: 80px; flex-shrink: 0; cursor: pointer; border-radius: 8px; overflow: hidden; border: 1px solid #86EFAC;" onclick="window.openImageFull('${order.payment_slip_url}')" title="คลิกเพื่อดูสลิปขนาดเต็ม">
                <img src="${order.payment_slip_url}" style="width: 100%; height: 100%; object-fit: cover;">
                <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.65rem; padding: 1px 4px; border-radius: 4px;"><i class="fa-solid fa-magnifying-glass-plus"></i> ขยาย</span>
              </div>
              <div style="flex-grow: 1;">
                <div style="font-weight: 600; color: #166534; font-size: 0.95rem;">
                  <i class="fa-solid fa-circle-check text-green"></i> แนบสลิปโอนเงินเรียบร้อย
                </div>
                <div style="font-size: 0.78rem; color: #64748B; margin-top: 3px;">
                  ยอดที่ต้องชำระ: <strong>฿${order.total_amount}</strong>
                </div>
                <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                  <button type="button" class="btn-primary btn-sm" onclick="window.openImageFull('${order.payment_slip_url}')" style="background: #16A34A; font-size: 0.8rem; padding: 5px 12px;">
                    <i class="fa-solid fa-eye"></i> ตรวจสอบสลิปขนาดเต็ม
                  </button>
                  <a href="${order.payment_slip_url}" download="slip-${order.order_number}.jpg" class="btn-secondary btn-sm" style="font-size: 0.8rem; padding: 5px 12px;">
                    <i class="fa-solid fa-download"></i> ดาวน์โหลดสลิป
                  </a>
                </div>
              </div>
            </div>
          </div>
        `
            : order.total_amount > 0
            ? `
          <div style="margin-top: 14px; padding: 10px; background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; font-size: 0.82rem; color: #92400E;">
            <i class="fa-solid fa-circle-info"></i> ลูกค้าไม่ได้แนบสลิปโอนเงินผ่านหน้าเว็บ
          </div>
        `
            : ''
        }

        <!-- Customer Uploaded Files (รูปภาพงานสั่งทำ) -->
        ${
          order.customer_uploaded_files && order.customer_uploaded_files.length > 0
            ? `
          <div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #E2E8F0;">
            <h4 style="font-size: 0.92rem; color: #0369A1;"><i class="fa-brands fa-google-drive"></i> รูปภาพที่ลูกค้าแนบมา (บันทึกลง Google Drive แล้ว):</h4>
            ${filesListHtml}
          </div>
        `
            : ''
        }
      </div>

      <!-- Right Box: Actions (Confirm Payment / Drive Email Delivery / Shipping Tracking) -->
      <div class="order-action-box">
        <h3 class="order-box-title"><i class="fa-solid fa-sliders text-pink"></i> ดำเนินการคำสั่งซื้อ</h3>

        <!-- Status 1: Confirmation & Google Drive Delivery -->
        <div style="background: #FFF; padding: 16px; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 16px;">
          <h4 style="font-size: 0.95rem; margin-bottom: 6px;">
            <i class="fa-solid fa-circle-check text-green"></i> 1. ตรวจสอบ & ยืนยันการชำระเงิน
          </h4>
          <p style="font-size: 0.82rem; color: #64748B; margin-bottom: 12px;">
            เมื่อกดยืนยัน ระบบจะปรับสถานะเป็น "ชำระเงินแล้ว" และส่งอีเมลแนบลิงก์ Google Drive ให้ลูกค้าทันที
          </p>

          ${
            isPaid
              ? `<div style="background: #D1FAE5; color: #065F46; padding: 10px; border-radius: 8px; font-size: 0.88rem; font-weight: 600;"><i class="fa-solid fa-check"></i> ได้รับการยืนยันชำระเงินแล้ว</div>`
              : `<button class="btn-primary full-width" onclick="window.confirmPaymentAction('${order.id}')">
                   <i class="fa-solid fa-envelope-circle-check"></i> ยืนยันชำระเงิน & ส่งลิงก์ Drive ทันที
                 </button>`
          }
        </div>

        <!-- Status 2: Image Shipping Tracking -->
        ${
          hasImages
            ? `
          <div class="tracking-input-group">
            <h4 style="font-size: 0.95rem; color: #1E293B;">
              <i class="fa-solid fa-truck-fast text-blue"></i> 2. บันทึกเลขพัสดุ (สำหรับส่งรูปภาพ)
            </h4>
            <p style="font-size: 0.82rem; color: #64748B;">
              ใส่ข้อมูลขนส่งเพื่อส่งอีเมลแจ้งเลข Tracking ให้ลูกค้านำไปตรวจสอบ
            </p>

            <div class="form-group">
              <label class="form-label">บริษัทขนส่ง</label>
              <select id="modalTrackingCarrier">
                <option value="Kerry Express" ${order.tracking_carrier === 'Kerry Express' ? 'selected' : ''}>Kerry Express</option>
                <option value="Flash Express" ${order.tracking_carrier === 'Flash Express' ? 'selected' : ''}>Flash Express</option>
                <option value="ไปรษณีย์ไทย (EMS)" ${order.tracking_carrier === 'ไปรษณีย์ไทย (EMS)' ? 'selected' : ''}>ไปรษณีย์ไทย (EMS)</option>
                <option value="J&T Express" ${order.tracking_carrier === 'J&T Express' ? 'selected' : ''}>J&T Express</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">หมายเลขพัสดุ (Tracking Number)</label>
              <input type="text" id="modalTrackingNumber" value="${order.tracking_number || ''}" placeholder="เช่น TH0123456789A">
            </div>

            <button class="btn-secondary full-width" onclick="window.saveTrackingAction('${order.id}')">
              <i class="fa-solid fa-paper-plane"></i> บันทึก & ส่งอีเมลแจ้งเลขพัสดุ
            </button>
          </div>
        `
            : ''
        }

        <!-- Email Notification History Button -->
        <button class="btn-secondary full-width" style="margin-top: 14px;" onclick="window.showEmailHistoryModal('${order.id}')">
          <i class="fa-solid fa-clock-rotate-left"></i> ดูประวัติอีเมลที่ระบบส่งอัตโนมัติ (${(order.email_notification_log || []).length} ฉบับ)
        </button>

        <!-- Direct Gmail Backup / Forward Button -->
        <a href="${gmailComposeUrl}" target="_blank" class="btn-primary full-width" style="margin-top: 10px; background: linear-gradient(135deg, #EA4335, #FF758F); color: #FFF; text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fa-brands fa-google"></i> ส่งสรุปออเดอร์นี้เข้า Gmail (${adminEmail})
        </a>

      </div>

    </div>
  `;

  orderDetailModal.classList.add("open");
};

window.openImageFull = function (url) {
  if (!url) return;
  
  // สร้าง Lightbox Overlay ในหน้าเว็บโดยตรง ไม่โดน Popup Blocker กวนใจ
  let lightbox = document.getElementById("wadfanImageLightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "wadfanImageLightbox";
    lightbox.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.92); z-index: 99999;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 20px; backdrop-filter: blur(8px);
    `;
    document.body.appendChild(lightbox);
  }

  lightbox.innerHTML = `
    <div style="position: absolute; top: 20px; right: 24px; display: flex; gap: 12px; z-index: 10;">
      <a href="${url}" download="customer-upload.png" target="_blank" style="background: #0284C7; color: #fff; padding: 10px 20px; border-radius: 99px; text-decoration: none; font-weight: 600; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(2,132,199,0.3); display: flex; align-items: center; gap: 6px;">
        <i class="fa-solid fa-download"></i> ดาวน์โหลดรูปลงเครื่อง
      </a>
      <button onclick="document.getElementById('wadfanImageLightbox').style.display='none'" style="background: rgba(255,255,255,0.2); color: #fff; border: none; font-size: 1.5rem; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
        &times;
      </button>
    </div>
    <div style="max-width: 90vw; max-height: 82vh; display: flex; align-items: center; justify-content: center;" onclick="event.stopPropagation()">
      <img src="${url}" alt="Customer Upload" style="max-width: 100%; max-height: 82vh; object-fit: contain; border-radius: 12px; box-shadow: 0 16px 48px rgba(0,0,0,0.5); border: 2px solid rgba(255,255,255,0.15);">
    </div>
    <div style="color: #94A3B8; font-size: 0.85rem; margin-top: 14px;">
      คลิกพื้นที่ว่างรอบรูป หรือกดกากบาทด้านบนเพื่อปิดหน้าต่าง
    </div>
  `;

  lightbox.style.display = "flex";
  lightbox.onclick = () => { lightbox.style.display = "none"; };
};

window.confirmPaymentAction = async function (orderId) {
  const btn = event && event.target ? event.target.closest("button") : null;
  const originalBtn = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังยืนยัน...`;
  }

  try {
    const res = await window.wadfanData.confirmOrderPayment(orderId);
    if (res.success) {
      showAdminToast("ยืนยันชำระเงินและส่งอีเมลลิงก์ Google Drive สำเร็จแล้ว!", "success");
      await refreshOrdersTable();
      window.openOrderDetailModal(orderId);

      // Show Email Preview
      if (res.emailSent) {
        window.previewSentEmail(res.emailSent);
      }
    } else {
      showAdminToast(`เกิดข้อผิดพลาด: ${res.message}`, "error");
    }
  } catch (err) {
    showAdminToast(`เกิดข้อผิดพลาด: ${err.message}`, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtn;
    }
  }
};

window.saveTrackingAction = async function (orderId) {
  const carrier = document.getElementById("modalTrackingCarrier").value;
  const trackingNumber = document.getElementById("modalTrackingNumber").value.trim();

  if (!trackingNumber) {
    showAdminToast("กรุณากรอกเลขพัสดุ", "error");
    return;
  }

  const btn = event && event.target ? event.target.closest("button") : null;
  const originalBtn = btn ? btn.innerHTML : "";
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...`;
  }

  try {
    const res = await window.wadfanData.updateOrderTracking(orderId, carrier, trackingNumber);
    if (res.success) {
      showAdminToast("บันทึกเลขพัสดุและส่งอีเมลแจ้งลูกค้าเรียบร้อยแล้ว!", "success");
      await refreshOrdersTable();
      window.openOrderDetailModal(orderId);

      if (res.emailSent) {
        window.previewSentEmail(res.emailSent);
      }
    } else {
      showAdminToast(`เกิดข้อผิดพลาด: ${res.message}`, "error");
    }
  } catch (err) {
    showAdminToast(`เกิดข้อผิดพลาด: ${err.message}`, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtn;
    }
  }
};

window.lastGeneratedEmailBodyText = "";

window.previewSentEmail = function (emailData) {
  if (!emailPreviewModalContent || !emailPreviewModal) return;

  // ลองส่งอัตโนมัติผ่าน Vercel Serverless API (หากผู้ใช้ตั้งค่า Resend ใน Vercel ไว้)
  fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailData)
  })
    .then((r) => r.json())
    .then((res) => {
      if (res.success) {
        showAdminToast("ระบบได้ส่งอีเมลอัตโนมัติหาลูกค้าสำเร็จแล้ว!", "success");
      }
    })
    .catch(() => {});

  let trackingUrl = "";
  if (emailData.carrier && emailData.tracking_number) {
    const c = emailData.carrier.toLowerCase();
    if (c.includes("kerry")) trackingUrl = `https://th.kerryexpress.com/th/track/?track=${emailData.tracking_number}`;
    else if (c.includes("flash")) trackingUrl = `https://www.flashexpress.co.th/tracking/?se=${emailData.tracking_number}`;
    else if (c.includes("ems") || c.includes("ไปรษณีย์")) trackingUrl = `https://track.thailandpost.co.th/?trackNumber=${emailData.tracking_number}`;
    else if (c.includes("j&t") || c.includes("jt")) trackingUrl = `https://www.jtexpress.co.th/index/query/gzquery.html?bills=${emailData.tracking_number}`;
  }

  let emailBodyPlain = (emailData.message || "") + "\n\n";

  if (emailData.download_links && emailData.download_links.length > 0) {
    emailBodyPlain += "📁 ลิงก์ดาวน์โหลดใบงานของคุณจาก Google Drive:\n";
    emailData.download_links.forEach((l) => {
      emailBodyPlain += ` • ${l.title}\n   คลิกดาวน์โหลด: ${l.url}\n\n`;
    });
  }

  if (emailData.tracking_number) {
    emailBodyPlain += "🚚 ข้อมูลการจัดส่งพัสดุ:\n";
    emailBodyPlain += ` • บริษัทขนส่ง: ${emailData.carrier || "Kerry Express"}\n`;
    emailBodyPlain += ` • หมายเลขพัสดุ: ${emailData.tracking_number}\n`;
    if (trackingUrl) {
      emailBodyPlain += ` • ลิงก์ติดตามพัสดุ: ${trackingUrl}\n`;
    }
    emailBodyPlain += "\n";
  }

  emailBodyPlain += "ขอบคุณที่สนับสนุนร้าน Wadfan Studio (วาดฝัน สตูดิโอ) ครับ\n";
  window.lastGeneratedEmailBodyText = emailBodyPlain;

  const customerGmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailData.recipient || "")}&su=${encodeURIComponent(emailData.subject || "")}&body=${encodeURIComponent(emailBodyPlain)}`;
  const mailtoUrl = `mailto:${encodeURIComponent(emailData.recipient || "")}?subject=${encodeURIComponent(emailData.subject || "")}&body=${encodeURIComponent(emailBodyPlain)}`;

  const linksHtml = (emailData.download_links || [])
    .map(
      (l) => `
    <div style="background: #F0F9FF; border: 1px solid #BAE6FD; padding: 12px; border-radius: 8px; margin: 8px 0;">
      <strong>📄 ${l.title}</strong>
      <div style="margin-top: 4px;">
        <a href="${l.url}" target="_blank" style="color: #0284C7; font-weight: 600;"><i class="fa-brands fa-google-drive"></i> เปิดดาวน์โหลดไฟล์จาก Google Drive</a>
      </div>
    </div>
  `
    )
    .join("");

  emailPreviewModalContent.innerHTML = `
    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 12px; margin-bottom: 16px; font-size: 0.88rem;">
      <p style="margin: 0 0 6px 0;"><strong>ผู้รับ:</strong> <span style="color: #0284C7; font-weight: 600;">${emailData.recipient || 'ลูกค้า'}</span></p>
      <p style="margin: 0 0 6px 0;"><strong>หัวข้อ:</strong> ${emailData.subject}</p>
      <p style="margin: 0; color: #64748B;"><strong>เวลาที่บันทึก:</strong> ${new Date(emailData.sent_at).toLocaleString('th-TH')}</p>
    </div>

    <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; background: #FFF; font-size: 0.92rem; line-height: 1.6;">
      <p style="white-space: pre-line; margin-bottom: 16px;">${emailData.message || ''}</p>

      ${
        emailData.download_links && emailData.download_links.length > 0
          ? `
        <div style="margin-top: 14px;">
          <h4 style="color: #0369A1; margin-bottom: 6px;"><i class="fa-brands fa-google-drive"></i> ลิงก์ดาวน์โหลดใบงานของคุณ:</h4>
          ${linksHtml}
        </div>
      `
          : ''
      }

      ${
        emailData.tracking_number
          ? `
        <div style="background: #EBF5FB; border: 1px solid #7BC5DC; padding: 14px; border-radius: 8px; margin-top: 14px;">
          <h4 style="color: #0369A1; margin: 0 0 6px 0;"><i class="fa-solid fa-truck"></i> ข้อมูลการจัดส่ง:</h4>
          <p style="margin: 4px 0;">ขนส่ง: <strong>${emailData.carrier}</strong></p>
          <p style="margin: 4px 0;">หมายเลขพัสดุ: <strong style="font-size: 1.15rem; color: #FF758F;">${emailData.tracking_number}</strong></p>
          ${trackingUrl ? `<p style="margin: 8px 0 0 0;"><a href="${trackingUrl}" target="_blank" style="color: #0284C7; font-weight: 600;"><i class="fa-solid fa-arrow-up-right-from-square"></i> เช็คสถานะพัสดุกับเว็บขนส่ง</a></p>` : ''}
        </div>
      `
          : ''
      }
    </div>

    <!-- Direct Email Dispatch Actions -->
    <div style="margin-top: 20px; padding: 16px; background: #FFF0F3; border-radius: 12px; border: 1px solid #FBCFE8;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: #9D174D; font-size: 0.88rem; font-weight: 600;">
        <i class="fa-solid fa-paper-plane"></i> ช่องทางส่งอีเมลจริงหาลูกค้าทันที:
      </div>

      <a href="${customerGmailComposeUrl}" target="_blank" class="btn-primary full-width" style="background: linear-gradient(135deg, #0284C7, #0EA5E9); color: #FFF; text-align: center; text-decoration: none; padding: 12px 18px; border-radius: 10px; font-weight: 600; font-size: 0.96rem; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.28); margin-bottom: 8px;">
        <i class="fa-brands fa-google"></i> เปิดส่งอีเมลนี้หาลูกค้าผ่าน Gmail จริงทันที (คลิกเดียวส่ง)
      </a>

      <div style="display: flex; gap: 8px;">
        <a href="${mailtoUrl}" class="btn-secondary full-width" style="text-align: center; text-decoration: none; padding: 8px; font-size: 0.82rem; border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <i class="fa-regular fa-envelope"></i> ส่งผ่านแอพ Mail ในเครื่อง
        </a>
        <button type="button" class="btn-secondary full-width" onclick="window.copyEmailTextToClipboard()" style="font-size: 0.82rem; padding: 8px; display: flex; align-items: center; justify-content: center; gap: 6px;">
          <i class="fa-regular fa-copy"></i> คัดลอกข้อความอีเมล
        </button>
      </div>
    </div>
  `;

  emailPreviewModal.classList.add("open");
};

window.copyEmailTextToClipboard = function () {
  if (!window.lastGeneratedEmailBodyText) return;
  navigator.clipboard.writeText(window.lastGeneratedEmailBodyText).then(() => {
    showAdminToast("คัดลอกข้อความอีเมลเรียบร้อยแล้ว!", "success");
  }).catch(() => {
    showAdminToast("ไม่สามารถคัดลอกได้ กรุณาคัดลอกด้วยตนเอง", "error");
  });
};

window.showEmailHistoryModal = function (orderId) {
  const order = allOrders.find((o) => o.id === orderId);
  if (!order) return;

  const logs = order.email_notification_log || [];
  if (logs.length === 0) {
    showAdminToast("ยังไม่มีประวัติการส่งอีเมลสำหรับคำสั่งซื้อนี้", "info");
    return;
  }

  if (logs.length === 1) {
    window.previewSentEmail(logs[0]);
    return;
  }

  // ถ้ามีหลายฉบับ แสดงรายการให้เลือกดูและกดส่งได้ตามต้องการ
  emailPreviewModalContent.innerHTML = `
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 1rem; color: #1E293B; margin-bottom: 6px;">
        <i class="fa-solid fa-clock-rotate-left text-pink"></i> ประวัติการส่งอีเมลทั้งหมด (${logs.length} ฉบับ)
      </h3>
      <p style="font-size: 0.85rem; color: #64748B;">คลิกเลือกฉบับที่ต้องการ เพื่อเปิดดูเนื้อหาและส่งผ่าน Gmail</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px;">
      ${logs
        .map(
          (log, idx) => `
        <div style="background: #FFF; border: 1.5px solid #E2E8F0; padding: 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <div>
            <div style="font-weight: 600; color: #0284C7; font-size: 0.95rem;">${log.subject}</div>
            <div style="font-size: 0.8rem; color: #64748B; margin-top: 4px;">
              <i class="fa-regular fa-clock"></i> ${new Date(log.sent_at).toLocaleString('th-TH')} | ส่งถึง: ${log.recipient}
            </div>
          </div>
          <button type="button" class="btn-primary btn-sm" onclick='window.previewSentEmail(${JSON.stringify(log)})' style="flex-shrink: 0; font-size: 0.82rem; padding: 6px 14px;">
            <i class="fa-solid fa-envelope-open"></i> ดู & ส่ง Gmail
          </button>
        </div>
      `
        )
        .join("")}
    </div>
  `;

  emailPreviewModal.classList.add("open");
};

// ==============================================================================
// 6. Supabase Settings & SQL Modals
// ==============================================================================
function setupEventListeners() {
  // Product Filter
  if (adminFilterPills) {
    adminFilterPills.addEventListener("click", (e) => {
      const pill = e.target.closest(".admin-pill");
      if (!pill) return;
      document.querySelectorAll(".admin-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentProductTypeFilter = pill.dataset.type;
      renderProductsTable();
    });
  }

  if (adminSearchInput) {
    adminSearchInput.addEventListener("input", (e) => {
      productSearchQuery = e.target.value;
      renderProductsTable();
    });
  }

  // Order Filter
  if (adminOrderFilterPills) {
    adminOrderFilterPills.addEventListener("click", (e) => {
      const pill = e.target.closest(".admin-pill");
      if (!pill) return;
      document.querySelectorAll("#adminOrderFilterPills .admin-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentOrderStatusFilter = pill.dataset.status;
      renderOrdersTable();
    });
  }

  if (adminOrderSearchInput) {
    adminOrderSearchInput.addEventListener("input", (e) => {
      orderSearchQuery = e.target.value;
      renderOrdersTable();
    });
  }

  // Cover Image URL Live Preview & Google Drive Auto Converter
  if (formCoverUrl) {
    const handleCoverInput = (e) => {
      const val = e.target.value;
      const converted = formatGoogleDriveImageUrl(val);
      if (converted !== val && converted.includes("googleusercontent.com")) {
        e.target.value = converted;
      }
      updateCoverUrlPreview(e.target.value);
    };

    formCoverUrl.addEventListener("input", handleCoverInput);
    formCoverUrl.addEventListener("change", handleCoverInput);
    formCoverUrl.addEventListener("paste", () => {
      setTimeout(() => {
        handleCoverInput({ target: formCoverUrl });
      }, 60);
    });
  }

  // Add Product Triggers
  if (addNewProductBtn) addNewProductBtn.addEventListener("click", () => openProductModal());
  if (closeProductModalBtn) closeProductModalBtn.addEventListener("click", closeProductModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeProductModal);

  // Type Radios
  typeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => switchProductTypeForm(e.target.value));
  });

  // Variant Rows
  if (addVariantRowBtn) addVariantRowBtn.addEventListener("click", () => appendVariantRow());
  if (applyPresetBtn) {
    applyPresetBtn.addEventListener("click", () => {
      const selectedType = document.querySelector('input[name="product_type"]:checked').value;
      applyDefaultPresets(selectedType);
    });
  }

  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleSaveProduct();
    });
  }

  // Category Triggers
  if (addNewCategoryBtn) addNewCategoryBtn.addEventListener("click", () => openCategoryModal());
  if (closeCategoryModalBtn) closeCategoryModalBtn.addEventListener("click", () => categoryModal.classList.remove("open"));

  // Supabase Settings
  if (supabaseSettingsBtn) supabaseSettingsBtn.addEventListener("click", openSupabaseModal);
  if (closeSupabaseModalBtn) closeSupabaseModalBtn.addEventListener("click", () => supabaseModal.classList.remove("open"));
  if (testConnectionBtn) testConnectionBtn.addEventListener("click", handleTestConnection);
  if (saveSupabaseConfigBtn) saveSupabaseConfigBtn.addEventListener("click", handleSaveSupabaseConfig);

  const copySystemConfigBtn = document.getElementById("copySystemConfigBtn");
  if (copySystemConfigBtn) {
    copySystemConfigBtn.addEventListener("click", () => {
      updateSystemConfigCodePreview();
      const preview = document.getElementById("systemConfigPreview");
      if (preview && preview.textContent) {
        navigator.clipboard.writeText(preview.textContent).then(() => {
          showAdminToast("คัดลอกโค้ด Config สำเร็จแล้ว! นำไปวางใน supabase-client.js ได้เลยครับ", "success");
        }).catch(() => {
          showAdminToast("กรุณาคลุมดำและคัดลอกข้อความในกรอบสีเขียวครับ", "info");
        });
      }
    });
  }

  [supabaseUrlInput, supabaseKeyInput, googleScriptUrlInput].forEach(inp => {
    if (inp) inp.addEventListener("input", updateSystemConfigCodePreview);
  });

  // SQL Schema
  if (openSqlModalBtn) openSqlModalBtn.addEventListener("click", () => sqlModal.classList.add("open"));
  if (closeSqlModalBtn) closeSqlModalBtn.addEventListener("click", () => sqlModal.classList.remove("open"));
  if (copySqlBtn) copySqlBtn.addEventListener("click", handleCopySql);
}

function updateSystemConfigCodePreview() {
  const preview = document.getElementById("systemConfigPreview");
  if (!preview) return;
  const url = (supabaseUrlInput.value || "").trim() || "https://cgpmogvkmgdmshezobzg.supabase.co";
  const key = (supabaseKeyInput.value || "").trim() || "sb_publishable_VGJvQHtMMnkMuy1KUneqJQ_6Pj6sqYA";
  const gas = (googleScriptUrlInput && googleScriptUrlInput.value ? googleScriptUrlInput.value.trim() : "") || "https://script.google.com/macros/s/AKfycbzI2GHHfsi7k2ZBa0wdcEkjBJn0qlLaO4adE4QWBzu0jutKidZClQKoqyPWLoTadmZX/exec";

  const code = `const DEFAULT_SYSTEM_CONFIG = {\n  supabaseUrl: "${url}",\n  supabaseAnonKey: "${key}",\n  googleScriptUrl: "${gas}"\n};`;
  preview.textContent = code;
}

function openSupabaseModal() {
  const config = window.wadfanData.getConfig();
  supabaseUrlInput.value = config.url;
  supabaseKeyInput.value = config.key;
  if (googleScriptUrlInput) {
    googleScriptUrlInput.value = window.wadfanData.getGoogleScriptUrl();
  }
  connectionTestResult.style.display = "none";
  updateSystemConfigCodePreview();
  supabaseModal.classList.add("open");
}

async function handleTestConnection() {
  const url = supabaseUrlInput.value.trim();
  const key = supabaseKeyInput.value.trim();

  if (!url || !key) {
    connectionTestResult.className = "connection-test-result error";
    connectionTestResult.textContent = "กรุณากรอกทั้ง Project URL และ Anon Key ให้ครบถ้วน";
    connectionTestResult.style.display = "block";
    return;
  }

  window.wadfanData.saveConfig(url, key);
  const res = await window.wadfanData.testConnection();

  connectionTestResult.style.display = "block";
  if (res.success) {
    connectionTestResult.className = "connection-test-result success";
    connectionTestResult.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${res.message}`;
    updateConnectionStatusUI();
  } else {
    connectionTestResult.className = "connection-test-result error";
    connectionTestResult.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${res.message}<br><small>ตรวจสอบว่ารันสคริปต์ SQL บน Supabase แล้วหรือยังครับ</small>`;
    updateConnectionStatusUI();
  }
}

async function handleSaveSupabaseConfig() {
  const url = supabaseUrlInput.value.trim();
  const key = supabaseKeyInput.value.trim();
  const gasUrl = googleScriptUrlInput ? googleScriptUrlInput.value.trim() : "";

  window.wadfanData.saveConfig(url, key);
  window.wadfanData.setGoogleScriptUrl(gasUrl);
  showAdminToast("บันทึกการตั้งค่า Supabase & Google Drive เรียบร้อยแล้ว", "success");
  updateConnectionStatusUI();
  supabaseModal.classList.remove("open");
  await refreshProductsTable();
}

async function loadSqlSchemaPreview() {
  try {
    const res = await fetch("supabase-schema.sql");
    if (res.ok) {
      const sqlText = await res.text();
      if (sqlCodeBlock) sqlCodeBlock.textContent = sqlText;
    }
  } catch (err) {
    console.log("Sql load error:", err);
  }
}

function handleCopySql() {
  const sqlText = sqlCodeBlock.textContent;
  navigator.clipboard.writeText(sqlText).then(() => {
    showAdminToast("คัดลอกคำสั่ง SQL ไปยังคลิปบอร์ดแล้ว!", "success");
  });
}

// ==============================================================================
// 7. Toast Utility
// ==============================================================================
function showAdminToast(message, type = "info") {
  if (!adminToastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="${type === "success" ? "fa-solid fa-circle-check text-green" : "fa-solid fa-circle-info text-blue"}"></i>
    <span>${message}</span>
  `;

  adminToastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.25s ease, transform 0.25s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}
