/** Valores monetários são sempre em centavos (inteiros) para evitar erro de ponto flutuante. */
export type Centavos = number;

export type Categoria = 'Bebidas' | 'Lanches' | 'Mercearia' | 'Limpeza';

export interface Produto {
  sku: string;
  nome: string;
  preco: Centavos;
  categoria: Categoria;
  icone: string;
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export type FormaPagamento = 'Dinheiro' | 'Debito' | 'Credito' | 'Pix';

export interface Venda {
  numero: number;
  data: string;
  itens: ItemCarrinho[];
  subtotal: Centavos;
  desconto: Centavos;
  total: Centavos;
  forma: FormaPagamento;
  recebido: Centavos;
  troco: Centavos;
  cancelada: boolean;
}

export const FORMAS: Record<FormaPagamento, { rotulo: string; icone: string }> = {
  Dinheiro: { rotulo: 'Dinheiro', icone: 'payments' },
  Debito: { rotulo: 'Débito', icone: 'credit_card' },
  Credito: { rotulo: 'Crédito', icone: 'credit_score' },
  Pix: { rotulo: 'Pix', icone: 'qr_code_2' },
};

export const CATALOGO: Produto[] = [
  { sku: '7891000100103', nome: 'Café torrado 500g', preco: 1899, categoria: 'Mercearia', icone: 'coffee' },
  { sku: '7891000053508', nome: 'Arroz tipo 1 5kg', preco: 2790, categoria: 'Mercearia', icone: 'rice_bowl' },
  { sku: '7896005800010', nome: 'Feijão carioca 1kg', preco: 849, categoria: 'Mercearia', icone: 'grain' },
  { sku: '7891910000197', nome: 'Açúcar refinado 1kg', preco: 549, categoria: 'Mercearia', icone: 'bakery_dining' },
  { sku: '7894900011517', nome: 'Refrigerante 2L', preco: 999, categoria: 'Bebidas', icone: 'local_drink' },
  { sku: '7891149103102', nome: 'Água mineral 500ml', preco: 299, categoria: 'Bebidas', icone: 'water_bottle' },
  { sku: '7891149410101', nome: 'Suco integral 1L', preco: 1249, categoria: 'Bebidas', icone: 'emoji_food_beverage' },
  { sku: '2000000000011', nome: 'Pão de queijo (un.)', preco: 450, categoria: 'Lanches', icone: 'egg_alt' },
  { sku: '2000000000028', nome: 'Coxinha', preco: 750, categoria: 'Lanches', icone: 'lunch_dining' },
  { sku: '2000000000035', nome: 'Misto quente', preco: 1100, categoria: 'Lanches', icone: 'breakfast_dining' },
  { sku: '7891024134702', nome: 'Detergente 500ml', preco: 279, categoria: 'Limpeza', icone: 'soap' },
  { sku: '7896098900208', nome: 'Água sanitária 1L', preco: 649, categoria: 'Limpeza', icone: 'sanitizer' },
];
