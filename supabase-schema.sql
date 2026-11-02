-- ==============================================================================
-- Wadfan Studio (วาดฝัน สตูดิโอ) - Supabase Database Schema (Idempotent & Safe)
-- สคริปต์นี้รองรับทั้งการติดตั้งใหม่ หรือการอัปเดตจากเวอร์ชันเดิมโดยไม่ติด Error
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

-- เพิ่มคอลัมน์ให้อัตโนมัติ กรณีที่มีตาราง categories เดิมอยู่แล้ว
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;


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
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- เพิ่มคอลัมน์ download_url ให้อัตโนมัติ กรณีตาราง products มีอยู่เดิม
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS download_url TEXT;


-- 3. ตารางตัวเลือกและขนาดสินค้า (Product Variants)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dimension_or_detail TEXT,
    file_format TEXT NOT NULL DEFAULT 'PNG/PDF',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    download_file_url TEXT,
    is_default BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS download_file_url TEXT;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;


-- 4. ตารางคำสั่งซื้อ (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    order_type TEXT NOT NULL DEFAULT 'worksheet',
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT DEFAULT 'promptpay',
    payment_slip_url TEXT,
    customer_uploaded_files JSONB DEFAULT '[]'::jsonb,
    tracking_carrier TEXT,
    tracking_number TEXT,
    email_notification_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE
);

-- อัปเดตคอลัมน์ของคำสั่งซื้อให้ครบถ้วนกรณีมีตาราง orders เดิม
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'worksheet';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_slip_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_uploaded_files JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_carrier TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_notification_log JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS google_drive_folder_url TEXT;

-- ปลดล็อกและอัปเดต Check Constraint ของ payment_status เพื่อให้รองรับสถานะ 'shipped' (จัดส่งพัสดุแล้ว)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'paid', 'shipped', 'cancelled', 'refunded'));


-- ตารางรายการสินค้าในคำสั่งซื้อ (Order Items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_title TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    product_type TEXT NOT NULL DEFAULT 'worksheet',
    download_url TEXT,
    price NUMERIC(10, 2) NOT NULL
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'worksheet';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS download_url TEXT;


-- 5. ตารางคำขอรับชุดใบงาน/ของขวัญฟรี (Freebie Requests)
CREATE TABLE IF NOT EXISTS public.freebie_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent')),
    gift_type TEXT DEFAULT 'worksheet',
    download_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ตารางการตั้งค่าระบบ (System Settings) สำหรับเก็บ Freebie Download URL และการตั้งค่าอื่นๆ
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ==============================================================================
-- 6. Row Level Security (RLS) & นโยบายความปลอดภัย
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freebie_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ลบนโยบายเดิมก่อนสร้างใหม่ ป้องกัน policy already exists error
DROP POLICY IF EXISTS "Public categories are viewable" ON public.categories;
DROP POLICY IF EXISTS "Public categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Allow anon all categories" ON public.categories;
DROP POLICY IF EXISTS "Allow anon insert categories" ON public.categories;
DROP POLICY IF EXISTS "Allow anon update categories" ON public.categories;
DROP POLICY IF EXISTS "Allow anon delete categories" ON public.categories;

DROP POLICY IF EXISTS "Public products are viewable" ON public.products;
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Allow anon all products" ON public.products;
DROP POLICY IF EXISTS "Allow anon insert products" ON public.products;
DROP POLICY IF EXISTS "Allow anon update products" ON public.products;
DROP POLICY IF EXISTS "Allow anon delete products" ON public.products;

DROP POLICY IF EXISTS "Public product_variants are viewable" ON public.product_variants;
DROP POLICY IF EXISTS "Public product_variants are viewable by everyone" ON public.product_variants;
DROP POLICY IF EXISTS "Allow anon all variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow anon insert variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow anon update variants" ON public.product_variants;
DROP POLICY IF EXISTS "Allow anon delete variants" ON public.product_variants;

DROP POLICY IF EXISTS "Allow anon all orders" ON public.orders;
DROP POLICY IF EXISTS "Allow anon insert orders" ON public.orders;

DROP POLICY IF EXISTS "Allow anon all order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow anon insert order_items" ON public.order_items;

-- สร้างนโยบายการเข้าถึงข้อมูลใหม่
CREATE POLICY "Public categories are viewable" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow anon all categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public products are viewable" ON public.products FOR SELECT USING (status = 'active');
CREATE POLICY "Allow anon all products" ON public.products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public product_variants are viewable" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Allow anon all variants" ON public.product_variants FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon all orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all freebie_requests" ON public.freebie_requests;
CREATE POLICY "Allow anon all freebie_requests" ON public.freebie_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all system_settings" ON public.system_settings;
CREATE POLICY "Allow anon all system_settings" ON public.system_settings FOR ALL USING (true) WITH CHECK (true);


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
ON CONFLICT (slug) DO UPDATE 
SET sort_order = EXCLUDED.sort_order,
    product_type = EXCLUDED.product_type;


-- ==============================================================================
-- 7. สร้าง Storage Bucket สำหรับจัดเก็บรูปภาพที่ลูกค้าอัปโหลด (Customer Uploads)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('customer-uploads', 'customer-uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Uploads customer-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Downloads customer-uploads" ON storage.objects;

CREATE POLICY "Public Uploads customer-uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'customer-uploads');
CREATE POLICY "Public Downloads customer-uploads" ON storage.objects FOR SELECT USING (bucket_id = 'customer-uploads');
