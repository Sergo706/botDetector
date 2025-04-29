// // banIp.ts
import { spawn } from 'child_process';
import { sendLog } from '../utils/telegramLogger.js';
import type { BannedInfo } from '../types/checkersTypes.js';

const UFW = '/usr/sbin/ufw';


export function banIp(ip: string, info: BannedInfo): Promise<void> {
  console.log('[DEBUG] about to ban IP', ip, info);
  return new Promise((resolve, reject) => {
    const child = spawn('sudo', ['-n', UFW, 'insert', '1', 'deny', 'from', ip], {
      stdio: ['ignore', 'ignore', 'pipe'],
      detached: true  
    });
    child.unref();  

    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`ufw hang timeout on ${ip}`));
    }, 5_000);

    child.stderr.on('data', d => (stderr += d.toString()));
    child.on('error', err => {
      clearTimeout(timer);
      sendLog('- CRITICAL - UFW spawn failed', err.message);
      reject(err);
    });
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) {
        sendLog('- CRITICAL - UFW ban failed', `exit ${code}:\n${stderr.trim()}`);
        return reject(new Error(`ufw exited ${code}`));
      }
      sendLog(
        'Banning Detected Bot/Malicious User --- VM2 - API ---',
        `IP ${ip} banned (score ${info.score})\nReasons:\n- ${info.reasons.join('\n- ')}`
      );
      resolve();
    });
  });
}
