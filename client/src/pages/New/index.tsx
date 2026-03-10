import styles from './index.module.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import { createArticleApi, deleteImagesApi, getArticleByIdApi, updateArticleApi, uploadImagesApi } from '../../api/articlesApi';
import { CreateArticleRequest, Image } from '../../type/articles';
import { ErrorResponse } from '../../type/api';
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
import { useAuth } from '../../context/useAuth';
import LoginModal from '../../components/Login';
import { Button, Form, Input, Modal, Select, message, Spin } from 'antd';

interface TempImage {
  id?: string;
  url: string;
  title?: string;
  alt?: string;
}

interface PublishFormValues {
  title: string;
  category: string;
  tags?: string[];
  description?: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

const MIN_SAVING_DURATION = 700;
const SAVE_STATUS_RESET_DELAY = 5000;

const getApiErrorCode = (error: unknown) => {
  const axiosError = error as AxiosError<ErrorResponse>;
  return axiosError.response?.data?.error?.code || 'UNKNOWN';
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  const axiosError = error as AxiosError<ErrorResponse>;
  return axiosError.response?.data?.error?.message || fallback;
};

const shouldOpenLogin = (error: unknown) => {
  const errorCode = getApiErrorCode(error);
  return errorCode === 'MISSING_TOKEN' || errorCode === 'TOKEN_EXPIRED' || errorCode === 'UNAUTHORIZED';
};

const normalizeImageDeletePayload = (images: TempImage[]): Image[] =>
  images.map((image, index) => ({
    id: image.id || `${index}`,
    url: image.url.split('/').pop() as string,
  }));

const buildArticlePayload = ({
  title,
  username,
  userId,
  tags,
  category,
  content,
  description,
  published,
}: {
  title: string;
  username: string;
  userId: string;
  tags: string[];
  category: string;
  content: string;
  description: string;
  published: boolean;
}): CreateArticleRequest => ({
  meta: {
    title,
    username,
    userId,
    tags,
    category,
  },
  content,
  description,
  published,
});

const debounce = <Args extends unknown[]>(
  func: (...args: Args) => void | Promise<void>,
  wait: number
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Args) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      void func(...args);
      timeout = null;
    }, wait);
  };
};

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
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [currentArticleId, setCurrentArticleId] = useState<string | undefined>(articleId);
  const [form] = Form.useForm<PublishFormValues>();
  const navigate = useNavigate();
  const { user, isLoginOpen, setIsLoginOpen } = useAuth();
  const categories = useSelector((state: RootState) => state.articles.categories);
  const plugins: BytemdPlugin[] = [gfm()];
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const createDraft = async (title: string, content: string) => {
    if (!userRef.current || isCreatingDraft) {
      if (!userRef.current) {
        setIsLoginOpen(true);
      }
      return;
    }

    setIsCreatingDraft(true);
    setSaveStatus('saving');

    try {
      const startTime = Date.now();
      const article = buildArticlePayload({
        title: title || '输入文章标题...',
        username: userRef.current.username,
        userId: userRef.current.userId,
        tags,
        category: category || '综合',
        content: content || '',
        description: description || '未填写描述',
        published: false,
      });

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

      await saveDraft(article, newArticleId);
    } catch (error: unknown) {
      if (shouldOpenLogin(error)) {
        setIsLoginOpen(true);
      } else {
        message.error(`创建草稿失败：${getApiErrorMessage(error, '未知错误')}`);
      }
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const debouncedCreateDraft = useRef(
    debounce((title: string, content: string) => {
      void createDraft(title, content);
    }, 1000)
  ).current;

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

  const handleChange = (newValue: string) => {
    setValue(newValue);

    const imagesToDelete = tempImages
      .filter((image) => !newValue.includes(image.url))
      .map((image) => ({
        ...image,
        url: image.url.split('/').pop() as string,
      }));

    setDeleteTempImages(imagesToDelete);

    if (!userRef.current) {
      setIsLoginOpen(true);
      return;
    }

    if (!currentArticleId && !hasCreatedArticle && newValue.trim() && !isCreatingDraft) {
      debouncedCreateDraft(searchValue, newValue);
    }
  };

  const handleUploadImages = async (files: File[]): Promise<TempImage[]> => {
    const file = files[0];
    const formData = new FormData();
    formData.append('img', file);

    try {
      const url = await uploadImagesApi(formData);
      const newImage: TempImage = { title: file.name, url, alt: undefined };
      setTempImages((prev) => [...prev, newImage]);
      return [newImage];
    } catch (error: unknown) {
      if (shouldOpenLogin(error)) {
        setIsLoginOpen(true);
      } else {
        message.error('图片上传失败');
      }

      return [];
    }
  };

  const cleanupAllTempImages = useCallback(async () => {
    if (tempImages.length === 0) {
      return;
    }

    try {
      await deleteImagesApi(normalizeImageDeletePayload(tempImages));
      setTempImages([]);
    } catch {
      message.warning('部分临时图片未能及时清理');
    }
  }, [tempImages]);

  const cleanupUnusedImages = useCallback(async () => {
    if (deleteTempImages.length === 0) {
      return;
    }

    try {
      await deleteImagesApi(normalizeImageDeletePayload(deleteTempImages));
      setDeleteTempImages([]);
    } catch {
      message.warning('部分未使用图片清理失败');
    }
  }, [deleteTempImages]);

  const handleDrafts = () => {
    if (!userRef.current) {
      setIsLoginOpen(true);
      return;
    }

    navigate(`/user/${userRef.current.userId}/drafts`);
  };

  const handlePublish = () => {
    if (!userRef.current) {
      setIsLoginOpen(true);
      return;
    }

    form.setFieldsValue({ title: searchValue, description, tags, category });
    setIsPublishModalOpen(true);
  };

  const handlePublishConfirm = async (values: PublishFormValues) => {
    if (!userRef.current) {
      setIsLoginOpen(true);
      return;
    }

    try {
      await cleanupUnusedImages();

      const article = buildArticlePayload({
        title: values.title,
        username: userRef.current.username,
        userId: userRef.current.userId,
        tags: values.tags || [],
        category: values.category || '综合',
        content: value,
        description: values.description || '未填写描述',
        published: true,
      });

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
    } catch (error: unknown) {
      if (shouldOpenLogin(error)) {
        setIsLoginOpen(true);
      } else {
        message.error(`发布失败：${getApiErrorMessage(error, '未知错误')}`);
      }
    }
  };

  useEffect(() => {
    if (articleId) {
      setCurrentArticleId(articleId);
      void getArticleByIdApi(articleId)
        .then((res) => {
          const { meta, content, description: articleDescription } = res;
          setSearchValue(meta.title);
          setValue(content);
          setDescription(articleDescription);
          setTags(meta.tags);
          setCategory(meta.category);
          setHasCreatedArticle(true);
          setSaveStatus('idle');
        })
        .catch(() => {
          message.error('加载草稿失败');
        });
      return;
    }

    setHasCreatedArticle(false);
    setCurrentArticleId(undefined);
    setSaveStatus('idle');
  }, [articleId]);

  const saveDraft = useCallback(async (data: CreateArticleRequest, targetArticleId: string) => {
    if (!targetArticleId) {
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
      await updateArticleApi(targetArticleId, {
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
    } catch (error: unknown) {
      setSaveStatus('idle');
      if (shouldOpenLogin(error)) {
        setIsLoginOpen(true);
      } else {
        message.error(getApiErrorMessage(error, '保存草稿失败'));
      }
    }
  }, [setIsLoginOpen]);

  const debouncedSaveDraft = useRef(
    debounce((data: CreateArticleRequest, targetArticleId: string) => {
      void saveDraft(data, targetArticleId);
    }, 1000)
  ).current;

  useEffect(() => {
    if (userRef.current && currentArticleId && (searchValue.trim() || value.trim())) {
      const article = buildArticlePayload({
        title: searchValue || '未命名草稿',
        username: userRef.current.username,
        userId: userRef.current.userId,
        tags,
        category: category || '综合',
        content: value,
        description: description || '未填写描述',
        published: false,
      });

      debouncedSaveDraft(article, currentArticleId);
    }
  }, [searchValue, value, tags, category, description, currentArticleId, debouncedSaveDraft]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      void cleanupAllTempImages();
      event.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cleanupAllTempImages]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIsLoginOpen(!user);
  }, [user, setIsLoginOpen]);

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
        <Form<PublishFormValues>
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
                .filter((itemCategory) => itemCategory !== '综合')
                .map((itemCategory) => (
                  <Select.Option key={itemCategory} value={itemCategory}>
                    {itemCategory}
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
