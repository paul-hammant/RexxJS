/**
 * Date Time Functions Tests
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { dateTimeFunctions } = require('../src/date-time-functions');

describe('Date Time Functions', () => {

  describe('DATE', () => {
    test('should return current date in default format', () => {
      const result = dateTimeFunctions.DATE();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
    });

    test('should return date in custom format', () => {
      const result = dateTimeFunctions.DATE('UTC', 'MM/DD/YYYY');
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/); // MM/DD/YYYY format
    });
  });

  describe('TIME', () => {
    test('should return current time in default format', () => {
      const result = dateTimeFunctions.TIME();
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/); // HH:MM:SS format
    });
  });

  describe('NOW', () => {
    test('should return current datetime in ISO format', () => {
      const result = dateTimeFunctions.NOW();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO format
    });

    test('should return current datetime in custom format', () => {
      const result = dateTimeFunctions.NOW('UTC', 'YYYY-MM-DD HH:MM:SS');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('NOW_TIMESTAMP', () => {
    test('should return current timestamp', () => {
      const result = dateTimeFunctions.NOW_TIMESTAMP();
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(1600000000000); // After year 2020
      expect(result).toBeLessThan(Date.now() + 1000); // Within reasonable range
    });
  });

  describe('DATE_ADD', () => {
    test('should add days to date', () => {
      const result = dateTimeFunctions.DATE_ADD('2023-01-01', 10);
      expect(result).toMatch(/2023-01-11/);
    });

    test('should add months and years', () => {
      const result = dateTimeFunctions.DATE_ADD('2023-01-01', 0, 1, 1); // +1 month, +1 year
      expect(result).toMatch(/2024-02-01/);
    });

    test('should handle complex date additions', () => {
      const result = dateTimeFunctions.DATE_ADD('2023-01-01', 5, 2, 1, 12, 30, 45);
      expect(result).toContain('2024-03-06'); // 1 year, 2 months, 5 days later
    });
  });

  describe('DATE_SUB', () => {
    test('should subtract days from date', () => {
      const result = dateTimeFunctions.DATE_SUB('2023-01-15', 10);
      expect(result).toMatch(/2023-01-05/);
    });

    test('should subtract months and years', () => {
      const result = dateTimeFunctions.DATE_SUB('2023-03-01', 0, 1, 1); // -1 month, -1 year
      expect(result).toMatch(/2022-02-01/);
    });
  });

  describe('DATE_DIFF', () => {
    test('should calculate difference in days', () => {
      const result = dateTimeFunctions.DATE_DIFF('2023-01-01', '2023-01-11');
      expect(result).toBe(10);
    });

    test('should calculate difference in different units', () => {
      const hoursDiff = dateTimeFunctions.DATE_DIFF('2023-01-01T00:00:00', '2023-01-01T12:00:00', 'hours');
      expect(hoursDiff).toBe(12);

      const minutesDiff = dateTimeFunctions.DATE_DIFF('2023-01-01T00:00:00', '2023-01-01T00:30:00', 'minutes');
      expect(minutesDiff).toBe(30);
    });

    test('should handle negative differences', () => {
      const result = dateTimeFunctions.DATE_DIFF('2023-01-15', '2023-01-01');
      expect(result).toBe(-14);
    });
  });

  describe('DATE_PARSE', () => {
    test('should parse ISO date string', () => {
      const result = dateTimeFunctions.DATE_PARSE('2023-01-01T12:00:00Z');
      expect(result).toBeInstanceOf(Date);
    });

    test('should parse various date formats', () => {
      const formats = [
        '2023-01-01',
        '01/01/2023', 
        'January 1, 2023'
      ];

      formats.forEach(dateStr => {
        const result = dateTimeFunctions.DATE_PARSE(dateStr);
        expect(result).toBeInstanceOf(Date);
      });
    });
  });

  describe('DATE_VALID', () => {
    test('should validate valid dates', () => {
      const validDates = [
        '2023-01-01',
        '2023-12-31T23:59:59Z',
        'January 1, 2023',
        '01/01/2023'
      ];

      validDates.forEach(dateStr => {
        const result = dateTimeFunctions.DATE_VALID(dateStr);
        expect(result).toBe(true);
      });
    });

    test('should reject invalid dates', () => {
      const invalidDates = [
        '2023-13-01', // Invalid month
        '2023-01-32', // Invalid day
        'not a date',
        '',
        null
      ];

      invalidDates.forEach(dateStr => {
        const result = dateTimeFunctions.DATE_VALID(dateStr);
        expect(result).toBe(false);
      });
    });
  });

  describe('DATE_FORMAT', () => {
    test('should format date in ISO format', () => {
      const result = dateTimeFunctions.DATE_FORMAT('2023-01-15T10:30:45Z', 'ISO');
      expect(result).toMatch(/2023-01-15/);
    });

    test('should format date in custom formats', () => {
      const testDate = '2023-01-15T10:30:45Z';
      
      const usFormat = dateTimeFunctions.DATE_FORMAT(testDate, 'US');
      expect(usFormat).toMatch(/1\/15\/2023/);
      
      const euroFormat = dateTimeFunctions.DATE_FORMAT(testDate, 'EU');
      expect(euroFormat).toMatch(/15\/0?1\/2023/);
    });
  });

  describe('TIME_FORMAT', () => {
    test('should format time in 24-hour format', () => {
      const result = dateTimeFunctions.TIME_FORMAT('2023-01-15T15:30:45Z', '24');
      expect(result).toMatch(/15:30:45/);
    });

    test('should format time in 12-hour format', () => {
      const result = dateTimeFunctions.TIME_FORMAT('2023-01-15T15:30:45Z', '12');
      expect(result).toMatch(/3:30:45 PM/);
    });
  });

  describe('DATE_SUBTRACT', () => {
    test('should subtract days from date', () => {
      const result = dateTimeFunctions.DATE_SUBTRACT('2023-01-15', 5, 'days');
      expect(result).toMatch(/2023-01-10/);
    });

    test('should subtract months from date', () => {
      const result = dateTimeFunctions.DATE_SUBTRACT('2023-03-15', 2, 'months');
      expect(result).toMatch(/2023-01-15/);
    });
  });

  describe('DATE_PARSE_DETAILS', () => {
    test('should parse date details', () => {
      const result = dateTimeFunctions.DATE_PARSE_DETAILS('2023-01-15T10:30:45Z');
      expect(result).toHaveProperty('year', 2023);
      expect(result).toHaveProperty('month', 1);
      expect(result).toHaveProperty('day', 15);
      expect(result).toHaveProperty('hour', 10);
      expect(result).toHaveProperty('minute', 30);
      expect(result).toHaveProperty('second', 45);
    });
  });

  describe('DATE_CREATE', () => {
    test('should create date from components', () => {
      const result = dateTimeFunctions.DATE_CREATE(2023, 1, 15, 10, 30, 45);
      expect(result).toMatch(/2023-01-15T10:30:45/);
    });

    test('should create date with default time', () => {
      const result = dateTimeFunctions.DATE_CREATE(2023, 6, 20);
      expect(result).toMatch(/2023-06-[12]\dT/); // Handle timezone differences
    });
  });

  describe('DATE_IS_WEEKEND', () => {
    test('should detect weekend days', () => {
      // Saturday
      const saturday = dateTimeFunctions.DATE_IS_WEEKEND('2023-01-14');
      expect(saturday).toBe(true);
      
      // Sunday  
      const sunday = dateTimeFunctions.DATE_IS_WEEKEND('2023-01-15');
      expect(sunday).toBe(true);
      
      // Monday
      const monday = dateTimeFunctions.DATE_IS_WEEKEND('2023-01-16');
      expect(monday).toBe(false);
    });
  });

  describe('DATE_IS_BUSINESS_DAY', () => {
    test('should detect business days', () => {
      // Monday (business day)
      const monday = dateTimeFunctions.DATE_IS_BUSINESS_DAY('2023-01-16');
      expect(monday).toBe(true);
      
      // Saturday (not business day)
      const saturday = dateTimeFunctions.DATE_IS_BUSINESS_DAY('2023-01-14');
      expect(saturday).toBe(false);
    });
  });

  describe('DATE_NEXT_BUSINESS_DAY', () => {
    test('should find next business day', () => {
      // Friday -> Monday
      const result = dateTimeFunctions.DATE_NEXT_BUSINESS_DAY('2023-01-13');
      expect(result).toMatch(/2023-01-16/);
    });
  });

  describe('DATE_AGE', () => {
    test('should calculate age', () => {
      const result = dateTimeFunctions.DATE_AGE('1990-01-01', '2023-01-01');
      expect(result).toBe(33);
    });

    test('should use current date as reference when not provided', () => {
      const result = dateTimeFunctions.DATE_AGE('2000-01-01');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(20);
    });
  });

  describe('DATE_QUARTER', () => {
    test('should return correct quarter', () => {
      expect(dateTimeFunctions.DATE_QUARTER('2023-01-15')).toBe(1);
      expect(dateTimeFunctions.DATE_QUARTER('2023-04-15')).toBe(2);
      expect(dateTimeFunctions.DATE_QUARTER('2023-07-15')).toBe(3);
      expect(dateTimeFunctions.DATE_QUARTER('2023-10-15')).toBe(4);
    });
  });

  describe('DATE_WEEK_NUMBER', () => {
    test('should return week number', () => {
      const result = dateTimeFunctions.DATE_WEEK_NUMBER('2023-01-15');
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(53);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid dates by throwing errors', () => {
      expect(() => dateTimeFunctions.DATE_ADD('invalid-date', 1)).toThrow();
      
      // DATE_DIFF returns 0 for invalid dates rather than throwing
      const result = dateTimeFunctions.DATE_DIFF('invalid', 'dates');
      expect(result).toBe(0);
    });

    test('should handle edge cases', () => {
      // Leap year
      const leapYear = dateTimeFunctions.DATE_ADD('2024-02-28', 1);
      expect(leapYear).toMatch(/2024-02-29/);
      
      // Month overflow (JavaScript Date handles this by going to next month)
      const monthOverflow = dateTimeFunctions.DATE_ADD('2023-01-31', 0, 1);
      expect(monthOverflow).toMatch(/2023-0[23]/); // Could be Feb or Mar depending on implementation
    });
  });

  describe('Integration Tests', () => {
    test('should handle full date workflow', () => {
      // Get current timestamp
      const timestamp = dateTimeFunctions.NOW_TIMESTAMP();
      expect(typeof timestamp).toBe('number');

      // Add time to current date
      const currentDate = dateTimeFunctions.DATE();
      const futureDate = dateTimeFunctions.DATE_ADD(currentDate, 30); // 30 days later
      
      // Calculate difference
      const diff = dateTimeFunctions.DATE_DIFF(currentDate, futureDate);
      expect(diff).toBe(30);

      // Validate the future date
      const isValid = dateTimeFunctions.DATE_VALID(futureDate);
      expect(isValid).toBe(true);
    });

    test('should handle timezone consistency', () => {
      const utcDate = dateTimeFunctions.DATE('UTC');
      const utcTime = dateTimeFunctions.TIME('UTC');
      
      expect(utcDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(utcTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      
      // Both should be valid when parsed
      expect(dateTimeFunctions.DATE_VALID(utcDate)).toBe(true);
    });

    test('should handle complex date operations workflow', () => {
      const testDate = '2023-01-15';
      
      // Test business day operations
      const isBusinessDay = dateTimeFunctions.DATE_IS_BUSINESS_DAY(testDate);
      const nextBusinessDay = dateTimeFunctions.DATE_NEXT_BUSINESS_DAY(testDate);
      
      expect(typeof isBusinessDay).toBe('boolean');
      expect(nextBusinessDay).toBeDefined();
      
      // Test age and quarter calculations
      const age = dateTimeFunctions.DATE_AGE('1990-01-01', testDate);
      const quarter = dateTimeFunctions.DATE_QUARTER(testDate);
      
      expect(age).toBe(33);
      expect(quarter).toBe(1);
      
      // Test formatting operations
      const formatted = dateTimeFunctions.DATE_FORMAT(testDate, 'US');
      const details = dateTimeFunctions.DATE_PARSE_DETAILS(testDate);
      
      expect(formatted).toMatch(/1\/15\/2023/);
      expect(details.year).toBe(2023);
      expect(details.month).toBe(1);
      expect(details.day).toBe(15);
    });
  });
});