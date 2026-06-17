import { Component , ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-calendario',
  template: `<h1 class="text-2xl font-bold">Calendário</h1>`
,
  changeDetection: ChangeDetectionStrategy.OnPush })
export class CalendarioComponent {}
