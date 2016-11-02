import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'message-widget',
  template: `
    <span *ngIf="message" [class]="layoutNode.labelHtmlClass"
      [innerHTML]="message"></span>`,
})
export class MessageComponent implements OnInit {
  private message: string = null;
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    this.message = this.layoutNode.help || this.layoutNode.helpvalue ||
      this.layoutNode.msg || this.layoutNode.message;
  }
}
