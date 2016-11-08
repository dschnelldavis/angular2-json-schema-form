import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  moduleId: module.id,
  selector: 'root-widget',
  template: `
    <div *ngFor="let layoutItem of layout; let i = index; trackBy: item?.dataPointer">
      <select-framework-widget
        [layoutNode]="layoutItem"
        [formSettings]="formSettings"
        [dataIndex]="incrementDataIndex ? (dataIndex || []).concat(i) : (dataIndex || [])"
        [layoutIndex]="(layoutIndex || []).concat(i)"></select-framework-widget>
    </div>
  `,
})
export class RootComponent {
  @Input() layout: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
  @Input() incrementDataIndex: boolean;
}
