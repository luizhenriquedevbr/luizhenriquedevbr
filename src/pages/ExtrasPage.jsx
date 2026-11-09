import CadastroSimples from '../components/CadastroSimples'
import { brl } from '../lib/formato'

const campos = [
  { nome: 'name', label: 'Nome', placeholder: 'Argola' },
  { nome: 'unit_price', label: 'Preço unitário (R$)', placeholder: '0,40', inputMode: 'decimal', decimal: true },
]

export default function ExtrasPage() {
  return (
    <CadastroSimples
      recurso="extras"
      titulo="Extras"
      rotuloNovo="Novo extra"
      campos={campos}
      vazio="Nenhum extra cadastrado ainda."
      descricao={(x) => ({ titulo: x.name, detalhe: `${brl(x.unit_price)} por unidade` })}
    />
  )
}
