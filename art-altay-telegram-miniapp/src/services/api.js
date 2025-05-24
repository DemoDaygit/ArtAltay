import axios from 'axios';

// Базовый URL API
const API_BASE_URL = 'https://api.art-altay.ru/v1';

// Конфигурация API сервиса
class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.useMockData = false;
    this.environment = 'production';
    this.simulateSlowNetwork = false;
    this.token = null;
  }

  // Инициализация сервиса
  init() {
    // Проверка наличия токена в localStorage
    this.token = localStorage.getItem('art_altay_token');
    
    // Настройка перехватчиков axios
    this.setupInterceptors();
    
    console.info('API Service initialized');
  }

  // Настройка перехватчиков запросов и ответов
  setupInterceptors() {
    // Перехватчик запросов
    axios.interceptors.request.use(
      config => {
        // Добавление токена авторизации
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        
        // Добавление базового URL
        config.url = `${this.baseUrl}${config.url}`;
        
        // Имитация медленной сети
        if (this.simulateSlowNetwork) {
          return new Promise(resolve => {
            setTimeout(() => resolve(config), 1500);
          });
        }
        
        return config;
      },
      error => Promise.reject(error)
    );
    
    // Перехватчик ответов
    axios.interceptors.response.use(
      response => response,
      error => {
        // Обработка ошибок авторизации
        if (error.response && error.response.status === 401) {
          this.token = null;
          localStorage.removeItem('art_altay_token');
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Установка окружения
  setEnvironment(environment) {
    this.environment = environment;
    
    // Изменение базового URL в зависимости от окружения
    switch (environment) {
      case 'development':
        this.baseUrl = 'http://localhost:3000/api';
        break;
      case 'staging':
        this.baseUrl = 'https://staging-api.art-altay.ru/v1';
        break;
      case 'production':
      default:
        this.baseUrl = API_BASE_URL;
        break;
    }
    
    console.info(`API environment set to: ${environment}`);
  }

  // Включение/выключение использования мок-данных
  setUseMockData(useMock) {
    this.useMockData = useMock;
    console.info(`Mock data ${useMock ? 'enabled' : 'disabled'}`);
  }

  // Включение/выключение имитации медленной сети
  setSimulateSlowNetwork(simulate) {
    this.simulateSlowNetwork = simulate;
    console.info(`Slow network simulation ${simulate ? 'enabled' : 'disabled'}`);
  }

  // Общий метод для выполнения запросов
  async request(method, endpoint, data = null, options = {}) {
    // Если включен режим мок-данных, возвращаем моки
    if (this.useMockData) {
      return this.getMockData(endpoint, data);
    }
    
    try {
      const response = await axios({
        method,
        url: endpoint,
        data: method !== 'get' ? data : undefined,
        params: method === 'get' ? data : undefined,
        ...options
      });
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      console.error(`API Error (${method.toUpperCase()} ${endpoint}):`, error);
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status
      };
    }
  }

  // Методы для различных типов запросов
  get(endpoint, params = {}) {
    return this.request('get', endpoint, params);
  }
  
  post(endpoint, data = {}) {
    return this.request('post', endpoint, data);
  }
  
  put(endpoint, data = {}) {
    return this.request('put', endpoint, data);
  }
  
  delete(endpoint) {
    return this.request('delete', endpoint);
  }

  // Методы API для работы с мероприятиями
  getEvents(filters = {}) {
    return this.get('/events', filters);
  }
  
  getEventById(eventId) {
    return this.get(`/events/${eventId}`);
  }
  
  getEventAvailability(eventId) {
    return this.get(`/events/${eventId}/availability`);
  }
  
  getEventTimeSlots(eventId, date) {
    return this.get(`/events/${eventId}/time-slots`, { date });
  }

  // Методы API для работы с бронированиями
  createBooking(bookingData) {
    return this.post('/bookings', bookingData);
  }
  
  getUserBookings(userId) {
    return this.get('/bookings', { userId });
  }
  
  cancelBooking(bookingId) {
    return this.delete(`/bookings/${bookingId}`);
  }

  // Методы API для работы с пользователями
  getUserProfile(userId) {
    return this.get(`/users/${userId}`);
  }
  
  updateUserProfile(userId, profileData) {
    return this.put(`/users/${userId}`, profileData);
  }

  // Методы API для аналитики
  trackEvent(eventName, eventData = {}) {
    return this.post('/analytics/track', {
      event: eventName,
      timestamp: new Date().toISOString(),
      ...eventData
    });
  }

  // Получение мок-данных для разработки
  getMockData(endpoint, params) {
    console.info(`Using mock data for: ${endpoint}`, params);
    
    // Имитация задержки сети
    return new Promise(resolve => {
      setTimeout(() => {
        // Мок-данные для различных эндпоинтов
        if (endpoint.startsWith('/events') && !endpoint.includes('/')) {
          resolve({
            success: true,
            data: this.getMockEvents(params)
          });
        } else if (endpoint.match(/\/events\/\d+$/)) {
          const eventId = endpoint.split('/').pop();
          resolve({
            success: true,
            data: this.getMockEventDetails(eventId)
          });
        } else if (endpoint.includes('/availability')) {
          resolve({
            success: true,
            data: this.getMockAvailability()
          });
        } else if (endpoint.includes('/time-slots')) {
          resolve({
            success: true,
            data: this.getMockTimeSlots()
          });
        } else if (endpoint.startsWith('/bookings') && !endpoint.includes('/')) {
          if (params?.userId) {
            resolve({
              success: true,
              data: this.getMockUserBookings(params.userId)
            });
          } else {
            resolve({
              success: true,
              data: { bookingId: Date.now().toString() }
            });
          }
        } else if (endpoint.startsWith('/users/')) {
          resolve({
            success: true,
            data: this.getMockUserProfile()
          });
        } else {
          resolve({
            success: true,
            data: { message: 'Mock data not implemented for this endpoint' }
          });
        }
      }, this.simulateSlowNetwork ? 1500 : 300);
    });
  }

  // Генерация мок-данных для списка мероприятий
  getMockEvents(filters = {}) {
    const events = [
      {
        id: '1',
        title: 'Экскурсия по Чемальскому тракту',
        description: 'Увлекательное путешествие по живописному Чемальскому тракту с посещением знаковых мест и природных достопримечательностей.',
        image: 'https://images.unsplash.com/photo-1543922558-d9a3b33c5b42',
        price: 2500,
        originalPrice: 3000,
        duration: '8 часов',
        location: 'Чемал, Республика Алтай',
        rating: 4.8,
        reviewsCount: 124,
        maxParticipants: 15,
        tags: ['природа', 'экскурсия', 'горы'],
        availableSpots: 8
      },
      {
        id: '2',
        title: 'Рафтинг по реке Катунь',
        description: 'Захватывающий сплав по горной реке Катунь с опытными инструкторами. Подходит как для новичков, так и для опытных туристов.',
        image: 'https://images.unsplash.com/photo-1504280317859-8d6a9c6b7e7a',
        price: 3500,
        originalPrice: 3500,
        duration: '4 часа',
        location: 'Река Катунь, Республика Алтай',
        rating: 4.9,
        reviewsCount: 89,
        maxParticipants: 10,
        tags: ['активный отдых', 'рафтинг', 'вода'],
        availableSpots: 4
      },
      {
        id: '3',
        title: 'Мастер-класс по алтайской кухне',
        description: 'Погрузитесь в традиции алтайской кухни и научитесь готовить национальные блюда под руководством опытного шеф-повара.',
        image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d',
        price: 1800,
        originalPrice: 2200,
        duration: '3 часа',
        location: 'Горно-Алтайск, Республика Алтай',
        rating: 4.7,
        reviewsCount: 56,
        maxParticipants: 8,
        tags: ['кулинария', 'мастер-класс', 'традиции'],
        availableSpots: 6
      },
      {
        id: '4',
        title: 'Конная прогулка к водопаду Корбу',
        description: 'Живописная конная прогулка через горные тропы к одному из красивейших водопадов Алтая - водопаду Корбу.',
        image: 'https://images.unsplash.com/photo-1551525212-a1f4e1e2c192',
        price: 4000,
        originalPrice: 4500,
        duration: '6 часов',
        location: 'Телецкое озеро, Республика Алтай',
        rating: 4.6,
        reviewsCount: 72,
        maxParticipants: 8,
        tags: ['конные прогулки', 'природа', 'водопад'],
        availableSpots: 3
      },
      {
        id: '5',
        title: 'Фототур "Краски Алтая"',
        description: 'Уникальная возможность запечатлеть самые живописные места Алтая под руководством профессионального фотографа.',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        price: 5500,
        originalPrice: 5500,
        duration: '2 дня',
        location: 'Различные локации, Республика Алтай',
        rating: 4.9,
        reviewsCount: 45,
        maxParticipants: 6,
        tags: ['фотография', 'природа', 'тур'],
        availableSpots: 2
      },
      {
        id: '6',
        title: 'Экскурсия в Каракольскую долину',
        description: 'Путешествие в мистическую Каракольскую долину, известную своими древними курганами и петроглифами.',
        image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027',
        price: 2800,
        originalPrice: 3200,
        duration: '10 часов',
        location: 'Каракольская долина, Республика Алтай',
        rating: 4.7,
        reviewsCount: 63,
        maxParticipants: 12,
        tags: ['история', 'археология', 'экскурсия'],
        availableSpots: 7
      }
    ];
    
    // Фильтрация по тегам
    let filteredEvents = [...events];
    if (filters.tags && filters.tags.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        filters.tags.some(tag => event.tags.includes(tag))
      );
    }
    
    // Фильтрация по цене
    if (filters.minPrice !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.price >= filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.price <= filters.maxPrice);
    }
    
    // Фильтрация по поисковому запросу
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower)
      );
    }
    
    return {
      events: filteredEvents,
      total: filteredEvents.length,
      page: filters.page || 1,
      pageSize: filters.pageSize || 10,
      totalPages: Math.ceil(filteredEvents.length / (filters.pageSize || 10))
    };
  }

  // Генерация мок-данных для деталей мероприятия
  getMockEventDetails(eventId) {
    const events = this.getMockEvents().events;
    const event = events.find(e => e.id === eventId) || events[0];
    
    // Добавляем дополнительные данные для детальной страницы
    return {
      ...event,
      included: [
        'Профессиональный гид',
        'Транспорт',
        'Питание (обед)',
        'Фотографии с мероприятия',
        'Страховка'
      ],
      notIncluded: [
        'Алкогольные напитки',
        'Личные расходы',
        'Дополнительные активности'
      ],
      requirements: [
        'Удобная обувь и одежда',
        'Солнцезащитные средства',
        'Документы (паспорт)'
      ],
      reviews: [
        {
          userName: 'Анна М.',
          userPhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
          rating: 5,
          text: 'Потрясающее мероприятие! Гид был очень знающим и дружелюбным. Всем рекомендую!',
          date: '2025-04-15'
        },
        {
          userName: 'Иван К.',
          userPhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
          rating: 4,
          text: 'Очень понравилось, но хотелось бы больше времени на некоторых локациях.',
          date: '2025-04-02'
        },
        {
          userName: 'Мария С.',
          userPhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
          rating: 5,
          text: 'Великолепные виды и отличная организация. Обязательно приеду еще раз!',
          date: '2025-03-20'
        }
      ],
      organizer: {
        name: 'Алтай Тревел',
        photo: 'https://randomuser.me/api/portraits/men/75.jpg',
        description: 'Организатор экскурсий и активного отдыха на Алтае с 2010 года',
        rating: 4.8
      }
    };
  }

  // Генерация мок-данных для доступности дат
  getMockAvailability() {
    const today = new Date();
    const dates = [];
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Исключаем некоторые даты для имитации недоступности
      if (i % 7 !== 0) {
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    
    return { dates };
  }

  // Генерация мок-данных для временных слотов
  getMockTimeSlots() {
    const times = ['09:00', '11:00', '14:00', '16:00', '18:00'];
    
    // Исключаем некоторые времена для имитации недоступности
    const availableTimes = times.filter(() => Math.random() > 0.3);
    
    return { times: availableTimes.length > 0 ? availableTimes : times };
  }

  // Генерация мок-данных для бронирований пользователя
  getMockUserBookings(userId) {
    const events = this.getMockEvents().events;
    const bookings = [];
    
    // Генерируем 3-5 случайных бронирований
    const count = Math.floor(Math.random() * 3) + 3;
    
    for (let i = 0; i < count; i++) {
      const event = events[Math.floor(Math.random() * events.length)];
      const today = new Date();
      const bookingDate = new Date(today);
      bookingDate.setDate(today.getDate() + Math.floor(Math.random() * 30));
      
      bookings.push({
        id: `booking-${Date.now()}-${i}`,
        eventId: event.id,
        userId,
        status: ['confirmed', 'pending', 'completed'][Math.floor(Math.random() * 3)],
        date: bookingDate.toISOString().split('T')[0],
        time: ['09:00', '11:00', '14:00', '16:00', '18:00'][Math.floor(Math.random() * 5)],
        participants: Math.floor(Math.random() * 4) + 1,
        totalPrice: event.price * (Math.floor(Math.random() * 4) + 1),
        createdAt: new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        event: {
          title: event.title,
          image: event.image,
          duration: event.duration,
          location: event.location
        }
      });
    }
    
    return { bookings };
  }

  // Генерация мок-данных для профиля пользователя
  getMockUserProfile() {
    return {
      id: '123456',
      firstName: 'Александр',
      lastName: 'Иванов',
      email: 'alex@example.com',
      phone: '+7 (999) 123-45-67',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      loyaltyPoints: 250,
      registrationDate: '2024-01-15',
      preferences: {
        categories: ['природа', 'активный отдых', 'экскурсии'],
        notifications: true
      },
      statistics: {
        totalBookings: 8,
        completedEvents: 5,
        favoriteCategories: ['природа', 'экскурсии'],
        totalSpent: 15600
      }
    };
  }
}

// Создаем и экспортируем экземпляр сервиса
const apiService = new ApiService();
export default apiService;
