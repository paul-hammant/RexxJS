# OS Functions for Consideration
## Based on Toybox Command List (200+ commands)

Legend:
- ✅ **Already Implemented** in core/src/shell-functions.js
- 🟢 **High Priority** - Pure JS or Node.js built-ins, zero npm deps
- 🟡 **Medium Priority** - Small, well-maintained npm deps acceptable
- 🔴 **Low Priority** - System-specific, interactive, or not suitable for library
- ❌ **Not Suitable** - Hardware/kernel/interactive features

---

## File Operations

| Command | Status | Suitability | Dependencies | Notes |
|---------|--------|-------------|--------------|-------|
| basename | ✅ | Already done | None | |
| cat | ✅ | Already done | None | |
| cp | ✅ | Already done | None | |
| dirname | ✅ | Already done | None | |
| find | ✅ | Already done | None | |
| ls | ✅ | Already done | None | |
| mkdir | ✅ | Already done | None | |
| mv | ✅ | Already done | None | |
| rm | ✅ | Already done | None | |
| rmdir | 🟢 | High | None | fs.rmdirSync |
| stat | ✅ | Already done | None | |
| cmp | 🟢 | High | None | fs.readFileSync + compare |
| comm | 🟢 | High | None | Set operations on sorted files |
| du | 🟢 | High | None | fs.statSync recursive |
| file | 🟡 | Medium | file-type or magic-bytes | MIME type detection |
| install | 🟢 | High | None | Like cp but sets permissions |
| link | 🟢 | High | None | fs.linkSync |
| ln | 🟢 | High | None | fs.symlinkSync |
| readlink | 🟢 | High | None | fs.readlinkSync |
| realpath | 🟢 | High | None | fs.realpathSync |
| touch | 🟢 | High | None | fs.utimesSync |
| truncate | 🟢 | High | None | fs.truncateSync |
| unlink | 🟢 | High | None | fs.unlinkSync |
| chgrp | 🟢 | High | None | fs.chownSync |
| chmod | 🟢 | High | None | fs.chmodSync |
| chown | 🟢 | High | None | fs.chownSync |
| mkfifo | 🔴 | Low | None | Named pipes, niche use |
| mknod | 🔴 | Low | None | Device nodes, requires root |

## Text Processing

| Command | Status | Suitability | Dependencies | Notes |
|---------|--------|-------------|--------------|-------|
| grep | ✅ | Already done | None | |
| cut | 🟢 | High | None | Column extraction, pure JS |
| paste | 🟢 | High | None | Merge lines, pure JS |
| head | 🟢 | High | None | fs + array slice |
| tail | 🟢 | High | None | fs + array slice |
| wc | 🟢 | High | None | Word/line/char count, pure JS |
| sort | 🟢 | High | None | Array.sort |
| uniq | 🟢 | High | None | Deduplicate lines, pure JS |
| tr | 🟢 | High | None | Character translation, pure JS |
| rev | 🟢 | High | None | Reverse lines, pure JS |
| tac | 🟢 | High | None | Reverse file (cat backwards) |
| nl | 🟢 | High | None | Number lines, pure JS |
| fold | 🟢 | High | None | Wrap lines, pure JS |
| fmt | 🟢 | High | None | Format paragraphs, pure JS |
| expand | 🟢 | High | None | Tabs to spaces, pure JS |
| dos2unix | 🟢 | High | None | Line ending conversion, pure JS |
| unix2dos | 🟢 | High | None | Line ending conversion, pure JS |
| strings | 🟢 | High | None | Extract printable strings, pure JS |
| split | 🟢 | High | None | Split file into pieces, fs |
| tee | 🟢 | High | None | Duplicate output, fs |
| sed | 🟡 | Medium | Consider pure JS impl | Stream editor, complex |
| awk | 🔴 | Low | Extremely complex | Full language, use JS instead |
| diff | 🟡 | Medium | diff or jsdiff | Text diffing |
| patch | 🟡 | Medium | diff library | Apply patches |

## Encoding & Hashing

| Command | Status | Suitability | Dependencies | Notes |
|---------|--------|-------------|--------------|-------|
| base32 | 🟢 | High | None | Node Buffer.from(x, 'base32') or pure JS |
| base64 | 🟢 | High | None | Node Buffer built-in |
| uudecode | 🟢 | High | None | Pure JS encoding |
| uuencode | 🟢 | High | None | Pure JS encoding |
| md5sum | 🟢 | High | None | crypto.createHash('md5') |
| sha1sum | 🟢 | High | None | crypto.createHash('sha1') |
| sha224sum | 🟢 | High | None | crypto.createHash('sha224') |
| sha256sum | 🟢 | High | None | crypto.createHash('sha256') |
| sha384sum | 🟢 | High | None | crypto.createHash('sha384') |
| sha512sum | 🟢 | High | None | crypto.createHash('sha512') |
| cksum | 🟢 | High | None | CRC checksum, pure JS |
| crc32 | 🟢 | High | None | Pure JS or Buffer |
| sum | 🟢 | High | None | BSD/SysV checksums |
| xxd | 🟢 | High | None | Hex dump, Buffer.toString('hex') |
| hexdump | 🟢 | High | None | Hex dump, Buffer |
| od | 🟢 | High | None | Octal dump, Buffer |

## Compression & Archives

| Command | Status | Suitability | Dependencies | Notes |
|---------|--------|-------------|--------------|-------|
| gunzip | 🟡 | Medium | zlib (built-in) | zlib.gunzipSync |
| gzip | 🟡 | Medium | zlib (built-in) | zlib.gzipSync |
| bunzip2 | 🟡 | Medium | seek-bzip or compressjs | Bzip2 decompression |
| bzcat | 🟡 | Medium | seek-bzip or compressjs | Bzip2 cat |
| xzcat | 🟡 | Medium | lzma-native or xz | XZ decompression |
| zcat | 🟡 | Medium | zlib (built-in) | Gzip cat |
| tar | 🟡 | Medium | tar-stream or tar-fs | Tar archives |
| cpio | 🔴 | Low | No good library | Rare format |

## System Information

| Command | Status | Suitability | Dependencies | Notes |
|---------|--------|-------------|--------------|-------|
| pwd | ✅ | Already done | None | |
| uname | 🟢 | High | None | os.platform(), os.release() |
| hostname | 🟢 | High | None | os.hostname() |
| whoami | 🟢 | High | None | os.userInfo().username |
| id | 🟢 | High | None | os.userInfo() |
| groups | 🟢 | High | None | os.userInfo().groups (Unix only) |
| logname | 🟢 | High | None | os.userInfo().username |
| nproc | 🟢 | High | None | os.cpus().length |
| arch | 🟢 | High | None | os.arch() |
| env | 🟢 | High | None | process.env |
| printenv | 🟢 | High | None | process.env |
| getconf | 🟢 | High | None | Various configs, os module |
| uptime | 🟢 | High | None | os.uptime() |
| dnsdomainname | 🟢 | High | None | os.hostname() parsing |
| free | 🔴 | Low | None | Memory info, os.freemem() limited |
| vmstat | 🔴 | Low | Would need /proc parsing | Virtual memory stats |
| w | 🔴 | Low | Would need utmp parsing | Who is logged in |
| who | 🔴 | Low | Would need utmp parsing | Who is logged in |

## Process Management

| Command | Status | Suitability | Dependencies | Notes |
|---------|--------|-------------|--------------|-------|
| kill | 🟢 | High | None | process.kill(pid, signal) |
| killall | 🟡 | Medium | None | Find processes by name, then kill |
| killall5 | 🔴 | Low | System specific | Kill all processes |
| pkill | 🟡 | Medium | None | Kill by pattern |
| pidof | 🟡 | Medium | ps-list or native | Find PID by name |
| pgrep | 🟡 | Medium | ps-list or native | Find processes by pattern |
| ps | 🟡 | Medium | ps-list | Process list |
| top | 🔴 | Low | Interactive | Real-time process viewer |
| iotop | 🔴 | Low | Requires kernel support | I/O monitoring |
| pmap | 🔴 | Low | /proc parsing | Process memory map |
| pwdx | 🟡 | Medium | /proc parsing (Unix) | Process working directory |
| timeout | 🟢 | High | None | setTimeout + child_process |
| time | 🟢 | High | None | process.hrtime() |
| sleep | 🟢 | High | None | setTimeout (return Promise) |
| usleep | 🟢 | High | None | setTimeout with microseconds |
| nohup | 🟡 | Medium | None | child_process with detached |
| nice | 🔴 | Low | Not well supported | Process priority |
| renice | 🔴 | Low | Not well supported | Change priority |
| ionice | 🔴 | Low | Linux specific | I/O priority |
| iorenice | 🔴 | Low | Linux specific | I/O priority |
| chrt | 🔴 | Low | Linux specific | Real-time scheduling |
| taskset | 🔴 | Low | Linux specific | CPU affinity |

## Utilities

| Command | Status | Suitability | Dependencies | Notes |
|---------|--------|-------------|--------------|-------|
| echo | 🟢 | High | None | Trivial, console.log equivalent |
| yes | 🟢 | High | None | Repeat string infinitely |
| true | 🟢 | High | None | Always return 0 |
| false | 🟢 | High | None | Always return 1 |
| test | 🟢 | High | None | Conditional tests (already in REXX) |
| seq | 🟢 | High | None | Generate number sequence |
| shuf | 🟢 | High | None | Shuffle lines, pure JS |
| factor | 🟢 | High | None | Prime factorization, pure math |
| cal | 🟢 | High | None | Calendar display, pure JS |
| date | 🟢 | High | None | Date/time operations, built-in Date |
| mcookie | 🟢 | High | None | crypto.randomBytes |
| mktemp | 🟢 | High | None | os.tmpdir() + crypto.randomBytes |
| mkpasswd | 🟢 | High | None | crypto for hashing |
| uuidgen | 🟢 | High | None | crypto.randomUUID() |
| which | 🟢 | High | None | Search PATH for executable |
| getopt | 🟢 | High | None | Parse options, pure JS |
| xargs | 🟢 | High | None | Build command lines, pure JS |
| logger | 🟡 | Medium | syslog or similar | Send to syslog |
| ascii | 🟢 | High | None | ASCII table display |
| count | ❌ | Unknown | Unknown | Unclear what this does |
| help | ❌ | Meta | N/A | Help system |

## Network Operations

| Command | Status | Suitability | Dependencies | Notes |
|---------|--------|-------------|--------------|-------|
| nc | 🟡 | Medium | net module | Netcat functionality |
| netcat | 🟡 | Medium | net module | Alias for nc |
| ftpget | 🟡 | Medium | ftp library | FTP download |
| ftpput | 🟡 | Medium | ftp library | FTP upload |
| httpd | 🟡 | Medium | http module | Simple HTTP server |
| host | 🟡 | Medium | dns module | DNS lookup |
| ping | 🟡 | Medium | ping library or raw sockets | ICMP ping |
| ping6 | 🟡 | Medium | ping library | IPv6 ping |
| traceroute | 🟡 | Medium | Complex | Network route tracing |
| netstat | 🔴 | Low | Native or /proc | Network statistics |
| ifconfig | 🔴 | Low | os.networkInterfaces() partial | Network config |
| sntp | 🟡 | Medium | ntp library | SNTP client |

## System/Hardware - Low Priority

| Command | Status | Suitability | Dependencies | Notes |
|---------|--------|-------------|--------------|-------|
| acpi | ❌ | Not suitable | System specific | ACPI info |
| blkid | ❌ | Not suitable | Requires blkid binary | Block device IDs |
| blockdev | ❌ | Not suitable | Requires root | Block device control |
| blkdiscard | ❌ | Not suitable | Requires root | Discard sectors |
| chattr | ❌ | Not suitable | Linux specific | Extended attributes |
| lsattr | ❌ | Not suitable | Linux specific | List extended attributes |
| chroot | 🔴 | Low | process.chroot() | Requires root |
| chvt | ❌ | Not suitable | Console specific | Change virtual terminal |
| deallocvt | ❌ | Not suitable | Console specific | Deallocate VT |
| devmem | ❌ | Not suitable | Requires /dev/mem | Memory access |
| dmesg | ❌ | Not suitable | Kernel specific | Kernel ring buffer |
| eject | ❌ | Not suitable | Hardware specific | Eject removable media |
| freeramdisk | ❌ | Not suitable | Kernel specific | Free ramdisk |
| fsfreeze | ❌ | Not suitable | Requires root | Freeze filesystem |
| fstype | 🔴 | Low | File inspection | Detect filesystem type |
| fsync | 🟢 | High | None | fs.fsyncSync |
| gpio* | ❌ | Not suitable | Hardware specific | GPIO operations |
| halt | ❌ | Not suitable | System control | Shutdown system |
| hwclock | ❌ | Not suitable | Hardware specific | Hardware clock |
| i2c* | ❌ | Not suitable | Hardware specific | I2C bus operations |
| insmod | ❌ | Not suitable | Kernel modules | Insert kernel module |
| losetup | ❌ | Not suitable | Loop devices | Setup loop device |
| lsmod | ❌ | Not suitable | Kernel modules | List modules |
| lspci | ❌ | Not suitable | Hardware enumeration | PCI devices |
| lsusb | ❌ | Not suitable | Hardware enumeration | USB devices |
| makedevs | ❌ | Not suitable | Requires root | Create device nodes |
| memeater | ❌ | Not suitable | Testing tool | Memory consumption |
| microcom | ❌ | Not suitable | Serial port | Serial terminal |
| mix | ❌ | Not suitable | Audio hardware | Audio mixer |
| mkswap | ❌ | Not suitable | Requires root | Create swap |
| modinfo | ❌ | Not suitable | Kernel modules | Module info |
| mount | ❌ | Not suitable | Requires root | Mount filesystems |
| mountpoint | 🔴 | Low | fs.statSync | Test if mountpoint |
| nbd-client | ❌ | Not suitable | Network block device | NBD client |
| nbd-server | ❌ | Not suitable | Network block device | NBD server |
| nsenter | ❌ | Not suitable | Linux namespaces | Enter namespace |
| oneit | ❌ | Not suitable | Init system | Simple init |
| openvt | ❌ | Not suitable | Console specific | Open virtual terminal |
| partprobe | ❌ | Not suitable | Requires root | Probe partitions |
| pivot_root | ❌ | Not suitable | Requires root | Change root filesystem |
| poweroff | ❌ | Not suitable | System control | Power off system |
| reboot | ❌ | Not suitable | System control | Reboot system |
| reset | 🔴 | Low | Terminal control | Reset terminal |
| rfkill | ❌ | Not suitable | Hardware specific | RF kill switch |
| rmmod | ❌ | Not suitable | Kernel modules | Remove module |
| setfattr | ❌ | Not suitable | Linux specific | Set extended attributes |
| setsid | 🔴 | Low | child_process | Create new session |
| shred | 🟡 | Medium | None | Securely delete (fs overwrite) |
| stty | 🔴 | Low | Terminal control | Terminal settings |
| su | ❌ | Not suitable | Security | Switch user |
| sulogin | ❌ | Not suitable | System login | Single user login |
| swapoff | ❌ | Not suitable | Requires root | Disable swap |
| swapon | ❌ | Not suitable | Requires root | Enable swap |
| switch_root | ❌ | Not suitable | Requires root | Switch root |
| sync | 🟢 | High | None | child_process.execSync('sync') |
| sysctl | ❌ | Not suitable | Kernel parameters | Kernel settings |
| tty | 🟢 | High | None | process.stdin.isTTY |
| tunctl | ❌ | Not suitable | Network tunnels | TUN/TAP control |
| ulimit | 🔴 | Low | process.getrlimit | Resource limits |
| umount | ❌ | Not suitable | Requires root | Unmount |
| unshare | ❌ | Not suitable | Linux namespaces | Unshare namespace |
| vconfig | ❌ | Not suitable | Network config | VLAN config |

## Interactive/Editors - Not Suitable

| Command | Status | Suitability | Dependencies | Notes |
|---------|--------|-------------|--------------|-------|
| hexedit | ❌ | Not suitable | Interactive | Hex editor |
| vi | ❌ | Not suitable | Interactive | Text editor |
| login | ❌ | Not suitable | System login | Login shell |
| sh | ❌ | Not suitable | Shell | Shell interpreter |

## File Watching

| Command | Status | Suitability | Dependencies | Notes |
|---------|--------|-------------|--------------|-------|
| inotifyd | 🟡 | Medium | fs.watch or chokidar | File watching |
| flock | 🟡 | Medium | Workarounds needed | File locking |
| watch | 🟡 | Medium | None | Periodic command execution |

---

## Priority Summary

### **Implement First (High Value, Zero Deps):**
1. Text processing: head, tail, wc, cut, paste, sort, uniq, tr, nl, tac, rev
2. Hashing: md5sum, sha*sum, cksum, crc32, base64, base32
3. System info: uname, hostname, whoami, nproc, env
4. Utilities: echo, yes, true, false, seq, date, which, mktemp, uuidgen
5. File ops: touch, readlink, realpath, chmod, chown, link, ln, rmdir
6. Process: kill, timeout, time, sleep

### **Implement Second (Small Deps Acceptable):**
1. Compression: gunzip/gzip (zlib built-in), tar
2. Diffing: diff, patch
3. Process mgmt: pidof, pgrep, pkill, ps
4. Network: nc, httpd (http module), host (dns module)

### **Don't Implement:**
- Hardware/kernel operations (gpio, i2c, acpi, etc.)
- Interactive tools (vi, hexedit, top)
- System administration (mount, reboot, su)
- Obscure formats (cpio, uuencode)
