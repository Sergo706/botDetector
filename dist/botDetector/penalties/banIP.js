import { spawn } from 'child_process';
import { sendLog } from '../utils/telegramLogger.js';
import { logger } from '../utils/logger.js';
const UFW = '/usr/sbin/ufw';
export function banIp(ip, info) {
    const log = logger.child({ service: 'BOT DETECTOR', branch: `banIp`, ipAddress: ip, details: info });
    log.info('about to ban an IP');
    return new Promise((resolve, reject) => {
        const child = spawn('sudo', ['-n', UFW, 'insert', '1', 'deny', 'from', ip], {
            stdio: ['ignore', 'ignore', 'pipe'],
            detached: true
        });
        child.unref();
        let stderr = '';
        const timer = setTimeout(() => {
            child.kill('SIGKILL');
            log.warn(`ufw hang timeout on ${ip}`);
            reject(new Error(`ufw hang timeout on ${ip}`));
        }, 5000);
        child.stderr.on('data', d => (stderr += d.toString()));
        child.on('error', err => {
            clearTimeout(timer);
            log.fatal({ err }, `- CRITICAL - UFW spawn failed`);
            sendLog('- CRITICAL - UFW spawn failed', err.message);
            reject(err);
        });
        child.on('close', code => {
            clearTimeout(timer);
            if (code !== 0) {
                log.fatal({ code }, `- CRITICAL - UFW ban failed`);
                sendLog('- CRITICAL - UFW ban failed', `exit ${code}:\n${stderr.trim()}`);
                return reject(new Error(`ufw exited ${code}`));
            }
            log.info(`Banning Detected Bot/Malicious User. IP ${ip} banned (score ${info.score})\nReasons:\n- ${info.reasons.join('\n- ')}`);
            sendLog('Banning Detected Bot/Malicious User --- VM2 - API ---', `IP ${ip} banned (score ${info.score})\nReasons:\n- ${info.reasons.join('\n- ')}`);
            resolve();
        });
    });
}
