import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './DisclaimerManager.css'

export default function DisclaimerManager() {
  const [disclaimers, setDisclaimers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDisclaimer, setEditingDisclaimer] = useState(null)
  const [formData, setFormData] = useState({
    text: '',
    is_active: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadDisclaimers()
  }, [])

  const loadDisclaimers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('disclaimers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setDisclaimers(data || [])
    } catch (err) {
      console.error('Error loading disclaimers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingDisclaimer) {
        // Update existing
        const { error } = await supabase
          .from('disclaimers')
          .update({
            text: formData.text,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDisclaimer.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('disclaimers')
          .insert([{
            text: formData.text,
            is_active: formData.is_active
          }])

        if (error) throw error
      }

      setShowModal(false)
      setEditingDisclaimer(null)
      setFormData({ text: '', is_active: true })
      loadDisclaimers()
    } catch (err) {
      console.error('Error saving disclaimer:', err)
      alert('Failed to save disclaimer: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (disclaimer) => {
    setEditingDisclaimer(disclaimer)
    setFormData({
      text: disclaimer.text,
      is_active: disclaimer.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this disclaimer?')) return

    try {
      const { error } = await supabase
        .from('disclaimers')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadDisclaimers()
    } catch (err) {
      console.error('Error deleting disclaimer:', err)
      alert('Failed to delete disclaimer: ' + err.message)
    }
  }

  const handleToggleActive = async (disclaimer) => {
    try {
      const { error } = await supabase
        .from('disclaimers')
        .update({ is_active: !disclaimer.is_active })
        .eq('id', disclaimer.id)

      if (error) throw error
      loadDisclaimers()
    } catch (err) {
      console.error('Error toggling disclaimer:', err)
      alert('Failed to update disclaimer: ' + err.message)
    }
  }

  const openCreateModal = () => {
    setEditingDisclaimer(null)
    setFormData({ text: '', is_active: true })
    setShowModal(true)
  }

  return (
    <div className="disclaimer-manager">
      <div className="disclaimer-header">
        <div>
          <h2>📢 Disclaimer Manager</h2>
          <p>Manage scrolling announcements on the login screen</p>
        </div>
        <button className="create-disclaimer-btn" onClick={openCreateModal}>
          ➕ Create Disclaimer
        </button>
      </div>

      <div className="disclaimers-list">
        {loading ? (
          <div className="loading-state">Loading disclaimers...</div>
        ) : disclaimers.length === 0 ? (
          <div className="empty-state">
            <p>📢 No disclaimers yet</p>
            <p className="empty-subtitle">Create a disclaimer to display on the login screen</p>
          </div>
        ) : (
          disclaimers.map((disclaimer) => (
            <div key={disclaimer.id} className={`disclaimer-item ${disclaimer.is_active ? 'active' : 'inactive'}`}>
              <div className="disclaimer-content">
                <div className="disclaimer-text">{disclaimer.text}</div>
                <div className="disclaimer-meta">
                  <span className={`status-badge ${disclaimer.is_active ? 'active' : 'inactive'}`}>
                    {disclaimer.is_active ? '✅ Active' : '⏸️ Inactive'}
                  </span>
                  <span className="disclaimer-date">
                    Created: {new Date(disclaimer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="disclaimer-actions">
                <button
                  className="action-btn toggle-btn"
                  onClick={() => handleToggleActive(disclaimer)}
                  title={disclaimer.is_active ? 'Deactivate' : 'Activate'}
                >
                  {disclaimer.is_active ? '⏸️' : '▶️'}
                </button>
                <button
                  className="action-btn edit-btn"
                  onClick={() => handleEdit(disclaimer)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => handleDelete(disclaimer.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDisclaimer ? '✏️ Edit Disclaimer' : '➕ Create Disclaimer'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Disclaimer Text</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Enter disclaimer text that will scroll on the login screen..."
                  rows="4"
                  required
                />
                <small className="input-hint">This text will scroll from right to left on the login screen</small>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Active (display on login screen)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving || !formData.text.trim()}
                >
                  {saving ? 'Saving...' : editingDisclaimer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
