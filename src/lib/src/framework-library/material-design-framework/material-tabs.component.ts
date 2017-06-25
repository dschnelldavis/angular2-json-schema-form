import { Component, Input, OnInit } from '@angular/core';

import { JsonSchemaFormService } from '../../json-schema-form.service';
import { JsonPointer } from '../../shared';

@Component({
  selector: 'material-tabs-widget',
  template: `
    <nav md-tab-nav-bar
      [attr.aria-label]="options?.label || options?.title"
      [style.width]="'100%'">
        <a *ngFor="let item of layoutNode?.items; let i = index"
          md-tab-link
          [active]="selectedItem === i"
          (click)="select(i)">
          <span *ngIf="showAddTab || item.type !== '$ref'"
            [innerHTML]="setTitle(item, i)"></span>
        </a>
    </nav>

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
export class MaterialTabsComponent implements OnInit {
  options: any;
  itemCount: number;
  selectedItem: number = 0;
  showAddTab: boolean = true;
  @Input() formID: number;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) { }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.itemCount = this.layoutNode.items.length - 1;
    this.updateControl();
  }

  select(index) {
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

  updateControl() {
    const lastItem = this.layoutNode.items[this.layoutNode.items.length - 1];
    if (lastItem.type === '$ref' &&
      this.itemCount >= (lastItem.options.maxItems || 1000000)
    ) {
      this.showAddTab = false;
    }
  }

  setTitle(item: any = null, index: number = null): string {
    return this.jsf.setTitle(this, item, index);
  }
}
