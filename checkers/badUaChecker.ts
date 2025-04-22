import pool from '../../../config/dbConnection.js';

let patterns: { rx: RegExp; severity: string }[] = [];

export async function loadUaPatterns(): Promise<void> {
  const [rows] = await pool.query(
    `SELECT http_user_agent, metadata_severity
       FROM user_agent_metadata
      WHERE metadata_severity IN ('low','medium','high','critical')`
  );

  patterns = (rows as any[]).map(r => {
    // convert "node-fetch*" → /^node-fetch.*$/i
    const escaped = r.http_user_agent
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')   // escape regex
      .replace(/\\\*/g, '.*');                 // wildcard *
    return { rx: new RegExp(`^${escaped}$`, 'i'), severity: r.metadata_severity };
  });
}

function weight(sev: string): number {
  switch (sev) {
    case 'critical': return 10;    // MaaS, pentest tools, etc
    case 'high':     return 10;
    case 'medium':   return 7;    // tweak if you like
    default:         return 0;    
  }
}

export function metaUaScore(rawUa: string): number {
  for (const { rx, severity } of patterns) {
    if (rx.test(rawUa)) return weight(severity);
  }
  return 0;
}
