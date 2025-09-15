# System ADDRESS Library for RexxJS

This library provides system-level operations for RexxJS through the ADDRESS mechanism, allowing REXX programs to interact with the operating system, execute shell commands, and perform file operations.

## Quick Start

```rexx
REQUIRE "system-address.js"
ADDRESS SYSTEM
"ls -la"
SAY "Exit code:" RC
SAY "Output:" RESULT
```

## Installation

```bash
npm install
npm test
```

## ADDRESS Target: `system`

Once loaded, this library registers the `system` ADDRESS target, allowing you to:
- Execute shell commands and programs
- Handle command output and exit codes
- Perform file operations with redirection
- Use pipes and complex shell operations
- Access standard REXX variables (RC, RESULT, ERRORTEXT)

## Usage Patterns

### Basic Command Execution

```rexx
ADDRESS SYSTEM
"echo Hello World"
SAY RESULT  /* Hello World */
```

### Handling Exit Codes

```rexx
ADDRESS SYSTEM
"exit 42"
SAY "Command returned:" RC  /* 42 */
```

### Method-Style Calls

```rexx
ADDRESS SYSTEM
LET output = execute command="ls -la" combine_stderr=true
SAY "Files:" output.stdout
```

### Shell Selection

```rexx
ADDRESS SYSTEM
LET result = execute command="echo \${BASH_VERSION}" shell="bash"
SAY "Bash version:" result.stdout
SAY "Shell used:" result.shell
```

### Pipe Operations

```rexx
ADDRESS SYSTEM
"ls -la | grep .js | wc -l"
SAY "JavaScript files:" RESULT
```

### File Redirection

```rexx
ADDRESS SYSTEM
"echo 'Hello File' > /tmp/greeting.txt"
"cat /tmp/greeting.txt"
SAY RESULT  /* Hello File */
```

## Available Methods

### `execute`
Execute a command with detailed control over output handling.

**Parameters:**
- `command` - Command to execute
- `combine_stderr` - Whether to combine stderr with stdout (default: false)
- `shell` - Shell to use for execution (default: /bin/sh)

**Returns:** Object with `stdout`, `stderr`, `exitCode`, `shell`

### `run` / `exec`
Simplified command execution methods.

**Parameters:**
- `command` - Command to execute
- `combine_stderr` - Whether to combine stderr with stdout
- `shell` - Shell to use for execution (bash, zsh, etc.)

### `status`
Get system information and ADDRESS target status.

**Returns:** Object with system details

## REXX Variables

The system ADDRESS target automatically sets standard REXX variables:

- **RC** - Return code (exit status) of last command
- **RESULT** - Standard output of last command
- **ERRORTEXT** - Error text if command failed

## Error Handling

```rexx
ADDRESS SYSTEM
"nonexistent_command 2>/dev/null || true"
IF RC \= 0 THEN DO
    SAY "Command failed with code:" RC
    SAY "Error:" ERRORTEXT
END
```

## Shell Features

### Different Shell Types

The system ADDRESS handler supports multiple shells with automatic fallback:

```rexx
ADDRESS SYSTEM
LET bash_result = execute command="declare -a arr=(a b c); echo \${arr[1]}" shell="bash"
LET zsh_result = execute command="echo 'ZSH features'" shell="zsh"  
LET default_result = execute command="echo 'POSIX shell'"
SAY "Bash output:" bash_result.stdout
SAY "Shell used:" bash_result.shell
```

**Supported Shells:**
- `/bin/sh` (default, POSIX compatible)
- `bash` or `/bin/bash` (Bash shell features)
- `zsh` or `/bin/zsh` (Z shell features)
- `/bin/dash` (Debian Almquist shell)
- Custom shell paths (with validation)

### Bash-Specific Features

```rexx
ADDRESS SYSTEM
LET result = execute shell="bash" command="declare -A colors=([red]='#FF0000'); echo \${colors[red]}"
SAY result.stdout  /* #FF0000 */
```

### Shell Arrays and Parameter Expansion

```rexx
ADDRESS SYSTEM
LET result = execute shell="bash" command="TEXT='Hello World'; echo Length: \${#TEXT}"
SAY result.stdout  /* Length: 11 */
```

### Pipes
```rexx
"ps aux | grep node | head -5"
```

### Redirection
```rexx
"ls > /tmp/files.txt 2>&1"
"cat /tmp/files.txt"
```

### Environment Variables
```rexx
"export MY_VAR=hello && echo $MY_VAR"
```

### HEREDOC with Shell Selection

Multi-line scripts can be executed with specific shell interpreters:

```rexx
ADDRESS SYSTEM
LET result = execute shell="bash" command=<<BASH_SCRIPT
#!/bin/bash
declare -a numbers=(10 20 30 40 50)
total=0
for num in "${numbers[@]}"; do
    ((total += num))
done
echo "Sum: $total"
echo "Average: $((total / ${#numbers[@]}))"
BASH_SCRIPT
SAY "Bash script result:" result.stdout
```

This enables complex shell scripting with full bash features while maintaining proper result handling and error codes.

## Advanced Examples

### Cross-Shell Feature Detection

```rexx
ADDRESS SYSTEM
LET bash_check = execute command="echo $BASH_VERSION" shell="bash"
LET zsh_check = execute command="echo $ZSH_VERSION" shell="zsh"

IF bash_check.success THEN
    SAY "Bash version:" bash_check.stdout
END

IF zsh_check.success THEN 
    SAY "Zsh version:" zsh_check.stdout
END
```

### Bash Associative Arrays

```rexx
ADDRESS SYSTEM
LET config_result = execute shell="bash" command=<<BASH_CONFIG
declare -A config=([host]="localhost" [port]="8080" [ssl]="true")
if [[ ${config[ssl]} == "true" ]]; then
    protocol="https"
else  
    protocol="http"
fi
echo "${protocol}://${config[host]}:${config[port]}/api"
BASH_CONFIG
SAY "Generated URL:" config_result.stdout
```

### Error Handling with Shell Selection

```rexx
ADDRESS SYSTEM
LET math_result = execute shell="bash" command="echo $((10 / 0))"
IF math_result.success THEN
    SAY "Result:" math_result.stdout
ELSE
    SAY "Math error (RC=" math_result.exitCode "):" math_result.stderr
END
```

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- Basic command execution
- Error handling and exit codes
- Pipe operations
- File redirection
- REXX variable integration
- Method-style and command-string usage
- Shell selection (bash, zsh, etc.)
- Bash-specific features (arrays, parameter expansion)
- HEREDOC multi-line scripts
- Cross-shell compatibility

## Security Notes

- Commands are executed in the current user's shell environment
- Standard shell security considerations apply
- File system access is limited by user permissions
- Consider input validation for user-provided commands
- Shell selection is validated against whitelist for security
- Invalid shell specifications fallback to `/bin/sh`

## Dependencies

- Node.js built-in modules only (no external dependencies)
- Compatible with Linux, macOS, and Windows

## Integration

This library integrates with:
- RexxJS core interpreter
- Standard REXX ADDRESS mechanism
- REXX variable system
- REXX error handling patterns

Part of the RexxJS extras collection.