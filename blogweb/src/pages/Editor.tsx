import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  createPost,
  updatePost,
  publishPost,
  draftPost,
  getPostDetail,
  getCategories,
  getTags,
  uploadCover,
  getApiError,
  isDraftStatus,
  resolveAssetUrl,
} from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Category, Tag } from '../types';
import {
  FileText,
  UploadCloud,
  Image,
  FolderPlus,
  Eye,
  Check,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Trash2,
  Lock,
  Tag as TagIcon
} from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';

export default function Editor() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams] = useSearchParams();
  
  // Detect ID from parameter OR query parameter (?id=X)
  const postId = paramId || searchParams.get('id') || null;
  const isEditMode = !!postId;

  // Authentication Guard
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Options State
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Form Fields State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [coverUrl, setCoverUrl] = useState('');
  const [postStatus, setPostStatus] = useState<'published' | 'draft'>('published');

  // Interactive UI State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load auxiliary meta data (categories & tags)
  useEffect(() => {
    async function loadMeta() {
      try {
        const [catsData, tagsData] = await Promise.all([
          getCategories(),
          getTags(),
        ]);
        setCategories(catsData);
        setTags(tagsData);
        if (!postId && catsData.length > 0) {
          setCategoryId((prev) => (prev === '' ? catsData[0].id : prev));
        }
      } catch (err) {
        console.warn('Could not populate categories or tags lists', err);
      }
    }
    loadMeta();
  }, [postId]);

  // Fetch article details if editing
  useEffect(() => {
    if (!postId) return;

    async function loadPostDetails() {
      setLoading(true);
      setErrorStatus(null);
      try {
        const [post, catsData, tagsData] = await Promise.all([
          getPostDetail(postId),
          getCategories(),
          getTags(),
        ]);
        setCategories(catsData);
        setTags(tagsData);
        setTitle(post.title || '');
        setSummary(post.summary || '');
        setContent(post.content || '');
        setPostStatus(isDraftStatus(post.status) ? 'draft' : 'published');

        if (post.categoryId) {
          setCategoryId(post.categoryId);
        } else if (post.categoryName) {
          const cat = catsData.find((c) => c.name === post.categoryName);
          if (cat) setCategoryId(cat.id);
        }

        if (Array.isArray(post.tagIds) && post.tagIds.length > 0) {
          setSelectedTagIds(post.tagIds);
        } else if (Array.isArray(post.tags)) {
          const names = post.tags.map((t) => (typeof t === 'string' ? t : (t as Tag).name));
          setSelectedTagIds(
            tagsData.filter((t) => names.includes(t.name)).map((t) => t.id)
          );
        }

        setCoverUrl(post.coverUrl || '');
      } catch (err: unknown) {
        console.error('Fetch post detail failed:', err);
        setErrorStatus(getApiError(err, '无法加载文章详情'));
      } finally {
        setLoading(false);
      }
    }
    loadPostDetails();
  }, [postId]);

  // Cover uploading controllers
  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请仅上传图片文件');
      return;
    }
    
    setUploadingImage(true);
    setErrorStatus(null);
    try {
      const url = await uploadCover(file);
      setCoverUrl(url);
    } catch (err: any) {
      console.error('File upload error:', err);
      setErrorStatus('封面图片上传失败');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFile(e.target.files[0]);
    }
  };

  const handleRemoveCover = () => {
    setCoverUrl('');
  };

  // Tag selection controller
  const handleToggleTag = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  // Submit Handler
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);

    // Validations
    if (!title.trim()) {
      setErrorStatus('文章标题不能为空');
      return;
    }
    if (!content.trim()) {
      setErrorStatus('文章正文内容不能为空');
      return;
    }
    if (categoryId === '' || Number(categoryId) <= 0) {
      setErrorStatus('请选择文章分类');
      return;
    }

    setSubmitting(true);

    const postPayload = {
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      categoryId: Number(categoryId),
      tagIds: selectedTagIds,
      coverUrl: coverUrl || undefined,
    };

    try {
      if (isEditMode && postId) {
        await updatePost(postId, postPayload);
        if (postStatus === 'published') {
          await publishPost(postId);
        } else {
          await draftPost(postId);
        }
        navigate(`/posts/${postId}`);
      } else {
        const created = await createPost(postPayload);
        const nextId = created.id;
        if (postStatus === 'published') {
          await publishPost(nextId);
        }
        navigate(`/posts/${nextId}`);
      }
    } catch (err: unknown) {
      console.error('Submit post error:', err);
      setErrorStatus(getApiError(err, '保存文章失败。请检查后端状态。'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-24 flex flex-col justify-center items-center flex-grow">
        <RefreshCw className="w-8 h-8 text-blue-700 animate-spin mb-3" />
        <span className="text-sm text-gray-500">正在载入文章细节...</span>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8 flex-1 w-full">
      {/* Return Controls header */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-700 font-semibold cursor-pointer py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </button>
        <span className="text-xs text-gray-400 font-mono">
          {isEditMode ? `正在编辑文章 ID: #${postId}` : '撰写全新发布'}
        </span>
      </div>

      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 font-sans">
          {isEditMode ? '修改博文' : '撰写新博文'}
        </h2>
        <p className="text-xs text-gray-500 mt-1">支持标准的 Markdown 排版与图像封面直传</p>
      </div>

      {errorStatus && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-xs flex gap-2.5 mb-6 items-start leading-relaxed shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">保存遇到冲突</span>
            <span>{errorStatus}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSavePost} className="space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            文章标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="填写一个足够吸引读者的标题"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm outline-none transition-all text-gray-900 font-semibold"
            disabled={submitting}
            required
          />
        </div>

        {/* 2-columns setup for Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              所属分类类目
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-3 text-sm outline-none transition-all text-gray-700"
              disabled={submitting}
            >
              <option value="" disabled>
                请选择分类
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              设置发布状态
            </label>
            <div className="flex bg-gray-50 p-1 border border-gray-200 rounded-xl">
              <button
                type="button"
                onClick={() => setPostStatus('published')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  postStatus === 'published'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'text-gray-600 hover:text-blue-700 bg-transparent'
                }`}
              >
                直接公开发布
              </button>
              <button
                type="button"
                onClick={() => setPostStatus('draft')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  postStatus === 'draft'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-gray-600 hover:text-amber-500 bg-transparent'
                }`}
              >
                存为私人草稿
              </button>
            </div>
          </div>
        </div>

        {/* Cover image widget - drag & drop or manual upload */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            设置文章封面
          </label>
          
          {coverUrl ? (
            <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-gray-50 h-44 flex items-center justify-center group">
              <img
                src={resolveAssetUrl(coverUrl)}
                alt="Uploaded cover preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white hover:bg-gray-100 text-blue-700 text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                  disabled={uploadingImage}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${uploadingImage ? 'animate-spin' : ''}`} />
                  <span>更换图片</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="bg-white hover:bg-red-50 text-red-600 text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除封面</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col justify-center items-center min-h-[176px] ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {uploadingImage ? (
                <>
                  <RefreshCw className="w-8 h-8 text-blue-700 animate-spin mb-3" />
                  <p className="text-xs text-gray-500 font-semibold mb-1">正在上传图片并序列化...</p>
                  <p className="text-[10px] text-gray-400">我们将存储极速图片，这可能需要数秒时间</p>
                </>
              ) : (
                <>
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-3" />
                  <p className="text-xs text-gray-600 font-semibold mb-1">
                    拖拽文章封面至此区域，或 <span className="text-blue-700 underline">浏览本地文件</span>
                  </p>
                  <p className="text-[10px] text-gray-400">支持 JPG / JPEG / PNG，最大 5MB</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Excerpt / Summary */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            文章摘要 / 序言小结
          </label>
          <textarea
            placeholder="编写一小段吸引人的大纲纲要（省略该栏目时将截取正文前 140 字作为摘要）"
            rows={2}
            maxLength={300}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm outline-none transition-all text-gray-700 leading-relaxed font-sans"
            disabled={submitting}
          />
        </div>

        {/* Tags Selection Checkboxes */}
        {tags.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5 text-gray-400" />
              <span>分配检索标签</span>
            </label>
            <div className="flex flex-wrap gap-2 bg-gray-50 border border-gray-250 p-4 rounded-xl">
              {tags.map((tag) => {
                const checked = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all cursor-pointer ${
                      checked
                        ? 'bg-blue-100 border-blue-400 text-blue-700 shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-150'
                    }`}
                  >
                    <span>#{tag.name}</span>
                    {checked && <Check className="w-3 h-3 text-blue-700 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Markdown Editor Textarea Body */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              文章正文 (Markdown 语法) <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className="text-xs text-blue-700 hover:text-blue-900 border border-blue-200 bg-white px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer shadow-sm transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{previewMode ? '取消预览' : '实时预览'}</span>
            </button>
          </div>

          {previewMode ? (
            <div className="bg-white border border-blue-200 rounded-xl p-6 min-h-[300px] shadow-sm max-h-[500px] overflow-y-auto">
              {content.trim() ? (
                <MarkdownRenderer>{content}</MarkdownRenderer>
              ) : (
                <p className="text-gray-300 italic text-sm text-center py-20">在此输入文字进行预览...</p>
              )}
            </div>
          ) : (
            <textarea
              placeholder="键入您的文章内容，支持 ## 标题, *列表*, **加粗** 以及 `代码等 Markdown 标记..."
              rows={12}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm outline-none transition-all text-gray-800 leading-relaxed font-mono"
              disabled={submitting}
              required
            />
          )}
        </div>

        {/* Footer Actions submit */}
        <div className="pt-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-colors cursor-pointer text-sm"
          >
            返回
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`font-semibold py-3 px-8 rounded-xl transition-colors shadow-sm cursor-pointer text-sm text-center min-w-[140px] text-white flex justify-center items-center gap-2 ${
              postStatus === 'draft'
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-blue-700 hover:bg-blue-800'
            }`}
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>正在上传...</span>
              </>
            ) : (
              <span>{isEditMode ? '修改并发布' : '确定提交'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
