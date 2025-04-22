import dns from 'node:dns/promises';

const GOOGLE_DOMAINS = [
  '.googlebot.com', 
  '.googleusercontent.com',
  '.google.com'
];

export async function isGoogleBot(ip: string): Promise<boolean> {
  try {

    const hostnames = await dns.reverse(ip);          

    
    const googleHosts = hostnames.filter(h =>
      GOOGLE_DOMAINS.some(domain => h.endsWith(domain))
    );
    if (googleHosts.length === 0) return false;


    for (const host of googleHosts) {
      const addresses = await dns.lookup(host, { all: true }); 
      if (addresses.some(a => a.address === ip)) return true; 
    }
  } catch {

  }
  return false;
}
