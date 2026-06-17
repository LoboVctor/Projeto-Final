export type FeedbackType = 'success' | 'error' | 'warning';

export interface FeedbackMessage {
  type: FeedbackType;
  message: string;
}
