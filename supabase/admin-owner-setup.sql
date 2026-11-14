-- Shadollar Cakes & Treats: owner admin access
-- Run this once in Supabase Dashboard > SQL Editor.
-- Create the Auth user(s) with these exact email addresses before running this script:
-- Nihmatallah22@Gmail.com
-- nihmatallah22@gmail.com
-- This does NOT create a password or bypass Supabase email verification.

-- Promote the account if it already exists.
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) in (lower('Nihmatallah22@Gmail.com'), lower('nihmatallah22@gmail.com'));

-- Ensure this exact owner email receives admin role automatically on future sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case
      when lower(coalesce(new.email, '')) in (lower('Nihmatallah22@Gmail.com'), lower('nihmatallah22@gmail.com'))
        then 'admin'::public.app_role
      else 'customer'::public.app_role
    end
  )
  on conflict (id) do update
    set role = excluded.role;
  return new;
end;
$$;

-- Also promote the account if it was created after the first update above.
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('Nihmatallah22@Gmail.com');
