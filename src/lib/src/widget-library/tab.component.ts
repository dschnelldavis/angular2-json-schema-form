import { Component, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';

@Component({
  selector: 'tab-widget',
  template: `
    <div
      [class]="options?.htmlClass">
      <root-widget
        [formID]="formID"
        [layout]="layoutNode.items"
        [dataIndex]="dataIndex"
        [layoutIndex]="layoutIndex"></root-widget>
    </div>`,
})
export class TabComponent implements OnInit {
  options: any;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
  }
}
