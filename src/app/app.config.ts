import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { RECLAMOS_REPOSITORY } from './core/data/reclamos.repository';
import { ReclamosMockRepository } from './mocks/reclamos-mock.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    { provide: RECLAMOS_REPOSITORY, useExisting: ReclamosMockRepository }
  ]
};
