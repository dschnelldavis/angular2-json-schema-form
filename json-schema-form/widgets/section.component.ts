import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'section-widget',
  template: `
    <div [class]="options?.htmlClass">
      <label *ngIf="options?.title" [attr.for]="layoutNode?.dataPointer"
        [class]="options?.labelHtmlClass" [class.sr-only]="options?.notitle"
        [innerHTML]="options?.title"></label>

      <div *ngFor="let item of layoutNode?.items; let i = index; trackBy: item?.dataPointer">
        <root-widget
          [layoutNode]="item"
          [formSettings]="formSettings"
          [layoutIndex]="layoutIndex.concat(i)"
          [dataIndex]="dataIndex"></root-widget>
      </div>

    </div>`,
})
export class SectionComponent implements OnInit {
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];

  ngOnInit() {
    this.options = this.layoutNode.options;
  }
}
