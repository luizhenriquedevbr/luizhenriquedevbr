import Cartao from '../components/Cartao'

export default function EmBreve({ titulo }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">{titulo}</h1>
      <Cartao><p>Em breve</p></Cartao>
    </div>
  )
}
