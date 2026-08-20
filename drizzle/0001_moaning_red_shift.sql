CREATE TABLE `model_health_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`model` text NOT NULL,
	`status` text NOT NULL,
	`error_message` text,
	`checked_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
