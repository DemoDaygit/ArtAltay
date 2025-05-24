import React, { useState, useEffect, useRef } from 'react';
import { 
  Bug, X, ChevronDown, ChevronUp, RefreshCw, Download, 
  Trash2, Settings, Database, Zap, Cpu, ArrowLeft, 
  Layers, Eye, EyeOff, Code, Server, Activity, 
  Smartphone, Wifi, WifiOff, Moon, Sun, Copy, Check
} from 'lucide-react';
import { useTelegram } from '../../hooks/useTelegram';
import apiService from '../../services/api';

const DebugPanel = ({ onClose, appState, appVersion, environment }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState([]);
  const [networkRequests, setNetworkRequests] = useState([]);
  const [showFloatingButton, setShowFloatingButton] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [settings, setSettings] = useState({
    environment: environment || 'production',
    theme: 'system',
    logLevel: 'info',
    mockData: false,
    slowNetwork: false,
    showDevTools: true
  });
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);
  
  const logsEndRef = useRef(null);
  const { user } = useTelegram();

  // Инициализация при монтировании компонента
  useEffect(() => {
    // Добавляем начальные логи
    addLog('info', 'Debug panel initialized');
    addLog('info', `App version: ${appVersion || '1.0.0'}`);
    addLog('info', `Environment: ${settings.environment}`);
    addLog('info', `User: ${user?.id ? `${user.first_name} (ID: ${user.id})` : 'Not authenticated'}`);
    
    // Перехватываем сетевые запросы
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      const options = args[1] || {};
      const startTime = performance.now();
      
      addNetworkRequest({
        url: typeof url === 'string' ? url : url.url,
        method: options.method || 'GET',
        status: 'pending',
        startTime
      });
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        updateNetworkRequest(url, {
          status: response.ok ? 'success' : 'error',
          statusCode: response.status,
          duration,
          endTime
        });
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        updateNetworkRequest(url, {
          status: 'error',
          error: error.message,
          duration,
          endTime
        });
        
        throw error;
      }
    };
    
    // Перехватываем консольные методы
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error
    };
    
    console.log = (...args) => {
      addLog('log', args.map(arg => formatLogArgument(arg)).join(' '));
      originalConsole.log(...args);
    };
    
    console.info = (...args) => {
      addLog('info', args.map(arg => formatLogArgument(arg)).join(' '));
      originalConsole.info(...args);
    };
    
    console.warn = (...args) => {
      addLog('warn', args.map(arg => formatLogArgument(arg)).join(' '));
      originalConsole.warn(...args);
    };
    
    console.error = (...args) => {
      addLog('error', args.map(arg => formatLogArgument(arg)).join(' '));
      originalConsole.error(...args);
    };
    
    // Восстанавливаем оригинальные методы при размонтировании
    return () => {
      window.fetch = originalFetch;
      console.log = originalConsole.log;
      console.info = originalConsole.info;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    };
  }, []);

  // Фильтрация логов при изменении поискового запроса
  useEffect(() => {
    if (searchQuery) {
      setFilteredLogs(logs.filter(log => 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.type.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredLogs(logs);
    }
  }, [logs, searchQuery]);

  // Прокрутка к последнему логу
  useEffect(() => {
    if (logsEndRef.current && activeTab === 'logs') {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, activeTab]);

  const formatLogArgument = (arg) => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  };

  const addLog = (type, message) => {
    const logEntry = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toISOString()
    };
    
    setLogs(prevLogs => [...prevLogs, logEntry]);
  };

  const addNetworkRequest = (request) => {
    const requestEntry = {
      id: Date.now(),
      ...request
    };
    
    setNetworkRequests(prevRequests => [...prevRequests, requestEntry]);
  };

  const updateNetworkRequest = (url, updates) => {
    setNetworkRequests(prevRequests => 
      prevRequests.map(req => 
        (req.url === url && req.status === 'pending') 
          ? { ...req, ...updates } 
          : req
      )
    );
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared');
  };

  const clearNetworkRequests = () => {
    setNetworkRequests([]);
    addLog('info', 'Network requests cleared');
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    addLog('info', `Setting "${key}" changed to "${value}"`);
    
    // Применение настроек
    if (key === 'environment') {
      apiService.setEnvironment(value);
    } else if (key === 'mockData') {
      apiService.setUseMockData(value);
    } else if (key === 'slowNetwork') {
      apiService.setSimulateSlowNetwork(value);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `art-altay-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog('info', 'Logs exported');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const formatDuration = (ms) => {
    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`;
    } else {
      return `${(ms / 1000).toFixed(2)}s`;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-slate-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-slate-300';
    }
  };

  // Компонент плавающей кнопки
  const FloatingButton = () => (
    <div 
      className={`fixed bottom-20 right-4 z-50 ${!showFloatingButton && 'hidden'}`}
      onClick={() => {
        setIsVisible(true);
        setShowFloatingButton(false);
      }}
    >
      <button className="bg-slate-800 hover:bg-slate-700 text-teal-400 p-3 rounded-full shadow-lg">
        <Bug className="w-6 h-6" />
      </button>
    </div>
  );

  // Компонент вкладки "Обзор"
  const OverviewTab = () => (
    <div className="space-y-4">
      {/* Информация о приложении */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-slate-300">Информация о приложении</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Версия:</span>
            <span>{appVersion || '1.0.0'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Окружение:</span>
            <span className={
              settings.environment === 'production' ? 'text-green-400' :
              settings.environment === 'staging' ? 'text-yellow-400' :
              'text-blue-400'
            }>
              {settings.environment}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">React:</span>
            <span>{React.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">User Agent:</span>
            <span className="truncate max-w-[200px]">{navigator.userAgent}</span>
          </div>
        </div>
      </div>

      {/* Состояние приложения */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Состояние приложения</h3>
          <button 
            onClick={() => copyToClipboard(JSON.stringify(appState, null, 2))}
            className="text-teal-400 hover:text-teal-300 p-1"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Текущий экран:</span>
            <span>{appState?.currentView || 'home'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Пользователь:</span>
            <span>{user ? `${user.first_name} (ID: ${user.id})` : 'Не авторизован'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Элементов в корзине:</span>
            <span>{appState?.cart?.size || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Элементов в избранном:</span>
            <span>{appState?.favorites?.size || 0}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="text-xs text-slate-400 mb-2">Полное состояние:</div>
          <div className="bg-slate-900 p-2 rounded overflow-auto max-h-40 text-xs font-mono">
            <pre>{JSON.stringify(appState, null, 2)}</pre>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-slate-300">Статистика</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-700 rounded p-3">
            <div className="text-xs text-slate-400">Запросы к API</div>
            <div className="text-xl font-semibold">{networkRequests.length}</div>
          </div>
          <div className="bg-slate-700 rounded p-3">
            <div className="text-xs text-slate-400">Логи</div>
            <div className="text-xl font-semibold">{logs.length}</div>
          </div>
          <div className="bg-slate-700 rounded p-3">
            <div className="text-xs text-slate-400">Ошибки</div>
            <div className="text-xl font-semibold text-red-400">
              {logs.filter(log => log.type === 'error').length}
            </div>
          </div>
          <div className="bg-slate-700 rounded p-3">
            <div className="text-xs text-slate-400">Предупреждения</div>
            <div className="text-xl font-semibold text-yellow-400">
              {logs.filter(log => log.type === 'warn').length}
            </div>
          </div>
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-slate-300">Быстрые действия</h3>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={clearLogs}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Очистить логи
          </button>
          <button 
            onClick={clearNetworkRequests}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Очистить запросы
          </button>
          <button 
            onClick={exportLogs}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-2" /> Экспорт логов
          </button>
          <button 
            onClick={() => {
              localStorage.clear();
              addLog('info', 'Local storage cleared');
            }}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Очистить хранилище
          </button>
        </div>
      </div>
    </div>
  );

  // Компонент вкладки "Логи"
  const LogsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Поиск в логах..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button 
          onClick={clearLogs}
          className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button 
          onClick={exportLogs}
          className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-300">Логи ({filteredLogs.length})</h3>
          <div className="flex space-x-1">
            <button 
              onClick={() => setFilteredLogs(logs.filter(log => log.type === 'error'))}
              className={`px-2 py-1 rounded text-xs ${logs.some(log => log.type === 'error') ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}
            >
              Ошибки ({logs.filter(log => log.type === 'error').length})
            </button>
            <button 
              onClick={() => setFilteredLogs(logs.filter(log => log.type === 'warn'))}
              className={`px-2 py-1 rounded text-xs ${logs.some(log => log.type === 'warn') ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}
            >
              Предупреждения ({logs.filter(log => log.type === 'warn').length})
            </button>
            <button 
              onClick={() => setFilteredLogs(logs)}
              className="px-2 py-1 rounded text-xs bg-slate-700 text-slate-400 hover:bg-slate-600"
            >
              Все
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-80">
          {filteredLogs.length > 0 ? (
            <div className="divide-y divide-slate-700">
              {filteredLogs.map(log => (
                <div key={log.id} className="p-2 text-xs hover:bg-slate-700/50">
                  <div className="flex items-start">
                    <span className="text-slate-500 mr-2">{formatTime(log.timestamp)}</span>
                    <span className={`uppercase font-semibold mr-2 ${getLogColor(log.type)}`}>
                      {log.type}
                    </span>
                    <span className="flex-1 font-mono break-all">{log.message}</span>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500 text-sm">
              {searchQuery ? 'Нет результатов поиска' : 'Нет логов'}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Компонент вкладки "Сеть"
  const NetworkTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-300">Сетевые запросы ({networkRequests.length})</h3>
        <div className="flex space-x-2">
          <button 
            onClick={clearNetworkRequests}
            className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-y-auto max-h-80">
          {networkRequests.length > 0 ? (
            <div className="divide-y divide-slate-700">
              {networkRequests.map(request => (
                <div key={request.id} className="p-3 text-xs hover:bg-slate-700/50">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center">
                      <span className={`font-semibold mr-2 ${
                        request.method === 'GET' ? 'text-green-400' :
                        request.method === 'POST' ? 'text-blue-400' :
                        request.method === 'PUT' ? 'text-yellow-400' :
                        request.method === 'DELETE' ? 'text-red-400' :
                        'text-slate-300'
                      }`}>
                        {request.method}
                      </span>
                      <span className="font-mono truncate max-w-[200px]">{request.url}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full ${getStatusColor(request.status)} bg-opacity-20`}>
                      {request.status === 'pending' ? 'Ожидание' : 
                       request.status === 'success' ? `${request.statusCode || 200}` : 
                       'Ошибка'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>{formatTime(request.startTime)}</span>
                    {request.duration && (
                      <span className={request.duration > 1000 ? 'text-yellow-400' : 'text-slate-400'}>
                        {formatDuration(request.duration)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500 text-sm">
              Нет сетевых запросов
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Компонент вкладки "Настройки"
  const SettingsTab = () => (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-slate-300">Настройки окружения</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Окружение</label>
            <select
              value={settings.environment}
              onChange={(e) => handleSettingChange('environment', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Тема</label>
            <div className="flex space-x-2">
              <button 
                onClick={() => handleSettingChange('theme', 'system')}
                className={`flex-1 px-3 py-2 rounded text-sm flex items-center justify-center ${
                  settings.theme === 'system' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                <Settings className="w-4 h-4 mr-2" /> Системная
              </button>
              <button 
                onClick={() => handleSettingChange('theme', 'dark')}
                className={`flex-1 px-3 py-2 rounded text-sm flex items-center justify-center ${
                  settings.theme === 'dark' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                <Moon className="w-4 h-4 mr-2" /> Темная
              </button>
              <button 
                onClick={() => handleSettingChange('theme', 'light')}
                className={`flex-1 px-3 py-2 rounded text-sm flex items-center justify-center ${
                  settings.theme === 'light' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                <Sun className="w-4 h-4 mr-2" /> Светлая
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-slate-300">Настройки отладки</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Использовать мок-данные</div>
              <div className="text-xs text-slate-400">Использовать тестовые данные вместо API</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.mockData}
                onChange={(e) => handleSettingChange('mockData', e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Имитировать медленную сеть</div>
              <div className="text-xs text-slate-400">Добавить задержку к сетевым запросам</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.slowNetwork}
                onChange={(e) => handleSettingChange('slowNetwork', e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Показывать инструменты разработчика</div>
              <div className="text-xs text-slate-400">Отображать отладочную информацию</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.showDevTools}
                onChange={(e) => handleSettingChange('showDevTools', e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400 mb-1">Уровень логирования</label>
            <select
              value={settings.logLevel}
              onChange={(e) => handleSettingChange('logLevel', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white"
            >
              <option value="error">Только ошибки</option>
              <option value="warn">Предупреждения и ошибки</option>
              <option value="info">Информация, предупреждения и ошибки</option>
              <option value="debug">Все (включая отладку)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-slate-300">Действия</h3>
        <div className="space-y-2">
          <button 
            onClick={() => {
              localStorage.clear();
              addLog('info', 'Local storage cleared');
            }}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Очистить локальное хранилище
          </button>
          <button 
            onClick={() => {
              window.location.reload();
            }}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Перезагрузить приложение
          </button>
        </div>
      </div>
    </div>
  );

  // Компонент вкладки "Система"
  const SystemTab = () => (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-slate-300">Информация о системе</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Платформа:</span>
            <span>{navigator.platform}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Браузер:</span>
            <span>{navigator.userAgent.match(/chrome|firefox|safari|edge|opera/i)?.[0] || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Язык:</span>
            <span>{navigator.language}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Cookies включены:</span>
            <span>{navigator.cookieEnabled ? 'Да' : 'Нет'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Онлайн:</span>
            <span className={navigator.onLine ? 'text-green-400' : 'text-red-400'}>
              {navigator.onLine ? 'Да' : 'Нет'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-slate-300">Производительность</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Память:</span>
              <span>
                {window.performance && window.performance.memory 
                  ? `${Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024))} MB / 
                     ${Math.round(window.performance.memory.jsHeapSizeLimit / (1024 * 1024))} MB`
                  : 'Недоступно'}
              </span>
            </div>
            {window.performance && window.performance.memory && (
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div 
                  className="bg-teal-500 h-1.5 rounded-full" 
                  style={{ 
                    width: `${(window.performance.memory.usedJSHeapSize / window.performance.memory.jsHeapSizeLimit) * 100}%` 
                  }}
                ></div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700 rounded p-3">
              <div className="text-xs text-slate-400">Время загрузки</div>
              <div className="text-lg font-semibold">
                {window.performance 
                  ? `${Math.round(window.performance.timing.loadEventEnd - window.performance.timing.navigationStart)} ms`
                  : 'N/A'}
              </div>
            </div>
            <div className="bg-slate-700 rounded p-3">
              <div className="text-xs text-slate-400">DOM готов</div>
              <div className="text-lg font-semibold">
                {window.performance 
                  ? `${Math.round(window.performance.timing.domComplete - window.performance.timing.domLoading)} ms`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 text-slate-300">Telegram WebApp</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Версия:</span>
            <span>{window.Telegram?.WebApp?.version || 'Недоступно'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Платформа:</span>
            <span>{window.Telegram?.WebApp?.platform || 'Недоступно'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Цветовая схема:</span>
            <span>{window.Telegram?.WebApp?.colorScheme || 'Недоступно'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Тема:</span>
            <span>{window.Telegram?.WebApp?.themeParams ? 'Доступна' : 'Недоступна'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isVisible) {
    return <FloatingButton />;
  }

  return (
    <>
      <FloatingButton />
      
      <div className={`fixed inset-x-0 bottom-0 z-50 bg-slate-900 border-t border-slate-700 shadow-lg transition-all duration-300 ${
        isExpanded ? 'h-[80vh]' : 'h-auto'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700">
          <div className="flex items-center">
            <Bug className="w-5 h-5 text-teal-400 mr-2" />
            <h2 className="font-semibold text-sm">Debug Panel</h2>
            <span className="ml-2 text-xs bg-teal-600/20 text-teal-400 px-1.5 py-0.5 rounded">
              {settings.environment}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-slate-700 rounded"
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => {
                setIsVisible(false);
                setShowFloatingButton(true);
              }}
              className="p-1 hover:bg-slate-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 overflow-x-auto">
          {[
            { id: 'overview', label: 'Обзор', icon: Layers },
            { id: 'logs', label: 'Логи', icon: Code },
            { id: 'network', label: 'Сеть', icon: Server },
            { id: 'settings', label: 'Настройки', icon: Settings },
            { id: 'system', label: 'Система', icon: Cpu }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-teal-400 border-b-2 border-teal-400' 
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
              {tab.id === 'logs' && logs.filter(log => log.type === 'error').length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {logs.filter(log => log.type === 'error').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-3 overflow-y-auto" style={{ maxHeight: isExpanded ? 'calc(80vh - 90px)' : '300px' }}>
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'logs' && <LogsTab />}
          {activeTab === 'network' && <NetworkTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'system' && <SystemTab />}
        </div>
      </div>
    </>
  );
};

export default DebugPanel;
