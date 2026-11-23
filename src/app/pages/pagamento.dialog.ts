import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CaixaService, ErroDeCaixa } from '../core/caixa.service';
import { FORMAS, FormaPagamento, Venda } from '../core/models';
import { MoedaPipe } from '../core/moeda.pipe';

@Component({
  selector: 'app-pagamento',
  imports: [FormsModule, MoedaPipe, MatDialogModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Receber {{ caixa.total() | moeda }}</h2>
    <mat-dialog-content>
      <mat-button-toggle-group [value]="forma()" (change)="forma.set($event.value)" aria-label="Forma de pagamento" class="formas">
        @for (f of formas; track f) {
          <mat-button-toggle [value]="f">
            <mat-icon>{{ rotulos[f].icone }}</mat-icon>
            <span>{{ rotulos[f].rotulo }}</span>
          </mat-button-toggle>
        }
      </mat-button-toggle-group>

      @if (forma() === 'Dinheiro') {
        <mat-form-field appearance="outline" class="recebido">
          <mat-label>Valor recebido</mat-label>
          <span matTextPrefix>R$&nbsp;</span>
          <input matInput type="number" min="0" step="0.01" [ngModel]="recebidoReais()"
                 (ngModelChange)="recebidoReais.set($event)" (keydown.enter)="confirmar()" cdkFocusInitial />
        </mat-form-field>
        <div class="atalhos">
          @for (nota of notasSugeridas(); track nota) {
            <button mat-stroked-button (click)="recebidoReais.set(nota / 100)">{{ nota | moeda }}</button>
          }
        </div>
        <p class="troco" [class.falta]="troco() < 0">
          {{ troco() < 0 ? 'Faltam' : 'Troco' }}: <strong>{{ (troco() < 0 ? -troco() : troco()) | moeda }}</strong>
        </p>
      }

      @if (erro()) {
        <p class="erro" role="alert">{{ erro() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Voltar</button>
      <button mat-flat-button (click)="confirmar()" [disabled]="forma() === 'Dinheiro' && troco() < 0">
        <mat-icon>check</mat-icon> Concluir venda
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content { overflow-x: hidden; }
    .formas { width: 100%; box-sizing: border-box; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 16px; }
    .formas mat-icon { display: block; margin: 8px auto 0; }
    .recebido { width: 100%; }
    .atalhos { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
    .troco { font: var(--mat-sys-title-large); color: var(--mat-sys-primary); }
    .troco.falta, .erro { color: var(--mat-sys-error); }
  `,
})
export class PagamentoDialog {
  protected readonly caixa = inject(CaixaService);
  private readonly ref = inject(MatDialogRef<PagamentoDialog, Venda>);

  protected readonly formas = Object.keys(FORMAS) as FormaPagamento[];
  protected readonly rotulos = FORMAS;
  protected readonly forma = signal<FormaPagamento>('Pix');
  protected readonly recebidoReais = signal<number | null>(null);
  protected readonly erro = signal<string | null>(null);

  private readonly recebido = computed(() => Math.round((this.recebidoReais() ?? 0) * 100));
  protected readonly troco = computed(() => this.recebido() - this.caixa.total());

  /** Sugere o valor exato e as próximas notas redondas acima do total. */
  protected readonly notasSugeridas = computed(() => {
    const total = this.caixa.total();
    const sugestoes = [total, ...[1000, 2000, 5000, 10000, 20000].map((nota) => Math.ceil(total / nota) * nota)];
    return [...new Set(sugestoes)].filter((v) => v >= total).slice(0, 4);
  });

  protected confirmar(): void {
    try {
      this.ref.close(this.caixa.finalizar(this.forma(), this.forma() === 'Dinheiro' ? this.recebido() : undefined));
    } catch (e) {
      this.erro.set(e instanceof ErroDeCaixa ? e.message : 'Não foi possível concluir a venda.');
    }
  }
}
