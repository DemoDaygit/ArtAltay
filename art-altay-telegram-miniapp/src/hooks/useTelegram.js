import React, { useState, useEffect } from 'react';
import { useTelegram } from '../../hooks/useTelegram';

// Хук для работы с Telegram WebApp API
export const useTelegram = () => {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      // Установка темы
      document.documentElement.classList.add(tg.colorScheme === 'dark' ? 'dark' : 'light');
      
      // Получение данных пользователя
      if (tg.initDataUnsafe?.user) {
        setUser(tg.initDataUnsafe.user);
      }
      
      // Событие готовности приложения
      tg.onEvent('viewportChanged', () => {
        setReady(true);
      });
      
      // Если приложение уже готово
      if (tg.isExpanded) {
        setReady(true);
      }
      
      // Сообщаем Telegram, что приложение готово
      tg.ready();
    } else {
      // Для разработки без Telegram
      console.warn('Telegram WebApp is not available. Using mock data.');
      setUser({
        id: 123456789,
        first_name: 'Тестовый',
        last_name: 'Пользователь',
        username: 'test_user',
        language_code: 'ru',
        is_premium: true
      });
      setReady(true);
    }
  }, []);
  
  // Функции для работы с Telegram WebApp API
  const tg = window.Telegram?.WebApp;
  
  // Тактильная обратная связь
  const hapticFeedback = (type) => {
    if (tg && tg.HapticFeedback) {
      switch (type) {
        case 'selection':
          tg.HapticFeedback.selectionChanged();
          break;
        case 'success':
          tg.HapticFeedback.notificationOccurred('success');
          break;
        case 'warning':
          tg.HapticFeedback.notificationOccurred('warning');
          break;
        case 'error':
          tg.HapticFeedback.notificationOccurred('error');
          break;
        case 'impact':
          tg.HapticFeedback.impactOccurred('medium');
          break;
        default:
          tg.HapticFeedback.impactOccurred('light');
      }
    }
  };
  
  // Управление главной кнопкой
  const showMainButton = () => tg?.MainButton.show();
  const hideMainButton = () => tg?.MainButton.hide();
  const setMainButtonText = (text) => {
    if (tg) {
      tg.MainButton.text = text;
    }
  };
  const setMainButtonParams = (params) => {
    if (tg) {
      if (params.color) tg.MainButton.color = params.color;
      if (params.text_color) tg.MainButton.textColor = params.text_color;
      if (params.is_active !== undefined) {
        params.is_active ? tg.MainButton.enable() : tg.MainButton.disable();
      }
      if (params.is_visible !== undefined) {
        params.is_visible ? tg.MainButton.show() : tg.MainButton.hide();
      }
    }
  };
  const onMainButtonClick = (callback) => {
    if (tg) {
      tg.MainButton.onClick(callback);
    }
  };
  
  return {
    user,
    tg,
    ready,
    hapticFeedback,
    showMainButton,
    hideMainButton,
    setMainButtonText,
    setMainButtonParams,
    onMainButtonClick
  };
};
