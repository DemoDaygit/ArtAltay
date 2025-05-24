import React, { useState, useEffect, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import MainScreen from './components/MainScreen/MainScreen';
import Catalog from './components/Catalog/Catalog';
import PersonalCabinet from './components/PersonalCabinet/PersonalCabinet';
import BookingSystem from './components/BookingSystem/BookingSystem';
import { Cart, Favorites } from './components/Cart/CartAndFavorites';
import DebugPanel from './components/DebugPanel/DebugPanel';
import apiService from './services/api';

// Импорт иконок
import { 
  Home, Search, User, ShoppingCart, Heart, 
  Menu, Settings, LogOut, Info, AlertCircle, X
} from 'lucide-react';

const App = () => {
  // Состояние приложения
  const [currentView, setCurrentView] = useState('home');
  const [previousView, setPreviousView] = useState(null);
  const [viewParams, setViewParams] = useState({});
  const [cart, setCart] = useState(new Map());
  const [favorites, setFavorites] = useState(new Set());
  const [bookings, setBookings] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [environment, setEnvironment] = useState('production');
  
  // Хук для работы с Telegram WebApp API
  const { 
    user, 
    tg, 
    ready, 
    hapticFeedback, 
    showMainButton, 
    hideMainButton, 
    setMainButtonText, 
    setMainButtonParams, 
    onMainButtonClick 
  } = useTelegram();

  // Инициализация приложения
  useEffect(() => {
    if (ready) {
      // Загрузка данных из localStorage
      loadPersistedData();
      
      // Настройка Telegram WebApp
      tg.expand();
      tg.enableClosingConfirmation();
      
      // Отслеживание аналитики
      apiService.trackEvent('app_opened', {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
      
      // Проверка наличия debug-режима
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('debug') === 'true') {
        setShowDebugPanel(true);
        setEnvironment('development');
      }
    }
  }, [ready]);

  // Сохранение данных при изменении
  useEffect(() => {
    if (ready) {
      persistData();
    }
  }, [cart, favorites, ready]);

  // Загрузка сохраненных данных
  const loadPersistedData = () => {
    try {
      const savedCart = localStorage.getItem('art_altay_cart');
      if (savedCart) {
        setCart(new Map(JSON.parse(savedCart)));
      }
      
      const savedFavorites = localStorage.getItem('art_altay_favorites');
      if (savedFavorites) {
        setFavorites(new Set(JSON.parse(savedFavorites)));
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  // Сохранение данных в localStorage
  const persistData = () => {
    try {
      localStorage.setItem('art_altay_cart', JSON.stringify(Array.from(cart.entries())));
      localStorage.setItem('art_altay_favorites', JSON.stringify(Array.from(favorites)));
    } catch (error) {
      console.error('Error persisting data:', error);
    }
  };

  // Обработчик навигации
  const handleNavigate = useCallback((view, params = {}) => {
    if (view === 'back') {
      if (previousView) {
        setPreviousView(null);
        setCurrentView(previousView);
        setViewParams({});
      } else {
        setCurrentView('home');
        setViewParams({});
      }
    } else if (view === 'toggleFavorite') {
      const { eventId } = params;
      toggleFavorite(eventId);
    } else if (view === 'addToCart') {
      const { eventId, quantity, date, time } = params;
      addToCart(eventId, { quantity: quantity || 1, date, time });
    } else {
      setPreviousView(currentView);
      setCurrentView(view);
      setViewParams(params);
    }
    
    // Тактильная обратная связь
    hapticFeedback('selection');
    
    // Отслеживание навигации
    apiService.trackEvent('navigation', {
      from: currentView,
      to: view,
      userId: user?.id
    });
  }, [currentView, previousView, hapticFeedback]);

  // Управление избранным
  const toggleFavorite = (eventId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(eventId)) {
        newFavorites.delete(eventId);
      } else {
        newFavorites.add(eventId);
      }
      return newFavorites;
    });
    
    hapticFeedback('selection');
  };

  // Управление корзиной
  const addToCart = (eventId, details) => {
    setCart(prev => {
      const newCart = new Map(prev);
      newCart.set(eventId, details);
      return newCart;
    });
    
    showNotification('Добавлено в корзину');
    hapticFeedback('success');
  };

  const removeFromCart = (eventId) => {
    setCart(prev => {
      const newCart = new Map(prev);
      newCart.delete(eventId);
      return newCart;
    });
    
    hapticFeedback('selection');
  };

  const updateCartItem = (eventId, details) => {
    setCart(prev => {
      const newCart = new Map(prev);
      const currentDetails = newCart.get(eventId) || {};
      newCart.set(eventId, { ...currentDetails, ...details });
      return newCart;
    });
  };

  const clearCart = () => {
    setCart(new Map());
    hapticFeedback('selection');
  };

  // Отображение уведомлений
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    
    // Автоматическое скрытие уведомления через 3 секунды
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Обработчик жестов для активации debug-панели
  const handleDebugGesture = useCallback((e) => {
    // Тройной тап в правом верхнем углу
    if (e.detail === 3 && e.clientX > window.innerWidth * 0.8 && e.clientY < window.innerHeight * 0.2) {
      setShowDebugPanel(prev => !prev);
    }
  }, []);

  // Добавление обработчика жестов
  useEffect(() => {
    document.addEventListener('click', handleDebugGesture);
    return () => {
      document.removeEventListener('click', handleDebugGesture);
    };
  }, [handleDebugGesture]);

  // Компонент нижней навигации
  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-sm border-t border-slate-800 z-40">
      <div className="flex justify-around items-center h-16">
        <button 
          onClick={() => handleNavigate('home')}
          className={`flex flex-col items-center justify-center w-16 h-full ${
            currentView === 'home' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">Главная</span>
        </button>
        
        <button 
          onClick={() => handleNavigate('catalog')}
          className={`flex flex-col items-center justify-center w-16 h-full ${
            currentView === 'catalog' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-xs mt-1">Каталог</span>
        </button>
        
        <button 
          onClick={() => handleNavigate('favorites')}
          className={`flex flex-col items-center justify-center w-16 h-full ${
            currentView === 'favorites' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {favorites.size > 0 && (
              <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {favorites.size}
              </span>
            )}
          </div>
          <span className="text-xs mt-1">Избранное</span>
        </button>
        
        <button 
          onClick={() => handleNavigate('cart')}
          className={`flex flex-col items-center justify-center w-16 h-full ${
            currentView === 'cart' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {cart.size > 0 && (
              <span className="absolute -top-2 -right-2 bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {cart.size}
              </span>
            )}
          </div>
          <span className="text-xs mt-1">Корзина</span>
        </button>
        
        <button 
          onClick={() => handleNavigate('profile')}
          className={`flex flex-col items-center justify-center w-16 h-full ${
            currentView === 'profile' ? 'text-teal-400' : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Профиль</span>
        </button>
      </div>
    </div>
  );

  // Компонент уведомления
  const Notification = () => {
    if (!notification) return null;
    
    return (
      <div className={`fixed top-4 left-0 right-0 mx-auto w-max max-w-sm z-50 px-4 py-2 rounded-lg shadow-lg flex items-center ${
        notification.type === 'success' ? 'bg-green-500/90' :
        notification.type === 'error' ? 'bg-red-500/90' :
        'bg-blue-500/90'
      } text-white`}>
        {notification.type === 'success' && <Check className="w-5 h-5 mr-2" />}
        {notification.type === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
        {notification.type === 'info' && <Info className="w-5 h-5 mr-2" />}
        <span>{notification.message}</span>
        <button 
          onClick={() => setNotification(null)}
          className="ml-3 text-white/80 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Рендеринг текущего представления
  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return (
          <MainScreen 
            onNavigate={handleNavigate}
            favorites={favorites}
            cart={cart}
          />
        );
      
      case 'catalog':
        return (
          <Catalog 
            onNavigate={handleNavigate}
            favorites={favorites}
            initialFilters={viewParams}
          />
        );
      
      case 'profile':
        return (
          <PersonalCabinet 
            onNavigate={handleNavigate}
            favorites={favorites}
            bookings={bookings}
          />
        );
      
      case 'booking':
        return (
          <BookingSystem 
            onNavigate={handleNavigate}
            event={selectedEvent || viewParams.event}
            favorites={favorites}
          />
        );
      
      case 'cart':
        return (
          <Cart 
            onNavigate={handleNavigate}
            cart={cart}
            favorites={favorites}
            removeFromCart={removeFromCart}
            updateCartItem={updateCartItem}
            clearCart={clearCart}
          />
        );
      
      case 'favorites':
        return (
          <Favorites 
            onNavigate={handleNavigate}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-2xl font-bold mb-4">Страница не найдена</h1>
            <button 
              onClick={() => handleNavigate('home')}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
            >
              Вернуться на главную
            </button>
          </div>
        );
    }
  };

  // Если приложение не готово, показываем загрузку
  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="w-16 h-16 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h1 className="text-2xl font-bold">Art Altay</h1>
        <p className="text-slate-400 mt-2">Загрузка приложения...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white">
      {/* Основной контент */}
      <div className="pb-16">
        {renderCurrentView()}
      </div>
      
      {/* Нижняя навигация */}
      <BottomNavigation />
      
      {/* Уведомления */}
      <Notification />
      
      {/* Debug-панель */}
      {showDebugPanel && (
        <DebugPanel 
          onClose={() => setShowDebugPanel(false)}
          appState={{
            currentView,
            previousView,
            viewParams,
            cart: cart,
            favorites: favorites,
            user
          }}
          appVersion={appVersion}
          environment={environment}
        />
      )}
    </div>
  );
};

export default App;
