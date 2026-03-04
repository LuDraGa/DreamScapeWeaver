# StoryWeaver Roadmap

## ✅ Done: Phase 2a — Auth
- Supabase auth: Google OAuth + email/password
- User roles: `normal`, `admin`, `dev` (stored in `storyweaver.profiles`)
- Route protection via middleware (`ENABLE_AUTH` runtime env var)
- Mock login locally, real auth on Vercel

## Next: Phase 2b — Persistence (Now that auth is operational)

**Approach:**
1. Design the full RDBMS schema first — use Figma MCP to create an ERD
2. Understand all data requirements before touching Supabase tables
3. Then implement `src/lib/persistence/supabase.ts` (currently all stubs)

**Tables to design (preliminary, not final):**
- `profiles` (users + roles) — created as part of auth
- `dreamscapes` + `dreamscape_chunks`
- `output_variants` + `performance_snapshots`
- `projects` + `parts` (Studio model)
- `settings` (per-user)

**Design doc:** Create RDBMS design in Figma using MCP before implementation begins.

---

## Phase 3 — Billing
- Stripe integration
- Usage metering (track OpenAI calls per user)
- Free tier (10 generations/month), Pro tier ($15-20/mo)

## Phase 4 — Studio Persistence
- Move Studio projects/parts to Supabase after persistence layer is solid
- Reference: `execution_docs/_active/planning.md` has full Studio task breakdown

## Phase 5 — Analytics & Performance Loop
- Auto-connect social accounts for performance pull
- "Your best stories used these dial settings" insight surface
