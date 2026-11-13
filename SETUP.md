# Preview setup and review
Base: cinematic-city-explorer at 725d8d8e6c2e07357e968d19594bca3cd35a2260.

## Hosted sign-in and sync
Provider: Supabase Auth (email magic links) plus Supabase Postgres.
1. Create or select a Supabase project.
2. Run supabase/schema.sql in its SQL editor. The table has row-level security and authenticated users can only read/write their own user_id. Never use a service-role key in Vite.
3. Enable Email authentication. Configure email delivery/SMTP for production.
4. In Supabase Authentication URL configuration, add the exact Vercel preview origin and https://abroadaspirant.in to allowed redirect URLs (including /city/**). Set the site URL for the target environment.
5. In Vercel project abroadaspirants, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Preview. These are public project credentials, not service-role credentials.
6. Redeploy. Repeat the variables for Production only when the site is approved.
7. Verify a real email link, two devices, saved opportunities and stage/date changes, sign-out and isolation between two accounts.

Without both variables the site explicitly shows that sign-in is not connected. Guest browsing, local plans, FAQs and community links keep working. The client SDK loads only when configured.

## Application Desk
The existing AI SDK endpoint uses Vercel AI Gateway. Vercel deployments use the automatic VERCEL_OIDC_TOKEN. AI_MODEL can override the default openai/gpt-4.1-mini (confirmed in the live model catalog during implementation).
If the team cannot use Gateway, enable/verify its AI Gateway account and credits/payment method. Alternatively configure AI_GATEWAY_API_KEY in Vercel Preview. Never expose this key through a VITE_ variable.
The server validates messages, keeps the selected-city catalog in context, streams text, and returns a visible error state. Quick guide answers remain local and work without the model.
After deployment test POST /api/chat with a real question. A successful build or mocked streaming test does not prove model access.

## Design and media
UI/UX Pro Max loaded from https://github.com/nextlevelbuilder/ui-ux-pro-max-skill. Generated education/travel design direction, then applied the user palette and TEL founder typography. Reviewed dragging alternatives, focus visibility and reduced motion.
21st consulted: https://21st.dev/@dillionverma/components/globe. Adapted its lightweight canvas/pointer and capped-resolution approach to the repo's existing Three.js renderer rather than adding React and a second globe engine.
Hero: real Kanchenjunga photograph by Subash Rammohan, CC BY-SA 4.0. The photo is tinted/cropped in CSS. Complete visible credits are at /credits.html and beneath every gallery scene.
No provided Blue Hour reference was present in the branch. Generated approach videos are retained in source but not used as destination photography.

## Release
This work is for a preview only. Do not assign abroadaspirant.in, promote to production or merge into the production branch before review.

## Observed model blocker
A real request to the deployed Preview on 13 November 2026 reached AI Gateway and returned HTTP 403 in the billing category. Complete the Vercel team's AI Gateway billing/payment verification (or configure a funded AI_GATEWAY_API_KEY for Preview), redeploy, and repeat the request. This is separate from Supabase sign-in.
