import { Link } from 'react-router-dom'
import Aviso from './Aviso'

const link = (para, texto) => <Link className="underline" to={para}>{texto}</Link>

// historico: avisos de uma peça já salva (texto no passado).
function texto(w, historico) {
  switch (w) {
    case 'impressora_sem_valor':
      return <>A impressora está sem valor de compra; o desgaste da máquina ficou de fora. Informe o valor em {link('/impressoras', 'Impressoras')}.</>
    case 'consumo_vazio':
      return <>Essa impressora não tem consumo de energia cadastrado; a energia ficou de fora. Informe em {link('/impressoras', 'Impressoras')}.</>
    case 'consumo_sem_tipo':
      return `Esse tipo de filamento não ${historico ? 'tinha' : 'tem'} consumo cadastrado nessa impressora; usei o maior valor.`
    case 'cadastro_desativado':
      return `Algum cadastro usado aqui ${historico ? 'estava' : 'está'} desativado; usei o último preço dele.`
    default:
      return w
  }
}

export default function AvisosCusto({ avisos, historico = false }) {
  if (!avisos?.length) return null
  return (
    <div className="mt-3 space-y-2">
      {avisos.map((w) => <Aviso key={w} tom="alerta">{texto(w, historico)}</Aviso>)}
    </div>
  )
}
