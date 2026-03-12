import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Drawer, Form, Input, Select, Spin, message } from 'antd';
import { Editor } from '@bytemd/react';
import gfm from '@bytemd/plugin-gfm';
import zhHans from 'bytemd/locales/zh_Hans.json';
import type { BytemdPlugin } from 'bytemd';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getArticleByIdApi, updateArticleApi, uploadImagesApi, createArticleApi, deleteImagesApi } from '../../api/articlesApi';
import LoginModal from '../../components/Login';
import { useAuth } from '../../context/useAuth';
import { CATEGORY_ALL } from '../../redux/slices/articlesSlice';
import type { RootState } from '../../redux/store';
import type { CreateArticleRequest } from '../../type/articles';
import {
  buildArticlePayload,
  debounce,
  getApiErrorMessage,
  normalizeImageDeletePayload,
  shouldOpenLogin,
  TempImage,
  PublishFormValues,
  waitForMinimumDuration,
} from './editorUtils';
import { useSaveStatus } from './useSaveStatus';
import styles from './index.module.css';
import 'bytemd/dist/index.css';
import 'github-markdown-css/github-markdown.css';
import './MarkdownEditor.css';

const plugins: BytemdPlugin[] = [gfm()];

const New = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { user, isLoginOpen, setIsLoginOpen } = useAuth();
  const categories = useSelector((state: RootState) => state.articles.categories);
  const [form] = Form.useForm<PublishFormValues>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState(CATEGORY_ALL);
  const [content, setContent] = useState('');
  const [uploadedImages, setUploadedImages] = useState<TempImage[]>([]);
  const [imagesPendingCleanup, setImagesPendingCleanup] = useState<TempImage[]>([]);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isLoadingArticle, setIsLoadingArticle] = useState(Boolean(articleId));
  const [currentArticleId, setCurrentArticleId] = useState<string | undefined>(articleId);
  const [hasCreatedArticle, setHasCreatedArticle] = useState(Boolean(articleId));
  const { saveStatus, markSaving, markSaved, resetSaveStatus } = useSaveStatus();
  const userRef = useRef(user);
  const draftMetaRef = useRef({ description, tags, category });

  const availableCategories = useMemo(
    () => categories.filter((itemCategory) => itemCategory !== CATEGORY_ALL),
    [categories]
  );

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    draftMetaRef.current = { description, tags, category };
  }, [description, tags, category]);

  const openLoginModal = useCallback(() => {
    setIsLoginOpen(true);
  }, [setIsLoginOpen]);

  const cleanupImages = useCallback(
    async (images: TempImage[], warningMessage: string) => {
      if (images.length === 0) {
        return true;
      }

      try {
        await deleteImagesApi(normalizeImageDeletePayload(images));
        return true;
      } catch (error: unknown) {
        if (shouldOpenLogin(error)) {
          openLoginModal();
        } else {
          message.warning(warningMessage);
        }

        return false;
      }
    },
    [openLoginModal]
  );

  const saveDraft = useCallback(
    async (article: CreateArticleRequest, targetArticleId: string) => {
      if (!targetArticleId || !userRef.current) {
        return;
      }

      markSaving();

      try {
        const startTime = Date.now();
        await updateArticleApi(targetArticleId, { ...article, published: false });
        await waitForMinimumDuration(startTime);
        markSaved();
      } catch (error: unknown) {
        resetSaveStatus();

        if (shouldOpenLogin(error)) {
          openLoginModal();
        } else {
          message.error(getApiErrorMessage(error, '保存草稿失败'));
        }
      }
    },
    [markSaved, markSaving, openLoginModal, resetSaveStatus]
  );

  const debouncedSaveDraft = useRef(
    debounce((article: CreateArticleRequest, targetArticleId: string) => {
      void saveDraft(article, targetArticleId);
    }, 1000)
  ).current;

  const createDraft = useCallback(
    async (nextTitle: string, nextContent: string) => {
      if (!userRef.current || isCreatingDraft) {
        return;
      }

      setIsCreatingDraft(true);
      markSaving();

      try {
        const startTime = Date.now();
        const article = buildArticlePayload({
          title: nextTitle,
          username: userRef.current.username,
          userId: userRef.current.userId,
          tags: draftMetaRef.current.tags,
          category: draftMetaRef.current.category,
          content: nextContent,
          description: draftMetaRef.current.description,
          published: false,
        });

        const createdArticle = await createArticleApi(article);
        const nextArticleId = createdArticle.articleId;

        setHasCreatedArticle(true);
        setCurrentArticleId(nextArticleId);
        navigate(`/edit/${nextArticleId}`, { replace: true });

        await waitForMinimumDuration(startTime);
        markSaved();
      } catch (error: unknown) {
        resetSaveStatus();

        if (shouldOpenLogin(error)) {
          openLoginModal();
        } else {
          message.error(getApiErrorMessage(error, '创建草稿失败'));
        }
      } finally {
        setIsCreatingDraft(false);
      }
    },
    [isCreatingDraft, markSaved, markSaving, navigate, openLoginModal, resetSaveStatus]
  );

  const debouncedCreateDraft = useRef(
    debounce((nextTitle: string, nextContent: string) => {
      void createDraft(nextTitle, nextContent);
    }, 1000)
  ).current;

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTitle = event.target.value;
    setTitle(nextTitle);

    if (!userRef.current) {
      return;
    }

    if (!currentArticleId && !hasCreatedArticle && nextTitle.trim() && !isCreatingDraft) {
      debouncedCreateDraft(nextTitle, content);
    }
  };

  const handleEditorChange = (nextContent: string) => {
    setContent(nextContent);

    const removedImages = uploadedImages.filter((image) => !nextContent.includes(image.url));
    setImagesPendingCleanup(removedImages);

    if (!userRef.current) {
      return;
    }

    if (!currentArticleId && !hasCreatedArticle && nextContent.trim() && !isCreatingDraft) {
      debouncedCreateDraft(title, nextContent);
    }
  };

  const handleUploadImages = async (files: File[]): Promise<TempImage[]> => {
    if (!userRef.current) {
      openLoginModal();
      return [];
    }

    const file = files[0];
    const formData = new FormData();
    formData.append('img', file);

    try {
      const url = await uploadImagesApi(formData);
      const nextImage: TempImage = { title: file.name, url };
      setUploadedImages((prevImages) => [...prevImages, nextImage]);
      return [nextImage];
    } catch (error: unknown) {
      if (shouldOpenLogin(error)) {
        openLoginModal();
      } else {
        message.error(getApiErrorMessage(error, '图片上传失败'));
      }

      return [];
    }
  };

  const handleOpenDrafts = () => {
    if (!userRef.current) {
      openLoginModal();
      return;
    }

    navigate(`/user/${userRef.current.userId}/drafts`);
  };

  const handleOpenPublishModal = () => {
    if (!userRef.current) {
      openLoginModal();
      return;
    }

    form.setFieldsValue({
      title,
      description,
      tags,
      category: category || CATEGORY_ALL,
    });
    setIsPublishModalOpen(true);
  };

  const handlePublishConfirm = async (values: PublishFormValues) => {
    if (!userRef.current) {
      openLoginModal();
      return;
    }

    const cleanupSucceeded = await cleanupImages(
      imagesPendingCleanup,
      '部分未使用图片暂时没有清理成功'
    );

    if (cleanupSucceeded) {
      setImagesPendingCleanup([]);
    }

    try {
      const article = buildArticlePayload({
        title: values.title,
        username: userRef.current.username,
        userId: userRef.current.userId,
        tags: values.tags || [],
        category: values.category || CATEGORY_ALL,
        content,
        description: values.description || '',
        published: true,
      });

      if (currentArticleId) {
        await updateArticleApi(currentArticleId, article);
      } else {
        const createdArticle = await createArticleApi(article);
        setCurrentArticleId(createdArticle.articleId);
      }

      message.success('文章发布成功');
      setUploadedImages([]);
      setImagesPendingCleanup([]);
      setIsPublishModalOpen(false);
      form.resetFields();
      resetSaveStatus();

      navigate(`/user/${userRef.current.userId}`);
    } catch (error: unknown) {
      if (shouldOpenLogin(error)) {
        openLoginModal();
      } else {
        message.error(getApiErrorMessage(error, '发布文章失败'));
      }
    }
  };

  useEffect(() => {
    if (!articleId) {
      setTitle('');
      setDescription('');
      setTags([]);
      setCategory(CATEGORY_ALL);
      setContent('');
      setUploadedImages([]);
      setImagesPendingCleanup([]);
      setCurrentArticleId(undefined);
      setHasCreatedArticle(false);
      setIsLoadingArticle(false);
      resetSaveStatus();
      return;
    }

    setIsLoadingArticle(true);
    setCurrentArticleId(articleId);

    void getArticleByIdApi(articleId)
      .then((article) => {
        setTitle(article.meta.title);
        setContent(article.content);
        setDescription(article.description);
        setTags(article.meta.tags);
        setCategory(article.meta.category || CATEGORY_ALL);
        setHasCreatedArticle(true);
      })
      .catch((error: unknown) => {
        if (shouldOpenLogin(error)) {
          openLoginModal();
        } else {
          message.error(getApiErrorMessage(error, '加载文章失败'));
        }
      })
      .finally(() => {
        setIsLoadingArticle(false);
        resetSaveStatus();
      });
  }, [articleId, openLoginModal, resetSaveStatus]);

  useEffect(() => {
    if (!userRef.current || !currentArticleId || (!title.trim() && !content.trim())) {
      return;
    }

    const article = buildArticlePayload({
      title,
      username: userRef.current.username,
      userId: userRef.current.userId,
      tags,
      category,
      content,
      description,
      published: false,
    });

    debouncedSaveDraft(article, currentArticleId);
  }, [category, content, currentArticleId, debouncedSaveDraft, description, tags, title]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (imagesPendingCleanup.length === 0) {
        return;
      }

      void cleanupImages(imagesPendingCleanup, '部分临时图片未能及时清理');
      event.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [cleanupImages, imagesPendingCleanup]);

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className={styles['save-status-saving']}>
            <Spin size="small" />
            正在保存草稿
          </span>
        );
      case 'saved':
        return <span className={styles['save-status-saved']}>草稿已自动保存</span>;
      case 'idle':
      default:
        return user ? (
          <span className={styles['save-status-idle']}>输入内容后会自动保存到草稿箱</span>
        ) : (
          <span className={styles['save-status-idle']}>登录后可自动保存草稿并上传图片</span>
        );
    }
  };

  return (
    <div className={styles['new-container']}>
      <header className={styles['new-header']}>
        <div className={styles['editor-meta']}>
          <span className={styles['editor-eyebrow']}>{articleId ? '编辑文章' : '新建文章'}</span>
          <input
            type="text"
            placeholder="输入文章标题..."
            className={styles['new-input']}
            value={title}
            onChange={handleTitleChange}
          />
        </div>

        <div className={styles['new-button-container']}>
          {renderSaveStatus()}
          <Button className={`${styles['new-button']} ${styles['secondary-button']}`} onClick={handleOpenDrafts}>
            草稿箱
          </Button>
          <Button className={`${styles['new-button']} ${styles['primary-button']}`} onClick={handleOpenPublishModal}>
            发布
          </Button>
        </div>
      </header>

      <main className={styles['new-main']}>
        {isLoadingArticle ? (
          <div className={styles['editor-loading']}>
            <Spin size="large" />
            <span>正在加载文章内容...</span>
          </div>
        ) : (
          <Editor
            value={content}
            locale={zhHans}
            plugins={plugins}
            mode="split"
            onChange={handleEditorChange}
            uploadImages={handleUploadImages}
          />
        )}
      </main>

      {isLoginOpen ? <LoginModal hasClose={!user} toUrl={false} /> : null}

      <Drawer
        title="发布文章"
        placement="right"
        width={420}
        open={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        footer={null}
        destroyOnClose
        rootClassName={styles['publish-drawer']}
        styles={{
          content: { background: 'var(--panel-background)' },
          header: {
            background: 'transparent',
            borderBottom: '1px solid var(--panel-border)',
            padding: '20px 24px',
          },
          body: {
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            overflow: 'hidden',
          },
        }}
      >
        <div className={styles['drawer-body']}>
          <Form<PublishFormValues>
            form={form}
            onFinish={handlePublishConfirm}
            layout="vertical"
            className={styles['publish-form']}
          >
            <div className={styles['form-section']}>
              <div className={styles['form-section-title']}>基本信息</div>
              <Form.Item name="title" label="文章标题" rules={[{ required: true, message: '请输入文章标题' }]}>
                <Input placeholder="请输入文章标题" />
              </Form.Item>
              <Form.Item
                name="category"
                label="文章分类"
                rules={[{ required: true, message: '请选择文章分类' }]}
              >
                <Select placeholder="请选择分类" popupClassName={styles['select-dropdown']}>
                  {availableCategories.map((itemCategory) => (
                    <Select.Option key={itemCategory} value={itemCategory}>
                      {itemCategory}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
            <div className={styles['form-section']}>
              <div className={styles['form-section-title']}>补充信息</div>
              <Form.Item name="tags" label="标签">
                <Select mode="tags" placeholder="输入标签后回车确认" tokenSeparators={[',']} popupClassName={styles['select-dropdown']} />
              </Form.Item>
              <Form.Item name="description" label="文章摘要">
                <Input.TextArea
                  placeholder="请输入文章摘要（200 字以内）"
                  maxLength={200}
                  showCount
                  rows={4}
                />
              </Form.Item>
            </div>
          </Form>
        </div>
        <div className={styles['drawer-footer']}>
          <Button onClick={() => setIsPublishModalOpen(false)}>取消</Button>
          <Button type="primary" onClick={() => form.submit()} className={styles['publish-submit-button']}>
            确认发布
          </Button>
        </div>
      </Drawer>
    </div>
  );
};

export default New;
