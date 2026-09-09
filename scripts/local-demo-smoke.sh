#!/usr/bin/env bash
set -euo pipefail

api_url="http://127.0.0.1:54321"
status="$(SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN=local-test-token npx supabase status -o json)"
anon_key="$(jq -r '.PUBLISHABLE_KEY // .ANON_KEY' <<<"$status")"
db_url="$(jq -r .DB_URL <<<"$status")"

curl -fsS "$api_url/auth/v1/otp" \
  -H "apikey: $anon_key" \
  -H "Content-Type: application/json" \
  --data '{"phone":"+2348012345678"}' >/dev/null
auth="$(curl -fsS "$api_url/auth/v1/verify" \
  -H "apikey: $anon_key" \
  -H "Content-Type: application/json" \
  --data '{"type":"sms","phone":"+2348012345678","token":"123456"}')"
jwt="$(jq -r .access_token <<<"$auth")"
customer_id="$(jq -r .user.id <<<"$auth")"

vendor_id="$(psql "$db_url" -Atc \
  "select id from public.vendors where published order by created_at limit 1")"
package_id="$(psql "$db_url" -Atc \
  "select id from public.service_packages where vendor_id='$vendor_id' limit 1")"
brief_id="$(curl -fsS "$api_url/rest/v1/wedding_briefs?select=id" \
  -X POST \
  -H "apikey: $anon_key" \
  -H "Authorization: Bearer $jwt" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  --data "{\"customer_id\":\"$customer_id\",\"wedding_date\":\"2026-12-20\",\"area\":\"Lekki\",\"guest_count\":150,\"budget_min_kobo\":100000000,\"budget_max_kobo\":300000000,\"priorities\":[\"venue\"]}" |
  jq -r '.[0].id')"

request_id="$(cat /proc/sys/kernel/random/uuid)"
booking_id="$(curl -fsS "$api_url/rest/v1/rpc/submit_booking_request" \
  -X POST \
  -H "apikey: $anon_key" \
  -H "Authorization: Bearer $jwt" \
  -H "Content-Type: application/json" \
  --data "{\"p_vendor_id\":\"$vendor_id\",\"p_package_id\":\"$package_id\",\"p_wedding_brief_id\":\"$brief_id\",\"p_requirements\":\"Wedding venue booking for 150 guests with parking.\",\"p_guest_count\":150,\"p_client_request_id\":\"$request_id\"}" |
  jq -r .id)"
admin_id="$(psql "$db_url" -Atc \
  "select id from public.profiles where email='ops@mmemme.local'")"

psql "$db_url" -v ON_ERROR_STOP=1 >/dev/null <<SQL
update public.bookings
set claimed_by='$admin_id', status='operations_review'
where id='$booking_id';
insert into public.quotes(
  booking_id, total_amount_kobo, deposit_amount_kobo,
  cancellation_template_version, cancellation_summary, terms_version,
  expires_at, created_by, package_name_snapshot, inclusions, exclusions,
  payment_schedule, availability_confirmed_at
) values (
  '$booking_id', 250000000, 75000000,
  'beta-v1', 'Demo cancellation schedule', 'beta-v1',
  now() + interval '2 days', '$admin_id', 'Signature Wedding Venue',
  array['Venue','Parking'], array['Catering'], '30% deposit', now()
);
update public.bookings set status='quote_ready' where id='$booking_id';
SQL

quote_id="$(psql "$db_url" -Atc \
  "select id from public.quotes where booking_id='$booking_id'")"
curl -fsS "$api_url/rest/v1/rpc/accept_quote" \
  -X POST \
  -H "apikey: $anon_key" \
  -H "Authorization: Bearer $jwt" \
  -H "Content-Type: application/json" \
  --data "{\"p_booking_id\":\"$booking_id\",\"p_quote_id\":\"$quote_id\"}" >/dev/null
payment="$(curl -fsS "$api_url/functions/v1/demo-confirm-payment" \
  -X POST \
  -H "apikey: $anon_key" \
  -H "Authorization: Bearer $jwt" \
  -H "Content-Type: application/json" \
  --data "{\"bookingId\":\"$booking_id\",\"quoteId\":\"$quote_id\"}")"

result="$(psql "$db_url" -Atc "
  select json_build_object(
    'booking_id', b.id,
    'booking_status', b.status,
    'payment_status', p.status,
    'ledger_entries', (
      select count(*) from public.ledger_entries l where l.payment_id=p.id
    ),
    'payout_status', po.status
  )
  from public.bookings b
  join public.payments p on p.booking_id=b.id
  join public.payouts po on po.payment_id=p.id
  where b.id='$booking_id'
")"

jq -n \
  --argjson payment "$payment" \
  --argjson result "$result" \
  '{payment: $payment, result: $result}'
