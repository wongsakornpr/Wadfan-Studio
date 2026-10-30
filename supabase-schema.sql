-- ==============================================================================
-- Wadfan Studio (วาดฝัน สตูดิโอ) - Supabase Database Schema v2
-- รองรับ:
-- 1. จัดการหมวดหมู่ (Categories) เพิ่ม ลบ แก้ไขได้อิสระ
-- 2. จัดการสินค้า (Products) พร้อม Google Drive download_url สำหรับใบงาน
-- 3. จัดการคำสั่งซื้อ (Orders) พร้อมระบบยืนยันชำระเงิน, ส่งลิงก์ Google Drive
--    และระบบจัดส่งพัสดุรูปภาพพร้อมเลข Tracking
-- ==============================================================================

-- 1. ตารางหมวดหมู่สินค้า (Categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    product_type TEXT NOT NULL CHECK (product_type IN ('image', 'worksheet')),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ตารางสินค้าหลัก (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    product_type TEXT NOT NULL CHECK (product_type IN ('image', 'worksheet')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    short_desc TEXT,
    full_desc TEXT,
    cover_image_url TEXT NOT NULL,
    download_url TEXT,                         -- ลิงก์ Google Drive สำหรับดาวน์โหลดใบงาน/ไฟล์ดิจิทัล
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tag TEXT DEFAULT 'มาใหม่',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    
    -- Metadata เก็บข้อมูลเฉพาะทาง:
    -- รูปภาพ: { "orientation": "landscape|portrait|square", "resolution": "4000x3000", "requires_upload": true }
    -- ใบงาน: { "grade_level": "อนุบาล 2-3", "subject": "คณิตศาสตร์", "total_pages": 30, "has_answer_key": true }
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ตารางตัวเลือกและขนาดสินค้า (Product Variants)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                         -- เช่น "ขนาด S (1080px)", "ชุด PDF + เฉลย"
    dimension_or_detail TEXT,                   -- รายละเอียดขนาด หรือจำนวนหน้า
    file_format TEXT NOT NULL DEFAULT 'PNG/PDF',-- เช่น "PNG", "PDF", "PRINT"
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    download_file_url TEXT,                     -- ลิงก์ดาวน์โหลดเฉพาะขนาด (Google Drive)
    is_default BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ตารางคำสั่งซื้อ (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,          -- เช่น WF-20261030-001
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    order_type TEXT NOT NULL DEFAULT 'worksheet' CHECK (order_type IN ('worksheet', 'image', 'mixed')),
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'shipped', 'cancelled')),
    payment_method TEXT DEFAULT 'promptpay',
    payment_slip_url TEXT,
    
    -- จัดเก็บข้อมูลไฟล์ที่ลูกค้าอัปโหลดมา (บันทึกลง Google Drive)
    -- โครงสร้างโฟลเดอร์ Google Drive: /Wadfan_Orders/{order_number}/
    customer_uploaded_files JSONB DEFAULT '[]'::jsonb,
    
    -- ข้อมูลการจัดส่งพัสดุสำหรับสินค้าประเภทรูปภาพที่ต้องจัดส่ง
    tracking_carrier TEXT,                      -- เช่น Kerry Express, Flash Express, ไปรษณีย์ไทย EMS, J&T
    tracking_number TEXT,                       -- เลขพัสดุสำหรับตรวจสอบ
    
    -- ประวัติการส่งอีเมลอัตโนมัติ
    email_notification_log JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE
);

-- ตารางรายการสินค้าในคำสั่งซื้อ (Order Items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_title TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    product_type TEXT NOT NULL DEFAULT 'worksheet',
    download_url TEXT,                          -- ลิงก์ Google Drive ของใบงานในรายการนี้
    price NUMERIC(10, 2) NOT NULL
);

-- ==============================================================================
-- 5. Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- นโยบายเปิดให้ทุกคนอ่านข้อมูลหมวดหมู่และสินค้าที่ Active
CREATE POLICY "Public categories are viewable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public products are viewable" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Public product_variants are viewable" ON public.product_variants FOR SELECT USING (true);

-- นโยบายอนุญาตให้ดำเนินการข้อมูล
CREATE POLICY "Allow anon all categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all variants" ON public.product_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 6. ข้อมูลหมวดหมู่เริ่มต้น (Seed Sample Categories)
-- ==============================================================================
INSERT INTO public.categories (name, slug, product_type, sort_order) VALUES
('ภาพวาดลายเส้นน่ารัก', 'cute-illustrations', 'image', 1),
('วอลเปเปอร์มือถือ & iPad', 'wallpapers', 'image', 2),
('ไอคอนและสติกเกอร์ตกแต่ง', 'stickers-icons', 'image', 3),
('ภาพวาดสั่งทำพิเศษ (Custom Art)', 'custom-art', 'image', 4),
('ภาษาไทย & คัดลายมือ', 'thai-language', 'worksheet', 5),
('คณิตศาสตร์แสนสนุก', 'fun-math', 'worksheet', 6),
('English & Phonics', 'english-phonics', 'worksheet', 7),
('ศิลปะ & เสริมสร้างสมาธิ', 'art-focus', 'worksheet', 8)
ON CONFLICT (slug) DO NOTHING;
