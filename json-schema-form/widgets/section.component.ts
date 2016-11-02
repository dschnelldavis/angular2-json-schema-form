import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'section-widget',
  template: `
    <div [class]="layoutNode?.htmlClass">
      <label *ngIf="layoutNode?.title" [attr.for]="layoutNode?.pointer"
        [class]="layoutNode?.labelHtmlClass" [class.sr-only]="layoutNode?.notitle"
        [innerHTML]="layoutNode?.title"></label>

      <div *ngFor="let item of layoutNode?.items; let i = index; trackBy: item?.pointer">
        <root-widget
          [layoutNode]="item"
          [options]="options"
          [index]="index.concat(i)"
          [debug]="debug"></root-widget>
      </div>

    </div>`,
})
export class SectionComponent {
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;
}
