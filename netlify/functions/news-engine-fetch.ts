import { handler as triggerHandler } from './auto-news-trigger';

export const handler = async (event: any, context: any) => {
  return triggerHandler(event, context);
};
