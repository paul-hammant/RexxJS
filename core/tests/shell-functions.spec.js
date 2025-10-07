/**
 * Shell-Inspired Functions Tests
 *
 * Modern file system operations inspired by Deno and Rust:
 * - Rich native APIs (no shelling out)
 * - Named parameters for ergonomics
 * - Pipeline operator compatible
 * - Cross-platform abstractions
 *
 * Test coverage includes:
 * - File listing (ls)
 * - File reading (cat)
 * - Pattern searching (grep)
 * - File finding (find)
 * - File operations (mkdir, cp, mv, rm)
 * - File metadata (stat)
 * - Path operations (basename, dirname, join)
 */

const { RexxInterpreter } = require('../src/interpreter');
const { parse } = require('../src/parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Shell-Inspired Functions', () => {
  let interpreter;
  let testDir;

  beforeEach(() => {
    const mockAddressSender = {
      send: jest.fn().mockResolvedValue({}),
    };
    interpreter = new RexxInterpreter(mockAddressSender);

    // Create temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rexxjs-shell-test-'));
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('LS - List Directory', () => {
    beforeEach(() => {
      // Create test file structure
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'content1');
      fs.writeFileSync(path.join(testDir, 'file2.md'), 'content2');
      fs.mkdirSync(path.join(testDir, 'subdir'));
      fs.writeFileSync(path.join(testDir, 'subdir', 'file3.txt'), 'content3');
      fs.writeFileSync(path.join(testDir, 'subdir', 'file4.js'), 'content4');
    });

    it('should list files in directory', async () => {
      const script = `
        LET files = LS(path="${testDir}")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(3); // file1.txt, file2.md, subdir
    });

    it('should list files recursively', async () => {
      const script = `
        LET files = LS(path="${testDir}", recursive=true)
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(5); // All files + subdir
    });

    it('should filter by pattern', async () => {
      const script = `
        LET files = LS(path="${testDir}", pattern="*.txt")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1); // Only file1.txt at root level
    });

    it('should filter by pattern recursively', async () => {
      const script = `
        LET files = LS(path="${testDir}", recursive=true, pattern="*.txt")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(2); // file1.txt and subdir/file3.txt
    });

    it('should filter by type (files only)', async () => {
      const script = `
        LET files = LS(path="${testDir}", type="file")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(2); // file1.txt, file2.md (no subdir)
    });

    it('should filter by type (directories only)', async () => {
      const script = `
        LET dirs = LS(path="${testDir}", type="directory")
        LET count = ARRAY_LENGTH(array=dirs)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1); // Only subdir
    });

    it('should work with pipe operator', async () => {
      const script = `
        LET count = "${testDir}" |> LS(pattern="*.txt") |> ARRAY_LENGTH()
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1);
    });

    it('should return file objects with metadata', async () => {
      const script = `
        LET files = LS(path="${testDir}", type="file")
        LET first = ARRAY_SLICE(array=files, start=0, end=1)
      `;

      await interpreter.run(parse(script));
      const first = interpreter.getVariable('first');
      expect(first).toBeDefined();
      expect(first[0]).toHaveProperty('name');
      expect(first[0]).toHaveProperty('path');
      expect(first[0]).toHaveProperty('size');
      expect(first[0]).toHaveProperty('isFile');
      expect(first[0]).toHaveProperty('isDirectory');
    });
  });

  describe('CAT - Read File', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'test.txt'), 'Hello World');
      fs.writeFileSync(path.join(testDir, 'test.json'), '{"key":"value"}');
    });

    it('should read file contents', async () => {
      const testFile = path.join(testDir, 'test.txt');
      const script = `
        LET content = CAT(path="${testFile}")
      `;

      await interpreter.run(parse(script));
      const content = interpreter.getVariable('content');
      expect(content).toBe('Hello World');
    });

    it('should work with pipe operator', async () => {
      const testFile = path.join(testDir, 'test.txt');
      const script = `
        LET upper = "${testFile}" |> CAT() |> UPPER()
      `;

      await interpreter.run(parse(script));
      const upper = interpreter.getVariable('upper');
      expect(upper).toBe('HELLO WORLD');
    });

    it('should read JSON and parse in pipeline', async () => {
      const testFile = path.join(testDir, 'test.json');
      const script = `
        LET data = "${testFile}" |> CAT() |> JSON_PARSE()
      `;

      await interpreter.run(parse(script));
      const data = interpreter.getVariable('data');
      expect(data).toEqual({ key: 'value' });
    });

    it('should handle non-existent files', async () => {
      const script = `
        LET content = CAT(path="${testDir}/nonexistent.txt")
      `;

      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });
  });

  describe('GREP - Search Files', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'TODO: fix bug\nDone: feature');
      fs.writeFileSync(path.join(testDir, 'file2.txt'), 'TODO: add tests\nAnother line');
      fs.mkdirSync(path.join(testDir, 'subdir'));
      fs.writeFileSync(path.join(testDir, 'subdir', 'file3.txt'), 'TODO: refactor\nCode here');
    });

    it('should search for pattern in single file', async () => {
      const testFile = path.join(testDir, 'file1.txt');
      const script = `
        LET matches = GREP(pattern="TODO", path="${testFile}")
        LET count = ARRAY_LENGTH(array=matches)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1); // One line with TODO
    });

    it('should search recursively in directory', async () => {
      const script = `
        LET matches = GREP(pattern="TODO", path="${testDir}", recursive=true)
        LET count = ARRAY_LENGTH(array=matches)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(3); // Three files with TODO
    });

    it('should support regex patterns', async () => {
      const testFile = path.join(testDir, 'file1.txt');
      const script = `
        LET matches = GREP(pattern="\\\\bTODO\\\\b", path="${testFile}")
        LET count = ARRAY_LENGTH(array=matches)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1);
    });

    it('should support case-insensitive search', async () => {
      const testFile = path.join(testDir, 'file1.txt');
      const script = `
        LET matches = GREP(pattern="todo", path="${testFile}", ignoreCase=true)
        LET count = ARRAY_LENGTH(array=matches)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(1);
    });

    it('should return match objects with line numbers', async () => {
      const testFile = path.join(testDir, 'file1.txt');
      const script = `
        LET matches = GREP(pattern="TODO", path="${testFile}")
        LET first = ARRAY_SLICE(array=matches, start=0, end=1)
      `;

      await interpreter.run(parse(script));
      const first = interpreter.getVariable('first');
      expect(first[0]).toHaveProperty('file');
      expect(first[0]).toHaveProperty('line');
      expect(first[0]).toHaveProperty('lineNumber');
      expect(first[0]).toHaveProperty('match');
      expect(first[0].lineNumber).toBe(1);
    });

    it('should work with glob patterns', async () => {
      const script = `
        LET matches = GREP(pattern="TODO", path="${testDir}/**/*.txt")
        LET count = ARRAY_LENGTH(array=matches)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBe(3);
    });
  });

  describe('FIND - Find Files', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'old.txt'), 'old');
      fs.writeFileSync(path.join(testDir, 'new.txt'), 'new');
      fs.mkdirSync(path.join(testDir, 'subdir'));
      fs.writeFileSync(path.join(testDir, 'subdir', 'nested.txt'), 'nested');

      // Make old.txt actually old
      const oldTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      fs.utimesSync(path.join(testDir, 'old.txt'), oldTime, oldTime);
    });

    it('should find all files', async () => {
      const script = `
        LET files = FIND(path="${testDir}", type="file")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('should find by name pattern', async () => {
      const script = `
        LET files = FIND(path="${testDir}", name="*.txt")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(3);
    });

    it('should find files modified within days', async () => {
      const script = `
        LET files = FIND(path="${testDir}", type="file", modifiedWithin=7)
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(1); // At least new.txt
    });

    it('should find by size', async () => {
      // Create a larger file
      fs.writeFileSync(path.join(testDir, 'large.txt'), 'x'.repeat(1000));

      const script = `
        LET files = FIND(path="${testDir}", type="file", minSize=500)
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should work with pipe operator', async () => {
      const script = `
        LET count = "${testDir}" |> FIND(type="file") |> ARRAY_LENGTH()
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('MKDIR - Create Directory', () => {
    it('should create directory', async () => {
      const newDir = path.join(testDir, 'newdir');
      const script = `
        MKDIR(path="${newDir}")
        LET exists = FILE_EXISTS(filename="${newDir}")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(true);
      expect(fs.existsSync(newDir)).toBe(true);
    });

    it('should create nested directories with recursive', async () => {
      const newDir = path.join(testDir, 'a', 'b', 'c');
      const script = `
        MKDIR(path="${newDir}", recursive=true)
        LET exists = FILE_EXISTS(filename="${newDir}")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(true);
      expect(fs.existsSync(newDir)).toBe(true);
    });

    it('should handle existing directory', async () => {
      const newDir = path.join(testDir, 'existing');
      fs.mkdirSync(newDir);

      const script = `
        MKDIR(path="${newDir}")
      `;

      // Should not throw when directory exists
      await interpreter.run(parse(script));
      expect(fs.existsSync(newDir)).toBe(true);
    });
  });

  describe('CP - Copy Files', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'source.txt'), 'source content');
      fs.mkdirSync(path.join(testDir, 'sourcedir'));
      fs.writeFileSync(path.join(testDir, 'sourcedir', 'file.txt'), 'file content');
    });

    it('should copy file', async () => {
      const source = path.join(testDir, 'source.txt');
      const dest = path.join(testDir, 'dest.txt');

      const script = `
        CP(source="${source}", dest="${dest}")
        LET exists = FILE_EXISTS(filename="${dest}")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(true);
      expect(fs.readFileSync(dest, 'utf8')).toBe('source content');
    });

    it('should copy directory recursively', async () => {
      const source = path.join(testDir, 'sourcedir');
      const dest = path.join(testDir, 'destdir');

      const script = `
        CP(source="${source}", dest="${dest}", recursive=true)
        LET exists = FILE_EXISTS(filename="${dest}/file.txt")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(true);
    });

    it('should handle non-existent source', async () => {
      const script = `
        CP(source="${testDir}/nonexistent.txt", dest="${testDir}/dest.txt")
      `;

      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });
  });

  describe('MV - Move/Rename Files', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'source.txt'), 'content');
    });

    it('should move file', async () => {
      const source = path.join(testDir, 'source.txt');
      const dest = path.join(testDir, 'dest.txt');

      const script = `
        MV(source="${source}", dest="${dest}")
        LET sourceExists = FILE_EXISTS(filename="${source}")
        LET destExists = FILE_EXISTS(filename="${dest}")
      `;

      await interpreter.run(parse(script));
      const sourceExists = interpreter.getVariable('sourceExists');
      const destExists = interpreter.getVariable('destExists');

      expect(sourceExists).toBe(false);
      expect(destExists).toBe(true);
    });

    it('should rename file', async () => {
      const source = path.join(testDir, 'source.txt');
      const dest = path.join(testDir, 'renamed.txt');

      const script = `
        MV(source="${source}", dest="${dest}")
        LET content = CAT(path="${dest}")
      `;

      await interpreter.run(parse(script));
      const content = interpreter.getVariable('content');
      expect(content).toBe('content');
    });
  });

  describe('RM - Remove Files', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'file.txt'), 'content');
      fs.mkdirSync(path.join(testDir, 'dir'));
      fs.writeFileSync(path.join(testDir, 'dir', 'nested.txt'), 'nested');
    });

    it('should remove file', async () => {
      const file = path.join(testDir, 'file.txt');

      const script = `
        RM(path="${file}")
        LET exists = FILE_EXISTS(filename="${file}")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(false);
    });

    it('should remove directory recursively', async () => {
      const dir = path.join(testDir, 'dir');

      const script = `
        RM(path="${dir}", recursive=true)
        LET exists = FILE_EXISTS(filename="${dir}")
      `;

      await interpreter.run(parse(script));
      const exists = interpreter.getVariable('exists');
      expect(exists).toBe(false);
    });

    it('should require recursive for non-empty directory', async () => {
      const dir = path.join(testDir, 'dir');

      const script = `
        RM(path="${dir}")
      `;

      await expect(interpreter.run(parse(script))).rejects.toThrow();
    });

    it('should handle force flag', async () => {
      const script = `
        RM(path="${testDir}/nonexistent.txt", force=true)
      `;

      // Should not throw with force=true
      await interpreter.run(parse(script));
    });
  });

  describe('STAT - File Metadata', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'file.txt'), 'test content');
    });

    it('should return file statistics', async () => {
      const file = path.join(testDir, 'file.txt');

      const script = `
        LET stats = STAT(path="${file}")
      `;

      await interpreter.run(parse(script));
      const stats = interpreter.getVariable('stats');

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('isFile');
      expect(stats).toHaveProperty('isDirectory');
      expect(stats).toHaveProperty('created');
      expect(stats).toHaveProperty('modified');
      expect(stats).toHaveProperty('accessed');
      expect(stats.isFile).toBe(true);
      expect(stats.isDirectory).toBe(false);
      expect(stats.size).toBe(12); // 'test content'.length
    });

    it('should work with pipe operator', async () => {
      const file = path.join(testDir, 'file.txt');

      const script = `
        LET stats = "${file}" |> STAT()
      `;

      await interpreter.run(parse(script));
      const stats = interpreter.getVariable('stats');
      expect(stats.isFile).toBe(true);
    });
  });

  describe('Path Operations', () => {
    it('should get basename', async () => {
      const script = `
        LET name = BASENAME(path="/path/to/file.txt")
      `;

      await interpreter.run(parse(script));
      const name = interpreter.getVariable('name');
      expect(name).toBe('file.txt');
    });

    it('should get dirname', async () => {
      const script = `
        LET dir = DIRNAME(path="/path/to/file.txt")
      `;

      await interpreter.run(parse(script));
      const dir = interpreter.getVariable('dir');
      expect(dir).toBe('/path/to');
    });

    it('should join paths', async () => {
      const script = `
        LET joined = PATH_JOIN(parts=["path", "to", "file.txt"])
      `;

      await interpreter.run(parse(script));
      const joined = interpreter.getVariable('joined');
      expect(joined).toBe(path.join('path', 'to', 'file.txt'));
    });

    it('should resolve to absolute path', async () => {
      const script = `
        LET absolute = PATH_RESOLVE(path="file.txt")
      `;

      await interpreter.run(parse(script));
      const absolute = interpreter.getVariable('absolute');
      expect(path.isAbsolute(absolute)).toBe(true);
    });

    it('should get file extension', async () => {
      const script = `
        LET ext = PATH_EXTNAME(path="/path/to/file.txt")
      `;

      await interpreter.run(parse(script));
      const ext = interpreter.getVariable('ext');
      expect(ext).toBe('.txt');
    });
  });

  describe('Pipeline Composition', () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(testDir, 'file1.txt'), 'TODO: test\nContent');
      fs.writeFileSync(path.join(testDir, 'file2.md'), 'README');
      fs.mkdirSync(path.join(testDir, 'src'));
      fs.writeFileSync(path.join(testDir, 'src', 'test.js'), 'TODO: implement');
    });

    it('should compose find and grep', async () => {
      const script = `
        LET files = "${testDir}" |> FIND(type="file", name="*.txt")
        LET count = ARRAY_LENGTH(array=files)
      `;

      await interpreter.run(parse(script));
      const count = interpreter.getVariable('count');
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it('should chain multiple operations', async () => {
      const script = `
        LET result = "${testDir}"
          |> LS(recursive=true, pattern="*.txt")
          |> ARRAY_LENGTH()
      `;

      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');
      expect(result).toBeGreaterThanOrEqual(1);
    });

    it('should read and transform file content', async () => {
      const file = path.join(testDir, 'file1.txt');
      const script = `
        LET result = "${file}"
          |> CAT()
          |> UPPER()
          |> LENGTH()
      `;

      await interpreter.run(parse(script));
      const result = interpreter.getVariable('result');
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('Text Processing Functions', () => {
    describe('HEAD', () => {
      it('should return first 10 lines by default', async () => {
        const script = `
          LET lines = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
          LET result = HEAD(input=lines)
          LET count = ARRAY_LENGTH(array=result)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('count')).toBe(10);
      });

      it('should return first N lines', async () => {
        const script = `
          LET lines = ["a", "b", "c", "d", "e"]
          LET result = HEAD(input=lines, lines=3)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b', 'c']);
      });

      it('should handle empty input', async () => {
        const script = `
          LET result = HEAD(input=[], lines=5)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([]);
      });

      it('should handle N larger than array length', async () => {
        const script = `
          LET lines = ["a", "b"]
          LET result = HEAD(input=lines, lines=10)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b']);
      });
    });

    describe('TAIL', () => {
      it('should return last 10 lines by default', async () => {
        const script = `
          LET lines = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
          LET result = TAIL(input=lines)
          LET count = ARRAY_LENGTH(array=result)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('count')).toBe(10);
      });

      it('should return last N lines', async () => {
        const script = `
          LET lines = ["a", "b", "c", "d", "e"]
          LET result = TAIL(input=lines, lines=2)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['d', 'e']);
      });

      it('should work in pipeline', async () => {
        const script = `
          LET result = ["1", "2", "3", "4", "5"] |> TAIL(lines=3)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['3', '4', '5']);
      });
    });

    describe('WC', () => {
      it('should count lines in array', async () => {
        const script = `
          LET myLines = ["line1", "line2", "line3"]
          LET result = WC(input=myLines, type="lines")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe(3);
      });

      it('should count words in array', async () => {
        const script = `
          LET lines = ["hello world", "foo bar baz"]
          LET result = WC(input=lines, type="words")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe(5);
      });

      it('should count characters', async () => {
        const script = `
          LET lines = ["hello"]
          LET result = WC(input=lines, type="chars")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe(5);
      });

      it('should return all counts for array', async () => {
        const script = `
          LET lines = ["hello world", "foo bar"]
          LET result = WC(input=lines)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result.lines).toBe(2);
        expect(result.words).toBe(4);
        expect(result.chars).toBeGreaterThan(0);
      });
    });

    describe('SORT', () => {
      it('should sort lines alphabetically', async () => {
        const script = `
          LET lines = ["zebra", "apple", "banana"]
          LET result = SORT(input=lines)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['apple', 'banana', 'zebra']);
      });

      it('should sort numerically', async () => {
        const script = `
          LET numbers = ["10", "2", "100", "1"]
          LET result = SORT(input=numbers, numeric=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['1', '2', '10', '100']);
      });

      it('should sort in reverse order', async () => {
        const script = `
          LET lines = ["a", "b", "c"]
          LET result = SORT(input=lines, reverse=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['c', 'b', 'a']);
      });

      it('should remove duplicates when unique=true', async () => {
        const script = `
          LET lines = ["b", "a", "b", "c", "a"]
          LET result = SORT(input=lines, unique=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b', 'c']);
      });

      it('should work in pipeline', async () => {
        const script = `
          LET result = ["3", "1", "2"] |> SORT()
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['1', '2', '3']);
      });
    });

    describe('UNIQ', () => {
      it('should remove adjacent duplicates', async () => {
        const script = `
          LET lines = ["a", "a", "b", "b", "b", "c", "c", "a"]
          LET result = UNIQ(input=lines)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b', 'c', 'a']);
      });

      it('should count occurrences when count=true', async () => {
        const script = `
          LET lines = ["a", "a", "a", "b", "b", "c"]
          LET result = UNIQ(input=lines, count=true)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['3 a', '2 b', '1 c']);
      });

      it('should work after SORT in pipeline', async () => {
        const script = `
          LET result = ["b", "a", "b", "a", "c"]
            |> SORT()
            |> UNIQ()
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b', 'c']);
      });

      it('should handle empty array', async () => {
        const script = `
          LET result = UNIQ(input=[])
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([]);
      });
    });

    describe('SEQ', () => {
      it('should generate sequence from 1 to N', async () => {
        const script = `
          LET result = SEQ(5)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([1, 2, 3, 4, 5]);
      });

      it('should generate sequence from start to end', async () => {
        const script = `
          LET result = SEQ(3, 7)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([3, 4, 5, 6, 7]);
      });

      it('should use step increment', async () => {
        const script = `
          LET result = SEQ(0, 10, 2)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([0, 2, 4, 6, 8, 10]);
      });

      it('should handle negative step', async () => {
        const script = `
          LET result = SEQ(5, 1, -1)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([5, 4, 3, 2, 1]);
      });

      it('should work in pipelines', async () => {
        const script = `
          LET result = SEQ(5) |> ARRAY_MAP(n => n * 2)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual([2, 4, 6, 8, 10]);
      });

      it('should throw on zero step', async () => {
        const script = `
          LET result = SEQ(1, 10, 0)
        `;
        await expect(interpreter.run(parse(script))).rejects.toThrow('step cannot be zero');
      });
    });

    describe('SHUF', () => {
      it('should shuffle array elements', async () => {
        const script = `
          LET input = ["a", "b", "c", "d", "e"]
          LET result = SHUF(input=input)
          LET length = ARRAY_LENGTH(array=result)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        const input = ['a', 'b', 'c', 'd', 'e'];

        // Should have same length
        expect(result.length).toBe(5);

        // Should contain all same elements
        expect(result.sort()).toEqual(input.sort());
      });

      it('should maintain array length', async () => {
        const script = `
          LET result = SHUF(input=["1", "2", "3"])
          LET count = ARRAY_LENGTH(array=result)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('count')).toBe(3);
      });

      it('should handle single element', async () => {
        const script = `
          LET result = SHUF(input=["only"])
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['only']);
      });
    });

    describe('CUT', () => {
      it('should extract single field', async () => {
        const script = `
          LET lines = ["a	b	c", "1	2	3"]
          LET result = CUT(input=lines, fields="2")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['b', '2']);
      });

      it('should extract multiple fields', async () => {
        const script = `
          LET lines = ["a	b	c", "1	2	3"]
          LET result = CUT(input=lines, fields="1,3")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a\tc', '1\t3']);
      });

      it('should extract field range', async () => {
        const script = `
          LET lines = ["a	b	c	d"]
          LET result = CUT(input=lines, fields="2-3")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['b\tc']);
      });

      it('should use custom delimiter', async () => {
        const script = `
          LET lines = ["a,b,c", "1,2,3"]
          LET result = CUT(input=lines, fields="1,3", delimiter=",")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a,c', '1,3']);
      });

      it('should handle missing fields', async () => {
        const script = `
          LET lines = ["a	b"]
          LET result = CUT(input=lines, fields="1,2,3,4")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a\tb\t\t']);
      });

      it('should work in pipeline', async () => {
        const script = `
          LET lines = ["a	b	c", "1	2	3"]
          LET result = lines |> CUT(fields="2")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['b', '2']);
      });
    });

    describe('PASTE', () => {
      it('should merge two arrays line by line', async () => {
        const script = `
          LET a = ["a1", "a2"]
          LET b = ["b1", "b2"]
          LET result = PASTE(inputs=[a, b])
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a1\tb1', 'a2\tb2']);
      });

      it('should use custom delimiter', async () => {
        const script = `
          LET a = ["a1", "a2"]
          LET b = ["b1", "b2"]
          LET result = PASTE(inputs=[a, b], delimiter=",")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a1,b1', 'a2,b2']);
      });

      it('should handle arrays of different lengths', async () => {
        const script = `
          LET a = ["a1", "a2", "a3"]
          LET b = ["b1"]
          LET result = PASTE(inputs=[a, b])
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a1\tb1', 'a2\t', 'a3\t']);
      });

      it('should merge three arrays', async () => {
        const script = `
          LET result = PASTE(inputs=[["1"], ["2"], ["3"]])
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['1\t2\t3']);
      });
    });

    describe('TEE', () => {
      beforeEach(() => {
        // Create a temp file for TEE tests
        const teeFile = path.join(testDir, 'tee-output.txt');
        if (fs.existsSync(teeFile)) {
          fs.unlinkSync(teeFile);
        }
      });

      it('should write to file and pass through data', async () => {
        const teeFile = path.join(testDir, 'tee-output.txt');
        const script = `
          LET result = TEE(input="hello world", file="${teeFile}")
        `;
        await interpreter.run(parse(script));

        const result = interpreter.getVariable('result');
        expect(result).toBe('hello world');
        expect(fs.existsSync(teeFile)).toBe(true);
        expect(fs.readFileSync(teeFile, 'utf8')).toBe('hello world\n');
      });

      it('should append when append=true', async () => {
        const teeFile = path.join(testDir, 'tee-append.txt');
        fs.writeFileSync(teeFile, 'existing\n');

        const script = `
          LET result = TEE(input="new", file="${teeFile}", append=true)
        `;
        await interpreter.run(parse(script));

        const content = fs.readFileSync(teeFile, 'utf8');
        expect(content).toBe('existing\nnew\n');
      });

      it('should work in pipeline', async () => {
        const teeFile = path.join(testDir, 'tee-pipe.txt');
        const script = `
          LET result = ["a", "b", "c"]
            |> TEE(file="${teeFile}")
            |> ARRAY_LENGTH()
        `;
        await interpreter.run(parse(script));

        expect(interpreter.getVariable('result')).toBe(3);
        expect(fs.existsSync(teeFile)).toBe(true);
      });
    });

    describe('XARGS', () => {
      it('should build command with arguments', async () => {
        const script = `
          LET files = ["file1.txt", "file2.txt"]
          LET result = XARGS(input=files, command="rm")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['rm file1.txt file2.txt']);
      });

      it('should use placeholder syntax', async () => {
        const script = `
          LET files = ["file1.txt", "file2.txt"]
          LET result = XARGS(input=files, command="echo {}")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['echo file1.txt file2.txt']);
      });

      it('should batch with maxArgs', async () => {
        const script = `
          LET files = ["a", "b", "c", "d"]
          LET result = XARGS(input=files, command="cmd", maxArgs=2)
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['cmd a b', 'cmd c d']);
      });

      it('should handle string input', async () => {
        const script = `
          LET text = "file1\\nfile2\\nfile3"
          LET result = XARGS(input=text, command="process {}")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['process file1 file2 file3']);
      });
    });

    describe('Pipeline Integration', () => {
      it('should chain multiple text processing functions', async () => {
        const script = `
          LET result = SEQ(10)
            |> SHUF()
            |> SORT(numeric=true)
            |> HEAD(lines=5)
        `;
        await interpreter.run(parse(script));
        const result = interpreter.getVariable('result');
        expect(result).toEqual([1, 2, 3, 4, 5]);
      });

      it('should process text with SORT and UNIQ', async () => {
        const script = `
          LET lines = ["b", "a", "a", "c", "b", "a"]
          LET result = lines
            |> SORT()
            |> UNIQ()
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toEqual(['a', 'b', 'c']);
      });

      it('should extract and count fields', async () => {
        const script = `
          LET data = ["a	1", "b	2", "c	3"]
          LET result = data
            |> CUT(fields="2")
            |> WC(type="lines")
        `;
        await interpreter.run(parse(script));
        expect(interpreter.getVariable('result')).toBe(3);
      });

      it('should generate, transform, and sample data', async () => {
        const script = `
          LET result = SEQ(1, 100, 10)
            |> ARRAY_MAP(n => n * 2)
            |> TAIL(lines=3)
        `;
        await interpreter.run(parse(script));
        // SEQ(1, 100, 10) = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91]
        // * 2 = [2, 22, 42, 62, 82, 102, 122, 142, 162, 182]
        // TAIL 3 = [142, 162, 182]
        expect(interpreter.getVariable('result')).toEqual([142, 162, 182]);
      });
    });
  });
});
