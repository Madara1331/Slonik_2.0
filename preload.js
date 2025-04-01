const { contextBridge, ipcRenderer } = require('electron');

// Экспортируем API для взаимодействия с Electron из рендерера
contextBridge.exposeInMainWorld('electronAPI', {
  // Функции для управления окном
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  
  // Функции для работы с файловой системой
  selectAudioFiles: async () => {
    console.log('Вызов функции selectAudioFiles в preload.js');
    try {
      const result = await ipcRenderer.invoke('select-audio-files');
      console.log('Результат selectAudioFiles:', result);
      return result;
    } catch (error) {
      console.error('Ошибка в preload.js при выборе аудио файлов:', error);
      return [];
    }
  },
  
  selectFolder: async () => {
    console.log('Вызов функции selectFolder в preload.js');
    try {
      return await ipcRenderer.invoke('select-folder');
    } catch (error) {
      console.error('Ошибка в preload.js при выборе папки:', error);
      return null;
    }
  },
  
  scanFolder: async (folderPath) => {
    console.log('Вызов функции scanFolder в preload.js');
    try {
      return await ipcRenderer.invoke('scan-folder', folderPath);
    } catch (error) {
      console.error('Ошибка в preload.js при сканировании папки:', error);
      return [];
    }
  },
  
  scanAllMp3Files: async () => {
    console.log('Вызов функции scanAllMp3Files в preload.js');
    try {
      return await ipcRenderer.invoke('scan-all-mp3');
    } catch (error) {
      console.error('Ошибка в preload.js при сканировании MP3 файлов:', error);
      return [];
    }
  },
  
  // Функции для получения системной информации
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Функции для управления автозапуском
  getAutoStartEnabled: async () => {
    try {
      return await ipcRenderer.invoke('get-auto-launch-enabled');
    } catch (error) {
      console.error('Ошибка при получении статуса автозапуска:', error);
      return false;
    }
  },
  
  setAutoStartEnabled: async (enable) => {
    try {
      return await ipcRenderer.invoke('set-auto-launch-enabled', enable);
    } catch (error) {
      console.error('Ошибка при установке статуса автозапуска:', error);
      return false;
    }
  },
  
  // === Медиа управление и обработчики событий ===
  onPlayPause: (callback) => {
    console.log('Регистрация обработчика onPlayPause в preload.js');
    ipcRenderer.on('play-pause-track', callback);
  },
  
  onNextTrack: (callback) => {
    console.log('Регистрация обработчика onNextTrack в preload.js');
    ipcRenderer.on('next-track', callback);
  },
  
  onPreviousTrack: (callback) => {
    console.log('Регистрация обработчика onPreviousTrack в preload.js');
    ipcRenderer.on('previous-track', callback);
  },
  
  onPlayHotkey: (callback) => {
    console.log('Регистрация обработчика onPlayHotkey в preload.js');
    ipcRenderer.on('play-sound-hotkey', callback);
  },
  
  // === Работа с файлами ===
  findMp3File: (fileName) => ipcRenderer.invoke('find-mp3-file', fileName)
}); 