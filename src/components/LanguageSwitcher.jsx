import React from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      {/* <button
        onClick={() => changeLanguage('en')}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          background: i18n.language === 'en' ? 'var(--brand)' : '#fff',
          color: i18n.language === 'en' ? '#fff' : '#111',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '600'
        }}
      >
        EN
      </button>
      <button
        onClick={() => changeLanguage('hi')}
        style={{
          padding: '6px 12px',
          borderRadius: '6px',
          border: '1px solid #e5e7eb',
          background: i18n.language === 'hi' ? 'var(--brand)' : '#fff',
          color: i18n.language === 'hi' ? '#fff' : '#111',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '600'
        }}
      >
        हिं
      </button> */}
    </div>
  );
}

