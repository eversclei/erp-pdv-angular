import { Injectable, computed, signal } from '@angular/core';
import { Centavos, FormaPagamento, ItemCarrinho, Produto, Venda } from './models';

const CHAVE_VENDAS = 'pdv.vendas';

/** Desconto máximo que o operador pode dar sem liberação do gerente. */
export const DESCONTO_MAXIMO_PERCENTUAL = 10;

export class ErroDeCaixa extends Error {}

/**
 * Estado do caixa: carrinho da venda atual e vendas do dia.
 * Tudo em signals; as vendas ficam no localStorage para sobreviver a um F5.
 */
@Injectable({ providedIn: 'root' })
export class CaixaService {
  private readonly _itens = signal<ItemCarrinho[]>([]);
  private readonly _descontoPercentual = signal(0);
  private readonly _vendas = signal<Venda[]>(this.carregarVendas());

  readonly itens = this._itens.asReadonly();
  readonly descontoPercentual = this._descontoPercentual.asReadonly();
  readonly vendas = this._vendas.asReadonly();

  readonly quantidadeItens = computed(() => this._itens().reduce((s, i) => s + i.quantidade, 0));
  readonly subtotal = computed<Centavos>(() => this._itens().reduce((s, i) => s + i.produto.preco * i.quantidade, 0));
  readonly desconto = computed<Centavos>(() => Math.round((this.subtotal() * this._descontoPercentual()) / 100));
  readonly total = computed<Centavos>(() => this.subtotal() - this.desconto());

  readonly vendasValidas = computed(() => this._vendas().filter((v) => !v.cancelada));
  readonly resumo = computed(() => {
    const validas = this.vendasValidas();
    const totalVendido = validas.reduce((s, v) => s + v.total, 0);
    const porForma = { Dinheiro: 0, Debito: 0, Credito: 0, Pix: 0 } as Record<FormaPagamento, Centavos>;
    for (const v of validas) porForma[v.forma] += v.total;
    return {
      quantidade: validas.length,
      totalVendido,
      ticketMedio: validas.length ? Math.round(totalVendido / validas.length) : 0,
      porForma,
    };
  });

  adicionar(produto: Produto, quantidade = 1): void {
    this._itens.update((itens) => {
      const existente = itens.find((i) => i.produto.sku === produto.sku);
      return existente
        ? itens.map((i) => (i === existente ? { ...i, quantidade: i.quantidade + quantidade } : i))
        : [...itens, { produto, quantidade }];
    });
  }

  alterarQuantidade(sku: string, quantidade: number): void {
    if (quantidade <= 0) {
      this.remover(sku);
      return;
    }
    this._itens.update((itens) => itens.map((i) => (i.produto.sku === sku ? { ...i, quantidade } : i)));
  }

  remover(sku: string): void {
    this._itens.update((itens) => itens.filter((i) => i.produto.sku !== sku));
  }

  aplicarDesconto(percentual: number): void {
    if (percentual < 0 || percentual > DESCONTO_MAXIMO_PERCENTUAL) {
      throw new ErroDeCaixa(`O desconto deve ficar entre 0% e ${DESCONTO_MAXIMO_PERCENTUAL}%.`);
    }
    this._descontoPercentual.set(percentual);
  }

  limpar(): void {
    this._itens.set([]);
    this._descontoPercentual.set(0);
  }

  /** Fecha a venda atual. Em dinheiro, o valor recebido precisa cobrir o total e o troco é calculado. */
  finalizar(forma: FormaPagamento, recebido: Centavos = this.total()): Venda {
    if (this._itens().length === 0) throw new ErroDeCaixa('Adicione ao menos um produto.');
    const total = this.total();
    if (forma === 'Dinheiro' && recebido < total) throw new ErroDeCaixa('Valor recebido menor que o total.');

    const venda: Venda = {
      numero: (this._vendas().at(-1)?.numero ?? 0) + 1,
      data: new Date().toISOString(),
      itens: this._itens(),
      subtotal: this.subtotal(),
      desconto: this.desconto(),
      total,
      forma,
      recebido: forma === 'Dinheiro' ? recebido : total,
      troco: forma === 'Dinheiro' ? recebido - total : 0,
      cancelada: false,
    };

    this._vendas.update((vendas) => [...vendas, venda]);
    this.salvarVendas();
    this.limpar();
    return venda;
  }

  cancelarVenda(numero: number): void {
    this._vendas.update((vendas) => vendas.map((v) => (v.numero === numero ? { ...v, cancelada: true } : v)));
    this.salvarVendas();
  }

  /** Fechamento: zera o histórico do dia. */
  fecharCaixa(): void {
    this._vendas.set([]);
    this.salvarVendas();
  }

  private carregarVendas(): Venda[] {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_VENDAS) ?? '[]') as Venda[];
    } catch {
      return [];
    }
  }

  private salvarVendas(): void {
    try {
      localStorage.setItem(CHAVE_VENDAS, JSON.stringify(this._vendas()));
    } catch {
      // Sem storage disponível o PDV continua funcionando só em memória.
    }
  }
}
