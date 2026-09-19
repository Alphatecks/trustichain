/** Locale + timezone for the selected display currency (country flag in the balance picker). */
const DISPLAY_CURRENCY_CALENDAR = {
  USD: { locale: 'en-US', timeZone: 'America/New_York' },
  EUR: { locale: 'en-IE', timeZone: 'Europe/Berlin' },
  GBP: { locale: 'en-GB', timeZone: 'Europe/London' },
  JPY: { locale: 'ja-JP', timeZone: 'Asia/Tokyo' },
  CAD: { locale: 'en-CA', timeZone: 'America/Toronto' },
  AUD: { locale: 'en-AU', timeZone: 'Australia/Sydney' },
  CHF: { locale: 'de-CH', timeZone: 'Europe/Zurich' },
  CNY: { locale: 'zh-CN', timeZone: 'Asia/Shanghai' },
  HKD: { locale: 'zh-HK', timeZone: 'Asia/Hong_Kong' },
  SGD: { locale: 'en-SG', timeZone: 'Asia/Singapore' },
  INR: { locale: 'en-IN', timeZone: 'Asia/Kolkata' },
  NGN: { locale: 'en-NG', timeZone: 'Africa/Lagos' },
  ZAR: { locale: 'en-ZA', timeZone: 'Africa/Johannesburg' },
  BRL: { locale: 'pt-BR', timeZone: 'America/Sao_Paulo' },
  MXN: { locale: 'es-MX', timeZone: 'America/Mexico_City' },
  AED: { locale: 'ar-AE', timeZone: 'Asia/Dubai' },
  SAR: { locale: 'ar-SA', timeZone: 'Asia/Riyadh' },
  TRY: { locale: 'tr-TR', timeZone: 'Europe/Istanbul' },
  KRW: { locale: 'ko-KR', timeZone: 'Asia/Seoul' },
  XRP: { locale: 'en-US', timeZone: 'UTC' },
};

export function getDisplayCalendar(displayCurrency) {
  const code = String(displayCurrency || 'USD').toUpperCase();
  return DISPLAY_CURRENCY_CALENDAR[code] || DISPLAY_CURRENCY_CALENDAR.USD;
}

export function getZonedDateParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const map = {};
  dtf.formatToParts(date).forEach((part) => {
    if (part.type !== 'literal') map[part.type] = Number(part.value);
  });
  return {
    year: map.year,
    month: map.month,
    day: map.day,
  };
}

export function formatLocalizedMonthName(monthIndexZeroBased, locale, style = 'long') {
  return new Intl.DateTimeFormat(locale, { month: style }).format(
    new Date(2020, monthIndexZeroBased, 1),
  );
}

export function getHistoryMonthFilterOptions(displayCurrency) {
  const { locale, timeZone } = getDisplayCalendar(displayCurrency);
  const now = getZonedDateParts(new Date(), timeZone);
  const months = Array.from({ length: 12 }, (_, monthIndex) => ({
    value: `m-${monthIndex}`,
    label: formatLocalizedMonthName(monthIndex, locale),
  }));
  return {
    locale,
    timeZone,
    year: now.year,
    options: [
      { value: 'all', label: 'Monthly' },
      { value: 'this_month', label: 'This month' },
      { value: 'last_month', label: 'Last month' },
      ...months,
    ],
  };
}

export function transactionMatchesMonthFilter(dateInput, monthlyFilter, displayCurrency) {
  const filter = String(monthlyFilter || 'all');
  if (!filter || filter === 'all' || filter === 'Monthly') return true;

  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return false;

  const { timeZone } = getDisplayCalendar(displayCurrency);
  const parts = getZonedDateParts(date, timeZone);
  const now = getZonedDateParts(new Date(), timeZone);

  if (filter === 'this_month' || filter === 'This month') {
    return parts.year === now.year && parts.month === now.month;
  }

  if (filter === 'last_month' || filter === 'Last month') {
    let year = now.year;
    let month = now.month - 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    return parts.year === year && parts.month === month;
  }

  const monthMatch = /^m-(\d{1,2})$/.exec(filter);
  if (monthMatch) {
    const monthIndex = Number(monthMatch[1]);
    if (monthIndex < 0 || monthIndex > 11) return false;
    return parts.year === now.year && parts.month === monthIndex + 1;
  }

  return true;
}

export function formatDateForDisplayCurrency(dateInput, displayCurrency) {
  if (!dateInput) return 'N/A';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    const raw = String(dateInput);
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.split('T')[0].split(' ')[0];
    return raw;
  }
  const { locale, timeZone } = getDisplayCalendar(displayCurrency);
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
