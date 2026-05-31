import React, { useState, useEffect, useMemo } from 'react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  cleanupTestCategories,
  getApiError,
} from '../api';
import { Category } from '../types';
import {
  isTestCatalogName,
  sortBrowseCategories,
} from '../utils/catalogFilters';
import { FolderPlus, Trash2, Edit, AlertCircle, RefreshCw, X, Sparkles } from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const { humanCategories, testCategories } = useMemo(() => {
    const human: Category[] = [];
    const test: Category[] = [];
    for (const cat of categories) {
      if (isTestCatalogName(cat.name)) {
        test.push(cat);
      } else {
        human.push(cat);
      }
    }
    return { humanCategories: sortBrowseCategories(human), testCategories: test };
  }, [categories]);

  const fetchCats = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: unknown) {
      setErrorStatus(getApiError(err, '获取分类失败，请确认 API 已启动'));
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
    setSuccessMessage(null);
    try {
      if (editingId) {
        const updated = await updateCategory(editingId, name.trim(), description.trim());
        setCategories(categories.map((c) => (c.id === editingId ? updated : c)));
        setEditingId(null);
        setSuccessMessage('分类已更新');
      } else {
        const created = await createCategory(name.trim(), description.trim());
        setCategories([...categories, created]);
        setSuccessMessage('分类已创建');
      }
      setName('');
      setDescription('');
    } catch (err: unknown) {
      setErrorStatus(getApiError(err, '操作分类失败'));
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

  const handleDeleteClick = async (category: Category) => {
    const isTest = isTestCatalogName(category.name);
    const msg = isTest
      ? `「${category.name}」是测试残留分类，将自动把其下文章移至「技术分享」后删除，是否继续？`
      : '确定删除此分类吗？若分类下仍有文章，系统将拒绝删除。';
    if (!window.confirm(msg)) return;

    setErrorStatus(null);
    setSuccessMessage(null);
    try {
      await deleteCategory(category.id);
      setCategories(categories.filter((c) => c.id !== category.id));
      if (editingId === category.id) {
        handleCancelEdit();
      }
      setSuccessMessage(isTest ? '测试分类已清理' : '分类已删除');
    } catch (err: unknown) {
      setErrorStatus(getApiError(err, '删除分类失败'));
    }
  };

  const handleCleanupTestCategories = async () => {
    if (testCategories.length === 0) return;
    if (
      !window.confirm(
        `将删除 ${testCategories.length} 个测试分类，其下文章会移至「技术分享」，是否继续？`
      )
    ) {
      return;
    }

    setCleaning(true);
    setErrorStatus(null);
    setSuccessMessage(null);
    try {
      const deleted = await cleanupTestCategories();
      await fetchCats();
      setSuccessMessage(`已清理 ${deleted} 个测试分类`);
    } catch (err: unknown) {
      setErrorStatus(getApiError(err, '清理测试分类失败'));
    } finally {
      setCleaning(false);
    }
  };

  const renderCategoryRow = (cat: Category, dimmed = false) => (
    <tr
      key={cat.id}
      className={`hover:bg-gray-50/50 transition-colors ${dimmed ? 'opacity-70' : ''}`}
    >
      <td className="py-3.5 px-4 font-semibold text-gray-900">{cat.name}</td>
      <td className="py-3.5 px-4 text-gray-500 text-xs max-w-[160px] truncate">
        {cat.description || <span className="text-gray-300 italic">（暂无描述）</span>}
      </td>
      <td className="py-3.5 px-4 text-right">
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => handleEditClick(cat)}
            className="text-blue-600 hover:text-blue-800 cursor-pointer p-1 rounded hover:bg-blue-50 transition-colors"
            title="编辑"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDeleteClick(cat)}
            className="text-red-500 hover:text-red-700 cursor-pointer p-1 rounded hover:bg-red-50 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8 flex-1 w-full">
      <div className="mb-6 flex justify-between items-center pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">分类管理</h2>
          <p className="text-xs text-gray-500 mt-1">管理系统中的所有文章类目</p>
        </div>
        <div className="flex items-center gap-2">
          {testCategories.length > 0 && (
            <button
              type="button"
              onClick={handleCleanupTestCategories}
              disabled={cleaning}
              className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              {cleaning ? '清理中…' : `清理 ${testCategories.length} 个测试分类`}
            </button>
          )}
          <button
            type="button"
            onClick={fetchCats}
            className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            刷新列表
          </button>
        </div>
      </div>

      {errorStatus && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs flex gap-2.5 mb-6 items-start leading-relaxed shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">操作异常</span>
            <span>{errorStatus}</span>
          </div>
          <button type="button" onClick={() => setErrorStatus(null)} className="text-red-400 hover:text-red-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium text-green-800">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
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
                  placeholder="如：网络工程、个人感悟"
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

        <div className="md:col-span-3">
          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-200 border-t-blue-700" />
            </div>
          ) : humanCategories.length === 0 && testCategories.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-12 px-6 text-center shadow-sm">
              <p className="text-gray-400 text-xs">没有找到分类记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="border-b border-gray-100 px-4 py-2.5 text-xs font-semibold text-gray-500">
                  正式分类 ({humanCategories.length})
                </div>
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
                      {humanCategories.map((cat) => renderCategoryRow(cat))}
                    </tbody>
                  </table>
                </div>
              </div>

              {testCategories.length > 0 && (
                <details className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
                  <summary className="cursor-pointer px-4 py-2.5 text-xs font-medium text-amber-800 bg-amber-50/80">
                    测试残留分类 ({testCategories.length}) — 点击展开
                  </summary>
                  <p className="px-4 pt-2 text-[11px] text-gray-400">
                    来自 E2E / 集成测试，删除时会自动把文章移至「技术分享」。
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {testCategories.map((cat) => renderCategoryRow(cat, true))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
