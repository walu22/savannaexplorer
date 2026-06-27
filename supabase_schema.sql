-- DEPRECATED: use supabase/schema.sql (hub mode v4.11+) instead.
-- This file is kept for historical reference only.

-- Create the UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Experiences Table
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT,
    duration TEXT,
    price_range TEXT,
    rating NUMERIC DEFAULT 4.5,
    badge TEXT,
    best_time TEXT,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Providers Table
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    contact_number TEXT,
    email TEXT,
    country TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Experience Providers Link Table
CREATE TABLE experience_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE
);

-- 4. Create Inquiries Table (Analytics & Tracking)
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL,
    message TEXT,
    source TEXT DEFAULT 'whatsapp',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS) policies
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to experiences
CREATE POLICY "Allow public read-only access to experiences" 
ON experiences FOR SELECT USING (true);

-- Allow public to insert inquiries (for tracking)
CREATE POLICY "Allow public to insert inquiries" 
ON inquiries FOR INSERT WITH CHECK (true);

-- Note: Providers and experience_providers remain private to the backend/admin.

-- ==========================================
-- STARTER DATA (Seed)
-- Run this block to instantly populate your marketplace
-- ==========================================

INSERT INTO experiences (id, title, category, location, duration, price_range, rating, badge, best_time, image_url, description)
VALUES 
    ('e1111111-1111-1111-1111-111111111111', '5-Day Classic Kruger Safari', 'safari', 'South Africa', '5 Days', '$$$', 4.8, 'Top Pick', 'May - October', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800', 'Experience the raw beauty of Kruger with expert local trackers.'),
    ('e2222222-2222-2222-2222-222222222222', 'Delta Mokoro Expedition', 'safari', 'Botswana', '3 Days', '$$$$', 4.9, 'Exclusive', 'June - August', 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=800&auto=format&fit=crop', 'Glide silently through the Okavango waterways in a traditional canoe.'),
    ('e3333333-3333-3333-3333-333333333333', 'Etosha Waterhole Watch', 'safari', 'Namibia', '4 Days', '$$', 4.6, 'Popular', 'July - October', 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=800&auto=format&fit=crop', 'Unrivaled game viewing at the famous floodlit waterholes.'),
    
    ('e4444444-4444-4444-4444-444444444444', 'Namib Dune Surfing', 'adventure', 'Namibia', 'Half Day', '$$', 4.7, 'Adrenaline', 'Year-round', 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=800&auto=format&fit=crop', 'Tackle the sheer slipfaces of the world''s oldest desert.'),
    ('e5555555-5555-5555-5555-555555555555', 'Zambezi White Water Rafting', 'adventure', 'Zimbabwe', '1 Day', '$$$', 4.9, 'Bestseller', 'August - December', 'https://images.unsplash.com/photo-1454486326938-e6727284ea44?q=80&w=800&auto=format&fit=crop', 'Navigate Grade 5 rapids below the majestic Victoria Falls.'),
    
    ('e6666666-6666-6666-6666-666666666666', 'Himba Village Journey', 'culture', 'Namibia', '2 Days', '$$', 4.6, 'Authentic', 'May - Sept', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800', 'Learn the ancient desert survival skills of the Himba people.'),
    ('e7777777-7777-7777-7777-777777777777', 'Cape Winelands Tour', 'culture', 'South Africa', '1 Day', '$$$', 4.8, 'Relaxing', 'Nov - April', 'https://images.unsplash.com/photo-1576485375217-d6a95e34d043?q=80&w=800&auto=format&fit=crop', 'Taste world-class vintages across historic wine estates.'),
    
    ('e8888888-8888-8888-8888-888888888888', 'Victoria Falls Flight', 'nature', 'Zambia', '1 Hour', '$$$', 5.0, 'Bucket List', 'Feb - May', 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=800&auto=format&fit=crop', 'Helicopter "Flight of Angels" over the thundering falls.'),
    ('e9999999-9999-9999-9999-999999999999', 'Drakensberg Hike', 'nature', 'South Africa', '3 Days', '$$', 4.7, 'Scenic', 'March - May', 'https://images.unsplash.com/photo-1541414779316-956a5084c0d4?q=80&w=800&auto=format&fit=crop', 'Trek the spectacular Amphitheatre in the Drakensberg mountains.')
ON CONFLICT (id) DO NOTHING;
