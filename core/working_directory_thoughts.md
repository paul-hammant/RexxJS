# `./filename.txt` Resolution in Different Languages

## The two possible interpretations of `./`
1. **Process working directory (CWD) at runtime**  
   `./` refers to the directory where the process was launched (what `getcwd()` would return).  
   Example: If you run `cd /tmp && python myscript.py`, then `./file.txt` means `/tmp/file.txt`.

2. **Source file location**  
   `./` is interpreted relative to the location of the source file containing the code.  
   Example: If your source file is `/home/user/project/foo/script.js`, then `./file.txt` means `/home/user/project/foo/file.txt`.

---

## Languages that use the *current working directory (CWD)* by default
Almost all compiled or interpreted languages fall here unless they provide explicit helpers:

- **C / C++** (`fopen("file.txt", "r")`)
- **Java** (`new FileReader("./file.txt")`)
- **Python** (`open("./file.txt")`)
- **Ruby**
- **Perl**
- **Go**
- **Rust**
- **C# / .NET**
- **Haskell**
- **Shell scripts** (`cat ./file.txt`)
- **PHP** (when run from CLI; in web context, paths are relative to `cwd` of the interpreter)

These languages treat `./` relative to **where you launched the process** (not the source file).

---

## Languages (or ecosystems) that often use the *source file’s directory*
These environments frequently special-case `./` to mean “next to this script/module”:

- **Node.js**
    - `require("./module.js")` → relative to the current file’s directory
    - `fs.readFileSync("./file.txt")` → relative to **CWD** unless you join with `__dirname`

- **PHP**
    - `include "./foo.php"` / `require "./foo.php"` → relative to the including file’s directory (unless `include_path` overrides)
    - `fopen("./file.txt")` → relative to process CWD

- **Bash sourcing (`. ./script.sh`)** → relative to the file being sourced, not the current dir

- **Lua**
    - `require "mod"` → relative to the script’s location (via `package.path`)
    - `io.open("./file.txt")` → uses CWD

- **Some embedded runtimes** (e.g., Unity C#, Unreal Blueprints) may resolve relative paths based on the asset/script location.

--- 

## Mixed cases
- **Node.js** is the most confusing:
    - `require("./x")` is relative to the script file
    - `fs.readFile("./x")` is relative to process CWD

- **PHP** is similar:
    - `include "./foo.php"` → relative to the file doing the including
