import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Trash2, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Documents() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState([])
  const [entreprises, setEntreprises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ 
    nom: '', 
    entreprise_id: '',
    chemin_fichier: 'storage/dummy.pdf', // Mock for now until we build real file upload
    type_mime: 'application/pdf',
    taille: 1024,
    uploaded_by: user?.id || 1
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [dRes, eRes] = await Promise.all([
        api.get('/documents'),
        api.get('/entreprises')
      ])
      setDocuments(dRes.data)
      setEntreprises(eRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/documents', { ...formData, uploaded_by: user?.id })
      setShowForm(false)
      fetchData()
    } catch (err) {
      alert('Erreur lors de la création')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer ce document ?')) return
    try {
      await api.delete(`/documents/${id}`)
      fetchData()
    } catch (err) {
      alert('Erreur')
    }
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Archivage Documentaire</h2>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Uploader un document
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Uploader un document</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du document</label>
                <input required type="text" className="w-full border p-2 rounded" 
                  value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entreprise concernée</label>
                <select required className="w-full border p-2 rounded" 
                  value={formData.entreprise_id} onChange={e => setFormData({...formData, entreprise_id: e.target.value})}>
                  <option value="">Sélectionner...</option>
                  {entreprises.map(e => <option key={e.id} value={e.id}>{e.raison_sociale}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fichier (Mock Upload)</label>
                <input type="file" className="w-full border p-2 rounded text-sm" />
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
              <th className="px-6 py-4 font-medium">Nom</th>
              <th className="px-6 py-4 font-medium">Entreprise</th>
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Date d'upload</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {documents.map(doc => (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                    <Download className="w-4 h-4" />
                  </div>
                  {doc.nom}
                </td>
                <td className="px-6 py-4">{doc.entreprise?.raison_sociale}</td>
                <td className="px-6 py-4">{doc.type_mime}</td>
                <td className="px-6 py-4">{new Date(doc.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
