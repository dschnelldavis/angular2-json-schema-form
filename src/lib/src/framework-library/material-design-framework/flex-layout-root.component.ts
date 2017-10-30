import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { isDefined, JsonPointer } from '../../shared';

@Component({
  selector: 'flex-layout-root-widget',
  template: `
    <div *ngFor="let layoutNode of layout; let i = index"
      [class.form-flex-item]="isFlexItem"
      [style.flex-grow]="getFlexAttribute(layoutNode, 'flex-grow')"
      [style.flex-shrink]="getFlexAttribute(layoutNode, 'flex-shrink')"
      [style.flex-basis]="getFlexAttribute(layoutNode, 'flex-basis')"
      [style.align-self]="(layoutNode?.options || {})['align-self']"
      [style.order]="layoutNode?.options?.order"
      [fxFlex]="layoutNode?.options?.fxFlex"
      [fxFlexOrder]="layoutNode?.options?.fxFlexOrder"
      [fxFlexOffset]="layoutNode?.options?.fxFlexOffset"
      [fxFlexAlign]="layoutNode?.options?.fxFlexAlign">
      <select-framework-widget *ngIf="isConditionallyShown(layoutNode)"
        [dataIndex]="layoutNode?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
        [layoutIndex]="(layoutIndex || []).concat(i)"
        [layoutNode]="layoutNode"></select-framework-widget>
    <div>`,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FlexLayoutRootComponent implements OnInit {
  @Input() dataIndex: number[];
  @Input() layoutIndex: number[];
  @Input() layout: any[];
  @Input() isFlexItem: boolean = false;

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() { }

  // Set attributes for flexbox child
  // (container attributes are set in flex-layout-section.component)
  getFlexAttribute(node: any, attribute: string) {
    if (!node || !attribute) { return null; }
    const index = ['flex-grow', 'flex-shrink', 'flex-basis'].indexOf(attribute);
    const options = node.options || {};
    return (options.flex || '').split(/\s+/)[index] || options[attribute] ||
      ['1', '1', 'auto'][index];
  }

  trackByItem(layoutNode: any) {
    return (layoutNode || {})._id;
  }

  removeItem(item) {
    this.jsf.removeItem(item);
  }

  isConditionallyShown(layoutNode: any): boolean {
    const arrayIndex = this.dataIndex[this.dataIndex.length - 1];
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
      }
    }
    return result;
  }
}
