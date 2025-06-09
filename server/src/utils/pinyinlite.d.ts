declare module 'pinyinlite' {
    function pinyin(text: string, options?: { tone: boolean }): string[][];
    export default pinyin;
  }