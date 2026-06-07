import { Injectable, signal } from '@angular/core';
import { FeedbackMessage, FeedbackType } from '../models/feedback.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private queue: FeedbackMessage[] = [];
  public currentFeedback = signal<FeedbackMessage | null>(null);
  private timer: any = null;

  constructor() {}

  showSuccess(message: string) {
    this.addFeedback({ type: 'success', message });
  }

  showError(message: string) {
    this.addFeedback({ type: 'error', message });
  }

  showWarning(message: string) {
    this.addFeedback({ type: 'warning', message });
  }

  private addFeedback(feedback: FeedbackMessage) {
    this.queue.push(feedback);
    if (!this.currentFeedback()) {
      this.processQueue();
    }
  }

  private processQueue() {
    if (this.queue.length > 0) {
      const nextFeedback = this.queue.shift();
      if (nextFeedback) {
        this.currentFeedback.set(nextFeedback);
        this.startTimer();
      }
    } else {
      this.currentFeedback.set(null);
    }
  }

  private startTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      this.closeFeedback();
    }, 5000); // 5 seconds
  }

  closeFeedback() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.currentFeedback.set(null);
    
    // Pequeno delay para a animação de saída (se houver) antes de exibir o próximo
    setTimeout(() => {
      this.processQueue();
    }, 300);
  }
}
