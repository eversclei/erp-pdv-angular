import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { provideRouter, Routes } from '@angular/router';

registerLocaleData(localePt);

const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/caixa.page').then((m) => m.CaixaPage), title: 'Caixa' },
  { path: 'vendas', loadComponent: () => import('./pages/vendas.page').then((m) => m.VendasPage), title: 'Vendas do dia' },
  { path: '**', redirectTo: '' },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideAppInitializer(() => {
      inject(MatIconRegistry).setDefaultFontSetClass('material-symbols-outlined');
    }),
  ],
};
