import { Component, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { Widget } from './widget';

@Component({
  selector: 'message-widget',
  template: `
    <span *ngIf="message"
      [class]="options?.labelHtmlClass || ''"
      [innerHTML]="message"></span>`,
})
export class MessageComponent extends Widget implements OnInit {
  message: string = null;

  constructor(jsf: JsonSchemaFormService) {
    super(jsf);
  }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.message = this.options.help || this.options.helpvalue ||
      this.options.msg || this.options.message;
  }
}
