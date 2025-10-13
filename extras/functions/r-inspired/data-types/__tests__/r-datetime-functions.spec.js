/* Copyright (c) 2025 Paul Hammant ... Licensed under the MIT License */

const { rDateTimeFunctions } = require('../r-datetime-functions.js');

describe('R Date/Time & Temporal Data Functions', () => {
  // Current Date/Time Functions
  describe('SYS_DATE', () => {
    test('should return current date information', () => {
      const result = rDateTimeFunctions.SYS_DATE();
      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('day');
      expect(result).toHaveProperty('date');
      expect(typeof result.year).toBe('number');
      expect(result.year).toBeGreaterThan(2020);
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
    });
  });

  describe('SYS_TIME', () => {
    test('should return current time information', () => {
      const result = rDateTimeFunctions.SYS_TIME();
      expect(result).toHaveProperty('hour');
      expect(result).toHaveProperty('minute');
      expect(result).toHaveProperty('second');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('iso');
      expect(result.hour).toBeGreaterThanOrEqual(0);
      expect(result.hour).toBeLessThan(24);
      expect(typeof result.timestamp).toBe('number');
    });
  });

  describe('NOW', () => {
    test('should return current Date object', () => {
      const result = rDateTimeFunctions.NOW();
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeCloseTo(Date.now(), -3); // Within 1 second
    });
  });

  // Date Creation and Parsing
  describe('AS_DATE', () => {
    test('should parse ISO date strings', () => {
      const result = rDateTimeFunctions.AS_DATE('2023-12-25');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(11); // December (0-indexed)
      expect(result.getDate()).toBe(25);
    });

    test('should handle Date objects', () => {
      const inputDate = new Date('2023-01-01');
      const result = rDateTimeFunctions.AS_DATE(inputDate);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(inputDate.getTime());
    });

    test('should handle numeric values as days since epoch', () => {
      const result = rDateTimeFunctions.AS_DATE(0); // Unix epoch
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(1970);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
    });

    test('should handle arrays', () => {
      const result = rDateTimeFunctions.AS_DATE(['2023-01-01', '2023-12-31']);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Date);
      expect(result[1]).toBeInstanceOf(Date);
    });

    test('should handle invalid dates', () => {
      expect(rDateTimeFunctions.AS_DATE('invalid')).toBe(null);
      expect(rDateTimeFunctions.AS_DATE(null)).toBe(null);
    });

    test('should handle origin parameter', () => {
      const result = rDateTimeFunctions.AS_DATE(1, null, '2023-01-01');
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(2); // 1 day after 2023-01-01
    });
  });

  describe('AS_POSIXCT', () => {
    test('should create POSIXct object', () => {
      const result = rDateTimeFunctions.AS_POSIXCT('2023-06-15');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('timezone');
      expect(result).toHaveProperty('iso');
      expect(result.timezone).toBe('UTC');
      expect(typeof result.timestamp).toBe('number');
    });

    test('should handle timezone parameter', () => {
      const result = rDateTimeFunctions.AS_POSIXCT('2023-06-15', 'EST');
      expect(result.timezone).toBe('EST');
    });

    test('should handle invalid input', () => {
      expect(rDateTimeFunctions.AS_POSIXCT(null)).toBe(null);
    });
  });

  describe('AS_POSIXLT', () => {
    test('should create POSIXlt object', () => {
      const result = rDateTimeFunctions.AS_POSIXLT('2023-06-15');
      expect(result).toHaveProperty('sec');
      expect(result).toHaveProperty('min');
      expect(result).toHaveProperty('hour');
      expect(result).toHaveProperty('mday');
      expect(result).toHaveProperty('mon');
      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('wday');
      expect(result).toHaveProperty('yday');
      expect(result.year).toBe(123); // 2023 - 1900
      expect(result.mon).toBe(5); // June (0-indexed)
      expect(result.mday).toBe(15);
    });
  });

  // Date Formatting
  describe('FORMAT_DATE', () => {
    test('should format dates with default format', () => {
      const result = rDateTimeFunctions.FORMAT_DATE(new Date('2023-12-25'));
      expect(result).toEqual(['2023-12-25']);
    });

    test('should handle custom formats', () => {
      const date = new Date('2023-12-25 14:30:45');
      expect(rDateTimeFunctions.FORMAT_DATE(date, '%Y-%m-%d')).toEqual(['2023-12-25']);
      expect(rDateTimeFunctions.FORMAT_DATE(date, '%d/%m/%Y')).toEqual(['25/12/2023']);
      expect(rDateTimeFunctions.FORMAT_DATE(date, '%Y')).toEqual(['2023']);
      expect(rDateTimeFunctions.FORMAT_DATE(date, '%m')).toEqual(['12']);
    });

    test('should handle day/month names', () => {
      const date = new Date('2023-12-25'); // Monday
      const result = rDateTimeFunctions.FORMAT_DATE(date, '%A %B');
      expect(result[0]).toMatch(/Monday December/);
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-01-01'), new Date('2023-12-31')];
      const result = rDateTimeFunctions.FORMAT_DATE(dates);
      expect(result).toEqual(['2023-01-01', '2023-12-31']);
    });

    test('should handle invalid dates', () => {
      const result = rDateTimeFunctions.FORMAT_DATE(null);
      expect(result).toEqual(['NA']);
    });
  });

  describe('STRFTIME and STRPTIME', () => {
    test('STRFTIME should be alias for FORMAT_DATE', () => {
      const date = new Date('2023-06-15');
      const format = '%Y-%m-%d';
      expect(rDateTimeFunctions.STRFTIME(date, format))
        .toEqual(rDateTimeFunctions.FORMAT_DATE(date, format));
    });

    test('STRPTIME should be alias for AS_DATE', () => {
      const dateStr = '2023-06-15';
      const result = rDateTimeFunctions.STRPTIME(dateStr);
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2023);
    });
  });

  // Date Extraction Functions
  describe('YEAR', () => {
    test('should extract year from date', () => {
      const result = rDateTimeFunctions.YEAR(new Date('2023-06-15'));
      expect(result).toBe(2023);
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-01-01'), new Date('2024-12-31')];
      const result = rDateTimeFunctions.YEAR(dates);
      expect(result).toEqual([2023, 2024]);
    });

    test('should handle invalid dates', () => {
      expect(rDateTimeFunctions.YEAR(null)).toBeNaN();
    });
  });

  describe('MONTH', () => {
    test('should extract month from date (1-indexed)', () => {
      expect(rDateTimeFunctions.MONTH(new Date('2023-01-15'))).toBe(1);
      expect(rDateTimeFunctions.MONTH(new Date('2023-12-15'))).toBe(12);
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-01-01'), new Date('2023-06-15')];
      const result = rDateTimeFunctions.MONTH(dates);
      expect(result).toEqual([1, 6]);
    });
  });

  describe('DAY', () => {
    test('should extract day from date', () => {
      expect(rDateTimeFunctions.DAY(new Date('2023-06-15'))).toBe(15);
      expect(rDateTimeFunctions.DAY(new Date('2023-01-01'))).toBe(1);
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-01-01'), new Date('2023-06-15')];
      const result = rDateTimeFunctions.DAY(dates);
      expect(result).toEqual([1, 15]);
    });
  });

  describe('WEEKDAY', () => {
    test('should extract weekday (1=Sunday)', () => {
      // Known: 2023-01-01 was a Sunday
      expect(rDateTimeFunctions.WEEKDAY(new Date('2023-01-01'))).toBe(1);
      // Known: 2023-01-02 was a Monday  
      expect(rDateTimeFunctions.WEEKDAY(new Date('2023-01-02'))).toBe(2);
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-01-01'), new Date('2023-01-02')];
      const result = rDateTimeFunctions.WEEKDAY(dates);
      expect(result).toEqual([1, 2]);
    });
  });

  describe('WEEKDAYS', () => {
    test('should return weekday names', () => {
      const result = rDateTimeFunctions.WEEKDAYS(new Date('2023-01-01')); // Sunday
      expect(result).toBe('Sunday');
    });

    test('should handle abbreviation', () => {
      const result = rDateTimeFunctions.WEEKDAYS(new Date('2023-01-01'), true);
      expect(result).toBe('Sun');
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-01-01'), new Date('2023-01-02')];
      const result = rDateTimeFunctions.WEEKDAYS(dates);
      expect(result).toEqual(['Sunday', 'Monday']);
    });
  });

  describe('MONTHS', () => {
    test('should return month names', () => {
      expect(rDateTimeFunctions.MONTHS(new Date('2023-01-15'))).toBe('January');
      expect(rDateTimeFunctions.MONTHS(new Date('2023-12-15'))).toBe('December');
    });

    test('should handle abbreviation', () => {
      expect(rDateTimeFunctions.MONTHS(new Date('2023-01-15'), true)).toBe('Jan');
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-01-01'), new Date('2023-06-15')];
      const result = rDateTimeFunctions.MONTHS(dates);
      expect(result).toEqual(['January', 'June']);
    });
  });

  describe('QUARTERS', () => {
    test('should return quarters', () => {
      expect(rDateTimeFunctions.QUARTERS(new Date('2023-01-15'))).toBe('Q1');
      expect(rDateTimeFunctions.QUARTERS(new Date('2023-04-15'))).toBe('Q2');
      expect(rDateTimeFunctions.QUARTERS(new Date('2023-07-15'))).toBe('Q3');
      expect(rDateTimeFunctions.QUARTERS(new Date('2023-10-15'))).toBe('Q4');
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-02-01'), new Date('2023-08-15')];
      const result = rDateTimeFunctions.QUARTERS(dates);
      expect(result).toEqual(['Q1', 'Q3']);
    });
  });

  // Date Arithmetic
  describe('DIFFTIME', () => {
    test('should calculate difference in days (default)', () => {
      const date1 = new Date('2023-01-05');
      const date2 = new Date('2023-01-01');
      const result = rDateTimeFunctions.DIFFTIME(date1, date2);
      expect(result).toBe(4);
    });

    test('should handle different units', () => {
      const date1 = new Date('2023-01-01 12:00:00');
      const date2 = new Date('2023-01-01 00:00:00');
      
      expect(rDateTimeFunctions.DIFFTIME(date1, date2, 'hours')).toBe(12);
      expect(rDateTimeFunctions.DIFFTIME(date1, date2, 'minutes')).toBe(720);
      expect(rDateTimeFunctions.DIFFTIME(date1, date2, 'seconds')).toBe(43200);
    });

    test('should handle negative differences', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-05');
      const result = rDateTimeFunctions.DIFFTIME(date1, date2);
      expect(result).toBe(-4);
    });

    test('should handle invalid dates', () => {
      expect(rDateTimeFunctions.DIFFTIME(null, new Date())).toBeNaN();
    });
  });

  describe('DATE_DIFF', () => {
    test('should be equivalent to DIFFTIME', () => {
      const date1 = new Date('2023-01-05');
      const date2 = new Date('2023-01-01');
      const difftime = rDateTimeFunctions.DIFFTIME(date1, date2);
      const datediff = rDateTimeFunctions.DATE_DIFF(date1, date2);
      expect(datediff).toBe(difftime);
    });
  });

  // Date Sequences
  describe('SEQ_DATE', () => {
    test('should create date sequence with end date', () => {
      const from = new Date('2023-01-01');
      const to = new Date('2023-01-03');
      const result = rDateTimeFunctions.SEQ_DATE(from, to);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(from);
      expect(result[2]).toEqual(to);
    });

    test('should handle custom step size', () => {
      const from = new Date('2023-01-01');
      const to = new Date('2023-01-07');
      const result = rDateTimeFunctions.SEQ_DATE(from, to, 2);
      
      expect(result).toHaveLength(4);
      expect(rDateTimeFunctions.DAY(result[1])).toBe(3);
      expect(rDateTimeFunctions.DAY(result[2])).toBe(5);
    });

    test('should handle length_out parameter', () => {
      const from = new Date('2023-01-01');
      const result = rDateTimeFunctions.SEQ_DATE(from, null, 1, 5);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual(from);
      expect(rDateTimeFunctions.DAY(result[4])).toBe(5);
    });

    test('should handle negative step', () => {
      const from = new Date('2023-01-05');
      const to = new Date('2023-01-01');
      const result = rDateTimeFunctions.SEQ_DATE(from, to, -1);
      
      expect(result).toHaveLength(5);
      expect(result[0]).toEqual(from);
      expect(result[4]).toEqual(to);
    });

    test('should handle single date', () => {
      const from = new Date('2023-01-01');
      const result = rDateTimeFunctions.SEQ_DATE(from);
      expect(result).toEqual([from]);
    });
  });

  // Date Validation and Testing
  describe('IS_DATE', () => {
    test('should identify valid dates', () => {
      expect(rDateTimeFunctions.IS_DATE(new Date())).toBe(true);
      expect(rDateTimeFunctions.IS_DATE('2023-01-01')).toBe(true);
    });

    test('should identify invalid dates', () => {
      expect(rDateTimeFunctions.IS_DATE('invalid')).toBe(false);
      expect(rDateTimeFunctions.IS_DATE(null)).toBe(false);
      expect(rDateTimeFunctions.IS_DATE(123)).toBe(true); // Numbers are valid (days since epoch)
    });

    test('should handle arrays', () => {
      const result = rDateTimeFunctions.IS_DATE(['2023-01-01', 'invalid', null]);
      expect(result).toEqual([true, false, false]);
    });
  });

  describe('IS_WEEKEND', () => {
    test('should identify weekends', () => {
      // Known dates: 2023-01-01 was Sunday, 2023-01-07 was Saturday
      expect(rDateTimeFunctions.IS_WEEKEND(new Date('2023-01-01'))).toBe(true);
      expect(rDateTimeFunctions.IS_WEEKEND(new Date('2023-01-07'))).toBe(true);
    });

    test('should identify weekdays', () => {
      // Known: 2023-01-02 was Monday
      expect(rDateTimeFunctions.IS_WEEKEND(new Date('2023-01-02'))).toBe(false);
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-01-01'), new Date('2023-01-02')]; // Sunday, Monday
      const result = rDateTimeFunctions.IS_WEEKEND(dates);
      expect(result).toEqual([true, false]);
    });
  });

  describe('IS_LEAP_YEAR', () => {
    test('should identify leap years', () => {
      expect(rDateTimeFunctions.IS_LEAP_YEAR(new Date('2020-01-01'))).toBe(true);
      expect(rDateTimeFunctions.IS_LEAP_YEAR(new Date('2000-01-01'))).toBe(true);
    });

    test('should identify non-leap years', () => {
      expect(rDateTimeFunctions.IS_LEAP_YEAR(new Date('2021-01-01'))).toBe(false);
      expect(rDateTimeFunctions.IS_LEAP_YEAR(new Date('1900-01-01'))).toBe(false);
    });

    test('should handle arrays', () => {
      const dates = [new Date('2020-01-01'), new Date('2021-01-01')];
      const result = rDateTimeFunctions.IS_LEAP_YEAR(dates);
      expect(result).toEqual([true, false]);
    });

    test('should handle century years', () => {
      expect(rDateTimeFunctions.IS_LEAP_YEAR(new Date('2000-01-01'))).toBe(true); // Divisible by 400
      expect(rDateTimeFunctions.IS_LEAP_YEAR(new Date('1900-01-01'))).toBe(false); // Divisible by 100 but not 400
    });
  });

  // Date Rounding/Truncation
  describe('TRUNC_DATE', () => {
    test('should truncate to day (default)', () => {
      const date = new Date('2023-06-15 14:30:45');
      const result = rDateTimeFunctions.TRUNC_DATE(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getDate()).toBe(15);
    });

    test('should truncate to month', () => {
      const date = new Date('2023-06-15 14:30:45');
      const result = rDateTimeFunctions.TRUNC_DATE(date, 'month');
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
    });

    test('should truncate to year', () => {
      const date = new Date('2023-06-15 14:30:45');
      const result = rDateTimeFunctions.TRUNC_DATE(date, 'year');
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-06-15 14:30:45'), new Date('2023-12-25 09:15:30')];
      const result = rDateTimeFunctions.TRUNC_DATE(dates, 'day');
      expect(result).toHaveLength(2);
      expect(result[0].getHours()).toBe(0);
      expect(result[1].getHours()).toBe(0);
    });
  });

  describe('ROUND_DATE', () => {
    test('should round dates (simplified implementation)', () => {
      const date = new Date('2023-06-15 14:30:45');
      const result = rDateTimeFunctions.ROUND_DATE(date, 'day');
      expect(result).toBeInstanceOf(Date);
      expect(result.getDate()).toBe(15);
    });
  });

  // Time Series Helpers
  describe('JULIAN', () => {
    test('should calculate Julian day numbers', () => {
      const result = rDateTimeFunctions.JULIAN(new Date('1970-01-02')); // 1 day after Unix epoch
      expect(result).toBe(1);
    });

    test('should handle custom origin', () => {
      const result = rDateTimeFunctions.JULIAN(new Date('2023-01-02'), new Date('2023-01-01'));
      expect(result).toBe(1);
    });

    test('should handle arrays', () => {
      const dates = [new Date('1970-01-01'), new Date('1970-01-02')];
      const result = rDateTimeFunctions.JULIAN(dates);
      expect(result).toEqual([0, 1]);
    });
  });

  describe('DAYS_IN_MONTH', () => {
    test('should return days in month', () => {
      expect(rDateTimeFunctions.DAYS_IN_MONTH(new Date('2023-01-15'))).toBe(31);
      expect(rDateTimeFunctions.DAYS_IN_MONTH(new Date('2023-02-15'))).toBe(28);
      expect(rDateTimeFunctions.DAYS_IN_MONTH(new Date('2020-02-15'))).toBe(29); // Leap year
      expect(rDateTimeFunctions.DAYS_IN_MONTH(new Date('2023-04-15'))).toBe(30);
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-01-15'), new Date('2023-02-15')];
      const result = rDateTimeFunctions.DAYS_IN_MONTH(dates);
      expect(result).toEqual([31, 28]);
    });
  });

  // Business/Calendar Functions
  describe('ADD_BUSINESS_DAYS', () => {
    test('should add business days (skip weekends)', () => {
      // Start on Friday 2023-01-06
      const friday = new Date('2023-01-06');
      const result = rDateTimeFunctions.ADD_BUSINESS_DAYS(friday, 1);
      
      // Should skip weekend and land on Monday 2023-01-09
      expect(result.getDate()).toBe(9);
      expect(result.getDay()).toBe(1); // Monday
    });

    test('should subtract business days', () => {
      // Start on Monday 2023-01-09  
      const monday = new Date('2023-01-09');
      const result = rDateTimeFunctions.ADD_BUSINESS_DAYS(monday, -1);
      
      // Should skip weekend and land on Friday 2023-01-06
      expect(result.getDate()).toBe(6);
      expect(result.getDay()).toBe(5); // Friday
    });

    test('should handle multiple days', () => {
      const friday = new Date('2023-01-06');
      const result = rDateTimeFunctions.ADD_BUSINESS_DAYS(friday, 5);
      
      // 5 business days from Friday should be next Friday
      expect(result.getDay()).toBe(5); // Friday
      expect(result.getDate()).toBe(13);
    });
  });

  describe('IS_BUSINESS_DAY', () => {
    test('should identify business days', () => {
      // Monday-Friday are business days
      expect(rDateTimeFunctions.IS_BUSINESS_DAY(new Date('2023-01-02'))).toBe(true); // Monday
      expect(rDateTimeFunctions.IS_BUSINESS_DAY(new Date('2023-01-06'))).toBe(true); // Friday
    });

    test('should identify non-business days', () => {
      // Saturday-Sunday are not business days
      expect(rDateTimeFunctions.IS_BUSINESS_DAY(new Date('2023-01-01'))).toBe(false); // Sunday
      expect(rDateTimeFunctions.IS_BUSINESS_DAY(new Date('2023-01-07'))).toBe(false); // Saturday
    });

    test('should handle arrays', () => {
      const dates = [new Date('2023-01-01'), new Date('2023-01-02')]; // Sunday, Monday
      const result = rDateTimeFunctions.IS_BUSINESS_DAY(dates);
      expect(result).toEqual([false, true]);
    });
  });

  // Timezone Functions
  describe('WITH_TZ and FORCE_TZ', () => {
    test('should handle timezone specification', () => {
      const result = rDateTimeFunctions.WITH_TZ('2023-01-01', 'EST');
      expect(result).toHaveProperty('timezone');
      expect(result.timezone).toBe('EST');
    });

    test('FORCE_TZ should work like WITH_TZ', () => {
      const withTz = rDateTimeFunctions.WITH_TZ('2023-01-01', 'PST');
      const forceTz = rDateTimeFunctions.FORCE_TZ('2023-01-01', 'PST');
      expect(withTz.timezone).toBe(forceTz.timezone);
    });
  });

  // R Compatibility Tests
  describe('R Compatibility', () => {
    test('date extraction should match R behavior', () => {
      const date = new Date('2023-06-15');
      expect(rDateTimeFunctions.YEAR(date)).toBe(2023);
      expect(rDateTimeFunctions.MONTH(date)).toBe(6); // R uses 1-based months
      expect(rDateTimeFunctions.DAY(date)).toBe(15);
    });

    test('weekday should use R convention (1=Sunday)', () => {
      const sunday = new Date('2023-01-01');
      expect(rDateTimeFunctions.WEEKDAY(sunday)).toBe(1);
    });

    test('date arithmetic should match R difftime', () => {
      const date1 = new Date('2023-01-05');
      const date2 = new Date('2023-01-01');
      expect(rDateTimeFunctions.DIFFTIME(date1, date2)).toBe(4);
    });

    test('date formatting should support R strftime patterns', () => {
      const date = new Date('2023-12-25');
      expect(rDateTimeFunctions.FORMAT_DATE(date, '%Y-%m-%d')).toEqual(['2023-12-25']);
      expect(rDateTimeFunctions.FORMAT_DATE(date, '%d/%m/%Y')).toEqual(['25/12/2023']);
    });

    test('POSIXlt should match R structure', () => {
      const result = rDateTimeFunctions.AS_POSIXLT('2023-06-15');
      expect(result.year).toBe(123); // Years since 1900
      expect(result.mon).toBe(5); // 0-based months
      expect(result.mday).toBe(15);
    });
  });

  // Edge Cases and Error Handling
  describe('Error Handling', () => {
    test('should handle null/undefined inputs', () => {
      expect(rDateTimeFunctions.AS_DATE(null)).toBe(null);
      expect(rDateTimeFunctions.YEAR(null)).toBeNaN();
      expect(rDateTimeFunctions.IS_DATE(null)).toBe(false);
    });

    test('should handle empty arrays', () => {
      expect(rDateTimeFunctions.FORMAT_DATE([])).toEqual([]);
      expect(rDateTimeFunctions.YEAR([])).toEqual([]);
    });

    test('should handle invalid date strings', () => {
      expect(rDateTimeFunctions.AS_DATE('not-a-date')).toBe(null);
      expect(rDateTimeFunctions.IS_DATE('invalid-date')).toBe(false);
    });

    test('should handle mixed valid/invalid inputs in arrays', () => {
      const result = rDateTimeFunctions.YEAR(['2023-01-01', 'invalid', '2023-12-31']);
      expect(result[0]).toBe(2023);
      expect(result[1]).toBeNaN();
      expect(result[2]).toBe(2023);
    });

    test('should handle leap year edge cases', () => {
      expect(rDateTimeFunctions.DAYS_IN_MONTH(new Date('2020-02-15'))).toBe(29);
      expect(rDateTimeFunctions.DAYS_IN_MONTH(new Date('2021-02-15'))).toBe(28);
    });
  });

  // Performance and Complex Cases
  describe('Complex Date Operations', () => {
    test('should handle date sequences across month boundaries', () => {
      const from = new Date('2023-01-30');
      const to = new Date('2023-02-05');
      const result = rDateTimeFunctions.SEQ_DATE(from, to);
      expect(result).toHaveLength(7);
      expect(rDateTimeFunctions.MONTH(result[0])).toBe(1);
      expect(rDateTimeFunctions.MONTH(result[6])).toBe(2);
    });

    test('should handle large date differences', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2020-01-01');
      const diff = rDateTimeFunctions.DIFFTIME(date1, date2);
      expect(diff).toBeCloseTo(1096, 0); // Approximately 3 years in days
    });

    test('should handle business day calculations across weekends', () => {
      const friday = new Date('2023-06-16'); // Friday
      const result = rDateTimeFunctions.ADD_BUSINESS_DAYS(friday, 3);
      expect(result.getDay()).toBe(3); // Wednesday
      expect(result.getDate()).toBe(21);
    });
  });
});