import { bootstrapApplication } from "@angular/platform-browser";
import { applyDesignPayload, readInitialDesignFromQuery } from "./bridge";
import { App } from "./app/app";
import { appConfig } from "./app/app.config";

applyDesignPayload(readInitialDesignFromQuery());
bootstrapApplication(App, appConfig).catch((error) => console.error(error));
