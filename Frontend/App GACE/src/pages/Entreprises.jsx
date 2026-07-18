import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Trash2, Search } from 'lucide-react'

const RISK_LEVELS = [
  { value: 'faible', label: 'Faible' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'eleve', label: 'Élevé' },
]

const RISK_BADGE = {
  faible: 'bg-green-100 text-green-700',
  moyen: 'bg-amber-100 text-amber-700',
  eleve: 'bg-red-100 text-red-700',
}

const emptyForm = {
  raison_sociale: '',
  matricule_fiscale: '',
  secteur_activite: '',
  effectif: '',
  ville: '',
  telephone: '',
  email_contact: '',
  nom_contact: '',
  niveau_risque: 'faible',
}

export default function Entreprises() {
  const [entreprises, setEntreprises] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    fetchEntreprises(1)
  }, [])

  const fetchEntreprises = async (page = 1, searchTerm = search) => {
    setLoading(true)
    try {
      const { data } = await api.get('/entreprises', {
        params: { page, search: searchTerm || undefined },
      })
      setEntreprises(data.data)
      setMeta({ current_page: data.current_page, last_page: data.last_page })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchEntreprises(1, search)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/entreprises', formData)
      setShowForm(false)
      setFormData(emptyForm)
      fetchEntreprises(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer cette entreprise ?')) return
    try {
      await api.delete(`/entreprises/${id}`)
      fetchEntreprises(meta.current_page)
    } catch (err) {
      alert('Erreur')
    }
  }

  if (loading && entreprises.length === 0) return <div>Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Gestion des Entreprises</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Nouvelle Entreprise
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher (raison sociale, matricule, ville)..."
            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="px-4 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200">
          Rechercher
        </button>
      </form>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Ajouter une entreprise</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Raison Sociale</label>
                <input required type="text" className="w-full border p-2 rounded"
                  value={formData.raison_sociale} onChange={e => setFormData({...formData, raison_sociale: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Matricule Fiscale</label>
                <input required type="text" className="w-full border p-2 rounded"
                  value={formData.matricule_fiscale} onChange={e => setFormData({...formData, matricule_fiscale: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Secteur d'activité</label>
                  <input required type="text" className="w-full border p-2 rounded"
                    value={formData.secteur_activite} onChange={e => setFormData({...formData, secteur_activite: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Effectif</label>
                  <input type="number" min="0" className="w-full border p-2 rounded"
                    value={formData.effectif} onChange={e => setFormData({...formData, effectif: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Niveau de risque</label>
                <select className="w-full border p-2 rounded"
                  value={formData.niveau_risque} onChange={e => setFormData({...formData, niveau_risque: e.target.value})}>
                  {RISK_LEVELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ville</label>
                  <input type="text" className="w-full border p-2 rounded"
                    value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input type="text" className="w-full border p-2 rounded"
                    value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nom du contact</label>
                <input type="text" className="w-full border p-2 rounded"
                  value={formData.nom_contact} onChange={e => setFormData({...formData, nom_contact: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email du contact</label>
                <input type="email" className="w-full border p-2 rounded"
                  value={formData.email_contact} onChange={e => setFormData({...formData, email_contact: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => { setShowForm(false); setFormData(emptyForm) }} className="px-4 py-2 text-slate-600">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Raison Sociale</th>
              <th className="px-6 py-4 font-medium">Matricule</th>
              <th className="px-6 py-4 font-medium">Secteur</th>
              <th className="px-6 py-4 font-medium">Effectif</th>
              <th className="px-6 py-4 font-medium">Risque</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {entreprises.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Aucune entreprise trouvée</td></tr>
            )}
            {entreprises.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{e.raison_sociale}</td>
                <td className="px-6 py-4">{e.matricule_fiscale}</td>
                <td className="px-6 py-4">{e.secteur_activite}</td>
                <td className="px-6 py-4">{e.effectif ?? '—'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${RISK_BADGE[e.niveau_risque] || 'bg-slate-100 text-slate-600'}`}>
                    {RISK_LEVELS.find(r => r.value === e.niveau_risque)?.label || e.niveau_risque}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleDelete(e.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
              onClick={() => fetchEntreprises(meta.current_page - 1)}
              className="px-3 py-1 rounded border border-slate-200 disabled:opacity-40"
            >
              Précédent
            </button>
            <span>Page {meta.current_page} / {meta.last_page}</span>
            <button
              disabled={meta.current_page >= meta.last_page}
              onClick={() => fetchEntreprises(meta.current_page + 1)}
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