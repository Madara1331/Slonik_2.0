const { app, BrowserWindow, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const AutoLaunch = require('auto-launch');

// Создаем объект автозапуска
const autoLauncher = new AutoLaunch({
    name: 'SloNick 2.0 Beta',
    path: app.getPath('exe')
});

// Глобальная ссылка на окно
let mainWindow;

// Создаем основное окно приложения
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        frame: false, // Убираем стандартную рамку окна
        show: false, // Скрываем окно до завершения загрузки
        webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false
        }
    });

    // Загружаем основной HTML файл
    mainWindow.loadFile('index.html');

    // Показываем окно, когда оно готово
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Очищаем ссылку на окно при закрытии
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Создаем окно, когда приложение готово
app.whenReady().then(() => {
  createWindow();

  // Регистрируем глобальные горячие клавиши для SoundPad
  registerGlobalShortcuts();
  
  // В macOS обычно переоткрывают окно приложения, если
  // нажать на иконку в доке и нет других открытых окон
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Регистрация глобальных горячих клавиш
function registerGlobalShortcuts() {
  // Ctrl+Alt+P - Воспроизвести/Пауза
  globalShortcut.register('CommandOrControl+Alt+P', () => {
    if (mainWindow) {
      mainWindow.webContents.send('play-pause-track');
    }
  });
  
  // Ctrl+Alt+Right - Следующий трек
  globalShortcut.register('CommandOrControl+Alt+Right', () => {
    if (mainWindow) {
      mainWindow.webContents.send('next-track');
    }
  });
  
  // Ctrl+Alt+Left - Предыдущий трек
  globalShortcut.register('CommandOrControl+Alt+Left', () => {
    if (mainWindow) {
      mainWindow.webContents.send('previous-track');
    }
  });
  
  // Функциональные клавиши F1-F12 для быстрого воспроизведения звуков
  for (let i = 1; i <= 12; i++) {
    globalShortcut.register(`F${i}`, () => {
      if (mainWindow) {
        mainWindow.webContents.send('play-sound-hotkey', i);
      }
    });
  }
}

// Освобождаем ресурсы при выходе из приложения
app.on('will-quit', () => {
  // Отменяем регистрацию всех горячих клавиш
  globalShortcut.unregisterAll();
});

// Закрываем приложение, когда все окна закрыты
// кроме macOS, где приложения продолжают работать
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC обработчики для взаимодействия с рендер-процессом

// Управление окном (закрытие, сворачивание, разворачивание)
ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

// Проверяем, доступен ли метод selectAudioFiles
ipcMain.handle('select-audio-files', async () => {
  try {
    console.log('Обработка запроса выбора аудио файлов...');
    const result = await dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
        { name: 'Аудио файлы', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a'] }
      ],
      title: 'Выберите аудио файлы'
    });
    
    console.log('Результат диалога:', result);
    
    if (result.canceled) {
      console.log('Пользователь отменил выбор файлов');
      return [];
    }
    
    console.log(`Выбрано ${result.filePaths.length} файлов`);
    return result.filePaths;
  } catch (error) {
    console.error('Ошибка при выборе аудио файлов:', error);
    return [];
  }
});

// Проверяем функцию выбора папки
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Выберите папку с аудио файлами'
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.filePaths[0];
  } catch (error) {
    console.error('Ошибка при выборе папки:', error);
    return null;
  }
});

// Сканирование папки на аудиофайлы
ipcMain.handle('scan-folder', async (event, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath);
    const audioFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp3', '.wav', '.ogg', '.flac', '.m4a'].includes(ext);
    }).map(file => path.join(folderPath, file));
    
    return audioFiles;
  } catch (error) {
    console.error('Ошибка при сканировании папки:', error);
    return [];
  }
});

// Получение информации о версии приложения
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Получение информации о платформе
ipcMain.handle('get-platform', () => {
  return process.platform;
});

// Функция для сканирования всех MP3 файлов
ipcMain.handle('scan-all-mp3', async () => {
  try {
    console.log('Начало сканирования MP3 файлов...');
    
    // Получаем все диски в системе
    const drives = await getDrives();
    console.log('Найдены диски:', drives);
    
    // Массив для хранения найденных MP3 файлов
    let mp3Files = [];
    
    // Сканируем каждый диск
    for (const drive of drives) {
      console.log(`Сканирование диска ${drive}...`);
      const driveFiles = await findMp3Files(drive);
      mp3Files = [...mp3Files, ...driveFiles];
      
      // Если уже нашли много файлов, можем вернуть результаты не дожидаясь полного сканирования
      if (mp3Files.length > 500) {
        console.log(`Превышен порог файлов (${mp3Files.length}), прерываем дальнейшее сканирование`);
        break;
      }
    }
    
    console.log(`Найдено ${mp3Files.length} MP3 файлов`);
    return mp3Files;
  } catch (error) {
    console.error('Ошибка при сканировании MP3 файлов:', error);
    return [];
  }
});

// Функция получения доступных дисков в системе
async function getDrives() {
  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      // На Windows используем wmic для получения списка дисков
      exec('wmic logicaldisk get name', (error, stdout) => {
        if (error) {
          console.error('Ошибка при получении списка дисков:', error);
          // Даже в случае ошибки возвращаем хотя бы системный диск
          resolve(['C:']);
          return;
        }
        
        // Парсим вывод команды, получаем список дисков (C:, D:, и т.д.)
        const drives = stdout
          .split('\n')
          .filter(line => /^[A-Z]:/.test(line.trim()))
          .map(line => line.trim());
        
        if (drives.length === 0) {
          console.warn('Не найдено доступных дисков, используем системный диск');
          resolve(['C:']);
        } else {
          resolve(drives);
        }
      });
    } else if (process.platform === 'darwin') {
      // На macOS используем /Volumes
      fs.readdir('/Volumes', (err, files) => {
        if (err) {
          console.error('Ошибка при чтении /Volumes:', err);
          resolve(['/']);
          return;
        }
        resolve(['/'].concat(files.map(file => `/Volumes/${file}`)));
      });
    } else {
      // На Linux используем корневую директорию
      resolve(['/']);
    }
  });
}

// Функция для рекурсивного поиска MP3 файлов в директории
async function findMp3Files(directory) {
  const mp3Files = [];
  const queue = [directory];
  const visitedDirectories = new Set();
  
  // Папки, которые следует исключить из сканирования
  const excludeFolders = ['Windows', '$RECYCLE.BIN', 'System Volume Information', 'ProgramData', 'Program Files', 'Program Files (x86)', 'node_modules'];
  
  try {
    while (queue.length > 0) {
      const currentDir = queue.shift();
      
      // Проверяем, не сканировали ли мы уже эту директорию
      if (visitedDirectories.has(currentDir)) {
        continue;
      }
      
      visitedDirectories.add(currentDir);
      
      // Проверяем, не является ли директория одной из исключаемых
      const dirName = path.basename(currentDir);
      if (excludeFolders.includes(dirName)) {
        continue;
      }
      
      try {
        const files = await fs.promises.readdir(currentDir);
        
        for (const file of files) {
          const filePath = path.join(currentDir, file);
          
          try {
            const stats = await fs.promises.stat(filePath);
            
            if (stats.isDirectory()) {
              queue.push(filePath);
            } else if (file.toLowerCase().endsWith('.mp3')) {
              mp3Files.push({
                path: filePath,
                name: file,
                size: stats.size,
                lastModified: stats.mtime.toISOString()
              });
            }
          } catch (fileError) {
            // Игнорируем ошибки доступа к отдельным файлам
            continue;
          }
        }
      } catch (dirError) {
        // Игнорируем ошибки доступа к директориям
        continue;
      }
    }
    
    return mp3Files;
  } catch (error) {
    console.error(`Ошибка при сканировании: ${error.message}`);
    return mp3Files;
  }
}

// IPC обработчики для настроек автозапуска
ipcMain.handle('get-auto-launch-enabled', async () => {
  try {
    const isEnabled = await autoLauncher.isEnabled();
    return isEnabled;
  } catch (error) {
    console.error('Ошибка при проверке автозапуска:', error);
    return false;
  }
});

ipcMain.handle('set-auto-launch-enabled', async (event, enable) => {
  try {
    if (enable) {
      await autoLauncher.enable();
    } else {
      await autoLauncher.disable();
    }
    return true;
  } catch (error) {
    console.error('Ошибка при настройке автозапуска:', error);
    return false;
  }
}); 