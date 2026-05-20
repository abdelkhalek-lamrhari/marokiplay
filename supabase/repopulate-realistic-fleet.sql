-- CloudRig — repopulate machines with realistic GTX 10/9-series fleet
-- All rigs have 16GB DDR4 RAM. Names preserved; specs/prices/tiers updated.

update public.machines set
  cpu = 'Intel Core i7-8700K',
  gpu = 'NVIDIA GTX 1080 Ti 11GB',
  ram = '16GB DDR4 3000MHz',
  storage = '512GB SSD + 2TB HDD',
  tier = 'Pro',
  price_per_hour = 3.00,
  description = 'Flagship GTX 10-series rig. Great for 1440p gaming and VR titles.',
  features = array['1440p Gaming','VR Ready','High Settings','Hairworks Support'],
  latency = '<15ms'
where id = 'titan-x';

update public.machines set
  cpu = 'Intel Core i7-7700K',
  gpu = 'NVIDIA GTX 1080 8GB',
  ram = '16GB DDR4 2666MHz',
  storage = '512GB SSD + 1TB HDD',
  tier = 'Pro',
  price_per_hour = 2.50,
  description = 'Solid GTX 1080 build for 1440p/60fps gaming and esports titles.',
  features = array['1440p Gaming','144Hz at 1080p','VR Compatible','G-Sync'],
  latency = '<15ms'
where id = 'phantom-pro';

update public.machines set
  cpu = 'Intel Core i5-8600K',
  gpu = 'NVIDIA GTX 1070 8GB',
  ram = '16GB DDR4 2666MHz',
  storage = '512GB SSD',
  tier = 'Standard',
  price_per_hour = 2.00,
  description = 'GTX 1070 rig — reliable performer for 1080p high and 1440p medium.',
  features = array['1080p Ultra','1440p High','VR Compatible','Quiet Cooling'],
  latency = '<18ms'
where id = 'nova-elite';

update public.machines set
  cpu = 'AMD Ryzen 7 1800X',
  gpu = 'NVIDIA GTX 1080 Ti 11GB',
  ram = '16GB DDR4 3000MHz',
  storage = '1TB SSD',
  tier = 'Pro',
  price_per_hour = 3.00,
  description = 'AMD-powered GTX 1080 Ti build. Excellent for streaming + gaming.',
  features = array['1440p Gaming','Stream Ready','Multi-threaded Workloads','VR Ready'],
  latency = '<15ms'
where id = 'apex-ultra';

update public.machines set
  cpu = 'AMD Ryzen 5 1600',
  gpu = 'NVIDIA GTX 1060 6GB',
  ram = '16GB DDR4 2400MHz',
  storage = '256GB SSD + 1TB HDD',
  tier = 'Standard',
  price_per_hour = 1.50,
  description = 'Compact GTX 1060 rig — ideal for 1080p/60fps and most modern titles.',
  features = array['1080p High','60fps Stable','Compact Build','Low Power Draw'],
  latency = '<20ms'
where id = 'eclipse-mini';

update public.machines set
  cpu = 'Intel Core i5-6600K',
  gpu = 'NVIDIA GTX 980 Ti 6GB',
  ram = '16GB DDR4 2400MHz',
  storage = '512GB SSD',
  tier = 'Standard',
  price_per_hour = 1.50,
  description = 'GTX 9-series flagship rig. Capable of 1080p high settings in most games.',
  features = array['1080p High','Maxwell Architecture','Retro Titles','SLI Optional'],
  latency = '<20ms'
where id = 'storm-4k';

update public.machines set
  cpu = 'Intel Core i3-7100',
  gpu = 'NVIDIA GTX 1050 Ti 4GB',
  ram = '16GB DDR4 2133MHz',
  storage = '256GB SSD',
  tier = 'Standard',
  price_per_hour = 1.00,
  description = 'Entry-level cloud gaming rig optimized for mobile streaming. PPSSPP, retro, esports.',
  features = array['Mobile Optimized','1080p/60fps','Esports Ready','PPSSPP Compatible'],
  latency = '<15ms'
where id = 'lite-mobile';
