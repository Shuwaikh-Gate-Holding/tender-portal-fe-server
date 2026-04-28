### Supabase DB Clone

<!-- Login -->

supabase login

<!-- Link with remote project -->

supabase link --project-ref mxvcpmvmyybfrbcxweja

<!-- Start supabase -->

supabase start

<!-- Dump the data -->

supabase db dump --data-only -f supabase/seed.sql

<!-- Restor the data -->

supabase db reset
