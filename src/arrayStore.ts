import { Store } from './interface';

class ArrayStore implements Store {
  /**
   * The array of stored values.
   */
  protected storage: Record<string, unknown>;

  /**
   * Create a new array store instance.
   */
  constructor(storage: Record<string, unknown> = {}) {
    this.storage = storage;
  }

  /**
   * Determine if the given key exists in storage.
   */
  has(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.storage, key);
  }

  /**
   * Retrieve an item from the storage by key.
   */
  get<T = unknown>(key: string, defaultValue: T | null = null): T | null {
    return (this.has(key) ? this.storage[key] : defaultValue) as T;
  }

  /**
   * Store an item in the storage.
   */
  put<T = unknown>(key: string, value: T): boolean {
    this.storage[key] = value;
    return true;
  }

  /**
   * Increment the value of an item in the storage.
   */
  increment(key: string, value: number = 1): number {
    if (this.has(key)) {
      value = value + Number(this.storage[key]);
    }

    return (this.storage[key] = value);
  }

  /**
   * Decrement the value of an item in the storage.
   */
  decrement(key: string, value: number = 1): number {
    return this.increment(key, value * -1);
  }

  /**
   * Remove an item from the store.
   */
  forget(key: string): boolean {
    if (this.has(key)) {
      delete this.storage[key];
      return true;
    }

    return false;
  }

  /**
   * Retrieve an item from the storage and delete it.
   */
  pull<T = unknown>(key: string, defaultValue: T | null = null): T | null {
    const value = this.get(key, defaultValue);

    this.forget(key);

    return value;
  }

  /**
   * Remove all items from the storage.
   */
  flush(): void {
    this.storage = {};
  }
}

export default ArrayStore;
