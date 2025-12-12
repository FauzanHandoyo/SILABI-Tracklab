import React, { useState } from 'react'
import { assetAPI } from '../utils/api'

type Props = {
  onCreated: (created: any) => void
  onCancel: () => void
}

export default function AddAssetForm({ onCreated, onCancel }: Props) {
  const [form, setForm] = useState({
    nama_aset: '',
    category: '',
    status_aset: 'Tersedia'
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    'Laptop',
    'Desktop',
    'Monitor',
    'Keyboard',
    'Mouse',
    'Printer',
    'Scanner',
    'Router',
    'Switch',
    'Cable',
    'Other'
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama_aset.trim()) {
      setError('Nama aset required')
      return
    }
    if (!form.category) {
      setError('Category required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await assetAPI.create(form)
      onCreated(res.data)
    } catch (err) {
      console.error('Create asset failed', err)
      setError('Failed to create asset')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-4" style={{ color: '#29ADFF' }}>Add New Asset</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
            Asset Name
          </label>
          <input 
            name="nama_aset" 
            value={form.nama_aset} 
            onChange={handleChange} 
            placeholder="Enter asset name" 
            maxLength={15}
            className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: '#000000',
              border: '1px solid #5F574F',
              color: '#FFF1E8'
            }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
            Category
          </label>
          <select 
            name="category" 
            value={form.category} 
            onChange={handleChange} 
            className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: '#000000',
              border: '1px solid #5F574F',
              color: '#FFF1E8'
            }}
            required
          >
            <option value="">-- Select Category --</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#C2C3C7' }}>
            Status
          </label>
          <select 
            name="status_aset" 
            value={form.status_aset} 
            onChange={handleChange} 
            className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: '#000000',
              border: '1px solid #5F574F',
              color: '#FFF1E8'
            }}
          >
            <option value="Tersedia">Tersedia</option>
            <option value="Dipinjam">Dipinjam</option>
            <option value="Dalam Perbaikan">Dalam Perbaikan</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-3 p-3 rounded" style={{ 
          backgroundColor: '#7E2553',
          border: '1px solid #FF004D',
          color: '#FF77A8'
        }}>
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button 
          disabled={submitting} 
          type="submit" 
          className="px-4 py-2 rounded-lg font-semibold disabled:opacity-50 transition"
          style={{ 
            backgroundColor: '#29ADFF',
            color: '#000000'
          }}
          onMouseEnter={(e) => !submitting && (e.currentTarget.style.backgroundColor = '#00E436')}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#29ADFF'}
        >
          {submitting ? 'Adding...' : 'Add Asset'}
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-4 py-2 rounded-lg font-semibold transition"
          style={{ 
            backgroundColor: '#7E2553',
            color: '#C2C3C7'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#AB5236'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7E2553'}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}