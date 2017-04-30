import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../library/json-schema-form.service';

@Component({
    selector: 'button-widget',
    template: `
    <div
      [class]="options?.htmlClass">
      <button
        [attr.readonly]="options?.readonly ? 'readonly' : null"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [class]="options?.fieldHtmlClass"
        [disabled]="controlDisabled"
        [name]="controlName"
        [type]="layoutNode?.type"
        [value]="controlValue"
        (click)="updateValue($event)">
        <span *ngIf="options?.icon || options?.title"
          [class]="options?.icon"
          [innerHTML]="options?.title"></span>
      </button>
    </div>`,
})
export class ButtonComponent implements OnInit {
    private formControl: AbstractControl;
    private boundControl: boolean = false;
    public controlDisabled: boolean = false;
    public controlName: string;
    public controlValue: any;
    public options: any;
    @Input() formID: number;
    @Input() layoutNode: any;
    @Input() layoutIndex: number[];
    @Input() dataIndex: number[];

    constructor(
        private jsf: JsonSchemaFormService
    ) { }

    ngOnInit() {
        this.options = this.layoutNode.options;
        this.jsf.initializeControl(this);
    }

    public updateValue(event) {
        if (typeof this.options.onClick === 'function') {
            this.options.onClick(event);
        } else {
            this.jsf.updateValue(this, event.target.value);
        }
    }
}
