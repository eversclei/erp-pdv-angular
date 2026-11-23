import { TestBed } from '@angular/core/testing';
import { CaixaService, ErroDeCaixa } from './caixa.service';
import { CATALOGO } from './models';

const cafe = CATALOGO[0]; // R$ 18,99
const agua = CATALOGO[5]; // R$ 2,99

describe('CaixaService', () => {
  let caixa: CaixaService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    caixa = TestBed.inject(CaixaService);
  });

  it('soma quantidades do mesmo produto em uma linha', () => {
    caixa.adicionar(cafe);
    caixa.adicionar(cafe);
    caixa.adicionar(agua, 3);

    expect(caixa.itens().length).toBe(2);
    expect(caixa.quantidadeItens()).toBe(5);
    expect(caixa.subtotal()).toBe(2 * 1899 + 3 * 299);
  });

  it('quantidade zero remove o item', () => {
    caixa.adicionar(cafe);
    caixa.alterarQuantidade(cafe.sku, 0);

    expect(caixa.itens()).toEqual([]);
  });

  it('aplica desconto em centavos arredondados e respeita o limite', () => {
    caixa.adicionar(cafe); // 1899
    caixa.aplicarDesconto(5);

    expect(caixa.desconto()).toBe(95); // 94,95 → 95
    expect(caixa.total()).toBe(1804);
    expect(() => caixa.aplicarDesconto(15)).toThrow(ErroDeCaixa);
  });

  it('venda em dinheiro calcula troco e limpa o carrinho', () => {
    caixa.adicionar(cafe);

    const venda = caixa.finalizar('Dinheiro', 2000);

    expect(venda.troco).toBe(101);
    expect(venda.numero).toBe(1);
    expect(caixa.itens()).toEqual([]);
    expect(caixa.descontoPercentual()).toBe(0);
  });

  it('recusa dinheiro insuficiente e venda vazia', () => {
    expect(() => caixa.finalizar('Pix')).toThrow('Adicione ao menos um produto.');

    caixa.adicionar(cafe);
    expect(() => caixa.finalizar('Dinheiro', 1000)).toThrow('Valor recebido menor que o total.');
    expect(caixa.vendas().length).toBe(0);
  });

  it('resumo ignora vendas canceladas e separa por forma de pagamento', () => {
    caixa.adicionar(cafe);
    caixa.finalizar('Pix');
    caixa.adicionar(agua);
    caixa.finalizar('Dinheiro', 299);
    caixa.adicionar(cafe);
    const cancelada = caixa.finalizar('Credito');

    caixa.cancelarVenda(cancelada.numero);

    const resumo = caixa.resumo();
    expect(resumo.quantidade).toBe(2);
    expect(resumo.totalVendido).toBe(1899 + 299);
    expect(resumo.porForma.Pix).toBe(1899);
    expect(resumo.porForma.Credito).toBe(0);
    expect(resumo.ticketMedio).toBe(1099);
  });

  it('vendas sobrevivem a um recarregamento da página', () => {
    caixa.adicionar(agua);
    caixa.finalizar('Debito');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const recarregado = TestBed.inject(CaixaService);

    expect(recarregado.vendas().length).toBe(1);
    expect(recarregado.vendas()[0].forma).toBe('Debito');
  });
});
