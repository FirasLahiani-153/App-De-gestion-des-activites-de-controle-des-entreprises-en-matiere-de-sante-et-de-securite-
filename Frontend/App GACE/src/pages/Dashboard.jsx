import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Rôle actuel</h3>
          <p className="text-2xl font-semibold text-slate-800 capitalize">
            {user?.role || 'Non défini'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Visites Réalisées</h3>
          <p className="text-2xl font-semibold text-slate-800">--</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Infractions Ouvertes</h3>
          <p className="text-2xl font-semibold text-slate-800">--</p>
        </div>
      </div>
    </div>
  )
}