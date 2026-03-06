-- Fix rating constraint to support 10-star scale (was 1-5)
-- The app uses a 10-star rating system; the original schema assumed 1-5.

ALTER TABLE storyweaver.output_variants
  DROP CONSTRAINT output_variants_rating_check;

ALTER TABLE storyweaver.output_variants
  ADD CONSTRAINT output_variants_rating_check
    CHECK (rating BETWEEN 1 AND 10);
