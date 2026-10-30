/**
 * Wadfan Studio - Supabase Client & Data Provider Layer v2
 * Comprehensive CRUD for:
 * 1. Categories (เพิ่ม/แก้ไข/ลบหมวดหมู่)
 * 2. Products & Variants (พร้อม Google Drive download_url สำหรับใบงาน)
 * 3. Orders (ระบบจัดการคำสั่งซื้อ, ยืนยันชำระเงิน, ส่งลิงก์ Google Drive, ส่งเลขพัสดุ Tracking)
 */

// หมวดหมู่เริ่มต้น (Fallback)
const DEFAULT_SAMPLE_CATEGORIES = [
  { id: "cat-img-1", name: "ภาพวาดลายเส้นน่ารัก", slug: "cute-illustrations", product_type: "image", sort_order: 1 },
  { id: "cat-img-2", name: "วอลเปเปอร์มือถือ & iPad", slug: "wallpapers", product_type: "image", sort_order: 2 },
  { id: "cat-img-3", name: "ไอคอนและสติกเกอร์ตกแต่ง", slug: "stickers-icons", product_type: "image", sort_order: 3 },
  { id: "cat-img-4", name: "ภาพวาดสั่งทำพิเศษ (Custom Art)", slug: "custom-art", product_type: "image", sort_order: 4 },
  { id: "cat-ws-1", name: "ภาษาไทย & คัดลายมือ", slug: "thai-language", product_type: "worksheet", sort_order: 5 },
  { id: "cat-ws-2", name: "คณิตศาสตร์แสนสนุก", slug: "fun-math", product_type: "worksheet", sort_order: 6 },
  { id: "cat-ws-3", name: "English & Phonics", slug: "english-phonics", product_type: "worksheet", sort_order: 7 },
  { id: "cat-ws-4", name: "ศิลปะ & เสริมสร้างสมาธิ", slug: "art-focus", product_type: "worksheet", sort_order: 8 }
];

// สินค้าเริ่มต้น
const DEFAULT_SAMPLE_PRODUCTS = [
  {
    id: "prod-img-1",
    title: "ชุดภาพวาด 'เจ้ากระต่ายน้อยในสวนสายรุ้ง'",
    product_type: "image",
    category_id: "cat-img-1",
    category_name: "ภาพวาดลายเส้นน่ารัก",
    short_desc: "ภาพประกอบดิจิทัลโทนสีพาสเทลอบอุ่น เหมาะสำหรับโปสเตอร์ การ์ด หรือสื่อสิ่งพิมพ์",
    full_desc: "ผลงานวาดมือดิจิทัลแท้สไตล์ Wadfan Studio ให้ความรู้สึกผ่อนคลาย อบอุ่น สบายตา พร้อมตัวเลือกขนาดและจัดส่งถึงบ้าน",
    cover_image_url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
    download_url: "https://drive.google.com/drive/folders/demo-artwork-rabbit",
    base_price: 39,
    tag: "ยอดนิยม",
    status: "active",
    metadata: {
      orientation: "portrait",
      color_palette: ["#FFE3E8", "#D9EEF8", "#FEF3C7"],
      resolution: "4500 x 6000 px"
    },
    variants: [
      { id: "v-img-1-1", name: "ขนาด S (Web / Social)", dimension_or_detail: "1080 x 1440 px (72 DPI)", file_format: "JPG/PNG", price: 39, is_default: true },
      { id: "v-img-1-2", name: "ขนาด M (High-Res Print)", dimension_or_detail: "3000 x 4000 px (300 DPI)", file_format: "PNG", price: 79, is_default: false },
      { id: "v-img-1-3", name: "พิมพ์ใส่กรอบรูป A4 จัดส่งทางพัสดุ", dimension_or_detail: "กรอบรูปไม้สีขาว พร้อมจัดส่ง EMS", file_format: "Physical Frame", price: 299, is_default: false }
    ]
  },
  {
    id: "prod-img-2",
    title: "วอลเปเปอร์ 'ท้องฟ้าและก้อนเมฆฝันหวาน'",
    product_type: "image",
    category_id: "cat-img-2",
    category_name: "วอลเปเปอร์มือถือ & iPad",
    short_desc: "วอลเปเปอร์โทนสีฟ้า-ชมพูมินิมอล สำหรับ iPhone, iPad และ Android ปรับสายตาให้สบาย",
    full_desc: "ภาพพื้นหลังหน้าจอโทน Minimal Warm ผสมผสานประกายดาวและปุยเมฆ สร้างแรงบันดาลใจทุกครั้งที่ปลดล็อกหน้าจอ",
    cover_image_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    download_url: "https://drive.google.com/drive/folders/demo-wallpaper-cloud",
    base_price: 29,
    tag: "มาใหม่",
    status: "active",
    metadata: {
      orientation: "portrait",
      color_palette: ["#7BC5DC", "#FFB3C1"],
      resolution: "4K UHD"
    },
    variants: [
      { id: "v-img-2-1", name: "สำหรับ Smartphone (All Models)", dimension_or_detail: "1290 x 2796 px", file_format: "PNG", price: 29, is_default: true },
      { id: "v-img-2-2", name: "สำหรับ iPad & Tablet + Phone", dimension_or_detail: "2048 x 2732 px (2 Sizes)", file_format: "PNG Pack", price: 49, is_default: false }
    ]
  },
  {
    id: "prod-ws-1",
    title: "ชุดนับจำนวนและเปรียบเทียบ 1-20 แสนสนุก",
    product_type: "worksheet",
    category_id: "cat-ws-2",
    category_name: "คณิตศาสตร์แสนสนุก",
    short_desc: "ฝึกการนับจำนวน จับคู่ตัวเลข และเครื่องหมายมากกว่า-น้อยกว่า ลายเส้นน่ารัก",
    full_desc: "ชุดแบบฝึกหัดคณิตศาสตร์ปฐมวัย เน้นการเรียนรู้ผ่านภาพผลไม้และสัตว์น่ารัก ช่วยให้เด็กๆ เข้าใจจำนวน 1-20 พร้อมเฉลยละเอียด",
    cover_image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80",
    download_url: "https://drive.google.com/file/d/1Wadfan_Sample_Math_1-20/view?usp=sharing",
    base_price: 69,
    tag: "ยอดนิยม",
    status: "active",
    metadata: {
      grade_level: "อนุบาล 2 - 3",
      total_pages: 35,
      has_answer_key: true,
      subject: "คณิตศาสตร์"
    },
    variants: [
      { id: "v-ws-1-1", name: "ชุดมาตรฐาน (Standard PDF)", dimension_or_detail: "35 หน้า A4 (พร้อมแบบฝึกหัด)", file_format: "PDF 300 DPI", price: 69, is_default: true },
      { id: "v-ws-1-2", name: "ชุดพรีเมียม (PDF + เฉลยละเอียด)", dimension_or_detail: "35 หน้า + 10 หน้าเฉลยและคู่มือ", file_format: "PDF Pack", price: 89, is_default: false }
    ]
  },
  {
    id: "prod-ws-2",
    title: "ตะลุยแดนพยัญชนะไทย ก-ฮ ลายเส้นพร้อมระบายสี",
    product_type: "worksheet",
    category_id: "cat-ws-1",
    category_name: "ภาษาไทย & คัดลายมือ",
    short_desc: "หัดคัดพยัญชนะไทย 44 ตัว พร้อมรูปภาพประกอบระบายสีคลายเครียด",
    full_desc: "ใบงานคัดลายมือพยัญชนะไทย ก ไก่ ถึง ฮ นกฮูก ตัวอักษรหัวกลมมาตรฐาน มีทิศทางลูกศรบอกขั้นตอนการลากเส้นอย่างชัดเจน",
    cover_image_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80",
    download_url: "https://drive.google.com/file/d/1Wadfan_Sample_Thai_Alphabet/view?usp=sharing",
    base_price: 79,
    tag: "ขายดี",
    status: "active",
    metadata: {
      grade_level: "อนุบาล 1 - 2",
      total_pages: 44,
      has_answer_key: false,
      subject: "ภาษาไทย"
    },
    variants: [
      { id: "v-ws-2-1", name: "ชุดฝึกคัดพื้นฐาน ก-ฮ", dimension_or_detail: "44 หน้า ขนาด A4 คมชัด", file_format: "PDF 300 DPI", price: 79, is_default: true }
    ]
  },
  {
    id: "prod-ws-free",
    title: "ศิลปะลากเส้นต่อจุด & เขาวงกตเสริมสมาธิ",
    product_type: "worksheet",
    category_id: "cat-ws-4",
    category_name: "ศิลปะ & เสริมสร้างสมาธิ",
    short_desc: "ชุดฝึกกล้ามเนื้อมัดเล็กและฝึกสมาธิด้วยการลากเส้นตามรอยประและเขาวงกต",
    full_desc: "ชุดใบงานแจกฟรีสุดพิเศษจาก Wadfan Studio รวบรวมเกมลากเส้นต่อจุดตามตัวเลขและเกมเขาวงกต",
    cover_image_url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80",
    download_url: "https://drive.google.com/file/d/1Wadfan_Freebie_Art_Mazes/view?usp=sharing",
    base_price: 0,
    tag: "แจกฟรี",
    status: "active",
    metadata: {
      grade_level: "อนุบาล 1 - 3",
      total_pages: 20,
      has_answer_key: false,
      subject: "ศิลปะ"
    },
    variants: [
      { id: "v-ws-free-1", name: "ชุดทดลองใช้ฟรี 20 หน้า", dimension_or_detail: "20 หน้า A4 เต็มเล่ม", file_format: "PDF", price: 0, is_default: true }
    ]
  }
];

// ตัวอย่างคำสั่งซื้อเริ่มต้น
const DEFAULT_SAMPLE_ORDERS = [
  {
    id: "ord-demo-1",
    order_number: "WF-20261030-001",
    customer_name: "ครูเมย์ สุพรรณษา",
    customer_email: "may.teacher@example.com",
    customer_phone: "089-123-4567",
    order_type: "worksheet",
    total_amount: 89,
    payment_status: "paid",
    customer_uploaded_files: [],
    email_notification_log: [
      {
        type: "worksheet_delivery",
        sent_at: "2026-10-30T09:30:00Z",
        subject: "🎉 จัดส่งไฟล์ใบงานของคุณ - Wadfan Studio (คำสั่งซื้อ WF-20261030-001)",
        download_links: [
          { title: "ชุดนับจำนวนและเปรียบเทียบ 1-20 แสนสนุก", url: "https://drive.google.com/file/d/1Wadfan_Sample_Math_1-20/view?usp=sharing" }
        ]
      }
    ],
    items: [
      {
        product_title: "ชุดนับจำนวนและเปรียบเทียบ 1-20 แสนสนุก",
        variant_name: "ชุดพรีเมียม (PDF + เฉลยละเอียด)",
        product_type: "worksheet",
        download_url: "https://drive.google.com/file/d/1Wadfan_Sample_Math_1-20/view?usp=sharing",
        price: 89
      }
    ],
    created_at: "2026-10-30T09:20:00Z",
    confirmed_at: "2026-10-30T09:30:00Z"
  },
  {
    id: "ord-demo-2",
    order_number: "WF-20261030-002",
    customer_name: "คุณกอล์ฟ ภานุวัฒน์",
    customer_email: "golf.p@example.com",
    customer_phone: "081-987-6543",
    order_type: "image",
    total_amount: 299,
    payment_status: "shipped",
    tracking_carrier: "Flash Express",
    tracking_number: "TH0123456789A",
    customer_uploaded_files: [
      {
        file_name: "my_baby_photo.jpg",
        file_size: "3.2 MB",
        google_drive_path: "Google Drive: /Wadfan_Orders/WF-20261030-002/my_baby_photo.jpg"
      }
    ],
    email_notification_log: [
      {
        type: "shipping_notice",
        sent_at: "2026-10-30T10:15:00Z",
        subject: "🚚 แจ้งเลขพัสดุจัดส่งสินค้า - Wadfan Studio (คำสั่งซื้อ WF-20261030-002)",
        carrier: "Flash Express",
        tracking_number: "TH0123456789A"
      }
    ],
    items: [
      {
        product_title: "ชุดภาพวาด 'เจ้ากระต่ายน้อยในสวนสายรุ้ง'",
        variant_name: "พิมพ์ใส่กรอบรูป A4 จัดส่งทางพัสดุ",
        product_type: "image",
        price: 299
      }
    ],
    created_at: "2026-10-30T09:45:00Z",
    confirmed_at: "2026-10-30T09:55:00Z",
    shipped_at: "2026-10-30T10:15:00Z"
  }
];

class WadfanDataProvider {
  constructor() {
    this.supabaseClient = null;
    this.isSupabaseConnected = false;
    this.init();
  }

  init() {
    const config = this.getConfig();
    if (config.url && config.key && window.supabase) {
      try {
        this.supabaseClient = window.supabase.createClient(config.url, config.key);
        this.isSupabaseConnected = true;
      } catch (err) {
        console.warn("Supabase init error:", err);
        this.isSupabaseConnected = false;
      }
    } else {
      this.isSupabaseConnected = false;
    }
    this.ensureLocalStore();
  }

  ensureLocalStore() {
    if (!localStorage.getItem("wadfan_products")) {
      localStorage.setItem("wadfan_products", JSON.stringify(DEFAULT_SAMPLE_PRODUCTS));
    }
    if (!localStorage.getItem("wadfan_categories")) {
      localStorage.setItem("wadfan_categories", JSON.stringify(DEFAULT_SAMPLE_CATEGORIES));
    }
    if (!localStorage.getItem("wadfan_orders")) {
      localStorage.setItem("wadfan_orders", JSON.stringify(DEFAULT_SAMPLE_ORDERS));
    }
  }

  getConfig() {
    return {
      url: localStorage.getItem("wadfan_supabase_url") || "",
      key: localStorage.getItem("wadfan_supabase_key") || ""
    };
  }

  saveConfig(url, key) {
    localStorage.setItem("wadfan_supabase_url", url.trim());
    localStorage.setItem("wadfan_supabase_key", key.trim());
    this.init();
  }

  async testConnection() {
    if (!this.supabaseClient) return { success: false, message: "ยังไม่ได้ระบุ Supabase URL และ Key" };
    try {
      const { data, error } = await this.supabaseClient.from("categories").select("id").limit(1);
      if (error) throw error;
      return { success: true, message: "เชื่อมต่อกับฐานข้อมูล Supabase สำเร็จเรียบร้อยแล้ว!" };
    } catch (err) {
      return { success: false, message: `เกิดข้อผิดพลาด: ${err.message || err}` };
    }
  }

  // ==============================================================================
  // 1. Categories Management (เพิ่ม/แก้ไข/ลบหมวดหมู่)
  // ==============================================================================
  async getCategories(typeFilter = null) {
    if (this.isSupabaseConnected) {
      let query = this.supabaseClient.from("categories").select("*").order("sort_order", { ascending: true });
      if (typeFilter && typeFilter !== "all") {
        query = query.eq("product_type", typeFilter);
      }
      const { data, error } = await query;
      if (error) {
        console.error("Supabase fetch categories error:", error);
        throw error;
      }
      return data || [];
    }

    const local = JSON.parse(localStorage.getItem("wadfan_categories") || "[]");
    if (!typeFilter || typeFilter === "all") return local;
    return local.filter((c) => c.product_type === typeFilter);
  }

  async saveCategory(categoryData) {
    const isEdit = Boolean(categoryData.id);

    if (this.isSupabaseConnected) {
      try {
        const payload = {
          name: categoryData.name.trim(),
          slug: categoryData.slug.trim().toLowerCase(),
          product_type: categoryData.product_type,
          sort_order: parseInt(categoryData.sort_order) || 0
        };

        if (isEdit) {
          const { error } = await this.supabaseClient
            .from("categories")
            .update(payload)
            .eq("id", categoryData.id);
          if (error) throw error;
          return { success: true, id: categoryData.id };
        } else {
          const { data, error } = await this.supabaseClient
            .from("categories")
            .insert([payload])
            .select()
            .single();
          if (error) throw error;
          return { success: true, id: data.id };
        }
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    // Local Storage
    const local = JSON.parse(localStorage.getItem("wadfan_categories") || "[]");
    const targetId = isEdit ? categoryData.id : "cat-" + Date.now();
    const item = { ...categoryData, id: targetId, sort_order: parseInt(categoryData.sort_order) || 0 };

    if (isEdit) {
      const idx = local.findIndex((c) => c.id === targetId);
      if (idx !== -1) local[idx] = item;
    } else {
      local.push(item);
    }
    localStorage.setItem("wadfan_categories", JSON.stringify(local));
    return { success: true, id: targetId };
  }

  async deleteCategory(categoryId) {
    if (this.isSupabaseConnected) {
      try {
        const { error } = await this.supabaseClient.from("categories").delete().eq("id", categoryId);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    let local = JSON.parse(localStorage.getItem("wadfan_categories") || "[]");
    local = local.filter((c) => c.id !== categoryId);
    localStorage.setItem("wadfan_categories", JSON.stringify(local));
    return { success: true };
  }

  async seedCategoriesToSupabase() {
    if (!this.isSupabaseConnected) return { success: false, message: "ยังไม่ได้เชื่อมต่อ Supabase" };
    try {
      const defaultCategories = [
        { name: "ภาพวาดลายเส้นน่ารัก", slug: "cute-illustrations", product_type: "image", sort_order: 1 },
        { name: "วอลเปเปอร์มือถือ & iPad", slug: "wallpapers", product_type: "image", sort_order: 2 },
        { name: "ไอคอนและสติกเกอร์ตกแต่ง", slug: "stickers-icons", product_type: "image", sort_order: 3 },
        { name: "ภาพวาดสั่งทำพิเศษ (Custom Art)", slug: "custom-art", product_type: "image", sort_order: 4 },
        { name: "ภาษาไทย & คัดลายมือ", slug: "thai-language", product_type: "worksheet", sort_order: 5 },
        { name: "คณิตศาสตร์แสนสนุก", slug: "fun-math", product_type: "worksheet", sort_order: 6 },
        { name: "English & Phonics", slug: "english-phonics", product_type: "worksheet", sort_order: 7 },
        { name: "ศิลปะ & เสริมสร้างสมาธิ", slug: "art-focus", product_type: "worksheet", sort_order: 8 }
      ];

      const { data, error } = await this.supabaseClient
        .from("categories")
        .upsert(defaultCategories, { onConflict: "slug" })
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ==============================================================================
  // 2. Products Management
  // ==============================================================================
  async getProducts(filters = {}) {
    const { type, categorySlug, search, status } = filters;

    if (this.isSupabaseConnected) {
      try {
        let query = this.supabaseClient
          .from("products")
          .select("*, categories(name, slug), product_variants(*)")
          .order("created_at", { ascending: false });

        if (type && type !== "all") query = query.eq("product_type", type);
        if (status) query = query.eq("status", status);
        if (search) query = query.ilike("title", `%${search}%`);

        const { data, error } = await query;
        if (!error && data) {
          return data.map((item) => ({
            ...item,
            category_name: item.categories ? item.categories.name : "ทั่วไป",
            variants: item.product_variants || []
          }));
        }
      } catch (err) {
        console.warn("Supabase products fetch fallback:", err);
      }
    }

    let local = JSON.parse(localStorage.getItem("wadfan_products") || "[]");
    if (type && type !== "all") local = local.filter((p) => p.product_type === type);
    if (categorySlug && categorySlug !== "all") {
      const cats = JSON.parse(localStorage.getItem("wadfan_categories") || "[]");
      const matchedCat = cats.find((c) => c.slug === categorySlug);
      if (matchedCat) local = local.filter((p) => p.category_id === matchedCat.id);
    }
    if (status) local = local.filter((p) => p.status === status);
    if (search) {
      const q = search.toLowerCase();
      local = local.filter((p) => p.title.toLowerCase().includes(q) || (p.short_desc && p.short_desc.toLowerCase().includes(q)));
    }
    return local;
  }

  async saveProduct(productData, variants = []) {
    const isEdit = Boolean(productData.id);

    if (this.isSupabaseConnected) {
      try {
        const isUUID = (val) =>
          typeof val === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());

        const validCategoryId = isUUID(productData.category_id) ? productData.category_id.trim() : null;

        const payload = {
          title: productData.title,
          product_type: productData.product_type,
          category_id: validCategoryId,
          short_desc: productData.short_desc,
          full_desc: productData.full_desc,
          cover_image_url: productData.cover_image_url,
          download_url: productData.download_url || "", // Google Drive Link
          base_price: parseFloat(productData.base_price || 0),
          tag: productData.tag || "มาใหม่",
          status: productData.status || "active",
          metadata: productData.metadata || {},
          updated_at: new Date().toISOString()
        };

        let savedProductId = productData.id;

        if (isEdit) {
          const { error } = await this.supabaseClient.from("products").update(payload).eq("id", productData.id);
          if (error) throw error;
        } else {
          const { data, error } = await this.supabaseClient.from("products").insert([payload]).select().single();
          if (error) throw error;
          savedProductId = data.id;
        }

        // Save Variants
        if (variants && variants.length > 0) {
          await this.supabaseClient.from("product_variants").delete().eq("product_id", savedProductId);

          const variantPayloads = variants.map((v, idx) => ({
            product_id: savedProductId,
            name: v.name,
            dimension_or_detail: v.dimension_or_detail,
            file_format: v.file_format || "PNG/PDF",
            price: parseFloat(v.price || 0),
            download_file_url: v.download_file_url || productData.download_url || "",
            is_default: idx === 0 || Boolean(v.is_default),
            sort_order: idx
          }));

          const { error: varErr } = await this.supabaseClient.from("product_variants").insert(variantPayloads);
          if (varErr) throw varErr;
        }

        return { success: true, id: savedProductId };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    // Local Storage
    const local = JSON.parse(localStorage.getItem("wadfan_products") || "[]");
    const targetId = isEdit ? productData.id : "prod-" + Date.now();

    const preparedProduct = {
      ...productData,
      id: targetId,
      download_url: productData.download_url || "",
      base_price: parseFloat(productData.base_price || 0),
      variants: variants.map((v, i) => ({
        ...v,
        id: v.id || `v-${targetId}-${i}`,
        price: parseFloat(v.price || 0),
        is_default: i === 0 || Boolean(v.is_default)
      }))
    };

    if (isEdit) {
      const index = local.findIndex((p) => p.id === targetId);
      if (index !== -1) local[index] = preparedProduct;
      else local.unshift(preparedProduct);
    } else {
      local.unshift(preparedProduct);
    }

    localStorage.setItem("wadfan_products", JSON.stringify(local));
    return { success: true, id: targetId };
  }

  async deleteProduct(productId) {
    if (this.isSupabaseConnected) {
      try {
        const { error } = await this.supabaseClient.from("products").delete().eq("id", productId);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    let local = JSON.parse(localStorage.getItem("wadfan_products") || "[]");
    local = local.filter((p) => p.id !== productId);
    localStorage.setItem("wadfan_products", JSON.stringify(local));
    return { success: true };
  }

  // ==============================================================================
  // 3. Orders Management (ระบบสั่งซื้อ, ยืนยันชำระเงิน, ส่งลิงก์ Google Drive, ส่งเลขพัสดุ)
  // ==============================================================================
  async createOrder(orderData, items = []) {
    const orderNumber = "WF-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);

    const hasImage = items.some((i) => i.product_type === "image");
    const hasWorksheet = items.some((i) => i.product_type === "worksheet");
    const orderType = hasImage && hasWorksheet ? "mixed" : hasImage ? "image" : "worksheet";

    const isFree = orderData.total_amount === 0;
    const initialStatus = isFree ? "paid" : "pending";

    // จัดการไฟล์ที่ลูกค้าอัปโหลด: อัปโหลดเข้า Supabase Storage หรือบันทึก DataURL คมชัดสูง
    const googleDriveFolderPath = `Google Drive / Wadfan_Orders / ${orderNumber} /`;
    const formattedUploadedFiles = [];

    for (const file of orderData.uploaded_files || []) {
      let fileUrl = file.dataUrl || "";

      // ถ้าเชื่อมต่อ Supabase ลองอัปโหลดเข้า Storage Bucket "customer-uploads"
      if (this.isSupabaseConnected && file.file_raw) {
        try {
          // พยายามสร้าง bucket อัตโนมัติเผื่อยังไม่ได้รัน SQL
          try {
            await this.supabaseClient.storage.createBucket("customer-uploads", { public: true });
          } catch (e) {
            // ละเว้นหาก bucket มีอยู่แล้ว
          }

          const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const storagePath = `${orderNumber}/${Date.now()}_${sanitizedFileName}`;
          
          const { data: uploadData, error: uploadErr } = await this.supabaseClient.storage
            .from("customer-uploads")
            .upload(storagePath, file.file_raw, { upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = this.supabaseClient.storage
              .from("customer-uploads")
              .getPublicUrl(storagePath);
            if (publicUrlData && publicUrlData.publicUrl) {
              fileUrl = publicUrlData.publicUrl;
            }
          } else {
            console.warn("Storage upload warning, falling back to dataUrl:", uploadErr.message);
          }
        } catch (storageException) {
          console.warn("Supabase Storage error:", storageException);
        }
      }

      formattedUploadedFiles.push({
        file_name: file.name,
        file_size: file.size ? (file.size / 1024 / 1024).toFixed(2) + " MB" : "Custom File",
        file_url: fileUrl, // ลิงก์ดาวน์โหลด/พรีวิวรูปภาพจริง
        google_drive_path: `${googleDriveFolderPath}${file.name}`
      });
    }

    // บันทึก Log การส่งอีเมลทันทีสำหรับสินค้าฟรี
    let emailLog = [];
    if (isFree) {
      const freeWorksheetLinks = items.filter((i) => i.download_url).map((i) => ({ title: i.product_title, url: i.download_url }));
      emailLog.push({
        type: "free_download",
        sent_at: new Date().toISOString(),
        subject: `🎁 รับลิงก์ดาวน์โหลดฟรีทันที - Wadfan Studio (คำสั่งซื้อ ${orderNumber})`,
        download_links: freeWorksheetLinks
      });
    }

    const payload = {
      order_number: orderNumber,
      customer_name: orderData.customer_name,
      customer_email: orderData.customer_email,
      customer_phone: orderData.customer_phone || "",
      order_type: orderType,
      total_amount: parseFloat(orderData.total_amount || 0),
      payment_status: initialStatus,
      payment_method: "promptpay",
      customer_uploaded_files: formattedUploadedFiles,
      email_notification_log: emailLog,
      created_at: new Date().toISOString(),
      confirmed_at: isFree ? new Date().toISOString() : null
    };

    if (this.isSupabaseConnected) {
      try {
        const { data: orderResult, error: orderErr } = await this.supabaseClient
          .from("orders")
          .insert([payload])
          .select()
          .single();
        if (orderErr) throw orderErr;

        if (items && items.length > 0) {
          const itemPayloads = items.map((i) => ({
            order_id: orderResult.id,
            product_title: i.product_title,
            variant_name: i.variant_name,
            product_type: i.product_type || "worksheet",
            download_url: i.download_url || "",
            price: parseFloat(i.price || 0)
          }));
          await this.supabaseClient.from("order_items").insert(itemPayloads);
        }

        return { success: true, order_number: orderNumber, order: orderResult };
      } catch (err) {
        console.warn("Supabase order insert fallback:", err);
      }
    }

    // Local Storage
    const localOrders = JSON.parse(localStorage.getItem("wadfan_orders") || "[]");
    const localOrder = {
      ...payload,
      id: "ord-" + Date.now(),
      items: items
    };
    localOrders.unshift(localOrder);
    localStorage.setItem("wadfan_orders", JSON.stringify(localOrders));

    return { success: true, order_number: orderNumber, order: localOrder };
  }

  async getOrders(statusFilter = null) {
    if (this.isSupabaseConnected) {
      try {
        let query = this.supabaseClient
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false });

        if (statusFilter && statusFilter !== "all") {
          query = query.eq("payment_status", statusFilter);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map((o) => ({
            ...o,
            items: o.order_items || []
          }));
        }
      } catch (err) {
        console.warn("Supabase getOrders error:", err);
      }
    }

    let local = JSON.parse(localStorage.getItem("wadfan_orders") || "[]");
    if (statusFilter && statusFilter !== "all") {
      local = local.filter((o) => o.payment_status === statusFilter);
    }
    return local;
  }

  // แอดมินกดยืนยันการชำระเงิน -> ระบบส่งอีเมล Auto ลิงก์ Google Drive สำหรับใบงาน
  async confirmOrderPayment(orderId) {
    const orders = await this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: "ไม่พบคำสั่งซื้อ" };

    const worksheetItems = (order.items || []).filter((i) => i.product_type === "worksheet");
    const downloadLinks = worksheetItems.map((w) => ({
      title: w.product_title + " (" + w.variant_name + ")",
      url: w.download_url || "https://drive.google.com/drive/folders/wadfan-worksheets-default"
    }));

    const emailSentItem = {
      type: "payment_confirmed",
      sent_at: new Date().toISOString(),
      recipient: order.customer_email,
      subject: `🎉 ยืนยันการชำระเงินเรียบร้อยแล้ว - Wadfan Studio (คำสั่งซื้อ ${order.order_number})`,
      message: `เรียนคุณ ${order.customer_name},\n\nทางร้านได้รับยอดชำระเรียบร้อยแล้วครับ หากมีใบงานออนไลน์ในรายการสั่งซื้อ คุณสามารถคลิกดาวน์โหลดไฟล์จาก Google Drive ตามลิงก์ด้านล่างได้ทันทีครับ`,
      download_links: downloadLinks
    };

    const currentLogs = Array.isArray(order.email_notification_log) ? order.email_notification_log : [];
    const updatedLogs = [emailSentItem, ...currentLogs];

    if (this.isSupabaseConnected) {
      try {
        const { error } = await this.supabaseClient
          .from("orders")
          .update({
            payment_status: "paid",
            confirmed_at: new Date().toISOString(),
            email_notification_log: updatedLogs
          })
          .eq("id", orderId);
        if (error) throw error;
        return { success: true, emailSent: emailSentItem };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    // Local Storage
    const local = JSON.parse(localStorage.getItem("wadfan_orders") || "[]");
    const idx = local.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      local[idx].payment_status = "paid";
      local[idx].confirmed_at = new Date().toISOString();
      local[idx].email_notification_log = updatedLogs;
      localStorage.setItem("wadfan_orders", JSON.stringify(local));
    }
    return { success: true, emailSent: emailSentItem };
  }

  // แอดมินบันทึกเลขพัสดุและขนส่งสำหรับรูปภาพ -> ส่งอีเมลแจ้งเตือนลูกค้า
  async updateOrderTracking(orderId, carrier, trackingNumber) {
    const orders = await this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: "ไม่พบคำสั่งซื้อ" };

    const emailSentItem = {
      type: "shipping_notice",
      sent_at: new Date().toISOString(),
      recipient: order.customer_email,
      subject: `🚚 แจ้งเลขพัสดุจัดส่งสินค้า - Wadfan Studio (คำสั่งซื้อ ${order.order_number})`,
      message: `เรียนคุณ ${order.customer_name},\n\nผลงานรูปภาพของคุณได้รับการจัดส่งเรียบร้อยแล้วครับ โดยจัดส่งผ่าน ${carrier} หมายเลขพัสดุ: ${trackingNumber}`,
      carrier: carrier,
      tracking_number: trackingNumber
    };

    const currentLogs = Array.isArray(order.email_notification_log) ? order.email_notification_log : [];
    const updatedLogs = [emailSentItem, ...currentLogs];

    if (this.isSupabaseConnected) {
      try {
        const { error } = await this.supabaseClient
          .from("orders")
          .update({
            payment_status: "shipped",
            tracking_carrier: carrier,
            tracking_number: trackingNumber,
            shipped_at: new Date().toISOString(),
            email_notification_log: updatedLogs
          })
          .eq("id", orderId);
        if (error) throw error;
        return { success: true, emailSent: emailSentItem };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    // Local Storage
    const local = JSON.parse(localStorage.getItem("wadfan_orders") || "[]");
    const idx = local.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      local[idx].payment_status = "shipped";
      local[idx].tracking_carrier = carrier;
      local[idx].tracking_number = trackingNumber;
      local[idx].shipped_at = new Date().toISOString();
      local[idx].email_notification_log = updatedLogs;
      localStorage.setItem("wadfan_orders", JSON.stringify(local));
    }
    return { success: true, emailSent: emailSentItem };
  }
}

// Global Provider Instance
window.wadfanData = new WadfanDataProvider();
