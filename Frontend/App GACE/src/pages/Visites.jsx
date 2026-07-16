import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Trash2 } from 'lucide-react'

export default function Visites() {
  const [visites, setVisites] = useState([])
  const [entreprises, setEntreprises] = useState([])
  const [inspecteurs, setInspecteurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ 
    entreprise_id: '', 
    inspecteur_id: '', 
    type_visite: 'initiale', 
    statut: 'programmée',
    date_prevue: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [vRes, eRes, iRes] = await Promise.all([
        api.get('/visites'),
        api.get('/entreprises'),
        api.get('/users') // We should ideally filter by role inspecteur
      ])
      setVisites(vRes.data)
      setEntreprises(eRes.data)
      setInspecteurs(iRes.data.filter(u => u.roles?.some(r => r.name === 'inspecteur') || true)) // fallback
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/visites', formData)
      setShowForm(false)
      fetchData()
    } catch (err) {
      alert('Erreur lors de la création')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer cette visite ?')) return
    try {
      await api.delete(`/visites/${id}`)
      fetchData()
    } catch (err) {
      alert('Erreur')
    }
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Gestion des Visites</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Programmer une visite
        </button>
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
              <div>
                <label className="block text-sm font-medium mb-1">Inspecteur</label>
                <select required className="w-full border p-2 rounded" 
                  value={formData.inspecteur_id} onChange={e => setFormData({...formData, inspecteur_id: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  {inspecteurs.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type de visite</label>
                <select className="w-full border p-2 rounded" 
                  value={formData.type_visite} onChange={e => setFormData({...formData, type_visite: e.target.value})}>
                  <option value="initiale">Initiale</option>
                  <option value="suivi">De suivi</option>
                  <option value="inopinée">Inopinée</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date Prévue</label>
                <input required type="datetime-local" className="w-full border p-2 rounded" 
                  value={formData.date_prevue} onChange={e => setFormData({...formData, date_prevue: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600">Annuler</button>
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
              <th className="px-6 py-4 font-medium">Entreprise</th>
              <th className="px-6 py-4 font-medium">Inspecteur</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Date Prévue</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {visites.map(v => (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{v.entreprise?.raison_sociale}</td>
                <td className="px-6 py-4">{v.inspecteur?.name}</td>
                <td className="px-6 py-4 capitalize">{v.type_visite}</td>
                <td className="px-6 py-4">{new Date(v.date_prevue).toLocaleDateString('fr-FR')}</td>
                <td className="px-6 py-4 capitalize">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {v.statut}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleDelete(v.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
