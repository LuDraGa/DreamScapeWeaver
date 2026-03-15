-- Add 'review' to generation_action_type enum for AI review billing
ALTER TYPE storyweaver.generation_action_type ADD VALUE IF NOT EXISTS 'review';
