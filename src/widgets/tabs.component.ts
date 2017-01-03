import { Component, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../library/json-schema-form.service';
import { JsonPointer } from '../library/utilities/index';

@Component({
  selector: 'tabs-widget',
  template: `
    <ul
      [class]="options?.labelHtmlClass">
      <li *ngFor="let item of layoutNode?.items; let i = index"
        [class]="options?.itemLabelHtmlClass + (selectedItem === i ?
          (' ' + options?.activeClass + ' ' + options?.style?.selected) :
          (' ' + options?.style?.unselected))"
        role="presentation"
        data-tabs>
        <a *ngIf="showAddTab || item.type !== '$ref'"
          [innerHTML]="setTitle(item, i)"
          (click)="select(i)"></a>
      </li>
    </ul>

    <div *ngFor="let layoutItem of layoutNode?.items; let i = index"
      [class]="options?.htmlClass">

      <select-framework-widget *ngIf="selectedItem === i"
        [class]="options?.fieldHtmlClass + ' ' + options?.activeClass + ' ' + options?.style?.selected"
        [dataIndex]="layoutNode?.dataType === 'array' ? (dataIndex || []).concat(i) : dataIndex"
        [layoutIndex]="(layoutIndex || []).concat(i)"
        [layoutNode]="layoutItem"></select-framework-widget>

    </div>`,
  styles: [`a { cursor: pointer; }`],
})
export class TabsComponent implements OnInit {
  private options: any;
  private itemCount: number;
  private selectedItem: number = 0;
  private showAddTab: boolean = true;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options;
    this.itemCount = this.layoutNode.items.length - 1;
    this.updateControl();
  }

  private select(index) {
    if (this.layoutNode.items[index].type === '$ref') {
      this.itemCount = this.layoutNode.items.length;
      this.jsf.addItem({
        formID: this.formID,
        layoutNode: this.layoutNode.items[index],
        layoutIndex: this.layoutIndex.concat(index),
        dataIndex: this.dataIndex.concat(index)
      });
      this.updateControl();
    };
    this.selectedItem = index;
  }

  private updateControl() {
    const lastItem = this.layoutNode.items[this.layoutNode.items.length - 1];
    if (lastItem.type === '$ref' &&
      this.itemCount >= (lastItem.options.maxItems || 1000000)
    ) {
      this.showAddTab = false;
    }
  }

  private setTitle(item: any = null, index: number = null): string {
    return this.jsf.setTitle(this, item, index);
  }
}
