-- Existing Sites databases already received these columns during the live data
-- rollout. Fresh databases create them in 0002, so this migration is a safe
-- checkpoint for both histories.
SELECT 1;
