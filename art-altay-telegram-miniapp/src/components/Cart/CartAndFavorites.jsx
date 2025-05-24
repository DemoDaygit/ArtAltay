import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Heart, Trash2, ArrowLeft, X, 
  ChevronRight, Check, AlertCircle, Clock, Users, 
  MapPin, CreditCard, Share2, Info
} from 'lucide-react';
import { useTelegram } from '../../hooks/useTelegram';
import apiService from '../../services/api';

const Cart = ({ onNavigate, cart, favorites, removeFromCart, updateCartItem, clearCart }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // cart, checkout, confirmation
  const [contactInfo, setContactInfo] = useState({
    name: '',
    phone: '',
    email: '',
    specialRequests: ''
  });
  
  const { user, hapticFeedback, showMainButton, hideMainButton, setMainButtonText, setMainButtonParams, onMainButtonClick } = useTelegram();

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    if (cart && cart.size > 0) {
      loadCartEvents();
    }
    
    // Предзаполнение контактных данных из Telegram
    if (user) {
      setContactInfo(prev => ({
        ...prev,
        name: `${user.first_name} ${user.last_name || ''}`.trim(),
        phone: user.phone_number || '',
      }));
    }
  }, [cart]);

  // Настройка главной кнопки Telegram
  useEffect(() => {
    if (checkoutStep === 'cart') {
      if (cart && cart.size > 0) {
        setMainButtonText('Перейти к оформлению');
        setMainButtonParams({
          color: '#0B9A8D',
          text_color: '#FFFFFF',
          is_active: true,
          is_visible: true
        });
        showMainButton();
      } else {
        hideMainButton();
      }
    } else if (checkoutStep === 'checkout') {
      const isFormValid = contactInfo.name && (contactInfo.phone || contactInfo.email);
      
      setMainButtonText('Оформить заказ');
      setMainButtonParams({
        color: isFormValid ? '#0B9A8D' : '#4B5563',
        text_color: '#FFFFFF',
        is_active: isFormValid,
        is_visible: true
      });
      showMainButton();
    } else {
      hideMainButton();
    }
    
    return () => {
      hideMainButton();
    };
  }, [checkoutStep, cart, contactInfo]);

  // Обработчик нажатия на главную кнопку
  useEffect(() => {
    const handleMainButtonClick = () => {
      if (checkoutStep === 'cart') {
        setCheckoutStep('checkout');
        hapticFeedback('selection');
      } else if (checkoutStep === 'checkout') {
        if (contactInfo.name && (contactInfo.phone || contactInfo.email)) {
          processCheckout();
          hapticFeedback('selection');
        } else {
          hapticFeedback('error');
          setError('Пожалуйста, заполните контактные данные');
        }
      }
    };

    onMainButtonClick(handleMainButtonClick);
    
    return () => {
      onMainButtonClick(null);
    };
  }, [checkoutStep, contactInfo]);

  const loadCartEvents = async () => {
    setLoading(true);
    try {
      const eventIds = Array.from(cart.keys());
      const eventsData = [];
      
      for (const eventId of eventIds) {
        const response = await apiService.getEventById(eventId);
        
        if (response.success) {
          const cartItem = cart.get(eventId);
          eventsData.push({
            ...response.data,
            cartQuantity: cartItem.quantity,
            cartDate: cartItem.date,
            cartTime: cartItem.time
          });
        }
      }
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading cart events:', error);
      setError('Не удалось загрузить информацию о мероприятиях');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromCart = (eventId) => {
    removeFromCart(eventId);
    setEvents(events.filter(event => event.id !== eventId));
    hapticFeedback('selection');
  };

  const handleQuantityChange = (eventId, change) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    const newQuantity = Math.max(1, Math.min(event.maxParticipants, event.cartQuantity + change));
    
    if (newQuantity !== event.cartQuantity) {
      updateCartItem(eventId, { quantity: newQuantity });
      
      setEvents(events.map(e => 
        e.id === eventId ? { ...e, cartQuantity: newQuantity } : e
      ));
      
      hapticFeedback('selection');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const processCheckout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const bookings = [];
      
      for (const event of events) {
        const bookingData = {
          eventId: event.id,
          date: event.cartDate || new Date().toISOString().split('T')[0],
          time: event.cartTime || '12:00',
          participants: event.cartQuantity,
          contactName: contactInfo.name,
          contactPhone: contactInfo.phone,
          contactEmail: contactInfo.email,
          specialRequests: contactInfo.specialRequests,
          paymentMethod: 'telegram_pay',
          userId: user?.id
        };
        
        const response = await apiService.createBooking(bookingData);
        
        if (response.success) {
          bookings.push({
            id: response.data.bookingId,
            eventId: event.id,
            title: event.title,
            date: bookingData.date,
            time: bookingData.time,
            participants: bookingData.participants,
            price: event.price,
            image: event.image
          });
        } else {
          throw new Error(`Ошибка при бронировании "${event.title}"`);
        }
      }
      
      // Имитация процесса оплаты
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Очистка корзины после успешного оформления
      clearCart();
      
      // Переход к экрану подтверждения
      setCheckoutStep('confirmation');
      
      // Отслеживание аналитики
      apiService.trackEvent('cart_checkout_completed', {
        userId: user?.id,
        bookingsCount: bookings.length,
        totalAmount: calculateTotal()
      });
    } catch (error) {
      console.error('Checkout error:', error);
      setError('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.');
      hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return events.reduce((total, event) => total + (event.price * event.cartQuantity), 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не выбрана';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  // Компонент корзины
  const CartView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Корзина</h2>
        {events.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm('Вы уверены, что хотите очистить корзину?')) {
                clearCart();
                setEvents([]);
                hapticFeedback('selection');
              }
            }}
            className="text-slate-400 hover:text-white flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="text-sm">Очистить</span>
          </button>
        )}
      </div>

      {loading && events.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : events.length > 0 ? (
        <div className="space-y-4">
          {events.map(event => (
            <div 
              key={event.id}
              className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50"
            >
              <div className="flex space-x-4">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 
                      className="font-semibold cursor-pointer hover:text-teal-300"
                      onClick={() => onNavigate('eventDetails', { eventId: event.id })}
                    >
                      {event.title}
                    </h3>
                    <button 
                      onClick={() => handleRemoveFromCart(event.id)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{event.duration}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{event.location.split(',')[0]}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{formatDate(event.cartDate)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{event.cartTime || 'Не выбрано'}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleQuantityChange(event.id, -1)}
                        disabled={event.cartQuantity <= 1}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          event.cartQuantity <= 1 
                            ? 'bg-slate-700/30 text-slate-500' 
                            : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                      >
                        <span>-</span>
                      </button>
                      <span>{event.cartQuantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(event.id, 1)}
                        disabled={event.cartQuantity >= event.maxParticipants}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          event.cartQuantity >= event.maxParticipants 
                            ? 'bg-slate-700/30 text-slate-500' 
                            : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                      >
                        <span>+</span>
                      </button>
                    </div>
                    <div className="text-teal-400 font-semibold">
                      {(event.price * event.cartQuantity).toLocaleString()} ₽
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
            <div className="flex justify-between mb-2">
              <span>Всего мероприятий:</span>
              <span>{events.length}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Всего участников:</span>
              <span>{events.reduce((sum, event) => sum + event.cartQuantity, 0)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-slate-700 pt-3 mt-3">
              <span>Итого:</span>
              <span className="text-teal-400">{calculateTotal().toLocaleString()} ₽</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center">
          <ShoppingCart className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Корзина пуста</h3>
          <p className="text-slate-400 mb-6">
            Добавьте мероприятия в корзину, чтобы оформить бронирование
          </p>
          <button
            onClick={() => onNavigate('catalog')}
            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Перейти в каталог
          </button>
        </div>
      )}
    </div>
  );

  // Компонент оформления заказа
  const CheckoutView = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <button 
          onClick={() => setCheckoutStep('cart')}
          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Оформление заказа</h2>
      </div>

      {/* Список мероприятий */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <h3 className="font-semibold mb-4">Мероприятия в заказе</h3>
        
        <div className="space-y-3">
          {events.map(event => (
            <div key={event.id} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
              <img 
                src={event.image} 
                alt={event.title}
                className="w-12 h-12 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h4 className="font-medium text-sm">{event.title}</h4>
                <p className="text-xs text-slate-400">
                  {event.cartQuantity} x {event.price.toLocaleString()} ₽
                </p>
              </div>
              <div className="text-teal-400 font-semibold">
                {(event.price * event.cartQuantity).toLocaleString()} ₽
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Контактные данные */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <h3 className="font-semibold mb-4">Контактные данные</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Имя и фамилия</label>
            <input 
              type="text"
              name="name"
              value={contactInfo.name}
              onChange={handleInputChange}
              placeholder="Иван Иванов"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Телефон</label>
            <input 
              type="tel"
              name="phone"
              value={contactInfo.phone}
              onChange={handleInputChange}
              placeholder="+7 (999) 123-45-67"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input 
              type="email"
              name="email"
              value={contactInfo.email}
              onChange={handleInputChange}
              placeholder="example@mail.com"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Особые пожелания (необязательно)</label>
            <textarea 
              name="specialRequests"
              value={contactInfo.specialRequests}
              onChange={handleInputChange}
              placeholder="Укажите особые пожелания или требования"
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
          </div>
        </div>
      </div>

      {/* Способ оплаты */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <h3 className="font-semibold mb-4">Способ оплаты</h3>
        
        <div className="flex items-center p-3 bg-slate-700/50 rounded-lg">
          <div className="w-5 h-5 rounded-full border-2 border-teal-400 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-teal-400"></div>
          </div>
          <div className="ml-3">
            <div className="font-medium">Telegram Pay</div>
            <div className="text-sm text-slate-400">Быстрая и безопасная оплата через Telegram</div>
          </div>
        </div>
      </div>

      {/* Итоговая стоимость */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Всего мероприятий:</span>
            <span>{events.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Всего участников:</span>
            <span>{events.reduce((sum, event) => sum + event.cartQuantity, 0)}</span>
          </div>
          <div className="border-t border-slate-700 pt-3 flex justify-between font-bold">
            <span>Итого к оплате:</span>
            <span className="text-teal-400">{calculateTotal().toLocaleString()} ₽</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Компонент подтверждения заказа
  const ConfirmationView = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">Заказ оформлен!</h2>
        <p className="text-slate-400">
          Детали отправлены на ваш email и в Telegram
        </p>
      </div>

      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 text-left">
        <h3 className="font-semibold mb-4 text-center">Детали заказа</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Номер заказа:</span>
            <span className="font-medium">#{Date.now().toString().slice(-6)}</span>
          </div>
          <div className="flex justify-between">
            <span>Дата заказа:</span>
            <span className="font-medium">{new Date().toLocaleDateString('ru-RU')}</span>
          </div>
          <div className="flex justify-between">
            <span>Количество мероприятий:</span>
            <span className="font-medium">{events.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Способ оплаты:</span>
            <span className="font-medium">Telegram Pay</span>
          </div>
          <div className="border-t border-slate-700 pt-3 flex justify-between font-bold">
            <span>Итого:</span>
            <span className="text-teal-400">{calculateTotal().toLocaleString()} ₽</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button 
          onClick={() => onNavigate('home')}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold"
        >
          На главную
        </button>
        
        <button 
          onClick={() => onNavigate('bookings')}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold"
        >
          Мои бронирования
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white pb-20">
      {/* Header */}
      {checkoutStep !== 'confirmation' && (
        <header className="bg-black/20 backdrop-blur-sm border-b border-slate-700/50 p-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onNavigate('back')}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">
              {checkoutStep === 'cart' ? 'Корзина' : 'Оформление заказа'}
            </h1>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="p-4">
        {checkoutStep === 'cart' && <CartView />}
        {checkoutStep === 'checkout' && <CheckoutView />}
        {checkoutStep === 'confirmation' && <ConfirmationView />}
      </main>

      {/* Loading Overlay */}
      {loading && checkoutStep === 'checkout' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-semibold">Обработка заказа...</p>
          <p className="text-slate-400 mt-2">Пожалуйста, не закрывайте приложение</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-20 left-0 right-0 mx-auto w-max max-w-sm bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-3 text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// Компонент избранного
const Favorites = ({ onNavigate, favorites, toggleFavorite }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  
  const { hapticFeedback } = useTelegram();

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    if (favorites && favorites.size > 0) {
      loadFavoriteEvents();
    } else {
      setLoading(false);
    }
  }, [favorites]);

  const loadFavoriteEvents = async () => {
    setLoading(true);
    try {
      const eventIds = Array.from(favorites);
      const eventsData = [];
      
      for (const eventId of eventIds) {
        const response = await apiService.getEventById(eventId);
        
        if (response.success) {
          eventsData.push(response.data);
        }
      }
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading favorite events:', error);
      setError('Не удалось загрузить избранные мероприятия');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (eventId) => {
    toggleFavorite(eventId);
    setEvents(events.filter(event => event.id !== eventId));
    hapticFeedback('selection');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white pb-20">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-slate-700/50 p-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => onNavigate('back')}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Избранное</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map(event => (
                <div 
                  key={event.id}
                  className="bg-slate-800/30 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:border-teal-400/30 transition-all group cursor-pointer"
                  onClick={() => onNavigate('eventDetails', { eventId: event.id })}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 flex space-x-2">
                      <div className="bg-teal-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {event.price.toLocaleString()} ₽
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleToggleFavorite(event.id);
                      }}
                      className="absolute top-3 left-3 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
                    >
                      <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold group-hover:text-teal-300 transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex items-center text-sm text-yellow-400 ml-2">
                        <Star className="w-3 h-3 fill-current mr-1" />
                        <span>{event.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-400 mb-3 text-sm line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{event.duration}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        <span>до {event.maxParticipants}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span>{event.location.split(',')[0]}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('booking', { eventId: event.id });
                          hapticFeedback('selection');
                        }}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex-1"
                      >
                        Забронировать
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('share', { event });
                          hapticFeedback('selection');
                        }}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center">
              <Heart className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Нет избранных мероприятий</h3>
              <p className="text-slate-400 mb-6">
                Добавляйте понравившиеся мероприятия в избранное, чтобы быстро находить их
              </p>
              <button
                onClick={() => onNavigate('catalog')}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                Перейти в каталог
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-20 left-0 right-0 mx-auto w-max max-w-sm bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-3 text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export { Cart, Favorites };
