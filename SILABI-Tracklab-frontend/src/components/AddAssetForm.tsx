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
    location: '',
    status_aset: 'Tersedia',
    assigned_to: '',
    peminjam: '',
    status_hilang: false,
    latitude: '' as string | number | null,
    longitude: '' as string | number | null
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setForm(prev => ({ ...prev, [name]: checked }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama_aset.trim()) {
      setError('Nama aset required')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        ...form,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude)
      }
      const res = await assetAPI.create(payload)
      onCreated(res.data)
    } catch (err) {
      console.error('Create asset failed', err)
      setError('Failed to create asset')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input name="nama_aset" value={form.nama_aset} onChange={handleChange} placeholder="Nama aset" className="px-3 py-2 border rounded" />
        <input name="category" value={form.category} onChange={handleChange} placeholder="Category" className="px-3 py-2 border rounded" />
        <input name="location" value={form.location} onChange={handleChange} placeholder="Location" className="px-3 py-2 border rounded" />
        <select name="status_aset" value={form.status_aset} onChange={handleChange} className="px-3 py-2 border rounded">
          <option value="Tersedia">Tersedia</option>
          <option value="Dipinjam">Dipinjam</option>
          <option value="Dalam Perbaikan">Dalam Perbaikan</option>
        </select>
        <input name="assigned_to" value={form.assigned_to} onChange={handleChange} placeholder="Assigned to" className="px-3 py-2 border rounded" />
        <input name="peminjam" value={form.peminjam} onChange={handleChange} placeholder="Peminjam" className="px-3 py-2 border rounded" />
        <input name="latitude" value={form.latitude as any} onChange={handleChange} placeholder="Latitude" className="px-3 py-2 border rounded" />
        <input name="longitude" value={form.longitude as any} onChange={handleChange} placeholder="Longitude" className="px-3 py-2 border rounded" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="status_hilang" checked={form.status_hilang} onChange={handleCheckbox} />
          <span className="text-sm">Status hilang</span>
        </label>
      </div>

      {error && <div className="text-red-600 mt-2">{error}</div>}

      <div className="mt-3 flex gap-2">
        <button disabled={submitting} type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
          {submitting ? 'Adding...' : 'Add'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">
          Cancel
        </button>
      </div>
    </form>
  )
}