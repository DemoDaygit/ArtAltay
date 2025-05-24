import React, { useState, useEffect } from 'react';
import { 
  Heart, ShoppingCart, Calendar, MapPin, Camera, Users, Book, 
  Car, MessageCircle, Star, Phone, Globe, Clock, Search, 
  Filter, ArrowRight, Award, Sparkles, Compass
} from 'lucide-react';
import { useTelegram } from '../../hooks/useTelegram';
import apiService from '../../services/api';

const MainScreen = ({ onNavigate, favorites, cart }) => {
  const [loading, setLoading] = useState(true);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  const [personalRecommendations, setPersonalRecommendations] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const { user, hapticFeedback } = useTelegram();

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Загрузка популярных категорий
      const categoriesResponse = await apiService.getCategories();
      if (categoriesResponse.success) {
        setPopularCategories(categoriesResponse.data || getDefaultCategories());
      } else {
        setPopularCategories(getDefaultCategories());
      }

      // Загрузка избранных мероприятий
      const featuredResponse = await apiService.getFeaturedEvents();
      if (featuredResponse.success) {
        setFeaturedEvents(featuredResponse.data || []);
      }

      // Загрузка персональных рекомендаций
      if (user?.id) {
        const recommendationsResponse = await apiService.getPersonalRecommendations(user.id);
        if (recommendationsResponse.success) {
          setPersonalRecommendations(recommendationsResponse.data || []);
        }
      }

      // Загрузка предстоящих мероприятий
      const upcomingResponse = await apiService.getUpcomingEvents();
      if (upcomingResponse.success) {
        setUpcomingEvents(upcomingResponse.data || []);
      }

      // Отслеживание аналитики
      apiService.trackEvent('main_screen_viewed', {
        userId: user?.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error loading main screen data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCategories = () => {
    return [
      { id: 'impressions', label: 'Впечатления', icon: 'Star', description: 'Мастер-классы и культурные мероприятия' },
      { id: 'adventures', label: 'Приключения', icon: 'MapPin', description: 'Походы и авторские туры' },
      { id: 'accommodation', label: 'Размещение', icon: 'Car', description: 'Домики и гостевые дома' },
      { id: 'education', label: 'Обучение', icon: 'Book', description: 'Курсы и мастер-классы' },
      { id: 'healing', label: 'Исцеление', icon: 'Heart', description: 'Оздоровительные практики' },
      { id: 'events', label: 'Мероприятия', icon: 'Calendar', description: 'Фестивали и события' }
    ];
  };

  const getIconComponent = (iconName) => {
    const icons = {
      Star: Star,
      MapPin: MapPin,
      Car: Car,
      Book: Book,
      Heart: Heart,
      Calendar: Calendar,
      Users: Users,
      Phone: Phone
    };
    return icons[iconName] || Star;
  };

  const handleCategoryClick = (categoryId) => {
    hapticFeedback('selection');
    onNavigate('catalog', { category: categoryId });
  };

  const handleEventClick = (event) => {
    hapticFeedback('selection');
    onNavigate('eventDetails', { eventId: event.id });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      hapticFeedback('selection');
      onNavigate('catalog', { search: searchQuery });
    }
  };

  const handleViewAll = (section) => {
    hapticFeedback('selection');
    onNavigate('catalog', { section });
  };

  // Компонент карточки мероприятия
  const EventCard = ({ event, compact = false }) => (
    <div 
      className={`bg-slate-800/30 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:border-teal-400/30 transition-all group cursor-pointer ${compact ? 'flex' : ''}`}
      onClick={() => handleEventClick(event)}
    >
      <div className={`aspect-video relative overflow-hidden ${compact ? 'w-32 flex-shrink-0' : ''}`}>
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 flex space-x-2">
          {event.originalPrice > event.price && (
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              -{Math.round((1 - event.price / event.originalPrice) * 100)}%
            </div>
          )}
          <div className="bg-teal-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
            {event.price.toLocaleString()} ₽
          </div>
        </div>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onNavigate('toggleFavorite', { eventId: event.id });
            hapticFeedback('selection');
          }}
          className="absolute top-3 left-3 p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-black/70 transition-colors"
        >
          <Heart className={`w-4 h-4 ${favorites.has(event.id) ? 'fill-red-400 text-red-400' : 'text-white'}`} />
        </button>
      </div>
      
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-semibold group-hover:text-teal-300 transition-colors ${compact ? 'text-sm' : 'text-lg'}`}>
            {event.title}
          </h3>
          <div className="flex items-center text-sm text-yellow-400 ml-2">
            <Star className="w-3 h-3 fill-current mr-1" />
            <span>{event.rating}</span>
          </div>
        </div>
        
        <p className={`text-slate-400 mb-3 ${compact ? 'text-xs line-clamp-2' : 'text-sm'}`}>
          {event.description}
        </p>
        
        {!compact && event.tags && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.tags.slice(0, 3).map(tag => (
              <span key={tag} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        <div className={`flex items-center justify-between text-xs text-slate-500 mb-3 ${compact ? 'flex-col items-start space-y-1' : ''}`}>
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
            <span className={compact ? 'text-xs' : ''}>{event.location.split(',')[0]}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('booking', { eventId: event.id });
              hapticFeedback('selection');
            }}
            className={`bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors ${
              compact ? 'px-3 py-1 text-xs flex-1' : 'px-4 py-2 text-sm flex-1'
            }`}
          >
            Забронировать
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('share', { event });
              hapticFeedback('selection');
            }}
            className={`bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors ${
              compact ? 'px-2 py-1' : 'px-3 py-2'
            }`}
          >
            <ArrowRight className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
          </button>
        </div>
      </div>
    </div>
  );

  // Компонент секции с заголовком и кнопкой "Смотреть все"
  const SectionHeader = ({ title, onViewAll }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {onViewAll && (
        <button 
          onClick={onViewAll}
          className="text-teal-400 hover:text-teal-300 text-sm font-medium flex items-center"
        >
          Все <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Приветствие и поиск */}
      <div className="bg-gradient-to-r from-teal-600/20 to-blue-600/20 rounded-xl p-6 border border-teal-500/30">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {user ? `Привет, ${user.first_name}!` : 'Добро пожаловать!'}
            </h1>
            <p className="text-slate-300">Откройте для себя уникальные впечатления Алтая</p>
          </div>
          {user?.photo_url && (
            <img 
              src={user.photo_url} 
              alt={user.first_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-teal-400"
            />
          )}
        </div>

        <div className="relative">
          <div className="flex items-center bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <input
              type="text"
              placeholder="Поиск впечатлений..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder-slate-400"
            />
            <button 
              onClick={handleSearch}
              className="bg-teal-600 hover:bg-teal-700 text-white p-3"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Популярные категории */}
      <div>
        <SectionHeader 
          title="Категории" 
          onViewAll={() => handleViewAll('categories')}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {popularCategories.map(category => {
            const IconComponent = getIconComponent(category.icon);
            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-teal-400/30 transition-all cursor-pointer"
              >
                <div className="w-10 h-10 bg-teal-600/20 rounded-lg flex items-center justify-center mb-3">
                  <IconComponent className="w-5 h-5 text-teal-400" />
                </div>
                <h3 className="font-semibold mb-1">{category.label}</h3>
                <p className="text-xs text-slate-400">{category.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Специальные предложения */}
      {featuredEvents.length > 0 && (
        <div>
          <SectionHeader 
            title="Специальные предложения" 
            onViewAll={() => handleViewAll('featured')}
          />
          <div className="relative overflow-x-auto pb-4 -mx-4">
            <div className="flex space-x-4 px-4" style={{ minWidth: 'max-content' }}>
              {featuredEvents.map(event => (
                <div key={event.id} className="w-80 flex-shrink-0">
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Персональные рекомендации */}
      {user && personalRecommendations.length > 0 && (
        <div>
          <SectionHeader 
            title={`${user.first_name}, вам может понравиться`}
            onViewAll={() => handleViewAll('recommendations')}
          />
          <div className="space-y-4">
            {personalRecommendations.slice(0, 3).map(event => (
              <EventCard key={event.id} event={event} compact={true} />
            ))}
          </div>
        </div>
      )}

      {/* Предстоящие мероприятия */}
      {upcomingEvents.length > 0 && (
        <div>
          <SectionHeader 
            title="Скоро на Алтае" 
            onViewAll={() => handleViewAll('upcoming')}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingEvents.slice(0, 4).map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Промо-баннер */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">🎁 Пригласите друзей</h2>
            <p className="text-slate-300">Получите 500 бонусных баллов за каждого приглашенного друга</p>
            <button 
              onClick={() => onNavigate('invite')}
              className="mt-3 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center"
            >
              Пригласить <Sparkles className="w-4 h-4 ml-2" />
            </button>
          </div>
          <Award className="w-16 h-16 text-purple-400" />
        </div>
      </div>

      {/* Загрузка */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default MainScreen;
