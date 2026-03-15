import { useParams } from 'react-router-dom'

export default function Results() {
  const { sessionId } = useParams<{ sessionId: string }>()
  return (
    <div>
      <h1>Results</h1>
      <p>Session: {sessionId}</p>
    </div>
  )
}
