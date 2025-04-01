// Импортируем необходимые модули Electron
const { contextBridge, ipcRenderer } = require('electron');

// Устанавливаем мост между рендер-процессом и основным процессом
contextBridge.exposeInMainWorld('electronAPI', {
  // Управление окном
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // Выбор аудио файлов
  selectAudioFiles: () => ipcRenderer.invoke('select-audio-files'),
  
  // Выбор папки с аудио файлами
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  
  // Сканирование папки
  scanFolder: (folderPath) => ipcRenderer.invoke('scan-folder', folderPath),
  
  // Сканирование всех MP3 файлов на компьютере
  scanAllMp3Files: () => ipcRenderer.invoke('scan-all-mp3-files'),
  
  // Получение платформы
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // События от главного процесса
  onPlayPause: (callback) => {
    ipcRenderer.on('play-pause', () => callback());
  },
  onNextTrack: (callback) => {
    ipcRenderer.on('next-track', () => callback());
  },
  onPreviousTrack: (callback) => {
    ipcRenderer.on('previous-track', () => callback());
  },
  onPlayHotkey: (callback) => {
    ipcRenderer.on('play-hotkey', (_, number) => callback(number));
  }
}); 