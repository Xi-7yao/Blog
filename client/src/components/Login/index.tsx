import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PasswordLoginRequest, RegisterRequest } from '../../type/login';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import styles from './index.module.css';

const LoginModal = ( {hasClose = true, toUrl = true}: {hasClose?: boolean, toUrl?: boolean} ) => {
  const { isLoginOpen, setIsLoginOpen, login, register } = useAuth();
  const [form] = Form.useForm();
  const [error, setError] = useState('');
  const [actionType, setActionType] = useState<'login' | 'register'>('login');

  const handleSubmit = async (values: PasswordLoginRequest) => {
    // console.log(values)
    setError('');
    try {
      if (actionType === 'login') {
        await login(values);
        message.success('登录成功');
      } else {
        await register(values as RegisterRequest);
        message.success('注册成功');
      }
      form.resetFields();
      if(toUrl) window.location.href = '/';
    } catch (err: any) {
      setError(err.message || `${actionType === 'login' ? '登录' : '注册'}失败`);
      message.error(err.message || `${actionType === 'login' ? '登录' : '注册'}失败`);
    }
  };

    // 监听 ESC 键
  useEffect(() => {
    if (!isLoginOpen) return; // 模态框关闭时不注册监听

    const handleESCDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation(); // 防止冒泡到 New.tsx
        setIsLoginOpen(false);
      }
    };

    window.addEventListener('keydown', handleESCDown);
    return () => {
      window.removeEventListener('keydown', handleESCDown);
    };
  }, [isLoginOpen, setIsLoginOpen]);

  if (!isLoginOpen) return null;

  return (
    <div className={styles['login-overlay']}>
      <div className={styles['login-container']}>
        <div className={styles['login-head']}>
          <div className={styles['login-text']}>邮箱登录 / 注册</div>
          {hasClose? (
            <CloseOutlined
              onClick={() => setIsLoginOpen(false)}
              className={styles['close-icon']}
            />
          ) : null}
        </div>
        <div className={styles['login-body']}>
          {error && <p className={styles['error-message']}>{error}</p>}
          <Form
            form={form}
            onFinish={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setActionType('login');
                form.submit();
              }
            }}
            layout="vertical"
            className={styles['login-form']}
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}
            >
              <Input
                placeholder="请输入邮箱"
                className={styles['custom-input']}
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                placeholder="请输入密码"
                className={styles['custom-input']}
              />
            </Form.Item>
            <Form.Item>
              <div className={styles['button-group']}>
                <Button
                  className={styles['submit-button']}
                  onClick={() => {
                    setActionType('register');
                    form.submit();
                  }}
                >
                  注册
                </Button>
                <Button
                  type="primary"
                  className={styles['submit-button']}
                  onClick={() => {
                    setActionType('login');
                    form.submit();
                  }}
                >
                  登录
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
