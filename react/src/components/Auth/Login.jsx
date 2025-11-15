import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../api/auth.jsx';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const extractError = (err) => {
    const data = err?.response?.data;
    if (!data) return err.message || 'Ошибка авторизации';
    if (typeof data === 'string') return data;
    if (data.detail) return String(data.detail);
    if (data.message) return String(data.message);
    if (data.error) return String(data.error);
    if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(' ');
    try { return JSON.stringify(data); } catch (_) { return 'Неизвестная ошибка'; }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ email, password });
      if (res?.token) {
        localStorage.setItem('token', res.token);
      }
      setLoading(false);
      navigate('/');
    } catch (err) {
      setLoading(false);
      setError(extractError(err));
    }
  };

  return (
    <div data-easytag="id2-src/components/Auth/Login.jsx" className="auth-page">
      <style>
        {`
          .auth-page { 
            display: grid; 
            place-items: center; 
            min-height: calc(100vh - 60px); 
            background: #0b1220; 
            color: #e7ecf7; 
            font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; 
          }
          .card { 
            width: 420px; 
            background: #111a2e; 
            border: 1px solid #1f2a44; 
            border-radius: 14px; 
            padding: 26px; 
            box-shadow: 0 8px 24px rgba(0,0,0,0.35); 
          }
          .title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
          .sub { font-size: 13px; color: #9fb0d3; margin-bottom: 18px; }
          form { display: grid; gap: 14px; }
          label { font-size: 13px; color: #c9d4f1; }
          input { 
            width: 100%; 
            padding: 12px 14px; 
            border: 1px solid #263555; 
            border-radius: 10px; 
            background: #0e1526; 
            color: #e7ecf7; 
            outline: none; 
          }
          input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
          .error { background: rgba(239,68,68,0.12); color: #fecaca; border: 1px solid rgba(239,68,68,0.35); padding: 10px 12px; border-radius: 10px; font-size: 13px; }
          .actions { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
          .btn { 
            padding: 12px 16px; 
            border-radius: 10px; 
            background: #2563eb; 
            color: #fff; 
            border: none; 
            cursor: pointer; 
            font-weight: 600; 
          }
          .btn[disabled] { opacity: 0.6; cursor: not-allowed; }
          .link { color: #8ab4ff; text-decoration: none; }
          .link:hover { text-decoration: underline; }
          @media (max-width: 1024px) { .card { width: 92vw; } }
        `}
      </style>
      <div className="card" role="region" aria-label="Форма входа">
        <div className="title">Вход</div>
        <div className="sub">Введите e-mail и пароль для входа в систему.</div>
        {error ? <div className="error" role="alert">{error}</div> : null}
        <form onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              placeholder="Ваш пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div className="actions">
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Входим…' : 'Войти'}</button>
            <Link className="link" to="/register">Нет аккаунта? Регистрация</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
