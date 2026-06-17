import { Component, signal , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FeedbackAlertComponent } from './compartilhado/components/feedback-alert/feedback-alert.component';

@Component({
  selector: 'app-root',
  imports: [RouterModule, FeedbackAlertComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class App {
  protected readonly title = signal('web');
}
