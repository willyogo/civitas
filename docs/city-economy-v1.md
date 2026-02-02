City Economy V1 Implementation Walkthrough
I have successfully implemented the "City Economy v1" feature set, enabling cities to produce resources, process building upgrades, and manage development focus.

1. Database Schema
Created new tables and columns in 
supabase/add_to_cities_schema.sql
 (applied manually):

city_buildings: Tracks building type, level, and upgrade status.
city_resource_balances: Tracks Materials, Energy, Knowledge, Influence.
cities extensions: Added focus and focus_set_at.
2. Core Service Logic
Implemented the game rules in lib/services:

building.service.ts: Handles upgrade validation, resource deduction (optimistic locking), and knowledge-based time reduction.
cities.ts: Added getCityEconomy for client data and setCityFocus for policy changes (with Influence cost and cooldown).
jobs.ts: Enhanced runWorldCycle to process hourly production:
Calculates output based on building levels (FOUNDRY, GRID, etc.).
Applies Energy Throttling (scaling down output if energy is insufficient).
Applies Development Focus bonuses (e.g., +50% Materials for 'INFRASTRUCTURE').
Handles storage caps.
3. API Endpoints
Exposed functionality via Next.js Route Handlers:

GET /api/cities/[id]/economy: Returns balances, buildings, and active focus.
GET /api/cities/[id]/buildings: Returns building list.
POST /api/cities/[id]/focus: Changes city focus (Auth protected*).
POST /api/cities/[id]/buildings/[type]/upgrade: Initiates building upgrades (Auth protected*).
*Auth uses a simplified checks or relies on Admin Context for MVP writes.

4. Verification
Verified the system using scripts/verify-economy.ts:

Seeding: Confirmed buildings are created for cities.
Resource Logic: Confirmed upgrade costs are deducted correctly (observed drop from 500->400 Materials).
Concurrency: Confirmed "Building is already upgrading" error on duplicate requests, ensuring locking works.
State Persistence: Database correctly stores the upgrading flag and timestamps.
5. Next Steps
Frontend integration: Connect the UI to these new endpoints.
Chronicle Events: Ensure the frontend displays the new event types in the feed.