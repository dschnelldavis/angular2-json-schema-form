import {
  ChangeDetectorRef, Component, Input, OnChanges, OnInit
} from '@angular/core';

import { JsonSchemaFormService } from '../library/json-schema-form.service';

@Component({
  selector: 'bootstrap-4-framework',
  template: `
    <select-widget-widget
      [formID]="formID"
      [layoutNode]="layoutNode"
      [dataIndex]="dataIndex"
      [layoutIndex]="layoutIndex"></select-widget-widget>`,
})
export class Bootstrap4Component implements OnInit, OnChanges {
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private changeDetector: ChangeDetectorRef,
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() { }

  ngOnChanges() { }
}
