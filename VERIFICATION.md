# Verification — Himalayan flight journey
Base branch: cinematic-city-explorer, 725d8d8.
Review branch: review/himalayan-flight-journey.

## Passed
- Vite production build locally in a Vercel Sandbox, then Vercel preview build.
- Eight Playwright tests: desktop 1440×1000 and mobile 390×844.
- Country search Germany -> Berlin landing and /city/berlin URL.
- Save a city opportunity, change stage to Preparing, reload and recover the saved item and stage.
- All three selected-city gallery images load.
- No horizontal overflow and no page JavaScript errors during the tested journeys.
- Offline model response visibly reports unavailability; local recommendation-letter answer works.
- Mocked text transport verifies selected city in the request and safe official-link rendering. This is a client transport check, not a real model success.
- WebGL disabled: 2D globe renders; keyboard search and next-city navigation work.
- WhatsApp invitation opens and Escape closes it.
- Additional live-browser checks: scroll changes automatic destination, selecting Paris preserves it on further scrolling, and the tour offers Resume.
- WhatsApp sits within its own persistent header strip.
- Actual Vercel preview: city search, landing and saving work without console errors.
- Actual model request from the deployed application desk reached /api/chat and AI Gateway. Runtime result: GatewayInternalServerError, HTTP 403, billing category. AI unavailable state displayed; Quick guide remains usable.

## Not live-verified
- Supabase email authentication and cross-device database sync. The Vercel project has no environment variables. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, run supabase/schema.sql, allow preview/production redirects, then verify two devices and two-account isolation. The interface clearly says sign-in is not connected.
- A successful live AI reply. Finish the team's AI Gateway billing/payment verification or add a funded AI_GATEWAY_API_KEY to Vercel Preview and redeploy. No credentials should be pasted into chat.
- Safari, Firefox, physical devices and screen-reader hardware were not tested. Chromium desktop/mobile viewports and a forced no-WebGL path were tested.

## Content and design
- UI/UX Pro Max design-system search and dragging/focus review completed; user palette and TEL founder direction override generic palette suggestions.
- 21st Globe component consulted; existing renderer retained and adapted.
- Real licensed photography is stored locally and credited, including campus and everyday scenes. Credits are visible per image and at /credits.html.
- Named Blue Hour/Himalayas reference was absent from the branch and searches of connected Drive images returned no results.
- Opportunity claims retain official organiser URLs. The site does not invent live deadlines or promise funding/eligibility; students are directed to the current official call.
- Generated approach videos are not displayed as destination photographs.
- Production domain was not assigned or promoted.
