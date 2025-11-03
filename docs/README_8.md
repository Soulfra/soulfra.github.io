# Cal Memory Vault

Drop files here to expand Cal's reflection context. Supported file types:

- `.txt` - Plain text memories
- `.md` - Markdown documents  
- `.json` - Structured data
- `.js` - Code context (extracts comments and functions)
- `.csv` - Data tables (previews first 5 rows)
- `.log` - Log files (shows last 20 lines)

Files placed here will be automatically:
1. Indexed in `memory-index.json`
2. Parsed and cached for quick access
3. Included in reflection prompts when agents compete
4. Scored with memory bonus points for relevance

The memory loader watches this directory for changes and updates the context in real-time.