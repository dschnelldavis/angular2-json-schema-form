import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'tabarray-widget',
  template: `
    <ul
      [class]="options?.labelHtmlClass">
      <li *ngFor="let item of layoutNode?.items; let $index = index; trackBy: item?.dataPointer"
        [class]="options?.itemLabelHtmlClass +
          (selectedItem === $index ? ' ' + options?.activeClass : '')"
        role="presentation"
        data-tabs>
        <a
          [innerHTML]="options?.title"
          (click)="select($index)"></a>
      </li>
    </ul>

    <div *ngFor="let item of layoutNode?.items; let $index = index; trackBy: item?.dataPointer"
      [class]="options?.htmlClass">
      <root-widget *ngIf="selectedItem === $index"
        [layoutNode]="item"
        [formSettings]="formSettings"
        [dataIndex]="layoutNode?.items === 'tabarray' ? dataIndex.concat($index) : dataIndex"
        [layoutIndex]="layoutIndex.concat($index)"></root-widget>
    </div>`,
  styles: [`
    a { cursor: pointer; }
  `],
})
export class TabarrayComponent implements OnInit {
  private options: any;
  private value: any;
  private selectedItem: number = 0;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
  }

  private select(index) {
    this.selectedItem = index;
  }
}
