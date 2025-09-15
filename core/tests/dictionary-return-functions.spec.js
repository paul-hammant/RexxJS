/**
 * Dictionary Return Functions Tests
 * Tests for SUMMARY, CORRELATION_MATRIX, WORD_FREQUENCY, SENTIMENT_ANALYSIS, and EXTRACT_KEYWORDS
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { statisticsFunctions } = require('../src/statistics-functions');
const { stringFunctions } = require('../src/string-functions');
const { Interpreter } = require('../src/interpreter');
const { MockKitchenService } = require('./mocks/kitchen-service');

describe('Dictionary Return Functions', () => {
  let interpreter;
  let addressSender;
  let kitchenService;
  
  beforeEach(() => {
    kitchenService = new MockKitchenService();
    addressSender = kitchenService.createRpcClient();
    interpreter = new Interpreter(addressSender);
  });

  describe('SUMMARY Function', () => {
    test('should return comprehensive statistical summary for array', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = statisticsFunctions.SUMMARY(data);
      
      expect(result).toHaveProperty('count', 10);
      expect(result).toHaveProperty('sum', 55);
      expect(result).toHaveProperty('mean', 5.5);
      expect(result).toHaveProperty('median', 5.5);
      expect(result).toHaveProperty('min', 1);
      expect(result).toHaveProperty('max', 10);
      expect(result).toHaveProperty('range', 9);
      expect(result).toHaveProperty('variance');
      expect(result).toHaveProperty('standardDeviation');
      expect(result).toHaveProperty('q1');
      expect(result).toHaveProperty('q3');
      expect(result).toHaveProperty('iqr');
    });

    test('should handle JSON string input', () => {
      const jsonData = JSON.stringify([10, 20, 30]);
      const result = statisticsFunctions.SUMMARY(jsonData);
      
      expect(result.count).toBe(3);
      expect(result.mean).toBe(20);
      expect(result.sum).toBe(60);
      expect(result.min).toBe(10);
      expect(result.max).toBe(30);
    });

    test('should handle single value', () => {
      const result = statisticsFunctions.SUMMARY([42]);
      
      expect(result.count).toBe(1);
      expect(result.mean).toBe(42);
      expect(result.median).toBe(42);
      expect(result.mode).toBe(42);
      expect(result.min).toBe(42);
      expect(result.max).toBe(42);
      expect(result.range).toBe(0);
      expect(result.variance).toBe(0);
    });

    test('should handle empty array', () => {
      const result = statisticsFunctions.SUMMARY([]);
      
      expect(result.count).toBe(0);
      expect(result.sum).toBe(0);
      expect(result.mean).toBe(0);
      expect(result.median).toBe(0);
    });

    test('should filter out non-numeric values', () => {
      const data = [1, 'invalid', 2, null, 3, undefined, 4];
      const result = statisticsFunctions.SUMMARY(data);
      
      expect(result.count).toBe(4); // Only 1, 2, 3, 4
      expect(result.mean).toBe(2.5);
      expect(result.sum).toBe(10);
    });

    test('should calculate mode correctly', () => {
      const data = [1, 2, 2, 3, 3, 3, 4];
      const result = statisticsFunctions.SUMMARY(data);
      
      expect(result.mode).toBe(3); // 3 appears most frequently
      expect(result.count).toBe(7);
    });

    test('should calculate quartiles correctly', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = statisticsFunctions.SUMMARY(data);
      
      expect(result.q1).toBeDefined();
      expect(result.q3).toBeDefined();
      expect(result.iqr).toBe(result.q3 - result.q1);
    });
  });

  describe('CORRELATION_MATRIX Function', () => {
    test('should calculate correlation matrix for two arrays', () => {
      const data = [
        [1, 2, 3, 4, 5],
        [2, 4, 6, 8, 10]
      ];
      const result = statisticsFunctions.CORRELATION_MATRIX(data);
      
      expect(result).toHaveProperty('0_0', 1.0); // Perfect self-correlation
      expect(result).toHaveProperty('1_1', 1.0); // Perfect self-correlation
      expect(result).toHaveProperty('0_1', 1.0); // Perfect positive correlation
      expect(result).toHaveProperty('1_0', 1.0); // Perfect positive correlation
    });

    test('should handle JSON string input', () => {
      const jsonData = JSON.stringify([
        [1, 2, 3],
        [1, 2, 3]
      ]);
      const result = statisticsFunctions.CORRELATION_MATRIX(jsonData);
      
      expect(result).toHaveProperty('0_1', 1.0); // Perfect correlation
      expect(result).toHaveProperty('1_0', 1.0);
    });

    test('should calculate negative correlation', () => {
      const data = [
        [1, 2, 3, 4, 5],
        [5, 4, 3, 2, 1]
      ];
      const result = statisticsFunctions.CORRELATION_MATRIX(data);
      
      expect(result['0_1']).toBe(-1.0); // Perfect negative correlation
      expect(result['1_0']).toBe(-1.0);
    });

    test('should handle no correlation', () => {
      const data = [
        [1, 1, 1, 1, 1], // No variance
        [2, 4, 6, 8, 10]
      ];
      const result = statisticsFunctions.CORRELATION_MATRIX(data);
      
      expect(result['0_1']).toBe(0); // No correlation due to no variance
    });

    test('should return empty object for invalid input', () => {
      expect(statisticsFunctions.CORRELATION_MATRIX([])).toEqual({});
      expect(statisticsFunctions.CORRELATION_MATRIX([[]])).toEqual({});
      expect(statisticsFunctions.CORRELATION_MATRIX([1, 2, 3])).toEqual({});
    });

    test('should handle arrays of different lengths', () => {
      const data = [
        [1, 2, 3, 4, 5, 6],
        [2, 4, 6] // Shorter array
      ];
      const result = statisticsFunctions.CORRELATION_MATRIX(data);
      
      // Should use only the first 3 elements from both
      expect(result).toHaveProperty('0_1');
      expect(result).toHaveProperty('1_0');
    });
  });

  describe('WORD_FREQUENCY Function', () => {
    test('should count word frequencies in text', () => {
      const text = 'the quick brown fox jumps over the lazy dog';
      const result = stringFunctions.WORD_FREQUENCY(text);
      
      expect(result).toHaveProperty('the', 2);
      expect(result).toHaveProperty('quick', 1);
      expect(result).toHaveProperty('brown', 1);
      expect(result).toHaveProperty('fox', 1);
      expect(result).toHaveProperty('jumps', 1);
      expect(result).toHaveProperty('over', 1);
      expect(result).toHaveProperty('lazy', 1);
      expect(result).toHaveProperty('dog', 1);
    });

    test('should be case insensitive', () => {
      const text = 'The THE the';
      const result = stringFunctions.WORD_FREQUENCY(text);
      
      expect(result).toHaveProperty('the', 3);
    });

    test('should handle punctuation and special characters', () => {
      const text = 'Hello, world! How are you? I am fine.';
      const result = stringFunctions.WORD_FREQUENCY(text);
      
      expect(result).toHaveProperty('hello', 1);
      expect(result).toHaveProperty('world', 1);
      expect(result).toHaveProperty('how', 1);
      expect(result).toHaveProperty('are', 1);
      expect(result).toHaveProperty('you', 1);
      expect(result).toHaveProperty('i', 1);
      expect(result).toHaveProperty('am', 1);
      expect(result).toHaveProperty('fine', 1);
    });

    test('should handle numbers and alphanumeric words', () => {
      const text = 'abc123 test2 hello 456';
      const result = stringFunctions.WORD_FREQUENCY(text);
      
      expect(result).toHaveProperty('abc123', 1);
      expect(result).toHaveProperty('test2', 1);
      expect(result).toHaveProperty('hello', 1);
      expect(result).toHaveProperty('456', 1);
    });

    test('should return empty object for empty text', () => {
      expect(stringFunctions.WORD_FREQUENCY('')).toEqual({});
      expect(stringFunctions.WORD_FREQUENCY('   ')).toEqual({});
    });
  });

  describe('SENTIMENT_ANALYSIS Function', () => {
    test('should analyze positive sentiment', () => {
      const text = 'This is an amazing and wonderful product! I love it!';
      const result = stringFunctions.SENTIMENT_ANALYSIS(text);
      
      expect(result.sentiment).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
      expect(result.positiveWords).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result).toHaveProperty('totalWords');
    });

    test('should analyze negative sentiment', () => {
      const text = 'This is terrible and awful! I hate it!';
      const result = stringFunctions.SENTIMENT_ANALYSIS(text);
      
      expect(result.sentiment).toBe('negative');
      expect(result.score).toBeLessThan(0);
      expect(result.negativeWords).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should analyze neutral sentiment', () => {
      const text = 'The weather is sunny today. It is Tuesday.';
      const result = stringFunctions.SENTIMENT_ANALYSIS(text);
      
      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBeCloseTo(0, 1);
      expect(result.positiveWords).toBe(0);
      expect(result.negativeWords).toBe(0);
    });

    test('should return valid structure for empty text', () => {
      const result = stringFunctions.SENTIMENT_ANALYSIS('');
      
      expect(result).toHaveProperty('score', 0);
      expect(result).toHaveProperty('confidence', 0);
      expect(result).toHaveProperty('sentiment', 'neutral');
      expect(result).toHaveProperty('positiveWords', 0);
      expect(result).toHaveProperty('negativeWords', 0);
      expect(result).toHaveProperty('totalWords', 0);
    });

    test('should calculate confidence based on sentiment word density', () => {
      const highSentimentText = 'amazing excellent fantastic wonderful';
      const lowSentimentText = 'amazing excellent the quick brown fox jumps over lazy dog';
      
      const highResult = stringFunctions.SENTIMENT_ANALYSIS(highSentimentText);
      const lowResult = stringFunctions.SENTIMENT_ANALYSIS(lowSentimentText);
      
      expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
    });

    test('should handle mixed sentiment', () => {
      const text = 'I love the good parts but hate the bad parts';
      const result = stringFunctions.SENTIMENT_ANALYSIS(text);
      
      expect(result.positiveWords).toBeGreaterThan(0);
      expect(result.negativeWords).toBeGreaterThan(0);
      expect(Math.abs(result.score)).toBeLessThan(1); // Mixed sentiment, not extreme
    });
  });

  describe('EXTRACT_KEYWORDS Function', () => {
    test('should extract keywords from text', () => {
      const text = 'Machine learning and artificial intelligence are transforming technology industry';
      const result = stringFunctions.EXTRACT_KEYWORDS(text);
      
      expect(result).toHaveProperty('keywords');
      expect(result.keywords).toBeInstanceOf(Array);
      expect(result.keywords.length).toBeGreaterThan(0);
      expect(result.keywords[0]).toHaveProperty('word');
      expect(result.keywords[0]).toHaveProperty('frequency');
      expect(result.keywords[0]).toHaveProperty('weight');
      expect(result).toHaveProperty('totalWords');
      expect(result).toHaveProperty('uniqueWords');
    });

    test('should filter out stop words', () => {
      const text = 'the quick brown fox jumps over the lazy dog';
      const result = stringFunctions.EXTRACT_KEYWORDS(text);
      
      const keywords = result.keywords.map(k => k.word);
      expect(keywords).not.toContain('the');
      expect(keywords).toContain('quick');
      expect(keywords).toContain('brown');
      expect(keywords).toContain('fox');
      expect(keywords).toContain('jumps');
      // Note: 'over' is not in the stop words list, so it will appear
    });

    test('should limit keywords to specified maximum', () => {
      const text = 'one two three four five six seven eight nine ten';
      const result = stringFunctions.EXTRACT_KEYWORDS(text, 5);
      
      expect(result.keywords.length).toBeLessThanOrEqual(5);
    });

    test('should sort keywords by frequency', () => {
      const text = 'apple apple apple banana banana cherry';
      const result = stringFunctions.EXTRACT_KEYWORDS(text);
      
      expect(result.keywords[0].word).toBe('apple'); // Most frequent
      expect(result.keywords[0].frequency).toBe(3);
      expect(result.keywords[1].word).toBe('banana'); // Second most frequent
      expect(result.keywords[1].frequency).toBe(2);
    });

    test('should calculate word weights correctly', () => {
      const text = 'test test other';
      const result = stringFunctions.EXTRACT_KEYWORDS(text);
      
      const testKeyword = result.keywords.find(k => k.word === 'test');
      expect(testKeyword.weight).toBeCloseTo(2/3, 2); // 2 occurrences out of 3 total words
    });

    test('should handle minimum word length requirement', () => {
      const text = 'a bb ccc dddd eeeee'; // Words of length 1-5
      const result = stringFunctions.EXTRACT_KEYWORDS(text);
      
      const keywords = result.keywords.map(k => k.word);
      expect(keywords).not.toContain('a'); // Too short
      expect(keywords).not.toContain('bb'); // Too short  
      expect(keywords).toContain('ccc'); // Minimum length 3
      expect(keywords).toContain('dddd');
      expect(keywords).toContain('eeeee');
    });

    test('should return empty result for empty text', () => {
      const result = stringFunctions.EXTRACT_KEYWORDS('');
      
      expect(result.keywords).toEqual([]);
      expect(result.totalWords).toBe(0);
      expect(result.uniqueWords).toBe(0);
      expect(result.averageFrequency).toBe(0);
    });
  });

  describe('REXX Integration Tests', () => {
    const { parse } = require('../src/parser');
    
    test('should work with REXX SUMMARY function', async () => {
      const script = `
        LET data = '[1,2,3,4,5]'
        LET stats = SUMMARY(data)
      `;
      
      await interpreter.run(parse(script));
      const stats = interpreter.getVariable('stats');
      
      expect(stats).toHaveProperty('count', 5);
      expect(stats).toHaveProperty('mean', 3);
      expect(stats).toHaveProperty('sum', 15);
    });

    test('should work with REXX WORD_FREQUENCY function', async () => {
      const script = `
        LET text = "hello world hello"
        LET freq = WORD_FREQUENCY(text)
      `;
      
      await interpreter.run(parse(script));
      const freq = interpreter.getVariable('freq');
      
      expect(freq).toHaveProperty('hello', 2);
      expect(freq).toHaveProperty('world', 1);
    });

    test('should work with REXX SENTIMENT_ANALYSIS function', async () => {
      const script = `
        LET text = "This is amazing and wonderful!"
        LET sentiment = SENTIMENT_ANALYSIS(text)
      `;
      
      await interpreter.run(parse(script));
      const sentiment = interpreter.getVariable('sentiment');
      
      expect(sentiment).toHaveProperty('sentiment');
      expect(sentiment).toHaveProperty('score');
      expect(sentiment).toHaveProperty('confidence');
    });

    test('should work with REXX EXTRACT_KEYWORDS function', async () => {
      const script = `
        LET text = "machine learning artificial intelligence technology"
        LET keywords = EXTRACT_KEYWORDS(text, 3)
      `;
      
      await interpreter.run(parse(script));
      const keywords = interpreter.getVariable('keywords');
      
      expect(keywords).toHaveProperty('keywords');
      expect(keywords.keywords.length).toBeLessThanOrEqual(3);
    });

    test('should work with named parameters', async () => {
      const script = `
        LET text = "data analysis statistics"
        LET freq = WORD_FREQUENCY text=text
        LET keywords = EXTRACT_KEYWORDS text=text maxKeywords=2
      `;
      
      await interpreter.run(parse(script));
      const freq = interpreter.getVariable('freq');
      const keywords = interpreter.getVariable('keywords');
      
      expect(freq).toHaveProperty('data', 1);
      expect(keywords.keywords.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid input gracefully', () => {
      expect(statisticsFunctions.SUMMARY(null)).toHaveProperty('count', 0);
      expect(statisticsFunctions.CORRELATION_MATRIX(null)).toEqual({});
      expect(stringFunctions.WORD_FREQUENCY(null)).toHaveProperty('null', 1); // null converts to 'null' string
      expect(stringFunctions.SENTIMENT_ANALYSIS(null)).toHaveProperty('sentiment', 'neutral');
      // EXTRACT_KEYWORDS on null creates keyword 'null' with length 4 (>= 3 minimum)
      const keywordResult = stringFunctions.EXTRACT_KEYWORDS(null);
      expect(keywordResult.keywords[0]).toHaveProperty('word', 'null');
    });

    test('should handle malformed JSON', () => {
      const result = statisticsFunctions.SUMMARY('invalid json');
      expect(result).toHaveProperty('count', 0);
    });

    test('should handle non-string input for text functions', () => {
      expect(stringFunctions.WORD_FREQUENCY(123)).toHaveProperty('123', 1);
      // Number 123 converts to string '123', which contains no alphabetic words for sentiment analysis
      expect(stringFunctions.SENTIMENT_ANALYSIS(123)).toHaveProperty('totalWords', 0);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large datasets efficiently', () => {
      // Generate large dataset
      const largeArray = Array(1000).fill(0).map(() => Math.random() * 100);
      const result = statisticsFunctions.SUMMARY(largeArray);
      
      expect(result.count).toBe(1000);
      expect(result.mean).toBeDefined();
      expect(result.standardDeviation).toBeDefined();
    });

    test('should handle large text efficiently', () => {
      const largeText = 'word '.repeat(1000) + 'test '.repeat(500) + 'sample '.repeat(300);
      const freq = stringFunctions.WORD_FREQUENCY(largeText);
      const keywords = stringFunctions.EXTRACT_KEYWORDS(largeText);
      
      expect(freq.word).toBe(1000);
      expect(freq.test).toBe(500);
      expect(freq.sample).toBe(300);
      expect(keywords.totalWords).toBe(1800);
    });
  });
});