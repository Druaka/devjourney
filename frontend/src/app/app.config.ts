import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {providePrimeNG} from 'primeng/config';
import {provideRouter} from "@angular/router";
import {provideHttpClient, withInterceptorsFromDi} from "@angular/common/http";
import {routes} from "./app.routes";
import {Noir} from './app.theme';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        // PrimeNG + Animations
        provideAnimationsAsync(),
        providePrimeNG({
            ripple: true,
            theme: {
                preset: Noir,
                options: {darkModeSelector: '.p-dark'}
            }
        })
    ]
};
