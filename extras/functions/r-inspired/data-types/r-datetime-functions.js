/**
 * R-style date/time and temporal data functions for REXX interpreter
 * Mirrors R-language date/time operations, POSIXct/POSIXlt, and temporal analysis
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

const rDateTimeFunctions = {
  // Current Date/Time Functions
  'SYS_DATE': () => {
    try {
      const now = new Date();
      return {
        year: now.getFullYear(),
        month: now.getMonth() + 1, // R uses 1-based months
        day: now.getDate(),
        date: now.toISOString().split('T')[0]
      };
    } catch (e) {
      return null;
    }
  },

  'SYS_TIME': () => {
    try {
      const now = new Date();
      return {
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
        millisecond: now.getMilliseconds(),
        timestamp: now.getTime(),
        iso: now.toISOString()
      };
    } catch (e) {
      return null;
    }
  },

  'NOW': () => {
    try {
      return new Date();
    } catch (e) {
      return null;
    }
  },

  // Date Creation and Parsing
  'AS_DATE': (x, format = null, origin = null) => {
    try {
      if (x === null || x === undefined) return null;
      
      // Handle arrays
      if (Array.isArray(x)) {
        return x.map(val => rDateTimeFunctions.AS_DATE(val, format, origin));
      }
      
      // Handle existing Date objects
      if (x instanceof Date) return x;
      
      // Handle numeric values (days since origin)
      if (typeof x === 'number' || (typeof x === 'string' && /^\d+(\.\d+)?$/.test(x.trim()))) {
        const num = parseFloat(x);
        if (origin) {
          const originDate = new Date(origin);
          return new Date(originDate.getTime() + num * 24 * 60 * 60 * 1000);
        }
        // Default: days since Unix epoch
        return new Date(num * 24 * 60 * 60 * 1000);
      }
      
      // Handle string dates
      const dateStr = String(x);
      
      // Common R date formats
      if (format) {
        return rDateTimeFunctions.parseWithFormat(dateStr, format);
      }
      
      // Auto-detect common formats
      const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (isoMatch) {
        const year = parseInt(isoMatch[1]);
        const month = parseInt(isoMatch[2]) - 1; // JS months are 0-based
        const day = parseInt(isoMatch[3]);
        const date = new Date(year, month, day);
        // Ensure year is set correctly (JS Date constructor can be problematic with years)
        date.setFullYear(year);
        return date;
      }
      
      // Fallback to JavaScript Date parsing
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
      
    } catch (e) {
      return null;
    }
  },

  'AS_POSIXCT': (x, tz = 'UTC') => {
    try {
      const date = rDateTimeFunctions.AS_DATE(x);
      if (!date) return null;
      
      return {
        timestamp: date.getTime() / 1000, // Unix timestamp in seconds
        date: date,
        timezone: tz,
        iso: date.toISOString()
      };
    } catch (e) {
      return null;
    }
  },

  'AS_POSIXLT': (x, tz = 'UTC') => {
    try {
      const date = rDateTimeFunctions.AS_DATE(x);
      if (!date) return null;
      
      return {
        sec: date.getSeconds(),
        min: date.getMinutes(),
        hour: date.getHours(),
        mday: date.getDate(),
        mon: date.getMonth(), // 0-based like R POSIXlt
        year: date.getFullYear() - 1900, // Years since 1900 like R
        wday: date.getDay(), // 0=Sunday
        yday: Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)),
        isdst: -1,
        timezone: tz,
        date: date
      };
    } catch (e) {
      return null;
    }
  },

  // Date Formatting
  'FORMAT_DATE': (x, format = '%Y-%m-%d') => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      
      return dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        if (!d) return 'NA';
        
        return format
          .replace(/%Y/g, d.getFullYear().toString())
          .replace(/%y/g, (d.getFullYear() % 100).toString().padStart(2, '0'))
          .replace(/%m/g, (d.getMonth() + 1).toString().padStart(2, '0'))
          .replace(/%d/g, d.getDate().toString().padStart(2, '0'))
          .replace(/%H/g, d.getHours().toString().padStart(2, '0'))
          .replace(/%M/g, d.getMinutes().toString().padStart(2, '0'))
          .replace(/%S/g, d.getSeconds().toString().padStart(2, '0'))
          .replace(/%A/g, ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()])
          .replace(/%a/g, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()])
          .replace(/%B/g, ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()])
          .replace(/%b/g, ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]);
      });
    } catch (e) {
      return Array.isArray(x) ? [] : 'NA';
    }
  },

  'STRFTIME': (x, format = '%Y-%m-%d %H:%M:%S') => {
    return rDateTimeFunctions.FORMAT_DATE(x, format);
  },

  'STRPTIME': (x, format) => {
    return rDateTimeFunctions.AS_DATE(x, format);
  },

  // Date Extraction Functions
  'YEAR': (x) => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        return d ? d.getFullYear() : NaN;
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : NaN;
    }
  },

  'MONTH': (x) => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        return d ? d.getMonth() + 1 : NaN; // 1-based like R
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : NaN;
    }
  },

  'DAY': (x) => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        return d ? d.getDate() : NaN;
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : NaN;
    }
  },

  'WEEKDAY': (x) => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        return d ? d.getDay() + 1 : NaN; // 1=Sunday like R
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : NaN;
    }
  },

  'WEEKDAYS': (x, abbreviate = false) => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const fullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const abbrevNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const names = abbreviate ? abbrevNames : fullNames;
      
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        return d ? names[d.getDay()] : 'NA';
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : 'NA';
    }
  },

  'MONTHS': (x, abbreviate = false) => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const fullNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
      const abbrevNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const names = abbreviate ? abbrevNames : fullNames;
      
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        return d ? names[d.getMonth()] : 'NA';
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : 'NA';
    }
  },

  'QUARTERS': (x) => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        if (!d) return 'NA';
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        return `Q${quarter}`;
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : 'NA';
    }
  },

  // Date Arithmetic
  'DIFFTIME': (time1, time2, units = 'days') => {
    try {
      const d1 = rDateTimeFunctions.AS_DATE(time1);
      const d2 = rDateTimeFunctions.AS_DATE(time2);
      
      if (!d1 || !d2) return NaN;
      
      const diffMs = d1.getTime() - d2.getTime();
      
      switch (units.toLowerCase()) {
        case 'secs':
        case 'seconds':
          return diffMs / 1000;
        case 'mins':
        case 'minutes':
          return diffMs / (1000 * 60);
        case 'hours':
          return diffMs / (1000 * 60 * 60);
        case 'days':
          return diffMs / (1000 * 60 * 60 * 24);
        case 'weeks':
          return diffMs / (1000 * 60 * 60 * 24 * 7);
        default:
          return diffMs / (1000 * 60 * 60 * 24); // Default to days
      }
    } catch (e) {
      return NaN;
    }
  },

  'DATE_DIFF': (end_date, start_date, units = 'days') => {
    return rDateTimeFunctions.DIFFTIME(end_date, start_date, units);
  },

  // Date Sequences
  'SEQ_DATE': (from, to = null, by = 1, length_out = null) => {
    try {
      const startDate = rDateTimeFunctions.AS_DATE(from);
      if (!startDate) return [];
      
      if (length_out !== null) {
        const result = [];
        const current = new Date(startDate);
        for (let i = 0; i < length_out; i++) {
          result.push(new Date(current));
          current.setDate(current.getDate() + by);
        }
        return result;
      }
      
      if (to !== null) {
        const endDate = rDateTimeFunctions.AS_DATE(to);
        if (!endDate) return [startDate];
        
        const result = [];
        const current = new Date(startDate);
        const increment = by * 24 * 60 * 60 * 1000; // Convert days to milliseconds
        
        while ((by > 0 && current <= endDate) || (by < 0 && current >= endDate)) {
          result.push(new Date(current));
          current.setTime(current.getTime() + increment);
        }
        return result;
      }
      
      return [startDate];
    } catch (e) {
      return [];
    }
  },

  // Timezone Functions
  'WITH_TZ': (time, tzone) => {
    try {
      // Simplified timezone handling
      const posixct = rDateTimeFunctions.AS_POSIXCT(time, tzone);
      return posixct;
    } catch (e) {
      return null;
    }
  },

  'FORCE_TZ': (time, tzone) => {
    try {
      // Force interpretation in specific timezone
      return rDateTimeFunctions.WITH_TZ(time, tzone);
    } catch (e) {
      return null;
    }
  },

  // Date Validation and Testing
  'IS_DATE': (x) => {
    try {
      if (Array.isArray(x)) {
        return x.map(val => {
          const date = rDateTimeFunctions.AS_DATE(val);
          return date !== null && !isNaN(date.getTime());
        });
      }
      const date = rDateTimeFunctions.AS_DATE(x);
      return date !== null && !isNaN(date.getTime());
    } catch (e) {
      return false;
    }
  },

  'IS_WEEKEND': (x) => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        if (!d) return false;
        const day = d.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  'IS_LEAP_YEAR': (x) => {
    try {
      const years = Array.isArray(x) ? x.map(val => rDateTimeFunctions.YEAR(val)) : [rDateTimeFunctions.YEAR(x)];
      const result = years.map(year => {
        if (isNaN(year)) return false;
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  // Date Rounding/Truncation
  'TRUNC_DATE': (x, units = 'days') => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        if (!d) return null;
        
        const truncated = new Date(d);
        switch (units.toLowerCase()) {
          case 'year':
          case 'years':
            truncated.setMonth(0, 1);
            truncated.setHours(0, 0, 0, 0);
            break;
          case 'month':
          case 'months':
            truncated.setDate(1);
            truncated.setHours(0, 0, 0, 0);
            break;
          case 'day':
          case 'days':
            truncated.setHours(0, 0, 0, 0);
            break;
          case 'hour':
          case 'hours':
            truncated.setMinutes(0, 0, 0);
            break;
          case 'minute':
          case 'minutes':
            truncated.setSeconds(0, 0);
            break;
          default:
            truncated.setHours(0, 0, 0, 0);
        }
        return truncated;
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : null;
    }
  },

  'ROUND_DATE': (x, units = 'day') => {
    try {
      // Simplified rounding - similar to truncate for now
      return rDateTimeFunctions.TRUNC_DATE(x, units);
    } catch (e) {
      return Array.isArray(x) ? [] : null;
    }
  },

  // Time Series Helpers
  'JULIAN': (x, origin = null) => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const originDate = origin ? rDateTimeFunctions.AS_DATE(origin) : new Date('1970-01-01');
      
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        if (!d || !originDate) return NaN;
        return Math.floor((d.getTime() - originDate.getTime()) / (24 * 60 * 60 * 1000));
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : NaN;
    }
  },

  'DAYS_IN_MONTH': (x) => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        if (!d) return NaN;
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : NaN;
    }
  },

  // Business/Calendar Functions
  'ADD_BUSINESS_DAYS': (date, days) => {
    try {
      const d = rDateTimeFunctions.AS_DATE(date);
      if (!d) return null;
      
      const result = new Date(d);
      let addedDays = 0;
      const direction = days >= 0 ? 1 : -1;
      const targetDays = Math.abs(days);
      
      while (addedDays < targetDays) {
        result.setDate(result.getDate() + direction);
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
          addedDays++;
        }
      }
      
      return result;
    } catch (e) {
      return null;
    }
  },

  'IS_BUSINESS_DAY': (x) => {
    try {
      const dates = Array.isArray(x) ? x : [x];
      const result = dates.map(date => {
        const d = rDateTimeFunctions.AS_DATE(date);
        if (!d) return false;
        const dayOfWeek = d.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday-Friday
      });
      return Array.isArray(x) ? result : result[0];
    } catch (e) {
      return Array.isArray(x) ? [] : false;
    }
  },

  // Utility function for format parsing (simplified)
  parseWithFormat: (dateStr, format) => {
    try {
      // Very simplified format parsing - handle common cases
      if (format === '%Y-%m-%d') {
        const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        }
      }
      if (format === '%m/%d/%Y') {
        const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (match) {
          return new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
        }
      }
      // Fallback
      return new Date(dateStr);
    } catch (e) {
      return null;
    }
  }
};

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { rDateTimeFunctions };
} else if (typeof window !== 'undefined') {
  window.rDateTimeFunctions = rDateTimeFunctions;
}