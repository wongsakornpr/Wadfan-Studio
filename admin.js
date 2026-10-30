/**
 * Wadfan Studio - Admin Management Dashboard Logic
 * Minimal & Warm Backend Manager for Images & Worksheets
 */

// State
let allProducts = [];
let allCategories = [];
let currentAdminType = "all";
let adminSearchQuery = "";
let editingProductId = null;

// DOM Elements
const adminProductsTableBody = document.getElementById("adminProductsTableBody");
const adminFilterPills = document.getElementById("adminFilterPills");
const adminSearchInput = document.getElementById("adminSearchInput");

// Stats Elements
const statTotalProducts = document.getElementById("statTotalProducts");
const statTotalImages = document.getElementById("statTotalImages");
const statTotalWorksheets = document.getElementById("statTotalWorksheets");
const statTotalVariants = document.getElementById("statTotalVariants");

// Connection Elements
const dbStatusDot = document.getElementById("dbStatusDot");
const dbStatusText = document.getElementById("dbStatusText");
const supabaseSettingsBtn = document.getElementById("supabaseSettingsBtn");
const supabaseModal = document.getElementById("supabaseModal");
const closeSupabaseModalBtn = document.getElementById("closeSupabaseModalBtn");
const supabaseUrlInput = document.getElementById("supabaseUrlInput");
const supabaseKeyInput = document.getElementById("supabaseKeyInput");
const testConnectionBtn = document.getElementById("testConnectionBtn");
const saveSupabaseConfigBtn = document.getElementById("saveSupabaseConfigBtn");
const connectionTestResult = document.getElementById("connectionTestResult");

// SQL Modal Elements
const openSqlModalBtn = document.getElementById("openSqlModalBtn");
const sqlModal = document.getElementById("sqlModal");
const closeSqlModalBtn = document.getElementById("closeSqlModalBtn");
const sqlCodeBlock = document.getElementById("sqlCodeBlock");
const copySqlBtn = document.getElementById("copySqlBtn");

// Product Modal Elements
const addNewProductBtn = document.getElementById("addNewProductBtn");
const productModal = document.getElementById("productModal");
const closeProductModalBtn = document.getElementById("closeProductModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const productForm = document.getElementById("productForm");
const modalProductTitle = document.getElementById("modalProductTitle");
const formProductId = document.getElementById("formProductId");

// Form Inputs
const typeRadios = document.querySelectorAll('input[name="product_type"]');
const formCategory = document.getElementById("formCategory");
const formTitle = document.getElementById("formTitle");
const formCoverUrl = document.getElementById("formCoverUrl");
const formTag = document.getElementById("formTag");
const formStatus = document.getElementById("formStatus");
const formShortDesc = document.getElementById("formShortDesc");
const formFullDesc = document.getElementById("formFullDesc");

// Type-specific field boxes
const imageFieldsBox = document.getElementById("imageFieldsBox");
const worksheetFieldsBox = document.getElementById("worksheetFieldsBox");
const formOrientation = document.getElementById("formOrientation");
const formResolution = document.getElementById("formResolution");
const formPalette = document.getElementById("formPalette");
const formGradeLevel = document.getElementById("formGradeLevel");
const formTotalPages = document.getElementById("formTotalPages");
const formHasAnswerKey = document.getElementById("formHasAnswerKey");

// Variant Manager
const variantsContainer = document.getElementById("variantsContainer");
const addVariantRowBtn = document.getElementById("addVariantRowBtn");
const applyPresetBtn = document.getElementById("applyPresetBtn");
const adminToastContainer = document.getElementById("adminToastContainer");

// ==============================================================================
// 1. Initialization
// ==============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  updateConnectionStatusUI();
  await loadCategories();
  await refreshProductsTable();
  setupEventListeners();
  loadSqlSchemaPreview();
});

// ==============================================================================
// 2. Data Loading & Stats
// ==============================================================================
async function loadCategories() {
  try {
    allCategories = await window.wadfanData.getCategories();

    if (
      window.wadfanData.isSupabaseConnected &&
      allCategories.length === 0
    ) {
      console.warn(
        "ไม่พบ Category ใน Supabase Database"
      );
    }

  } catch (err) {
    allCategories = [];

    console.error(
      "Load Categories Error:",
      err
    );

    showAdminToast(
      `โหลดหมวดหมู่ไม่สำเร็จ: ${err.message}`,
      "error"
    );
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
// 3. Render Table
// ==============================================================================
function renderProductsTable() {
  if (!adminProductsTableBody) return;

  const filtered = allProducts.filter((p) => {
    const matchesType = currentAdminType === "all" || p.product_type === currentAdminType;
    const q = adminSearchQuery.toLowerCase().trim();
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
        <td colspan="7" style="text-align: center; padding: 48px 20px; color: #64748b;">
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
        .map(
          (v) =>
            `<span class="variant-chip">${v.name}: <strong>฿${v.price}</strong></span>`
        )
        .join("");

      return `
      <tr>
        <td>
          <img src="${item.cover_image_url || 'https://via.placeholder.com/60'}" class="table-prod-thumb" alt="${item.title}" onerror="this.src='https://via.placeholder.com/60?text=No+Img'">
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

// ==============================================================================
// 4. Modal & Form Handling
// ==============================================================================
function setupEventListeners() {
  // Toolbar Filter Pills
  if (adminFilterPills) {
    adminFilterPills.addEventListener("click", (e) => {
      const pill = e.target.closest(".admin-pill");
      if (!pill) return;
      document.querySelectorAll(".admin-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentAdminType = pill.dataset.type;
      renderProductsTable();
    });
  }

  // Search input
  if (adminSearchInput) {
    adminSearchInput.addEventListener("input", (e) => {
      adminSearchQuery = e.target.value;
      renderProductsTable();
    });
  }

  // Open Add Product Modal
  if (addNewProductBtn) {
    addNewProductBtn.addEventListener("click", () => {
      openProductModal();
    });
  }

  if (closeProductModalBtn) closeProductModalBtn.addEventListener("click", closeProductModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeProductModal);

  // Radio Product Type Switch
  typeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      switchProductTypeForm(e.target.value);
    });
  });

  // Dynamic Variant Rows
  if (addVariantRowBtn) {
    addVariantRowBtn.addEventListener("click", () => {
      appendVariantRow();
    });
  }

  // Preset Generator
  if (applyPresetBtn) {
    applyPresetBtn.addEventListener("click", () => {
      const selectedType = document.querySelector('input[name="product_type"]:checked').value;
      applyDefaultPresets(selectedType);
    });
  }

  // Form Submit
  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handleSaveProduct();
    });
  }

  // Supabase Modal
  if (supabaseSettingsBtn) supabaseSettingsBtn.addEventListener("click", openSupabaseModal);
  if (closeSupabaseModalBtn) closeSupabaseModalBtn.addEventListener("click", closeSupabaseModal);
  if (testConnectionBtn) testConnectionBtn.addEventListener("click", handleTestConnection);
  if (saveSupabaseConfigBtn) saveSupabaseConfigBtn.addEventListener("click", handleSaveSupabaseConfig);

  // SQL Schema Modal
  if (openSqlModalBtn) openSqlModalBtn.addEventListener("click", openSqlModal);
  if (closeSqlModalBtn) closeSqlModalBtn.addEventListener("click", closeSqlModal);
  if (copySqlBtn) copySqlBtn.addEventListener("click", handleCopySql);
}

function switchProductTypeForm(type) {
  // Update Type Radio Cards active visual state
  document.querySelectorAll(".type-radio-card").forEach((card) => {
    const radio = card.querySelector('input[type="radio"]');
    if (radio && radio.value === type) {
      card.classList.add("active");
      radio.checked = true;
    } else {
      card.classList.remove("active");
    }
  });

  // Populate Categories matching product type
  populateCategoryDropdown(type);

  // Toggle Type-specific inputs
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
    formCategory.innerHTML = `<option value="">ไม่มีหมวดหมู่</option>`;
    return;
  }

  formCategory.innerHTML = filteredCats
    .map(
      (c) => `
    <option value="${c.id}" ${selectedCatId === c.id ? "selected" : ""}>
      ${c.name}
    </option>
  `
    )
    .join("");
}

function openProductModal(product = null) {
  editingProductId = product ? product.id : null;
  formProductId.value = editingProductId || "";

  if (product) {
    modalProductTitle.textContent = "แก้ไขสินค้า";
    formTitle.value = product.title || "";
    formCoverUrl.value = product.cover_image_url || "";
    formTag.value = product.tag || "มาใหม่";
    formStatus.value = product.status || "active";
    formShortDesc.value = product.short_desc || "";
    formFullDesc.value = product.full_desc || "";

    // Set Product Type
    const currentType = product.product_type || "image";
    switchProductTypeForm(currentType);
    populateCategoryDropdown(currentType, product.category_id);

    // Metadata
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

    // Populate variants
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
    switchProductTypeForm("image");
    variantsContainer.innerHTML = "";
    applyDefaultPresets("image");
  }

  productModal.classList.add("open");
}

function closeProductModal() {
  productModal.classList.remove("open");
}

// ==============================================================================
// 5. Dynamic Variant Rows Management
// ==============================================================================
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
    appendVariantRow({
      name: "ขนาด S (Web / Social)",
      dimension_or_detail: "1080 x 1440 px (72 DPI)",
      file_format: "JPG/PNG",
      price: 39
    });
    appendVariantRow({
      name: "ขนาด M (High-Res Print)",
      dimension_or_detail: "3000 x 4000 px (300 DPI)",
      file_format: "PNG",
      price: 79
    });
    appendVariantRow({
      name: "ขนาด L + สิทธิ์เชิงพาณิชย์",
      dimension_or_detail: "4500 x 6000 px + License",
      file_format: "Original PNG + PDF",
      price: 189
    });
  } else {
    appendVariantRow({
      name: "ชุดมาตรฐาน (Standard PDF)",
      dimension_or_detail: "ขนาด A4 พร้อมแบบฝึกหัด",
      file_format: "PDF 300 DPI",
      price: 69
    });
    appendVariantRow({
      name: "ชุดพรีเมียม (PDF + เฉลยละเอียด)",
      dimension_or_detail: "รวมแบบฝึกหัด + เฉลยและคู่มือ",
      file_format: "PDF Pack",
      price: 89
    });
  }
}

// ==============================================================================
// 6. Save & Delete Actions
// ==============================================================================
async function handleSaveProduct() {
  const selectedType = document.querySelector('input[name="product_type"]:checked').value;
  const title = formTitle.value.trim();
  const categoryId = formCategory.value;
  const coverUrl = formCoverUrl.value.trim();
  const tag = formTag.value;
  const status = formStatus.value;
  const shortDesc = formShortDesc.value.trim();
  const fullDesc = formFullDesc.value.trim();

  // Harvest Metadata
  let metadata = {};
  if (selectedType === "image") {
    metadata = {
      orientation: formOrientation.value,
      resolution: formResolution.value.trim(),
      color_palette: formPalette.value
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    };
  } else {
    metadata = {
      grade_level: formGradeLevel.value.trim(),
      total_pages: parseInt(formTotalPages.value) || 0,
      has_answer_key: formHasAnswerKey.value === "true"
    };
  }

  // Harvest Variants
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
    base_price: basePrice,
    tag,
    status,
    metadata
  };

  const result = await window.wadfanData.saveProduct(payload, variants);

  if (result.success) {
    showAdminToast("บันทึกข้อมูลสินค้าเรียบร้อยแล้ว", "success");
    closeProductModal();
    await refreshProductsTable();
  } else {
    showAdminToast(`เกิดข้อผิดพลาด: ${result.message}`, "error");
  }
}

window.editProduct = function (productId) {
  const prod = allProducts.find((p) => p.id === productId);
  if (prod) {
    openProductModal(prod);
  }
};

window.deleteProduct = async function (productId) {
  const prod = allProducts.find((p) => p.id === productId);
  const name = prod ? prod.title : "สินค้านี้";

  if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${name}"?`)) {
    return;
  }

  const res = await window.wadfanData.deleteProduct(productId);
  if (res.success) {
    showAdminToast(`ลบ "${name}" สำเร็จ`, "info");
    await refreshProductsTable();
  } else {
    showAdminToast(`ไม่สามารถลบได้: ${res.message}`, "error");
  }
};

// ==============================================================================
// 7. Supabase Configuration Modal Handling
// ==============================================================================
function openSupabaseModal() {
  const config = window.wadfanData.getConfig();
  supabaseUrlInput.value = config.url;
  supabaseKeyInput.value = config.key;
  connectionTestResult.style.display = "none";
  supabaseModal.classList.add("open");
}

function closeSupabaseModal() {
  supabaseModal.classList.remove("open");
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

  // Temporary configure to test
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

  window.wadfanData.saveConfig(url, key);
  showAdminToast("บันทึกการตั้งค่า Supabase เรียบร้อยแล้ว", "success");
  updateConnectionStatusUI();
  closeSupabaseModal();
  await refreshProductsTable();
}

// ==============================================================================
// 8. SQL Schema Preview Modal
// ==============================================================================
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

function openSqlModal() {
  sqlModal.classList.add("open");
}

function closeSqlModal() {
  sqlModal.classList.remove("open");
}

function handleCopySql() {
  const sqlText = sqlCodeBlock.textContent;
  navigator.clipboard.writeText(sqlText).then(() => {
    showAdminToast("คัดลอกคำสั่ง SQL ไปยังคลิปบอร์ดแล้ว!", "success");
  });
}

// ==============================================================================
// 9. Toast Utility
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
