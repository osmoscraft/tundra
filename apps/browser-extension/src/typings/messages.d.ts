export type MessageToDbWorker = {
  requestDbDestroy?: boolean;
  requestDbDownload?: boolean;
};

export type MessageToMain = {
  notifyDbReady?: boolean;
  respondDbDestroy?: boolean;
  respondDbDownload?: File;
};
