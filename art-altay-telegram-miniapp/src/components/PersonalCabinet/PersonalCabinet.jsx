import React, { useState, useEffect } from 'react';
import { 
  User, Calendar, CreditCard, Settings, LogOut, Star, Clock, MapPin, 
  Phone, Mail, Edit3, Save, X, Check, AlertCircle, ShoppingBag, 
  Heart, Filter, Search, ArrowRight, Download, Share2, ChevronRight,
  Ticket, Trophy, Gift, Bell, HelpCircle, Shield, Wallet, History,
  ArrowLeft, ChevronDown, ChevronUp, Trash2, ExternalLink
} from 'lucide-react';
import { useTelegram } from '../../hooks/useTelegram';
import apiService from '../../services/api';

const PersonalCabinet = ({ onNavigate, favorites, bookings: initialBookings }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState(initialBookings || []);
  const [statistics, setStatistics] = useState({
    totalBookings: 0,
    totalSpent: 0,
    favoriteEvents: 0,
    loyaltyPoints: 0,
    membershipLevel: 'Bronze'
  });
  const [notifications, setNotifications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user: telegramUser, hapticFeedback } = useTelegram();

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadUserData();
    loadBookings();
    loadNotifications();
  }, []);

  // Обновление статистики при изменении данных
  useEffect(() => {
    calculateStatistics();
  }, [bookings, favorites]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Если есть данные из Telegram, используем их как основу
      if (telegramUser) {
        const userData = {
          id: telegramUser.id,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name || '',
          username: telegramUser.username || '',
          photoUrl: telegramUser.photo_url || 'https://via.placeholder.com/100',
          email: '',
          phone: '',
          joinDate: new Date().toISOString().split('T')[0],
          balance: 0,
          membershipLevel: 'Bronze',
          loyaltyPoints: 0
        };

        // Пытаемся получить дополнительные данные с сервера
        const response = await apiService.getUserProfile(telegramUser.id);
        if (response.success) {
          setUser({
            ...userData,
            ...response.data
          });
          setEditForm({
            ...userData,
            ...response.data
          });
        } else {
          setUser(userData);
          setEditForm(userData);
        }
      } else {
        // Мок-данные для разработки
        const mockUser = {
          id: 12345,
          firstName: 'Александр',
          lastName: 'Иванов',
          username: 'alex_altay',
          email: 'alex@example.com',
          phone: '+7 999 123-45-67',
          photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face',
          joinDate: '2023-06-15',
          balance: 5000,
          membershipLevel: 'Gold',
          loyaltyPoints: 450
        };
        setUser(mockUser);
        setEditForm(mockUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('Не удалось загрузить данные профиля');
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (initialBookings && initialBookings.length > 0) {
      setBookings(initialBookings);
      return;
    }

    setLoading(true);
    try {
      const userId = telegramUser?.id || 12345; // Используем ID из Telegram или мок-ID
      const response = await apiService.getUserBookings(userId);
      
      if (response.success) {
        setBookings(response.data || []);
      } else {
        // Мок-данные для разработки
        const mockBookings = [
          {
            id: 1,
            eventId: 1,
            title: 'Мастер-класс по керамике',
            date: '2024-06-20',
            time: '14:00',
            status: 'confirmed',
            price: 2500,
            participants: 2,
            location: 'Мастерская "Глиняный дом"',
            image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop',
            paymentMethod: 'telegram_pay',
            bookingDate: '2024-05-10',
            category: 'impressions'
          },
          {
            id: 2,
            eventId: 4,
            title: 'Поход к подножию Белухи',
            date: '2024-07-15',
            time: '08:00',
            status: 'pending_payment',
            price: 15000,
            participants: 1,
            location: 'Катунский хребет',
            image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=300&h=200&fit=crop',
            paymentMethod: 'cash',
            bookingDate: '2024-05-05',
            category: 'adventures'
          },
          {
            id: 3,
            eventId: 2,
            title: 'Концерт горловых песен',
            date: '2024-04-15',
            time: '19:00',
            status: 'completed',
            price: 1500,
            participants: 1,
            location: 'Этнокультурный центр',
            image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
            paymentMethod: 'telegram_pay',
            bookingDate: '2024-04-10',
            category: 'impressions',
            rating: 5,
            review: 'Потрясающий опыт! Очень глубокая и духовная музыка.'
          }
        ];
        setBookings(mockBookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Не удалось загрузить историю бронирований');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const userId = telegramUser?.id || 12345;
      const response = await apiService.getUserNotifications(userId);
      
      if (response.success) {
        setNotifications(response.data || []);
      } else {
        // Мок-данные для разработки
        const mockNotifications = [
          {
            id: 1,
            type: 'booking_reminder',
            title: 'Напоминание о бронировании',
            message: 'Завтра в 14:00 у вас мастер-класс по керамике',
            date: '2024-06-19',
            read: false
          },
          {
            id: 2,
            type: 'payment_due',
            title: 'Требуется оплата',
            message: 'Оплатите бронирование похода к Белухе до 25 июня',
            date: '2024-06-18',
            read: false
          },
          {
            id: 3,
            type: 'new_event',
            title: 'Новое мероприятие',
            message: 'Добавлен мастер-класс по алтайскому ткачеству',
            date: '2024-06-17',
            read: true
          }
        ];
        setNotifications(mockNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const calculateStatistics = () => {
    // Расчет общей статистики
    const totalBookings = bookings.length;
    const totalSpent = bookings.reduce((sum, booking) => 
      sum + (booking.price * booking.participants), 0);
    const favoriteEvents = favorites ? favorites.size : 0;
    
    // Расчет баллов лояльности (1 балл за каждые 100 рублей)
    const loyaltyPoints = Math.floor(totalSpent / 100);
    
    // Определение уровня членства
    let membershipLevel = 'Bronze';
    if (loyaltyPoints >= 1000) membershipLevel = 'Platinum';
    else if (loyaltyPoints >= 500) membershipLevel = 'Gold';
    else if (loyaltyPoints >= 200) membershipLevel = 'Silver';
    
    setStatistics({
      totalBookings,
      totalSpent,
      favoriteEvents,
      loyaltyPoints,
      membershipLevel
    });
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await apiService.updateUserProfile(user.id, editForm);
      
      if (response.success) {
        setUser({ ...user, ...editForm });
        setIsEditing(false);
        hapticFeedback('success');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Не удалось обновить профиль');
      hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const confirmed = window.confirm('Вы уверены, что хотите отменить бронирование?');
      if (!confirmed) return;
      
      setLoading(true);
      const response = await apiService.cancelBooking(bookingId);
      
      if (response.success) {
        setBookings(bookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' }
            : booking
        ));
        hapticFeedback('success');
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('Не удалось отменить бронирование');
      hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayBooking = async (bookingId) => {
    try {
      setLoading(true);
      const booking = bookings.find(b => b.id === bookingId);
      
      if (!booking) {
        throw new Error('Booking not found');
      }
      
      const paymentData = {
        bookingId,
        amount: booking.price * booking.participants,
        userId: user.id
      };
      
      const response = await apiService.createPayment(paymentData);
      
      if (response.success) {
        setBookings(bookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'confirmed' }
            : booking
        ));
        hapticFeedback('success');
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Ошибка при обработке платежа');
      hapticFeedback('error');
    } finally {
      setLoading(false);
    }
  };

  const handleReadNotification = async (notificationId) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      
      if (response.success) {
        setNotifications(notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-400/20';
      case 'pending_payment': return 'text-yellow-400 bg-yellow-400/20';
      case 'completed': return 'text-blue-400 bg-blue-400/20';
      case 'cancelled': return 'text-red-400 bg-red-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Подтверждено';
      case 'pending_payment': return 'Ожидает оплаты';
      case 'completed': return 'Завершено';
      case 'cancelled': return 'Отменено';
      default: return 'Неизвестно';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    const matchesSearch = booking.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const upcomingBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const now = new Date();
    return bookingDate > now && booking.status !== 'cancelled';
  });

  const pastBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const now = new Date();
    return bookingDate <= now || booking.status === 'cancelled';
  });

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: User },
    { id: 'bookings', label: 'Бронирования', icon: Calendar },
    { id: 'favorites', label: 'Избранное', icon: Heart },
    { id: 'wallet', label: 'Кошелек', icon: Wallet },
    { id: 'settings', label: 'Настройки', icon: Settings }
  ];

  // Компонент детального просмотра бронирования
  const BookingDetailModal = ({ booking, onClose }) => {
    if (!booking) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Детали бронирования</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="aspect-video rounded-lg overflow-hidden">
                <img src={booking.image} alt={booking.title} className="w-full h-full object-cover" />
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-2">{booking.title}</h4>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Дата:</span>
                  <p className="font-medium">{new Date(booking.date).toLocaleDateString('ru-RU')}</p>
                </div>
                <div>
                  <span className="text-slate-400">Время:</span>
                  <p className="font-medium">{booking.time}</p>
                </div>
                <div>
                  <span className="text-slate-400">Участников:</span>
                  <p className="font-medium">{booking.participants}</p>
                </div>
                <div>
                  <span className="text-slate-400">Стоимость:</span>
                  <p className="font-medium text-teal-400">{booking.price * booking.participants} ₽</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-sm">Местоположение:</span>
                <p className="font-medium">{booking.location}</p>
              </div>

              <div>
                <span className="text-slate-400 text-sm">Способ оплаты:</span>
                <p className="font-medium">
                  {booking.paymentMethod === 'telegram_pay' ? 'Telegram Pay' : 'Наличными'}
                </p>
              </div>

              {booking.status === 'completed' && booking.review && (
                <div className="bg-slate-800 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <span className="text-sm text-slate-400 mr-2">Ваша оценка:</span>
                    <div className="flex">
                      {[...Array(booking.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm">{booking.review}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                {booking.status === 'pending_payment' && (
                  <button 
                    onClick={() => handlePayBooking(booking.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
                  >
                    Оплатить
                  </button>
                )}
                
                {booking.status === 'confirmed' && new Date(booking.date) > new Date() && (
                  <button 
                    onClick={() => handleCancelBooking(booking.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold"
                  >
                    Отменить
                  </button>
                )}

                <button 
                  onClick={() => {
                    onNavigate('share', { booking });
                    onClose();
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Поделиться
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white pb-20">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onNavigate('back')}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Личный кабинет</h1>
              <p className="text-sm text-teal-200">{user?.firstName} {user?.lastName}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
            
            <button 
              onClick={() => onNavigate('help')}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute top-20 right-4 w-80 bg-slate-800 rounded-lg border border-slate-700 shadow-xl z-50">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="font-semibold">Уведомления</h3>
              <button 
                onClick={() => setShowNotifications(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notification => (
                  <div 
                    key={notification.id}
                    onClick={() => handleReadNotification(notification.id)}
                    className={`p-4 border-b border-slate-700 last:border-b-0 cursor-pointer hover:bg-slate-700/50 ${!notification.read ? 'bg-blue-500/10' : ''}`}
                  >
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
                    <span className="text-xs text-slate-500 mt-2 block">
                      {new Date(notification.date).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 text-sm">
                  Нет новых уведомлений
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-800/50 border-b border-slate-700/50 p-4 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center space-x-4 mb-4">
                <img 
                  src={user?.photoUrl} 
                  alt={user?.firstName}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-slate-400">@{user?.username}</p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`px-2 py-1 rounded text-xs ${
                      statistics.membershipLevel === 'Platinum' ? 'bg-purple-600/20 text-purple-400' :
                      statistics.membershipLevel === 'Gold' ? 'bg-yellow-600/20 text-yellow-400' :
                      statistics.membershipLevel === 'Silver' ? 'bg-slate-400/20 text-slate-300' :
                      'bg-amber-800/20 text-amber-600'
                    }`}>
                      {statistics.membershipLevel}
                    </span>
                    <span className="text-sm text-slate-500">
                      {statistics.loyaltyPoints} баллов
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{statistics.totalBookings}</div>
                  <div className="text-xs text-slate-400">Бронирований</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{statistics.totalSpent.toLocaleString()} ₽</div>
                  <div className="text-xs text-slate-400">Потрачено</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{statistics.favoriteEvents}</div>
                  <div className="text-xs text-slate-400">В избранном</div>
                </div>
              </div>
            </div>

            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <h3 className="font-semibold mb-4">Предстоящие бронирования</h3>
                <div className="space-y-3">
                  {upcomingBookings.slice(0, 3).map(booking => (
                    <div 
                      key={booking.id} 
                      className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50"
                      onClick={() => setSelectedBooking(booking)}
                    >
                      <img 
                        src={booking.image} 
                        alt={booking.title}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{booking.title}</h4>
                        <p className="text-xs text-slate-400">
                          {new Date(booking.date).toLocaleDateString('ru-RU')} • {booking.time}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </div>
                    </div>
                  ))}
                </div>
                {upcomingBookings.length > 3 && (
                  <button 
                    onClick={() => setActiveTab('bookings')}
                    className="w-full mt-4 text-center text-teal-400 hover:text-teal-300 text-sm font-medium"
                  >
                    Показать все ({upcomingBookings.length})
                  </button>
                )}
              </div>
            )}

            {/* Favorites */}
            {favorites && favorites.size > 0 && (
              <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                <h3 className="font-semibold mb-4">Избранное</h3>
                <button 
                  onClick={() => setActiveTab('favorites')}
                  className="w-full text-center text-teal-400 hover:text-teal-300 text-sm font-medium"
                >
                  Показать все избранные мероприятия ({favorites.size})
                </button>
              </div>
            )}

            {/* Loyalty Program */}
            <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-xl p-6 border border-yellow-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Программа лояльности</h3>
                  <p className="text-slate-300">Получайте баллы за каждую покупку</p>
                </div>
                <Trophy className="w-10 h-10 text-yellow-400" />
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Прогресс до {statistics.membershipLevel === 'Platinum' ? 'следующего бонуса' : 'следующего уровня'}</span>
                  <span className="font-medium">
                    {statistics.membershipLevel === 'Bronze' ? '200 баллов до Silver' :
                     statistics.membershipLevel === 'Silver' ? '500 баллов до Gold' :
                     statistics.membershipLevel === 'Gold' ? '1000 баллов до Platinum' :
                     '5000 баллов до специального бонуса'}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      statistics.membershipLevel === 'Platinum' ? 'bg-purple-400' :
                      statistics.membershipLevel === 'Gold' ? 'bg-yellow-400' :
                      statistics.membershipLevel === 'Silver' ? 'bg-slate-300' :
                      'bg-amber-600'
                    }`}
                    style={{ 
                      width: `${
                        statistics.membershipLevel === 'Bronze' ? (statistics.loyaltyPoints / 200) * 100 :
                        statistics.membershipLevel === 'Silver' ? ((statistics.loyaltyPoints - 200) / 300) * 100 :
                        statistics.membershipLevel === 'Gold' ? ((statistics.loyaltyPoints - 500) / 500) * 100 :
                        ((statistics.loyaltyPoints - 1000) / 4000) * 100
                      }%`
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="text-sm text-slate-300">
                <p>• 1 балл за каждые 100 ₽ покупки</p>
                <p>• Скидки и специальные предложения для участников</p>
                <p>• Приоритетное бронирование новых мероприятий</p>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Поиск бронирований..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filterStatus === 'all' 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Все
                </button>
                <button 
                  onClick={() => setFilterStatus('confirmed')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filterStatus === 'confirmed' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Активные
                </button>
                <button 
                  onClick={() => setFilterStatus('completed')}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    filterStatus === 'completed' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Завершенные
                </button>
              </div>
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(booking => (
                  <div 
                    key={booking.id} 
                    className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 cursor-pointer hover:border-teal-400/30"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="flex space-x-4">
                      <img 
                        src={booking.image} 
                        alt={booking.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{booking.title}</h3>
                          <div className={`px-3 py-1 rounded-full text-sm ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-3">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(booking.date).toLocaleDateString('ru-RU')}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {booking.time}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {booking.participants} чел.
                          </div>
                          <div className="text-teal-400 font-semibold">
                            {(booking.price * booking.participants).toLocaleString()} ₽
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(booking);
                            }}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-lg text-sm"
                          >
                            Подробнее
                          </button>
                          {booking.status === 'pending_payment' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePayBooking(booking.id);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                              Оплатить
                            </button>
                          )}
                          {booking.status === 'confirmed' && new Date(booking.date) > new Date() && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelBooking(booking.id);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm"
                            >
                              Отменить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center">
                  <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Нет бронирований</h3>
                  <p className="text-slate-400 mb-6">
                    {searchQuery 
                      ? 'По вашему запросу ничего не найдено' 
                      : 'У вас пока нет бронирований'}
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
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            {favorites && favorites.size > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from(favorites).map(eventId => (
                  <div 
                    key={eventId}
                    className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-teal-400/30 cursor-pointer"
                    onClick={() => onNavigate('eventDetails', { eventId })}
                  >
                    <div className="flex space-x-3">
                      <img 
                        src={`https://source.unsplash.com/random/100x100?sig=${eventId}`} 
                        alt="Event"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">Мероприятие #{eventId}</h4>
                        <div className="flex items-center text-xs text-yellow-400 mb-2">
                          <Star className="w-3 h-3 fill-current mr-1" />
                          <span>4.8</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-teal-400 font-semibold text-sm">
                            от 2,500 ₽
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigate('toggleFavorite', { eventId });
                              hapticFeedback('selection');
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </button>
                        </div>
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
        )}

        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-6">
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Баланс кошелька</h3>
                  <p className="text-teal-100">Art Altay Wallet</p>
                </div>
                <Wallet className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold mb-4">{user?.balance?.toLocaleString() || 0} ₽</div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => onNavigate('walletDeposit')}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Пополнить
                </button>
                <button 
                  onClick={() => onNavigate('walletWithdraw')}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Вывести
                </button>
              </div>
            </div>

            {/* Loyalty Points */}
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Баллы лояльности</h3>
                  <p className="text-slate-400">1 балл = 1 рубль скидки</p>
                </div>
                <Gift className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold text-yellow-400 mb-4">{statistics.loyaltyPoints} баллов</div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    statistics.membershipLevel === 'Platinum' ? 'bg-purple-400' :
                    statistics.membershipLevel === 'Gold' ? 'bg-yellow-400' :
                    statistics.membershipLevel === 'Silver' ? 'bg-slate-300' :
                    'bg-amber-600'
                  }`}
                  style={{ 
                    width: `${
                      statistics.membershipLevel === 'Bronze' ? (statistics.loyaltyPoints / 200) * 100 :
                      statistics.membershipLevel === 'Silver' ? ((statistics.loyaltyPoints - 200) / 300) * 100 :
                      statistics.membershipLevel === 'Gold' ? ((statistics.loyaltyPoints - 500) / 500) * 100 :
                      ((statistics.loyaltyPoints - 1000) / 4000) * 100
                    }%`
                  }}
                ></div>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                {statistics.membershipLevel === 'Bronze' ? `До Silver: ${200 - statistics.loyaltyPoints} баллов` :
                 statistics.membershipLevel === 'Silver' ? `До Gold: ${500 - statistics.loyaltyPoints} баллов` :
                 statistics.membershipLevel === 'Gold' ? `До Platinum: ${1000 - statistics.loyaltyPoints} баллов` :
                 `До специального бонуса: ${5000 - statistics.loyaltyPoints} баллов`}
              </p>
            </div>

            {/* Transaction History */}
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="font-semibold mb-4">История транзакций</h3>
              <div className="space-y-3">
                {bookings.slice(0, 5).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        booking.status === 'confirmed' || booking.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {booking.status === 'confirmed' || booking.status === 'completed' 
                          ? <CreditCard className="w-4 h-4" />
                          : <X className="w-4 h-4" />
                        }
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{booking.title}</h4>
                        <p className="text-xs text-slate-400">
                          {new Date(booking.bookingDate).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      booking.status === 'confirmed' || booking.status === 'completed' 
                        ? 'text-red-400' 
                        : 'text-green-400'
                    }`}>
                      {booking.status === 'confirmed' || booking.status === 'completed' 
                        ? `-${(booking.price * booking.participants).toLocaleString()} ₽` 
                        : `+${(booking.price * booking.participants).toLocaleString()} ₽`
                      }
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => onNavigate('transactions')}
                className="w-full mt-4 text-center text-teal-400 hover:text-teal-300 text-sm font-medium"
              >
                Показать все транзакции
              </button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Личные данные</h3>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-teal-400 hover:text-teal-300 flex items-center"
                  >
                    <Edit3 className="w-4 h-4 mr-1" /> Изменить
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      className="text-teal-400 hover:text-teal-300"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Имя</label>
                        <input 
                          type="text"
                          value={editForm.firstName || ''}
                          onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Фамилия</label>
                        <input 
                          type="text"
                          value={editForm.lastName || ''}
                          onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <input 
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Телефон</label>
                      <input 
                        type="tel"
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Имя</label>
                        <div className="font-medium">{user?.firstName}</div>
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Фамилия</label>
                        <div className="font-medium">{user?.lastName}</div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Email</label>
                      <div className="font-medium">{user?.email || '—'}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Телефон</label>
                      <div className="font-medium">{user?.phone || '—'}</div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Дата регистрации</label>
                      <div className="font-medium">{new Date(user?.joinDate).toLocaleDateString('ru-RU')}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="font-semibold mb-4">Настройки уведомлений</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Напоминания о бронированиях</h4>
                    <p className="text-sm text-slate-400">Получать напоминания о предстоящих мероприятиях</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Специальные предложения</h4>
                    <p className="text-sm text-slate-400">Получать информацию о скидках и акциях</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Новые мероприятия</h4>
                    <p className="text-sm text-slate-400">Получать уведомления о новых мероприятиях</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* App Settings */}
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
              <h3 className="font-semibold mb-4">Настройки приложения</h3>
              <div className="space-y-4">
                <button 
                  onClick={() => onNavigate('help')}
                  className="flex items-center justify-between w-full p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50"
                >
                  <div className="flex items-center">
                    <HelpCircle className="w-5 h-5 mr-3 text-teal-400" />
                    <span>Помощь и поддержка</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
                <button 
                  onClick={() => onNavigate('privacy')}
                  className="flex items-center justify-between w-full p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50"
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-3 text-teal-400" />
                    <span>Политика конфиденциальности</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
                <button 
                  onClick={() => onNavigate('terms')}
                  className="flex items-center justify-between w-full p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50"
                >
                  <div className="flex items-center">
                    <ExternalLink className="w-5 h-5 mr-3 text-teal-400" />
                    <span>Условия использования</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
                <button 
                  onClick={() => onNavigate('logout')}
                  className="flex items-center justify-between w-full p-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                >
                  <div className="flex items-center">
                    <LogOut className="w-5 h-5 mr-3" />
                    <span>Выйти</span>
                  </div>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)} 
        />
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

export default PersonalCabinet;
