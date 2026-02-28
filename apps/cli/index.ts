#!/usr/bin/env node
import { Command } from "commander";
import { MetricService } from "@peak/core";
import { DrizzleMetricRepository, DrizzleEntryRepository } from "@peak/db";
import { CLIController } from "./src/controllers/CLIController";
import { CLIView } from "./src/views/CLIView";

const program = new Command();
program
    .name("peak")
    .description("Universal Progress Tracking Engine CLI")
    .version("1.0.0");

const metricRepo = new DrizzleMetricRepository();
const entryRepo = new DrizzleEntryRepository();
const metricSvc = new MetricService(metricRepo, entryRepo);
const controller = new CLIController(metricSvc);

// --- DIRECT COMMANDS ---

const boardCmd = program.command("board");

boardCmd
    .command("create [name]")
    .description("Create a new board")
    .action(async (name) => {
        await controller.createBoard(name);
        process.exit(0);
    });

boardCmd
    .command("delete [name]")
    .description("Delete a board")
    .action(async (name) => {
        await controller.deleteBoard(name);
        process.exit(0);
    });

boardCmd
    .command("report <bname>")
    .description("Show transformation report for a board")
    .action(async (bname) => {
        const { db, boards } = await import("@peak/db");
        const { eq } = await import("drizzle-orm");
        const b = await db.select().from(boards).where(eq(boards.name, bname.toUpperCase())).limit(1);
        if (b.length > 0) {
            await controller.showReport(b[0].id);
        } else {
            CLIView.showError(`Board '${bname}' not found.`);
        }
        process.exit(0);
    });

boardCmd
    .command("add-metric <bname> <mname>")
    .description("Add a metric to a board")
    .action(async (bname, mname) => {
        const { db, boards } = await import("@peak/db");
        const { eq } = await import("drizzle-orm");
        const b = await db.select().from(boards).where(eq(boards.name, bname.toUpperCase())).limit(1);
        if (b.length > 0) {
            await controller.addMetric(b[0].id, mname);
        } else {
            CLIView.showError(`Board '${bname}' not found.`);
        }
        process.exit(0);
    });

boardCmd
    .command("delete-metric <bname> <mname>")
    .description("Delete a metric from a board")
    .action(async (bname, mname) => {
        const { db, boards } = await import("@peak/db");
        const { eq } = await import("drizzle-orm");
        const b = await db.select().from(boards).where(eq(boards.name, bname.toUpperCase())).limit(1);
        if (b.length > 0) {
            await controller.deleteMetric(b[0].id, mname);
        } else {
            CLIView.showError(`Board '${bname}' not found.`);
        }
        process.exit(0);
    });

boardCmd
    .command("set-value <bname> <mname>")
    .description("Log a value for a metric")
    .action(async (bname, mname) => {
        const { db, boards } = await import("@peak/db");
        const { eq } = await import("drizzle-orm");
        const b = await db.select().from(boards).where(eq(boards.name, bname.toUpperCase())).limit(1);
        if (b.length > 0) {
            await controller.addValue(b[0].id, mname);
        } else {
            CLIView.showError(`Board '${bname}' not found.`);
        }
        process.exit(0);
    });

program
    .command("dashboard")
    .description("Open the web dashboard in your browser")
    .action(async () => {
        await controller.openDashboard();
        process.exit(0);
    });

program.action(async () => {
    // If no command, run interactive mode
    await controller.runMainMenu();
});

program.parse();
