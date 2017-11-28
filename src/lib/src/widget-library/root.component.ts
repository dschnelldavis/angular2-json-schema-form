import { Component, Input, Host } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { isDefined, JsonPointer } from '../shared';

@Component({
  selector: 'root-widget',
  template: `
    <div *ngFor="let layoutItem of layout; let i = index"
      [class.form-flex-item]="isFlexItem"
      [style.align-self]="(layoutItem.options || {})['align-self']"
      [style.flex-basis]="getFlexAttribute(layoutItem, 'flex-basis')"
      [style.flex-grow]="getFlexAttribute(layoutItem, 'flex-grow')"
      [style.flex-shrink]="getFlexAttribute(layoutItem, 'flex-shrink')"
      [style.order]="(layoutItem.options || {}).order">
      <div
        [dataIndex]="layoutItem?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
        [layoutIndex]="(layoutIndex || []).concat(i)"
        [layoutNode]="layoutItem"
        [orderable]="isDraggable(layoutItem)">
        <select-framework-widget *ngIf="isConditionallyShown(layoutItem)"
          [dataIndex]="layoutItem?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
          [layoutIndex]="(layoutIndex || []).concat(i)"
          [layoutNode]="layoutItem"></select-framework-widget>
      </div>
    </div>`,
  styles: [`
    [draggable=true] {
      transition: all 150ms cubic-bezier(.4, 0, .2, 1);
    }
    [draggable=true]:hover {
      cursor: move;
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
      position: relative; z-index: 10;
      margin-top: -1px;
      margin-left: -1px;
      margin-right: 1px;
      margin-bottom: 1px;
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
  @Input() dataIndex: number[];
  @Input() layoutIndex: number[];
  @Input() layout: any[];
  @Input() isOrderable: boolean;
  @Input() isFlexItem = false;

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  isDraggable(node: any): boolean {
    return node.arrayItem && node.type !== '$ref' &&
      node.arrayItemType === 'list' && this.isOrderable !== false;
  }

  // Set attributes for flexbox child
  // (container attributes are set in section.component)
  getFlexAttribute(node: any, attribute: string) {
    const index = ['flex-grow', 'flex-shrink', 'flex-basis'].indexOf(attribute);
    return ((node.options || {}).flex || '').split(/\s+/)[index] ||
      (node.options || {})[attribute] || ['1', '1', 'auto'][index];
  }

  trackByItem(layoutItem: any) {
    return layoutItem && layoutItem._id;
  }

  isConditionallyShown(layoutNode: any): boolean {
    const arrayIndex = this.dataIndex && this.dataIndex[this.dataIndex.length - 1];
    let result = true;
    if (isDefined((layoutNode.options || {}).condition)) {
      if (typeof layoutNode.options.condition === 'string') {
        let pointer = layoutNode.options.condition
        if (isDefined(arrayIndex)) {
          pointer = pointer.replace('[arrayIndex]', `[${arrayIndex}]`);
        }
        pointer = JsonPointer.parseObjectPath(pointer);
        result = !!JsonPointer.get(this.jsf.data, pointer);
        if (!result && pointer[0] === 'model') {
          result = !!JsonPointer.get({ model: this.jsf.data }, pointer);
        }
      } else if (typeof layoutNode.options.condition === 'function') {
        result = layoutNode.options.condition(this.jsf.data);
      } else if (typeof layoutNode.options.condition.functionBody === 'string') {
        try {
          const dynFn = new Function("model", "arrayIndices", layoutNode.options.condition.functionBody);
          result = dynFn(this.jsf.data, this.dataIndex);
        } catch (e) {
          result = true;
          console.log("condition functionBody errored out on evaluation: " + layoutNode.options.condition.functionBody);
        }
      }
    }
    return result;
  }
}
