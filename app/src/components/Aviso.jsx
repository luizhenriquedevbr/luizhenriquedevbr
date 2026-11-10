const tons = {
  info: 'bg-azul/10 border-azul/40 text-nevoa',
  alerta: 'bg-moeda/10 border-moeda/40 text-moeda',
  erro: 'bg-red-500/10 border-red-400/40 text-red-200',
  sucesso: 'bg-emerald-500/10 border-emerald-400/40 text-emerald-200',
}

export default function Aviso({ tom = 'info', className = '', children }) {
  return (
    <div role={tom === 'erro' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${tons[tom]} ${className}`}>
      {children}
    </div>
  )
}
