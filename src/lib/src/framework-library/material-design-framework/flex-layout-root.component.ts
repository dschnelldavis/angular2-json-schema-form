import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { hasOwn } from '../../shared';

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
      <select-framework-widget *ngIf="isConditionallyShown(layoutNode, i)"
        [formID]="formID"
        [data]="data"
        [dataIndex]="layoutNode?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
        [layoutIndex]="(layoutIndex || []).concat(i)"
        [layoutNode]="layoutNode"></select-framework-widget>
    <div>`,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class FlexLayoutRootComponent implements OnInit {
  arrayIndex: number;
  @Input() formID: number;
  @Input() dataIndex: number[];
  @Input() layoutIndex: number[];
  @Input() layout: any[];
  @Input() isFlexItem: boolean = false;
  @Input() data: any;

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

  isConditionallyShown(layoutNode: any, arrayIndex: number): boolean {
    let result = true;
    if (this.data && hasOwn(layoutNode, 'options') &&
      hasOwn(layoutNode.options, 'condition')
    ) {
      const model = this.data;
      try {
        /* tslint:disable */
        eval('result = ' + layoutNode.options.condition);
        /* tslint:enable */
      } catch (error) {
        console.error('Error evaluating condition:');
        console.error(error);
      }
    }
    return result;
  }
}
