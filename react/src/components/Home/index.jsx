import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { profile } from '../../api/auth.jsx';
import { listProjects, createProject } from '../../api/projects.jsx';
import { listAssets, uploadAsset } from '../../api/assets.jsx';
import { listHistory, addHistory } from '../../api/history.jsx';

function formatBytes(bytes) {
  const b = Number(bytes || 0);
  if (!b) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), units.length - 1);
  const val = b / Math.pow(1024, i);
  return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${units[i]}`;
}

export const Home = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [member, setMember] = useState(null);

  const [projects, setProjects] = useState([]);
  const [creatingTitle, setCreatingTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [listError, setListError] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(false);

  const [assets, setAssets] = useState([]);
  const [assetFile, setAssetFile] = useState(null);

  const [history, setHistory] = useState([]);

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      try {
        const m = await profile();
        if (!cancelled) {
          setMember(m);
        }
      } catch (_) {
        if (!cancelled) {
          setMember(null);
        }
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    }
    checkAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!member) return;
    (async () => {
      try {
        setListError('');
        const items = await listProjects();
        setProjects(items);
        if (items.length && !selectedProjectId) setSelectedProjectId(items[0].id);
      } catch (err) {
        setListError(err?.response?.data?.detail || err.message || 'Ошибка загрузки проектов');
      }
    })();
  }, [member]);

  useEffect(() => {
    if (!member || !selectedProjectId) {
      setAssets([]);
      setHistory([]);
      return;
    }
    (async () => {
      try {
        const [a, h] = await Promise.all([
          listAssets(selectedProjectId),
          listHistory(selectedProjectId),
        ]);
        setAssets(a);
        setHistory(h);
      } catch (err) {
        // Show error softly in actionError area
        setActionError(err?.response?.data?.detail || err.message || 'Ошибка загрузки данных проекта');
      }
    })();
  }, [member, selectedProjectId]);

  const onCreateProject = async (e) => {
    e.preventDefault();
    if (!creatingTitle.trim()) return;
    setLoading(true);
    setActionError('');
    try {
      const created = await createProject({ title: creatingTitle.trim() });
      setProjects((prev) => [created, ...prev]);
      setCreatingTitle('');
      setSelectedProjectId(created.id);
    } catch (err) {
      setActionError(err?.response?.data?.detail || err.message || 'Не удалось создать проект');
    } finally {
      setLoading(false);
    }
  };

  const onUpload = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !assetFile) return;
    setLoading(true);
    setActionError('');
    try {
      const up = await uploadAsset(selectedProjectId, assetFile);
      setAssets((prev) => [up, ...prev]);
      setAssetFile(null);
      // refresh projects list to update assets_count if shown later
    } catch (err) {
      setActionError(err?.response?.data?.detail || err.message || 'Не удалось загрузить файл');
    } finally {
      setLoading(false);
    }
  };

  const doHistory = async (action) => {
    if (!selectedProjectId) return;
    setLoading(true);
    setActionError('');
    const defaultParams = {
      trim: { start: 0, end: 5 },
      merge: { clips: [] },
      add_text: { text: 'Текст', at: 0 },
      crop: { x: 0, y: 0, width: 100, height: 100 },
    };
    try {
      const item = await addHistory(selectedProjectId, { action, params: defaultParams[action] });
      setHistory((prev) => [item, ...prev]);
    } catch (err) {
      setActionError(err?.response?.data?.detail || err.message || 'Не удалось добавить запись истории');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-easytag="id5-src/components/Home/index.jsx" className="home-page">
      <style>
        {`
          .home-page { background: #0b1220; color: #e7ecf7; min-height: calc(100vh - 60px); font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
          .workspace { max-width: 1200px; margin: 0 auto; padding: 18px 24px; }
          .toolbar { background: #111a2e; border: 1px solid #1f2a44; border-radius: 12px; padding: 10px 12px; display: flex; gap: 10px; align-items: center; justify-content: space-between; }
          .toolbar .links { display: flex; gap: 14px; }
          .toolbar a { color: #8ab4ff; text-decoration: none; }
          .toolbar a:hover { text-decoration: underline; }
          .grid { margin-top: 14px; display: grid; grid-template-columns: 300px 1fr 360px; gap: 12px; }
          .panel { background: #0e1526; border: 1px solid #1f2a44; border-radius: 12px; padding: 12px; }
          .panel h3 { margin: 0 0 10px 0; font-size: 14px; color: #c9d4f1; }
          .viewer { height: 360px; display: grid; place-items: center; color: #9fb0d3; border-style: dashed; }
          .timeline { margin-top: 12px; background: #0e1526; border: 1px solid #1f2a44; border-radius: 12px; padding: 12px; height: 140px; color: #9fb0d3; }
          .muted { color: #9fb0d3; }
          .error { background: rgba(239,68,68,0.12); color: #fecaca; border: 1px solid rgba(239,68,68,0.35); padding: 8px 10px; border-radius: 10px; font-size: 13px; margin-bottom: 10px; }
          .field { display: grid; gap: 6px; margin-bottom: 10px; }
          .input, .select { width: 100%; padding: 10px 12px; border: 1px solid #263555; border-radius: 10px; background: #0e1526; color: #e7ecf7; }
          .btn { padding: 10px 12px; border-radius: 10px; background: #2563eb; color: #fff; border: none; cursor: pointer; font-weight: 600; }
          .btn[disabled] { opacity: .6; cursor: not-allowed; }
          .ghost { background: rgba(255,255,255,0.06); color: #c9d4f1; }
          .list { display: grid; gap: 8px; max-height: 180px; overflow: auto; }
          .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; background: #0b1325; border: 1px solid #1f2a44; border-radius: 10px; padding: 8px 10px; }
          .row .meta { display: grid; }
          .row a { color: #8ab4ff; text-decoration: none; }
          .actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .action-btn { padding: 10px; border-radius: 10px; background: #111a2e; border: 1px solid #1f2a44; color: #c9d4f1; cursor: pointer; }
          .action-btn:hover { background: #14203a; color: #fff; }
          @media (max-width: 1024px) { 
            .workspace { padding: 12px; }
            .grid { grid-template-columns: 1fr; }
            .timeline { height: auto; }
          }
        `}
      </style>
      <div className="workspace">
        <div className="toolbar">
          <div>Рабочая область видеоредактора (заглушка)</div>
          <div className="links">
            <Link to="/instruction">Инструкция</Link>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </div>
        </div>

        <div className="grid">
          <div className="panel">
            <h3>Медиа и проекты</h3>
            {!authChecked ? (
              <div className="muted">Проверка авторизации…</div>
            ) : member ? (
              <>
                {listError ? <div className="error">{listError}</div> : null}

                <form onSubmit={onCreateProject}>
                  <div className="field">
                    <label>Название проекта</label>
                    <input className="input" value={creatingTitle} onChange={(e) => setCreatingTitle(e.target.value)} placeholder="Например, Рекламный ролик" />
                  </div>
                  <button className="btn" type="submit" disabled={loading || !creatingTitle.trim()}>
                    {loading ? 'Создаем…' : 'Создать проект'}
                  </button>
                </form>

                <div style={{ height: 10 }} />
                <div className="field">
                  <label>Текущий проект</label>
                  <select
                    className="select"
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(Number(e.target.value) || null)}
                  >
                    <option value="">— выберите проект —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Загрузка видео (MP4, ≤ 50MB)</label>
                  <input
                    className="input"
                    type="file"
                    accept="video/mp4"
                    onChange={(e) => setAssetFile(e.target.files?.[0] || null)}
                    disabled={!selectedProjectId}
                  />
                  <button className="btn" onClick={onUpload} disabled={!assetFile || !selectedProjectId || loading}>
                    {loading ? 'Загружаем…' : 'Загрузить'}
                  </button>
                </div>

                <div className="field">
                  <label>Файлы проекта</label>
                  <div className="list" aria-live="polite">
                    {assets.length === 0 ? (
                      <div className="muted">Файлы отсутствуют</div>
                    ) : (
                      assets.map((a) => (
                        <div className="row" key={a.id}>
                          <div className="meta">
                            <strong>{a.original_name}</strong>
                            <span className="muted">{formatBytes(a.size)} • {a.mime}</span>
                          </div>
                          {a.file ? <a href={a.file} target="_blank" rel="noreferrer" className="ghost">Открыть</a> : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="muted">
                Для работы с проектами необходимо <Link to="/login">войти</Link> или <Link to="/register">зарегистрироваться</Link>.
              </div>
            )}
          </div>

          <div className="panel viewer">
            Просмотр видео / Канва (будет реализовано позже)
          </div>

          <div className="panel">
            <h3>История и действия</h3>
            {actionError ? <div className="error">{actionError}</div> : null}
            <div className="actions">
              <button className="action-btn" onClick={() => doHistory('trim')} disabled={!selectedProjectId || loading}>Обрезка</button>
              <button className="action-btn" onClick={() => doHistory('merge')} disabled={!selectedProjectId || loading}>Склейка</button>
              <button className="action-btn" onClick={() => doHistory('add_text')} disabled={!selectedProjectId || loading}>Добавить текст</button>
              <button className="action-btn" onClick={() => doHistory('crop')} disabled={!selectedProjectId || loading}>Кадрирование</button>
            </div>
            <div style={{ height: 10 }} />
            <div className="list">
              {history.length === 0 ? (
                <div className="muted">История пуста</div>
              ) : (
                history.map((h) => (
                  <div className="row" key={h.id}>
                    <div>
                      <strong>{h.action}</strong>
                      <div className="muted">#{h.id}</div>
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>{new Date(h.created_at).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="timeline">
          Таймлайн проекта — дорожки видео и текста (заглушка)
        </div>
      </div>
    </div>
  );
};
