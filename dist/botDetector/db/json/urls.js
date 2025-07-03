// This file contains a list of URLs for various web crawlers and bots.
// The URLs are used to fetch the IP ranges of the respective crawlers and bots.
// Please note that the list is not exhaustive and may not include all available crawlers and bots.
// feel free to add more URLs as needed, and use the regex below to filter ips with or without subnets.
// regex to match the IP address "(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)"
// regex to match also the subnet '(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)(?:/(?:3[0-2]|[12][0-9]|[0-9]))'
export const urlListOfGoogleIPs = [
    //DOCS : https://developers.google.com/search/docs/crawling-indexing/verifying-googlebot
    'https://developers.google.com/static/search/apis/ipranges/googlebot.json', // Googlebot
    'https://developers.google.com/static/search/apis/ipranges/special-crawlers.json', // Special Crawlers (AdSense, etc.)
    'https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers.json', // User Triggered Fetchers
    'https://developers.google.com/static/search/apis/ipranges/user-triggered-fetchers-google.json', // User Triggered Fetchers (Google)
    'https://www.gstatic.com/ipranges/goog.json', // Google IP ranges
];
export const bingIPList = [
    // DOCS : https://www.bing.com/webmasters/help/how-to-verify-bingbot-3905dc26
    'https://www.bing.com/toolbox/bingbot.json', // BingBot
];
export const openAiIPList = [
    // openAi doesn’t maintain “.openAi.com” PTRs for its crawler pool, so reverse→forward DNS verification will always fail. Rely instead on their published IP list or an IP-validation API.
    // DOCS : https://platform.openai.com/docs/bots/
    'https://openai.com/gptbot.json', // GPTBot
    'https://openai.com/chatgpt-user.json', // ChatGPT User
    'https://openai.com/searchbot.json', // OpenAI Search Bot
];
export const appleIPList = [
    //Traffic coming from Applebot is generally identified by using reverse DNS in the *.applebot.apple.com domain.
    // DOCS : https://support.apple.com/en-us/119829
    // Applebot-Extended Apple bot to collect data for Apple Maps and Siri, Ads, and improving Apple AI and products.
    'https://search.developer.apple.com/applebot.json', // Applebot
];
export const ahrefsIPList = [
    // DOCS : https://help.ahrefs.com/en/articles/78658-what-is-the-list-of-your-ip-ranges?utm_source=chatgpt.com
    // suffix: *.ahrefs.com, *.ahrefs.net, *.ahrefs.org
    'https://api.ahrefs.com/v3/public/crawler-ip-ranges'
];
export const duckDuckGoIPList = [
    // DuckDuckGo doesn’t maintain “.duckduckgo.com” PTRs for its crawler pool, so reverse→forward DNS verification will always fail. Rely instead on their published IP list or an IP-validation API.
    //DOCS : https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot duckassistbot
    //DOCS : https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot duckduckbot
    // SO ips gonna be validated by the published list and user request claiming to be a duckduckgo bot
    // We fetch directly the help pages to get the IP list, and keep the list updated
    'https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot',
    'https://duckduckgo.com/duckduckgo-help-pages/results/duckduckbot'
];
export const commonCrawlerIPList = [
    // we fetch directly the help pages to get the IP list, and keep the list updated
    // DOCS : https://commoncrawl.org/faq
    'https://commoncrawl.org/faq',
];
export const xAndTwitterIPList = [
    // suffix: .twttr.net, *.x.com
    //DOCS : https://developer.x.com/en/docs/x-for-websites/cards/guides/troubleshooting-cards
    // we fetch directly the help pages to get the IP list, and keep the list updated
    'https://developer.x.com/en/docs/x-for-websites/cards/guides/troubleshooting-cards'
];
export const facebookIPList = [
    //DOCS : https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/
    // suffix:  *.facebook.com, *.fbcdn.net, *.fb.com, .facebook.com *.tfbnw.net *.fbsv.net
    // we fetch directly the help pages to get the IP list, and keep the list updated
    'https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/'
];
export const pinterestIPList = [
    // DOCS : https://help.pinterest.com/en/business/article/pinterestbot
    //Suffix: *pinterest.com or *pinterestcrawler.com
    // we fetch directly the help pages to get the IP list, and keep the list updated
    'https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/'
];
// ****************** Problematic IPs ******************
export const linkedinIPList = [
// linked doesn't have docs or any information regarding their crawlers or bots.
// some search online found that the crawler is called "LinkedInBot" and the IPs ranges can be found in the following URL:
// https://github.com/SecOps-Institute/LinkedInIPLists 
// however, this is not an official source and should be used with caution, plus, the Ips are not being updated for a long time.
// Another solution is 
// Use LinkedIn’s Post Inspector (https://www.linkedin.com/post-inspector/) on any URL you own and inspect the request headers it sends—you’ll see the LinkedInBot/1.0… header, IPs yourself.
// Important notice: Even if you find that Linkedin it self publishes a list of IPs, DON'T TRY TO SCRAPE IT, linkedin is very strict about scraping and will ban your IP and perhaps perform more actions against you, check their robot.txt , or Scraping policy.
];
export const yahooSlurpCrawler = [
//Yahoo has never provided an up-to-date, public list of Slurp’s crawl hostnames or reverse-DNS suffix and ips. What you find in “official”     channels is limited to:
//The historic migration notice on the Yahoo Search Blog (2007), which moved Slurp from inktomisearch.com to the crawl.yahoo.net domain—confirming that true Slurp crawlers now reverse-resolve under *.crawl.yahoo.net.
// But still keep in mind that this is an old information, and i don't really know how authorative it is.
// SOURCES : https://www.searchenginewatch.com/2007/03/28/slurps-change-of-address/, 
// https://searchengineland.com/yahoo-slurp-moves-to-crawlyahoonet-10844
// OFFICIAL DOCS : https://help.yahoo.com/kb/SLN22600.html
// suffix: *.yahoo.com, *.crawl.yahoo.net
];
//****************** Problematic Ends ******************
export const telegramIPList = [
    // DOCS : https://core.telegram.org/bots/webhooks
    // suffix: *.telegram.org,  *.web.telegram.org, *.t.me, *.tdesktop.com,
    // we fetch directly the help pages to get the IP list, and keep the list updated
    'https://core.telegram.org/bots/webhooks'
];
// SEO tools
export const semrushIPList = [
    // DOCS : https://www.semrush.com/kb/1149-issues-with-crawling-a-domain
    // suffix: *.semrush.com, *.semrush.net, *.semrush.org
    // we fetch directly the help pages to get the IP list, and keep the list updated
    'https://www.semrush.com/kb/1149-issues-with-crawling-a-domain'
];
