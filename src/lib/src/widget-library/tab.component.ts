import { Component, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { Widget } from './widget';

@Component({
  selector: 'tab-widget',
  template: `
    <div [class]="options?.htmlClass || ''">
      <root-widget
        [dataIndex]="dataIndex"
        [layoutIndex]="layoutIndex"
        [layout]="layoutNode.items"></root-widget>
    </div>`,
})
export class TabComponent extends Widget implements OnInit {
  constructor(jsf: JsonSchemaFormService) {
    super(jsf);
  }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
  }
}
