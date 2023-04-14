export type MessageToDbWorker = {
  requestDbDownload?: boolean;
};

export type MessageToMain = {
  respondDbDownload?: File;
};
