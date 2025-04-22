import { sendLog } from "../../../utils/telegramLogger.js";
import type { GeoResponse } from "../types/geoTypes.js";

export async function getdata(url: string):Promise<GeoResponse> {
  try { 
    const response = await fetch(url);
    const data: GeoResponse = await response.json();
    return data;
    } catch(err) {
      sendLog('Error Getting GEO data', `Error msg: ${err}` );
      throw err;
    }
  }
   
   