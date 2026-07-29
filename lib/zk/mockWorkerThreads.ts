// Mock worker_threads file to satisfy Next.js Turbopack client builds
export const isMainThread = true;
export const parentPort = null;
export class Worker {
  terminate() {}
  postMessage() {}
  on() {}
}
