import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Trash2, Send, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const STATUT_BADGE = {
  'brouillon': 'bg-slate-100 text-slate-600',
  'en_attente_validation': 'bg-amber-100 text-amber-700',
  'validé': 'bg-green-100 text-green-700',
  'envoyé': 'bg-blue-100 text-blue-700',
}

const emptyForm = {
  visite_id: '',
  reference: '',
  date_redaction: new Date().toISOString().slice(0, 16),
  resume: '',
  niveau_risque: '',
}

const RISK_LEVELS = [
  { value: '', label: 'Non évalué' },
  { value: 'faible', label: 'Faible' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'eleve', label: 'Élevé' },
]

export default function Rapports() {
  const { can } = useAuth()
  const [rapports, setRapports] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const [visites, setVisites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [viewingRapport, setViewingRapport] = useState(null) // full detail object, or null when closed
  const [viewLoading, setViewLoading] = useState(false)

  const openDetail = async (id) => {
    setViewLoading(true)
    setViewingRapport({}) // opens the modal immediately with a loading state
    try {
      const { data } = await api.get(`/rapports/${id}`)
      setViewingRapport(data)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du chargement du rapport')
      setViewingRapport(null)
    } finally {
      setViewLoading(false)
    }
  }

  useEffect(() => {
    fetchData(1)
  }, [])

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const [rRes, vRes] = await Promise.all([
        api.get('/rapports', { params: { page } }),
        api.get('/visites', { params: { per_page: 100 } }),
      ])
      setRapports(rRes.data.data)
      setMeta({ current_page: rRes.data.current_page, last_page: rRes.data.last_page })
      setVisites(vRes.data.data)
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
      setFormData(emptyForm)
      fetchData(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer ce rapport ?')) return
    try {
      await api.delete(`/rapports/${id}`)
      fetchData(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  // Sends a brouillon into the validation queue.
  const handleSubmitForValidation = async (id) => {
    try {
      await api.put(`/rapports/${id}`, { statut: 'en_attente_validation' })
      fetchData(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  // Validation hiérarchique — only responsable/admin (voir permission côté backend).
  const handleValidate = async (id) => {
    if (!confirm('Valider ce rapport ? Cette action est définitive.')) return
    try {
      await api.post(`/rapports/${id}/valider`)
      fetchData(meta.current_page)
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la validation')
    }
  }

  if (loading && rapports.length === 0) return <div>Chargement...</div>

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
              <div>
                <label className="block text-sm font-medium mb-1">Niveau de risque de l'entreprise</label>
                <select className="w-full border p-2 rounded"
                  value={formData.niveau_risque} onChange={e => setFormData({...formData, niveau_risque: e.target.value})}>
                  {RISK_LEVELS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">Sera appliqué au profil de l'entreprise.</p>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => { setShowForm(false); setFormData(emptyForm) }} className="px-4 py-2 text-slate-600">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingRapport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            {viewLoading || !viewingRapport.id ? (
              <div className="py-8 text-center text-slate-400">Chargement...</div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{viewingRapport.reference}</h3>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUT_BADGE[viewingRapport.statut] || 'bg-slate-100 text-slate-600'}`}>
                      {viewingRapport.statut?.replace('_', ' ')}
                    </span>
                  </div>
                  <button onClick={() => setViewingRapport(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
                    &times;
                  </button>
                </div>

                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-slate-500">Entreprise</dt>
                    <dd className="text-slate-900 font-medium">{viewingRapport.visite?.entreprise?.raison_sociale || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Inspecteur</dt>
                    <dd className="text-slate-900">{viewingRapport.visite?.inspecteur?.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Date de rédaction</dt>
                    <dd className="text-slate-900">{new Date(viewingRapport.date_redaction).toLocaleDateString('fr-FR')}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Résumé / Conclusion</dt>
                    <dd className="text-slate-900 whitespace-pre-wrap">{viewingRapport.resume || 'Aucun résumé fourni.'}</dd>
                  </div>
                  {viewingRapport.infractions?.length > 0 && (
                    <div>
                      <dt className="text-slate-500 mb-1">Infractions relevées</dt>
                      <dd className="space-y-1">
                        {viewingRapport.infractions.map(inf => (
                          <div key={inf.id} className="bg-slate-50 rounded-lg px-3 py-2 text-slate-700">
                            <span className="font-medium capitalize">{inf.gravite}</span> — {inf.description}
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}
                  {viewingRapport.validator && (
                    <div>
                      <dt className="text-slate-500">Validé par</dt>
                      <dd className="text-slate-900">
                        {viewingRapport.validator.name} le {new Date(viewingRapport.validated_at).toLocaleDateString('fr-FR')}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="flex justify-end mt-6">
                  <button onClick={() => setViewingRapport(null)} className="px-4 py-2 text-slate-600">Fermer</button>
                </div>
              </>
            )}
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
              <th className="px-6 py-4 font-medium">Validé par</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rapports.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Aucun rapport trouvé</td></tr>
            )}
            {rapports.map(r => {
              const locked = r.statut === 'validé' || r.statut === 'envoyé'
              return (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    <button
                      onClick={() => openDetail(r.id)}
                      className="text-blue-600 hover:underline"
                      title="Voir le rapport"
                    >
                      {r.reference}
                    </button>
                  </td>
                  <td className="px-6 py-4">{r.visite?.entreprise?.raison_sociale}</td>
                  <td className="px-6 py-4">{new Date(r.date_redaction).toLocaleDateString('fr-FR')}</td>
                  <td className="px-6 py-4 capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUT_BADGE[r.statut] || 'bg-slate-100 text-slate-600'}`}>
                      {r.statut.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">{r.validator?.name || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {r.statut === 'brouillon' && (
                        <button
                          onClick={() => handleSubmitForValidation(r.id)}
                          title="Envoyer pour validation"
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {r.statut === 'en_attente_validation' && can('valider-rapports') && (
                        <button
                          onClick={() => handleValidate(r.id)}
                          title="Valider ce rapport"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {!locked && (
                        <button onClick={() => handleDelete(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
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