import React, { useState, useEffect } from 'react';
import { getTags, createTag, updateTag, deleteTag, getApiError } from '../api';
import { Tag } from '../types';
import { Hash, Plus, AlertCircle, RefreshCw, X, Trash2, Edit } from 'lucide-react';

export default function Tags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const [newTagName, setNewTagName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTagsList = async () => {
    setLoading(true);
    setErrorStatus(null);
    try {
      const data = await getTags();
      setTags(data);
    } catch (err: unknown) {
      console.error('Fetch tags error:', err);
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
    try {
      if (editingId) {
        const updated = await updateTag(editingId, cleanName);
        setTags(tags.map((t) => (t.id === editingId ? updated : t)));
        setEditingId(null);
      } else {
        const createdItem = await createTag(cleanName);
        setTags([...tags, createdItem]);
      }
      setNewTagName('');
    } catch (err: unknown) {
      console.error('Submit tag error:', err);
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

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 flex-1 w-full">
      <div className="mb-6 flex justify-between items-center pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 font-sans">标签管理</h2>
          <p className="text-xs text-gray-500 mt-1">管理系统标签以改进文章检索与索引</p>
        </div>
        <button
          onClick={fetchTagsList}
          className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>刷新</span>
        </button>
      </div>

      {errorStatus && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs flex gap-2.5 mb-6 items-start leading-relaxed shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">操作冲突</span>
            <span>{errorStatus}</span>
          </div>
          <button onClick={() => setErrorStatus(null)} className="text-red-400 hover:text-red-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-1">
          <Hash className="w-3.5 h-3.5 text-blue-700" />
          <span>{editingId ? '编辑检索标签' : '新建检索标签'}</span>
        </h3>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex items-center bg-gray-50 border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-xl px-3 transition-all flex-1">
            <span className="text-gray-400 text-sm font-semibold select-none">#</span>
            <input
              type="text"
              data-testid="tag-name-input"
              placeholder="网络层优化、k8s、心得体会"
              maxLength={30}
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="w-full text-sm py-2.5 px-1 text-gray-800 bg-transparent focus:outline-none"
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>{editingId ? '保存更改' : '添加'}</span>
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-gray-600 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer"
            >
              取消
            </button>
          )}
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          标签云 ({tags.length})
        </h3>
        {loading ? (
          <div className="py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-700"></div>
          </div>
        ) : tags.length === 0 ? (
          <p className="text-gray-400 text-center py-6 text-xs">暂无任何检索标签，请在上方输入框中创建您的第一个标签！</p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {tags.map((tag) => (
              <div
                key={tag.id}
                data-testid="tag-chip"
                data-tag-name={tag.name}
                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 font-medium"
              >
                <span>#{tag.name}</span>
                <button
                  type="button"
                  onClick={() => handleEditClick(tag)}
                  className="text-gray-400 hover:text-blue-700 cursor-pointer p-0.5"
                  title="编辑标签"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTag(tag)}
                  className="text-gray-400 hover:text-red-600 cursor-pointer p-0.5"
                  title="删除标签"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
