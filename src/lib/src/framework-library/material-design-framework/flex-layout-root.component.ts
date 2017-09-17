import { Component, Input } from '@angular/core';

import { JsonSchemaFormService } from '../../json-schema-form.service';

@Component({
  selector: 'flex-layout-root-widget',
  template: `
    <div *ngFor="let layoutItem of layout; let i = index"
      [class.form-flex-item]="isFlexItem"
      [style.flex-grow]="getFlexAttribute(layoutItem, 'flex-grow')"
      [style.flex-shrink]="getFlexAttribute(layoutItem, 'flex-shrink')"
      [style.flex-basis]="getFlexAttribute(layoutItem, 'flex-basis')"
      [style.align-self]="(layoutItem.options || {})['align-self']"
      [style.order]="(layoutItem.options || {}).order"
      [fxFlex]="(layoutItem.options || {}).fxFlex"
      [fxFlexOrder]="(layoutItem.options || {}).fxFlexOrder"
      [fxFlexOffset]="(layoutItem.options || {}).fxFlexOffset"
      [fxFlexAlign]="(layoutItem.options || {}).fxFlexAlign">
      <div
        [class.array-item]="layoutItem.arrayItem && layoutItem.type !== '$ref'"
        [orderable]="isDraggable(layoutItem)"
        [formID]="formID"
        [dataIndex]="layoutItem?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
        [layoutIndex]="(layoutIndex || []).concat(i)"
        [layoutNode]="layoutItem">
        <div *ngIf="layoutItem.options.removable"
          class="close-button"
          (click)="removeItem({
            dataIndex: layoutItem.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || []),
            layoutIndex: (layoutIndex || []).concat(i),
            layoutNode: layoutItem
          })">x</div>
        <select-framework-widget
          [formID]="formID"
          [dataIndex]="layoutItem?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
          [layoutIndex]="(layoutIndex || []).concat(i)"
          [layoutNode]="layoutItem"></select-framework-widget>
      </div>
      <div class="spacer" *ngIf="layoutItem.arrayItem && layoutItem.type !== '$ref'"></div>
    <div>`,
  styles: [`
    .array-item {
      border-radius: 2px;
      box-shadow: 0 3px 1px -2px rgba(0,0,0,.2),
                  0 2px 2px 0 rgba(0,0,0,.14),
                  0 1px 5px 0 rgba(0,0,0,.12);
      padding: 6px;
      position: relative;
      transition: all 280ms cubic-bezier(.4, 0, .2, 1);
    }
    .close-button {
      position: absolute;
      top: 0;
      right: 0;
      padding: 0 5px;
      visibility: hidden;
    }
    .array-item:hover > .close-button { visibility: visible; }
    .close-button:hover { cursor: pointer; font-weight: bold; }
    .spacer { margin: 6px 0; }
    [draggable=true]:hover {
      box-shadow: 0 5px 5px -3px rgba(0,0,0,.2),
                  0 8px 10px 1px rgba(0,0,0,.14),
                  0 3px 14px 2px rgba(0,0,0,.12);
      cursor: move;
      z-index: 10;
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
export class FlexLayoutRootComponent {
  options: any;
  @Input() formID: number;
  @Input() dataIndex: number[];
  @Input() layoutIndex: number[];
  @Input() layout: any[];
  @Input() isOrderable: boolean;
  @Input() isFlexItem: boolean = false;

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  isDraggable(node: any): boolean {
    return this.isOrderable !== false && node.type !== '$ref' &&
      node.arrayItem && (node.options || {}).arrayItemType === 'list';
      // && (this.layout[this.layout.length - 1].tupleItems || this.layout.length > 2);
  }

  // Set attributes for flexbox child
  // (container attributes are set in flex-layout-section.component)
  getFlexAttribute(node: any, attribute: string) {
    const index = ['flex-grow', 'flex-shrink', 'flex-basis'].indexOf(attribute);
    return ((node.options || {}).flex || '').split(/\s+/)[index] ||
      (node.options || {})[attribute] || ['1', '1', 'auto'][index];
  }

  trackByItem(layoutItem: any) {
    return (layoutItem || {})._id;
  }

  removeItem(item) {
    this.jsf.removeItem(item);
  }
}
