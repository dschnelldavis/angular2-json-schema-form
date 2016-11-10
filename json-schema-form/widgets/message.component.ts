import {
  ChangeDetectorRef, Component, Input, OnChanges, OnInit
} from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'message-widget',
  template: `
    <span *ngIf="message"
      [class]="options?.labelHtmlClass"
      [innerHTML]="message"></span>`,
})
export class MessageComponent implements OnInit {
  private options: any;
  private message: string = null;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.message = this.options.help || this.options.helpvalue ||
      this.options.msg || this.options.message;
  }
}
