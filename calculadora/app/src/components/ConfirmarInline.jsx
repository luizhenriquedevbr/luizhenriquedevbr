import { useState } from 'react'
import Botao from './Botao'

// Confirmação na própria tela (sem confirm() do navegador).
export default function ConfirmarInline({ rotulo, pergunta = 'Tem certeza?', rotuloConfirmar = 'Sim, confirmar', onConfirmar, variante = 'perigo' }) {
  const [aberto, setAberto] = useState(false)

  if (!aberto) return <Botao variante={variante} onClick={() => setAberto(true)}>{rotulo}</Botao>

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-noite border border-noite3 p-2">
      <span className="text-sm text-white px-1">{pergunta}</span>
      <Botao variante={variante} onClick={() => { setAberto(false); onConfirmar() }}>{rotuloConfirmar}</Botao>
      <Botao variante="fantasma" onClick={() => setAberto(false)}>Cancelar</Botao>
    </div>
  )
}
