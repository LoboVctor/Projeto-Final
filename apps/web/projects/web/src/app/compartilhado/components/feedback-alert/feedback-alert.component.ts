import { Component , ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-feedback-alert',
  imports: [NgClass],
  templateUrl: './feedback-alert.component.html',
  styleUrl: './feedback-alert.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class FeedbackAlertComponent {
  constructor(public feedbackService: FeedbackService) {}
}
