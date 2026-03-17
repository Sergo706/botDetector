import { createConfigManager } from "@sergo/utils";
import type { BotDetectorConfig as Configuration, BotDetectorConfigInput } from "../types/configSchema.js";
import { configSchema } from "../types/configSchema.js";
import { DataSources } from "../helpers/mmdbDataReaders.js";
import { BatchQueue } from "../db/batchQueue.js";


const {
  defineConfiguration,
  getConfiguration
} = createConfigManager<Configuration>(configSchema, "Bot Detector");

let globalDataSources: DataSources | undefined;
let globalBatchQueue: BatchQueue | undefined;


/**
 * @description
 * The bot detector library’s configuration object.
 * Contains the core configuration to make the library usable client side.
 * @module jwtAuth/config
 * @see {@link ./jwtAuth/types/configSchema.js}
 */
export async function configuration(config: BotDetectorConfigInput): Promise<void> {
  const initDataSourcesTask = async () => {
    if (!globalDataSources) {
      globalDataSources = await DataSources.initialize();
    }
  };

  await defineConfiguration(config, [initDataSourcesTask]);

  if (!globalBatchQueue) {
    globalBatchQueue = new BatchQueue();
    process.on('SIGTERM', () => globalBatchQueue!.shutdown());
    process.on('SIGINT',  () => globalBatchQueue!.shutdown());
  }
}


export { getConfiguration };

export function getBatchQueue(): BatchQueue {
  if (!globalBatchQueue) {
    throw new Error('BatchQueue not ready. Call configuration() first.');
  }
  return globalBatchQueue;
}

export function getDataSources(): DataSources {
  if (!globalDataSources) {
    console.trace("Premature getDataSources() call");
    throw new Error(`##### Must be initialized globally #####
      Bot Detector: DataSources not ready. Call configuration() first.`
    );
  }
  return globalDataSources;
}