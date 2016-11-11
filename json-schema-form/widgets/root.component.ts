import { Component, Input } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'root-widget',
  template: `
    <div *ngFor="let layoutItem of layout; let i = index; trackBy: item?.dataPointer"
      [layoutNode]="layoutItem"
      [formSettings]="formSettings"
      [dataIndex]="(dataIndex || []).concat(i)"
      [layoutIndex]="(layoutIndex || []).concat(i)"
      [orderable]="isOrderable !== false && layoutItem?.type !== '$ref' &&
        layoutItem?.arrayItem && layoutItem?.options?.arrayItemType === 'list'">

      <select-framework-widget
        [layoutNode]="layoutItem"
        [formSettings]="formSettings"
        [dataIndex]="layoutItem?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
        [layoutIndex]="(layoutIndex || []).concat(i)"></select-framework-widget>

    </div>`,
  styles: [`
    [draggable=true] {
      cursor: grab; cursor: -webkit-grab; cursor: -moz-grab; }
    [draggable=true]:hover {
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2); position: relative; z-index: 10; }
    [draggable=true].dragging {
      cursor: grabbing; cursor: -webkit-grabbing; cursor: -moz-grabbing; }
    [draggable=true].drag-target-top {
      box-shadow: 0 -2px 0 #000; position: relative; z-index: 20; }
    [draggable=true].drag-target-bottom {
      box-shadow: 0 2px 0 #000; position: relative; z-index: 20; }
  `],
})
export class RootComponent {
  private options: any;
  @Input() layout: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
  @Input() isOrderable: boolean;
}
