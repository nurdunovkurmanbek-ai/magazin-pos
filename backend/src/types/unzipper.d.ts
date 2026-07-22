declare module 'unzipper' {
  import { Writable } from 'stream';

  interface ExtractOptions {
    path: string;
  }

  interface ExtractStream extends Writable {
    promise(): Promise<void>;
  }

  interface Unzipper {
    Extract(options: ExtractOptions): ExtractStream;
  }

  const unzipper: Unzipper;
  export default unzipper;
}
