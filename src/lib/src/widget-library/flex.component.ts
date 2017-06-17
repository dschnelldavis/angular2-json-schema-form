import { Component, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';

@Component({
  selector: 'flex-widget',
  template: `
    <div
      [class]="options?.htmlClass"
      [style.display]="'flex'"
      [style.flex-direction]="getFlexDirection()"
      [style.flex-wrap]="getFlexWrap()"
      [style.justify-content]="options['justify-content']"
      [style.align-items]="options['align-items']"
      [style.align-content]="options['align-content']">

      <label *ngIf="options?.title"
        [class]="options?.labelHtmlClass"
        [style.display]="options?.notitle ? 'none' : ''"
        [innerHTML]="options?.title"
        (click)="expand()"></label>

      <div *ngFor="let layoutItem of layoutNode.items; let i = index"
        [class]="layoutItem.options?.htmlClass"
        [style.order]="layoutItem.order"
        [style.flex-grow]="getFlexGrow(layoutItem)"
        [style.flex-shrink]="getFlexShrink(layoutItem)"
        [style.flex-basis]="getFlexBasis(layoutItem)"
        [style.align-self]="layoutItem['align-self']">
      <!-- [dataIndex]="layoutItem?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
      [layoutIndex]="(layoutIndex || []).concat(i)"
      [layoutNode]="layoutItem"> -->
      <!-- && (layoutNode.items[layoutNode.items.length - 1].tupleItems || 0 < (layoutNode.items.length - 2)) -->

        <select-framework-widget
          [formID]="formID"
          [dataIndex]="layoutItem?.arrayItem ? (dataIndex || []).concat(i) : (dataIndex || [])"
          [layoutIndex]="(layoutIndex || []).concat(i)"
          [layoutNode]="layoutItem"></select-framework-widget>

      </div>
    </div>`,
})
export class FlexComponent implements OnInit {
  options: any;
  expanded: boolean = true;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options;
  }

  getFlexDirection(): string {
    return (this.options['flex-flow'] || '').split(' ')[0] ||
      this.options['flex-direction'] || 'row';
  }

  getFlexWrap(): string {
    return (this.options['flex-flow'] || '').split(' ')[1] ||
      this.options['flex-wrap'] || 'nowrap';
  }

  getFlexGrow(node: any): string {
    return (node.options.flex || '').split(' ')[0] ||
      node.options['flex-grow'] || '1';
  }

  getFlexShrink(node: any): string {
    return (node.options.flex || '').split(' ')[1] ||
      node.options['flex-shrink'] || '1';
  }

  getFlexBasis(node: any): string {
    return (node.options.flex || '').split(' ')[2] ||
      node.options['flex-basis'] || 'auto';
  }

  trackByItem(layoutItem: any) { return layoutItem && layoutItem._id; }
}
