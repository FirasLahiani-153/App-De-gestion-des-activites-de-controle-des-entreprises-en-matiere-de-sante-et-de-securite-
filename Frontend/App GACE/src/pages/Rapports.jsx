import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Trash2 } from 'lucide-react'

export default function Rapports() {
  const [rapports, setRapports] = useState([])
  const [visites, setVisites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ 
    visite_id: '', 
    reference: '', 
    date_redaction: new Date().toISOString().slice(0,16),
    statut: 'brouillon',
    resume: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [rRes, vRes] = await Promise.all([
        api.get('/rapports'),
        api.get('/visites')
      ])
      setRapports(rRes.data)
      setVisites(vRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/rapports', formData)
      setShowForm(false)
      fetchData()
    } catch (err) {
      alert('Erreur lors de la création')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer ce rapport ?')) return
    try {
      await api.delete(`/rapports/${id}`)
      fetchData()
    } catch (err) {
      alert('Erreur')
    }
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Gestion des Rapports</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Créer un rapport
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Créer un rapport</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Visite associée</label>
                <select required className="w-full border p-2 rounded" 
                  value={formData.visite_id} onChange={e => setFormData({...formData, visite_id: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  {visites.map(v => <option key={v.id} value={v.id}>Visite #{v.id} - {v.entreprise?.raison_sociale}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Référence unique</label>
                <input required type="text" className="w-full border p-2 rounded" placeholder="Ex: RAP-2026-001"
                  value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Résumé / Conclusion</label>
                <textarea className="w-full border p-2 rounded" rows="3"
                  value={formData.resume} onChange={e => setFormData({...formData, resume: e.target.value})} />
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
              <th className="px-6 py-4 font-medium">Référence</th>
              <th className="px-6 py-4 font-medium">Entreprise</th>
              <th className="px-6 py-4 font-medium">Date Rédaction</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rapports.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{r.reference}</td>
                <td className="px-6 py-4">{r.visite?.entreprise?.raison_sociale}</td>
                <td className="px-6 py-4">{new Date(r.date_redaction).toLocaleDateString('fr-FR')}</td>
                <td className="px-6 py-4 capitalize">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {r.statut}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleDelete(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
