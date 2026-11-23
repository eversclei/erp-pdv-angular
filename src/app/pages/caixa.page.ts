import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CaixaService, DESCONTO_MAXIMO_PERCENTUAL } from '../core/caixa.service';
import { CATALOGO, Categoria, Produto, Venda } from '../core/models';
import { MoedaPipe } from '../core/moeda.pipe';
import { PagamentoDialog } from './pagamento.dialog';

@Component({
  selector: 'app-caixa',
  host: { '(document:keydown.F2)': 'pagar($event)' },
  imports: [
    FormsModule,
    MoedaPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatDividerModule,
    MatSelectModule,
    MatTooltipModule,
    MatBadgeModule,
  ],
  template: `
    <div class="grade">
      <section class="catalogo">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="busca">
          <mat-label>Buscar produto ou código de barras</mat-label>
          <mat-icon matPrefix>barcode_scanner</mat-icon>
          <input matInput [ngModel]="busca()" (ngModelChange)="busca.set($event)" (keydown.enter)="adicionarPorCodigo()" autofocus />
        </mat-form-field>

        <mat-chip-listbox aria-label="Categorias" [value]="categoria()" (change)="categoria.set($event.value ?? null)">
          @for (c of categorias; track c) {
            <mat-chip-option [value]="c">{{ c }}</mat-chip-option>
          }
        </mat-chip-listbox>

        <div class="produtos">
          @for (p of produtosFiltrados(); track p.sku) {
            <button mat-stroked-button class="produto" (click)="caixa.adicionar(p)">
              <mat-icon>{{ p.icone }}</mat-icon>
              <span class="nome">{{ p.nome }}</span>
              <strong>{{ p.preco | moeda }}</strong>
            </button>
          } @empty {
            <p class="vazio">Nenhum produto encontrado.</p>
          }
        </div>
      </section>

      <mat-card appearance="outlined" class="cupom">
        <mat-card-header>
          <mat-icon mat-card-avatar [matBadge]="caixa.quantidadeItens()" [matBadgeHidden]="!caixa.quantidadeItens()">shopping_cart</mat-icon>
          <mat-card-title>Venda atual</mat-card-title>
          <mat-card-subtitle>{{ caixa.quantidadeItens() }} {{ caixa.quantidadeItens() === 1 ? 'item' : 'itens' }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="itens">
          <mat-list>
            @for (item of caixa.itens(); track item.produto.sku) {
              <mat-list-item>
                <span matListItemTitle>{{ item.produto.nome }}</span>
                <span matListItemLine>{{ item.quantidade }} × {{ item.produto.preco | moeda }} = <strong>{{ item.produto.preco * item.quantidade | moeda }}</strong></span>
                <div matListItemMeta class="qtd">
                  <button mat-icon-button (click)="caixa.alterarQuantidade(item.produto.sku, item.quantidade - 1)" aria-label="Diminuir">
                    <mat-icon>remove</mat-icon>
                  </button>
                  <button mat-icon-button (click)="caixa.alterarQuantidade(item.produto.sku, item.quantidade + 1)" aria-label="Aumentar">
                    <mat-icon>add</mat-icon>
                  </button>
                </div>
              </mat-list-item>
            } @empty {
              <p class="vazio">Toque num produto ou leia o código de barras.</p>
            }
          </mat-list>
        </mat-card-content>

        <mat-divider />
        <mat-card-content class="totais">
          <div><span>Subtotal</span><span>{{ caixa.subtotal() | moeda }}</span></div>
          <div class="desconto">
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Desconto</mat-label>
              <mat-select [value]="caixa.descontoPercentual()" (selectionChange)="caixa.aplicarDesconto($event.value)"
                          [disabled]="!caixa.itens().length">
                @for (d of opcoesDesconto; track d) {
                  <mat-option [value]="d">{{ d }}%</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <span>− {{ caixa.desconto() | moeda }}</span>
          </div>
          <div class="total"><span>Total</span><span>{{ caixa.total() | moeda }}</span></div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="caixa.limpar()" [disabled]="!caixa.itens().length">
            <mat-icon>delete_sweep</mat-icon> Limpar
          </button>
          <button mat-flat-button class="pagar" (click)="pagar()" [disabled]="!caixa.itens().length" matTooltip="Atalho: F2">
            <mat-icon>point_of_sale</mat-icon> Receber {{ caixa.total() | moeda }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .grade { display: grid; grid-template-columns: 1fr 400px; gap: 16px; align-items: start; }
    @media (max-width: 960px) { .grade { grid-template-columns: 1fr; } }
    .catalogo { display: flex; flex-direction: column; gap: 12px; }
    .busca { width: 100%; }
    .produtos { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
    .produto { height: auto; padding: 16px 8px; display: flex; flex-direction: column; gap: 6px;
      --mat-button-outlined-container-shape: 16px; }
    .produto ::ng-deep .mdc-button__label { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .produto mat-icon { font-size: 32px; width: 32px; height: 32px; margin: 0; color: var(--mat-sys-primary); }
    .produto .nome { white-space: normal; line-height: 1.2; }
    .cupom { position: sticky; top: 16px; }
    .itens { max-height: 42vh; overflow-y: auto; }
    .qtd { display: flex; }
    .totais > div { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
    .desconto mat-form-field { width: 120px; }
    .total { font: var(--mat-sys-headline-small); color: var(--mat-sys-primary); }
    mat-card-actions { display: flex; justify-content: space-between; padding: 16px; }
    .pagar { flex: 1; margin-left: 8px; }
    .vazio { color: var(--mat-sys-on-surface-variant); padding: 16px; text-align: center; }
  `,
})
export class CaixaPage {
  protected readonly caixa = inject(CaixaService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  protected readonly busca = signal('');
  protected readonly categoria = signal<Categoria | null>(null);
  protected readonly categorias: Categoria[] = ['Bebidas', 'Lanches', 'Mercearia', 'Limpeza'];
  protected readonly opcoesDesconto = Array.from({ length: DESCONTO_MAXIMO_PERCENTUAL / 5 + 1 }, (_, i) => i * 5);

  protected readonly produtosFiltrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const categoria = this.categoria();
    return CATALOGO.filter(
      (p) => (!categoria || p.categoria === categoria) && (!termo || p.nome.toLowerCase().includes(termo) || p.sku.includes(termo)),
    );
  });

  /** Leitor de código de barras "digita" o código e manda Enter. */
  protected adicionarPorCodigo(): void {
    const produto: Produto | undefined = CATALOGO.find((p) => p.sku === this.busca().trim());
    if (produto) {
      this.caixa.adicionar(produto);
      this.busca.set('');
    }
  }

  protected pagar(evento?: Event): void {
    evento?.preventDefault();
    if (!this.caixa.itens().length || this.dialog.openDialogs.length) return;

    this.dialog
      .open(PagamentoDialog, { width: '440px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe((venda?: Venda) => {
        if (venda) {
          const troco = venda.troco ? ` · Troco: R$ ${(venda.troco / 100).toFixed(2).replace('.', ',')}` : '';
          this.snack.open(`Venda nº ${venda.numero} concluída${troco}`, 'OK', { duration: 5000 });
        }
      });
  }
}
