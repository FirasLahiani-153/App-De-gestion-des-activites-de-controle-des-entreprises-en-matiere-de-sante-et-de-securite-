import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      if (err.response?.data?.errors) {
        // Validation errors
        const firstError = Object.values(err.response.data.errors)[0][0]
        setError(firstError)
      } else if (err.response?.data?.message) {
        // Auth errors (wrong password, inactive)
        setError(err.response.data.message)
      } else {
        setError('Une erreur est survenue lors de la connexion.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">App GACE</h2>
          <p className="text-gray-600 mt-2">Connectez-vous à votre compte</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse Email
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        
        <div className="mt-6 text-sm text-center">
          <span className="text-gray-600">Vous n'avez pas de compte ? </span>
          <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
            S'inscrire
          </Link>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center bg-gray-50 p-2 rounded">
          Test accounts:<br />
          admin@gace.tn / password<br />
          inspecteur@gace.tn / password<br />
          responsable@gace.tn / password
        </div>
      </div>
    </div>
  )
}
