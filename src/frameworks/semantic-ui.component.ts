import {
  ChangeDetectorRef, Component, Input, OnChanges, OnInit
} from '@angular/core';

import { JsonSchemaFormService } from '../library/json-schema-form.service';

@Component({
  selector: 'semantic-ui-framework',
  template: `
    <select-widget-widget
      [layoutNode]="layoutNode"
      [dataIndex]="dataIndex"
      [layoutIndex]="layoutIndex"></select-widget-widget>`,
})
export class SemanticUIComponent implements OnInit, OnChanges {
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private changeDetector: ChangeDetectorRef,
    private jsf: JsonSchemaFormService
  ) {}

  ngOnInit() {}

  ngOnChanges() {}
}
