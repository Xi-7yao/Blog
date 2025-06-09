import styles from './index.module.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createArticleApi, deleteImagesApi, getArticleByIdApi, updateArticleApi, uploadImagesApi } from '../../api/articlesApi';
import { CreateArticleRequest, Image } from '../../type/articles';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { Editor } from '@bytemd/react';
import gfm from '@bytemd/plugin-gfm';
import 'bytemd/dist/index.css';
import 'github-markdown-css/github-markdown.css';
import './MarkdownEditor.css';
import { BytemdPlugin } from 'bytemd';
import zhHans from 'bytemd/locales/zh_Hans.json';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../../components/Login';
import { Button, Form, Input, Modal, Select, message, Spin } from 'antd';

// 临时图片类型
interface TempImage {
  id?: string;
  url: string;
  title?: string;
  alt?: string;
}

// 保存状态类型
type SaveStatus = 'idle' | 'saving' | 'saved';

// 常量
const MIN_SAVING_DURATION = 700; // saving 状态最小持续时间（ms）
const SAVE_STATUS_RESET_DELAY = 5000; // saved -> idle 延迟（ms）

const New = () => {
  const { articleId } = useParams();
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [value, setValue] = useState('');
  const [tempImages, setTempImages] = useState<TempImage[]>([]);
  const [deleteTempImages, setDeleteTempImages] = useState<TempImage[]>([]);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [hasCreatedArticle, setHasCreatedArticle] = useState(!!articleId);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false); // 新增：创建锁
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [currentArticleId, setCurrentArticleId] = useState<string | undefined>(articleId);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user, isLoginOpen, setIsLoginOpen } = useAuth();
  const categories = useSelector((state: RootState) => state.articles.categories);
  const plugins: BytemdPlugin[] = [gfm()];
  const timeoutRef = useRef<number | null>(null);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // 防抖函数
  const debounce = <T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        func(...args);
        timeout = null;
      }, wait);
    };
  };

  // 创建草稿
  const createDraft = async (title: string, content: string) => {
    // const key = 'createDraft';
    if (!userRef.current) {
      setIsLoginOpen(true);
      return;
    }
    if (isCreatingDraft) {
      return;
    }
    setIsCreatingDraft(true); // 设置锁
    setSaveStatus('saving');
    try {
      const startTime = Date.now();
      const article: CreateArticleRequest = {
        meta: {
          title: title || '输入文章标题...',
          username: userRef.current.username,
          userId: userRef.current.userId,
          tags: tags,
          category: category || '综合',
        },
        content: content || '',
        description: description || '未填写描述',
        published: false,
      };
      const res = await createArticleApi(article);
      const newArticleId = res.articleId;
      setHasCreatedArticle(true);
      setCurrentArticleId(newArticleId);
      navigate(`/edit/${newArticleId}`, { replace: true });
      
      const duration = Date.now() - startTime;
      if (duration < MIN_SAVING_DURATION) {
        await new Promise((resolve) => setTimeout(resolve, MIN_SAVING_DURATION - duration));
      }
      setSaveStatus('saved');
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
        timeoutRef.current = null;
      }, SAVE_STATUS_RESET_DELAY);
      saveDraft(article, newArticleId);
    } catch (error: any) {
      const errorCode = error.response?.data?.error?.code || 'UNKNOWN';
      if (errorCode === 'MISSING_TOKEN' || errorCode === '401 Unauthorized') {
        setIsLoginOpen(true);
      } else {
        message.error(`创建草稿失败：${error.message || '未知错误'}`);
      }
    } finally {
      setIsCreatingDraft(false); // 释放锁
    }
  };

  // 防抖创建草稿
  const debouncedCreateDraft = useRef(
    debounce((title: string, content: string) => {
      createDraft(title, content);
    }, 1000)
  ).current;

  // 处理标题输入
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    if (!userRef.current) {
      setIsLoginOpen(true);
      return;
    }
    if (!currentArticleId && !hasCreatedArticle && newValue.trim() && !isCreatingDraft) {
      debouncedCreateDraft(newValue, value);
    }
  };

  // 处理内容变化
  const handleChange = (newValue: string) => {
    setValue(newValue);
    const deleteImages = tempImages.filter((image) => !newValue.includes(image.url));
    for (let image of deleteImages) {
      image.url = image.url.split('/').pop() as string;
    }
    setDeleteTempImages(deleteImages);
    if (!userRef.current) {
      setIsLoginOpen(true);
      return;
    }
    if (!currentArticleId && !hasCreatedArticle && newValue.trim() && !isCreatingDraft) {
      debouncedCreateDraft(searchValue, newValue);
    }
  };

  // 上传图片
  const handleUploadImages = async (files: File[]): Promise<TempImage[]> => {
    const file = files[0];
    const formData = new FormData();
    formData.append('img', file);
    try {
      const url = await uploadImagesApi(formData);
      const newImage: TempImage = { title: file.name, url, alt: undefined };
      setTempImages((prev) => [...prev, newImage]);
      return [newImage];
    } catch (error: any) {
      const errorCode = error.response?.data?.error?.code || 'UNKNOWN';
      if (errorCode === 'MISSING_TOKEN' || errorCode === '401 Unauthorized') {
        setIsLoginOpen(true);
      } else {
        message.error('图片上传失败');
      }
      return [];
    }
  };

  // 清理所有临时图片
  const cleanupAllTempImages = useCallback(async () => {
    if (tempImages.length > 0) {
      const imagesToDelete = tempImages.map((image) => ({
        ...image,
        url: image.url.split('/').pop() as string,
      }));
      try {
        await deleteImagesApi(imagesToDelete as Image[]);
        setTempImages([]);
      } catch (error) {
      }
    }
  }, [tempImages]);

  // 清理未使用图片
  const cleanupUnusedImages = useCallback(async () => {
    if (deleteTempImages.length > 0) {
      const imagesToDelete = deleteTempImages.map((image) => ({
        ...image,
        url: image.url.split('/').pop() as string,
      }));
      try {
        await deleteImagesApi(imagesToDelete as Image[]);
        setDeleteTempImages([]);
      } catch (error) {
      }
    }
  }, [deleteTempImages]);

  // 跳转草稿箱
  const handleDrafts = () => {
    if (!userRef.current) {
      setIsLoginOpen(true);
      return;
    }
    navigate(`/user/${userRef.current.userId}/drafts`);
  };

  // 发布文章
  const handlePublish = () => {
    if (!userRef.current) {
      setIsLoginOpen(true);
      return;
    }
    form.setFieldsValue({ title: searchValue, description, tags, category });
    setIsPublishModalOpen(true);
  };

  // 确认发布
  const handlePublishConfirm = async (values: any) => {
    if (!userRef.current) {
      setIsLoginOpen(true);
      return;
    }
    try {
      await cleanupUnusedImages();
      const article: CreateArticleRequest = {
        meta: {
          title: values.title,
          username: userRef.current.username,
          userId: userRef.current.userId,
          tags: values.tags || [],
          category: values.category || '综合',
        },
        content: value,
        description: values.description || '未填写描述',
        published: true,
      };
      if (currentArticleId) {
        await updateArticleApi(currentArticleId, article);
      } else {
        await createArticleApi(article);
      }
      message.success('文章发布成功');
      setTempImages([]);
      setIsPublishModalOpen(false);
      form.resetFields();
      setSearchValue('');
      setValue('');
      setTags([]);
      setCategory('');
      setDescription('');
      navigate(`/user/${userRef.current.userId}`);
    } catch (error: any) {
      const errorCode = error.response?.data?.error?.code || 'UNKNOWN';
      if (errorCode === 'MISSING_TOKEN' || errorCode === '401 Unauthorized') {
        setIsLoginOpen(true);
      } else {
        message.error(`发布失败：${error.message || '未知错误'}`);
      }
    }
  };

  // 加载草稿（若有 articleId）
  useEffect(() => {
    if (articleId) {
      setCurrentArticleId(articleId);
      getArticleByIdApi(articleId)
        .then((res) => {
          const { meta, content, description } = res;
          setSearchValue(meta.title);
          setValue(content);
          setDescription(description);
          setTags(meta.tags);
          setCategory(meta.category);
          setHasCreatedArticle(true);
          setSaveStatus('idle');
        })
        .catch(() => {
          message.error('加载草稿失败');
        });
    } else {
      setHasCreatedArticle(false);
      setCurrentArticleId(undefined);
      setSaveStatus('idle');
    }
  }, [articleId]);

  // 保存草稿
  const saveDraft = useCallback(async (data: CreateArticleRequest, articleId: string) => {
    if (!articleId) {
      message.error('无法保存草稿：文章 ID 缺失');
      return;
    }
    setSaveStatus('saving');
    if (!userRef.current) {
      setSaveStatus('idle');
      message.error('请先登录');
      return;
    }
    try {
      const startTime = Date.now();
      await updateArticleApi(articleId, {
        ...data,
        published: false,
      });
      const duration = Date.now() - startTime;
      if (duration < MIN_SAVING_DURATION) {
        await new Promise((resolve) => setTimeout(resolve, MIN_SAVING_DURATION - duration));
      }
      setSaveStatus('saved');
      message.success('草稿已更新');
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
        timeoutRef.current = null;
      }, SAVE_STATUS_RESET_DELAY);
    } catch (error: any) {
      setSaveStatus('idle');
      const errorCode = error.response?.data?.error?.code || 'UNKNOWN';
      if (errorCode === 'MISSING_TOKEN' || errorCode === '401 Unauthorized') {
        setIsLoginOpen(true);
      } else {
        message.error(error.message || '保存草稿失败');
      }
    }
  }, [user]);

  // 防抖保存草稿
  const debouncedSaveDraft = useRef(
    debounce((data: CreateArticleRequest, articleId: string) => {
      saveDraft(data, articleId);
    }, 1000)
  ).current;

  // 监听标题和内容变化，触发保存
  useEffect(() => {
    if (userRef.current && currentArticleId && (searchValue.trim() || value.trim())) {
      const article: CreateArticleRequest = {
        meta: {
          title: searchValue || '未命名草稿',
          username: userRef.current.username,
          userId: userRef.current.userId,
          tags,
          category: category || '综合',
        },
        content: value,
        description: description || '未填写描述',
        published: false,
      };
      debouncedSaveDraft(article, currentArticleId);
    }
  }, [searchValue, value, tags, category, description, currentArticleId, debouncedSaveDraft]);

  // 清理临时图片（页面卸载）
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      cleanupAllTempImages();
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cleanupAllTempImages]);

  // 清理定时器（组件卸载）
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 登录状态
  useEffect(() => {
    if (!user) {
      setIsLoginOpen(true);
    } else {
      setIsLoginOpen(false);
    }
  }, [user]);

  // 保存状态显示
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className={styles['save-status-saving']}>
            <Spin size="small" style={{ marginRight: 4 }} />
            保存中...
          </span>
        );
      case 'saved':
        return <span className={styles['save-status-saved']}>保存成功</span>;
      case 'idle':
      default:
        return <span className={styles['save-status-idle']}>文章自动保存到草稿箱</span>;
    }
  };

  return (
    <div className={styles['new-container']}>
      <header className={styles['new-header']}>
        <input
          type="text"
          placeholder="输入文章标题..."
          className={styles['new-input']}
          value={searchValue}
          onChange={handleSearchChange}
        />
        <div className={styles['new-button-container']}>
          {renderSaveStatus()}
          <Button className={styles['new-button']} onClick={handleDrafts}>
            草稿箱
          </Button>
          <Button className={styles['new-button']} onClick={handlePublish}>
            发布
          </Button>
        </div>
      </header>
      <main className={styles['new-main']}>
        <Editor
          value={value}
          locale={zhHans}
          plugins={plugins}
          mode="split"
          onChange={handleChange}
          uploadImages={handleUploadImages}
        />
      </main>
      {isLoginOpen && <LoginModal hasClose={false} toUrl={false} />}
      <Modal
        title="发布文章"
        open={isPublishModalOpen}
        onCancel={() => setIsPublishModalOpen(false)}
        footer={null}
        className={styles['publish-modal']}
      >
        <Form
          form={form}
          onFinish={handlePublishConfirm}
          layout="vertical"
          className={styles['publish-form']}
        >
          <Form.Item
            name="title"
            label="文章标题"
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input placeholder="请输入文章标题" />
          </Form.Item>
          <Form.Item
            name="category"
            label="文章类别"
            rules={[{ required: true, message: '请选择文章类别' }]}
          >
            <Select placeholder="请选择类别">
              {categories
                .filter((category) => category !== '综合')
                .map((category) => (
                  <Select.Option key={category} value={category}>
                    {category}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select
              mode="tags"
              placeholder="输入标签，按回车添加"
              tokenSeparators={[',']}
            />
          </Form.Item>
          <Form.Item name="description" label="文章描述">
            <Input.TextArea
              placeholder="请输入文章描述（200字以内）"
              maxLength={200}
              showCount
              rows={4}
            />
          </Form.Item>
          <Form.Item>
            <div className={styles['modal-button-group']}>
              <Button onClick={() => setIsPublishModalOpen(false)}>取消</Button>
              <Button
                type="primary"
                htmlType="submit"
                style={{ backgroundColor: '#1d7dfa', borderColor: '#1d7dfa' }}
              >
                确定发布
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default New;