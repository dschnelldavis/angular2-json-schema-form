import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { JsonSchemaFormService } from '../library/json-schema-form.service';

@Component({
    selector: 'button-widget',
    template: `
    <div
      [class]="buttonLayoutOptions?.htmlClass">
      <button
        [attr.readonly]="buttonLayoutOptions?.readonly ? 'readonly' : null"
        [attr.aria-describedby]="'control' + layoutNode?._id + 'Status'"
        [class]="buttonLayoutOptions?.fieldHtmlClass"
        [disabled]="controlDisabled"
        [name]="controlName"
        [type]="layoutNode?.type"
        [value]="controlValue"
        (click)="updateValue($event)">
        <span *ngIf="buttonLayoutOptions?.icon || buttonLayoutOptions?.title"
          [class]="buttonLayoutOptions?.icon"
          [innerHTML]="buttonLayoutOptions?.title"></span>
      </button>
    </div>`,
})
export class ButtonComponent implements OnInit {
    private formControl: AbstractControl;
    private boundControl: boolean = false;
    private buttonLayoutOptions: any;
    public controlDisabled: boolean = false;
    public controlName: string;
    public controlValue: any;
    @Input() formID: number;
    @Input() layoutNode: any;
    @Input() layoutIndex: number[];
    @Input() dataIndex: number[];

    constructor(
        private jsf: JsonSchemaFormService
    ) { }

    ngOnInit() {
        this.buttonLayoutOptions = this.layoutNode.options;
        this.jsf.initializeControl(this);
    }

    public updateValue(event) {
        if (typeof this.buttonLayoutOptions.onClick === 'function') {
            this.buttonLayoutOptions.onClick(event);
        } else {
            this.jsf.updateValue(this, event.target.value);
        }
    }

    public get options() {
        return this.buttonLayoutOptions;
    }
}
