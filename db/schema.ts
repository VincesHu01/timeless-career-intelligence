import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  username: text("username").notNull(),
  stage: text("stage").notNull().default("在校生"),
  target: text("target").notNull().default("产品"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const reviewStates = sqliteTable("review_states", {
  userId: text("user_id").notNull(),
  cardId: text("card_id").notNull(),
  quality: integer("quality").notNull().default(0),
  intervalIndex: integer("interval_index").notNull().default(0),
  dueAt: text("due_at").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.userId, table.cardId] })]);

export const refreshRequests = sqliteTable("refresh_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  company: text("company").notNull(),
  status: text("status").notNull().default("queued"),
  requestedAt: text("requested_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_push_subscriptions_endpoint").on(table.endpoint)]);

export const crawlRuns = sqliteTable("crawl_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  company: text("company").notNull(),
  status: text("status").notNull(),
  discovered: integer("discovered").notNull().default(0),
  errorMessage: text("error_message"),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  finishedAt: text("finished_at"),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  company: text("company").notNull(),
  title: text("title").notNull(),
  roleFamily: text("role_family").notNull(),
  roleType: text("role_type").notNull(),
  recruitmentTrack: text("recruitment_track").notNull(),
  location: text("location").notNull().default("以官方详情为准"),
  experienceLevel: text("experience_level").notNull().default("未明示"),
  summary: text("summary").notNull(),
  skillsJson: text("skills_json").notNull().default("[]"),
  aiSkillsJson: text("ai_skills_json").notNull().default("[]"),
  bonusSignalsJson: text("bonus_signals_json").notNull().default("[]"),
  evidenceJson: text("evidence_json").notNull().default("[]"),
  technicalRequirements: text("technical_requirements").notNull().default(""),
  experienceRequirements: text("experience_requirements").notNull().default(""),
  softRequirements: text("soft_requirements").notNull().default(""),
  sourceTier: text("source_tier").notNull().default("S｜官方招聘"),
  sourceUrl: text("source_url").notNull(),
  sourceJobId: text("source_job_id"),
  sourcePublishedAt: text("source_published_at"),
  contentHash: text("content_hash").notNull(),
  clusterKey: text("cluster_key").notNull(),
  status: text("status").notNull().default("在招"),
  firstSeenAt: text("first_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  offlineAt: text("offline_at"),
}, (table) => [
  index("idx_jobs_company_status").on(table.company, table.status),
  index("idx_jobs_cluster_track").on(table.clusterKey, table.recruitmentTrack),
  index("idx_jobs_last_seen").on(table.lastSeenAt),
]);

export const jobSnapshots = sqliteTable("job_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: text("job_id").notNull(),
  runId: integer("run_id").notNull(),
  contentHash: text("content_hash").notNull(),
  evidenceJson: text("evidence_json").notNull(),
  capturedAt: text("captured_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("idx_job_snapshots_job_hash").on(table.jobId, table.contentHash),
  index("idx_job_snapshots_run").on(table.runId),
]);

export const weeklyReports = sqliteTable("weekly_reports", {
  id: text("id").primaryKey(),
  weekStart: text("week_start").notNull(),
  weekEnd: text("week_end").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  metricsJson: text("metrics_json").notNull(),
  clustersJson: text("clusters_json").notNull(),
  sourceLinksJson: text("source_links_json").notNull(),
  generatedAt: text("generated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_weekly_reports_week").on(table.weekStart)]);

export const modelHealthChecks = sqliteTable("model_health_checks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  model: text("model").notNull(),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  checkedAt: text("checked_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
