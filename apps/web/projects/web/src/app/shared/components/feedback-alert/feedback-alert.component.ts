import { Component } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-feedback-alert',
  standalone: true,
  imports: [NgClass, NgIf],
  templateUrl: './feedback-alert.component.html',
  styleUrl: './feedback-alert.component.css'
})
export class FeedbackAlertComponent {
  constructor(public feedbackService: FeedbackService) {}
}
