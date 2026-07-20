import { useState, useEffect } from 'react'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, AlertTriangle, FileCheck, Building2, ClipboardList, Repeat, Clock } from 'lucide-react'

const VISITE_STATUT_LABELS = {
  'programmée': 'Programmées',
  'en_cours': 'En cours',
  'réalisée': 'Réalisées',
  'reportée': 'Reportées',
  'annulée': 'Annulées',
}

const RAPPORT_STATUT_LABELS = {
  'brouillon': 'Brouillons',
  'en_attente_validation': 'En attente',
  'validé': 'Validés',
  'envoyé': 'Envoyés',
}

const GRAVITE_LABELS = { mineure: 'Mineures', majeure: 'Majeures', critique: 'Critiques' }
const GRAVITE_COLOR = { mineure: 'bg-yellow-100 text-yellow-700', majeure: 'bg-orange-100 text-orange-700', critique: 'bg-red-100 text-red-700' }

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function StatCard({ icon: Icon, label, value, accent = 'text-blue-600 bg-blue-50' }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-lg ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-800">{value ?? 0}</p>
      </div>
    </div>
  )
}

function BreakdownRow({ labels, data }) {
  const entries = Object.entries(data || {})
  if (entries.length === 0) return <p className="text-sm text-slate-400">Aucune donnée</p>
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, count]) => (
        <span key={key} className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
          {labels[key] || key}: <span className="font-bold">{count}</span>
        </span>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user, can } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [entreprises, setEntreprises] = useState([])
  const [entrepriseFilter, setEntrepriseFilter] = useState('')

  const loadDashboard = (entrepriseId = '') => {
    setLoading(true)
    api.get('/dashboard', { params: { entreprise_id: entrepriseId || undefined } })
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDashboard()
    api.get('/entreprises', { params: { per_page: 200 } })
      .then(res => setEntreprises(res.data.data))
      .catch(err => console.error(err))
  }, [])

  const handleEntrepriseChange = (id) => {
    setEntrepriseFilter(id)
    loadDashboard(id)
  }

  if (loading) return <div>Chargement du tableau de bord...</div>
  if (!data) return <div>Impossible de charger le tableau de bord.</div>

  const isPersonal = data.scope === 'personal'

  // Build a 7-day list (this week) for the weekly planning view.
  const weekDays = []
  const start = new Date()
  start.setDate(start.getDate() - start.getDay() + 1) // Monday
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    weekDays.push(d)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            {isPersonal ? `Mon tableau de bord — ${user?.name}` : 'Tableau de bord global'}
          </h2>
          <p className="text-sm text-slate-500 capitalize">Rôle : {user?.role}</p>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Filtrer par entreprise</label>
          <select
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 min-w-[220px]"
            value={entrepriseFilter}
            onChange={e => handleEntrepriseChange(e.target.value)}
          >
            <option value="">Toutes les entreprises</option>
            {entreprises.map(e => <option key={e.id} value={e.id}>{e.raison_sociale}</option>)}
          </select>
        </div>
      </div>

      {data.entreprise_selectionnee && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-indigo-600" />
          <p className="text-sm text-indigo-800">
            Statistiques pour <span className="font-bold">{data.entreprise_selectionnee.raison_sociale}</span> —
            <span className="font-bold"> {data.visites.total}</span> visite{data.visites.total !== 1 ? 's' : ''} au total
          </p>
        </div>
      )}

      {/* ---- Top stat cards ---- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Visites (total)" value={data.visites.total} />
        <StatCard icon={ClipboardList} label="Rapports (total)" value={data.rapports.total} accent="text-indigo-600 bg-indigo-50" />
        <StatCard icon={AlertTriangle} label="Infractions ouvertes" value={data.infractions.total} accent="text-red-600 bg-red-50" />
        {data.entreprises && (
          <StatCard icon={Building2} label="Entreprises" value={data.entreprises.total} accent="text-green-600 bg-green-50" />
        )}
      </div>

      {/* ---- Alerts row: overdue + récidives ---- */}
      {(data.infractions.en_retard > 0 || data.infractions.recidives > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.infractions.en_retard > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">
                <span className="font-bold">{data.infractions.en_retard}</span> infraction(s) en retard de correction
              </p>
            </div>
          )}
          {data.infractions.recidives > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3">
              <Repeat className="w-5 h-5 text-purple-600" />
              <p className="text-sm text-purple-800">
                <span className="font-bold">{data.infractions.recidives}</span> infraction(s) en récidive
              </p>
            </div>
          )}
        </div>
      )}

      {/* ---- Reports awaiting validation (responsable/admin only) ---- */}
      {data.rapports.en_attente_validation && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-800">Rapports en attente de validation</h3>
          </div>
          {data.rapports.en_attente_validation.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun rapport en attente.</p>
          ) : (
            <div className="space-y-2">
              {data.rapports.en_attente_validation.map(r => (
                <div key={r.id} className="flex justify-between items-center bg-amber-50 rounded-lg px-4 py-2">
                  <div className="text-sm">
                    <span className="font-medium text-slate-900">{r.reference}</span>
                    <span className="text-slate-500"> — {r.visite?.entreprise?.raison_sociale} (par {r.visite?.inspecteur?.name})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- Today's plan ---- */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Planning du jour</h3>
        {data.visites.aujourdhui.length === 0 ? (
          <p className="text-sm text-slate-400">Aucune visite prévue aujourd'hui.</p>
        ) : (
          <div className="space-y-2">
            {data.visites.aujourdhui.map(v => (
              <div key={v.id} className="flex justify-between items-center bg-slate-50 rounded-lg px-4 py-2 text-sm">
                <div>
                  <span className="font-medium text-slate-900">{new Date(v.date_prevue).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-slate-600"> — {v.entreprise?.raison_sociale}</span>
                  {!isPersonal && <span className="text-slate-400"> ({v.inspecteur?.name})</span>}
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 capitalize">{v.statut}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Weekly plan ---- */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-3">Planning de la semaine</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map(d => {
            const key = d.toISOString().slice(0, 10)
            const dayVisites = data.visites.cette_semaine[key] || []
            const isToday = key === new Date().toISOString().slice(0, 10)
            return (
              <div key={key} className={`rounded-lg p-3 ${isToday ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
                <p className="text-xs font-medium text-slate-500 mb-2">
                  {DAY_NAMES[d.getDay()]} {d.getDate()}
                </p>
                {dayVisites.length === 0 ? (
                  <p className="text-xs text-slate-300">—</p>
                ) : (
                  <div className="space-y-1">
                    {dayVisites.map(v => (
                      <div key={v.id} className="text-xs bg-white rounded px-2 py-1 truncate" title={v.entreprise?.raison_sociale}>
                        {v.entreprise?.raison_sociale}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ---- Breakdown panels ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Visites par statut</h3>
          <BreakdownRow labels={VISITE_STATUT_LABELS} data={data.visites.par_statut} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Rapports par statut</h3>
          <BreakdownRow labels={RAPPORT_STATUT_LABELS} data={data.rapports.par_statut} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Infractions par gravité</h3>
          <BreakdownRow labels={GRAVITE_LABELS} data={data.infractions.par_gravite} />
        </div>
        {data.entreprises && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">Entreprises par niveau de risque</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(data.entreprises.par_risque || {}).map(([niveau, count]) => (
                <span key={niveau} className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  niveau === 'eleve' ? 'bg-red-100 text-red-700' : niveau === 'moyen' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                }`}>
                  {niveau}: <span className="font-bold">{count}</span>
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">{data.entreprises.actives} entreprise(s) active(s) sur {data.entreprises.total}</p>
          </div>
        )}
      </div>

      {data.visites_par_entreprise && data.visites_par_entreprise.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Top entreprises par nombre de visites</h3>
          <div className="space-y-1">
            {data.visites_par_entreprise.map(row => (
              <button
                key={row.entreprise_id}
                onClick={() => handleEntrepriseChange(String(row.entreprise_id))}
                className="w-full flex justify-between items-center px-4 py-2 rounded-lg hover:bg-slate-50 text-left"
              >
                <span className="text-sm text-slate-700">{row.raison_sociale}</span>
                <span className="text-sm font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full">{row.total}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}