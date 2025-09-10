#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { commandConfig as processCommand } from "./commands/process.js";
import { commandConfig as checkUpdateCommand } from "./commands/check-update.js";
import { commandConfig as syncHtmlCommand } from "./commands/sync-html.js";

// Setup yargs with command modules
const argv = yargs(hideBin(process.argv))
  .command(processCommand)
  .command(checkUpdateCommand)
  .command(syncHtmlCommand)
  .help()
  .demandCommand(1, "You need to specify a command")
  .argv;

// Commands are now handled by their respective modules
// The yargs configuration above automatically routes to the correct command handlers
