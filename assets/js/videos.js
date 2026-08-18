import { upload } from 'https://esm.sh/@vercel/blob@0.27.1/client';

const API_URL = '/api/videos';
const UPLOAD_URL = '/api/upload';

const videoList = document.querySelector('[data-video-list]');

if (videoList) {
  const emptyMsg = document.querySelector('[data-videos-empty]');
  const lockBtn = document.querySelector('[data-videos-lock-btn]');
  const addForm = document.querySelector('[data-video-add-form]');
  const titleInput = document.querySelector('[data-video-title-input]');
  const urlInput = document.querySelector('[data-video-url-input]');
  const fileInput = document.querySelector('[data-video-file-input]');
  const sourceBtns = document.querySelectorAll('[data-video-source-btn]');
  const submitLabel = document.querySelector('[data-video-submit-label]');
  const formMsg = document.querySelector('[data-video-form-msg]');

  const modalContainer = document.querySelector('[data-videos-modal-container]');
  const overlay = document.querySelector('[data-videos-overlay]');
  const modalCloseBtn = document.querySelector('[data-videos-modal-close-btn]');
  const passwordForm = document.querySelector('[data-videos-password-form]');
  const passwordInput = document.querySelector('[data-videos-password-input]');
  const modalError = document.querySelector('[data-videos-modal-error]');

  let sessionPassword = null; // kept only in memory for this page load, never persisted
  let sourceMode = 'link';

  const escapeHtml = (str) => {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  };

  const toggleModal = () => {
    modalContainer.classList.toggle('active');
    overlay.classList.toggle('active');
  };

  const setUnlockedUI = (unlocked) => {
    lockBtn.classList.toggle('unlocked', unlocked);
    lockBtn.setAttribute('aria-label', unlocked ? 'Bloquear administración de videos' : 'Administrar videos');
    lockBtn.querySelector('ion-icon').setAttribute('name', unlocked ? 'lock-open-outline' : 'lock-closed-outline');
    addForm.style.display = unlocked ? 'block' : 'none';
    videoList.querySelectorAll('[data-video-delete-btn]').forEach((btn) => {
      btn.style.display = unlocked ? 'flex' : 'none';
    });
  };

  const setSourceMode = (mode) => {
    sourceMode = mode;
    sourceBtns.forEach((btn) => {
      const active = btn.dataset.videoSourceBtn === mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    if (mode === 'link') {
      urlInput.style.display = 'block';
      urlInput.required = true;
      fileInput.style.display = 'none';
      fileInput.required = false;
      fileInput.value = '';
      submitLabel.textContent = 'Agregar';
    } else {
      urlInput.style.display = 'none';
      urlInput.required = false;
      fileInput.style.display = 'block';
      fileInput.required = true;
      submitLabel.textContent = 'Subir';
    }
  };

  const renderContentMedia = (video) => {
    if (video.kind === 'image') {
      return `<img src="${escapeHtml(video.embed_url)}" alt="${escapeHtml(video.title)}" loading="lazy">`;
    }
    return (
      `<iframe src="${escapeHtml(video.embed_url)}" title="${escapeHtml(video.title)}" loading="lazy" ` +
      'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
    );
  };

  const renderVideos = (videos) => {
    videoList.innerHTML = '';
    emptyMsg.style.display = videos.length ? 'none' : 'block';

    videos.forEach((video) => {
      const li = document.createElement('li');
      li.className = 'video-item';

      li.innerHTML =
        `<div class="video-frame">${renderContentMedia(video)}</div>` +
        '<div class="video-info">' +
        `<h3 class="video-title">${escapeHtml(video.title)}</h3>` +
        '<button class="video-delete-btn" data-video-delete-btn type="button" title="Eliminar" aria-label="Eliminar" style="display:none;">' +
        '<ion-icon name="trash-outline"></ion-icon>' +
        '</button>' +
        '</div>';

      li.querySelector('[data-video-delete-btn]').addEventListener('click', () => deleteVideo(video.id));
      videoList.appendChild(li);
    });

    setUnlockedUI(Boolean(sessionPassword));
  };

  async function loadVideos() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('fetch failed');
      const videos = await res.json();
      renderVideos(videos);
    } catch (err) {
      emptyMsg.textContent = 'No se pudo cargar el contenido. Intenta de nuevo más tarde.';
      emptyMsg.style.display = 'block';
    }
  }

  async function deleteVideo(id) {
    if (!sessionPassword) return;
    if (!window.confirm('¿Eliminar este elemento?')) return;

    try {
      const res = await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: sessionPassword, id }),
      });

      if (res.status === 401) {
        sessionPassword = null;
        setUnlockedUI(false);
        window.alert('La sesión de administrador ya no es válida. Vuelve a desbloquear.');
        return;
      }

      if (!res.ok) throw new Error('delete failed');
      loadVideos();
    } catch (err) {
      window.alert('No se pudo eliminar.');
    }
  }

  sourceBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      formMsg.textContent = '';
      formMsg.className = 'video-form-msg';
      setSourceMode(btn.dataset.videoSourceBtn);
    });
  });

  lockBtn.addEventListener('click', () => {
    if (sessionPassword) {
      sessionPassword = null;
      setUnlockedUI(false);
      return;
    }

    modalError.textContent = '';
    passwordInput.value = '';
    toggleModal();
    setTimeout(() => passwordInput.focus(), 150);
  });

  modalCloseBtn.addEventListener('click', toggleModal);
  overlay.addEventListener('click', toggleModal);

  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = passwordInput.value;
    const submitBtn = passwordForm.querySelector('.form-btn');
    submitBtn.disabled = true;
    modalError.textContent = '';

    try {
      const res = await fetch(`${API_URL}?action=verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        modalError.textContent = 'Contraseña incorrecta.';
        return;
      }

      sessionPassword = password;
      setUnlockedUI(true);
      toggleModal();
    } catch (err) {
      modalError.textContent = 'Error de conexión. Intenta de nuevo.';
    } finally {
      submitBtn.disabled = false;
    }
  });

  async function createEntry(url) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: sessionPassword,
        title: titleInput.value.trim(),
        url,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      sessionPassword = null;
      setUnlockedUI(false);
      throw new Error('Sesión expirada. Vuelve a desbloquear.');
    }

    if (!res.ok) {
      throw new Error(data.error || 'No se pudo agregar.');
    }
  }

  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!sessionPassword) return;

    const submitBtn = addForm.querySelector('.form-btn');
    submitBtn.disabled = true;
    formMsg.textContent = '';
    formMsg.className = 'video-form-msg';

    try {
      if (sourceMode === 'link') {
        await createEntry(urlInput.value.trim());
      } else {
        const file = fileInput.files[0];
        if (!file) throw new Error('Selecciona un archivo.');

        formMsg.textContent = 'Subiendo archivo...';
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: UPLOAD_URL,
          clientPayload: JSON.stringify({ password: sessionPassword }),
        });

        await createEntry(blob.url);
      }

      titleInput.value = '';
      urlInput.value = '';
      fileInput.value = '';
      formMsg.textContent = 'Agregado correctamente.';
      formMsg.classList.add('success');
      loadVideos();
    } catch (err) {
      formMsg.textContent = err.message || 'Error de conexión. Intenta de nuevo.';
      formMsg.classList.add('error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  setSourceMode('link');
  loadVideos();
}
