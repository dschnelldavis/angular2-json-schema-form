import { Component, Input } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'select-framework-widget',
  template: `
    <select-component-widget
      [displayComponent]="formSettings?.framework"
      [layoutNode]="layoutNode"
      [formSettings]="formSettings"
      [layoutIndex]="layoutIndex"
      [dataIndex]="dataIndex"></select-component-widget>`,
})
export class SelectFrameworkComponent {
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
}
