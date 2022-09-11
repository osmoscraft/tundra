const channelMap: Record<string, EventTarget> = {};

export const getEvenHub = (channel: string) => {
  return (channelMap[channel] ??= new EventTarget());
};
