-- ==============================================================================
-- Wadfan Studio (วาดฝัน สตูดิโอ) - Supabase Database Schema
-- รองรับทั้ง "ขายรูปภาพดิจิทัล" (Digital Art) และ "ขายใบงานการเรียนรู้" (Worksheets)
-- พร้อมระบบกำหนดขนาดรูป (Sizes/Formats) และประเภทใบงาน (Worksheet Types)
-- ==============================================================================

-- 1. สร้างตารางหมวดหมู่สินค้า (Categories)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    product_type TEXT NOT NULL CHECK (product_type IN ('image', 'worksheet')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. สร้างตารางสินค้าหลัก (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    product_type TEXT NOT NULL CHECK (product_type IN ('image', 'worksheet')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    short_desc TEXT,
    full_desc TEXT,
    cover_image_url TEXT NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tag TEXT DEFAULT 'มาใหม่',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    
    -- Metadata เก็บข้อมูลเฉพาะทางของแต่ละประเภท
    -- รูปภาพ: { "orientation": "landscape|portrait|square", "resolution": "4000x3000", "color_palette": ["#FFB3C1", "#7BC5DC"] }
    -- ใบงาน: { "grade_level": "อนุบาล 2-3", "subject": "คณิตศาสตร์", "total_pages": 30, "has_answer_key": true }
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. สร้างตารางตัวเลือกและขนาดสินค้า (Product Variants)
-- สำหรับรูปภาพ: ขนาด S (Web), M (Print), L (4K), Full License
-- สำหรับใบงาน: ไฟล์ PDF ธรรมดา, PDF + เฉลยละเอียด, แพ็กเกจพร้อมไฟล์แก้ไขได้
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                         -- เช่น "ขนาด S (1080px)", "ขนาด L (4K 300DPI)", "ชุด PDF + เฉลย"
    dimension_or_detail TEXT,                   -- เช่น "1920x1080px (JPG/PNG)", "30 หน้า + 10 หน้าเฉลย"
    file_format TEXT NOT NULL DEFAULT 'PNG/JPG',-- เช่น "PNG", "JPG", "PDF", "ZIP"
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00, -- ราคาของตัวเลือกนี้
    download_file_url TEXT,                     -- ลิงก์ไฟล์สำหรับดาวน์โหลด
    is_default BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. สร้างตารางคำสั่งซื้อ (Orders & Order Items) สำหรับบันทึกการสั่งซื้อ
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    payment_method TEXT DEFAULT 'promptpay',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_title TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

-- ==============================================================================
-- 5. กำหนด Row Level Security (RLS) เพื่อความปลอดภัย
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- นโยบาย: ให้บุคคลทั่วไปอ่านข้อมูลสินค้าที่ active ได้
CREATE POLICY "Public categories are viewable by everyone" 
ON public.categories FOR SELECT USING (true);

CREATE POLICY "Public products are viewable by everyone" 
ON public.products FOR SELECT USING (status = 'active');

CREATE POLICY "Public product_variants are viewable by everyone" 
ON public.product_variants FOR SELECT USING (true);

-- นโยบายสำหรับ Admin หรือการทดสอบ (เปิดสิทธิ์การเพิ่ม ลบ แก้ไขผ่าน anon key สำหรับโปรเจกต์นี้)
CREATE POLICY "Allow anon insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete products" ON public.products FOR DELETE USING (true);

CREATE POLICY "Allow anon insert categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete categories" ON public.categories FOR DELETE USING (true);

CREATE POLICY "Allow anon insert variants" ON public.product_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update variants" ON public.product_variants FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete variants" ON public.product_variants FOR DELETE USING (true);

CREATE POLICY "Allow anon insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 6. ข้อมูลเริ่มต้น (Seed Sample Data)
-- ==============================================================================

-- หมวดหมู่เริ่มต้น
INSERT INTO public.categories (name, slug, product_type) VALUES
('ภาพวาดลายเส้นน่ารัก', 'cute-illustrations', 'image'),
('วอลเปเปอร์มือถือ & iPad', 'wallpapers', 'image'),
('ไอคอนและสติกเกอร์ตกแต่ง', 'stickers-icons', 'image'),
('ภาษาไทย & คัดลายมือ', 'thai-language', 'worksheet'),
('คณิตศาสตร์แสนสนุก', 'fun-math', 'worksheet'),
('English & Phonics', 'english-phonics', 'worksheet'),
('ศิลปะ & เสริมสร้างสมาธิ', 'art-focus', 'worksheet')
ON CONFLICT (slug) DO NOTHING;
