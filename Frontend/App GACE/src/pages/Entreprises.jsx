import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Trash2 } from 'lucide-react'

export default function Entreprises() {
  const [entreprises, setEntreprises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ raison_sociale: '', matricule_fiscale: '', secteur_activite: '' })

  useEffect(() => {
    fetchEntreprises()
  }, [])

  const fetchEntreprises = async () => {
    try {
      const { data } = await api.get('/entreprises')
      setEntreprises(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/entreprises', formData)
      setShowForm(false)
      fetchEntreprises()
    } catch (err) {
      alert('Erreur lors de la création')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer cette entreprise ?')) return
    try {
      await api.delete(`/entreprises/${id}`)
      fetchEntreprises()
    } catch (err) {
      alert('Erreur')
    }
  }

  if (loading) return <div>Chargement...</div>

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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
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
              <div>
                <label className="block text-sm font-medium mb-1">Secteur d'activité</label>
                <input required type="text" className="w-full border p-2 rounded" 
                  value={formData.secteur_activite} onChange={e => setFormData({...formData, secteur_activite: e.target.value})} />
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
              <th className="px-6 py-4 font-medium">Raison Sociale</th>
              <th className="px-6 py-4 font-medium">Matricule</th>
              <th className="px-6 py-4 font-medium">Secteur</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {entreprises.map(e => (
              <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{e.raison_sociale}</td>
                <td className="px-6 py-4">{e.matricule_fiscale}</td>
                <td className="px-6 py-4">{e.secteur_activite}</td>
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
      </div>
    </div>
  )
}
