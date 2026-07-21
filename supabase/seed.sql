insert into public.vendors(id,name,category,area,description,capacity_min,capacity_max,price_from_kobo,verification_status,verification_expires_at,published)
values
  ('10000000-0000-4000-8000-000000000001','Lagoon House','venue','Victoria Island','A waterfront celebration venue with indoor and outdoor ceremony options.',100,350,280000000,'approved','2027-07-12T00:00:00Z',false),
  ('10000000-0000-4000-8000-000000000002','The Assembly','venue','Ikeja GRA','A calm garden and hall setting for intimate and mid-size Lagos weddings.',80,280,190000000,'approved','2027-06-30T00:00:00Z',false),
  ('10000000-0000-4000-8000-000000000003','Adùnní Table','caterer','Lekki','Nigerian celebration menus presented with modern service and generous portions.',100,500,950000,'approved','2027-07-08T00:00:00Z',false),
  ('10000000-0000-4000-8000-000000000004','Ìfẹ́ Kitchen','caterer','Surulere','Classic Lagos party food with structured guest-count packages.',80,400,780000,'approved','2027-07-10T00:00:00Z',false)
on conflict (id) do update set name=excluded.name, description=excluded.description;

insert into public.service_packages(id,vendor_id,name,description,price_from_kobo,inclusions)
values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Full-day wedding hire','Twelve-hour access for ceremony and reception.',280000000,array['Main hall','Waterfront terrace','Bridal suite','Security']),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Hall and garden','Indoor reception plus garden ceremony.',190000000,array['Reception hall','Garden','Parking','Backup power']),
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','Classic celebration menu','Per-guest Nigerian menu with service staff.',950000,array['Two mains','Two sides','Small chops','Service staff']),
  ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','Lagos favourites','Flexible buffet package for 80 to 400 guests.',780000,array['Two mains','Rice selection','Swallow and soup','Buffet service'])
on conflict (id) do update set name=excluded.name, description=excluded.description;

insert into public.verification_records(vendor_id,status,identity_checked,contact_checked,bank_name_checked,authority_checked,portfolio_checked,references_checked,physical_site_checked,checked_at,expires_at,public_note)
select id,'approved',true,true,true,true,true,true,true,now(),verification_expires_at,'MMEMME checked identity, operating authority, references, portfolio and the physical operating site.'
from public.vendors where id::text like '10000000-%'
and not exists (select 1 from public.verification_records vr where vr.vendor_id=vendors.id and vr.status='approved');

update public.vendors set published=true where id::text like '10000000-%';
