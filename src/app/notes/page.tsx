'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import LoadingBar from '@/components/LoadingBar';
import { fetchWithCache, invalidateCache } from '@/lib/cache';
import { cn, parseJsonArray } from '@/lib/utils';
import { Plus, Search, Pin, PinOff, Pencil, Trash2, BookOpen, Tag, Copy, Check } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string | null;
  category: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const SUGGESTED_CATEGORIES = ['General', 'Commands', 'Config', 'Troubleshooting', 'API', 'Database', 'DevOps'];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    category: '',
    isPinned: false,
  });

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      setNotes(await fetchWithCache<Note[]>('/api/notes'));
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(note?: Note) {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
        tags: parseJsonArray(note.tags).join(', '),
        category: note.category || '',
        isPinned: note.isPinned,
      });
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        tags: '',
        category: '',
        isPinned: false,
      });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingNote(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const tags = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      ...formData,
      tags,
    };

    try {
      if (editingNote) {
        await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      setEditingNote(null);
      invalidateCache('/api/notes');
      loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      invalidateCache('/api/notes');
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  async function handleTogglePin(note: Note) {
    try {
      await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      invalidateCache('/api/notes');
      loadNotes();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  }

  const categories = Array.from(new Set(notes.map((n) => n.category).filter((c): c is string => c !== null)));

  const filteredNotes = notes.filter((note) => {
    if (categoryFilter && note.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        (note.tags || '').toLowerCase().includes(q) ||
        (note.category || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar onNewProject={() => {}} />

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Notes</h1>
              <p className="text-zinc-500 text-sm mt-1">Technical knowledge, commands, and things to remember</p>
            </div>
            <button
              onClick={() => openModal()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
              Add Note
            </button>
          </div>
        </header>

        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingBar />
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative max-w-md mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full bg-zinc-800 border border-zinc-700 text-sm rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category filter chips */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className={cn(
                      'px-3 py-1 rounded-full text-sm transition-colors',
                      categoryFilter === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    )}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                      className={cn(
                        'px-3 py-1 rounded-full text-sm transition-colors',
                        categoryFilter === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Cards grid */}
              {filteredNotes.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900 rounded-lg border border-zinc-800">
                  <BookOpen size={48} className="mx-auto text-zinc-700 mb-4" />
                  <p className="text-zinc-400">
                    {notes.length === 0 ? 'No notes yet' : 'No matching notes'}
                  </p>
                  {notes.length === 0 && (
                    <button
                      onClick={() => openModal()}
                      className="mt-4 text-blue-400 hover:text-blue-300"
                    >
                      Add your first note
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className={cn(
                        'bg-zinc-900 rounded-xl border border-zinc-800 p-5 hover:border-zinc-700 transition-colors group',
                        note.isPinned && 'border-l-4 border-l-yellow-500'
                      )}
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-medium truncate pr-2">{note.title}</h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(note.content);
                              setCopiedId(note.id);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="p-1 text-zinc-400 hover:text-green-400 hover:bg-zinc-700 rounded"
                            title="Copy content"
                          >
                            {copiedId === note.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => handleTogglePin(note)}
                            className="p-1 text-zinc-400 hover:text-yellow-400 hover:bg-zinc-700 rounded"
                            title={note.isPinned ? 'Unpin' : 'Pin'}
                          >
                            {note.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                          </button>
                          <button
                            onClick={() => openModal(note)}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            className="p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 rounded"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Content preview */}
                      <p className="text-sm text-zinc-400 line-clamp-4 whitespace-pre-wrap mb-3">
                        {note.content}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center flex-wrap gap-2">
                        {note.category && (
                          <span className="bg-zinc-800 text-zinc-400 text-xs rounded-full px-2 py-0.5">
                            {note.category}
                          </span>
                        )}
                        {parseJsonArray(note.tags).map((tag) => (
                          <span
                            key={tag}
                            className="bg-blue-500/10 text-blue-400 text-xs rounded-full px-2 py-0.5 flex items-center gap-1"
                          >
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                        <span className="text-xs text-zinc-600 ml-auto">
                          {new Date(note.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal */}
        <Modal isOpen={showModal} onClose={closeModal} title={editingNote ? 'Edit Note' : 'New Note'} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., Docker cleanup commands"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Content *</label>
              <textarea
                required
                rows={10}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500 resize-y"
                placeholder="Write your note here..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Category</label>
                <input
                  type="text"
                  list="categories"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Select or type..."
                />
                <datalist id="categories">
                  {SUGGESTED_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="docker, cleanup, devops"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {editingNote ? 'Save Changes' : 'Add Note'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
