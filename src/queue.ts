import { RelayJob } from './types.d';

export default class RequestQueue {
  private queue: RelayJob[] = [];
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  push(job: RelayJob): boolean {
    if (this.queue.length >= this.maxSize) return false;
    this.queue.push(job);
    return true;
  }

  pop(): RelayJob | undefined {
    return this.queue.shift();
  }

  size(): number {
    return this.queue.length;
  }

  list(): RelayJob[] {
    return [...this.queue];
  }
}
