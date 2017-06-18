import { Component, Input } from '@angular/core';

@Component({
  selector: 'root-widget',
  template: `
    <div *ngFor="let layoutItem of layout; let i = index"
      [orderable]="isDraggable(layoutItem)"
      [formID]="formID"
      [dataIndex]="layoutItem?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
      [layoutIndex]="(layoutIndex || []).concat(i)"
      [layoutNode]="layoutItem">

      <select-framework-widget
        [formID]="formID"
        [dataIndex]="layoutItem?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
        [layoutIndex]="(layoutIndex || []).concat(i)"
        [layoutNode]="layoutItem"></select-framework-widget>

    </div>`,
  styles: [`
    [draggable=true] { cursor: move; }
    [draggable=true]:hover {
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      position: relative; z-index: 10;
      margin-top: -4px;
      margin-left: -4px;
      margin-right: 2px;
      margin-bottom: 2px;
      border-top: 1px solid #eee;
      border-left: 1px solid #eee;
    }
    [draggable=true].drag-target-top {
      box-shadow: 0 -2px 0 #000;
      position: relative; z-index: 20;
    }
    [draggable=true].drag-target-bottom {
      box-shadow: 0 2px 0 #000;
      position: relative; z-index: 20;
    }
  `],
})
export class RootComponent {
  options: any;
  @Input() formID: number;
  @Input() dataIndex: number[];
  @Input() layoutIndex: number[];
  @Input() layout: any[];
  @Input() isOrderable: boolean;

  isDraggable(node: any): boolean {
    return this.isOrderable !== false && node.type !== '$ref' &&
      node.arrayItem && node.options.arrayItemType === 'list';
      // && (this.layout[this.layout.length - 1].tupleItems || this.layout.length > 2);
  }

  trackByItem(layoutItem: any) {
    return layoutItem && layoutItem._id;
  }
}
