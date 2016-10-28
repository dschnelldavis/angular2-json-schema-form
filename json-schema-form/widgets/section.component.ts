import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'section-widget',
  template: `
    <div [class]="layoutNode?.htmlClass">
      <label *ngIf="layoutNode?.title" [attr.for]="layoutNode?.pointer"
        [class]="layoutNode?.labelHtmlClass" [class.sr-only]="layoutNode?.notitle"
        [innerHTML]="layoutNode?.title"></label>

      <div *ngFor="let item of layoutNode?.items; let index = index; trackBy: item?.pointer">
        <root-widget
          [layoutNode]="item"
          [formGroup]="formGroup"
          [formOptions]="formOptions"
          [index]="index"
          [debug]="debug"></root-widget>
      </div>

    </div>`,
})
export class SectionComponent {
  @Input() layoutNode: any;
  @Input() formGroup: FormGroup;
  @Input() formOptions: any;
  @Input() index: number[];
  @Input() debug: boolean;
}
