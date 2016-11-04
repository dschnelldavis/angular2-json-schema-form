import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'message-widget',
  template: `
    <span *ngIf="message" [class]="options?.labelHtmlClass"
      [innerHTML]="message"></span>`,
})
export class MessageComponent implements OnInit {
  private options: any;
  private message: string = null;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.message = this.options.help || this.options.helpvalue ||
      this.options.msg || this.options.message;
  }
}
