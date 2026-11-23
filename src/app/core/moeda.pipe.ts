import { Pipe, PipeTransform } from '@angular/core';
import { Centavos } from './models';

const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formata centavos como reais: 1899 → "R$ 18,99". */
@Pipe({ name: 'moeda' })
export class MoedaPipe implements PipeTransform {
  transform(valor: Centavos | null | undefined): string {
    return formatador.format((valor ?? 0) / 100);
  }
}
