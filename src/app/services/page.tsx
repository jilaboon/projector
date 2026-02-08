'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCw,
  X,
  DollarSign,
  ArrowLeft,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingBar from '@/components/LoadingBar';

interface Service {
  id: string;
  name: string;
  category: string | null;
  price: number;
  currency: string;
  billingCycle: string;
  autoRenew: boolean;
  remindBeforeRenew: boolean;
  startDate: string | null;
  nextBillingDate: string | null;
  status: string;
  url: string | null;
  accountEmail: string | null;
  notes: string | null;
}

const CATEGORIES = [
  'Hosting',
  'Database',
  'AI',
  'Domain',
  'Email',
  'Analytics',
  'Storage',
  'CDN',
  'Monitoring',
  'Other',
];

const CURRENCIES = ['USD', 'EUR', 'ILS', 'GBP'];
const BILLING_CYCLES = ['monthly', 'yearly', 'one-time'];
const STATUSES = ['active', 'cancelled', 'paused', 'trial'];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    currency: 'USD',
    billingCycle: 'monthly',
    autoRenew: true,
    remindBeforeRenew: false,
    startDate: '',
    nextBillingDate: '',
    status: 'active',
    url: '',
    accountEmail: '',
    notes: '',
  });

  useEffect(() => {
    const minDelay = new Promise(r => setTimeout(r, 600));
    Promise.all([fetchServices(), minDelay]).finally(() => setLoading(false));
  }, []);

  async function fetchServices() {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }

  function calculateMonthlyAmount(service: Service): number {
    if (service.billingCycle === 'monthly') return service.price;
    if (service.billingCycle === 'yearly') return service.price / 12;
    return 0; // one-time
  }

  function getTotalMonthlySpend(): number {
    return services
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + calculateMonthlyAmount(s), 0);
  }

  function getTotalYearlySpend(): number {
    return services
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => {
        if (s.billingCycle === 'monthly') return sum + s.price * 12;
        if (s.billingCycle === 'yearly') return sum + s.price;
        return sum + s.price; // one-time counted once
      }, 0);
  }

  function openAddModal() {
    setEditingService(null);
    setFormData({
      name: '',
      category: '',
      price: '',
      currency: 'USD',
      billingCycle: 'monthly',
      autoRenew: true,
      remindBeforeRenew: false,
      startDate: '',
      nextBillingDate: '',
      status: 'active',
      url: '',
      accountEmail: '',
      notes: '',
    });
    setShowModal(true);
  }

  function openEditModal(service: Service) {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category || '',
      price: service.price.toString(),
      currency: service.currency,
      billingCycle: service.billingCycle,
      autoRenew: service.autoRenew,
      remindBeforeRenew: service.remindBeforeRenew,
      startDate: service.startDate ? service.startDate.split('T')[0] : '',
      nextBillingDate: service.nextBillingDate ? service.nextBillingDate.split('T')[0] : '',
      status: service.status,
      url: service.url || '',
      accountEmail: service.accountEmail || '',
      notes: service.notes || '',
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingService) {
        await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await fetch(`/api/services/${id}`, { method: 'DELETE' });
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  }

  function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const activeServices = services.filter((s) => s.status === 'active');
  const otherServices = services.filter((s) => s.status !== 'active');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingBar />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Services & Subscriptions</h1>
          <p className="text-zinc-400 mt-1">Track your paid services and monthly spending</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Add Service
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="text-green-400" size={20} />
            </div>
            <span className="text-zinc-400">Monthly Spend</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(getTotalMonthlySpend(), 'USD')}
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <DollarSign className="text-blue-400" size={20} />
            </div>
            <span className="text-zinc-400">Yearly Spend</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(getTotalYearlySpend(), 'USD')}
          </p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <RefreshCw className="text-purple-400" size={20} />
            </div>
            <span className="text-zinc-400">Active Services</span>
          </div>
          <p className="text-3xl font-bold text-white">{activeServices.length}</p>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Service</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Category</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-400">Price</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Cycle</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-400">Monthly</th>
                <th className="text-center px-6 py-4 text-sm font-medium text-zinc-400">Auto-Renew</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Next Billing</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-zinc-400">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeServices.map((service) => (
                <tr
                  key={service.id}
                  className={cn(
                    "border-b border-zinc-800 hover:bg-zinc-800/50",
                    service.autoRenew && service.remindBeforeRenew && "bg-red-500/10 border-l-4 border-l-red-500"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {service.autoRenew && service.remindBeforeRenew && (
                        <Bell size={16} className="text-red-400" />
                      )}
                      <span className={cn(
                        "font-medium",
                        service.autoRenew && service.remindBeforeRenew ? "text-red-400" : "text-white"
                      )}>{service.name}</span>
                      {service.url && (
                        <a
                          href={service.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-500 hover:text-blue-400"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    {service.accountEmail && (
                      <p className="text-xs text-zinc-500 mt-0.5">{service.accountEmail}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-400">{service.category || '-'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-white">{formatCurrency(service.price, service.currency)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-400 capitalize">{service.billingCycle}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-green-400 font-medium">
                      {formatCurrency(calculateMonthlyAmount(service), service.currency)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {service.autoRenew ? (
                      <span className="text-green-400">Yes</span>
                    ) : (
                      <span className="text-zinc-500">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-400">{formatDate(service.nextBillingDate)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        service.status === 'active' && 'bg-green-500/20 text-green-400',
                        service.status === 'trial' && 'bg-blue-500/20 text-blue-400',
                        service.status === 'paused' && 'bg-yellow-500/20 text-yellow-400',
                        service.status === 'cancelled' && 'bg-red-500/20 text-red-400'
                      )}
                    >
                      {service.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(service)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {otherServices.length > 0 && (
                <>
                  <tr>
                    <td colSpan={9} className="px-6 py-3 bg-zinc-800/50">
                      <span className="text-sm text-zinc-500">Inactive / Cancelled</span>
                    </td>
                  </tr>
                  {otherServices.map((service) => (
                    <tr key={service.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 opacity-60">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{service.name}</span>
                          {service.url && (
                            <a
                              href={service.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-500 hover:text-blue-400"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-zinc-400">{service.category || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white">{formatCurrency(service.price, service.currency)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-zinc-400 capitalize">{service.billingCycle}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-zinc-500">-</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-zinc-500">{service.autoRenew ? 'Yes' : 'No'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-zinc-500">{formatDate(service.nextBillingDate)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'px-2 py-1 text-xs rounded-full',
                            service.status === 'paused' && 'bg-yellow-500/20 text-yellow-400',
                            service.status === 'cancelled' && 'bg-red-500/20 text-red-400'
                          )}
                        >
                          {service.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(service)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(service.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
        {services.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            <p>No services added yet.</p>
            <button
              onClick={openAddModal}
              className="mt-4 text-blue-400 hover:text-blue-300"
            >
              Add your first service
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">
                {editingService ? 'Edit Service' : 'Add Service'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-zinc-400 mb-1">Service Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {CURRENCIES.map((cur) => (
                      <option key={cur} value={cur}>{cur}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Billing Cycle</label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {BILLING_CYCLES.map((cycle) => (
                      <option key={cycle} value={cycle}>{cycle}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.autoRenew}
                      onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-zinc-300">Auto-Renew</span>
                  </label>
                  {formData.autoRenew && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.remindBeforeRenew}
                        onChange={(e) => setFormData({ ...formData, remindBeforeRenew: e.target.checked })}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-sm text-red-400">Remind before renew</span>
                    </label>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Next Billing Date</label>
                  <input
                    type="date"
                    value={formData.nextBillingDate}
                    onChange={(e) => setFormData({ ...formData, nextBillingDate: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-zinc-400 mb-1">Service URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-zinc-400 mb-1">Account Email</label>
                  <input
                    type="email"
                    value={formData.accountEmail}
                    onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-zinc-400 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-20 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {editingService ? 'Save Changes' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
