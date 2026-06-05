// jsdom's Blob implementation does not provide arrayBuffer(), which production
// code (util-audio-decoder) and the recorder hooks rely on. Polyfill it via
// FileReader so blob-based tests run under the jsdom environment.
if (typeof Blob !== "undefined" && typeof Blob.prototype.arrayBuffer !== "function") {
  Blob.prototype.arrayBuffer = function arrayBuffer(): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
