import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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
  const [uploadProgress, setUploadProgress] = useState(0);

  const [history, setHistory] = useState([]);

  // Editor state
  const [activeAssetId, setActiveAssetId] = useState(null);
  const activeAsset = useMemo(() => assets.find(a => a.id === activeAssetId) || null, [assets, activeAssetId]);

  // Trim state
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [trimPreviewOn, setTrimPreviewOn] = useState(false);

  // Text overlay state
  const [textEnabled, setTextEnabled] = useState(false);
  const [textValue, setTextValue] = useState('Заголовок');
  const [textSize, setTextSize] = useState(24);
  const [textColor, setTextColor] = useState('#ffffff');
  const [textX, setTextX] = useState(10); // percent
  const [textY, setTextY] = useState(10); // percent

  // Crop state (percentages)
  const [cropEnabled, setCropEnabled] = useState(false);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(100);
  const [cropH, setCropH] = useState(100);

  // Merge (playlist) state
  const [mergeSelection, setMergeSelection] = useState([]); // array of asset ids in order
  const [mergePreviewOn, setMergePreviewOn] = useState(false);

  const videoRef = useRef(null);

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
    return () => { cancelled = true; };
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
      setActiveAssetId(null);
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
        if (a.length) {
          setActiveAssetId(a[0].id);
        }
      } catch (err) {
        setActionError(err?.response?.data?.detail || err.message || 'Ошибка загрузки данных проекта');
      }
    })();
  }, [member, selectedProjectId]);

  // Reset editor controls when switching asset
  useEffect(() => {
    setTrimStart(0);
    setTrimEnd(0);
    setTrimPreviewOn(false);
    setTextEnabled(false);
    setTextValue('Заголовок');
    setTextSize(24);
    setTextColor('#ffffff');
    setTextX(10);
    setTextY(10);
    setCropEnabled(false);
    setCropX(0);
    setCropY(0);
    setCropW(100);
    setCropH(100);
  }, [activeAssetId]);

  // Handle trim looping
  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!trimPreviewOn) return;
    const end = trimEnd > 0 ? trimEnd : v.duration || 0;
    if (end && v.currentTime > end) {
      v.currentTime = Math.max(0, trimStart || 0);
      v.play().catch(() => {});
    }
  }, [trimPreviewOn, trimStart, trimEnd]);

  const onLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!trimEnd || trimEnd <= 0) {
      if (!Number.isNaN(v.duration)) setTrimEnd(Math.max(0, Math.floor(v.duration)));
    }
  }, []);

  const startTrimPreview = () => {
    const v = videoRef.current;
    if (!v) return;
    const start = Math.max(0, Number(trimStart) || 0);
    const end = Number(trimEnd) || v.duration || 0;
    if (end && start >= end) return;
    v.currentTime = start;
    setTrimPreviewOn(true);
    v.play().catch(() => {});
  };

  const stopTrimPreview = () => {
    setTrimPreviewOn(false);
  };

  const applySaveTrim = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setActionError('');
    try {
      const params = { start: Math.max(0, Number(trimStart) || 0), end: Math.max(0, Number(trimEnd) || 0) };
      const item = await addHistory(selectedProjectId, { action: 'trim', params });
      setHistory(prev => [item, ...prev]);
    } catch (err) {
      setActionError(err?.response?.data?.detail || err.message || 'Не удалось сохранить обрезку');
    } finally {
      setLoading(false);
    }
  };

  const applySaveText = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setActionError('');
    try {
      const params = { text: textValue, size: Number(textSize) || 24, color: textColor, x: Number(textX) || 0, y: Number(textY) || 0 };
      const item = await addHistory(selectedProjectId, { action: 'add_text', params });
      setHistory(prev => [item, ...prev]);
    } catch (err) {
      setActionError(err?.response?.data?.detail || err.message || 'Не удалось сохранить текст');
    } finally {
      setLoading(false);
    }
  };

  const applySaveCrop = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setActionError('');
    try {
      const params = { x: Number(cropX) || 0, y: Number(cropY) || 0, width: Number(cropW) || 100, height: Number(cropH) || 100 };
      const item = await addHistory(selectedProjectId, { action: 'crop', params });
      setHistory(prev => [item, ...prev]);
    } catch (err) {
      setActionError(err?.response?.data?.detail || err.message || 'Не удалось сохранить кадрирование');
    } finally {
      setLoading(false);
    }
  };

  const toggleInMerge = (assetId) => {
    setMergeSelection(prev => {
      if (prev.includes(assetId)) return prev.filter(id => id !== assetId);
      return [...prev, assetId];
    });
  };

  const startMergePreview = () => {
    if (!mergeSelection.length) return;
    setMergePreviewOn(true);
    setActiveAssetId(mergeSelection[0]);
    // play will trigger from metadata/controls
    setTimeout(() => videoRef.current?.play().catch(() => {}), 50);
  };

  const stopMergePreview = () => {
    setMergePreviewOn(false);
  };

  const onEnded = () => {
    if (!mergePreviewOn) return;
    const idx = mergeSelection.findIndex(id => id === activeAssetId);
    if (idx >= 0 && idx < mergeSelection.length - 1) {
      const nextId = mergeSelection[idx + 1];
      setActiveAssetId(nextId);
      setTimeout(() => videoRef.current?.play().catch(() => {}), 50);
    } else {
      setMergePreviewOn(false);
    }
  };

  const applySaveMerge = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    setActionError('');
    try {
      const params = { clips: mergeSelection };
      const item = await addHistory(selectedProjectId, { action: 'merge', params });
      setHistory(prev => [item, ...prev]);
    } catch (err) {
      setActionError(err?.response?.data?.detail || err.message || 'Не удалось сохранить склейку');
    } finally {
      setLoading(false);
    }
  };

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
    setUploadProgress(0);
    setActionError('');
    try {
      const up = await uploadAsset(selectedProjectId, assetFile, (p) => setUploadProgress(p));
      setAssets((prev) => [up, ...prev]);
      setAssetFile(null);
      setActiveAssetId(up.id);
    } catch (err) {
      setActionError(err?.response?.data?.detail || err.message || 'Не удалось загрузить файл');
    } finally {
      setLoading(false);
    }
  };

  // Derived video styles for overlays
  const cropStyle = cropEnabled ? {
    clipPath: `inset(${Math.max(0, Math.min(100, cropY))}% ${Math.max(0, Math.min(100, 100 - (cropX + cropW)))}% ${Math.max(0, Math.min(100, 100 - (cropY + cropH)))}% ${Math.max(0, Math.min(100, cropX))}%)`
  } : {};

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
          .grid { margin-top: 14px; display: grid; grid-template-columns: 300px 1fr 380px; gap: 12px; }
          .panel { background: #0e1526; border: 1px solid #1f2a44; border-radius: 12px; padding: 12px; }
          .panel h3 { margin: 0 0 10px 0; font-size: 14px; color: #c9d4f1; }
          .viewer { height: 360px; display: grid; place-items: center; color: #9fb0d3; border-style: dashed; position: relative; overflow: hidden; }
          .video-wrap { width: 100%; height: 100%; position: relative; background: #0b1325; border-radius: 10px; overflow: hidden; display: grid; place-items: center; }
          video { width: 100%; height: 100%; object-fit: contain; }
          .overlay-text { position: absolute; transform: translate(-50%, -50%); white-space: pre-wrap; text-shadow: 0 2px 8px rgba(0,0,0,0.6); pointer-events: none; }
          .timeline { margin-top: 12px; background: #0e1526; border: 1px solid #1f2a44; border-radius: 12px; padding: 12px; min-height: 140px; color: #9fb0d3; }
          .muted { color: #9fb0d3; }
          .error { background: rgba(239,68,68,0.12); color: #fecaca; border: 1px solid rgba(239,68,68,0.35); padding: 8px 10px; border-radius: 10px; font-size: 13px; margin-bottom: 10px; }
          .field { display: grid; gap: 6px; margin-bottom: 10px; }
          .inline { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .input, .select { width: 100%; padding: 10px 12px; border: 1px solid #263555; border-radius: 10px; background: #0e1526; color: #e7ecf7; }
          .btn { padding: 10px 12px; border-radius: 10px; background: #2563eb; color: #fff; border: none; cursor: pointer; font-weight: 600; }
          .btn[disabled] { opacity: .6; cursor: not-allowed; }
          .ghost { background: rgba(255,255,255,0.06); color: #c9d4f1; }
          .list { display: grid; gap: 8px; max-height: 200px; overflow: auto; }
          .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; background: #0b1325; border: 1px solid #1f2a44; border-radius: 10px; padding: 8px 10px; }
          .row .meta { display: grid; }
          .row a { color: #8ab4ff; text-decoration: none; }
          .actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .action-btn { padding: 10px; border-radius: 10px; background: #111a2e; border: 1px solid #1f2a44; color: #c9d4f1; cursor: pointer; }
          .action-btn:hover { background: #14203a; color: #fff; }
          .tool-block { background: #0b1325; border: 1px solid #1f2a44; border-radius: 10px; padding: 10px; margin-bottom: 10px; }
          .chips { display: flex; gap: 6px; flex-wrap: wrap; }
          .chip { background: #111a2e; border: 1px solid #1f2a44; color: #c9d4f1; padding: 6px 10px; border-radius: 999px; cursor: pointer; }
          .chip.active { background: rgba(59,130,246,0.18); color: #fff; border-color: rgba(59,130,246,0.6); }
          @media (max-width: 1024px) { .workspace { padding: 12px; } .grid { grid-template-columns: 1fr; } .timeline { min-height: auto; } }
        `}
      </style>
      <div className="workspace">
        <div className="toolbar">
          <div>Рабочая область видеоредактора</div>
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
                  <select className="select" value={selectedProjectId || ''} onChange={(e) => setSelectedProjectId(Number(e.target.value) || null)}>
                    <option value="">— выберите проект —</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Загрузка видео (MP4, ≤ 50MB)</label>
                  <input className="input" type="file" accept="video/mp4" onChange={(e) => setAssetFile(e.target.files?.[0] || null)} disabled={!selectedProjectId} />
                  <button className="btn" onClick={onUpload} disabled={!assetFile || !selectedProjectId || loading}>
                    {loading ? 'Загружаем…' : 'Загрузить'}
                  </button>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {uploadProgress > 0 && uploadProgress < 1 ? `${Math.round(uploadProgress * 100)}%` : ''}
                  </div>
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
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className={`chip ${activeAssetId === a.id ? 'active' : ''}`} onClick={() => setActiveAssetId(a.id)}>
                              Предпросмотр
                            </button>
                            {a.file ? <a href={a.file} target="_blank" rel="noreferrer" className="ghost" style={{ padding: '6px 10px', borderRadius: 999 }}>Открыть</a> : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="field">
                  <label>Склейка (плейлист)</label>
                  <div className="chips">
                    {assets.map(a => (
                      <button key={a.id} className={`chip ${mergeSelection.includes(a.id) ? 'active' : ''}`} onClick={() => toggleInMerge(a.id)}>
                        #{a.id}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn" onClick={startMergePreview} disabled={!mergeSelection.length}>Предпросмотр склейки</button>
                    <button className="ghost btn" onClick={stopMergePreview} type="button">Стоп</button>
                    <button className="btn" onClick={applySaveMerge} disabled={!mergeSelection.length || loading}>Сохранить склейку</button>
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
            {activeAsset ? (
              <div className="video-wrap">
                <video
                  ref={videoRef}
                  src={activeAsset.file}
                  controls
                  onTimeUpdate={onTimeUpdate}
                  onLoadedMetadata={onLoadedMetadata}
                  onEnded={onEnded}
                  style={cropStyle}
                />
                {textEnabled && (
                  <div
                    className="overlay-text"
                    style={{
                      left: `${Math.max(0, Math.min(100, textX))}%`,
                      top: `${Math.max(0, Math.min(100, textY))}%`,
                      color: textColor,
                      fontSize: `${Math.max(8, Math.min(120, textSize))}px`,
                    }}
                  >
                    {textValue}
                  </div>
                )}
              </div>
            ) : (
              <div className="muted">Выберите клип для предпросмотра</div>
            )}
          </div>

          <div className="panel">
            <h3>Инструменты редактирования</h3>
            {actionError ? <div className="error">{actionError}</div> : null}

            <div className="tool-block">
              <strong style={{ display: 'block', marginBottom: 6 }}>Обрезка</strong>
              <div className="inline">
                <div className="field">
                  <label>Начало, сек</label>
                  <input className="input" type="number" step="0.1" min={0} value={trimStart} onChange={(e) => setTrimStart(e.target.value)} />
                </div>
                <div className="field">
                  <label>Конец, сек</label>
                  <input className="input" type="number" step="0.1" min={0} value={trimEnd} onChange={(e) => setTrimEnd(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={startTrimPreview} disabled={!activeAsset}>Предпросмотр</button>
                <button className="ghost btn" type="button" onClick={stopTrimPreview}>Стоп</button>
                <button className="btn" onClick={applySaveTrim} disabled={!activeAsset || loading}>Сохранить</button>
              </div>
            </div>

            <div className="tool-block">
              <strong style={{ display: 'block', marginBottom: 6 }}>Текст поверх</strong>
              <div className="field" style={{ alignItems: 'start' }}>
                <label><input type="checkbox" checked={textEnabled} onChange={(e) => setTextEnabled(e.target.checked)} /> Показать текст</label>
              </div>
              <div className="field">
                <label>Текст</label>
                <input className="input" value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Введите текст" />
              </div>
              <div className="inline">
                <div className="field">
                  <label>Размер (px)</label>
                  <input className="input" type="number" min={8} max={120} value={textSize} onChange={(e) => setTextSize(e.target.value)} />
                </div>
                <div className="field">
                  <label>Цвет</label>
                  <input className="input" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
                </div>
              </div>
              <div className="inline">
                <div className="field">
                  <label>X (%)</label>
                  <input className="input" type="number" min={0} max={100} value={textX} onChange={(e) => setTextX(e.target.value)} />
                </div>
                <div className="field">
                  <label>Y (%)</label>
                  <input className="input" type="number" min={0} max={100} value={textY} onChange={(e) => setTextY(e.target.value)} />
                </div>
              </div>
              <div>
                <button className="btn" onClick={applySaveText} disabled={!activeAsset || loading}>Сохранить</button>
              </div>
            </div>

            <div className="tool-block">
              <strong style={{ display: 'block', marginBottom: 6 }}>Кадрирование</strong>
              <div className="field">
                <label><input type="checkbox" checked={cropEnabled} onChange={(e) => setCropEnabled(e.target.checked)} /> Включить предпросмотр</label>
              </div>
              <div className="inline">
                <div className="field">
                  <label>X (%)</label>
                  <input className="input" type="number" min={0} max={100} value={cropX} onChange={(e) => setCropX(e.target.value)} />
                </div>
                <div className="field">
                  <label>Y (%)</label>
                  <input className="input" type="number" min={0} max={100} value={cropY} onChange={(e) => setCropY(e.target.value)} />
                </div>
              </div>
              <div className="inline">
                <div className="field">
                  <label>Ширина (%)</label>
                  <input className="input" type="number" min={1} max={100} value={cropW} onChange={(e) => setCropW(e.target.value)} />
                </div>
                <div className="field">
                  <label>Высота (%)</label>
                  <input className="input" type="number" min={1} max={100} value={cropH} onChange={(e) => setCropH(e.target.value)} />
                </div>
              </div>
              <div>
                <button className="btn" onClick={applySaveCrop} disabled={!activeAsset || loading}>Сохранить</button>
              </div>
            </div>

            <h3>История</h3>
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
          Таймлайн проекта — дорожки видео и текста (предпросмотр параметров)
        </div>
      </div>
    </div>
  );
};

export default Home;
