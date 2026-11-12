# Abroad Aspirants

A student-led study-abroad site with a scroll-driven aircraft-window opening, a WebGL flight globe, six city approaches, landmark photography, an opportunity board, a local application planner, an application template library and an AI advisor.

## Run locally

- Install with `npm ci`.
- Run `npm run dev` for the browser interface. Direct /city/ links are supported by Vite during development.
- Run `npm run build` to build the Vite site.
- Run `vercel dev` to exercise both the site and the Vercel chat function locally. Give the server a Vercel AI Gateway key through `AI_GATEWAY_API_KEY` or pull the project’s Vercel OIDC credentials into `.env.local`. Set `AI_MODEL` to override the default Gateway model.
- On Vercel, the frontend builds to `dist/` and the Node.js chat function lives at `/api/chat`. On an authenticated Vercel deployment, AI Gateway can use the runtime OIDC token. See [Vercel AI Gateway authentication](https://vercel.com/docs/ai-gateway/authentication-and-byok). The Quick guide remains usable without model access.

## Edit the experience

- City guides, opportunity URLs and photo credits are in `lib/destinations.js`. Treat the opportunities as research starting points and check the official sites for eligibility, dates and funding.
- `globe-3d.js` uses Three.js and a land mask derived from public-domain [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) geography via [world.geo.json](https://github.com/johan/world.geo.json).
- `flight.js` coordinates globe selection, city links, video scrubbing and the photo reveal.
- `content.js` contains the application resources and general opportunities.
- The application planner saves the shortlist, progress and manually confirmed dates in the current browser. It can export confirmed dates as an iCalendar file.
- `api/chat.js` streams real AI answers based on the site catalogue. It limits input length and requests per instance. The browser keeps its conversation in memory. AI mode sends messages to the model; Quick guide runs locally.
- The six 3D city sequences are stylised visualisations. Re-render with `python scripts/render-landings.py` using Pillow and FFmpeg.
- The site uses real [Unsplash photographs](https://unsplash.com/license). Credits are linked from the city guides and the opportunity categories. The flight photo is [from Unsplash](https://images.unsplash.com/photo-1436491865332-7a61a109cc05). The Abroad Aspirants logo was supplied by the project owner.

The intended production domain is `abroadaspirant.in`.
