## Relative Path Resolution Ambiguity

When referencing files using relative paths (e.g., `./config.json` or `../data/input.txt`), RexxJS needs to determine the base directory for resolution. This common problem in programming languages stems from two competing interpretations:

1. **Working Directory Resolution** - Paths resolve relative to where the program was launched
2. **Source Directory Resolution** - Paths resolve relative to the location of the script file

### The Problem

Consider a RexxJS script located at `/home/user/projects/myapp/src/parser.rexx`:

<<REXX
/* Traditional ambiguous approach */
config = readFile("./config.json")  /* Which config.json? */
REXX

If you run this script from different locations:

<<BASH
# From project root
cd /home/user/projects/myapp
rexxjs src/parser.rexx
# Looks for: /home/user/projects/myapp/config.json

# From src directory
cd /home/user/projects/myapp/src
rexxjs parser.rexx
# Looks for: /home/user/projects/myapp/src/config.json
BASH

The same code references different files depending on where it's executed!

### The RexxJS Solution

RexxJS introduces explicit prefixes to eliminate this ambiguity:

<<REXX
/* Explicit: relative to current working directory */
config = readFile("cwd://config.json")

/* Explicit: relative to the source file's directory */
config = readFile("src://config.json")
REXX

#### Prefix Reference

| Prefix | Resolution Base | Use Case |
|--------|----------------|----------|
| `cwd://` | Current working directory | User-provided input files, output locations |
| `src://` | Source file's directory | Config files, assets bundled with your script |
| `file://` | Absolute path (standard) | System files, explicit full paths |
| *(no prefix)* | Defaults to `cwd://` | Backward compatibility |

#### Examples

<<REXX
/* Always reads config next to the script, regardless of where you run it */
config = readFile("src://config.json")

/* Always reads from the directory where you launched RexxJS */
userInput = readFile("cwd://data/input.csv")

/* Absolute paths work as expected */
systemConfig = readFile("file:///etc/myapp/settings.conf")

/* Legacy behavior (defaults to cwd://) */
oldStyle = readFile("./data.txt")  /* Same as "cwd://data.txt" */
REXX

This design ensures your RexxJS programs behave consistently regardless of where they're executed, eliminating a common source of "works on my machine" bugs.