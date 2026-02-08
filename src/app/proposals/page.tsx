'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  X,
  User,
  Mail,
  Phone,
  Building,
  FileText,
  Calendar,
  DollarSign,
} from 'lucide-react';
import LoadingBar from '@/components/LoadingBar';

interface Proposal {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerCompany: string | null;
  title: string;
  requirements: string;
  notes: string | null;
  estimatedPrice: number | null;
  currency: string;
  status: string;
  sentAt: string | null;
  respondedAt: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusOptions = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { value: 'sent', label: 'Sent', color: 'bg-blue-500' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-500' },
];

const currencyOptions = ['ILS', 'USD', 'EUR'];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    title: '',
    requirements: '',
    notes: '',
    estimatedPrice: '',
    currency: 'ILS',
    status: 'draft',
    deadline: '',
  });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/proposals');
      const data = await res.json();
      setProposals(data);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingProposal
      ? `/api/proposals/${editingProposal.id}`
      : '/api/proposals';
    const method = editingProposal ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchProposals();
        closeModal();
      }
    } catch (error) {
      console.error('Error saving proposal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this proposal?')) return;

    try {
      const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProposals();
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
    }
  };

  const openModal = (proposal?: Proposal) => {
    if (proposal) {
      setEditingProposal(proposal);
      setFormData({
        customerName: proposal.customerName,
        customerEmail: proposal.customerEmail || '',
        customerPhone: proposal.customerPhone || '',
        customerCompany: proposal.customerCompany || '',
        title: proposal.title,
        requirements: proposal.requirements,
        notes: proposal.notes || '',
        estimatedPrice: proposal.estimatedPrice?.toString() || '',
        currency: proposal.currency,
        status: proposal.status,
        deadline: proposal.deadline ? proposal.deadline.split('T')[0] : '',
      });
    } else {
      setEditingProposal(null);
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerCompany: '',
        title: '',
        requirements: '',
        notes: '',
        estimatedPrice: '',
        currency: 'ILS',
        status: 'draft',
        deadline: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProposal(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find((s) => s.value === status);
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium text-white ${statusConfig?.color || 'bg-gray-500'}`}
      >
        {statusConfig?.label || status}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return '-';
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency,
    }).format(price);
  };

  // Summary stats
  const totalProposals = proposals.length;
  const acceptedProposals = proposals.filter((p) => p.status === 'accepted').length;
  const pendingProposals = proposals.filter((p) => ['draft', 'sent'].includes(p.status)).length;
  const totalValue = proposals
    .filter((p) => p.status === 'accepted' && p.estimatedPrice)
    .reduce((sum, p) => sum + (p.estimatedPrice || 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Proposals</h1>
            <p className="text-zinc-400 mt-1">Track customer requirements and proposals</p>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            New Proposal
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <p className="text-zinc-400 text-sm">Total Proposals</p>
          <p className="text-2xl font-bold">{totalProposals}</p>
        </div>
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <p className="text-zinc-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">{pendingProposals}</p>
        </div>
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <p className="text-zinc-400 text-sm">Accepted</p>
          <p className="text-2xl font-bold text-green-500">{acceptedProposals}</p>
        </div>
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <p className="text-zinc-400 text-sm">Accepted Value</p>
          <p className="text-2xl font-bold text-blue-500">
            {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(totalValue)}
          </p>
        </div>
      </div>

      {/* Proposals Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingBar />
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
          <FileText size={48} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">No proposals yet</p>
          <button
            onClick={() => openModal()}
            className="mt-4 text-blue-500 hover:text-blue-400"
          >
            Create your first proposal
          </button>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Customer</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Title</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Price</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Deadline</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">Created</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {proposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{proposal.customerName}</p>
                        {proposal.customerCompany && (
                          <p className="text-sm text-zinc-400">{proposal.customerCompany}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-xs truncate">{proposal.title}</p>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(proposal.status)}</td>
                    <td className="px-4 py-3">
                      {formatPrice(proposal.estimatedPrice, proposal.currency)}
                    </td>
                    <td className="px-4 py-3">{formatDate(proposal.deadline)}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {formatDate(proposal.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(proposal)}
                          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(proposal.id)}
                          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-xl font-bold">
                {editingProposal ? 'Edit Proposal' : 'New Proposal'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Customer Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <User size={16} />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                      className="w-full bg-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.customerCompany}
                      onChange={(e) =>
                        setFormData({ ...formData, customerCompany: e.target.value })
                      }
                      className="w-full bg-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      <Mail size={14} className="inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target.value })
                      }
                      className="w-full bg-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      <Phone size={14} className="inline mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, customerPhone: e.target.value })
                      }
                      className="w-full bg-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Proposal Details */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FileText size={16} />
                  Proposal Details
                </h3>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Website Redesign, Mobile App Development"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Requirements *</label>
                  <textarea
                    required
                    rows={6}
                    value={formData.requirements}
                    onChange={(e) =>
                      setFormData({ ...formData, requirements: e.target.value })
                    }
                    className="w-full bg-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Describe the customer's requirements in detail..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {/* Pricing & Status */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <DollarSign size={16} />
                  Pricing & Status
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Estimated Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.estimatedPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, estimatedPrice: e.target.value })
                      }
                      className="w-full bg-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) =>
                        setFormData({ ...formData, currency: e.target.value })
                      }
                      className="w-full bg-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full bg-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {statusOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">
                    <Calendar size={14} className="inline mr-1" />
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, deadline: e.target.value })
                    }
                    className="w-full bg-zinc-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  {editingProposal ? 'Save Changes' : 'Create Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
