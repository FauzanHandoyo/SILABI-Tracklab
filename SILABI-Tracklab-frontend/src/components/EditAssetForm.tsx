import React, { useState } from 'react';
import { assetAPI } from '../utils/api';

type Props = {
  asset: {
    id: number;
    nama_aset?: string;
    category?: string | null;
    location?: string | null;
    status_aset?: string;
    assigned_to?: string | null;
    peminjam?: string | null;
    status_hilang?: boolean;
    latitude?: number | null;
    longitude?: number | null;
  };
  onUpdated: (updated: any) => void;
  onCancel: () => void;
};

export default function EditAssetForm({ asset, onUpdated, onCancel }: Props) {
  const [form, setForm] = useState({
    nama_aset: asset.nama_aset || '',
    category: asset.category || '',
    location: asset.location || '',
    status_aset: asset.status_aset || 'Tersedia',
    assigned_to: asset.assigned_to || '',
    peminjam: asset.peminjam || '',
    status_hilang: !!asset.status_hilang,
    latitude: asset.latitude ?? '',
    longitude: asset.longitude ?? ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        nama_aset: form.nama_aset,
        category: form.category || null,
        location: form.location || null,
        status_aset: form.status_aset,
        assigned_to: form.assigned_to || null,
        peminjam: form.peminjam || null,
        status_hilang: !!form.status_hilang,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude)
      };
      const res = await assetAPI.update(asset.id, payload);
      onUpdated(res.data);
    } catch (err) {
      console.error('Update asset failed', err);
      setError('Failed to update asset');
    } finally {
      setSubmitting(false);
    }
  };

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
        <label className="flex items-center gap-2">
          <input type="checkbox" name="status_hilang" checked={form.status_hilang} onChange={handleCheckbox} />
          <span className="text-sm">Status hilang</span>
        </label>
      </div>

      {error && <div className="text-red-600 mt-2">{error}</div>}

      <div className="mt-3 flex gap-2">
        <button disabled={submitting} type="submit" className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
          {submitting ? 'Updating...' : 'Update'}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded">
          Cancel
        </button>
      </div>
    </form>
  );
}