import { useState, useEffect } from 'react'
import api from '../api'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const ROLE_LABELS = {
  admin: 'Administrateur',
  inspecteur: 'Contrôleur/Inspecteur',
  responsable: 'Responsable du service',
}

const ROLE_BADGE = {
  admin: 'bg-purple-100 text-purple-700',
  inspecteur: 'bg-blue-100 text-blue-700',
  responsable: 'bg-green-100 text-green-700',
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  matricule: '',
  role: 'inspecteur',
  peut_inspecter: false,
}

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null) // null = creating, object = editing
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users')
      setUsers(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreateForm = () => {
    setEditingUser(null)
    setFormData(emptyForm)
    setShowForm(true)
  }

  const openEditForm = (u) => {
    const roleNames = (u.roles || []).map(r => r.name)
    const primaryRole = roleNames.includes('admin') ? 'admin' : roleNames.includes('responsable') ? 'responsable' : 'inspecteur'
    setEditingUser(u)
    setFormData({
      name: u.name,
      email: u.email,
      password: '', // left blank = unchanged
      phone: u.phone || '',
      matricule: u.matricule || '',
      role: primaryRole,
      peut_inspecter: primaryRole === 'responsable' && roleNames.includes('inspecteur'),
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...formData }
    if (payload.role !== 'responsable') delete payload.peut_inspecter

    try {
      if (editingUser) {
        if (!payload.password) delete payload.password // don't overwrite with blank
        await api.put(`/users/${editingUser.id}`, payload)
      } else {
        await api.post('/users', payload)
      }
      setShowForm(false)
      setEditingUser(null)
      setFormData(emptyForm)
      fetchUsers()
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message
      alert(msg || 'Erreur lors de l\'enregistrement')
    }
  }

  const handleToggleActive = async (u) => {
    try {
      await api.put(`/users/${u.id}`, { is_active: !u.is_active })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous supprimer cet utilisateur ?')) return
    try {
      await api.delete(`/users/${id}`)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Gestion des Utilisateurs</h2>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Nouvel Utilisateur
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input required type="text" className="w-full border p-2 rounded"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input required type="email" className="w-full border p-2 rounded"
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mot de passe {editingUser && <span className="text-slate-400 font-normal">(laisser vide pour ne pas changer)</span>}
                </label>
                <input required={!editingUser} type="password" minLength={8} className="w-full border p-2 rounded"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input type="text" className="w-full border p-2 rounded"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Matricule</label>
                  <input type="text" className="w-full border p-2 rounded"
                    value={formData.matricule} onChange={e => setFormData({...formData, matricule: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rôle</label>
                <select className="w-full border p-2 rounded" value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value, peut_inspecter: false})}>
                  <option value="admin">Administrateur</option>
                  <option value="inspecteur">Contrôleur/Inspecteur</option>
                  <option value="responsable">Responsable du service</option>
                </select>
              </div>
              {formData.role === 'responsable' && (
                <label className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                  <input type="checkbox" checked={formData.peut_inspecter}
                    onChange={e => setFormData({...formData, peut_inspecter: e.target.checked})} />
                  Peut aussi effectuer des inspections (sera aussi assigné comme inspecteur)
                </label>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => { setShowForm(false); setEditingUser(null); setFormData(emptyForm) }} className="px-4 py-2 text-slate-600">Annuler</button>
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
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Rôles</th>
              <th className="px-6 py-4 font-medium">Statut</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{u.name}</td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {(u.roles || []).map(r => (
                      <span key={r.id || r.name} className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[r.name] || 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_LABELS[r.name] || r.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(u)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {u.is_active ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEditForm(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {u.id !== currentUser?.id && (
                      <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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