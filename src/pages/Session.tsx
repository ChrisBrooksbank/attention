import { useLocation, useParams, Navigate } from 'react-router-dom'
import SelectiveAttention from '../components/exercises/SelectiveAttention'
import SustainedAttention from '../components/exercises/SustainedAttention'
import NBack from '../components/exercises/NBack'
import type { ExerciseType } from '../db/models'

const VALID_TYPES: ExerciseType[] = ['selective', 'sustained', 'nback']

function isExerciseType(value: string): value is ExerciseType {
  return (VALID_TYPES as string[]).includes(value)
}

export default function Session() {
  const { type } = useParams<{ type: string }>()
  const location = useLocation()
  const difficulty: number = (location.state as { difficulty?: number } | null)?.difficulty ?? 3

  if (!type || !isExerciseType(type)) {
    return <Navigate to="/train" replace />
  }

  if (type === 'selective') {
    return <SelectiveAttention difficulty={difficulty} />
  }
  if (type === 'sustained') {
    return <SustainedAttention difficulty={difficulty} />
  }
  return <NBack difficulty={difficulty} />
}
