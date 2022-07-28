/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable max-classes-per-file */
import * as localForage from 'localforage';
import { isBrowser } from './deploymentInfo';

const currentCacheVersion = 'biomage_0.0.1';
const previousCacheVersions = ['biomage'];

const deleteOldVersions = () => {
  const indexedDbInstace = window.indexedDB
    || window.mozIndexedDB
    || window.webkitIndexedDB
    || window.msIndexedDB;
  if (indexedDbInstace) {
    previousCacheVersions.forEach((db) => indexedDbInstace.deleteDatabase(db));
  }
};

class BrowserCache {
  constructor() {
    if (!BrowserCache.instance) {
      BrowserCache.instance = this;
    }
    this.maxSize = 300;
    this.size = 0;
    this.head = null;
    this.tail = null;
    this.lru = {};
    this.initialised = false;
    return BrowserCache.instance;
  }

  async _init() {
    try {
      if (this.initialised) return;
      if (!isBrowser) return;
      localForage.config({
        driver: localForage.INDEXEDDB,
        name: currentCacheVersion,
        storeName: 'biomage_cache',
        description: 'In Browser Cache',
      });
      await localForage.ready();
      const length = await localForage.length();
      if (length) {
        const keys = await localForage.keys();
        if (!this.tail) {
          // eslint-disable-next-line prefer-destructuring
          this.tail = keys[0];
        }
        keys.forEach((key) => {
          this._insert(key);
        });
      }
      this.initialised = true;
      deleteOldVersions();
    } catch (error) {
      console.trace(error);
    }
  }

  async get(key) {
    try {
      const data = await localForage.getItem(key);
      if (!data) return data;

      const item = data;
      if (item.ttl < Date.now()) {
        await this._remove(key);
        return null;
      }
      if (this.head !== key) this._setHead(key);

      return item.value;
    } catch (error) {
      console.trace(error);
    }
    return null;
  }

  // set value should not be used independently as it might cause cache poisoning
  // ttl is set to 12 hours by default
  async set(key, value, ttl = 43200) {
    if (this.size >= this.maxSize) {
      await this._remove(this.tail);
    }
    if (ttl && typeof ttl === 'number') {
      // eslint-disable-next-line no-param-reassign
      ttl = Math.round(ttl * 1000 + Date.now());
    }

    try {
      await localForage.setItem(key, { value, ttl });
      this._insert(key);

      if (!this.tail) {
        this.tail = key;
      }
      return true;
    } catch (error) {
      console.trace(error);
    }
    return false;
  }

  _insert(key) {
    this.lru[key] = { next: null, previous: null };
    this.size += 1;
    const previousHead = this.head;
    this.head = key;
    if (previousHead) {
      this.lru[previousHead].next = key;
      this.lru[key].previous = previousHead;
    }
  }

  _setHead(key) {
    if (this.tail === key) {
      this.tail = this.lru[key].next;
    }
    if (this.lru[key]) {
      if (this.lru[key].next) {
        const { next } = this.lru[key];
        if (this.lru[next].previous) this.lru[next].previous = this.lru[key].previous;
      }
      if (this.lru[key].previous) {
        const { previous } = this.lru[key];
        if (this.lru[previous].next) this.lru[previous].next = this.lru[key].next;
      }
      this.lru[key].next = null;
      this.lru[key].previous = null;
      const previousHead = this.head;
      this.head = key;
      if (previousHead) {
        this.lru[previousHead].next = key;
        this.lru[key].previous = previousHead;
      }
    } else {
      this._insert(key);
    }
  }

  async _remove(key) {
    if (this.tail === key) {
      if (this.lru[this.tail].next) {
        const { next } = this.lru[this.tail];
        this.lru[next].previous = null;
        this.tail = next;
      } else {
        this.tail = null;
      }
      this.lru[key].next = null;
      this.lru[key].previous = null;
    }
    if (this.head === key) {
      if (this.lru[this.head].previous) {
        const { previous } = this.lru[this.head];
        this.lru[previous].next = null;
        this.head = previous;
      } else {
        this.head = null;
      }
      this.lru[key].next = null;
      this.lru[key].previous = null;
    }
    if (this.lru[key]?.next) {
      const { next } = this.lru[key];
      this.lru[next].previous = this.lru[key].previous;
    }
    if (this.lru[key]?.previous) {
      const { previous } = this.lru[key];
      this.lru[previous].next = this.lru[key].next;
    }
    await localForage.removeItem(key);
    delete this.lru[key];
    this.size -= 1;
  }
}

const instance = new BrowserCache();
instance._init();

export default instance;
