import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Users, MapPin, CreditCard, Check, X, 
  ChevronLeft, ChevronRight, ArrowLeft, Heart, Star, 
  Info, AlertCircle, ChevronsRight, Wallet, Gift, 
  Shield, HelpCircle, Share2
} from 'lucide-react';
import { useTelegram } from '../../hooks/useTelegram';
import apiService from '../../services/api';

const BookingSystem = ({ onNavigate, event, favorites }) => {
  const [step, setStep] = useState('details'); // details, booking, payment, confirmation
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    participants: 1,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    specialRequests: '',
    usePoints: false,
    paymentMethod: 'telegram_pay'
  });
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  
  const { user, hapticFeedback, showMainButton, hideMainButton, setMainButtonText, setMainButtonParams, onMainButtonClick } = useTelegram();

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    if (event) {
      loadAvailableDates();
      
      // Предзаполнение контактных данных из Telegram
      if (user) {
        setBookingData(prev => ({
          ...prev,
          contactName: `${user.first_name} ${user.last_name || ''}`.trim(),
          contactPhone: user.phone_number || '',
        }));
      }
    } else {
      setError('Информация о мероприятии не найдена');
    }
  }, [event]);

  // Настройка главной кнопки Telegram
  useEffect(() => {
    if (step === 'details') {
      setMainButtonText('Забронировать');
      setMainButtonParams({
        color: '#0B9A8D',
        text_color: '#FFFFFF',
        is_active: true,
        is_visible: true
      });
      showMainButton();
      
      return () => {
        hideMainButton();
      };
    } else if (step === 'booking') {
      const isFormValid = bookingData.date && bookingData.time && bookingData.participants > 0;
      
      setMainButtonText('Перейти к оплате');
      setMainButtonParams({
        color: isFormValid ? '#0B9A8D' : '#4B5563',
        text_color: '#FFFFFF',
        is_active: isFormValid,
        is_visible: true
      });
      showMainButton();
      
      return () => {
        hideMainButton();
      };
    } else if (step === 'payment') {
      const isContactValid = bookingData.contactName && 
                            (bookingData.contactPhone || bookingData.contactEmail);
      
      setMainButtonText('Оплатить');
      setMainButtonParams({
        color: isContactValid ? '#0B9A8D' : '#4B5563',
        text_color: '#FFFFFF',
        is_active: isContactValid,
        is_visible: true
      });
      showMainButton();
      
      return () => {
        hideMainButton();
      };
    } else {
      hideMainButton();
    }
  }, [step, bookingData]);

  // Обработчик нажатия на главную кнопку
  useEffect(() => {
    const handleMainButtonClick = () => {
      if (step === 'details') {
        setStep('booking');
        hapticFeedback('selection');
      } else if (step === 'booking') {
        if (bookingData.date && bookingData.time && bookingData.participants > 0) {
          setStep('payment');
          hapticFeedback('selection');
        } else {
          hapticFeedback('error');
          setError('Пожалуйста, выберите дату, время и количество участников');
        }
      } else if (step === 'payment') {
        if (bookingData.contactName && (bookingData.contactPhone || bookingData.contactEmail)) {
          processPayment();
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
  }, [step, bookingData]);

  const loadAvailableDates = async () => {
    setLoading(true);
    try {
      const response = await apiService.getEventAvailability(event.id);
      
      if (response.success) {
        setAvailableDates(response.data.dates || []);
      } else {
        // Мок-данные для разработки
        const today = new Date();
        const mockDates = [];
        
        for (let i = 1; i <= 30; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          
          // Исключаем некоторые даты для имитации недоступности
          if (i % 7 !== 0) {
            mockDates.push(date.toISOString().split('T')[0]);
          }
        }
        
        setAvailableDates(mockDates);
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
      setError('Не удалось загрузить доступные даты');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTimes = async (date) => {
    setLoading(true);
    try {
      const response = await apiService.getEventTimeSlots(event.id, date);
      
      if (response.success) {
        setAvailableTimes(response.data.times || []);
      } else {
        // Мок-данные для разработки
        const mockTimes = ['09:00', '11:00', '14:00', '16:00', '18:00'];
        
        // Исключаем некоторые времена для имитации недоступности
        const availableMockTimes = mockTimes.filter(() => Math.random() > 0.3);
        
        setAvailableTimes(availableMockTimes.length > 0 ? availableMockTimes : mockTimes);
      }
    } catch (error) {
      console.error('Error loading available times:', error);
      setError('Не удалось загрузить доступное время');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date) => {
    setBookingData(prev => ({ ...prev, date, time: '' }));
    loadAvailableTimes(date);
    hapticFeedback('selection');
  };

  const handleTimeSelect = (time) => {
    setBookingData(prev => ({ ...prev, time }));
    hapticFeedback('selection');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleParticipantsChange = (change) => {
    const newValue = Math.max(1, Math.min(event.maxParticipants, bookingData.participants + change));
    setBookingData(prev => ({ ...prev, participants: newValue }));
    hapticFeedback('selection');
  };

  const processPayment = async () => {
    setProcessingPayment(true);
    setError(null);
    
    try {
      // Подготовка данных для бронирования
      const bookingPayload = {
        eventId: event.id,
        date: bookingData.date,
        time: bookingData.time,
        participants: bookingData.participants,
        contactName: bookingData.contactName,
        contactPhone: bookingData.contactPhone,
        contactEmail: bookingData.contactEmail,
        specialRequests: bookingData.specialRequests,
        usePoints: bookingData.usePoints,
        paymentMethod: bookingData.paymentMethod,
        userId: user?.id
      };
      
      // Отправка запроса на создание бронирования
      const response = await apiService.createBooking(bookingPayload);
      
      if (response.success) {
        // Имитация процесса оплаты
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setBookingId(response.data.bookingId || Date.now().toString());
        setBookingComplete(true);
        setStep('confirmation');
        
        // Отслеживание аналитики
        apiService.trackEvent('booking_completed', {
          eventId: event.id,
          userId: user?.id,
          bookingId: response.data.bookingId,
          amount: calculateTotalPrice()
        });
      } else {
        throw new Error(response.message || 'Ошибка при создании бронирования');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setError('Произошла ошибка при обработке платежа. Пожалуйста, попробуйте еще раз.');
      hapticFeedback('error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!event) return 0;
    
    let total = event.price * bookingData.participants;
    
    // Применение скидки за баллы лояльности
    if (bookingData.usePoints && user?.loyaltyPoints) {
      const discount = Math.min(user.loyaltyPoints, total * 0.2); // Максимальная скидка 20%
      total -= discount;
    }
    
    return total;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  // Компонент для отображения деталей мероприятия
  const EventDetails = () => (
    <div className="space-y-6">
      {/* Изображение мероприятия */}
      <div className="aspect-video rounded-xl overflow-hidden relative">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <button 
          onClick={() => {
            onNavigate('toggleFavorite', { eventId: event.id });
            hapticFeedback('selection');
          }}
          className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
        >
          <Heart className={`w-5 h-5 ${favorites?.has(event.id) ? 'fill-red-400 text-red-400' : 'text-white'}`} />
        </button>
      </div>

      {/* Заголовок и рейтинг */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="flex items-center text-yellow-400">
            <Star className="w-5 h-5 fill-current mr-1" />
            <span className="font-semibold">{event.rating}</span>
            <span className="text-slate-400 text-sm ml-1">({event.reviewsCount})</span>
          </div>
        </div>
        
        <p className="text-slate-300 mb-4">{event.description}</p>
        
        {/* Теги */}
        {event.tags && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.map(tag => (
              <span key={tag} className="bg-slate-700 text-slate-300 px-3 py-1 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Основная информация */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-teal-400 mr-3" />
            <div>
              <div className="text-sm text-slate-400">Продолжительность</div>
              <div className="font-medium">{event.duration}</div>
            </div>
          </div>
          <div className="flex items-center">
            <Users className="w-5 h-5 text-teal-400 mr-3" />
            <div>
              <div className="text-sm text-slate-400">Участников</div>
              <div className="font-medium">до {event.maxParticipants} чел.</div>
            </div>
          </div>
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-teal-400 mr-3" />
            <div>
              <div className="text-sm text-slate-400">Место</div>
              <div className="font-medium">{event.location}</div>
            </div>
          </div>
          <div className="flex items-center">
            <CreditCard className="w-5 h-5 text-teal-400 mr-3" />
            <div>
              <div className="text-sm text-slate-400">Стоимость</div>
              <div className="font-medium">
                {event.price.toLocaleString()} ₽
                {event.originalPrice > event.price && (
                  <span className="text-slate-400 line-through text-sm ml-2">
                    {event.originalPrice.toLocaleString()} ₽
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Дополнительная информация */}
      <div className="space-y-4">
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
          <h3 className="font-semibold mb-3">Что включено</h3>
          <ul className="space-y-2">
            {event.included?.map((item, index) => (
              <li key={index} className="flex items-start">
                <Check className="w-5 h-5 text-teal-400 mr-2 flex-shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            )) || (
              <>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-teal-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Профессиональный гид</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-teal-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Все необходимое оборудование</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-teal-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Фотографии с мероприятия</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {event.notIncluded && event.notIncluded.length > 0 && (
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
            <h3 className="font-semibold mb-3">Что не включено</h3>
            <ul className="space-y-2">
              {event.notIncluded.map((item, index) => (
                <li key={index} className="flex items-start">
                  <X className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {event.requirements && event.requirements.length > 0 && (
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
            <h3 className="font-semibold mb-3">Требования</h3>
            <ul className="space-y-2">
              {event.requirements.map((item, index) => (
                <li key={index} className="flex items-start">
                  <Info className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Отзывы */}
      {event.reviews && event.reviews.length > 0 && (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Отзывы</h3>
            <span className="text-sm text-slate-400">Всего: {event.reviewsCount}</span>
          </div>
          
          <div className="space-y-4">
            {event.reviews.slice(0, 3).map((review, index) => (
              <div key={index} className="border-b border-slate-700 last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <img 
                      src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}&background=random`} 
                      alt={review.userName}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <span className="font-medium">{review.userName}</span>
                  </div>
                  <div className="flex items-center text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-600'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-300">{review.text}</p>
                <div className="text-xs text-slate-500 mt-2">
                  {new Date(review.date).toLocaleDateString('ru-RU')}
                </div>
              </div>
            ))}
          </div>
          
          {event.reviewsCount > 3 && (
            <button 
              onClick={() => onNavigate('reviews', { eventId: event.id })}
              className="w-full mt-4 text-center text-teal-400 hover:text-teal-300 text-sm font-medium"
            >
              Показать все отзывы ({event.reviewsCount})
            </button>
          )}
        </div>
      )}

      {/* Организатор */}
      {event.organizer && (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
          <h3 className="font-semibold mb-3">Организатор</h3>
          <div className="flex items-center">
            <img 
              src={event.organizer.photo || `https://ui-avatars.com/api/?name=${event.organizer.name}&background=random`} 
              alt={event.organizer.name}
              className="w-12 h-12 rounded-full mr-4"
            />
            <div>
              <div className="font-medium">{event.organizer.name}</div>
              <div className="text-sm text-slate-400">{event.organizer.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* Цена и кнопка бронирования */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm text-slate-400">Стоимость за человека</div>
            <div className="text-2xl font-bold">
              {event.price.toLocaleString()} ₽
              {event.originalPrice > event.price && (
                <span className="text-slate-400 line-through text-lg ml-2">
                  {event.originalPrice.toLocaleString()} ₽
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Доступно мест</div>
            <div className="font-medium">{event.availableSpots || 'Много'}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Компонент для выбора даты и времени
  const BookingForm = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <button 
          onClick={() => setStep('details')}
          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Бронирование</h2>
      </div>

      {/* Выбор даты */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <h3 className="font-semibold mb-4">Выберите дату</h3>
        
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {availableDates.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableDates.slice(0, 9).map(date => (
                  <button
                    key={date}
                    onClick={() => handleDateSelect(date)}
                    className={`p-3 rounded-lg text-center transition-colors ${
                      bookingData.date === date 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div className="text-xs mb-1">
                      {new Date(date).toLocaleDateString('ru-RU', { weekday: 'short' })}
                    </div>
                    <div className="font-medium">
                      {new Date(date).getDate()}
                    </div>
                    <div className="text-xs">
                      {new Date(date).toLocaleDateString('ru-RU', { month: 'short' })}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400">
                Нет доступных дат
              </div>
            )}
            
            {availableDates.length > 9 && (
              <button 
                onClick={() => onNavigate('calendar', { eventId: event.id, availableDates })}
                className="w-full mt-4 text-center text-teal-400 hover:text-teal-300 text-sm font-medium"
              >
                Показать все даты
              </button>
            )}
          </>
        )}
      </div>

      {/* Выбор времени */}
      {bookingData.date && (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
          <h3 className="font-semibold mb-4">Выберите время</h3>
          
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {availableTimes.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {availableTimes.map(time => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={`p-3 rounded-lg text-center transition-colors ${
                        bookingData.time === time 
                          ? 'bg-teal-600 text-white' 
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  Нет доступного времени на выбранную дату
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Выбор количества участников */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <h3 className="font-semibold mb-4">Количество участников</h3>
        
        <div className="flex items-center justify-between">
          <button 
            onClick={() => handleParticipantsChange(-1)}
            disabled={bookingData.participants <= 1}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              bookingData.participants <= 1 
                ? 'bg-slate-700/30 text-slate-500' 
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="text-2xl font-bold">{bookingData.participants}</div>
            <div className="text-sm text-slate-400">
              {bookingData.participants === 1 ? 'человек' : 'человека'}
            </div>
          </div>
          
          <button 
            onClick={() => handleParticipantsChange(1)}
            disabled={bookingData.participants >= event.maxParticipants}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              bookingData.participants >= event.maxParticipants 
                ? 'bg-slate-700/30 text-slate-500' 
                : 'bg-slate-700 text-white hover:bg-slate-600'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Итоговая стоимость */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <div className="text-lg">Итого:</div>
          <div className="text-xl font-bold text-teal-400">
            {(event.price * bookingData.participants).toLocaleString()} ₽
          </div>
        </div>
        <div className="text-sm text-slate-400">
          {event.price.toLocaleString()} ₽ × {bookingData.participants} {bookingData.participants === 1 ? 'человек' : 'человека'}
        </div>
      </div>
    </div>
  );

  // Компонент для ввода контактных данных и оплаты
  const PaymentForm = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <button 
          onClick={() => setStep('booking')}
          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">Оформление заказа</h2>
      </div>

      {/* Детали бронирования */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <h3 className="font-semibold mb-4">Детали бронирования</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <img 
              src={event.image} 
              alt={event.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h4 className="font-medium">{event.title}</h4>
              <p className="text-sm text-slate-400">{event.duration}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-400">Дата:</span>
              <div className="font-medium">{formatDate(bookingData.date)}</div>
            </div>
            <div>
              <span className="text-slate-400">Время:</span>
              <div className="font-medium">{bookingData.time}</div>
            </div>
            <div>
              <span className="text-slate-400">Участников:</span>
              <div className="font-medium">{bookingData.participants}</div>
            </div>
            <div>
              <span className="text-slate-400">Место:</span>
              <div className="font-medium">{event.location.split(',')[0]}</div>
            </div>
          </div>
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
              name="contactName"
              value={bookingData.contactName}
              onChange={handleInputChange}
              placeholder="Иван Иванов"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Телефон</label>
            <input 
              type="tel"
              name="contactPhone"
              value={bookingData.contactPhone}
              onChange={handleInputChange}
              placeholder="+7 (999) 123-45-67"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input 
              type="email"
              name="contactEmail"
              value={bookingData.contactEmail}
              onChange={handleInputChange}
              placeholder="example@mail.com"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Особые пожелания (необязательно)</label>
            <textarea 
              name="specialRequests"
              value={bookingData.specialRequests}
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
        
        <div className="space-y-3">
          <label className="flex items-center p-3 bg-slate-700/50 rounded-lg cursor-pointer">
            <input 
              type="radio"
              name="paymentMethod"
              value="telegram_pay"
              checked={bookingData.paymentMethod === 'telegram_pay'}
              onChange={handleInputChange}
              className="w-4 h-4 text-teal-600 bg-slate-700 border-slate-600 focus:ring-teal-500"
            />
            <div className="ml-3">
              <div className="font-medium">Telegram Pay</div>
              <div className="text-sm text-slate-400">Быстрая и безопасная оплата через Telegram</div>
            </div>
          </label>
          
          <label className="flex items-center p-3 bg-slate-700/50 rounded-lg cursor-pointer">
            <input 
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={bookingData.paymentMethod === 'cash'}
              onChange={handleInputChange}
              className="w-4 h-4 text-teal-600 bg-slate-700 border-slate-600 focus:ring-teal-500"
            />
            <div className="ml-3">
              <div className="font-medium">Оплата на месте</div>
              <div className="text-sm text-slate-400">Наличными или картой при посещении</div>
            </div>
          </label>
        </div>
      </div>

      {/* Использование баллов лояльности */}
      {user?.loyaltyPoints > 0 && (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center">
              <Gift className="w-5 h-5 text-yellow-400 mr-3" />
              <div>
                <div className="font-medium">Использовать баллы лояльности</div>
                <div className="text-sm text-slate-400">У вас {user.loyaltyPoints} баллов</div>
              </div>
            </div>
            <input 
              type="checkbox"
              name="usePoints"
              checked={bookingData.usePoints}
              onChange={handleInputChange}
              className="w-5 h-5 text-teal-600 bg-slate-700 border-slate-600 rounded focus:ring-teal-500"
            />
          </label>
        </div>
      )}

      {/* Итоговая стоимость */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Стоимость ({bookingData.participants} {bookingData.participants === 1 ? 'человек' : 'человека'})</span>
            <span>{(event.price * bookingData.participants).toLocaleString()} ₽</span>
          </div>
          
          {bookingData.usePoints && user?.loyaltyPoints > 0 && (
            <div className="flex justify-between text-yellow-400">
              <span>Скидка (баллы лояльности)</span>
              <span>-{Math.min(user.loyaltyPoints, event.price * bookingData.participants * 0.2).toLocaleString()} ₽</span>
            </div>
          )}
          
          <div className="border-t border-slate-700 pt-3 flex justify-between font-bold">
            <span>Итого к оплате:</span>
            <span className="text-teal-400">{calculateTotalPrice().toLocaleString()} ₽</span>
          </div>
        </div>
      </div>

      {/* Условия бронирования */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-teal-400 mr-3 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300">
            Нажимая кнопку "Оплатить", вы соглашаетесь с <a href="#" className="text-teal-400 hover:underline">условиями бронирования</a> и <a href="#" className="text-teal-400 hover:underline">политикой конфиденциальности</a>.
          </div>
        </div>
      </div>
    </div>
  );

  // Компонент для подтверждения бронирования
  const ConfirmationScreen = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-white" />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">Бронирование подтверждено!</h2>
        <p className="text-slate-400">
          Детали отправлены на ваш email и в Telegram
        </p>
      </div>

      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 text-left">
        <h3 className="font-semibold mb-4 text-center">Детали бронирования</h3>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <img 
              src={event.image} 
              alt={event.title}
              className="w-12 h-12 object-cover rounded-lg"
            />
            <div>
              <div className="font-medium">{event.title}</div>
              <div className="text-sm text-slate-400">{event.duration}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Дата:</span>
              <div className="font-medium">
                {formatDate(bookingData.date)}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Время:</span>
              <div className="font-medium">{bookingData.time}</div>
            </div>
            <div>
              <span className="text-slate-400">Участников:</span>
              <div className="font-medium">{bookingData.participants}</div>
            </div>
            <div>
              <span className="text-slate-400">Номер брони:</span>
              <div className="font-medium">#{bookingId.toString().slice(-6)}</div>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-3">
            <div className="flex justify-between">
              <span>Оплачено:</span>
              <span className="text-teal-400 font-bold">
                {calculateTotalPrice().toLocaleString()} ₽
              </span>
            </div>
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
          onClick={() => onNavigate('share', { booking: { 
            id: bookingId,
            eventId: event.id,
            title: event.title,
            date: bookingData.date,
            time: bookingData.time,
            participants: bookingData.participants,
            price: calculateTotalPrice()
          }})}
          className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Поделиться
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white pb-20">
      {/* Header */}
      {step !== 'confirmation' && (
        <header className="bg-black/20 backdrop-blur-sm border-b border-slate-700/50 p-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onNavigate('back')}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold">
              {step === 'details' ? event.title : 
               step === 'booking' ? 'Бронирование' : 
               'Оформление заказа'}
            </h1>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="p-4">
        {step === 'details' && <EventDetails />}
        {step === 'booking' && <BookingForm />}
        {step === 'payment' && <PaymentForm />}
        {step === 'confirmation' && <ConfirmationScreen />}
      </main>

      {/* Loading Overlay */}
      {processingPayment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-semibold">Обработка платежа...</p>
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

export default BookingSystem;
