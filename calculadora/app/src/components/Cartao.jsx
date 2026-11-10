export default function Cartao({ className = '', children, ...rest }) {
  return (
    <div className={`bg-noite2 rounded-2xl p-5 border border-noite3/60 ${className}`} {...rest}>
      {children}
    </div>
  )
}
