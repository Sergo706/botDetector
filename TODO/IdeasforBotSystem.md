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