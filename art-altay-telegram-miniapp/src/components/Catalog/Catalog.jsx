import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Filter, X, ChevronDown, ChevronUp, Heart, 
  Star, Clock, Users, MapPin, ArrowRight, Sliders, 
  ArrowLeft, Check, RefreshCw
} from 'lucide-react';
import { useTelegram } from '../../hooks/useTelegram';
import apiService from '../../services/api';

const Catalog = ({ onNavigate, favorites, initialFilters = {} }) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(initialFilters.category || 'all');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 50000],
    difficulty: '',
    duration: '',
    ...initialFilters
  });
  const [sortOption, setSortOption] = useState('popular');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const { user, hapticFeedback } = useTelegram();
  const searchInputRef = useRef(null);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadCategories();
    loadEvents();
  }, [activeCategory, page]);

  // Применение фильтров при их изменении
  useEffect(() => {
    applyFilters();
  }, [events, searchQuery, filters, sortOption]);

  const loadCategories = async () => {
    try {
      const response = await apiService.getCategories();
      if (response.success) {
        setCategories([
          { id: 'all', label: 'Все', icon: 'Star' },
          ...response.data
        ]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await apiService.getEvents(
        activeCategory === 'all' ? '' : activeCategory,
        { page, limit: 10 }
      );
      
      if (response.success) {
        if (page === 1) {
          setEvents(response.data || []);
        } else {
          setEvents(prev => [...prev, ...(response.data || [])]);
        }
        
        setHasMore((response.data || []).length === 10);
        
        // Track analytics
        apiService.trackEvent('catalog_viewed', {
          category: activeCategory,
          userId: user?.id,
          filters: JSON.stringify(filters)
        });
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.tags && event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    // Price filter
    filtered = filtered.filter(event => 
      event.price >= filters.priceRange[0] && event.price <= filters.priceRange[1]
    );

    // Difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(event => 
        event.difficulty === filters.difficulty
      );
    }

    // Duration filter
    if (filters.duration) {
      filtered = filtered.filter(event => 
        event.duration.includes(filters.duration)
      );
    }

    // Apply sorting
    if (sortOption === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === 'popular') {
      filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
    }

    setFilteredEvents(filtered);
  };

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setPage(1);
    hapticFeedback('selection');
  };

  const handleSearch = () => {
    applyFilters();
    hapticFeedback('selection');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      priceRange: [0, 50000],
      difficulty: '',
      duration: ''
    });
    setSearchQuery('');
    hapticFeedback('selection');
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleEventClick = (event) => {
    hapticFeedback('selection');
    onNavigate('eventDetails', { eventId: event.id });
  };

  // Компонент карточки мероприятия
  const EventCard = ({ event }) => (
    <div 
      className="bg-slate-800/30 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700/50 hover:border-teal-400/30 transition-all group cursor-pointer"
      onClick={() => handleEventClick(event)}
    >
      <div className="aspect-video relative overflow-hidden">
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
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg group-hover:text-teal-300 transition-colors">
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
        
        {event.tags && (
          <div className="flex flex-wrap gap-1 mb-3">
            {event.tags.slice(0, 3).map(tag => (
              <span key={tag} className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}
        
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
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Заголовок и поиск */}
      <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
        <div className="flex items-center space-x-2 mb-4">
          <button 
            onClick={() => onNavigate('back')}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Каталог мероприятий</h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Поиск мероприятий..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
              onClick={handleSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-teal-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Фильтры */}
        {showFilters && (
          <div className="mt-4 space-y-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
            <div>
              <label className="block text-sm font-medium mb-2">Цена (₽)</label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="0"
                  max={filters.priceRange[1]}
                  value={filters.priceRange[0]}
                  onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
                <span>—</span>
                <input
                  type="number"
                  min={filters.priceRange[0]}
                  value={filters.priceRange[1]}
                  onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Сложность</label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Любая сложность</option>
                <option value="Для начинающих">Для начинающих</option>
                <option value="Средний уровень">Средний уровень</option>
                <option value="Высокий уровень">Высокий уровень</option>
                <option value="Для всех">Для всех</option>
                <option value="Комфорт">Комфорт</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Продолжительность</label>
              <select
                value={filters.duration}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Любая продолжительность</option>
                <option value="час">До 1 часа</option>
                <option value="2 часа">2-3 часа</option>
                <option value="день">1 день</option>
                <option value="дня">2-3 дня</option>
                <option value="неделя">Неделя и более</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Сортировка</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white"
              >
                <option value="popular">По популярности</option>
                <option value="rating">По рейтингу</option>
                <option value="price_asc">Сначала дешевле</option>
                <option value="price_desc">Сначала дороже</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleResetFilters}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-medium flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Сбросить
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-medium"
              >
                Применить
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Категории */}
      <div className="overflow-x-auto pb-2 -mx-4">
        <div className="flex space-x-2 px-4" style={{ minWidth: 'max-content' }}>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeCategory === category.id 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-slate-800/30 text-slate-300 hover:bg-slate-700/50'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Результаты поиска */}
      {searchQuery && (
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
          <p className="text-slate-400">
            Результаты поиска по запросу: <span className="text-white font-medium">"{searchQuery}"</span>
          </p>
        </div>
      )}

      {/* Список мероприятий */}
      <div className="space-y-6">
        {filteredEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Загрузка...
                    </>
                  ) : (
                    <>Загрузить еще</>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center">
            {loading ? (
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400">Загрузка мероприятий...</p>
              </div>
            ) : (
              <>
                <Sliders className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Ничего не найдено</h3>
                <p className="text-slate-400 mb-6">
                  Попробуйте изменить параметры поиска или фильтры
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Сбросить фильтры
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;
