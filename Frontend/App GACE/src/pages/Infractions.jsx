import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const GRAVITE_BADGE = {
  critique: 'bg-red-100 text-red-700',
  majeure: 'bg-orange-100 text-orange-700',
  mineure: 'bg-yellow-100 text-yellow-700',
}

const emptyForm = {
  rapport_id: '',
  entreprise_id: '',
  description: '',
  recommandation: '',
  gravite: 'mineure',
  date_limite_correction: '',
}

export default function Infractions() {
  const { hasRole } = useAuth()
  // destroy is restricted to admin only on the backend (no dedicated delete permission exists yet)
  const canDelete = hasRole('admin')

  const [infractions, setInfractions] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const [graviteFilter, setGraviteFilter] = useState('')
  const [rapports, setRapports] = useState([])
  const [entreprises, setEntreprises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    fetchData(1)
  }, [])

  const fetchData = async (page = 1, gravite = graviteFilter) => {
    setLoading(true)
    try {
      const [iRes, rRes, eRes] = await Promise.all([
        api.get('/infractions', { params: { page, gravite: gravite || undefined } }),
        api.get('/rapports', { params: { per_page: 100 } }),
        api.get('/entreprises', { params: { per_page: 100 } })
      ])
      setInfractions(iRes.data.data)
      setMeta({ current_page: iRes.data.current_page, last_page: iRes.data.last_page })
      setRapports(rRes.data.data)
      setEntreprises(eRes.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (gravite) => {
    setGraviteFilter(gravite)
    fetchData(1, gravite)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/infractions', formData)
      setShowForm(false)
      setFormData(emptyForm)
      fetchData(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer cette infraction ?')) return
    try {
      await api.delete(`/infractions/${id}`)
      fetchData(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  if (loading && infractions.length === 0) return <div>Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Gestion des Infractions</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Signaler une infraction
        </button>
      </div>

      <div className="flex gap-2">
        {['', 'mineure', 'majeure', 'critique'].map(g => (
          <button
            key={g || 'all'}
            onClick={() => handleFilterChange(g)}
            className={`px-3 py-1.5 rounded-lg text-sm border capitalize ${graviteFilter === g ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            {g === '' ? 'Toutes' : g}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nouvelle Infraction</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rapport</label>
                <select required className="w-full border p-2 rounded"
                  value={formData.rapport_id} onChange={e => setFormData({...formData, rapport_id: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  {rapports.map(r => <option key={r.id} value={r.id}>{r.reference}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entreprise</label>
                <select required className="w-full border p-2 rounded"
                  value={formData.entreprise_id} onChange={e => setFormData({...formData, entreprise_id: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  {entreprises.map(e => <option key={e.id} value={e.id}>{e.raison_sociale}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea required className="w-full border p-2 rounded" rows="3"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recommandation</label>
                <textarea className="w-full border p-2 rounded" rows="2"
                  value={formData.recommandation} onChange={e => setFormData({...formData, recommandation: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gravité</label>
                <select className="w-full border p-2 rounded"
                  value={formData.gravite} onChange={e => setFormData({...formData, gravite: e.target.value})}>
                  <option value="mineure">Mineure</option>
                  <option value="majeure">Majeure</option>
                  <option value="critique">Critique</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Délai limite</label>
                <input required type="date" className="w-full border p-2 rounded"
                  value={formData.date_limite_correction} onChange={e => setFormData({...formData, date_limite_correction: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => { setShowForm(false); setFormData(emptyForm) }} className="px-4 py-2 text-slate-600">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Signaler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Entreprise</th>
              <th className="px-6 py-4 font-medium">Gravité</th>
              <th className="px-6 py-4 font-medium">Délai</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4 font-medium">Récidive</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {infractions.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Aucune infraction trouvée</td></tr>
            )}
            {infractions.map(inf => (
              <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{inf.entreprise?.raison_sociale}</td>
                <td className="px-6 py-4 capitalize">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${GRAVITE_BADGE[inf.gravite] || 'bg-slate-100 text-slate-600'}`}>
                    {inf.gravite}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(inf.date_limite_correction).toLocaleDateString('fr-FR')}</td>
                <td className="px-6 py-4 capitalize">{inf.statut_correction?.replace('_', ' ')}</td>
                <td className="px-6 py-4">
                  {inf.is_recidive && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      Récidive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {canDelete && (
                      <button onClick={() => handleDelete(inf.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {meta.last_page > 1 && (
          <div className="flex justify-between items-center px-6 py-3 border-t border-slate-200 text-sm text-slate-600">
            <button
              disabled={meta.current_page <= 1}
              onClick={() => fetchData(meta.current_page - 1)}
              className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40"
            >
              Précédent
            </button>
            <span>Page {meta.current_page} / {meta.last_page}</span>
            <button
              disabled={meta.current_page >= meta.last_page}
              onClick={() => fetchData(meta.current_page + 1)}
              className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  )
}