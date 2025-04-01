// Глобальные переменные для приложения
let playlists = [];
let tracks = [];
let currentPlaylist = null;
let currentTrack = null;
let isPlaying = false;
let isShuffle = false;
let repeatMode = 'none'; // Режим повтора: 'none', 'all', 'one'
let audioPlayer = new Audio();
let volume = 0.8; // Громкость по умолчанию (80%)
let playlistHotkeys = {}; // Хранение горячих клавиш для каждого плейлиста {playlistId: {keyName: trackId}}
let isMicrophoneActive = false; // Режим вывода через микрофон
let playHistory = []; // История воспроизведения для функции "предыдущий трек"

// Устанавливаем начальную громкость
audioPlayer.volume = volume;

// Функция инициализации приложения
function initializeApp() {
  console.log('Инициализация приложения...');
  
  // Загружаем плейлисты из localStorage
  loadPlaylists();
  
  // Удаляем системные плейлисты, если они существуют
  removeSystemPlaylists();
  
  // Загружаем горячие клавиши
  loadHotkeys();
  
  // Загружаем настройки плеера и применяем тему
  loadPlayerSettings();
  
  // Применяем сохраненную тему или темную тему по умолчанию
  const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
  console.log(`Загруженная тема: ${savedTheme}`);
  applyTheme(savedTheme);
  
  // Добавляем код для модального окна для выбора MP3, если его еще нет
  if (!document.getElementById('mp3-select-modal')) {
    // Код для добавления модального окна...
  }
  
  // Настраиваем обработчики событий
  setupEventListeners();
  setupIPCHandlers();
  
  // Обновляем баннер "Сейчас играет"
  updateNowPlayingInfo();
  
  // Отрисовываем плейлисты
  renderPlaylists();
  
  // Активируем первую секцию (плейлисты) при запуске
  switchSection(0);
  
  // Выбираем первый плейлист, если есть плейлисты
  if (playlists.length > 0) {
    console.log('Автоматический выбор первого плейлиста при запуске');
    selectPlaylist(playlists[0].id);
  } else {
    console.log('Нет плейлистов для автоматического выбора');
  }
  
  console.log('Приложение инициализировано!');
}

// Настройка обработчиков событий для пользовательского интерфейса
function setupEventListeners() {
  console.log('Настройка обработчиков событий...');
  
  // Настройка элементов управления окном
  setupWindowControls();
  
  // Настройка навигации
  setupNavigation();
  
  // Настройка управления плейлистами
  setupPlaylistControls();
  
  // Настройка управления треками
  setupTrackControls();
  
  // Настройка управления библиотекой
  setupLibraryControls();
  
  // Настройка управления воспроизведением
  setupPlaybackControls();
  
  // Настройка управления поиском
  setupSearchControls();
  
  // Настройка элементов управления настройками
  setupSettingsControls();
  
  // Глобальные обработчики клавиатуры
  document.addEventListener('keydown', handleKeydown);
  
  console.log('Обработчики событий настроены');
}

// === УПРАВЛЕНИЕ ОКНОМ ===
function setupWindowControls() {
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');
  
  if (minimizeBtn) {
    minimizeBtn.onclick = () => {
      console.log('Нажата кнопка сворачивания окна');
      if (window.electronAPI && window.electronAPI.minimizeWindow) {
        window.electronAPI.minimizeWindow();
      }
    };
  }
  
  if (maximizeBtn) {
    maximizeBtn.onclick = () => {
      console.log('Нажата кнопка разворачивания окна');
      if (window.electronAPI && window.electronAPI.maximizeWindow) {
        window.electronAPI.maximizeWindow();
      }
    };
  }
  
  if (closeBtn) {
    closeBtn.onclick = () => {
      console.log('Нажата кнопка закрытия окна');
      if (window.electronAPI && window.electronAPI.closeWindow) {
        window.electronAPI.closeWindow();
      }
    };
  }
}

// === НАВИГАЦИЯ ===
function setupNavigation() {
  console.log('Настройка навигации...');
  
  // Находим все элементы навигации
  const navItems = document.querySelectorAll('.nav-item');
  console.log(`Найдено ${navItems.length} элементов навигации`);
  
  if (navItems.length === 0) {
    console.error('Элементы навигации не найдены! Проверьте HTML структуру.');
    return;
  }
  
  // Удаляем все обработчики событий с помощью клонирования родительского контейнера
  const navContainer = navItems[0].parentNode;
  if (navContainer) {
    const newNavContainer = navContainer.cloneNode(true);
    navContainer.parentNode.replaceChild(newNavContainer, navContainer);
    
    // Получаем новые ссылки на элементы после клонирования
    const newNavItems = newNavContainer.querySelectorAll('.nav-item');
    
    // Добавляем обработчики событий для новых элементов
    newNavItems.forEach((item, index) => {
      item.addEventListener('click', (e) => {
        console.log(`Клик по элементу навигации ${index}`);
        
        // Удаляем класс активного элемента у всех элементов навигации
        newNavItems.forEach(navItem => navItem.classList.remove('active'));
        
        // Добавляем класс активного элемента текущему элементу
        item.classList.add('active');
        
        // Переключаем секцию
        switchSection(index);
      });
    });
    
    console.log('Обработчики событий навигации установлены успешно');
  } else {
    console.error('Родительский контейнер элементов навигации не найден');
  }
}

// === ПЛЕЙЛИСТЫ ===
function setupPlaylistControls() {
  console.log('Настройка элементов управления плейлистами...');
  
  // Кнопка добавления плейлиста
  const addPlaylistBtn = document.getElementById('add-playlist-btn');
  if (addPlaylistBtn) {
    // Удаляем существующие обработчики для избежания дублирования
    const newAddBtn = addPlaylistBtn.cloneNode(true);
    addPlaylistBtn.parentNode.replaceChild(newAddBtn, addPlaylistBtn);
    
    // Добавляем новый обработчик
    newAddBtn.addEventListener('click', () => {
      console.log('Нажата кнопка добавления плейлиста');
      openModal('create-playlist-modal');
    });
  } else {
    console.error('Кнопка добавления плейлиста не найдена!');
  }
  
  // Кнопки в модальном окне создания плейлиста
  const createPlaylistBtn = document.getElementById('create-playlist-btn');
  const cancelPlaylistBtn = document.getElementById('cancel-playlist-btn');
  const closePlaylistModalBtn = document.querySelector('#create-playlist-modal .close-btn');
  
  if (createPlaylistBtn) {
    // Удаляем существующие обработчики
    const newCreateBtn = createPlaylistBtn.cloneNode(true);
    createPlaylistBtn.parentNode.replaceChild(newCreateBtn, createPlaylistBtn);
    
    // Добавляем новый обработчик
    newCreateBtn.addEventListener('click', createPlaylist);
  } else {
    console.error('Кнопка создания плейлиста не найдена!');
  }
  
  if (cancelPlaylistBtn) {
    // Удаляем существующие обработчики
    const newCancelBtn = cancelPlaylistBtn.cloneNode(true);
    cancelPlaylistBtn.parentNode.replaceChild(newCancelBtn, cancelPlaylistBtn);
    
    // Добавляем новый обработчик
    newCancelBtn.addEventListener('click', () => {
      console.log('Отмена создания плейлиста');
      closeModal('create-playlist-modal');
    });
  }
  
  if (closePlaylistModalBtn) {
    // Удаляем существующие обработчики
    const newCloseBtn = closePlaylistModalBtn.cloneNode(true);
    closePlaylistModalBtn.parentNode.replaceChild(newCloseBtn, closePlaylistModalBtn);
    
    // Добавляем новый обработчик
    newCloseBtn.addEventListener('click', () => {
      console.log('Закрытие модального окна создания плейлиста');
      closeModal('create-playlist-modal');
    });
  }
  
  console.log('Элементы управления плейлистами настроены');
}

// === ТРЕКИ ===
function setupTrackControls() {
  // Кнопки импорта треков
  const importBtn = document.getElementById('import-btn');
  const folderBtn = document.getElementById('folder-btn');
  
  if (importBtn) {
    importBtn.onclick = () => {
      console.log('Нажата кнопка импорта треков');
      importTracks();
    };
  }
  
  if (folderBtn) {
    folderBtn.onclick = () => {
      console.log('Нажата кнопка импорта папки');
      importFolderFiles();
    };
  }
}

// === БИБЛИОТЕКА ===
function setupLibraryControls() {
  console.log('Настройка элементов управления библиотекой...');
  
  // Кнопка импорта в библиотеку
  const importLibraryBtn = document.getElementById('import-library-btn');
  if (importLibraryBtn) {
    // Удаляем существующие обработчики
    const newImportBtn = importLibraryBtn.cloneNode(true);
    importLibraryBtn.parentNode.replaceChild(newImportBtn, importLibraryBtn);
    
    // Добавляем новый обработчик
    newImportBtn.addEventListener('click', () => {
      console.log('Нажата кнопка импорта в библиотеку');
      importLibraryFiles();
    });
  }
  
  // Поле поиска в библиотеке
  const librarySearchInput = document.getElementById('library-search-input');
  if (librarySearchInput) {
    // Удаляем существующие обработчики
    const newSearchInput = librarySearchInput.cloneNode(true);
    librarySearchInput.parentNode.replaceChild(newSearchInput, librarySearchInput);
    
    // Добавляем новый обработчик
    newSearchInput.addEventListener('input', () => {
      console.log('Поиск в библиотеке: ' + newSearchInput.value);
      searchInLibrary(newSearchInput.value);
    });
  }
  
  // Переключатель режима отображения библиотеки
  const viewToggleBtn = document.getElementById('library-view-toggle');
  if (viewToggleBtn) {
    // Удаляем существующие обработчики
    const newToggleBtn = viewToggleBtn.cloneNode(true);
    viewToggleBtn.parentNode.replaceChild(newToggleBtn, viewToggleBtn);
    
    // Добавляем новый обработчик
    newToggleBtn.addEventListener('click', () => {
      console.log('Переключение режима отображения библиотеки');
      const libraryContainer = document.getElementById('library-tracks');
      
      if (libraryContainer) {
        // Переключаем между сеткой и списком
        if (libraryContainer.classList.contains('grid-view')) {
          libraryContainer.classList.remove('grid-view');
          libraryContainer.classList.add('list-view');
          newToggleBtn.innerHTML = '<span class="material-icons">grid_view</span>';
          newToggleBtn.title = 'Показать сеткой';
        } else {
          libraryContainer.classList.remove('list-view');
          libraryContainer.classList.add('grid-view');
          newToggleBtn.innerHTML = '<span class="material-icons">view_list</span>';
          newToggleBtn.title = 'Показать списком';
        }
      }
    });
  }
  
  console.log('Элементы управления библиотекой настроены');
}

// Функция поиска в библиотеке
function searchInLibrary(query) {
  console.log(`Выполняется поиск в библиотеке: "${query}"`);
  
  // Загружаем треки библиотеки
  let libraryTracks = [];
  
  try {
    // Пробуем загрузить из обоих возможных хранилищ
    const savedTracks = localStorage.getItem('library_tracks');
    const soundpadLibrary = localStorage.getItem('soundpad_library');
    
    if (savedTracks) {
      libraryTracks = JSON.parse(savedTracks);
      console.log(`Загружено ${libraryTracks.length} треков из library_tracks для поиска`);
    } else if (soundpadLibrary) {
      libraryTracks = JSON.parse(soundpadLibrary);
      console.log(`Загружено ${libraryTracks.length} треков из soundpad_library для поиска`);
    } else {
      console.log('Треки в библиотеке не найдены');
      return;
    }
  } catch (error) {
    console.error('Ошибка при загрузке треков библиотеки для поиска:', error);
    return;
  }
  
  // Если поисковый запрос пуст, показываем все треки
  if (!query || query.trim() === '') {
    console.log('Пустой поисковый запрос, отображаем все треки');
    loadLibraryTracks();
    return;
  }
  
  // Фильтруем треки по поисковому запросу (поиск по названию и исполнителю)
  query = query.toLowerCase().trim();
  const filteredTracks = libraryTracks.filter(track => {
    const title = (track.title || '').toLowerCase();
    const artist = (track.artist || '').toLowerCase();
    const album = (track.album || '').toLowerCase();
    
    return title.includes(query) || artist.includes(query) || album.includes(query);
  });
  
  console.log(`Найдено ${filteredTracks.length} треков по запросу "${query}"`);
  
  // Отображаем результаты поиска
  displaySearchResults(filteredTracks, query);
}

// Отображение результатов поиска в библиотеке
function displaySearchResults(tracks, query) {
  const container = document.getElementById('library-tracks');
  if (!container) {
    console.error('Контейнер библиотеки не найден!');
    return;
  }
  
  // Очищаем контейнер
  container.innerHTML = '';
  
  // Если нет результатов, показываем сообщение
  if (tracks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">search_off</span>
        <p>По запросу "${query}" ничего не найдено</p>
        <p>Попробуйте изменить запрос или очистить поле поиска</p>
      </div>
    `;
    return;
  }
  
  // Сортируем треки по названию
  tracks.sort((a, b) => a.title.localeCompare(b.title));
  
  // Создаем элементы для каждого трека
  tracks.forEach(track => {
    const trackItem = document.createElement('div');
    trackItem.className = 'library-track-item';
    trackItem.dataset.id = track.id; // Добавляем data-id для идентификации
    
    trackItem.innerHTML = `
      <div class="title">${track.title || 'Неизвестный трек'}</div>
      <div class="artist">${track.artist || 'Неизвестный исполнитель'}</div>
      <div class="duration">${formatTime(track.duration || 0)}</div>
      <div class="actions">
        <button class="action-btn play-btn" title="Воспроизвести">
          <span class="material-icons">play_arrow</span>
        </button>
        <button class="action-btn add-to-playlist-btn" title="Добавить в плейлист">
          <span class="material-icons">playlist_add</span>
        </button>
      </div>
    `;
    
    container.appendChild(trackItem);
    
    // Добавляем обработчик для воспроизведения
    const playBtn = trackItem.querySelector('.play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`Запуск трека из результатов поиска: ${track.title}`);
        playLibraryTrack(track);
      });
    }
    
    // Добавляем обработчик для добавления в плейлист
    const addToPlaylistBtn = trackItem.querySelector('.add-to-playlist-btn');
    if (addToPlaylistBtn) {
      addToPlaylistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`Запрос на добавление найденного трека в плейлист: ${track.title}`);
        showAddToPlaylistDialog(track);
      });
    }
  });
}

// === ВОСПРОИЗВЕДЕНИЕ ===
function setupPlaybackControls() {
  console.log('Настройка кнопок управления воспроизведением...');
  
  // Кнопка воспроизведения/паузы
  const playBtn = document.getElementById('play-btn');
  if (playBtn) {
    playBtn.onclick = togglePlayPause;
    console.log('Настроена кнопка воспроизведения/паузы');
  }
  
  // Кнопка предыдущего трека
  const prevBtn = document.getElementById('prev-btn');
  if (prevBtn) {
    prevBtn.onclick = playPreviousTrack;
    console.log('Настроена кнопка предыдущего трека');
  }
  
  // Кнопка следующего трека
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) {
    nextBtn.onclick = playNextTrack;
    console.log('Настроена кнопка следующего трека');
  }
  
  // Кнопка перемешивания
  const shuffleBtn = document.getElementById('shuffle-btn');
  if (shuffleBtn) {
    shuffleBtn.onclick = () => {
      isShuffle = !isShuffle;
      shuffleBtn.classList.toggle('active', isShuffle);
      savePlayerSettings();
      console.log(`Режим перемешивания ${isShuffle ? 'включен' : 'выключен'}`);
    };
    console.log('Настроена кнопка перемешивания');
  }
  
  // Кнопка повтора
  const repeatBtn = document.getElementById('repeat-btn');
  if (repeatBtn) {
    repeatBtn.onclick = () => {
      // Цикл режимов повтора: нет -> один трек -> все треки -> нет
      if (repeatMode === 'no-repeat') {
        repeatMode = 'repeat-one';
      } else if (repeatMode === 'repeat-one') {
        repeatMode = 'repeat-all';
      } else {
        repeatMode = 'no-repeat';
      }
      updateRepeatButton();
      savePlayerSettings();
      console.log(`Режим повтора: ${repeatMode}`);
    };
    console.log('Настроена кнопка повтора');
  }
  
  // Ползунок громкости
  const volumeSlider = document.getElementById('volume-slider');
  if (volumeSlider) {
    volumeSlider.oninput = (e) => {
      const newVolume = parseFloat(e.target.value) / 100;
      volume = newVolume;
      // Применяем громкость к аудиоплееру
      if (audioPlayer) {
        audioPlayer.volume = volume;
      }
      console.log(`Громкость изменена на: ${volume}`);
    };
    
    volumeSlider.onchange = () => {
      savePlayerSettings();
      console.log('Настройка громкости сохранена');
    };
    
    console.log('Настроен ползунок громкости');
  }
  
  // События аудио плеера
  if (audioPlayer) {
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleTrackEnd);
    console.log('Настроены события аудиоплеера');
  } else {
    console.warn('Аудиоплеер не найден!');
  }
  
  // Прогресс-бар
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    progressBar.onclick = seekTrack;
    console.log('Настроен прогресс-бар');
  }
  
  console.log('Кнопки управления воспроизведением настроены');
}

// === ПОИСК ===
function setupSearchControls() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.oninput = () => {
      searchTracks(searchInput.value);
    };
  }
  
  // Настройки
  const themeSelect = document.getElementById('theme-select');
  const resetHotkeysBtn = document.getElementById('reset-hotkeys-btn');
  
  if (themeSelect) {
    themeSelect.onchange = () => {
      changeTheme(themeSelect.value);
    };
  }
  
  if (resetHotkeysBtn) {
    resetHotkeysBtn.onclick = resetAllHotkeys;
  }
  
  // Добавляем обработчики для переключения между видами сетки и списка
  const gridViewBtn = document.getElementById('grid-view-btn');
  const listViewBtn = document.getElementById('list-view-btn');
  
  if (gridViewBtn && listViewBtn) {
    gridViewBtn.addEventListener('click', () => {
      console.log('Переключение на вид сетки');
      setViewMode('grid');
    });
    
    listViewBtn.addEventListener('click', () => {
      console.log('Переключение на вид списка');
      setViewMode('list');
    });
    
    // Установка начального режима отображения из localStorage
    const savedViewMode = localStorage.getItem('viewMode') || 'grid';
    setViewMode(savedViewMode);
  }
}

// Функция переключения между видами отображения (сетка и список)
function setViewMode(mode) {
  console.log(`Установка режима отображения: ${mode}`);
  
  const gridViewBtn = document.getElementById('grid-view-btn');
  const listViewBtn = document.getElementById('list-view-btn');
  const tracksContainer = document.getElementById('tracks-grid');
  
  if (!gridViewBtn || !listViewBtn || !tracksContainer) {
    console.error('Не найдены элементы управления видом или контейнер треков');
    return;
  }
  
  // Сохраняем режим в localStorage
  localStorage.setItem('viewMode', mode);
  
  if (mode === 'grid') {
    // Устанавливаем вид сетки
    gridViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
    tracksContainer.className = 'tracks-grid';
  } else {
    // Устанавливаем вид списка
    gridViewBtn.classList.remove('active');
    listViewBtn.classList.add('active');
    tracksContainer.className = 'tracks-list';
  }
  
  // Если есть активный плейлист, перерисовываем треки
  if (currentPlaylist) {
    renderTracks(currentPlaylist.tracks || []);
  }
}

// Получение всех треков из всех плейлистов
function getAllExistingTracks() {
  const allTracks = [];
  
  if (playlists && playlists.length > 0) {
    playlists.forEach(playlist => {
      if (playlist.tracks && playlist.tracks.length > 0) {
        allTracks.push(...playlist.tracks);
      }
    });
  }
  
  return allTracks;
}

// Загружаем настройки горячих клавиш из localStorage
function loadHotkeys() {
  const savedHotkeys = localStorage.getItem('soundpad_playlist_hotkeys');
  if (savedHotkeys) {
    playlistHotkeys = JSON.parse(savedHotkeys);
    console.log('Загружены настройки горячих клавиш для плейлистов');
  } else {
    console.log('Настройки горячих клавиш не найдены');
    playlistHotkeys = {};
  }
  
  // Совместимость со старой версией (перенос из hotkeySounds)
  const oldHotkeys = localStorage.getItem('soundpad_hotkeys');
  if (oldHotkeys) {
    try {
      const hotkeySounds = JSON.parse(oldHotkeys);
      
      // Если есть старые горячие клавиши и нет новых, переносим старые в новый формат
      if (Object.keys(hotkeySounds).length > 0 && Object.keys(playlistHotkeys).length === 0) {
        console.log('Перенос старых горячих клавиш в новый формат');
        
        // Для каждой клавиши находим трек и его плейлист
        for (const [key, trackId] of Object.entries(hotkeySounds)) {
          let foundPlaylistId = null;
          
          // Ищем трек в плейлистах
          for (const playlist of playlists) {
            const trackExists = playlist.tracks && playlist.tracks.some(t => t.id === trackId);
            if (trackExists) {
              foundPlaylistId = playlist.id;
              break;
            }
          }
          
          // Если нашли плейлист, добавляем горячую клавишу
          if (foundPlaylistId) {
            if (!playlistHotkeys[foundPlaylistId]) {
              playlistHotkeys[foundPlaylistId] = {};
            }
            playlistHotkeys[foundPlaylistId][key] = trackId;
          }
        }
        
        // Сохраняем новые настройки
        saveHotkeys();
        
        // Удаляем старый формат
        localStorage.removeItem('soundpad_hotkeys');
      }
    } catch (error) {
      console.error('Ошибка при переносе старых горячих клавиш:', error);
    }
  }
}

// Сохраняем настройки горячих клавиш в localStorage
function saveHotkeys() {
  localStorage.setItem('soundpad_playlist_hotkeys', JSON.stringify(playlistHotkeys));
  console.log('Настройки горячих клавиш сохранены');
}

// Воспроизведение звука по горячей клавише
function playHotkeySound(keyName) {
  if (!currentPlaylist) {
    console.log('Плейлист не выбран');
    return false;
  }
  
  // Проверяем есть ли горячие клавиши для текущего плейлиста
  const playlistId = currentPlaylist.id;
  if (!playlistHotkeys[playlistId] || !playlistHotkeys[playlistId][keyName]) {
    console.log(`Нет звука, привязанного к клавише ${keyName} в текущем плейлисте`);
    return false;
  }
  
  // Получаем ID трека для текущего плейлиста
  const trackId = playlistHotkeys[playlistId][keyName];
  console.log(`Запуск звука по клавише ${keyName}, ID трека: ${trackId}`);
  
  // Ищем трек в текущем плейлисте
  const track = currentPlaylist.tracks.find(t => t.id === trackId);
  if (!track) {
    console.error(`Трек с ID ${trackId} не найден в текущем плейлисте`);
    showNotification(`Трек для клавиши ${keyName} не найден в текущем плейлисте`, 'error');
    return false;
  }
  
  // Проверяем, не воспроизводится ли уже этот трек
  if (currentTrack && currentTrack.id === trackId && isPlaying) {
    // Если трек уже играет, просто перематываем его в начало
    audioPlayer.currentTime = 0;
    console.log(`Трек ${track.title} перемотан в начало`);
    return true;
  } else {
    // Иначе запускаем воспроизведение с начала
    playTrack(trackId);
    return true;
  }
}

// Назначение произвольной горячей клавиши для трека
function assignCustomHotkeyToTrack(trackId, keyName) {
  if (!keyName) {
    console.error('Не указана клавиша для назначения');
    return;
  }
  
  if (!currentPlaylist) {
    console.error('Плейлист не выбран');
    showNotification('Выберите плейлист для назначения горячей клавиши', 'error');
    return;
  }
  
  const playlistId = currentPlaylist.id;
  
  // Инициализируем объект для плейлиста, если его нет
  if (!playlistHotkeys[playlistId]) {
    playlistHotkeys[playlistId] = {};
  }
  
  // Проверяем, не назначена ли уже эта клавиша другому треку в этом плейлисте
  const existingTrackId = playlistHotkeys[playlistId][keyName];
  if (existingTrackId && existingTrackId !== trackId) {
    // Если клавиша уже назначена другому треку, спрашиваем пользователя о переназначении
    if (confirm(`Клавиша ${keyName} уже назначена другому треку в этом плейлисте. Переназначить?`)) {
      // Пользователь согласился переназначить
      delete playlistHotkeys[playlistId][keyName];
    } else {
      // Пользователь отказался от переназначения
      return;
    }
  }
  
  // Удаляем предыдущее назначение для этого трека в этом плейлисте, если оно было
  for (const [key, id] of Object.entries(playlistHotkeys[playlistId])) {
    if (id === trackId) {
      delete playlistHotkeys[playlistId][key];
    }
  }
  
  // Назначаем новую клавишу
  playlistHotkeys[playlistId][keyName] = trackId;
  saveHotkeys();
  
  showNotification(`Трек назначен на клавишу ${keyName} в плейлисте "${currentPlaylist.name}"`, 'success');
}

// Назначение горячей клавиши для трека
function assignHotkeyToTrack(trackId, hotkeyNumber) {
  if (hotkeyNumber < 1 || hotkeyNumber > 12) {
    console.error('Некорректный номер функциональной клавиши');
    return;
  }
  
  const hotkeyName = `F${hotkeyNumber}`;
  assignCustomHotkeyToTrack(trackId, hotkeyName);
}

// Показать диалог назначения горячей клавиши
function showHotkeyAssignDialog(track) {
  console.log(`Открытие диалога назначения горячей клавиши для трека ${typeof track === 'object' ? track.id : track}`);
  
  // Если передан ID трека вместо объекта, находим информацию о треке
  let trackObject = track;
  if (typeof track !== 'object') {
    const trackId = track;
    if (currentPlaylist) {
      trackObject = currentPlaylist.tracks.find(t => t.id === trackId);
    }
  }
  
  if (!trackObject) {
    console.error('Трек не найден');
    showNotification('Трек не найден', 'error');
    return;
  }
  
  const trackId = trackObject.id;
  
  // Находим модальное окно
  const modal = document.getElementById('hotkey-modal');
  if (!modal) {
    console.error('Модальное окно hotkey-modal не найдено!');
    showNotification('Ошибка: модальное окно не найдено', 'error');
    return;
  }
  
  // Текущая привязанная клавиша для этого трека в текущем плейлисте, если есть
  let currentKey = null;
  if (currentPlaylist && playlistHotkeys[currentPlaylist.id]) {
    for (const [key, id] of Object.entries(playlistHotkeys[currentPlaylist.id])) {
      if (id === trackId) {
        currentKey = key;
        break;
      }
    }
  }
  
  // Заполняем информацию о треке в модальном окне
  const trackInfoElement = modal.querySelector('#hotkey-track-info');
  if (trackInfoElement) {
    trackInfoElement.innerHTML = `
      <div class="track-title">${trackObject.title || 'Неизвестный трек'}</div>
      <div class="track-artist">${trackObject.artist || 'Неизвестный исполнитель'}</div>
      ${currentKey ? `<div class="current-hotkey">Текущая клавиша в этом плейлисте: <span class="hotkey-combo">${currentKey}</span></div>` : ''}
    `;
  } else {
    console.error('Элемент #hotkey-track-info не найден в модальном окне');
  }
  
  // Модифицируем тело модального окна для ввода клавиши
  const modalBody = modal.querySelector('.modal-body');
  if (modalBody) {
    // Сохраняем информацию о треке (если она существует)
    let trackInfoContent = '';
    if (trackInfoElement) {
      trackInfoContent = trackInfoElement.innerHTML;
    }
    
    // Заменяем содержимое модального окна
    modalBody.innerHTML = `
      <div id="hotkey-track-info" class="track-info-large">
        ${trackInfoContent}
      </div>
      <div class="form-group">
        <label for="hotkey-input">Нажмите клавишу для назначения</label>
        <div id="hotkey-input" class="hotkey-input" tabindex="0">
          <span class="hotkey-placeholder">${currentKey || 'Нажмите клавишу...'}</span>
        </div>
        <p class="hotkey-hint">Поддерживаются любые клавиши клавиатуры (включая комбинации с Ctrl, Alt, Shift)</p>
      </div>
    `;
    
    console.log('Содержимое модального окна обновлено');
  } else {
    console.error('Элемент .modal-body не найден в модальном окне');
    return;
  }
  
  // Добавляем обработчик для ввода клавиши
  const hotkeyInput = modalBody.querySelector('#hotkey-input');
  let selectedKey = currentKey;
  
  if (hotkeyInput) {
    // Добавляем обработчики фокуса
    hotkeyInput.addEventListener('focus', () => {
      hotkeyInput.classList.add('listening');
      const placeholder = hotkeyInput.querySelector('.hotkey-placeholder');
      if (placeholder) {
        placeholder.textContent = 'Слушаю...';
      }
    });
    
    hotkeyInput.addEventListener('blur', () => {
      hotkeyInput.classList.remove('listening');
      const placeholder = hotkeyInput.querySelector('.hotkey-placeholder');
      if (placeholder) {
        placeholder.textContent = selectedKey || 'Нажмите клавишу...';
      }
    });
    
    // Обработчик нажатия клавиш
    const keydownListener = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Используем общую функцию форматирования клавиш
      const keyName = formatKeyName(e);
      
      // Проверяем, не является ли клавиша системной
      if (keyName === 'Escape' || keyName === 'Tab') {
        return; // Игнорируем системные клавиши
      }
      
      // Сохраняем выбранную клавишу
      selectedKey = keyName;
      const placeholder = hotkeyInput.querySelector('.hotkey-placeholder');
      if (placeholder) {
        placeholder.textContent = selectedKey;
      }
      
      console.log('Выбрана клавиша:', selectedKey);
    };
    
    hotkeyInput.addEventListener('keydown', keydownListener);
    
    // Фокусируем элемент ввода при открытии модального окна
    setTimeout(() => hotkeyInput.focus(), 100);
  } else {
    console.error('Элемент #hotkey-input не найден в модальном окне');
  }
  
  // Сохраняем ID трека в атрибуте data-track-id модального окна
  modal.dataset.trackId = trackId;
  
  // Настраиваем кнопки в модальном окне
  setupHotkeyModalButtons(modal, trackId, () => selectedKey);
  
  // Открываем модальное окно
  openModal('hotkey-modal');
  console.log('Модальное окно открыто для назначения горячей клавиши');
}

// Настройка кнопок в модальном окне назначения горячих клавиш
function setupHotkeyModalButtons(modal, trackId, getSelectedKeyFn) {
  // Находим кнопки
  const assignButton = modal.querySelector('#assign-hotkey-btn');
  const cancelButton = modal.querySelector('#cancel-hotkey-btn');
  const closeButton = modal.querySelector('.close-btn');
  
  // Настраиваем кнопку назначения
  if (assignButton) {
    // Клонируем для удаления существующих обработчиков
    const newAssignButton = assignButton.cloneNode(true);
    assignButton.parentNode.replaceChild(newAssignButton, assignButton);
    
    newAssignButton.addEventListener('click', () => {
      const selectedKey = getSelectedKeyFn();
      if (selectedKey && selectedKey !== 'Нажмите клавишу...' && selectedKey !== 'Слушаю...') {
        assignCustomHotkeyToTrack(trackId, selectedKey);
        closeModal('hotkey-modal');
      } else {
        showNotification('Пожалуйста, выберите клавишу', 'error');
      }
    });
  } else {
    console.error('Кнопка #assign-hotkey-btn не найдена в модальном окне');
  }
  
  // Настраиваем кнопку отмены
  if (cancelButton) {
    // Клонируем для удаления существующих обработчиков
    const newCancelButton = cancelButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    
    newCancelButton.addEventListener('click', () => {
      closeModal('hotkey-modal');
    });
  } else {
    console.error('Кнопка #cancel-hotkey-btn не найдена в модальном окне');
  }
  
  // Настраиваем кнопку закрытия (X)
  if (closeButton) {
    // Клонируем для удаления существующих обработчиков
    const newCloseButton = closeButton.cloneNode(true);
    closeButton.parentNode.replaceChild(newCloseButton, closeButton);
    
    newCloseButton.addEventListener('click', () => {
      closeModal('hotkey-modal');
    });
  } else {
    console.error('Кнопка .close-btn не найдена в модальном окне');
  }
}

// Загрузка плейлистов из localStorage
function loadPlaylists() {
  const savedPlaylists = localStorage.getItem('playlists');
  if (savedPlaylists) {
    playlists = JSON.parse(savedPlaylists);
    console.log(`Загружено ${playlists.length} плейлистов`);
    renderPlaylists();
  } else {
    console.log('Сохраненных плейлистов не найдено');
    playlists = [];
  }
}

// Сохранение плейлистов в localStorage
function savePlaylists() {
  localStorage.setItem('playlists', JSON.stringify(playlists));
  console.log('Плейлисты сохранены');
}

// Функция для отрисовки плейлистов в боковой панели
function renderPlaylists() {
  console.log('Отрисовка плейлистов...');
  
  // Находим контейнеры плейлистов
  const containerByClass = document.querySelector('.playlists-list');
  const container = document.getElementById('playlists-container');
  
  // Вначале пробуем найти по классу (как в старом интерфейсе)
  if (containerByClass) {
    console.log('Найден контейнер плейлистов по классу');
    renderPlaylistsToContainer(containerByClass);
  } 
  // Затем пробуем найти по ID (как в новом интерфейсе)
  else if (container) {
    console.log('Найден контейнер плейлистов по ID');
    renderPlaylistsToContainer(container);
  } else {
    console.error('Контейнер плейлистов не найден!');
  }
}

// Рендеринг плейлистов в указанный контейнер
function renderPlaylistsToContainer(container) {
  console.log(`Отрисовка плейлистов в контейнер, количество плейлистов: ${playlists.length}`);
  
  // Очищаем контейнер
  container.innerHTML = '';
  
  // Если нет плейлистов, показываем сообщение
  if (!playlists || playlists.length === 0) {
    container.innerHTML = `
      <div class="empty-playlists">
        <p>У вас еще нет плейлистов</p>
      </div>
    `;
    console.log('Нет плейлистов для отображения');
    return;
  }
  
  // Отрисовываем каждый плейлист
  playlists.forEach(playlist => {
    // Создаем элемент плейлиста
    const playlistItem = document.createElement('div');
    playlistItem.className = 'playlist-item';
    playlistItem.dataset.id = playlist.id;
    
    if (currentPlaylist && currentPlaylist.id === playlist.id) {
      playlistItem.classList.add('active');
    }
    
    // Определяем количество треков для отображения
    const trackCount = playlist.tracks ? playlist.tracks.length : 0;
    
    // Формируем HTML для элемента плейлиста
    playlistItem.innerHTML = `
      <span class="playlist-icon material-icons" style="color: ${playlist.color || '#8c52ff'};">queue_music</span>
      <div class="playlist-details">
        <div class="playlist-name">${playlist.name}</div>
        <div class="playlist-info">${trackCount} ${getTrackWord(trackCount)}</div>
      </div>
      <button class="playlist-delete-btn" data-id="${playlist.id}">
        <span class="material-icons">close</span>
      </button>
    `;
    
    // Добавляем обработчик клика для выбора плейлиста
    playlistItem.addEventListener('click', function(e) {
      // Игнорируем клик по кнопке удаления
      if (e.target.closest('.playlist-delete-btn')) {
        return;
      }
      
      console.log(`Клик по плейлисту: ${playlist.name}`);
      selectPlaylist(playlist.id);
    });
    
    // Добавляем обработчик для кнопки удаления плейлиста
    const deleteBtn = playlistItem.querySelector('.playlist-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Предотвращаем всплытие события
        console.log(`Удаление плейлиста: ${playlist.name}`);
        deletePlaylist(playlist.id);
      });
    }
    
    // Добавляем элемент в контейнер
    container.appendChild(playlistItem);
  });
  
  console.log('Плейлисты отрисованы успешно');
}

// Вспомогательная функция для правильного склонения слова "трек"
function getTrackWord(count) {
  if (count % 10 === 1 && count % 100 !== 11) {
    return 'трек';
  } else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return 'трека';
  } else {
    return 'треков';
  }
}

// Функция удаления плейлиста
function deletePlaylist(playlistId) {
  // Находим плейлист по ID
  const playlistIndex = playlists.findIndex(p => p.id === playlistId);
  if (playlistIndex === -1) {
    showNotification('Плейлист не найден', 'error');
    return;
  }
  
  const playlist = playlists[playlistIndex];
  
  // Проверяем, что плейлист не является системным
  if (playlist.isSystem) {
    showNotification('Нельзя удалить системный плейлист', 'error');
    return;
  }
  
  // Спрашиваем подтверждение у пользователя
  if (!confirm(`Вы уверены, что хотите удалить плейлист "${playlist.name}"?`)) {
    return; // Пользователь отменил удаление
  }
  
  // Если удаляемый плейлист был выбран, сбрасываем текущий плейлист
  if (currentPlaylist && currentPlaylist.id === playlistId) {
    currentPlaylist = null;
    // Очищаем отображение треков
    const container = document.getElementById('tracks-grid');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">music_note</span>
          <p>Выберите плейлист</p>
        </div>
      `;
    }
    
    // Обновляем заголовок
    const playlistNameEl = document.getElementById('current-playlist-name');
    if (playlistNameEl) {
      playlistNameEl.textContent = '';
    }
  }
  
  // Удаляем плейлист из массива
  playlists.splice(playlistIndex, 1);
  
  // Сохраняем изменения
  savePlaylists();
  
  // Обновляем отображение
  renderPlaylists();
  
  showNotification(`Плейлист "${playlist.name}" удален`, 'success');
}

// Выбор плейлиста
function selectPlaylist(playlistId) {
  console.log(`Выбор плейлиста с ID: ${playlistId}`);
  
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) {
    console.error(`Плейлист с ID ${playlistId} не найден!`);
    return;
  }
  
  currentPlaylist = playlist;
  console.log(`Выбран плейлист: ${playlist.name}`);
  
  // Обновляем активный класс в сайдбаре
  document.querySelectorAll('.playlist-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id === playlistId);
  });
  
  // Обновляем заголовок
  const playlistNameEl = document.getElementById('current-playlist-name');
  if (playlistNameEl) {
    playlistNameEl.textContent = playlist.name;
  } else {
    console.error('Элемент для отображения имени плейлиста не найден!');
  }
  
  // Отображаем треки плейлиста
  renderTracks(playlist.tracks || []);
}

// Воспроизведение трека
function playTrack(trackId) {
  console.log('Вызов функции playTrack с ID:', trackId);
  
  if (!currentPlaylist) {
    console.error('Плейлист не выбран');
    showNotification('Плейлист не выбран', 'error');
    return;
  }
  
  const track = currentPlaylist.tracks.find(t => t.id === trackId);
  if (!track) {
    console.error('Трек не найден:', trackId);
    showNotification('Трек не найден', 'error');
    return;
  }
  
  console.log('Воспроизведение трека:', track.title, 'из файла:', track.path);
  
  // Если уже воспроизводится этот трек, ставим паузу/возобновляем
  if (currentTrack && currentTrack.id === trackId) {
    console.log('Трек уже воспроизводится, переключаем паузу/воспроизведение');
    togglePlayPause();
    return;
  }
  
  // Сохраняем ссылку на текущий трек
  currentTrack = track;
  
  // Обновляем информацию о текущем треке в UI
  updateNowPlayingInfo();
  
  try {
    // Останавливаем текущий трек, если он играет
    if (audioPlayer) {
      console.log('Останавливаем текущий трек');
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }
    
    // Создаем новый элемент Audio для предотвращения проблем с воспроизведением
    audioPlayer = new Audio(track.path);
    console.log('Создан новый аудиоплеер с источником:', track.path);
    
    // Устанавливаем громкость
    audioPlayer.volume = volume;
    console.log('Установлена громкость:', volume);
    
    // Регистрируем обработчики событий
    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', handleTrackEnd);
    audioPlayer.addEventListener('error', (e) => {
      console.error('Ошибка аудио:', e);
      showNotification('Ошибка воспроизведения файла', 'error');
    });
    
    // Запускаем воспроизведение с небольшой задержкой
    console.log('Запускаем воспроизведение...');
    setTimeout(() => {
      const playPromise = audioPlayer.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaying = true;
            updatePlayPauseButton();
            console.log('Воспроизведение запущено успешно');
          })
          .catch(error => {
            console.error('Ошибка воспроизведения:', error);
            showNotification('Ошибка воспроизведения: ' + error.message, 'error');
          });
      } else {
        // Для случаев, когда playPromise не поддерживается
        isPlaying = true;
        updatePlayPauseButton();
        console.log('Воспроизведение, вероятно, запущено (promise не поддерживается)');
      }
    }, 100);
  } catch (error) {
    console.error('Ошибка при инициализации воспроизведения:', error);
    showNotification('Ошибка при попытке воспроизведения: ' + error.message, 'error');
  }
}

// Обновление информации о текущем треке
function updateNowPlayingInfo() {
  const titleEl = document.getElementById('current-track-title');
  const artistEl = document.getElementById('current-track-artist');
  
  if (currentTrack) {
    titleEl.textContent = currentTrack.title || 'Неизвестный трек';
    artistEl.textContent = currentTrack.artist || 'Неизвестный исполнитель';
  } else {
    titleEl.textContent = 'Нет воспроизводимого трека';
    artistEl.textContent = 'Выберите трек для воспроизведения';
  }
}

// Включение/пауза воспроизведения
function togglePlayPause() {
  if (!currentTrack) return;
  
  if (isPlaying) {
    audioPlayer.pause();
  } else {
    audioPlayer.play();
  }
  
  isPlaying = !isPlaying;
  updatePlayPauseButton();
}

// Обновление кнопки воспроизведения/паузы
function updatePlayPauseButton() {
  const playBtn = document.getElementById('play-btn');
  if (!playBtn) return;
  
  const icon = playBtn.querySelector('.material-icons');
  if (icon) {
    icon.textContent = isPlaying ? 'pause' : 'play_arrow';
  }
}

// Модифицированная функция рендеринга треков
function renderTracks(tracks) {
  console.log(`Отрисовка треков: ${tracks ? tracks.length : 0}`);
  
  const container = document.getElementById('tracks-grid');
  if (!container) {
    console.error('Контейнер треков не найден (ID: tracks-grid)');
    return;
  }
  
  // Очищаем контейнер
  container.innerHTML = '';
  
  // Если треков нет, отображаем пустое состояние
  if (!tracks || tracks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">music_note</span>
        <p>Нет доступных треков</p>
        <button id="add-tracks-btn" class="primary-btn">Добавить треки</button>
      </div>
    `;
    
    // Добавляем обработчик для кнопки добавления треков
    const addTracksBtn = document.getElementById('add-tracks-btn');
    if (addTracksBtn) {
      addTracksBtn.addEventListener('click', () => {
        console.log('Нажата кнопка добавления треков');
        importTracks();
      });
    }
    
    return;
  }
  
  // Получаем текущий режим отображения
  const viewMode = localStorage.getItem('viewMode') || 'grid';
  
  // Отображаем треки в зависимости от выбранного режима
  if (viewMode === 'grid') {
    // Сетка (стандартный вид)
    tracks.forEach(track => {
      const trackCard = document.createElement('div');
      trackCard.className = 'track-card';
      trackCard.dataset.id = track.id;
      
      trackCard.innerHTML = `
        <div class="track-image">
          <span class="material-icons">music_note</span>
          <button class="track-play-btn">
            <span class="material-icons">play_arrow</span>
          </button>
        </div>
        <div class="track-info">
          <div class="track-title">${track.title || 'Неизвестный трек'}</div>
          <div class="track-artist">${track.artist || 'Неизвестный исполнитель'}</div>
          <div class="track-actions">
            <button class="assign-hotkey-btn" title="Назначить горячую клавишу">
              <span class="material-icons">keyboard</span>
            </button>
            <button class="delete-track-btn" title="Удалить из плейлиста">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      `;
      
      container.appendChild(trackCard);
      
      // Добавляем обработчики событий
      addTrackEventListeners(trackCard, track);
    });
  } else {
    // Список
    tracks.forEach((track, index) => {
      const trackItem = document.createElement('div');
      trackItem.className = 'track-list-item';
      trackItem.dataset.id = track.id;
      
      trackItem.innerHTML = `
        <div class="track-number">${index + 1}</div>
        <div class="track-info">
          <div class="track-title">${track.title || 'Неизвестный трек'}</div>
          <div class="track-artist">${track.artist || 'Неизвестный исполнитель'}</div>
        </div>
        <div class="track-duration">${formatTime(track.duration || 0)}</div>
        <div class="track-actions">
          <button class="track-action-btn play-btn" title="Воспроизвести">
            <span class="material-icons">play_arrow</span>
          </button>
          <button class="assign-hotkey-btn" title="Назначить горячую клавишу">
            <span class="material-icons">keyboard</span>
          </button>
          <button class="delete-track-btn" title="Удалить из плейлиста">
            <span class="material-icons">delete</span>
          </button>
        </div>
      `;
      
      container.appendChild(trackItem);
      
      // Добавляем обработчики событий
      addTrackEventListeners(trackItem, track);
    });
  }
  
  console.log(`Отрисовано ${tracks.length} треков в режиме ${viewMode}`);
}

// Добавление обработчиков событий для элемента трека
function addTrackEventListeners(trackElement, track) {
  // Воспроизведение по клику на кнопку воспроизведения
  const playBtn = trackElement.querySelector('.track-play-btn, .play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log(`Нажата кнопка воспроизведения для трека: ${track.title}`);
      playTrack(track.id);
    });
  }
  
  // Воспроизведение по клику на карточку/элемент (только для карточек в сетке)
  if (trackElement.classList.contains('track-card')) {
    trackElement.addEventListener('click', () => {
      console.log(`Клик по карточке трека: ${track.title}`);
      playTrack(track.id);
    });
  }
  
  // Назначение горячей клавиши
  const hotkeyBtn = trackElement.querySelector('.assign-hotkey-btn');
  if (hotkeyBtn) {
    hotkeyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log(`Нажата кнопка назначения горячей клавиши для трека: ${track.title}`);
      showHotkeyAssignDialog(track);
    });
  }
  
  // Удаление трека из плейлиста
  const deleteBtn = trackElement.querySelector('.delete-track-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log(`Нажата кнопка удаления трека: ${track.title}`);
      deleteTrackFromPlaylist(track.id);
    });
  }
}

// Функция для импорта треков с помощью диалога выбора файлов
function importTracks() {
  console.log('Вызвана функция importTracks');
  // Вызываем функцию импорта аудио файлов
  importAudioFiles();
}

// Импорт аудио файлов
async function importAudioFiles() {
  console.log('Вызвана функция importAudioFiles');
  
  try {
    // Проверяем доступность API Electron
    if (!window.electronAPI || typeof window.electronAPI.selectAudioFiles !== 'function') {
      console.error('API Electron для выбора аудио файлов недоступно');
      showNotification('Ошибка: функция выбора аудио файлов недоступна', 'error');
      return;
    }
    
    showNotification('Выбор аудио файлов...', 'info');
    const filePaths = await window.electronAPI.selectAudioFiles();
    
    console.log('Результат выбора файлов:', filePaths);
    
    if (!filePaths || filePaths.length === 0) {
      console.log('Файлы не выбраны или отменен выбор');
      return;
    }
    
    console.log(`Выбрано ${filePaths.length} файлов`);
    
    // Проверяем текущий плейлист
    if (!currentPlaylist) {
      showNotification('Выберите плейлист для добавления треков', 'error');
      return;
    }
    
    // Проверяем наличие треков в плейлисте
    if (!currentPlaylist.tracks) {
      currentPlaylist.tracks = [];
    }
    
    addTracksToCurrentPlaylist(filePaths);
  } catch (error) {
    console.error('Ошибка при импорте файлов:', error);
    showNotification('Ошибка при импорте аудио файлов: ' + (error.message || 'Неизвестная ошибка'), 'error');
  }
}

// Добавление треков в текущий плейлист
function addTracksToCurrentPlaylist(filePaths) {
  if (!currentPlaylist) {
    showNotification('Выберите плейлист для добавления треков', 'error');
    return;
  }
  
  // Создаем новые объекты треков
  const newTracks = filePaths.map(path => {
    const fileName = path.split(/[\\/]/).pop();
    const name = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    return {
      id: 'track_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: name,
      artist: 'Неизвестный исполнитель',
      path: path,
      duration: 0,
      addedAt: new Date().toISOString()
    };
  });
  
  // Добавляем треки в текущий плейлист
  currentPlaylist.tracks = [...currentPlaylist.tracks, ...newTracks];
  
  // Сохраняем изменения
  savePlaylists();
  
  // Обновляем отображение
  renderTracks(currentPlaylist.tracks);
  
  showNotification(`Добавлено ${newTracks.length} треков в плейлист "${currentPlaylist.name}"`, 'success');
}

// Создание нового плейлиста
function createPlaylist() {
  console.log('Создание нового плейлиста...');
  const nameInput = document.getElementById('playlist-name');
  if (!nameInput || !nameInput.value.trim()) {
    showNotification('Введите название плейлиста', 'error');
    console.error('Название плейлиста не указано');
    return;
  }
  
  const name = nameInput.value.trim();
  
  const playlist = {
    id: 'playlist_' + Date.now(),
    name: name,
    tracks: [],
    color: getRandomColor(),
    createdAt: new Date().toISOString()
  };
  
  console.log('Создан новый плейлист:', name);
  
  playlists.push(playlist);
  savePlaylists();
  renderPlaylists();
  
  // Закрываем модальное окно
  closeModal('create-playlist-modal');
  
  // Очищаем поле ввода
  nameInput.value = '';
  
  // Выбираем созданный плейлист
  selectPlaylist(playlist.id);
  
  showNotification(`Плейлист "${name}" создан`, 'success');
}

// Получение случайного цвета для плейлиста
function getRandomColor() {
  const colors = [
    '#8338ec', '#3a86ff', '#ff006e', '#fb5607', '#ffbe0b',
    '#06d6a0', '#118ab2', '#ef476f', '#073b4c', '#540d6e'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Показ уведомления
function showNotification(message, type = 'info') {
  console.log(`Уведомление (${type}): ${message}`);
  
  // В будущем здесь можно добавить визуальные уведомления
  // Например, через HTML-элемент с анимацией
}

// Открытие модального окна
function openModal(modalId) {
  console.log(`Открытие модального окна: ${modalId}`);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    
    // Если это модальное окно создания плейлиста, фокусируемся на поле ввода
    if (modalId === 'create-playlist-modal') {
      const input = document.getElementById('playlist-name');
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
    }
    console.log(`Модальное окно ${modalId} открыто`);
  } else {
    console.error(`Модальное окно с ID "${modalId}" не найдено!`);
  }
}

// Закрытие модального окна
function closeModal(modalId) {
  console.log(`Закрытие модального окна: ${modalId}`);
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    console.log(`Модальное окно ${modalId} закрыто`);
  } else {
    console.error(`Модальное окно с ID "${modalId}" не найдено!`);
  }
}

// Переключение между секциями приложения
function switchSection(sectionIndex) {
  console.log(`Переключение на секцию ${sectionIndex}`);
  
  // Скрываем все секции
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => {
    section.style.display = 'none';
    console.log(`Скрыта секция: ${section.id}`);
  });
  
  // Показываем выбранную секцию
  if (sectionIndex === 0) {
    // Плейлисты (главная)
    const homeSection = document.getElementById('home-section');
    if (homeSection) {
      homeSection.style.display = 'block';
      console.log('Секция плейлистов (главная) активирована');
    } else {
      console.error('Секция плейлистов (главная) не найдена!');
    }
  } else if (sectionIndex === 1) {
    // Библиотека
    const librarySection = document.getElementById('library-section');
    if (librarySection) {
      librarySection.style.display = 'block';
      console.log('Секция библиотеки активирована');
      loadLibraryTracks();
    } else {
      console.error('Секция библиотеки не найдена!');
    }
  } else if (sectionIndex === 2) {
    // Настройки
    const settingsSection = document.getElementById('settings-section');
    if (settingsSection) {
      settingsSection.style.display = 'block';
      console.log('Секция настроек активирована');
    } else {
      console.error('Секция настроек не найдена!');
    }
  }
  
  // Обновляем активный пункт меню
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item, index) => {
    if (index === sectionIndex) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  console.log(`Переключение на секцию ${sectionIndex} завершено`);
}

// Загрузка треков для библиотеки
function loadLibraryTracks() {
  console.log('Загрузка треков библиотеки...');
  
  const container = document.getElementById('library-tracks');
  if (!container) {
    console.error('Контейнер библиотеки не найден по ID: library-tracks');
    return;
  }
  
  // Проверяем наличие треков в библиотеке
  let libraryTracks = [];
  
  try {
    // Пробуем загрузить из обоих возможных хранилищ
    const savedTracks = localStorage.getItem('library_tracks');
    const soundpadLibrary = localStorage.getItem('soundpad_library');
    
    if (savedTracks) {
      libraryTracks = JSON.parse(savedTracks);
      console.log(`Загружено ${libraryTracks.length} треков из library_tracks`);
    } else if (soundpadLibrary) {
      libraryTracks = JSON.parse(soundpadLibrary);
      console.log(`Загружено ${libraryTracks.length} треков из soundpad_library`);
    } else {
      console.log('Треки в библиотеке не найдены');
    }
  } catch (error) {
    console.error('Ошибка при загрузке треков библиотеки:', error);
    libraryTracks = [];
  }
  
  // Очищаем контейнер перед обновлением содержимого
  container.innerHTML = '';
  
  if (!libraryTracks || libraryTracks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">library_music</span>
        <p>Ваша библиотека пуста</p>
        <p>Добавьте музыку или выполните поиск MP3 файлов на компьютере</p>
      </div>
    `;
    console.log('Библиотека пуста, отображен пустой шаблон');
    return;
  }
  
  // Сортируем треки по названию
  libraryTracks.sort((a, b) => a.title.localeCompare(b.title));
  
  console.log(`Отрисовка ${libraryTracks.length} треков в библиотеке`);
  
  // Создаем элементы для каждого трека
  libraryTracks.forEach(track => {
    const trackItem = document.createElement('div');
    trackItem.className = 'library-track-item';
    trackItem.dataset.id = track.id; // Добавляем data-id для идентификации
    
    trackItem.innerHTML = `
      <div class="title">${track.title || 'Неизвестный трек'}</div>
      <div class="artist">${track.artist || 'Неизвестный исполнитель'}</div>
      <div class="duration">${formatTime(track.duration || 0)}</div>
      <div class="actions">
        <button class="action-btn play-btn" title="Воспроизвести">
          <span class="material-icons">play_arrow</span>
        </button>
        <button class="action-btn add-to-playlist-btn" title="Добавить в плейлист">
          <span class="material-icons">playlist_add</span>
        </button>
      </div>
    `;
    
    container.appendChild(trackItem);
    
    // Добавляем обработчик для воспроизведения
    const playBtn = trackItem.querySelector('.play-btn');
    if (playBtn) {
      playBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`Запуск трека из библиотеки: ${track.title}`);
        playLibraryTrack(track);
      });
    }
    
    // Добавляем обработчик для добавления в плейлист
    const addToPlaylistBtn = trackItem.querySelector('.add-to-playlist-btn');
    if (addToPlaylistBtn) {
      addToPlaylistBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`Запрос на добавление трека в плейлист: ${track.title}`);
        showAddToPlaylistDialog(track);
      });
    }
  });
  
  console.log('Загрузка библиотеки завершена, отрисовано треков:', libraryTracks.length);
}

// Загрузка треков из библиотеки
function loadTracksFromLibrary() {
  const savedTracks = localStorage.getItem('library_tracks');
  if (savedTracks) {
    return JSON.parse(savedTracks);
  }
  return [];
}

// Сохранение треков в библиотеку
function saveTracksToLibrary(tracks) {
  localStorage.setItem('library_tracks', JSON.stringify(tracks));
  console.log(`Сохранено ${tracks.length} треков в библиотеку`);
}

// Сканирование всех MP3 файлов на компьютере
async function scanAllMp3Files() {
  try {
    showNotification('Начинается поиск MP3 файлов на компьютере...', 'info');
    
    // Отображаем индикатор загрузки в библиотеке
    const container = document.getElementById('library-tracks');
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Идёт поиск MP3 файлов на компьютере...</p>
          <p>Это может занять несколько минут</p>
        </div>
      `;
    }
    
    // Вызываем API Electron для сканирования
    try {
      // Проверяем, что API доступен
      if (window.electronAPI && typeof window.electronAPI.scanAllMp3Files === 'function') {
        const mp3Files = await window.electronAPI.scanAllMp3Files();
        
        if (mp3Files && mp3Files.length > 0) {
          addFilesToLibrary(mp3Files);
          showNotification(`Найдено ${mp3Files.length} MP3 файлов`, 'success');
        } else {
          showNotification('MP3 файлы не найдены', 'info');
          loadLibraryTracks(); // Загружаем пустую библиотеку
        }
      } else {
        console.error('API для сканирования MP3 недоступно');
        showNotification('Функция поиска MP3 файлов не поддерживается в этой версии', 'error');
        loadLibraryTracks();
      }
    } catch (error) {
      console.error('Ошибка при сканировании:', error);
      showNotification('Ошибка при поиске MP3 файлов: ' + error.message, 'error');
      loadLibraryTracks(); // Восстанавливаем отображение библиотеки
    }
  } catch (error) {
    console.error('Ошибка при сканировании MP3 файлов:', error);
    showNotification('Ошибка при сканировании MP3 файлов', 'error');
    loadLibraryTracks(); // Восстанавливаем отображение библиотеки
  }
}

// Импорт файлов в библиотеку
async function importLibraryFiles() {
  try {
    const filePaths = await window.electronAPI.selectAudioFiles();
    if (!filePaths || filePaths.length === 0) return;
    
    console.log(`Выбрано ${filePaths.length} файлов для библиотеки`);
    addFilesToLibrary(filePaths);
  } catch (error) {
    console.error('Ошибка при импорте файлов в библиотеку:', error);
    showNotification('Ошибка при импорте аудио файлов', 'error');
  }
}

// Добавление файлов в библиотеку
function addFilesToLibrary(filePaths) {
  // Загружаем существующие треки
  let libraryTracks = loadTracksFromLibrary();
  
  // Создаем новые объекты треков
  const newTracks = filePaths.map(path => {
    const fileName = path.split(/[\\/]/).pop();
    const name = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    // Создаем трек с базовыми данными
    const track = {
      id: 'lib_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: name,
      artist: 'Неизвестный исполнитель',
      path: path,
      duration: 0,
      addedAt: new Date().toISOString()
    };
    
    // Загружаем метаданные трека асинхронно
    loadTrackMetadata(track);
    
    return track;
  });
  
  // Объединяем с существующими треками
  libraryTracks = [...libraryTracks, ...newTracks];
  
  // Сохраняем в localStorage
  saveTracksToLibrary(libraryTracks);
  
  // Обновляем отображение
  loadLibraryTracks();
  
  showNotification(`Добавлено ${newTracks.length} треков в библиотеку`, 'success');
}

// Загрузка метаданных трека (длительность и др.)
function loadTrackMetadata(track) {
  const audio = new Audio();
  
  // Добавляем обработчик события, когда метаданные загрузятся
  audio.addEventListener('loadedmetadata', () => {
    // Обновляем длительность трека
    track.duration = audio.duration;
    
    // Обновляем трек в библиотеке
    updateTrackInLibrary(track);
    
    // Если этот трек отображается в библиотеке, обновляем его
    updateTrackDisplayInLibrary(track);
    
    console.log(`Загружены метаданные для трека: ${track.title}, длительность: ${track.duration}`);
  });
  
  // Добавляем обработчик ошибок
  audio.addEventListener('error', () => {
    console.error(`Ошибка при загрузке метаданных для трека: ${track.title}`);
  });
  
  // Загружаем аудиофайл для получения метаданных
  audio.src = track.path;
}

// Обновление трека в библиотеке
function updateTrackInLibrary(updatedTrack) {
  const libraryTracks = loadTracksFromLibrary();
  const index = libraryTracks.findIndex(t => t.id === updatedTrack.id);
  
  if (index !== -1) {
    libraryTracks[index] = updatedTrack;
    saveTracksToLibrary(libraryTracks);
  }
}

// Обновление отображения трека в библиотеке
function updateTrackDisplayInLibrary(track) {
  const trackElement = document.querySelector(`.library-track-item[data-id="${track.id}"]`);
  if (trackElement) {
    const durationElement = trackElement.querySelector('.duration');
    if (durationElement) {
      durationElement.textContent = formatTime(track.duration);
    }
  }
}

// Воспроизведение трека из библиотеки
function playLibraryTrack(track) {
  // Создаем аудио-элемент для воспроизведения
  const audio = new Audio(track.path);
  
  // Устанавливаем громкость
  audio.volume = volume;
  
  // Обновляем информацию о текущем треке
  currentTrack = track;
  audioPlayer.src = track.path;
  audioPlayer.play();
  isPlaying = true;
  
  // Обновляем UI воспроизведения
  updateNowPlayingInfo();
  updateNowPlayingBanner();
  updatePlayPauseButton();
  
  // Добавляем трек в историю воспроизведения
  if (playHistory) {
    playHistory.push(track.id);
  }
  
  console.log(`Воспроизведение трека: ${track.title}`);
}

// Показать диалог добавления трека в плейлист
function showAddToPlaylistDialog(track) {
  console.log(`Открытие диалога добавления трека в плейлист: ${track.title}`);
  
  // Находим модальное окно
  const modal = document.getElementById('add-to-playlist-modal');
  if (!modal) {
    console.error('Модальное окно add-to-playlist-modal не найдено!');
    showNotification('Ошибка: модальное окно не найдено', 'error');
    return;
  }
  
  // Заполняем информацию о треке
  const trackInfoElement = modal.querySelector('#add-track-info');
  if (trackInfoElement) {
    trackInfoElement.innerHTML = `
      <div class="track-title">${track.title || 'Неизвестный трек'}</div>
      <div class="track-artist">${track.artist || 'Неизвестный исполнитель'}</div>
      ${track.album ? `<div class="track-album">Альбом: ${track.album}</div>` : ''}
    `;
  }
  
  // Отображаем список плейлистов
  const playlistListElement = modal.querySelector('#playlist-selection-list');
  if (playlistListElement) {
    // Очищаем список
    playlistListElement.innerHTML = '';
    
    // Проверяем, есть ли плейлисты
    if (!playlists || playlists.length === 0) {
      playlistListElement.innerHTML = `
        <div class="no-playlists-message">
          <p>У вас нет плейлистов</p>
          <p>Создайте плейлист перед добавлением трека</p>
        </div>
      `;
    } else {
      // Создаем элементы для каждого плейлиста
      playlists.forEach(playlist => {
        const playlistElement = document.createElement('div');
        playlistElement.className = 'playlist-select-item';
        playlistElement.dataset.id = playlist.id;
        
        // Используем цвет плейлиста или цвет по умолчанию
        const playlistColor = playlist.color || '#8c52ff';
        
        playlistElement.innerHTML = `
          <span class="playlist-select-icon material-icons" style="color: ${playlistColor};">playlist_play</span>
          <div class="playlist-select-name">${playlist.name}</div>
          <div class="playlist-select-count">${playlist.tracks ? playlist.tracks.length : 0}</div>
        `;
        
        playlistListElement.appendChild(playlistElement);
        
        // Добавляем обработчик клика для выбора плейлиста
        playlistElement.addEventListener('click', () => {
          // Удаляем класс активного у всех элементов
          document.querySelectorAll('.playlist-select-item').forEach(item => {
            item.classList.remove('active');
          });
          
          // Добавляем класс активного выбранному элементу
          playlistElement.classList.add('active');
          
          // Сохраняем ID выбранного плейлиста в атрибуте data-selected-playlist-id модального окна
          modal.dataset.selectedPlaylistId = playlist.id;
        });
      });
    }
  }
  
  // Настраиваем кнопки модального окна
  setupAddToPlaylistModalButtons(modal, track);
  
  // Сохраняем данные трека в атрибуте data-track-id модального окна
  modal.dataset.trackId = track.id;
  modal.dataset.trackData = JSON.stringify(track);
  
  // Открываем модальное окно
  openModal('add-to-playlist-modal');
  console.log('Модальное окно открыто для выбора плейлиста');
}

// Настройка кнопок в модальном окне добавления трека в плейлист
function setupAddToPlaylistModalButtons(modal, track) {
  // Находим кнопки
  const addButton = modal.querySelector('#add-to-playlist-btn');
  const cancelButton = modal.querySelector('#cancel-add-to-playlist-btn');
  const closeButton = modal.querySelector('.close-btn');
  
  // Настраиваем кнопку добавления
  if (addButton) {
    // Клонируем для удаления существующих обработчиков
    const newAddButton = addButton.cloneNode(true);
    addButton.parentNode.replaceChild(newAddButton, addButton);
    
    newAddButton.addEventListener('click', () => {
      const selectedPlaylistId = modal.dataset.selectedPlaylistId;
      if (selectedPlaylistId) {
        addTrackToPlaylist(track, selectedPlaylistId);
        closeModal('add-to-playlist-modal');
      } else {
        showNotification('Пожалуйста, выберите плейлист', 'error');
      }
    });
  }
  
  // Настраиваем кнопку отмены
  if (cancelButton) {
    // Клонируем для удаления существующих обработчиков
    const newCancelButton = cancelButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    
    newCancelButton.addEventListener('click', () => {
      closeModal('add-to-playlist-modal');
    });
  }
  
  // Настраиваем кнопку закрытия (X)
  if (closeButton) {
    // Клонируем для удаления существующих обработчиков
    const newCloseButton = closeButton.cloneNode(true);
    closeButton.parentNode.replaceChild(newCloseButton, closeButton);
    
    newCloseButton.addEventListener('click', () => {
      closeModal('add-to-playlist-modal');
    });
  }
}

// Добавление трека в плейлист
function addTrackToPlaylist(track, playlistId) {
  console.log(`Добавление трека "${track.title}" в плейлист с ID: ${playlistId}`);
  
  // Находим плейлист по ID
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) {
    console.error(`Плейлист с ID ${playlistId} не найден!`);
    showNotification('Ошибка: плейлист не найден', 'error');
    return false;
  }
  
  // Проверяем, есть ли этот трек уже в плейлисте
  if (playlist.tracks) {
    const existingTrack = playlist.tracks.find(t => t.id === track.id);
    if (existingTrack) {
      console.log(`Трек "${track.title}" уже присутствует в плейлисте "${playlist.name}"`);
      showNotification(`Трек уже присутствует в плейлисте "${playlist.name}"`, 'info');
      return false;
    }
  } else {
    // Если tracks не определён, создаём пустой массив
    playlist.tracks = [];
  }
  
  // Добавляем трек в плейлист
  playlist.tracks.push(track);
  
  // Сохраняем изменения в localStorage
  savePlaylists();
  
  // Если это текущий плейлист, обновляем его отображение
  if (currentPlaylist && currentPlaylist.id === playlist.id) {
    renderTracks(playlist.tracks);
  }
  
  // Обновляем отображение плейлистов (чтобы обновить счётчик треков)
  renderPlaylists();
  
  console.log(`Трек "${track.title}" успешно добавлен в плейлист "${playlist.name}"`);
  showNotification(`Трек добавлен в плейлист "${playlist.name}"`, 'success');
  
  return true;
}

// Сброс всех назначенных горячих клавиш
function resetAllHotkeys() {
  if (confirm('Вы уверены, что хотите сбросить все назначенные горячие клавиши?')) {
    playlistHotkeys = {};
    saveHotkeys();
    showNotification('Все горячие клавиши сброшены', 'success');
  }
}

// === НАСТРОЙКИ ===
function setupSettingsControls() {
  console.log('Настройка элементов управления в разделе настроек');
  
  // Получаем элементы интерфейса
  const themeSelect = document.getElementById('theme-select');
  const autostartToggle = document.getElementById('autostart-toggle');
  
  if (themeSelect) {
    // Устанавливаем текущую тему в селекте
    const currentTheme = localStorage.getItem('selectedTheme') || 'dark';
    themeSelect.value = currentTheme;
    
    // Добавляем обработчик изменения темы
    themeSelect.addEventListener('change', () => {
      const selectedTheme = themeSelect.value;
      console.log(`Выбрана тема: ${selectedTheme}`);
      changeTheme(selectedTheme);
      savePlayerSettings();
    });
    
    console.log(`Настроен селект темы, текущее значение: ${themeSelect.value}`);
  } else {
    console.warn('Не найден селект для выбора темы (#theme-select)');
  }
  
  // Настраиваем переключатель автозапуска
  if (autostartToggle) {
    // Получаем текущее состояние автозапуска
    if (window.electronAPI && window.electronAPI.getAutoStartEnabled) {
      window.electronAPI.getAutoStartEnabled().then(isEnabled => {
        console.log(`Текущий статус автозапуска: ${isEnabled}`);
        autostartToggle.checked = isEnabled;
        
        // Удаляем класс disabled-toggle и атрибут disabled
        autostartToggle.removeAttribute('disabled');
        autostartToggle.parentElement.classList.remove('disabled-toggle');
        
        // Удаляем метку "В разработке"
        const label = document.querySelector('.setting-label:has(+ .setting-control #autostart-toggle)');
        if (label) {
          const badge = label.querySelector('.dev-badge');
          if (badge) badge.remove();
        }
      }).catch(err => {
        console.error('Ошибка при получении статуса автозапуска:', err);
      });
    }
    
    // Добавляем обработчик для переключателя автозапуска
    autostartToggle.addEventListener('change', () => {
      if (window.electronAPI && window.electronAPI.setAutoStartEnabled) {
        window.electronAPI.setAutoStartEnabled(autostartToggle.checked)
          .then(success => {
            console.log(`Автозапуск ${autostartToggle.checked ? 'включен' : 'выключен'}: ${success}`);
          })
          .catch(err => {
            console.error('Ошибка при настройке автозапуска:', err);
            // В случае ошибки возвращаем прежнее состояние
            autostartToggle.checked = !autostartToggle.checked;
          });
      }
    });
  }
  
  // Настраиваем кнопку сброса горячих клавиш
  const resetHotkeysBtn = document.getElementById('reset-hotkeys-btn');
  if (resetHotkeysBtn) {
    resetHotkeysBtn.addEventListener('click', resetAllHotkeys);
  }
  
  console.log('Элементы управления в разделе настроек настроены');
}

// Изменение темы оформления
function changeTheme(theme) {
  console.log(`Изменение темы на: ${theme}`);
  
  // Сохраняем выбранную тему в localStorage
  localStorage.setItem('selectedTheme', theme);
  
  // Применяем тему
  applyTheme(theme);
  
  // Обновляем селект темы, если он существует
  const themeSelect = document.getElementById('theme-select');
  if (themeSelect) {
    themeSelect.value = theme;
  }
}

function applyTheme(theme) {
  console.log(`Применение темы: ${theme}`);
  
  // Удаляем все классы тем с body
  document.body.classList.remove('light-theme', 'dark-theme');
  
  if (theme === 'light') {
    // Применяем светлую тему
    document.body.classList.add('light-theme');
    console.log('Светлая тема применена');
  } else if (theme === 'dark') {
    // Применяем темную тему (по умолчанию, поэтому не нужно добавлять класс)
    document.body.classList.add('dark-theme');
    console.log('Темная тема применена');
  } else if (theme === 'system') {
    // Определяем системную тему через matchMedia
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.body.classList.add('light-theme');
      console.log('Системная тема (светлая) применена');
    } else {
      document.body.classList.add('dark-theme');
      console.log('Системная тема (темная) применена');
    }
    
    // Добавляем слушатель изменения системной темы
    setupSystemThemeListener();
  }
  
  console.log(`Текущие классы body: ${document.body.className}`);
}

function setupSystemThemeListener() {
  // Удаляем предыдущий слушатель, если он был
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeMediaQuery.addEventListener('change', (e) => {
    const theme = localStorage.getItem('selectedTheme');
    if (theme === 'system') {
      if (e.matches) {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        console.log('Системная тема изменилась на темную');
      } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        console.log('Системная тема изменилась на светлую');
      }
    }
  });
}

// Функция для удаления системных плейлистов
function removeSystemPlaylists() {
  // Находим и удаляем системные плейлисты
  const systemPlaylistIds = ['soundpad', 'all-tracks'];
  
  // Проверяем, если текущий плейлист - системный
  if (currentPlaylist && systemPlaylistIds.includes(currentPlaylist.id)) {
    currentPlaylist = null;
  }
  
  // Фильтруем массив плейлистов, оставляя только не системные
  const originalLength = playlists.length;
  playlists = playlists.filter(playlist => !systemPlaylistIds.includes(playlist.id));
  
  // Если были удалены плейлисты, сохраняем изменения
  if (originalLength !== playlists.length) {
    console.log(`Удалено ${originalLength - playlists.length} системных плейлистов`);
    savePlaylists();
    renderPlaylists();
  }
}

// Загрузка настроек плеера
function loadPlayerSettings() {
  console.log('Загрузка настроек плеера...');
  
  try {
    // Получаем настройки из localStorage
    const savedSettings = localStorage.getItem('playerSettings');
    
    // Если есть сохраненные настройки, применяем их
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      console.log('Загруженные настройки плеера:', settings);
      
      // Применяем настройки автозапуска воспроизведения
      if (settings.autoplay !== undefined) {
        const autoplayCheckbox = document.getElementById('autoplay-checkbox');
        if (autoplayCheckbox) {
          autoplayCheckbox.checked = settings.autoplay;
        }
      }
      
      // Применяем настройки громкости
      if (settings.volume !== undefined) {
        const volumeSlider = document.getElementById('volume-slider');
        if (volumeSlider) {
          volumeSlider.value = settings.volume;
        }
      }
    }
    
    // Проверяем, есть ли сохраненная тема
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
      console.log(`Загружена сохраненная тема: ${savedTheme}`);
      // Обновляем селект темы, если он существует
      const themeSelect = document.getElementById('theme-select');
      if (themeSelect) {
        themeSelect.value = savedTheme;
      }
    }
    
    console.log('Настройки плеера загружены успешно');
  } catch (error) {
    console.error('Ошибка при загрузке настроек плеера:', error);
  }
}

// Сохранение настроек плеера
function savePlayerSettings() {
  try {
    // Соберем все настройки плеера в один объект
    const settings = {
      volume: parseFloat(document.getElementById('volume-slider')?.value || 100),
      theme: localStorage.getItem('selectedTheme') || 'dark',
      autostart: document.getElementById('autostart-toggle')?.checked || false
    };
    
    // Сохраняем настройки в localStorage
    localStorage.setItem('playerSettings', JSON.stringify(settings));
    console.log('Настройки плеера сохранены:', settings);
  } catch (error) {
    console.error('Ошибка при сохранении настроек плеера:', error);
  }
}

// Настройка обработчиков IPC сообщений
function setupIPCHandlers() {
  // Проверяем доступность API
  if (!window.electronAPI) {
    console.error('Electron API недоступно');
    return;
  }
  
  // Регистрируем базовые обработчики событий
  try {
    // Обработка событий от главного процесса
    if (typeof window.electronAPI.onPlayPause === 'function') {
      window.electronAPI.onPlayPause((event) => {
        console.log('Получено событие play-pause');
        togglePlayPause();
      });
    }
    
    if (typeof window.electronAPI.onNextTrack === 'function') {
      window.electronAPI.onNextTrack((event) => {
        console.log('Получено событие next-track');
        playNextTrack();
      });
    }
    
    if (typeof window.electronAPI.onPreviousTrack === 'function') {
      window.electronAPI.onPreviousTrack((event) => {
        console.log('Получено событие previous-track');
        playPreviousTrack();
      });
    }
    
    if (typeof window.electronAPI.onPlayHotkey === 'function') {
      window.electronAPI.onPlayHotkey((event, keyName) => {
        console.log(`Получено событие play-hotkey с ключом: ${keyName}`);
        playHotkeySound(keyName);
      });
    }
    
    console.log('IPC обработчики установлены успешно');
  } catch (error) {
    console.error('Ошибка при настройке IPC обработчиков:', error);
  }
}

// Обработка окончания трека
function handleTrackEnd() {
  console.log('Трек закончился');
  
  // В зависимости от режима повтора
  if (repeatMode === 'repeat-one') {
    // Повторяем текущий трек
    console.log('Повторное воспроизведение трека (repeat-one)');
    audioPlayer.currentTime = 0;
    audioPlayer.play();
  } else if (repeatMode === 'repeat-all') {
    // Переходим к следующему треку (с повтором всего плейлиста)
    console.log('Переход к следующему треку (repeat-all)');
    playNextTrack();
  } else {
    // Переходим к следующему треку (без повтора)
    console.log('Переход к следующему треку (no-repeat)');
    playNextTrack();
  }
}

// Воспроизведение следующего трека
function playNextTrack() {
  if (!currentPlaylist || !currentTrack) {
    console.log('Нет текущего плейлиста или трека');
    return;
  }
  
  const tracks = currentPlaylist.tracks;
  if (!tracks || tracks.length === 0) {
    console.log('Плейлист пуст');
    return;
  }
  
  let nextIndex = -1;
  
  if (isShuffle) {
    // Воспроизводим случайный трек (кроме текущего)
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * tracks.length);
    } while (tracks.length > 1 && tracks[randomIndex].id === currentTrack.id);
    
    nextIndex = randomIndex;
    console.log('Выбран случайный трек (индекс):', nextIndex);
  } else {
    // Воспроизводим следующий трек по порядку
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    nextIndex = currentIndex + 1;
    
    // Если дошли до конца плейлиста
    if (nextIndex >= tracks.length) {
      if (repeatMode === 'repeat-all') {
        // При режиме повтора всех, переходим к первому треку
        nextIndex = 0;
        console.log('Достигнут конец плейлиста, повтор с начала');
      } else {
        // Иначе останавливаем воспроизведение
        console.log('Достигнут конец плейлиста, остановка');
        if (audioPlayer) {
          audioPlayer.pause();
          audioPlayer.currentTime = 0;
          isPlaying = false;
          updatePlayPauseButton();
        }
        return;
      }
    }
  }
  
  // Воспроизводим выбранный трек
  if (nextIndex >= 0 && nextIndex < tracks.length) {
    const nextTrack = tracks[nextIndex];
    console.log('Переход к следующему треку:', nextTrack.title);
    playTrack(nextTrack.id);
  }
}

// Воспроизведение предыдущего трека
function playPreviousTrack() {
  if (!currentPlaylist || !currentTrack) {
    console.log('Нет текущего плейлиста или трека');
    return;
  }
  
  const tracks = currentPlaylist.tracks;
  if (!tracks || tracks.length === 0) {
    console.log('Плейлист пуст');
    return;
  }
  
  // Если трек играет уже более 3 секунд, начинаем его сначала
  if (audioPlayer && audioPlayer.currentTime > 3) {
    console.log('Воспроизведение текущего трека с начала');
    audioPlayer.currentTime = 0;
    return;
  }
  
  let prevIndex = -1;
  
  if (isShuffle) {
    // Воспроизводим случайный трек (кроме текущего)
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * tracks.length);
    } while (tracks.length > 1 && tracks[randomIndex].id === currentTrack.id);
    
    prevIndex = randomIndex;
    console.log('Выбран случайный трек (индекс):', prevIndex);
  } else {
    // Воспроизводим предыдущий трек по порядку
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    prevIndex = currentIndex - 1;
    
    // Если в начале плейлиста
    if (prevIndex < 0) {
      if (repeatMode === 'repeat-all') {
        // При режиме повтора всех, переходим к последнему треку
        prevIndex = tracks.length - 1;
        console.log('Достигнуто начало плейлиста, переход к последнему треку');
      } else {
        // Иначе остаемся на первом треке
        console.log('Достигнуто начало плейлиста, воспроизведение с начала');
        audioPlayer.currentTime = 0;
        return;
      }
    }
  }
  
  // Воспроизводим выбранный трек
  if (prevIndex >= 0 && prevIndex < tracks.length) {
    const prevTrack = tracks[prevIndex];
    console.log('Переход к предыдущему треку:', prevTrack.title);
    playTrack(prevTrack.id);
  }
}

// Инициализация приложения при загрузке документа
document.addEventListener('DOMContentLoaded', initializeApp);

// Обновление вида кнопки повтора в зависимости от режима
function updateRepeatButton() {
  const repeatBtn = document.getElementById('repeat-btn');
  if (!repeatBtn) return;
  
  const icon = repeatBtn.querySelector('.material-icons');
  if (!icon) return;
  
  // Удаляем все классы состояния
  repeatBtn.classList.remove('active', 'repeat-one');
  
  // Обновляем класс и иконку в зависимости от режима
  if (repeatMode === 'repeat-all') {
    repeatBtn.classList.add('active');
    icon.textContent = 'repeat';
    console.log('Обновлена кнопка повтора: repeat-all');
  } else if (repeatMode === 'repeat-one') {
    repeatBtn.classList.add('active', 'repeat-one');
    icon.textContent = 'repeat_one';
    console.log('Обновлена кнопка повтора: repeat-one');
  } else {
    icon.textContent = 'repeat';
    console.log('Обновлена кнопка повтора: no-repeat');
  }
}

// Обновление прогресс-бара и времени воспроизведения
function updateProgress() {
  if (!audioPlayer || !currentTrack) return;
  
  const currentTimeEl = document.getElementById('current-time');
  const durationEl = document.getElementById('duration');
  const progressFill = document.getElementById('progress-fill');
  
  if (!currentTimeEl || !durationEl || !progressFill) return;
  
  // Получаем текущее время и длительность
  const currentTime = audioPlayer.currentTime;
  const duration = audioPlayer.duration || 0;
  
  // Обновляем отображение времени
  currentTimeEl.textContent = formatTime(currentTime);
  durationEl.textContent = formatTime(duration);
  
  // Обновляем прогресс-бар
  const progressPercent = (currentTime / duration) * 100;
  progressFill.style.width = `${progressPercent}%`;
}

// Перемотка трека при клике на прогресс-бар
function seekTrack(e) {
  if (!audioPlayer || !currentTrack) return;
  
  const progressBar = document.getElementById('progress-bar');
  if (!progressBar) return;
  
  // Вычисляем новую позицию
  const clickPosition = (e.clientX - progressBar.getBoundingClientRect().left) / progressBar.offsetWidth;
  const newTime = clickPosition * audioPlayer.duration;
  
  // Устанавливаем новое время
  audioPlayer.currentTime = newTime;
  console.log(`Перемотка трека на: ${formatTime(newTime)}`);
}

// Форматирование времени в формат MM:SS
function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Форматирование названия клавиши для отображения и сохранения
function formatKeyName(e) {
  let keyName = e.key;
  const modifiers = [];
  
  // Обрабатываем модификаторы
  if (e.ctrlKey && keyName !== 'Control') modifiers.push('Ctrl');
  if (e.altKey && keyName !== 'Alt') modifiers.push('Alt');
  if (e.shiftKey && keyName !== 'Shift') modifiers.push('Shift');
  if (e.metaKey && keyName !== 'Meta') modifiers.push('Meta');
  
  // Преобразуем специальные клавиши в более понятные имена
  switch (keyName) {
    case ' ':
      keyName = 'Space';
      break;
    case 'ArrowUp':
      keyName = '↑';
      break;
    case 'ArrowDown':
      keyName = '↓';
      break;
    case 'ArrowLeft':
      keyName = '←';
      break;
    case 'ArrowRight':
      keyName = '→';
      break;
    case 'Escape':
      keyName = 'Esc';
      break;
  }
  
  // Комбинируем модификаторы и основную клавишу
  if (modifiers.length > 0) {
    return `${modifiers.join('+')}+${keyName}`;
  } else {
    return keyName;
  }
}

// Обработка нажатия клавиш для горячих клавиш
function handleKeydown(e) {
  console.log(`Нажата клавиша: ${e.key}, код: ${e.keyCode}`);
  
  // Получаем отформатированное имя клавиши
  let keyName = formatKeyName(e);
  
  // Пропускаем нажатия в полях ввода
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    console.log('Нажатие в поле ввода, игнорируем для горячих клавиш');
    return;
  }
  
  // Пропускаем нажатия в модальных окнах (кроме специальных случаев)
  const isModalOpen = document.querySelector('.modal.active') !== null;
  if (isModalOpen && !e.target.classList.contains('hotkey-input')) {
    console.log('Модальное окно открыто, игнорируем горячие клавиши');
    return;
  }
  
  console.log(`Проверка горячей клавиши: ${keyName}`);
  
  // Проверяем глобальные хоткеи для управления плеером
  if (keyName === 'Ctrl+Alt+P') {
    console.log('Глобальная горячая клавиша: Воспроизведение/Пауза');
    togglePlayPause();
    e.preventDefault();
    return;
  } else if (keyName === 'Ctrl+Alt+→') {
    console.log('Глобальная горячая клавиша: Следующий трек');
    playNextTrack();
    e.preventDefault();
    return;
  } else if (keyName === 'Ctrl+Alt+←') {
    console.log('Глобальная горячая клавиша: Предыдущий трек');
    playPreviousTrack();
    e.preventDefault();
    return;
  }
  
  // Проверяем горячие клавиши для текущего плейлиста
  if (currentPlaylist && playlistHotkeys[currentPlaylist.id]) {
    // Проверяем как отформатированный ключ, так и простой ключ
    if (playlistHotkeys[currentPlaylist.id][keyName]) {
      console.log(`Найдена горячая клавиша ${keyName} для текущего плейлиста`);
      playHotkeySound(keyName);
      e.preventDefault();
      return;
    }
    
    // Также проверяем по прямому ключу (например, для функциональных клавиш)
    if (playlistHotkeys[currentPlaylist.id][e.key]) {
      console.log(`Найдена горячая клавиша ${e.key} для текущего плейлиста`);
      playHotkeySound(e.key);
      e.preventDefault();
      return;
    }
  } else {
    console.log('Текущий плейлист не выбран или нет горячих клавиш для него');
  }
  
  console.log('Горячая клавиша не найдена для этого нажатия');
}

// Функция удаления трека из плейлиста
function deleteTrack(trackId) {
  console.log(`Удаление трека с ID: ${trackId}`);
  
  // Проверяем, есть ли текущий плейлист
  if (!currentPlaylist) {
    console.error('Не выбран плейлист для удаления трека');
    showNotification('Не выбран плейлист для удаления трека', 'error');
    return;
  }
  
  // Проверяем, есть ли треки в плейлисте
  if (!currentPlaylist.tracks || !Array.isArray(currentPlaylist.tracks)) {
    console.error('В текущем плейлисте нет треков');
    return;
  }
  
  // Ищем индекс трека в массиве
  const trackIndex = currentPlaylist.tracks.findIndex(track => track.id === trackId);
  
  // Если трек найден, удаляем его
  if (trackIndex !== -1) {
    // Если это текущий воспроизводимый трек, останавливаем воспроизведение
    if (currentTrack && currentTrack.id === trackId) {
      stopPlayback();
    }
    
    // Удаляем трек из массива
    currentPlaylist.tracks.splice(trackIndex, 1);
    
    // Сохраняем обновленные плейлисты
    savePlaylists();
    
    // Обновляем отображение треков
    renderTracks(currentPlaylist.tracks);
    
    // Обновляем информацию о плейлисте
    updatePlaylistInfo();
    
    console.log(`Трек с ID ${trackId} успешно удален из плейлиста "${currentPlaylist.name}"`);
    showNotification('Трек удален из плейлиста', 'success');
  } else {
    console.error(`Трек с ID ${trackId} не найден в текущем плейлисте`);
    showNotification('Трек не найден в плейлисте', 'error');
  }
}

// Обновление информации о плейлисте (количество треков и т.д.)
function updatePlaylistInfo() {
  // Обновляем количество треков в боковой панели для текущего плейлиста
  if (currentPlaylist) {
    const playlistItem = document.querySelector(`.playlist-item[data-id="${currentPlaylist.id}"]`);
    if (playlistItem) {
      const countElement = playlistItem.querySelector('.playlist-info');
      if (countElement) {
        const trackCount = currentPlaylist.tracks ? currentPlaylist.tracks.length : 0;
        countElement.textContent = `${trackCount} трек(ов)`;
      }
    }
  }
}

// Функция удаления трека из плейлиста
function deleteTrackFromPlaylist(trackId) {
  console.log(`Запрос на удаление трека с ID: ${trackId}`);
  
  if (!currentPlaylist) {
    console.error('Плейлист не выбран');
    showNotification('Плейлист не выбран', 'error');
    return;
  }
  
  // Находим индекс трека в текущем плейлисте
  const trackIndex = currentPlaylist.tracks.findIndex(t => t.id === trackId);
  if (trackIndex === -1) {
    console.error(`Трек с ID ${trackId} не найден в текущем плейлисте`);
    showNotification('Трек не найден в плейлисте', 'error');
    return;
  }
  
  // Получаем информацию о треке для отображения в сообщении
  const track = currentPlaylist.tracks[trackIndex];
  
  // Подтверждение удаления
  if (!confirm(`Вы уверены, что хотите удалить трек "${track.title}" из плейлиста?`)) {
    console.log('Пользователь отменил удаление трека');
    return;
  }
  
  // Если удаляемый трек сейчас воспроизводится, останавливаем его
  if (currentTrack && currentTrack.id === trackId) {
    console.log('Удаляемый трек сейчас воспроизводится, останавливаем');
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    isPlaying = false;
    currentTrack = null;
    updateNowPlayingInfo();
    updatePlayPauseButton();
  }
  
  // Удаляем трек из плейлиста
  currentPlaylist.tracks.splice(trackIndex, 1);
  console.log(`Трек "${track.title}" удален из плейлиста "${currentPlaylist.name}"`);
  
  // Сохраняем изменения
  savePlaylists();
  
  // Перерисовываем список треков
  renderTracks(currentPlaylist.tracks);
  
  // Очищаем привязку горячей клавиши к удаленному треку, если есть
  if (playlistHotkeys[currentPlaylist.id]) {
    // Проходим по всем горячим клавишам текущего плейлиста
    for (const [key, value] of Object.entries(playlistHotkeys[currentPlaylist.id])) {
      if (value === trackId) {
        // Если нашли привязку к удаленному треку, удаляем ее
        delete playlistHotkeys[currentPlaylist.id][key];
        console.log(`Удалена привязка горячей клавиши ${key} к удаленному треку`);
      }
    }
    
    // Сохраняем изменения
    saveHotkeys();
  }
  
  // Обновляем информацию о количестве треков в плейлисте
  renderPlaylists();
  
  // Показываем уведомление
  showNotification(`Трек "${track.title}" удален из плейлиста`, 'success');
}

// Функция для поиска треков в текущем плейлисте
function searchTracks(query) {
  console.log(`Выполняется поиск в текущем плейлисте: "${query}"`);
  
  // Если нет текущего плейлиста, не выполняем поиск
  if (!currentPlaylist || !currentPlaylist.tracks) {
    console.log('Текущий плейлист не выбран или пуст');
    return;
  }
  
  // Если поисковый запрос пуст, показываем все треки плейлиста
  if (!query || query.trim() === '') {
    console.log('Пустой поисковый запрос, отображаем все треки плейлиста');
    renderTracks(currentPlaylist.tracks);
    return;
  }
  
  // Фильтруем треки по поисковому запросу (поиск по названию и исполнителю)
  query = query.toLowerCase().trim();
  const filteredTracks = currentPlaylist.tracks.filter(track => {
    const title = (track.title || '').toLowerCase();
    const artist = (track.artist || '').toLowerCase();
    const album = (track.album || '').toLowerCase();
    
    return title.includes(query) || artist.includes(query) || album.includes(query);
  });
  
  console.log(`Найдено ${filteredTracks.length} треков в плейлисте по запросу "${query}"`);
  
  // Отображаем результаты поиска
  renderTracks(filteredTracks);
  
  // Если нет результатов, показываем сообщение
  const container = document.getElementById('tracks-grid');
  if (container && filteredTracks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons">search_off</span>
        <p>По запросу "${query}" ничего не найдено в плейлисте</p>
        <p>Попробуйте изменить запрос или очистить поле поиска</p>
      </div>
    `;
  }
}