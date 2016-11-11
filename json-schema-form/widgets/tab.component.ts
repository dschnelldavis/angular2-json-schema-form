import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'tab-widget',
  template: `
    <div
      [class]="options?.htmlClass">
      <root-widget *ngIf="expanded"
        [layout]="layoutNode.items"
        [formSettings]="formSettings"
        [dataIndex]="dataIndex"
        [layoutIndex]="layoutIndex"
        [isOrderable]="options?.orderable"></root-widget>
    </div>`,
})
export class TabComponent implements OnInit {
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
  }
}
