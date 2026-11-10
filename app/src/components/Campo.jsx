import { useId } from 'react'

export default function Campo({ label, erro, className = '', ...rest }) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-nevoa mb-1.5">{label}</label>
      <input
        id={id}
        aria-invalid={erro ? 'true' : undefined}
        className={`w-full min-h-[44px] px-3 rounded-xl bg-noite border text-white placeholder:text-nevoa/40 focus:outline-none focus:ring-2 focus:ring-azul ${erro ? 'border-red-400' : 'border-noite3'}`}
        {...rest}
      />
      {erro && <p className="mt-1 text-sm text-red-300">{erro}</p>}
    </div>
  )
}
