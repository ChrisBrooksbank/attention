import { useParams } from 'react-router-dom'

export default function Session() {
  const { type } = useParams<{ type: string }>()
  return (
    <div>
      <h1>Session</h1>
      <p>Exercise type: {type}</p>
    </div>
  )
}
