# Ideas for Bot System

Let me share my view as a scraper, could be useful.

## Types of Problems

### 1. Obvious Breaks
When a scraper breaks obviously - it is an easy fix. I see an error, I go through the browser, and then keep changing things in the browser and scraper to see what affects the result. Takes dozens of runs.

### 2. Delayed but Predictable Problems
Usually rate limits, red flags. Harder to fix. When this occurs, I have to do everything as above but many more times, to see what is the limit or red flags. Takes hundreds of runs.

### 3. Unpredictable Problems
If I see the error but don’t understand what is the reason for it, I likely won’t even try to fix it. Either I would use a full browser or just not bother scraping this particular website at all. Full browser is slow and cumbersome to use for scraping.

### 4. Unpredictable Non-Problems
If there is no obvious problem, like data is getting wrong but in the right format, and I see no easy way to even detect an error - that is a nightmare. I would need to analyze the logs, and I really don’t like doing that. Especially when paired with some rule that I don’t understand.

## The Worst Target for a Scraper

The worst target for me would be this:

- There has to be no single rule, instead a hidden accumulator of red flags:
  - Rate
  - No ref
  - No nonce
  - Visit history
  - Cookies
  - IP range

All of those have to do `+1` to a hidden variable that should never be exposed. Access to this variable, or a unique error message, will allow me to bypass every measure separately. Only when measures are mixed together, they can be complex enough that I won’t be able to say what exactly is wrong.

The strength of this measure is somewhat proportional to the amount of mixed measures at least squared. 10 mixed measures are about 100 times harder to bypass than 1. And when this accumulator value is above the threshold value - there has to be no obvious sign.

Giving random prices can be detected - it will differ between 2 requests. Generate a random variable from the current date (not time, just the day number), and use that to change the price `±20%`, and round the value the same as your ordinary prices are rounded (nearest `0.05`). This way I can’t detect if the price has changed or if all the prices went `+7%` today.

## Main Task

Your main task is to **slow down the analysis**:
- Don’t expose protective measures separately.
- Don’t show unique errors.
- Don’t generate random prices from things that change more often than day/week.

## Approximate Idea

- If IP range from the known IP range that scraper used before, then `acc+1`
- If no main page visit, `acc+1`
- If search request typed in less than 2 seconds, `acc+1`
- If no mouse activity detected, `acc+1`
- If no keyboard activity detected, `acc+1`
- If browser user-agent similar to scraper, `acc+1`
- If user spent less than 3 minutes browsing the website, `acc+1`
- If no image load requested, `acc+1`
- If 2 different search requests done without visiting the page where this can be done, `acc+1`
- If more than 1 request per second, `acc+1`
- If more than 10 requests per minute, `acc+1`
- If more than 100 requests per hour, `acc+1`
- If more than 1000 requests per day, `acc+1`

### Notes
- Only new measures you add count - old measures scraper has already solved and will try to tweak them first.
- If you keep adding measures one by one - they will be solved one by one.
- Delay the update until you can add 5-10 new mixed measures at once.
- Make sure nothing exposes which measure was activated.

### Example
If `acc > 3`, then:

```
price = price * (1 + (random(seed: date (not time) + item ID) - 0.5) * 2 * 0.2)
```

If I would meet this, it would take me a month to untangle.

---

FINISH ALSO THE STTINGS.ts FILE

### botDetectrorHeades.ts

Enahnced the function to detect and calculate headers based on the Engine Type to make it more robust.

- Blink vs Gecko vs WebKit.

- Protocol - bans hop‑by‑hop headers on HTTP/2 & 3.

- Weighted signals – privacy omissions are low weight, hard impossibilities are high weight.

- Single responsibility – detector only scores; middleware decides the action.


| Engine                             | Main brands today                                                            | Comment                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **Blink**                          | Google Chrome, Microsoft Edge, Brave, Opera, Vivaldi, Android WebView        | Open‑source Chromium forked from WebKit in 2013.                                         |
| **Gecko**                          | Mozilla Firefox (desktop & Android)                                          | Independent stack; all other Gecko‑based browsers are niche.                             |
| **WebKit**                         | Safari (macOS & iOS), all iOS‑store browsers (Chrome iOS, Firefox iOS, etc.) | Apple’s engine; iOS mandates WebKit for every browser.                                   |
| *(Legacy)* Trident/EdgeHTML/Presto | IE 11, old Edge ≤18, Opera ≤12                                               | Effectively gone from the public Web; ignore unless you serve very old intranet clients. |

| Header                                      | Blink                         | Gecko                 | WebKit                  | Notes                                                                    |
| ------------------------------------------- | ----------------------------- | --------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `:authority` (h2/3) / `Host` (h1)           | ✅                             | ✅                     | ✅                       | Only truly mandatory header.                                             |
| `User-Agent`                                | ✅                             | ✅                     | ✅                       | Present everywhere until UA‑reduction finishes.                          |
| `Accept`                                    | ✅ (`image/avif,image/webp,…`) | ✅ (same + WebP/AVIF)  | ✅ (same)                | Exact mime list differs but header always exists.                        |
| `Accept-Encoding`                           | ✅ `gzip, deflate, br`         | ✅ `gzip, deflate, br` | ✅ `gzip, deflate, br`   | All three engines advertise Brotli on HTTPS ([1])                        |
| `Accept-Language`                           | ✅                             | ✅                     | ✅                       | Users can remove it, so treat absence as a **soft** signal.              |
| **Blink‑only**                              |                               |                       |                         |                                                                          |
| `Sec-Fetch-Site` / `Mode` / `Dest` / `User` | ✅                             | ✅ (119+)              | ❌                       | Safari still omits them ([2])                                            |
| `sec-ch-ua*` (Client Hints)                 | ✅                             | ❌ (opt‑in pref)       | ❌                       | Installed by default in all Chromium‑based browsers ([3])                |
| `Upgrade-Insecure-Requests: 1`              | ✅                             | ❌                     | ❌                       | Sent only on top‑level navigation.                                       |
| **Gecko‑only**                              |                               |                       |                         |                                                                          |
| `TE: trailers`                              | ✅                             | ❌                     | ❌                       | Firefox is the sole engine that adds it on h2/h3 ([4])                   |
| **WebKit quirks**                           |                               |                       |                         |                                                                          |
| `Cache-Control: max-age=0`                  | sometimes                     | sometimes             | **always on fresh nav** | Safari uses it as its “give me a fresh copy” request ([5])               |
| *No* `Sec-Fetch-*`, *no* Client‑Hints       | —                             | —                     | ✅                       | Lack of these headers is normal on Safari ([2])                          |

[1]: https://caniuse.com/brotli?utm_source=chatgpt.com  
[2]: https://github.com/mswjs/msw/discussions/1004?utm_source=chatgpt.com  
[3]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-CH-UA?utm_source=chatgpt.com  
[4]: https://www.fastly.com/blog/supercharging-server-timing-http-trailers?utm_source=chatgpt.com  
[5]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control?utm_source=chatgpt.com  




## How Many Engines Really Matter in 2025?

For live traffic on a public website, you only need to recognize three active engines. Everything else on your long list is either legacy, hobbyist, or has less than 0.1% presence:

| Engine (2025) | Typical Brands                                                    | Global Share\*                          | Should You Special‑Case It?                                                        | Why / Why Not                                                           |
| ------------- | ----------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Blink**     | Chrome, Edge, Brave, Opera, Vivaldi, Samsung Internet, Arc, Kiwi… | ≈ 79 % of all page views ([Indulge][1]) | **Yes** – the baseline every detector must pass.                                   | Dominates desktop + Android; sends full `Sec‑Fetch‑*` and `sec-ch-ua*`. |
| **WebKit**    | Safari (macOS + iOS) + all App‑Store “chromes” on iOS             | ≈ 17 % ([StatCounter Global Stats][2])  | **Yes** – second most common, header profile is very different (no `Sec‑Fetch-*`). | iOS forces WebKit for every browser; Mac users still \~20 % share.      |
| **Gecko**     | Firefox desktop, Firefox Android, LibreWolf, Waterfox             | ≈ 3 % ([StatCounter Global Stats][2])   | **Yes** – still millions of real users; unique `TE: trailers`.                     | Keeps the Web diverse; shows `Sec‑Fetch-*` but no Client‑Hints.         |

[1]: https://indulge.digital/blog/behind-browsers-rendering-engines-power-your-web-experience?utm_source=chatgpt.com "Behind Browsers: Rendering Engines that Power Your Web ..."
[2]: https://gs.statcounter.com/browser-market-share?utm_source=chatgpt.com "Browser Market Share Worldwide | Statcounter Global Stats"

* Rounded StatCounter April 2025 numbers.

### Everything Else Today

| Family                                              | Status in 2025                                                    | Action                                                                       |
| --------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Trident**, **EdgeHTML**, **Presto**, **Tasman**   | Legacy only (IE 11, old Edge 18‑, Opera 12‑). < 0.3 % combined.   | Accept them if you serve corporate/embedded clients, otherwise ignore.       |
| **Servo**, **Goanna**, **LibWeb**, **ArkWeb**, etc. | Experimental or niche forks with minuscule public footprint.      | Treat as “unknown engine” fallback path; don’t spend effort tailoring rules. |
| **Text‑Mode Engines** (*w3m, Links, Lynx*)          | Accessibility / sysadmin tools, still appear in logs but < 0.1 %. | Low score but never auto‑block; many security scanners spoof Lynx.           |

---

## Header Expectations Per Engine

**Rule of Thumb:** Penalize missing headers that the engine always emits, and penalize present headers the engine cannot emit.

| Header                                 | Blink    | WebKit | Gecko              |
| -------------------------------------- | -------- | ------ | ------------------ |
| `accept-encoding`                      | ✅        | ✅      | ✅                  |
| `sec-fetch-site / mode / dest`         | ✅        | ❌      | ✅ (v 119+)         |
| `sec-fetch-user` (on click nav)        | ✅        | ❌      | ✅                  |
| `sec-ch-ua*` client‑hints              | ✅        | ❌      | ❌ (off by default) |
| `te: trailers` (h2/h3)                 | ❌        | ❌      | ✅                  |
| `upgrade-insecure-requests: 1`         | ✅        | ❌      | ❌                  |
| `cache-control: max-age=0` (fresh nav) | ⏳ (rare) | **✅**  | ⏳                  |
| `connection` on HTTP/2/3               | ❌        | ❌      | ❌                  |


✅ = always there; ❌ = never there; ⏳ = occasionally.
### Example Code

```
// very condensed
switch (engine) {
  case 'blink':
    must('sec-fetch-site');
    must('sec-ch-ua');          // at least one client‑hint
    forbids('te');              // Blink never sends TE: trailers
    break;

  case 'gecko':
    must('sec-fetch-site');     // present since Firefox 119
    must('te');                 // TE: trailers is expected
    forbids('sec-ch-ua');       // unless user enabled experimental flag
    break;

  case 'webkit':
    must('cache-control');      // usually max-age=0
    forbids('sec-fetch-site');  // Safari doesn’t send Fetch metadata
    forbids('sec-ch-ua');       // no Client‑Hints yet
    break;
}
```
### Example Code 2 

```
switch (engine) {
  case BLINK:
    must('sec-fetch-site'); must('sec-ch-ua');
    forbids('te');
    break;
  case GECKO:
    must('sec-fetch-site'); must('te');
    forbids('sec-ch-ua');
    break;
  case WEBKIT:
    must('cache-control');
    forbids('sec-fetch-site'); forbids('sec-ch-ua');
    break;
}


function detectEngine(ua: string): 'blink' | 'gecko' | 'webkit' | 'other' {
  ua = ua.toLowerCase();
  if (ua.includes('firefox')) return 'gecko';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'webkit';
  if (ua.match(/chrome|edg|opr|brave|vivaldi|samsung/)) return 'blink';
  return 'other';               // fallback for Lynx, Servo, bots, etc.
}
```
