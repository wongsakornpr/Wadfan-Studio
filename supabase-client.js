/**
 * Wadfan Studio - Supabase Client & Data Provider Layer
 * Minimal & Warm Architecture with Fallback Mock Database
 */

// Default Demo Data (ใช้เมื่อยังไม่ได้เชื่อมต่อ Supabase หรือใช้ทดสอบในเครื่อง)
const DEFAULT_SAMPLE_CATEGORIES = [
  { id: "cat-img-1", name: "ภาพประกอบ & อาร์ตเวิร์ก", slug: "cute-illustrations", product_type: "image" },
  { id: "cat-img-2", name: "วอลเปเปอร์มือถือ & แท็บเล็ต", slug: "wallpapers", product_type: "image" },
  { id: "cat-img-3", name: "สติกเกอร์ & คลิปอาร์ตใส", slug: "stickers-icons", product_type: "image" },
  { id: "cat-ws-1", name: "ภาษาไทย & คัดลายมือ", slug: "thai-language", product_type: "worksheet" },
  { id: "cat-ws-2", name: "คณิตศาสตร์แสนสนุก", slug: "fun-math", product_type: "worksheet" },
  { id: "cat-ws-3", name: "English & Phonics", slug: "english-phonics", product_type: "worksheet" },
  { id: "cat-ws-4", name: "ศิลปะ & พัฒนาการ", slug: "art-focus", product_type: "worksheet" }
];

const DEFAULT_SAMPLE_PRODUCTS = [
  // --- 1. สินค้าหมวด "ขายรูปภาพดิจิทัล" (Images) ---
  {
    id: "prod-img-1",
    title: "ชุดภาพวาด 'เจ้ากระต่ายน้อยในสวนสายรุ้ง'",
    product_type: "image",
    category_id: "cat-img-1",
    category_name: "ภาพประกอบ & อาร์ตเวิร์ก",
    short_desc: "ภาพประกอบดิจิทัลโทนสีพาสเทลอบอุ่น เหมาะสำหรับโปสเตอร์ การ์ด หรือสื่อการสอน",
    full_desc: "ผลงานวาดมือดิจิทัลแท้สไตล์ Wadfan Studio ให้ความรู้สึกผ่อนคลาย อบอุ่น สบายตา ไฟล์คมชัดสูงพร้อมตัวเลือกขนาดตั้งแต่ภาพไซส์เว็บ สื่อสิ่งพิมพ์ ไปจนถึงสิทธิ์ใช้งานเชิงพาณิชย์",
    cover_image_url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
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
      { id: "v-img-1-2", name: "ขนาด M (High-Res Print)", dimension_or_detail: "3000 x 4000 px (300 DPI)", file_format: "PNG คมชัดสูง", price: 79, is_default: false },
      { id: "v-img-1-3", name: "ขนาด L + สิทธิ์เชิงพาณิชย์", dimension_or_detail: "4500 x 6000 px + License", file_format: "Original PNG + PDF", price: 189, is_default: false }
    ]
  },
  {
    id: "prod-img-2",
    title: "วอลเปเปอร์ 'ท้องฟ้าและก้อนเมฆฝันหวาน'",
    product_type: "image",
    category_id: "cat-img-2",
    category_name: "วอลเปเปอร์มือถือ & แท็บเล็ต",
    short_desc: "วอลเปเปอร์โทนสีฟ้า-ชมพูมินิมอล สำหรับ iPhone, iPad และ Android ปรับสายตาให้สบาย",
    full_desc: "ภาพพื้นหลังหน้าจอโทน Minimal Warm ผสมผสานประกายดาวและปุยเมฆ สร้างแรงบันดาลใจทุกครั้งที่ปลดล็อกหน้าจอ รองรับสัดส่วนทั้งสมาร์ตโฟนและแท็บเล็ตความละเอียดสูง",
    cover_image_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
    base_price: 29,
    tag: "มาใหม่",
    status: "active",
    metadata: {
      orientation: "portrait",
      color_palette: ["#7BC5DC", "#FFB3C1"],
      resolution: "4K UHD"
    },
    variants: [
      { id: "v-img-2-1", name: "สำหรับ Smartphone (All Models)", dimension_or_detail: "1290 x 2796 px (OLED Friendly)", file_format: "PNG", price: 29, is_default: true },
      { id: "v-img-2-2", name: "สำหรับ iPad & Tablet + Phone", dimension_or_detail: "2048 x 2732 px (2 Sizes)", file_format: "PNG Pack", price: 49, is_default: false }
    ]
  },
  {
    id: "prod-img-3",
    title: "เซตคลิปอาร์ต 'อุปกรณ์การเรียนและขนมหวาน' (30 ชิ้น)",
    product_type: "image",
    category_id: "cat-img-3",
    category_name: "สติกเกอร์ & คลิปอาร์ตใส",
    short_desc: "ไฟล์ PNG พื้นหลังโปร่งใส สำหรับตกแต่งใบงาน GoodNotes, Notability และสื่อตกแต่งห้องเรียน",
    full_desc: "ชุดภาพวาดไดคัตขอบโปร่งใส ลายเส้นนุ่มละมุน ประกอบด้วยสมุด ดินสอ ลูกโป่ง เค้ก ดาว และตัวการ์ตูนน่ารัก 30 ลาย สามารถนำไปแปะตกแต่งใบงานของคุณครูหรือสมุดไดอารี่ดิจิทัลได้อย่างลงตัว",
    cover_image_url: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=80",
    base_price: 69,
    tag: "แนะนำ",
    status: "active",
    metadata: {
      items_count: 30,
      format: "Transparent PNG",
      resolution: "300 DPI Per Icon"
    },
    variants: [
      { id: "v-img-3-1", name: "ชุดการใช้งานส่วนบุคคล (Personal)", dimension_or_detail: "30 ชิ้น PNG 300 DPI (Zip)", file_format: "PNG ZIP", price: 69, is_default: true },
      { id: "v-img-3-2", name: "ชุดใช้งานเชิงพาณิชย์ (Commercial)", dimension_or_detail: "30 ชิ้น + สิทธิ์ทำสินค้าขายต่อ", file_format: "PNG ZIP + License", price: 159, is_default: false }
    ]
  },

  // --- 2. สินค้าหมวด "ขายใบงานการเรียนรู้" (Worksheets) ---
  {
    id: "prod-ws-1",
    title: "ชุดนับจำนวนและเปรียบเทียบ 1-20 แสนสนุก",
    product_type: "worksheet",
    category_id: "cat-ws-2",
    category_name: "คณิตศาสตร์แสนสนุก",
    short_desc: "ฝึกการนับจำนวน จับคู่ตัวเลข และเครื่องหมายมากกว่า-น้อยกว่า ลายเส้นน่ารัก",
    full_desc: "ชุดแบบฝึกหัดคณิตศาสตร์ปฐมวัย เน้นการเรียนรู้ผ่านภาพผลไม้และสัตว์น่ารัก ช่วยให้เด็กๆ เข้าใจความหมายของจำนวน 1-20 อย่างเป็นรูปธรรม พร้อมเกมโยงเส้นจับคู่และระบายสีตามจำนวน",
    cover_image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80",
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
    full_desc: "ใบงานคัดลายมือพยัญชนะไทย ก ไก่ ถึง ฮ นกฮูก ตัวอักษรหัวกลมมาตรฐาน มีทิศทางลูกศรบอกขั้นตอนการลากเส้นอย่างชัดเจน ช่วยฝึกกล้ามเนื้อมัดเล็กและประสาทสัมผัสตาและมือ",
    cover_image_url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80",
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
      { id: "v-ws-2-1", name: "ชุดฝึกคัดพื้นฐาน ก-ฮ", dimension_or_detail: "44 หน้า ขนาด A4 คมชัด", file_format: "PDF 300 DPI", price: 79, is_default: true },
      { id: "v-ws-2-2", name: "ชุดสมบูรณ์ + โปสเตอร์ติดผนัง", dimension_or_detail: "44 หน้า + โปสเตอร์สรุป 1 แผ่น", file_format: "PDF + Poster", price: 99, is_default: false }
    ]
  },
  {
    id: "prod-ws-3",
    title: "Fun Phonics Starter: ออกเสียงคำศัพท์ A-Z",
    product_type: "worksheet",
    category_id: "cat-ws-3",
    category_name: "English & Phonics",
    short_desc: "ฝึกออกเสียงโฟนิกส์พื้นฐาน จับคู่เสียงกับรูปภาพ และสะกดคำ 3 ตัวอักษร (CVC Words)",
    full_desc: "สื่อการสอนโฟนิกส์เบื้องต้นสำหรับคุณหนูๆ ปูพื้นฐานการออกเสียงสระและพยัญชนะภาษาอังกฤษอย่างเป็นธรรมชาติ พร้อมกิจกรรม Cut & Paste เสริมความสนุก",
    cover_image_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80",
    base_price: 89,
    tag: "มาใหม่",
    status: "active",
    metadata: {
      grade_level: "อนุบาล 3 - ป.1",
      total_pages: 30,
      has_answer_key: true,
      subject: "ภาษาอังกฤษ"
    },
    variants: [
      { id: "v-ws-3-1", name: "ชุดแบบฝึกหัด Phonics 30 หน้า", dimension_or_detail: "30 หน้า กิจกรรมครบชุด", file_format: "PDF", price: 89, is_default: true },
      { id: "v-ws-3-2", name: "ชุด All-in-One + แฟลชการ์ดคำศัพท์", dimension_or_detail: "30 หน้า + Flashcards 52 ใบ", file_format: "PDF Pack", price: 119, is_default: false }
    ]
  },
  {
    id: "prod-ws-4",
    title: "ศิลปะลากเส้นต่อจุด & เขาวงกตเสริมสมาธิ",
    product_type: "worksheet",
    category_id: "cat-ws-4",
    category_name: "ศิลปะ & พัฒนาการ",
    short_desc: "ชุดฝึกกล้ามเนื้อมัดเล็กและฝึกสมาธิด้วยการลากเส้นตามรอยประและเขาวงกต",
    full_desc: "ชุดใบงานแจกฟรีสุดพิเศษจาก Wadfan Studio รวบรวมเกมลากเส้นต่อจุดตามตัวเลขและเกมเขาวงกตที่ช่วยดึงดูดสมาธิเด็กให้อยู่นิ่งและเพลิดเพลินกับการแก้ปัญหา",
    cover_image_url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80",
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
      { id: "v-ws-4-1", name: "ดาวน์โหลดฟรีชุดทดลอง 20 หน้า", dimension_or_detail: "20 หน้า A4 เต็มเล่ม", file_format: "PDF", price: 0, is_default: true }
    ]
  }
];

// Supabase Global Wrapper
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
        console.log("☁️ Supabase client initialized with custom configuration.");
      } catch (err) {
        console.warn("⚠️ Failed to initialize Supabase client, falling back to local storage:", err);
        this.isSupabaseConnected = false;
      }
    } else {
      console.log("📦 Supabase credentials not set yet. Using local database storage.");
      this.isSupabaseConnected = false;
    }

    // Initialize LocalStorage Database if empty
    this.ensureLocalStore();
  }

  ensureLocalStore() {
    if (!localStorage.getItem("wadfan_products")) {
      localStorage.setItem("wadfan_products", JSON.stringify(DEFAULT_SAMPLE_PRODUCTS));
    }
    if (!localStorage.getItem("wadfan_categories")) {
      localStorage.setItem("wadfan_categories", JSON.stringify(DEFAULT_SAMPLE_CATEGORIES));
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
    if (!this.supabaseClient) {
      return { success: false, message: "ยังไม่ได้ระบุ Supabase URL และ Key" };
    }
    try {
      const { data, error } = await this.supabaseClient.from("products").select("id").limit(1);
      if (error) throw error;
      return { success: true, message: "เชื่อมต่อกับฐานข้อมูล Supabase สำเร็จเรียบร้อยแล้ว!" };
    } catch (err) {
      return { success: false, message: `เกิดข้อผิดพลาด: ${err.message || err}` };
    }
  }

  // --- 1. Fetch Categories ---
  async getCategories(typeFilter = null) {
    if (this.isSupabaseConnected) {
      try {
        let query = this.supabaseClient.from("categories").select("*").order("name");
        if (typeFilter && typeFilter !== "all") {
          query = query.eq("product_type", typeFilter);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data;
      } catch (err) {
        console.warn("Supabase fetch categories fallback:", err);
      }
    }

    // LocalStorage fallback
    const local = JSON.parse(localStorage.getItem("wadfan_categories") || "[]");
    if (!typeFilter || typeFilter === "all") return local;
    return local.filter((c) => c.product_type === typeFilter);
  }

  // --- 2. Fetch Products ---
  async getProducts(filters = {}) {
    const { type, categorySlug, search, status } = filters;

    if (this.isSupabaseConnected) {
      try {
        let query = this.supabaseClient
          .from("products")
          .select("*, categories(name, slug), product_variants(*)")
          .order("created_at", { ascending: false });

        if (type && type !== "all") {
          query = query.eq("product_type", type);
        }
        if (status) {
          query = query.eq("status", status);
        }
        if (search) {
          query = query.ilike("title", `%${search}%`);
        }

        const { data, error } = await query;
        if (!error && data) {
          // Format data to match local structure
          return data.map((item) => ({
            ...item,
            category_name: item.categories ? item.categories.name : "ทั่วไป",
            variants: item.product_variants || []
          }));
        }
      } catch (err) {
        console.warn("Supabase fetch products fallback:", err);
      }
    }

    // Local Storage Fallback
    let local = JSON.parse(localStorage.getItem("wadfan_products") || "[]");
    if (type && type !== "all") {
      local = local.filter((p) => p.product_type === type);
    }
    if (categorySlug && categorySlug !== "all") {
      const cats = JSON.parse(localStorage.getItem("wadfan_categories") || "[]");
      const matchedCat = cats.find((c) => c.slug === categorySlug);
      if (matchedCat) {
        local = local.filter((p) => p.category_id === matchedCat.id);
      }
    }
    if (status) {
      local = local.filter((p) => p.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      local = local.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.short_desc && p.short_desc.toLowerCase().includes(q))
      );
    }
    return local;
  }

  // --- 3. Save / Update Product ---
  async saveProduct(productData, variants = []) {
    const isEdit = Boolean(productData.id);

    if (this.isSupabaseConnected) {
      try {
        const payload = {
          title: productData.title,
          product_type: productData.product_type,
          category_id: productData.category_id || null,
          short_desc: productData.short_desc,
          full_desc: productData.full_desc,
          cover_image_url: productData.cover_image_url,
          base_price: parseFloat(productData.base_price || 0),
          tag: productData.tag || "มาใหม่",
          status: productData.status || "active",
          metadata: productData.metadata || {},
          updated_at: new Date().toISOString()
        };

        let savedProductId = productData.id;

        if (isEdit) {
          const { error } = await this.supabaseClient
            .from("products")
            .update(payload)
            .eq("id", productData.id);
          if (error) throw error;
        } else {
          const { data, error } = await this.supabaseClient
            .from("products")
            .insert([payload])
            .select()
            .single();
          if (error) throw error;
          savedProductId = data.id;
        }

        // Save Variants
        if (variants && variants.length > 0) {
          // Delete old variants
          await this.supabaseClient
            .from("product_variants")
            .delete()
            .eq("product_id", savedProductId);

          const variantPayloads = variants.map((v, idx) => ({
            product_id: savedProductId,
            name: v.name,
            dimension_or_detail: v.dimension_or_detail,
            file_format: v.file_format || "PNG/PDF",
            price: parseFloat(v.price || 0),
            download_file_url: v.download_file_url || "",
            is_default: idx === 0 || Boolean(v.is_default),
            sort_order: idx
          }));

          const { error: varErr } = await this.supabaseClient
            .from("product_variants")
            .insert(variantPayloads);
          if (varErr) throw varErr;
        }

        return { success: true, id: savedProductId };
      } catch (err) {
        console.error("Supabase Save error:", err);
        return { success: false, message: err.message || err };
      }
    }

    // Local Storage Fallback
    const local = JSON.parse(localStorage.getItem("wadfan_products") || "[]");
    const targetId = isEdit ? productData.id : "prod-" + Date.now();

    const preparedProduct = {
      ...productData,
      id: targetId,
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
      if (index !== -1) {
        local[index] = preparedProduct;
      } else {
        local.unshift(preparedProduct);
      }
    } else {
      local.unshift(preparedProduct);
    }

    localStorage.setItem("wadfan_products", JSON.stringify(local));
    return { success: true, id: targetId };
  }

  // --- 4. Delete Product ---
  async deleteProduct(productId) {
    if (this.isSupabaseConnected) {
      try {
        const { error } = await this.supabaseClient
          .from("products")
          .delete()
          .eq("id", productId);
        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false, message: err.message };
      }
    }

    // Local Storage
    let local = JSON.parse(localStorage.getItem("wadfan_products") || "[]");
    local = local.filter((p) => p.id !== productId);
    localStorage.setItem("wadfan_products", JSON.stringify(local));
    return { success: true };
  }
}

// Global Provider Instance
window.wadfanData = new WadfanDataProvider();
