# Attribution & License Tracking

**CalOS Platform SDK** - Browser Edition

This document tracks licensing, attribution, and usage of this software.

---

## Primary Author

**Matthew Mauer** (SoulFra)
- Email: matt@soulfra.com
- GitHub: [@soulfra](https://github.com/soulfra)
- Twitter: [@soulfra](https://twitter.com/soulfra)

---

## License

**MIT License** - See [LICENSE](./LICENSE) file

- SDK (this repo): **MIT** - Use freely, even commercially
- Backend (agent-router): **AGPLv3** - Must share modifications if deployed

---

## Why Dual Licensing?

We want the SDK to **spread** (MIT = maximum adoption)
We want the backend to **stay open** (AGPL = can't steal and close-source)

Commercial users can:
- Self-host for free (AGPLv3 backend)
- Use managed hosting at $9/mo
- Enterprise pricing for custom deployments

---

## Attribution Requirements

While not legally required by MIT, we kindly ask that you:

1. **Keep the console watermark** when loading the SDK:
   ```javascript
   // Shows in browser console:
   // 🔒 CalOS Platform SDK v2.0.0
   // Built with ❤️ by SoulFra
   // https://soulfra.github.io
   ```

2. **Keep the "Powered by CalOS" attribution** in your UI (optional but appreciated)

3. **Enable telemetry** if you want to support the project:
   ```javascript
   const calos = new CalOSPlatform({
     baseURL: 'https://api.calos.dev',
     telemetry: true // Opt-in only, privacy-first
   });
   ```

---

## Privacy-First Telemetry

If you enable `telemetry: true`, we track **ONLY**:

✅ **What we track:**
- Domain using SDK (e.g., `example.com`)
- SDK version (e.g., `2.0.0-browser`)
- Privacy mode (e.g., `strict`, `balanced`, `off`)
- Timestamp (when SDK was loaded)

❌ **What we DON'T track:**
- User data
- IP addresses
- Cookies
- Any personally identifiable information (PII)

**Where it's stored:**
- YOUR Google Sheets (self-hosted)
- NOT Google Analytics
- NOT any Big Tech service

---

## How to Disable Attribution

You can disable all console output:

```javascript
const calos = new CalOSPlatform({
  baseURL: 'https://api.calos.dev',
  silent: true // Disables console watermark
});
```

**Note:** Telemetry is opt-in by default. You must explicitly enable it.

---

## Third-Party Dependencies

**ZERO** - This SDK uses only browser built-ins:

- `fetch()` - HTTP requests (built-in since 2017)
- `FileReader` - File uploads (built-in)
- `FormData` - Form data (built-in)
- `crypto.subtle` - Encryption (built-in)

No npm packages. No external CDNs. No tracking scripts.

---

## Source Code

- **GitHub:** https://github.com/soulfra/soulfra.github.io
- **Main repo:** https://github.com/soulfra/calos-platform
- **Issues:** https://github.com/soulfra/calos-platform/issues

---

## Support Open Source

If you use this SDK, consider:

1. **Starring the repo** on GitHub
2. **Enabling telemetry** (opt-in, privacy-first)
3. **Contributing** improvements back
4. **Sharing** with other developers

---

## Commercial Use

**YES!** You can use this SDK commercially under MIT license.

**BUT:** If you modify and deploy the backend server, you must share your changes (AGPLv3).

**Want to avoid AGPL?**
- Use our managed hosting ($9/mo)
- Enterprise license available for custom deployments

---

## Changelog

### v2.0.0-browser (2025-01-22)
- ✅ Zero-dependency browser SDK
- ✅ Full MIT license (MIT)
- ✅ Privacy-first telemetry (opt-in)
- ✅ Console watermark with attribution
- ✅ Self-hosted tracking (Google Sheets)

---

## Contact

Questions? Concerns? Want to contribute?

- Email: matt@soulfra.com
- Discord: https://discord.gg/calos
- Twitter: [@soulfra](https://twitter.com/soulfra)

---

**Built with ❤️ by SoulFra** - Privacy-first automation for developers

*Last updated: 2025-01-22*
