CREATE TABLE "boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"theme" varchar(50) DEFAULT 'default' NOT NULL,
	"tag" varchar(100),
	"color" varchar(50),
	"illustration" varchar(255),
	"progression_method" varchar DEFAULT 'sinceCreation' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_id" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"data" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metric_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar NOT NULL,
	"schema" jsonb NOT NULL,
	"target" integer,
	"progress_direction" varchar NOT NULL,
	"progression_method" varchar DEFAULT 'sinceCreation' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_metric_id_metric_definitions_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."metric_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metric_definitions" ADD CONSTRAINT "metric_definitions_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE no action ON UPDATE no action;