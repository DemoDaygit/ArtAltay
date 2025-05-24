import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App';

// Инициализация API сервиса
import apiService from './services/api';
apiService.init();

// Рендеринг приложения
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
