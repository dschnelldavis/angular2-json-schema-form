import { Component, Input, OnInit } from '@angular/core';

import { JsonPointer, parseText } from '../utilities/index';

@Component({
  selector: 'tabs-widget',
  template: `
    <ul
      [class]="options?.labelHtmlClass">
      <li *ngFor="let item of layoutNode?.items; let i = index; trackBy: item?.dataPointer"
        [class]="options?.itemLabelHtmlClass +
          (selectedItem === i ? ' ' + options?.activeClass : '')"
        role="presentation"
        data-tabs>
        <a
          [innerHTML]="setTitle(item, layoutNode, value, i)"
          (click)="select(i)"></a>
      </li>
    </ul>

    <div *ngFor="let layoutItem of layoutNode?.items; let i = index; trackBy: layoutItem?.dataPointer"
      [class]="options?.htmlClass">
      <select-framework-widget *ngIf="selectedItem === i"
        [class]="options?.fieldHtmlClass + ' ' + options?.activeClass"
        [layoutNode]="layoutItem"
        [formSettings]="formSettings"
        [dataIndex]="layoutNode?.dataType === 'array' ? dataIndex?.concat(i) : dataIndex"
        [layoutIndex]="layoutIndex?.concat(i)"></select-framework-widget>
    </div>`,
  styles: [`a { cursor: pointer; }`],
})
export class TabsComponent implements OnInit {
  private options: any;
  private selectedItem: number = 0;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
  }

  private setTitle(
    item: any = null, layoutNode: any, value: any, index: number = null
  ): string {
    let text: string;
    if (layoutNode.type.slice(-5) === 'array' && item.type !== '$ref') {
      text = JsonPointer.getFirst([
        [item, '/options/legend'],
        [item, '/options/title'],
        [item, '/title'],
        [layoutNode, '/options/title'],
        [layoutNode, '/options/legend'],
        [layoutNode, '/title'],
      ]);
    } else {
      text = JsonPointer.getFirst([
        [item, '/title'],
        [item, '/options/title'],
        [item, '/options/legend'],
        [layoutNode, '/title'],
        [layoutNode, '/options/title'],
        [layoutNode, '/options/legend']
      ]);
      if (item.type === '$ref') text = '+ ' + text;
    }
    if (!text) return text;
    if (layoutNode.type === 'tabarray' && Array.isArray(value)) {
      value = value[index];
    }
    return parseText(text, value, this.formSettings.formGroup.value, index);
  }

  private select(index) {
    this.selectedItem = index;
  }
}
