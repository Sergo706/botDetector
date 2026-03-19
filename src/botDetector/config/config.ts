import { createConfigManager } from "@sergo/utils";
import type { BotDetectorConfig as Configuration, BotDetectorConfigInput } from "../types/configSchema.js";
import { configSchema } from "../types/configSchema.js";
import { DataSources } from "../helpers/mmdbDataReaders.js";
import { BatchQueue } from "../db/batchQueue.js";
import { initStorage } from "./storageAdapter.js";
import type { Storage } from 'unstorage';


const {
  defineConfiguration,
  getConfiguration
} = createConfigManager<Configuration>(configSchema, "Bot Detector");

let globalDataSources: DataSources | undefined;
let globalBatchQueue: BatchQueue | undefined;
let globalStorage: Storage | undefined;


/**
 * @description
 * The bot detector library's configuration object.
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

  const initBatchQueueTask = () => {
    if (!globalBatchQueue) {
      globalBatchQueue = new BatchQueue();
      process.on('SIGTERM', () => globalBatchQueue!.shutdown());
      process.on('SIGINT',  () => globalBatchQueue!.shutdown());
    }
  };

  const initStorageTask = async () => {
    if (!globalStorage) {
      globalStorage = await initStorage(config.storage);
    }
  };

  await defineConfiguration(config, [
    initDataSourcesTask,
    initBatchQueueTask,
    initStorageTask,
  ]);
}


export { getConfiguration };

export function getBatchQueue(): BatchQueue {
  if (!globalBatchQueue) {
    console.trace("Premature getBatchQueue() call");
    throw new Error('BatchQueue not ready. Call configuration() first.');
  }
  return globalBatchQueue;
}

export function getStorage(): Storage {
  if (!globalStorage) {
    console.trace("Premature getStorage() call");
    throw new Error('Storage not ready. Call configuration() first.');
  }
  return globalStorage;
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
