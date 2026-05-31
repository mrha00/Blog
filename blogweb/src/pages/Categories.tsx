import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api';
import { Category } from '../types';
import { FolderPlus, Trash2, Edit, AlertCircle, RefreshCw, X } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCats = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Fetch categories error:', err);
      setErrorStatus(
        err.message || '获取分类失败。请确保 API 已经启动在 http://localhost:6133'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorStatus('分类名称不能为空');
      return;
    }

    setSubmitting(true);
    setErrorStatus(null);
    try {
      if (editingId) {
        // Update operation
        const updated = await updateCategory(editingId, name.trim(), description.trim());
        setCategories(categories.map((c) => (c.id === editingId ? updated : c)));
        setEditingId(null);
      } else {
        // Create operation
        const created = await createCategory(name.trim(), description.trim());
        setCategories([...categories, created]);
      }
      setName('');
      setDescription('');
    } catch (err: any) {
      console.error('Submit category error:', err);
      setErrorStatus(err.response?.data?.message || err.message || '操作分类失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (category: Category) => {
    setErrorStatus(null);
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const handleDeleteClick = async (id: number) => {
    if (!window.confirm('您确定要删除此分类吗？关联的文章可能会变为未分类。')) return;
    try {
      await deleteCategory(id);
      setCategories(categories.filter((c) => c.id !== id));
      if (editingId === id) {
        handleCancelEdit();
      }
    } catch (err: any) {
      console.error('Delete category error:', err);
      setErrorStatus(err.response?.data?.message || err.message || '删除分类失败');
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 flex-1 w-full">
      <div className="mb-6 flex justify-between items-center pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 font-sans">分类管理</h2>
          <p className="text-xs text-gray-500 mt-1">管理系统中的所有文章类目</p>
        </div>
        <button
          onClick={fetchCats}
          className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>刷新列表</span>
        </button>
      </div>

      {errorStatus && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs flex gap-2.5 mb-6 items-start leading-relaxed shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">操作异常</span>
            <span>{errorStatus}</span>
          </div>
          <button onClick={() => setErrorStatus(null)} className="text-red-400 hover:text-red-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Editor Form (Left 2-cols) */}
        <div className="md:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm sticky top-24">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-blue-700" />
              <span>{editingId ? `修改类目 (#${editingId})` : '新增文章类目'}</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  分类名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="如: 网络工程、个人感悟"
                  maxLength={50}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2.5 text-sm outline-none transition-all text-gray-800"
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                  分类描述
                </label>
                <textarea
                  placeholder="填写简要的分类详情与涵盖领域"
                  rows={4}
                  maxLength={200}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2.5 text-sm outline-none transition-all text-gray-800"
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm text-center"
                >
                  {submitting ? '正在提交...' : editingId ? '保存更改' : '创建分类'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    取消
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Categories Table (Right 3-cols) */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-700"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-12 px-6 text-center shadow-sm">
              <p className="text-gray-400 text-xs">没有找到分类记录</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table id="categories-admin-table" className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 text-xs font-bold tracking-wider uppercase">
                      <th className="py-3 px-4">分类名称</th>
                      <th className="py-3 px-4">类目描述</th>
                      <th className="py-3 px-4 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">{cat.name}</td>
                        <td className="py-3.5 px-4 text-gray-500 text-xs max-w-[120px] truncate">
                          {cat.description || <span className="text-gray-300 italic">（暂无描述）</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-2.5">
                            <button
                              onClick={() => handleEditClick(cat)}
                              className="text-blue-600 hover:text-blue-800 cursor-pointer p-1 rounded hover:bg-blue-50 transition-colors"
                              title="编辑"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(cat.id)}
                              className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded hover:bg-red-50 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      </div>
    </div>
  );
}
