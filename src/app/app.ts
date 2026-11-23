import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatTabsModule, MatIconModule],
  template: `
    <mat-toolbar class="barra">
      <mat-icon>storefront</mat-icon>
      <span>PDV · Frente de Caixa</span>
    </mat-toolbar>
    <nav mat-tab-nav-bar [tabPanel]="painel" aria-label="Seções">
      <a mat-tab-link routerLink="/" routerLinkActive #caixa="routerLinkActive" [routerLinkActiveOptions]="{ exact: true }" [active]="caixa.isActive">
        <mat-icon>point_of_sale</mat-icon>&nbsp;Caixa
      </a>
      <a mat-tab-link routerLink="/vendas" routerLinkActive #vendas="routerLinkActive" [active]="vendas.isActive">
        <mat-icon>receipt_long</mat-icon>&nbsp;Vendas do dia
      </a>
    </nav>
    <mat-tab-nav-panel #painel>
      <main><router-outlet /></main>
    </mat-tab-nav-panel>
  `,
  styles: `
    .barra { gap: 12px; background: var(--mat-sys-primary); color: var(--mat-sys-on-primary); }
    main { padding: 16px; max-width: 1400px; margin: 0 auto; }
  `,
})
export class App {}
