import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const STATUT_BADGE = {
  'programmée': 'bg-blue-100 text-blue-700',
  'en_cours': 'bg-amber-100 text-amber-700',
  'réalisée': 'bg-green-100 text-green-700',
  'reportée': 'bg-slate-200 text-slate-700',
  'annulée': 'bg-red-100 text-red-700',
}

const emptyForm = {
  entreprise_id: '',
  inspecteur_id: '',
  type_visite: '',
  lieu: '',
  statut: 'programmée',
  date_prevue: '',
}

export default function Visites() {
  const { user, can } = useAuth()
  // Only admin/responsable get to assign a specific inspecteur — inspecteurs are auto-assigned to themselves.
  const canAssignInspecteur = can('voir-utilisateurs')

  const [visites, setVisites] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [statutFilter, setStatutFilter] = useState('')
  const [entrepriseFilter, setEntrepriseFilter] = useState('')
  const [entreprises, setEntreprises] = useState([])
  const [inspecteurs, setInspecteurs] = useState([])
  const [typeVisiteOptions, setTypeVisiteOptions] = useState({}) // { code: { fr, ar } }
  const [lieuxOptions, setLieuxOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [postponeTarget, setPostponeTarget] = useState(null) // { id, date } or null when closed

  useEffect(() => {
    fetchData(1)
    api.get('/visites/types').then(res => setTypeVisiteOptions(res.data)).catch(err => console.error(err))
    api.get('/visites/gouvernorats').then(res => setLieuxOptions(res.data)).catch(err => console.error(err))
  }, [])

  const fetchData = async (page = 1, statut = statutFilter, entrepriseId = entrepriseFilter) => {
    setLoading(true)
    try {
      const calls = [
        api.get('/visites', { params: { page, statut: statut || undefined, entreprise_id: entrepriseId || undefined } }),
        api.get('/entreprises', { params: { per_page: 100 } }),
      ]
      // Only fetch the full user list if we actually need it for the assignment dropdown —
      // an inspecteur doesn't have 'voir-utilisateurs' and doesn't need this anyway.
      if (canAssignInspecteur) {
        calls.push(api.get('/users'))
      }

      const results = await Promise.all(calls)
      setVisites(results[0].data.data)
      setMeta({ current_page: results[0].data.current_page, last_page: results[0].data.last_page, total: results[0].data.total })
      setEntreprises(results[1].data.data)
      if (canAssignInspecteur) {
        setInspecteurs(results[2].data.filter(u => u.roles?.some(r => r.name === 'inspecteur')))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (statut) => {
    setStatutFilter(statut)
    fetchData(1, statut, entrepriseFilter)
  }

  const handleEntrepriseFilterChange = (entrepriseId) => {
    setEntrepriseFilter(entrepriseId)
    fetchData(1, statutFilter, entrepriseId)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...formData }
      if (!canAssignInspecteur) delete payload.inspecteur_id // backend auto-assigns to self
      await api.post('/visites', payload)
      setShowForm(false)
      setFormData(emptyForm)
      fetchData(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer cette visite ?')) return
    try {
      await api.delete(`/visites/${id}`)
      fetchData(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  // Lets an inspecteur (on their own visits) or admin/responsable record the real outcome:
  // the visit happened, got postponed, or was cancelled.
  const handleStatutChange = async (id, statut) => {
    // Postponing needs a new planned date — open the calendar modal instead of
    // firing the request immediately (the backend requires date_prevue for this).
    if (statut === 'reportée') {
      const currentVisite = visites.find(v => v.id === id)
      setPostponeTarget({
        id,
        date: currentVisite?.date_prevue ? currentVisite.date_prevue.slice(0, 16) : '',
      })
      return
    }

    try {
      await api.put(`/visites/${id}`, { statut })
      fetchData(meta.current_page)
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message
      alert(msg || 'Erreur lors de la mise à jour du statut')
    }
  }

  const confirmPostpone = async (e) => {
    e.preventDefault()
    if (!postponeTarget?.date) return
    try {
      await api.put(`/visites/${postponeTarget.id}`, {
        statut: 'reportée',
        date_prevue: postponeTarget.date,
      })
      setPostponeTarget(null)
      fetchData(meta.current_page)
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message
      alert(msg || 'Erreur lors du report de la visite')
    }
  }

  if (loading && visites.length === 0) return <div>Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">
          {canAssignInspecteur ? 'Gestion des Visites' : 'Mes Visites'}
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Programmer une visite
        </button>
      </div>

      <div className="flex gap-2">
        {['', 'programmée', 'en_cours', 'réalisée', 'reportée', 'annulée'].map(s => (
          <button
            key={s || 'all'}
            onClick={() => handleFilterChange(s)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${statutFilter === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            {s === '' ? 'Toutes' : s}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <select
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700"
          value={entrepriseFilter}
          onChange={e => handleEntrepriseFilterChange(e.target.value)}
        >
          <option value="">Toutes les entreprises</option>
          {entreprises.map(e => <option key={e.id} value={e.id}>{e.raison_sociale}</option>)}
        </select>
        {entrepriseFilter && (
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-slate-800">{meta.total}</span> visite{meta.total !== 1 ? 's' : ''} pour cette entreprise
          </span>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Programmer une visite</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Entreprise</label>
                <select required className="w-full border p-2 rounded"
                  value={formData.entreprise_id} onChange={e => setFormData({...formData, entreprise_id: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  {entreprises.map(e => <option key={e.id} value={e.id}>{e.raison_sociale}</option>)}
                </select>
              </div>
              {canAssignInspecteur ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Inspecteur</label>
                  <select required className="w-full border p-2 rounded"
                    value={formData.inspecteur_id} onChange={e => setFormData({...formData, inspecteur_id: e.target.value})}>
                    <option value="">Sélectionner...</option>
                    {inspecteurs.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                  Cette visite vous sera automatiquement assignée ({user?.name}).
                </p>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Type de visite / نوع الزيارة</label>
                <select required className="w-full border p-2 rounded"
                  value={formData.type_visite} onChange={e => setFormData({...formData, type_visite: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  {Object.entries(typeVisiteOptions)
                    .sort((a, b) => a[1].fr.localeCompare(b[1].fr))
                    .map(([code, labels]) => (
                      <option key={code} value={code}>{labels.fr} / {labels.ar}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lieu (gouvernorat)</label>
                <select className="w-full border p-2 rounded"
                  value={formData.lieu} onChange={e => setFormData({...formData, lieu: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  {lieuxOptions.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date Prévue</label>
                <input required type="datetime-local" className="w-full border p-2 rounded"
                  value={formData.date_prevue} onChange={e => setFormData({...formData, date_prevue: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => { setShowForm(false); setFormData(emptyForm) }} className="px-4 py-2 text-slate-600">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {postponeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-1">Reporter la visite</h3>
            <p className="text-sm text-slate-500 mb-4">Choisissez la nouvelle date et heure prévue.</p>
            <form onSubmit={confirmPostpone} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nouvelle date prévue</label>
                <input
                  required
                  type="datetime-local"
                  className="w-full border p-2 rounded"
                  value={postponeTarget.date}
                  onChange={e => setPostponeTarget({ ...postponeTarget, date: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setPostponeTarget(null)} className="px-4 py-2 text-slate-600">
                  Annuler
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  Confirmer le report
                </button>
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
              <th className="px-6 py-4 font-medium">Inspecteur</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Lieu</th>
              <th className="px-6 py-4 font-medium">Date Prévue</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {visites.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Aucune visite trouvée</td></tr>
            )}
            {visites.map(v => (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{v.entreprise?.raison_sociale}</td>
                <td className="px-6 py-4">{v.inspecteur?.name}</td>
                <td className="px-6 py-4">
                  {typeVisiteOptions[v.type_visite]
                    ? `${typeVisiteOptions[v.type_visite].fr} / ${typeVisiteOptions[v.type_visite].ar}`
                    : v.type_visite}
                </td>
                <td className="px-6 py-4">{v.lieu || '—'}</td>
                <td className="px-6 py-4">{new Date(v.date_prevue).toLocaleDateString('fr-FR')}</td>
                <td className="px-6 py-4">
                  <select
                    value={v.statut}
                    onChange={e => handleStatutChange(v.id, e.target.value)}
                    className={`px-2 py-1 rounded-full text-xs font-medium border-0 capitalize cursor-pointer ${STATUT_BADGE[v.statut] || 'bg-slate-100 text-slate-600'}`}
                  >
                    <option value="programmée">programmée</option>
                    <option value="en_cours">en cours</option>
                    <option value="réalisée">réalisée</option>
                    <option value="reportée">reportée</option>
                    <option value="annulée">annulée</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {can('supprimer-inspections') && (
                      <button onClick={() => handleDelete(v.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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