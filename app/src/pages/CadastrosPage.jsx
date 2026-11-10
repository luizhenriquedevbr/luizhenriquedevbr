import { Link } from 'react-router-dom'

const ITENS = [
  { para: '/impressoras', titulo: 'Impressoras', texto: 'Valor de compra, vida útil e consumo de energia' },
  { para: '/filamentos', titulo: 'Filamentos', texto: 'Tipo, cor e preço por kg' },
  { para: '/extras', titulo: 'Extras', texto: 'Argola, embalagem, ímã e outros' },
]

export default function CadastrosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Cadastros</h1>
      <div className="grid gap-3">
        {ITENS.map((i) => (
          <Link key={i.para} to={i.para} className="block rounded-2xl bg-noite2 border border-noite3/60 p-5 min-h-[88px] hover:bg-noite3">
            <span className="block font-titulo text-xl font-semibold text-white">{i.titulo}</span>
            <span className="block text-sm mt-1">{i.texto}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
