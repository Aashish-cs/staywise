-- Phase 57 expanded marketplace inventory for StayWise.
-- Run after schema.sql and phase2_seed.sql.
-- These are StayWise demo inventory rows for senior-design QA and demos.
-- They are not scraped from Airbnb or any other marketplace.

begin;

create temporary table staywise_phase57_inventory on commit drop as
with city_catalog (
  slug,
  city,
  state,
  country,
  country_code,
  neighborhood,
  latitude,
  longitude,
  price_base
) as (
  values
    ('austin', 'Austin', 'TX', 'United States', 'us', 'East Austin', 30.263500, -97.705900, 146),
    ('dallas', 'Dallas', 'TX', 'United States', 'us', 'Bishop Arts', 32.748300, -96.829700, 152),
    ('fort-worth', 'Fort Worth', 'TX', 'United States', 'us', 'Cultural District', 32.748000, -97.368700, 138),
    ('galveston', 'Galveston', 'TX', 'United States', 'us', 'East End', 29.301300, -94.797700, 168),
    ('houston', 'Houston', 'TX', 'United States', 'us', 'Montrose', 29.742600, -95.391000, 144),
    ('fredericksburg', 'Fredericksburg', 'TX', 'United States', 'us', 'Main Street', 30.275200, -98.871900, 171),
    ('san-antonio', 'San Antonio', 'TX', 'United States', 'us', 'Pearl District', 29.441900, -98.480900, 141),
    ('south-padre-island', 'South Padre Island', 'TX', 'United States', 'us', 'Gulf Boulevard', 26.111800, -97.168100, 176),
    ('corpus-christi', 'Corpus Christi', 'TX', 'United States', 'us', 'Bay Area', 27.800600, -97.396400, 149),
    ('broken-bow', 'Broken Bow', 'OK', 'United States', 'us', 'Hochatown', 34.178000, -94.751600, 188),
    ('new-orleans', 'New Orleans', 'LA', 'United States', 'us', 'Marigny', 29.965600, -90.055000, 164),
    ('miami-beach', 'Miami Beach', 'FL', 'United States', 'us', 'South Beach', 25.782600, -80.134100, 214),
    ('orlando', 'Orlando', 'FL', 'United States', 'us', 'Lake Eola', 28.542100, -81.375000, 153),
    ('las-vegas', 'Las Vegas', 'NV', 'United States', 'us', 'Arts District', 36.159800, -115.152200, 162),
    ('chicago', 'Chicago', 'IL', 'United States', 'us', 'West Loop', 41.884000, -87.647000, 158),
    ('new-york', 'New York', 'NY', 'United States', 'us', 'Upper West Side', 40.787000, -73.975400, 226),
    ('london', 'London', 'England', 'United Kingdom', 'gb', 'Covent Garden', 51.511700, -0.124000, 219),
    ('paris', 'Paris', 'Ile-de-France', 'France', 'fr', 'Le Marais', 48.857500, 2.358300, 211),
    ('barcelona', 'Barcelona', 'Catalonia', 'Spain', 'es', 'Eixample', 41.391700, 2.164900, 183),
    ('tokyo', 'Tokyo', 'Tokyo', 'Japan', 'jp', 'Shibuya', 35.659500, 139.700500, 204)
),
style_catalog (
  variant,
  title_prefix,
  property_type,
  price_offset,
  capacity,
  bedrooms,
  bathrooms,
  amenities,
  image_url
) as (
  values
    (
      1,
      'Light-filled apartment near cafes',
      'Apartment',
      0,
      2,
      1,
      1.0,
      array['Fast Wi-Fi', 'Workspace', 'Kitchen', 'Self check-in'],
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=80'
    ),
    (
      2,
      'Guest favorite home with full kitchen',
      'House',
      26,
      5,
      2,
      2.0,
      array['Fast Wi-Fi', 'Kitchen', 'Parking', 'Washer', 'Pet friendly'],
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80'
    ),
    (
      3,
      'Design loft for remote work',
      'Loft',
      18,
      3,
      1,
      1.0,
      array['Fast Wi-Fi', 'Workspace', 'Kitchen', 'Washer', 'Self check-in'],
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80'
    ),
    (
      4,
      'Townhome with easy parking',
      'Townhome',
      42,
      6,
      3,
      2.5,
      array['Fast Wi-Fi', 'Kitchen', 'Parking', 'Washer', 'Self check-in'],
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80'
    ),
    (
      5,
      'Quiet cabin-inspired retreat',
      'Cabin',
      35,
      4,
      2,
      1.5,
      array['Fast Wi-Fi', 'Kitchen', 'Parking', 'Pet friendly', 'Self check-in'],
      'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=80'
    ),
    (
      6,
      'Villa stay with pool access',
      'Villa',
      83,
      8,
      4,
      3.0,
      array['Fast Wi-Fi', 'Kitchen', 'Parking', 'Pool', 'Washer'],
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80'
    )
),
image_catalog (
  idx,
  image_url
) as (
  values
    (1, 'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=80'),
    (2, 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=80'),
    (3, 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80'),
    (4, 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80'),
    (5, 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=80'),
    (6, 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1400&q=80'),
    (7, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80'),
    (8, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=80'),
    (9, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=80'),
    (10, 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=80'),
    (11, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80'),
    (12, 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80'),
    (13, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80'),
    (14, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80'),
    (15, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=80'),
    (16, 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1400&q=80'),
    (17, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80'),
    (18, 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1400&q=80'),
    (19, 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?auto=format&fit=crop&w=1400&q=80'),
    (20, 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=80'),
    (21, 'https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?auto=format&fit=crop&w=1400&q=80'),
    (22, 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1400&q=80'),
    (23, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80'),
    (24, 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80'),
    (25, 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=80'),
    (26, 'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1400&q=80'),
    (27, 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=1400&q=80'),
    (28, 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=80'),
    (29, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80'),
    (30, 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1400&q=80')
),
raw_inventory as (
  select
    md5(format('staywise-homepage-inventory-v1-%s-%s', city_catalog.slug, style_catalog.variant)) as id_hash,
    city_catalog.city,
    city_catalog.state,
    city_catalog.country,
    city_catalog.country_code,
    city_catalog.neighborhood,
    city_catalog.latitude + ((style_catalog.variant - 3) * 0.008) as latitude,
    city_catalog.longitude + ((style_catalog.variant - 3) * 0.010) as longitude,
    city_catalog.price_base + style_catalog.price_offset + (style_catalog.variant * 3) as price_per_night,
    style_catalog.variant,
    style_catalog.title_prefix,
    style_catalog.property_type,
    style_catalog.capacity,
    style_catalog.bedrooms,
    style_catalog.bathrooms,
    style_catalog.amenities,
    image_catalog.image_url
  from city_catalog
  cross join style_catalog
  join image_catalog
    on image_catalog.idx = mod(abs(hashtext(city_catalog.slug)) + (style_catalog.variant * 7), 30) + 1
)
select
  concat(
    substr(id_hash, 1, 8),
    '-',
    substr(id_hash, 9, 4),
    '-',
    substr(id_hash, 13, 4),
    '-',
    substr(id_hash, 17, 4),
    '-',
    substr(id_hash, 21, 12)
  )::uuid as id,
  concat(title_prefix, ' in ', neighborhood) as title,
  concat(
    'A polished StayWise ',
    lower(property_type),
    ' in ',
    neighborhood,
    ', ',
    city,
    ' with ',
    lower(array_to_string(amenities[1:3], ', ')),
    '. Built for smooth trip planning, verified accounts, saved stays, and the StayWise reservation flow.'
  ) as description,
  city,
  state,
  country,
  neighborhood,
  property_type,
  price_per_night,
  capacity,
  bedrooms,
  bathrooms,
  latitude,
  longitude,
  amenities,
  image_url,
  concat(property_type, ' stay in ', city) as image_alt
from raw_inventory;

insert into public.listings (
  id,
  host_id,
  title,
  description,
  city,
  state,
  country,
  neighborhood,
  property_type,
  price_per_night,
  capacity,
  bedrooms,
  bathrooms,
  latitude,
  longitude,
  is_active
)
select
  id,
  null,
  title,
  description,
  city,
  state,
  country,
  neighborhood,
  property_type,
  price_per_night,
  capacity,
  bedrooms,
  bathrooms,
  latitude,
  longitude,
  true
from staywise_phase57_inventory
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  city = excluded.city,
  state = excluded.state,
  country = excluded.country,
  neighborhood = excluded.neighborhood,
  property_type = excluded.property_type,
  price_per_night = excluded.price_per_night,
  capacity = excluded.capacity,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  is_active = excluded.is_active,
  updated_at = now();

delete from public.listing_images
where listing_id in (
  select id from staywise_phase57_inventory
);

insert into public.listing_images (listing_id, image_url, alt_text, sort_order)
select id, image_url, image_alt, 0
from staywise_phase57_inventory;

delete from public.listing_amenities
where listing_id in (
  select id from staywise_phase57_inventory
);

insert into public.listing_amenities (listing_id, amenity)
select id, unnest(amenities)
from staywise_phase57_inventory;

commit;
