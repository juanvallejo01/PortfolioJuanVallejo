'use strict';

(function () {
  const API_URL = '/api/videos';

  const videoList = document.querySelector('[data-video-list]');
  if (!videoList) return;

  const emptyMsg = document.querySelector('[data-videos-empty]');
  const lockBtn = document.querySelector('[data-videos-lock-btn]');
  const addForm = document.querySelector('[data-video-add-form]');
  const titleInput = document.querySelector('[data-video-title-input]');
  const urlInput = document.querySelector('[data-video-url-input]');
  const formMsg = document.querySelector('[data-video-form-msg]');

  const modalContainer = document.querySelector('[data-videos-modal-container]');
  const overlay = document.querySelector('[data-videos-overlay]');
  const modalCloseBtn = document.querySelector('[data-videos-modal-close-btn]');
  const passwordForm = document.querySelector('[data-videos-password-form]');
  const passwordInput = document.querySelector('[data-videos-password-input]');
  const modalError = document.querySelector('[data-videos-modal-error]');

  let sessionPassword = null; // kept only in memory for this page load, never persisted

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  function toggleModal() {
    modalContainer.classList.toggle('active');
    overlay.classList.toggle('active');
  }

  function setUnlockedUI(unlocked) {
    lockBtn.classList.toggle('unlocked', unlocked);
    lockBtn.setAttribute('aria-label', unlocked ? 'Bloquear administración de videos' : 'Administrar videos');
    lockBtn.querySelector('ion-icon').setAttribute('name', unlocked ? 'lock-open-outline' : 'lock-closed-outline');
    addForm.style.display = unlocked ? 'block' : 'none';
    videoList.querySelectorAll('[data-video-delete-btn]').forEach((btn) => {
      btn.style.display = unlocked ? 'flex' : 'none';
    });
  }

  function renderVideos(videos) {
    videoList.innerHTML = '';

    if (!videos.length) {
      emptyMsg.style.display = 'block';
    } else {
      emptyMsg.style.display = 'none';
    }

    videos.forEach((video) => {
      const li = document.createElement('li');
      li.className = 'video-item';

      li.innerHTML =
        '<div class="video-frame">' +
        '<iframe src="' + escapeHtml(video.embed_url) + '" title="' + escapeHtml(video.title) + '" loading="lazy" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>' +
        '</div>' +
        '<div class="video-info">' +
        '<h3 class="video-title">' + escapeHtml(video.title) + '</h3>' +
        '<button class="video-delete-btn" data-video-delete-btn type="button" title="Eliminar video" aria-label="Eliminar video" style="display:none;">' +
        '<ion-icon name="trash-outline"></ion-icon>' +
        '</button>' +
        '</div>';

      li.querySelector('[data-video-delete-btn]').addEventListener('click', () => deleteVideo(video.id));
      videoList.appendChild(li);
    });

    setUnlockedUI(Boolean(sessionPassword));
  }

  async function loadVideos() {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('fetch failed');
      const videos = await res.json();
      renderVideos(videos);
    } catch (err) {
      emptyMsg.textContent = 'No se pudieron cargar los videos. Intenta de nuevo más tarde.';
      emptyMsg.style.display = 'block';
    }
  }

  async function deleteVideo(id) {
    if (!sessionPassword) return;
    if (!window.confirm('¿Eliminar este video?')) return;

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
      window.alert('No se pudo eliminar el video.');
    }
  }

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
      const res = await fetch(API_URL + '?action=verify', {
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

  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!sessionPassword) return;

    const submitBtn = addForm.querySelector('.form-btn');
    submitBtn.disabled = true;
    formMsg.textContent = '';
    formMsg.className = 'video-form-msg';

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: sessionPassword,
          title: titleInput.value.trim(),
          url: urlInput.value.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        sessionPassword = null;
        setUnlockedUI(false);
        formMsg.textContent = 'Sesión expirada. Vuelve a desbloquear.';
        formMsg.classList.add('error');
        return;
      }

      if (!res.ok) {
        formMsg.textContent = data.error || 'No se pudo agregar el video.';
        formMsg.classList.add('error');
        return;
      }

      titleInput.value = '';
      urlInput.value = '';
      formMsg.textContent = 'Video agregado.';
      formMsg.classList.add('success');
      loadVideos();
    } catch (err) {
      formMsg.textContent = 'Error de conexión. Intenta de nuevo.';
      formMsg.classList.add('error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  loadVideos();
})();
