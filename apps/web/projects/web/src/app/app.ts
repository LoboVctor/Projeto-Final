import { Component, signal , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FeedbackAlertComponent } from './compartilhado/components/feedback-alert/feedback-alert.component';
import { ConfirmacaoDialogComponent } from './compartilhado/components/confirmacao-dialog/confirmacao-dialog.component';

@Component({
  selector: 'app-root',
  imports: [RouterModule, FeedbackAlertComponent, ConfirmacaoDialogComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class App {
  protected readonly title = signal('web');
}
