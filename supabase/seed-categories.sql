-- Shadollar Cakes & Treats: complete starter category list
-- Run this in Supabase Dashboard > SQL Editor.
-- Safe to run more than once; existing categories are updated, not duplicated.

insert into public.categories (name, slug, description, sort_order, is_active)
values
  ('Birthday Cakes', 'birthday-cakes', 'Custom cakes for birthdays and special celebrations.', 1, true),
  ('Wedding Cakes', 'wedding-cakes', 'Elegant wedding cakes made for your special day.', 2, true),
  ('Cupcakes', 'cupcakes', 'Freshly baked cupcakes for parties, gifts and everyday treats.', 3, true),
  ('Small Chops', 'small-chops', 'Delicious finger foods and party snack selections.', 4, true),
  ('Chin Chin', 'chin-chin', 'Crunchy, freshly prepared chin chin in different pack sizes.', 5, true),
  ('Doughnuts', 'doughnuts', 'Soft and tasty doughnuts for every occasion.', 6, true),
  ('Pastries', 'pastries', 'A selection of freshly baked sweet and savoury pastries.', 7, true),
  ('Catering Services', 'catering-services', 'Food preparation and catering for events and gatherings.', 8, true),
  ('Event Packages', 'event-packages', 'Curated cake, treat and catering packages for celebrations.', 9, true),
  ('Drinks & Refreshments', 'drinks-refreshments', 'Drinks and refreshments to complement your orders.', 10, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();
