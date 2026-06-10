import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FeedbackAlertComponent } from './shared/components/feedback-alert/feedback-alert.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, FeedbackAlertComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('web');
}
