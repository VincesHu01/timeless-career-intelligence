CREATE TABLE `job_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` text NOT NULL,
	`run_id` integer NOT NULL,
	`content_hash` text NOT NULL,
	`evidence_json` text NOT NULL,
	`captured_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_job_snapshots_job_hash` ON `job_snapshots` (`job_id`,`content_hash`);--> statement-breakpoint
CREATE INDEX `idx_job_snapshots_run` ON `job_snapshots` (`run_id`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`title` text NOT NULL,
	`role_family` text NOT NULL,
	`role_type` text NOT NULL,
	`recruitment_track` text NOT NULL,
	`location` text DEFAULT '以官方详情为准' NOT NULL,
	`experience_level` text DEFAULT '未明示' NOT NULL,
	`summary` text NOT NULL,
	`skills_json` text DEFAULT '[]' NOT NULL,
	`ai_skills_json` text DEFAULT '[]' NOT NULL,
	`bonus_signals_json` text DEFAULT '[]' NOT NULL,
	`evidence_json` text DEFAULT '[]' NOT NULL,
	`technical_requirements` text DEFAULT '' NOT NULL,
	`experience_requirements` text DEFAULT '' NOT NULL,
	`soft_requirements` text DEFAULT '' NOT NULL,
	`source_tier` text DEFAULT 'S｜官方招聘' NOT NULL,
	`source_url` text NOT NULL,
	`source_job_id` text,
	`source_published_at` text,
	`content_hash` text NOT NULL,
	`cluster_key` text NOT NULL,
	`status` text DEFAULT '在招' NOT NULL,
	`first_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`offline_at` text
);
--> statement-breakpoint
CREATE INDEX `idx_jobs_company_status` ON `jobs` (`company`,`status`);--> statement-breakpoint
CREATE INDEX `idx_jobs_cluster_track` ON `jobs` (`cluster_key`,`recruitment_track`);--> statement-breakpoint
CREATE INDEX `idx_jobs_last_seen` ON `jobs` (`last_seen_at`);--> statement-breakpoint
CREATE TABLE `weekly_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`week_start` text NOT NULL,
	`week_end` text NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`metrics_json` text NOT NULL,
	`clusters_json` text NOT NULL,
	`source_links_json` text NOT NULL,
	`generated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_weekly_reports_week` ON `weekly_reports` (`week_start`);
--> statement-breakpoint
INSERT OR IGNORE INTO `jobs` (`id`,`company`,`title`,`role_family`,`role_type`,`recruitment_track`,`location`,`experience_level`,`summary`,`skills_json`,`ai_skills_json`,`bonus_signals_json`,`evidence_json`,`source_tier`,`source_url`,`source_job_id`,`source_published_at`,`content_hash`,`cluster_key`,`status`) VALUES
('百度-J100665','百度','AI产品经理','AI产品/运营','产品岗','2027校招','北京','应届生','负责 AI/大模型产品规划、设计与迭代，推动 AI 能力在真实产品场景落地，并用用户与市场数据驱动增长。','["用户需求","产品规划","跨团队协作","数据分析","指标增长"]','["大模型应用","AI产品思维","人机协作","AI工具"]','[]','["负责AI/大模型方向产品的规划、设计与迭代","探索人机协作的最优交互模式","善用AI工具提升工作效率与产品创新能力"]','S｜官方职位','https://talent.baidu.com/jobs/list?projectType=1','J100665','2026-07-21','seed-j100665','AI产品/运营','在招'),
('百度-J98958','百度','AI 产品经理实习生','AI产品/运营','产品岗','日常实习','北京','在校生，至少实习三个月','研究 Coding Agent 等 AI Agent 前沿方向，参与行业研究、需求洞察、实验验证和 Agent 产品全流程。','["行业研究","竞品分析","用户调研","实验验证","商业化分析"]','["Coding Agent","AI Agent"]','["AI产品相关经验"]','["研究 Coding Agent 等 AI Agent 前沿方向，开展行业研究、竞品分析、需求洞察","持续洞察用户行为，通过用户调研、实验验证与数据分析支持产品定位与创新路径决策","参与 Agent 产品从机会识别、需求分析、方案设计到上线复盘的全流程"]','S｜官方职位','https://talent.baidu.com/jobs/list?recommendCode=ISV328&recruitType=INTERN','J98958','2026-04-09','seed-j98958','AI产品/运营','在招'),
('百度-J101407','百度','AI产品经理（企业效能方向）','AI产品/运营','产品岗','社会招聘','北京','原文未明示具体年限','负责企业工作流洞察、Agent 方案落地、效果指标建设与跨团队全流程管理。','["工作流分析","效果指标","跨部门协作","产品Demo"]','["AI Agent","Prompt","Agentic Workflow","大模型能力边界"]','["主导大型跨部门项目","独立完成产品Demo"]','["负责企业工作流的识别与分析","搭建效果指标看板，保障企业组织效率问题可观测、可量化","具备大语言模型的应用经验，对大模型能力边界、如何编写高质量Prompt等有较清晰的认知"]','S｜官方职位','https://talent.baidu.com/jobs/detail/SOCIAL/645aeeb5-f2a7-4df3-b13c-d90a6006aac3','J101407','2026-07-21','seed-j101407','AI产品/运营','在招'),
('百度-J95427','百度','AI高级产品经理','AI产品/运营','产品岗','社会招聘','北京','8年以上AI产品经验，5年以上AI ToB商业化管理经验','统筹 AI 产品与业务规划，建设智能体平台工具生态并推动规模化商业化。','["业务规划","商业化","产品规划","用户调研","组织协调"]','["智能体平台","主流大模型","AI工具"]','["AI ToB商业化管理经验"]','["制定AI产品的产品建设规划及业务发展规划","负责智能体搭建平台的产品规划，运营构建丰富的工具生态","8年以上AI产品经验，5年以上AI to B商业化管理经验"]','S｜官方职位','https://talent.baidu.com/jobs/detail/SOCIAL/97d97b07-cb36-4c58-b833-afc317eb7431','J95427','2026-07-21','seed-j95427','AI产品/运营','在招'),
('阿里巴巴-199903220012','阿里巴巴','产品经理','通用产品','产品岗','2027实习生','北京 / 杭州 / 上海','2027届实习生','从用户研究和行为分析出发定义产品价值，完成原型与 PRD，协同研发、设计、运营交付，并建立指标体系持续优化。','["用户研究","需求分析","原型设计","PRD","数据分析","跨团队推动"]','[]','[]','["挖掘用户真实痛点及需求，定义出核心产品价值","产出高质量需求文档（PRD）","建立数据指标体系，监控产品表现"]','S｜官方职位','https://campus-talent.alibaba.com/campus/position/199903220012?deptCodes=GR41YI','199903220012','2026-03-11','seed-199903220012','通用产品','在招');
