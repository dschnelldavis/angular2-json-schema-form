import {Component, Input, OnInit} from '@angular/core';

import {JsonSchemaFormService} from '../json-schema-form.service';

@Component({
  selector: 'tabs-widget',
  template: `
    <ul
      [class]="options?.labelHtmlClass || ''">
      <li *ngFor="let item of layoutNode?.items; let i = index"
          [class]="(options?.itemLabelHtmlClass || '') + (selectedItem === i ?
          (' ' + (options?.activeClass || '') + ' ' + (options?.style?.selected || '')) :
          (' ' + options?.style?.unselected))"
          role="presentation"
          data-tabs>
        <a *ngIf="showAddTab || item.type !== '$ref'"
           [class]="'nav-link' + (selectedItem === i ? (' ' + options?.activeClass + ' ' + options?.style?.selected) :
            (' ' + options?.style?.unselected))"
           [innerHTML]="setTabTitle(item, i)"
           (click)="select(i)"></a>
      </li>
    </ul>

    <div *ngFor="let layoutItem of layoutNode?.items; let i = index"
         [class]="options?.htmlClass || ''">

      <select-framework-widget *ngIf="selectedItem === i"
                               [class]="(options?.fieldHtmlClass || '') +
          ' ' + (options?.activeClass || '') +
          ' ' + (options?.style?.selected || '')"
                               [dataIndex]="layoutNode?.dataType === 'array' ? (dataIndex || []).concat(i) : dataIndex"
                               [layoutIndex]="(layoutIndex || []).concat(i)"
                               [layoutNode]="layoutItem"></select-framework-widget>

    </div>
    <div class='stepper-buttons'>
      <button *ngIf="options?.previous && selectedItem > 0"
              [class]="options?.previous.fieldHtmlClass" (click)="selectPrevious()">
        {{options?.previous.title}}
      </button>
      <button *ngIf="options?.next && layoutNode.items.length > selectedItem + 1"
              [class]="options?.next.fieldHtmlClass" (click)="selectNext()">
        {{options?.next.title}}
      </button>
      <ng-container *ngFor='let item of options?.buttons?.items'>
        <button *ngIf="item.shows === undefined || item.shows?.indexOf(selectedItem) >= 0
          || (item.shows?.indexOf(-1) >= 0 && layoutNode.items.length === selectedItem + 1)"
                [class]="item.fieldHtmlClass" (click)="doAction(item.action)">
          {{item.title}}
        </button>
      </ng-container>
    </div>`,
  styles: [` a {
    cursor: pointer;
  } `],
})
export class TabsComponent implements OnInit {
  options: any;
  itemCount: number;
  selectedItem = 0;
  showAddTab = true;
  @Input() layoutNode: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  constructor(
    private jsf: JsonSchemaFormService
  ) {
  }

  ngOnInit() {
    this.options = this.layoutNode.options || {};
    this.itemCount = this.layoutNode.items.length - 1;
    this.updateControl();
  }

  select(index) {
    if (this.layoutNode.items[index].type === '$ref') {
      this.itemCount = this.layoutNode.items.length;
      this.jsf.addItem({
        layoutNode: this.layoutNode.items[index],
        layoutIndex: this.layoutIndex.concat(index),
        dataIndex: this.dataIndex.concat(index)
      });
      this.updateControl();
    }
    ;
    this.selectedItem = index;
  }

  updateControl() {
    const lastItem = this.layoutNode.items[this.layoutNode.items.length - 1];
    if (lastItem.type === '$ref' &&
      this.itemCount >= (lastItem.options.maxItems || 1000)
    ) {
      this.showAddTab = false;
    }
  }

  setTabTitle(item: any, index: number): string {
    return this.jsf.setArrayItemTitle(this, item, index);
  }

  selectNext() {
    const nextItem = this.selectedItem + 1;
    if (nextItem < this.layoutNode.items.length) {
      this.select(nextItem);
    }
  }

  selectPrevious() {
    if (this.selectedItem > 0) {
      this.select(this.selectedItem - 1);
    }
  }

  updateValue(item, event) {
    if (typeof item.onClick === 'function') {
      item.onClick(event);
    } else {
      this.jsf.updateValue(item, event.target.value);
    }
  }

  doAction(actionCode) {
    this.jsf.doAction(actionCode);
  }
}
