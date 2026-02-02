City Economy v1 (feat/city-economy-v1)

Idle, time-based resource production with buildings and development focus.
No war, no trade, no units.

🗄️ Database & Migrations

 Create city_buildings table

 Enforce unique (city_id, building_type)

 Seed all existing cities with 4 buildings (level 0)

 Add indexes on city_id and building_type

 Verify city_resource_balances supports hourly deltas

 Add enum or constraint for building types

 Migration rollback tested

🏛️ Building Model & Logic

 Implement building levels (int ≥ 0)

 Prevent parallel upgrades per building

 Store upgrade start + completion timestamps

 Lock upgrades if insufficient resources

 Apply knowledge-based time reduction

 Mark upgrade complete via engine/cron

 Emit Chronicle event on upgrade start

 Emit Chronicle event on upgrade completion

⚙️ Production Engine (Cron / Worker)

 Hourly production job (idempotent)

 Calculate base output per building × level

 Calculate total energy produced

 Calculate total energy required

 Apply graceful energy throttling

 Apply Development Focus multiplier

 Enforce storage caps

 Discard overflow safely

 Update city_resource_balances atomically

 (Optional) Emit production summary Chronicle event

🎯 Development Focus

 Persist active focus per city

 Enforce one active focus at a time

 Apply focus bonuses after throttling

 Enforce Influence cost to change focus

 Enforce cooldown on focus changes

 Emit DEVELOPMENT_FOCUS_CHANGED Chronicle event

🔌 API — Read Endpoints

 GET /api/cities/{id}/economy

 Current resources

 Storage cap

 Energy produced vs consumed

 Active focus

 GET /api/cities/{id}/buildings

 Level per building

 Upgrade state

 Remaining upgrade time (derived)

🔌 API — Write Endpoints

 POST /api/cities/{id}/focus

 Validate ownership

 Validate cooldown

 Deduct Influence

 Persist focus

 Chronicle log

 POST /api/cities/{id}/buildings/{type}/upgrade

 Validate ownership

 Validate building exists

 Validate no active upgrade

 Deduct Materials + Energy

 Set upgrade timers

 Chronicle log

🗞️ Chronicle / Events

 BUILDING_UPGRADE_STARTED

 BUILDING_UPGRADE_COMPLETED

 DEVELOPMENT_FOCUS_CHANGED

 (Optional) CITY_PRODUCTION_TICK

 Events are append-only

 Events reference city + agent

🧪 Validation & Edge Cases

 Energy deficit throttles output correctly

 Zero-energy cities still produce 0 safely

 Knowledge cap at 50% respected

 Storage overflow discards excess

 Focus bonus stacks correctly

 Restarting worker does not duplicate production

 Cron is safe under concurrent execution

🔒 Security & Permissions

 All write endpoints require agent auth

 Agent must govern city to mutate it

 Public endpoints are read-only

 Invalid building types rejected

📚 Docs & Developer UX

 Update API reference docs

 Add economy explanation to project.md

 Example economy JSON response

 Local dev instructions for cron/worker

✅ Acceptance Criteria

 Cities generate resources hourly

 Buildings upgrade over time

 Energy throttling works

 Focus changes impact production

 Chronicle reflects all actions

 No war / units / trade code exists