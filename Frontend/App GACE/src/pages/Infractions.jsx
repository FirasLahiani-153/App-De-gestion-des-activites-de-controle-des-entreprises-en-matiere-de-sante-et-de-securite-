import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Trash2 } from 'lucide-react'

export default function Infractions() {
  const [infractions, setInfractions] = useState([])
  const [rapports, setRapports] = useState([])
  const [entreprises, setEntreprises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ 
    rapport_id: '', 
    entreprise_id: '', 
    description: '',
    gravite: 'mineure',
    date_limite_correction: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [iRes, rRes, eRes] = await Promise.all([
        api.get('/infractions'),
        api.get('/rapports', { params: { per_page: 100 } }),
        api.get('/entreprises', { params: { per_page: 100 } })
      ])
      setInfractions(iRes.data)
      setRapports(rRes.data.data)
      setEntreprises(eRes.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/infractions', formData)
      setShowForm(false)
      fetchData()
    } catch (err) {
      alert('Erreur lors de la création')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer cette infraction ?')) return
    try {
      await api.delete(`/infractions/${id}`)
      fetchData()
    } catch (err) {
      alert('Erreur')
    }
  }

  if (loading) return <div>Chargement...</div>

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
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600">Annuler</button>
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
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {infractions.map(inf => (
              <tr key={inf.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{inf.entreprise?.raison_sociale}</td>
                <td className="px-6 py-4 capitalize">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    inf.gravite === 'critique' ? 'bg-red-100 text-red-700' :
                    inf.gravite === 'majeure' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inf.gravite}
                  </span>
                </td>
                <td className="px-6 py-4">{new Date(inf.date_limite_correction).toLocaleDateString('fr-FR')}</td>
                <td className="px-6 py-4 capitalize">{inf.statut_correction.replace('_', ' ')}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleDelete(inf.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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