import { LocalStorageRepository } from './LocalStorageRepository';
import { IStorageRepository } from './StorageInterface';

export const storageRepository: IStorageRepository = new LocalStorageRepository();
export * from './StorageInterface';
export * from './LocalStorageRepository';
