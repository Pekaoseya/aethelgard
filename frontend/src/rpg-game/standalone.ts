import { mergeConfig } from "@signe/di";
import { provideRpg, startGame } from "@rpgjs/client";
import startServer from "./modules/main/server";
import configClient from "./config/client";

startGame(
  mergeConfig(configClient, {
    providers: [provideRpg(startServer)],
  })
);
