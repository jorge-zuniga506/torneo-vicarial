import { useContext } from 'react'
import { AuthContext } from '../contexts/authContextInstance'

export function useAuth() {
  return useContext(AuthContext)
}
