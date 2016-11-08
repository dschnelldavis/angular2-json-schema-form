import { Component, Input } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'select-widget-widget',
  template: `
    <select-component-widget
      [displayComponent]="layoutNode?.widget"
      [layoutNode]="layoutNode"
      [formSettings]="formSettings"
      [layoutIndex]="layoutIndex"
      [dataIndex]="dataIndex"></select-component-widget>`,
})
export class SelectWidgetComponent {
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
}
