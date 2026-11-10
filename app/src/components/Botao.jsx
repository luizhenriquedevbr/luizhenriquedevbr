const variantes = {
  primario: 'bg-laranja text-noite hover:brightness-110',
  secundario: 'bg-azul/15 text-azul hover:bg-azul/25',
  perigo: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
  fantasma: 'bg-transparent text-nevoa hover:bg-noite3',
}

export default function Botao({ variante = 'primario', className = '', type = 'button', carregando, children, disabled, ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-xl font-titulo font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-azul ${variantes[variante]} ${className}`}
      {...rest}
    >
      {carregando ? 'Aguarde...' : children}
    </button>
  )
}
