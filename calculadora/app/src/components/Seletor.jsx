import { useId } from 'react'

export default function Seletor({ label, erro, opcoes, className = '', ...rest }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-nevoa mb-1.5">{label}</label>
      <select
        id={id}
        aria-invalid={erro ? 'true' : undefined}
        className={`w-full min-h-[44px] px-3 rounded-xl bg-noite border text-white focus:outline-none focus:ring-2 focus:ring-azul ${erro ? 'border-red-400' : 'border-noite3'}`}
        {...rest}
      >
        {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {erro && <p className="mt-1 text-sm text-red-300">{erro}</p>}
    </div>
  )
}
