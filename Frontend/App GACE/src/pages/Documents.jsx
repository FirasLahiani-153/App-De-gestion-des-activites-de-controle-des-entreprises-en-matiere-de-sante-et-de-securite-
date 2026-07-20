import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Trash2, Download, History, UploadCloud } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const emptyForm = {
  nom: '',
  entreprise_id: '',
  fichier: null,
}

export default function Documents() {
  const { user, can, hasRole } = useAuth()

  const [documents, setDocuments] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const [entreprises, setEntreprises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)

  const [historyDoc, setHistoryDoc] = useState(null) // full document + versions, or null when closed
  const [versionUploadTarget, setVersionUploadTarget] = useState(null) // document id awaiting a new-version file

  useEffect(() => {
    fetchData(1)
  }, [])

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const [dRes, eRes] = await Promise.all([
        api.get('/documents', { params: { page } }),
        api.get('/entreprises', { params: { per_page: 100 } }),
      ])
      setDocuments(dRes.data.data)
      setMeta({ current_page: dRes.data.current_page, last_page: dRes.data.last_page })
      setEntreprises(eRes.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const canDeleteDoc = (doc) => hasRole('admin') || doc.uploaded_by === user?.id

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.fichier) {
      alert('Veuillez sélectionner un fichier.')
      return
    }
    const payload = new FormData()
    payload.append('nom', formData.nom)
    payload.append('entreprise_id', formData.entreprise_id)
    payload.append('fichier', formData.fichier)

    setUploading(true)
    try {
      await api.post('/documents', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
      setShowForm(false)
      setFormData(emptyForm)
      fetchData(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'envoi du document")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer ce document ?')) return
    try {
      await api.delete(`/documents/${id}`)
      fetchData(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const handleDownload = async (doc) => {
    try {
      const response = await api.get(`/documents/${doc.id}/telecharger`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', doc.nom)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Erreur lors du téléchargement')
    }
  }

  const openHistory = async (id) => {
    setHistoryDoc({})
    try {
      const { data } = await api.get(`/documents/${id}`)
      setHistoryDoc(data)
    } catch (err) {
      alert('Erreur lors du chargement de l\'historique')
      setHistoryDoc(null)
    }
  }

  const handleUploadNewVersion = async (e) => {
    e.preventDefault()
    const file = e.target.elements.newVersionFile.files[0]
    if (!file) return

    const payload = new FormData()
    payload.append('fichier', file)

    try {
      await api.post(`/documents/${versionUploadTarget}/nouvelle-version`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setVersionUploadTarget(null)
      fetchData(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'envoi de la nouvelle version")
    }
  }

  if (loading && documents.length === 0) return <div>Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Gestion Documentaire</h2>
        {can('creer-documents') && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Ajouter un document
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Ajouter un document</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du document</label>
                <input required type="text" className="w-full border p-2 rounded"
                  value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entreprise</label>
                <select required className="w-full border p-2 rounded"
                  value={formData.entreprise_id} onChange={e => setFormData({ ...formData, entreprise_id: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {entreprises.map(e => <option key={e.id} value={e.id}>{e.raison_sociale}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fichier (PDF, Word, image — max 10 Mo)</label>
                <input required type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="w-full border p-2 rounded"
                  onChange={e => setFormData({ ...formData, fichier: e.target.files[0] })} />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => { setShowForm(false); setFormData(emptyForm) }} className="px-4 py-2 text-slate-600">Annuler</button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                  {uploading ? 'Envoi...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {versionUploadTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Nouvelle version</h3>
            <form onSubmit={handleUploadNewVersion} className="space-y-4">
              <input required type="file" name="newVersionFile" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="w-full border p-2 rounded" />
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setVersionUploadTarget(null)} className="px-4 py-2 text-slate-600">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Envoyer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Historique des versions</h3>
              <button onClick={() => setHistoryDoc(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            {!historyDoc.id ? (
              <div className="py-8 text-center text-slate-400">Chargement...</div>
            ) : (
              <div className="space-y-2">
                {(historyDoc.versions || []).map(v => (
                  <div key={v.id} className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">Version {v.version}</span>
                      {v.is_latest && <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Actuelle</span>}
                      <div className="text-slate-500 text-xs">
                        {v.uploader?.name} — {new Date(v.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <button onClick={() => handleDownload(v)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
            <tr>
              <th className="px-6 py-4 font-medium">Nom</th>
              <th className="px-6 py-4 font-medium">Entreprise</th>
              <th className="px-6 py-4 font-medium">Version</th>
              <th className="px-6 py-4 font-medium">Ajouté par</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {documents.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Aucun document trouvé</td></tr>
            )}
            {documents.map(doc => (
              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{doc.nom}</td>
                <td className="px-6 py-4">{doc.entreprise?.raison_sociale}</td>
                <td className="px-6 py-4">v{doc.version}</td>
                <td className="px-6 py-4">{doc.uploader?.name}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleDownload(doc)} title="Télécharger" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => openHistory(doc.id)} title="Historique des versions" className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                      <History className="w-4 h-4" />
                    </button>
                    {can('creer-documents') && (
                      <button onClick={() => setVersionUploadTarget(doc.id)} title="Nouvelle version" className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg">
                        <UploadCloud className="w-4 h-4" />
                      </button>
                    )}
                    {can('supprimer-documents') && canDeleteDoc(doc) && (
                      <button onClick={() => handleDelete(doc.id)} title="Supprimer" className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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