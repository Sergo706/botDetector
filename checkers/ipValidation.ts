import { isIP } from 'node:net';

export async function validateIp(ipAddress: string): Promise<boolean> {
    const isValid = isIP(ipAddress) !== 0;
    if (!isValid) {

      console.log('Entered Ban from ip validation Helper')

      return  false;
    }
    return true;
  }
