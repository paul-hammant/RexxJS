/**
 * Date and time manipulation functions for REXX interpreter
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Helper functions for date/time formatting
const formatDate = (date, timezone = 'UTC', format = 'YYYY-MM-DD') => {
  try {
    // Convert to target timezone
    const targetDate = timezone === 'UTC' ? date : 
                       timezone === 'local' ? date : 
                       new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    
    const year = targetDate.getFullYear();
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const day = targetDate.getDate().toString().padStart(2, '0');
    
    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD.MM.YYYY':
        return `${day}.${month}.${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'ISO':
        return `${year}-${month}-${day}`;
      default:
        return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Fallback for unsupported timezones
    const isoDate = date.toISOString().split('T')[0];
    if (format === 'MM/DD/YYYY') {
      const [year, month, day] = isoDate.split('-');
      return `${month}/${day}/${year}`;
    }
    return isoDate;
  }
};

const formatTime = (date, timezone = 'UTC', format = 'HH:MM:SS') => {
  try {
    const options = { 
      timeZone: timezone === 'local' ? undefined : timezone,
      hour12: false 
    };
    
    switch (format) {
      case 'HH:MM:SS':
        return date.toLocaleTimeString('en-GB', options);
      case 'HH:MM':
        return date.toLocaleTimeString('en-GB', { ...options, second: undefined });
      case '12H':
        return date.toLocaleTimeString('en-US', { ...options, hour12: true });
      default:
        return date.toLocaleTimeString('en-GB', options);
    }
  } catch (e) {
    // Fallback for unsupported timezones
    return date.toTimeString().split(' ')[0];
  }
};

const formatDateTime = (date, timezone = 'UTC', format = 'ISO') => {
  try {
    if (format === 'ISO') {
      return timezone === 'UTC' ? date.toISOString() : 
             date.toLocaleString('sv-SE', { timeZone: timezone }).replace(' ', 'T') + 'Z';
    }
    
    // Handle custom formats like 'YYYY-MM-DD HH:MM:SS'
    if (format === 'YYYY-MM-DD HH:MM:SS') {
      const targetDate = timezone === 'UTC' ? date : 
                         new Date(date.toLocaleString('en-US', { timeZone: timezone }));
      
      const year = targetDate.getFullYear();
      const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
      const day = targetDate.getDate().toString().padStart(2, '0');
      const hours = targetDate.getHours().toString().padStart(2, '0');
      const minutes = targetDate.getMinutes().toString().padStart(2, '0');
      const seconds = targetDate.getSeconds().toString().padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    const options = { timeZone: timezone === 'local' ? undefined : timezone };
    return date.toLocaleString('en-US', options);
  } catch (e) {
    // Fallback for unsupported timezones
    return date.toISOString();
  }
};

const dateTimeFunctions = {
  'DATE': (timezone = 'UTC', format = 'YYYY-MM-DD') => {
    return formatDate(new Date(), timezone, format);
  },
  
  'TIME': (timezone = 'UTC', format = 'HH:MM:SS') => {
    return formatTime(new Date(), timezone, format);
  },
  
  'NOW': (timezone = 'UTC', format = 'ISO') => {
    const now = new Date();
    if (format === 'ISO') {
      return timezone === 'UTC' ? now.toISOString() : formatDateTime(now, timezone, 'ISO');
    }
    return formatDateTime(now, timezone, format);
  },
  
  'DATE_ADD': (dateStr, days = 0, months = 0, years = 0, hours = 0, minutes = 0, seconds = 0) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(date.getTime())) throw new Error(`Invalid date: ${dateStr}`);
    
    const result = new Date(date);
    if (years) result.setFullYear(result.getFullYear() + years);
    if (months) result.setMonth(result.getMonth() + months);
    if (days) result.setDate(result.getDate() + days);
    if (hours) result.setHours(result.getHours() + hours);
    if (minutes) result.setMinutes(result.getMinutes() + minutes);
    if (seconds) result.setSeconds(result.getSeconds() + seconds);
    
    return formatDate(result, 'UTC', 'YYYY-MM-DD');
  },
  
  'DATE_SUB': (dateStr, days = 0, months = 0, years = 0, hours = 0, minutes = 0, seconds = 0) => {
    const date = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(date.getTime())) throw new Error(`Invalid date: ${dateStr}`);
    
    const result = new Date(date);
    if (years) result.setFullYear(result.getFullYear() - years);
    if (months) result.setMonth(result.getMonth() - months);
    if (days) result.setDate(result.getDate() - days);
    if (hours) result.setHours(result.getHours() - hours);
    if (minutes) result.setMinutes(result.getMinutes() - minutes);
    if (seconds) result.setSeconds(result.getSeconds() - seconds);
    
    return formatDate(result, 'UTC', 'YYYY-MM-DD');
  },
  
  'DATE_DIFF': (date1Str, date2Str, unit = 'days') => {
    const date1 = new Date(date1Str);
    const date2 = new Date(date2Str);
    
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
    
    const diffMs = date2.getTime() - date1.getTime();
    
    switch (unit.toLowerCase()) {
      case 'seconds': return Math.floor(diffMs / 1000);
      case 'minutes': return Math.floor(diffMs / (1000 * 60));
      case 'hours': return Math.floor(diffMs / (1000 * 60 * 60));
      case 'days': return Math.floor(diffMs / (1000 * 60 * 60 * 24));
      case 'weeks': return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
      default: return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }
  },
  
  'DATE_PARSE': (dateStr, format = 'auto') => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Cannot parse date: ${dateStr}`);
    }
    return date;
  },
  
  'DATE_VALID': (dateStr) => {
    try {
      // Check for null, undefined, empty string
      if (dateStr === null || dateStr === undefined || dateStr === '') {
        return false;
      }
      
      const date = new Date(dateStr);
      return !isNaN(date.getTime());
    } catch (e) {
      return false;
    }
  },

  'NOW_TIMESTAMP': () => {
    try {
      return Date.now();
    } catch (e) {
      return 0;
    }
  },
  
  'DATE_FORMAT': (dateStr, format = 'ISO') => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      
      switch (format.toUpperCase()) {
        case 'ISO':
          return date.toISOString().split('T')[0];
        case 'US':
          return date.toLocaleDateString('en-US');
        case 'EU':
          return date.toLocaleDateString('en-GB');
        case 'LONG':
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
          });
        case 'SHORT':
          return date.toLocaleDateString('en-US', { 
            year: '2-digit', month: '2-digit', day: '2-digit' 
          });
        case 'TIMESTAMP':
          return date.getTime().toString();
        default:
          return date.toISOString().split('T')[0];
      }
    } catch (e) {
      return '';
    }
  },
  
  'TIME_FORMAT': (dateStr, format = '24') => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      
      switch (format.toLowerCase()) {
        case '24':
        case '24h':
          return date.toTimeString().split(' ')[0];
        case '12':
        case '12h':
          return date.toLocaleTimeString('en-US', { 
            hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' 
          });
        case 'hm':
          return date.toTimeString().substr(0, 5);
        case 'hm12':
          return date.toLocaleTimeString('en-US', { 
            hour12: true, hour: 'numeric', minute: '2-digit' 
          });
        default:
          return date.toTimeString().split(' ')[0];
      }
    } catch (e) {
      return '';
    }
  },
  
  'DATE_SUBTRACT': (dateStr, amount, unit = 'days') => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      
      const amountNum = parseInt(amount) || 0;
      
      switch (unit.toLowerCase()) {
        case 'years':
        case 'year':
          date.setFullYear(date.getFullYear() - amountNum);
          break;
        case 'months':
        case 'month':
          date.setMonth(date.getMonth() - amountNum);
          break;
        case 'days':
        case 'day':
          date.setDate(date.getDate() - amountNum);
          break;
        case 'hours':
        case 'hour':
          date.setHours(date.getHours() - amountNum);
          break;
        case 'minutes':
        case 'minute':
          date.setMinutes(date.getMinutes() - amountNum);
          break;
        case 'seconds':
        case 'second':
          date.setSeconds(date.getSeconds() - amountNum);
          break;
        default:
          date.setDate(date.getDate() - amountNum);
      }
      
      return date.toISOString();
    } catch (e) {
      return '';
    }
  },
  
  'DATE_PARSE_DETAILS': (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Cannot parse date: ${dateStr}`);
    }
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      dayOfWeek: date.getDay(),
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      monthName: date.toLocaleDateString('en-US', { month: 'long' }),
      timestamp: date.getTime(),
      iso: date.toISOString()
    };
  },
  
  'DATE_CREATE': (year, month, day, hour = 0, minute = 0, second = 0) => {
    try {
      const date = new Date(
        parseInt(year), 
        parseInt(month) - 1, 
        parseInt(day), 
        parseInt(hour), 
        parseInt(minute), 
        parseInt(second)
      );
      if (isNaN(date.getTime())) return '';
      return date.toISOString();
    } catch (e) {
      return '';
    }
  },
  
  'DATE_IS_WEEKEND': (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;
      const day = date.getDay();
      return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    } catch (e) {
      return false;
    }
  },
  
  'DATE_IS_BUSINESS_DAY': (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;
      const day = date.getDay();
      return day >= 1 && day <= 5; // Monday = 1, Friday = 5
    } catch (e) {
      return false;
    }
  },
  
  'DATE_NEXT_BUSINESS_DAY': (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      
      do {
        date.setDate(date.getDate() + 1);
      } while (date.getDay() === 0 || date.getDay() === 6);
      
      return date.toISOString();
    } catch (e) {
      return '';
    }
  },
  
  'DATE_AGE': (birthDateStr, referenceDate = null) => {
    try {
      const birthDate = new Date(birthDateStr);
      const refDate = referenceDate ? new Date(referenceDate) : new Date();
      
      if (isNaN(birthDate.getTime()) || isNaN(refDate.getTime())) return 0;
      
      let age = refDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = refDate.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (e) {
      return 0;
    }
  },
  
  'DATE_QUARTER': (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 0;
      return Math.ceil((date.getMonth() + 1) / 3);
    } catch (e) {
      return 0;
    }
  },
  
  'DATE_WEEK_NUMBER': (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 0;
      
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    } catch (e) {
      return 0;
    }
  }

  //TODO insert more date/time functions here

};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { dateTimeFunctions };
} else if (typeof window !== 'undefined') {
  window.dateTimeFunctions = dateTimeFunctions;
}