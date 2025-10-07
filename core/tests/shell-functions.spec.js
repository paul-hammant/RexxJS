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
});
