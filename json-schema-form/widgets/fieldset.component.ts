import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'fieldset-widget',
  template: `
    <fieldset [class]="options?.htmlClass" [disabled]="options?.readonly">
      <legend *ngIf="options?.title" [class]="options?.labelHtmlClass"
        [class.sr-only]="options?.notitle" [innerHTML]="options?.title"></legend>

      <div *ngFor="let item of options?.items; let i = index; trackBy: item?.dataPointer">
        <root-widget
          [layoutNode]="item"
          [formSettings]="formSettings"
          [index]="index.concat(i)"
          [debug]="debug"></root-widget>
      </div>

    </fieldset>`,
})
export class FieldsetComponent implements OnInit {
  private options: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];
  @Input() debug: boolean;

  ngOnInit() {
    this.options = this.layoutNode.options;
  }
}
