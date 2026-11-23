import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CaixaService } from '../core/caixa.service';
import { FORMAS, FormaPagamento } from '../core/models';
import { MoedaPipe } from '../core/moeda.pipe';

@Component({
  selector: 'app-vendas',
  imports: [DatePipe, MoedaPipe, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <section class="kpis">
      <mat-card appearance="outlined"><mat-card-content>
        <span class="rotulo">Vendido hoje</span><span class="valor">{{ caixa.resumo().totalVendido | moeda }}</span>
      </mat-card-content></mat-card>
      <mat-card appearance="outlined"><mat-card-content>
        <span class="rotulo">Vendas</span><span class="valor">{{ caixa.resumo().quantidade }}</span>
      </mat-card-content></mat-card>
      <mat-card appearance="outlined"><mat-card-content>
        <span class="rotulo">Ticket médio</span><span class="valor">{{ caixa.resumo().ticketMedio | moeda }}</span>
      </mat-card-content></mat-card>
      @for (f of formas; track f) {
        <mat-card appearance="outlined"><mat-card-content>
          <span class="rotulo"><mat-icon>{{ rotulos[f].icone }}</mat-icon> {{ rotulos[f].rotulo }}</span>
          <span class="valor pequeno">{{ caixa.resumo().porForma[f] | moeda }}</span>
        </mat-card-content></mat-card>
      }
    </section>

    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>Vendas do dia</mat-card-title>
        <span class="espaco"></span>
        @if (confirmandoFechamento()) {
          <button mat-button (click)="confirmandoFechamento.set(false)">Voltar</button>
          <button mat-flat-button class="perigo" (click)="fechar()">
            <mat-icon>warning</mat-icon> Confirmar: apagar vendas do dia
          </button>
        } @else {
          <button mat-stroked-button (click)="confirmandoFechamento.set(true)" [disabled]="!caixa.vendas().length">
            <mat-icon>lock_clock</mat-icon> Fechar caixa
          </button>
        }
      </mat-card-header>
      <div class="tabela">
        <table mat-table [dataSource]="vendasRecentes()">
          <ng-container matColumnDef="numero">
            <th mat-header-cell *matHeaderCellDef>Nº</th>
            <td mat-cell *matCellDef="let v">{{ v.numero }}</td>
          </ng-container>
          <ng-container matColumnDef="hora">
            <th mat-header-cell *matHeaderCellDef>Hora</th>
            <td mat-cell *matCellDef="let v">{{ v.data | date: 'HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="itens">
            <th mat-header-cell *matHeaderCellDef>Itens</th>
            <td mat-cell *matCellDef="let v">{{ v.itens.length }}</td>
          </ng-container>
          <ng-container matColumnDef="forma">
            <th mat-header-cell *matHeaderCellDef>Pagamento</th>
            <td mat-cell *matCellDef="let v">{{ rotuloForma(v.forma) }}</td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let v" [class.cancelada]="v.cancelada">{{ v.total | moeda }}</td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let v">
              @if (v.cancelada) {
                <span class="tag">Cancelada</span>
              } @else {
                <button mat-icon-button (click)="caixa.cancelarVenda(v.numero)" matTooltip="Cancelar venda" aria-label="Cancelar venda">
                  <mat-icon>block</mat-icon>
                </button>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let v; columns: colunas"></tr>
          <tr class="mat-row" *matNoDataRow><td class="vazio" [attr.colspan]="colunas.length">Nenhuma venda ainda.</td></tr>
        </table>
      </div>
    </mat-card>
  `,
  styles: `
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 16px; }
    mat-card-content { display: flex; flex-direction: column; gap: 4px; padding: 16px; }
    .rotulo { display: flex; align-items: center; gap: 4px; color: var(--mat-sys-on-surface-variant); }
    .rotulo mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .valor { font: var(--mat-sys-headline-small); }
    .valor.pequeno { font: var(--mat-sys-title-large); }
    mat-card-header { align-items: center; }
    .espaco { flex: 1; }
    .tabela { overflow-x: auto; }
    .cancelada { text-decoration: line-through; color: var(--mat-sys-on-surface-variant); }
    .tag { color: var(--mat-sys-error); font: var(--mat-sys-label-medium); }
    .perigo { background: var(--mat-sys-error); color: var(--mat-sys-on-error); margin-left: 8px; }
    .vazio { padding: 24px; text-align: center; color: var(--mat-sys-on-surface-variant); }
  `,
})
export class VendasPage {
  protected readonly caixa = inject(CaixaService);
  protected readonly formas = Object.keys(FORMAS) as FormaPagamento[];
  protected readonly rotulos = FORMAS;
  protected readonly colunas = ['numero', 'hora', 'itens', 'forma', 'total', 'acoes'];
  protected readonly vendasRecentes = computed(() => [...this.caixa.vendas()].reverse());
  protected readonly confirmandoFechamento = signal(false);

  protected rotuloForma(forma: FormaPagamento): string {
    return FORMAS[forma].rotulo;
  }

  protected fechar(): void {
    this.caixa.fecharCaixa();
    this.confirmandoFechamento.set(false);
  }
}
