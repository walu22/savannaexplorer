-- Seed marketplace experiences from data/marketplace.json
-- Run after schema.sql

insert into public.experiences (id, title, category, location, duration, price_range, rating, badge, best_time, image_url, description)
values
    ('saf1', '5-Day Classic Kruger Safari', 'safari', 'South Africa', '5 Days', '$$$', 4.8, 'Top Pick', 'May - October', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800', 'Experience the raw beauty of Kruger with expert local trackers.'),
    ('saf2', 'Delta Mokoro Expedition', 'safari', 'Botswana', '3 Days', '$$$$', 4.9, 'Exclusive', 'June - August', 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=800&auto=format&fit=crop', 'Glide silently through the Okavango waterways in a traditional canoe.'),
    ('saf3', 'Etosha Waterhole Watch', 'safari', 'Namibia', '4 Days', '$$', 4.6, 'Popular', 'July - October', 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=800&auto=format&fit=crop', 'Unrivaled game viewing at the famous floodlit waterholes.'),
    ('adv1', 'Namib Dune Surfing', 'adventure', 'Namibia', 'Half Day', '$$', 4.7, 'Adrenaline', 'Year-round', 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?q=80&w=800&auto=format&fit=crop', 'Tackle the sheer slipfaces of the world''s oldest desert.'),
    ('adv2', 'Zambezi White Water Rafting', 'adventure', 'Zimbabwe', '1 Day', '$$$', 4.9, 'Bestseller', 'August - December', 'https://images.unsplash.com/photo-1454486326938-e6727284ea44?q=80&w=800&auto=format&fit=crop', 'Navigate Grade 5 rapids below the majestic Victoria Falls.'),
    ('cul1', 'Himba Village Journey', 'culture', 'Namibia', '2 Days', '$$', 4.6, 'Authentic', 'May - Sept', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&q=80&w=800', 'Learn the ancient desert survival skills of the Himba people.'),
    ('cul2', 'Cape Winelands Tour', 'culture', 'South Africa', '1 Day', '$$$', 4.8, 'Relaxing', 'Nov - April', 'https://images.unsplash.com/photo-1576485375217-d6a95e34d043?q=80&w=800&auto=format&fit=crop', 'Taste world-class vintages across historic wine estates.'),
    ('nat1', 'Victoria Falls Flight', 'nature', 'Zambia', '1 Hour', '$$$', 5.0, 'Bucket List', 'Feb - May', 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=800&auto=format&fit=crop', 'Helicopter "Flight of Angels" over the thundering falls.'),
    ('nat2', 'Drakensberg Hike', 'nature', 'South Africa', '3 Days', '$$', 4.7, 'Scenic', 'March - May', 'https://images.unsplash.com/photo-1541414779316-956a5084c0d4?q=80&w=800&auto=format&fit=crop', 'Trek the spectacular Amphitheatre in the Drakensberg mountains.')
on conflict (id) do update set
    title = excluded.title,
    category = excluded.category,
    location = excluded.location,
    duration = excluded.duration,
    price_range = excluded.price_range,
    rating = excluded.rating,
    badge = excluded.badge,
    best_time = excluded.best_time,
    image_url = excluded.image_url,
    description = excluded.description;
