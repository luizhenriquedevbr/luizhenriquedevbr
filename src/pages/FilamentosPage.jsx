import CadastroSimples from '../components/CadastroSimples'
import { brl } from '../lib/formato'

const TIPOS = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'PC']

const campos = [
  { nome: 'name', label: 'Nome', placeholder: 'PLA Preto' },
  { nome: 'type', label: 'Tipo', tipo: 'select', opcoes: TIPOS },
  { nome: 'color_brand', label: 'Cor / marca (opcional)', anulavel: true },
  { nome: 'price_per_kg', label: 'Preço por kg (R$)', placeholder: '119,90', inputMode: 'decimal' },
]

export default function FilamentosPage() {
  return (
    <CadastroSimples
      recurso="filaments"
      titulo="Filamentos"
      rotuloNovo="Novo filamento"
      campos={campos}
      vazio="Nenhum filamento cadastrado ainda."
      descricao={(f) => ({
        titulo: f.name,
        detalhe: `${f.type}${f.color_brand ? ` · ${f.color_brand}` : ''} · ${brl(f.price_per_kg)}/kg`,
      })}
    />
  )
}
