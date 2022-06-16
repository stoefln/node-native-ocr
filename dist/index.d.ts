export const recognize: (image: Buffer, options?: RecognizeOptions) => Promise<string>;

export interface RecognizeOptions {
  lang?: string | Array<string>;
  output?: 'txt' | 'tsv';
  tessdataPath?: string,
}