import React, { useState, useEffect, useMemo } from 'react';
import { getTags, createTag, updateTag, deleteTag, cleanupTestTags, getApiError } from '../api';
import { Tag } from '../types';
import { isTestCatalogName } from '../utils/catalogFilters';
import { Hash, Plus, AlertCircle, RefreshCw, X, Trash2, Edit, Sparkles } from 'lucide-react';

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [newTagName, setNewTagName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const { humanTags, testTags } = useMemo(() => {
    const human: Tag[] = [];
    const test: Tag[] = [];
    for (const tag of tags) {
      if (isTestCatalogName(tag.name)) {
        test.push(tag);
      } else {
        human.push(tag);
      }
    }
    human.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
    return { humanTags: human, testTags: test };
  }, [tags]);

  const fetchTagsList = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const data = await getTags();
      setTags(data);
    } catch (err: unknown) {
      setErrorStatus(getApiError(err, '获取标签列表失败'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTagsList();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newTagName.trim().replace(/^#/, '');
    if (!cleanName) {
      setErrorStatus('标签名称不能为空');
      return;
    }

    setSubmitting(true);
    setErrorStatus(null);
    setSuccessMessage(null);
    try {
      if (editingId) {
        const updated = await updateTag(editingId, cleanName);
        setTags(tags.map((t) => (t.id === editingId ? updated : t)));
        setEditingId(null);
        setSuccessMessage('标签已更新');
      } else {
        const createdItem = await createTag(cleanName);
        setTags([...tags, createdItem]);
        setSuccessMessage('标签已创建');
      }
      setNewTagName('');
    } catch (err: unknown) {
      setErrorStatus(getApiError(err, editingId ? '更新标签失败' : '创建标签失败'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (tag: Tag) => {
    setErrorStatus(null);
    setEditingId(tag.id);
    setNewTagName(tag.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewTagName('');
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (!window.confirm(`确定删除标签「${tag.name}」吗？`)) return;
    setErrorStatus(null);
    try {
      await deleteTag(tag.id);
      setTags(tags.filter((t) => t.id !== tag.id));
      if (editingId === tag.id) {
        handleCancelEdit();
      }
    } catch (err: unknown) {
      setErrorStatus(getApiError(err, '删除标签失败'));
    }
  };

  const handleCleanupTestTags = async () => {
    if (testTags.length === 0) return;
    if (!window.confirm(`将删除 ${testTags.length} 个自动化测试残留标签，是否继续？`)) return;

    setCleaning(true);
    setErrorStatus(null);
    setSuccessMessage(null);
    try {
      const deleted = await cleanupTestTags();
      await fetchTagsList();
      setSuccessMessage(`已清理 ${deleted} 个测试标签`);
    } catch (err: unknown) {
      setErrorStatus(getApiError(err, '清理测试标签失败'));
    } finally {
      setCleaning(false);
    }
  };

  const renderTagChip = (tag: Tag) => (
    <div
      key={tag.id}
      data-testid="tag-chip"
      data-tag-name={tag.name}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
    >
      <span>#{tag.name}</span>
      <button
        type="button"
        onClick={() => handleEditClick(tag)}
        className="cursor-pointer p-0.5 text-gray-400 hover:text-blue-700"
        title="编辑标签"
      >
        <Edit className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => handleDeleteTag(tag)}
        className="cursor-pointer p-0.5 text-gray-400 hover:text-red-600"
        title="删除标签"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">标签管理</h2>
          <p className="mt-1 text-xs text-gray-500">使用简短中文或英文词组，方便读者筛选文章</p>
        </div>
        <button
          type="button"
          onClick={fetchTagsList}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          刷新
        </button>
      </div>

      {errorStatus && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-relaxed text-red-800 shadow-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex-1">{errorStatus}</div>
          <button type="button" onClick={() => setErrorStatus(null)} className="cursor-pointer text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-medium text-green-800">
          {successMessage}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-700">
          <Hash className="h-3.5 w-3.5 text-blue-700" />
          {editingId ? '编辑标签' : '新建标签'}
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
          <div className="relative flex min-w-[200px] flex-1 items-center rounded-xl border border-gray-200 bg-gray-50 px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
            <span className="select-none text-sm font-semibold text-gray-400">#</span>
            <input
              type="text"
              data-testid="tag-name-input"
              placeholder="如：Docker、性能优化、React"
              maxLength={30}
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="w-full bg-transparent px-1 py-2.5 text-sm text-gray-800 focus:outline-none"
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex cursor-pointer items-center gap-1 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            {editingId ? '保存' : '添加'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="cursor-pointer rounded-xl border border-gray-200 px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              取消
            </button>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            正式标签 ({humanTags.length})
          </h3>
          {testTags.length > 0 && (
            <button
              type="button"
              onClick={handleCleanupTestTags}
              disabled={cleaning}
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
            >
              <Sparkles className="h-3 w-3" />
              {cleaning ? '清理中…' : `清理 ${testTags.length} 个测试标签`}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
          </div>
        ) : humanTags.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">
            暂无正式标签。重启 API 后会自动写入示例标签，或在上方手动添加。
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">{humanTags.map(renderTagChip)}</div>
        )}

        {testTags.length > 0 && (
          <details className="mt-5 border-t border-gray-100 pt-4">
            <summary className="cursor-pointer text-xs font-medium text-amber-700">
              测试残留标签 ({testTags.length}) — 点击展开
            </summary>
            <p className="mt-2 text-[11px] text-gray-400">
              来自 E2E / 集成测试的临时数据，建议一键清理。
            </p>
            <div className="mt-3 flex flex-wrap gap-2 opacity-70">{testTags.map(renderTagChip)}</div>
          </details>
        )}
      </div>
    </div>
  );
}
