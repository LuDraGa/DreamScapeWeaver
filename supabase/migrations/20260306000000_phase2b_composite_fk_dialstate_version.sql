-- =============================================================================
-- Phase 2b patch: composite FK enforcement + dial_state versioning
--
-- 1. Composite FKs on dreamscape_chunks and performance_snapshots.
--    Both tables duplicate user_id from their parent as an RLS shortcut.
--    Without a composite FK, a bad insert (wrong user_id) silently bypasses
--    RLS — the row is owned by a different user than the parent record.
--    Fix: add UNIQUE(id, user_id) on parent tables, then composite FK on children.
--
-- 2. dial_state_version on output_variants.
--    dial_state JSONB is a snapshot of the DialState config at generation time.
--    As dial fields are added/removed, old rows become silently incompatible.
--    A version column enables safe future migrations of stored dial_state blobs.
-- =============================================================================

SET search_path TO storyweaver;

-- ---------------------------------------------------------------------------
-- 1a. UNIQUE(id, user_id) on dreamscapes — required for composite FK target
-- ---------------------------------------------------------------------------
ALTER TABLE storyweaver.dreamscapes
  ADD CONSTRAINT dreamscapes_id_user_id_unique UNIQUE (id, user_id);

-- ---------------------------------------------------------------------------
-- 1b. Composite FK on dreamscape_chunks(dreamscape_id, user_id)
--     Guarantees chunk.user_id always matches its parent dreamscape.user_id.
--     ON DELETE CASCADE mirrors the existing single-column FK behaviour.
-- ---------------------------------------------------------------------------
ALTER TABLE storyweaver.dreamscape_chunks
  ADD CONSTRAINT fk_chunks_parent_user
    FOREIGN KEY (dreamscape_id, user_id)
    REFERENCES storyweaver.dreamscapes (id, user_id)
    ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 2a. UNIQUE(id, user_id) on output_variants — required for composite FK target
-- ---------------------------------------------------------------------------
ALTER TABLE storyweaver.output_variants
  ADD CONSTRAINT output_variants_id_user_id_unique UNIQUE (id, user_id);

-- ---------------------------------------------------------------------------
-- 2b. Composite FK on performance_snapshots(output_variant_id, user_id)
--     ON DELETE CASCADE mirrors the existing single-column FK behaviour.
-- ---------------------------------------------------------------------------
ALTER TABLE storyweaver.performance_snapshots
  ADD CONSTRAINT fk_snapshots_parent_user
    FOREIGN KEY (output_variant_id, user_id)
    REFERENCES storyweaver.output_variants (id, user_id)
    ON DELETE CASCADE;

-- ---------------------------------------------------------------------------
-- 3. dial_state_version on output_variants
--    Starts at 1 for all existing and new rows.
--    Increment this value in application code whenever the DialState shape
--    changes in a breaking way so old rows can be detected and migrated.
-- ---------------------------------------------------------------------------
ALTER TABLE storyweaver.output_variants
  ADD COLUMN dial_state_version SMALLINT NOT NULL DEFAULT 1;
