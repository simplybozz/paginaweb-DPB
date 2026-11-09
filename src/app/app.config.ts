import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';

import { routes } from './app.routes';
import { DbService } from './core/db.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(DbService).init()),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      // Fundido suave al cambiar de página (solo cuando cambia la ruta, no los filtros).
      withViewTransitions({
        onViewTransitionCreated: ({ transition, from, to }) => {
          // Si se salta o el navegador la cancela (pestaña oculta), no es un error.
          transition.ready.catch(() => {});
          transition.finished.catch(() => {});
          transition.updateCallbackDone.catch(() => {});
          const path = (s: typeof from) => s.root.firstChild?.routeConfig?.path + '/' + (s.root.firstChild?.firstChild?.routeConfig?.path ?? '');
          if (!from.root.firstChild || path(from) === path(to)) transition.skipTransition();
        },
      }),
    ),
  ],
};
