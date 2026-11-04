declare module 'react-test-renderer' {
  const content: any;
  export default content;
  export const act: (callback: () => Promise<void> | void) => Promise<void> | void;
}
