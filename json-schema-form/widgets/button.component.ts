import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'button-widget',
  template: `
    <div [formGroup]="formGroup"
      class="form-group schema-form-submit {{layoutNode?.htmlClass}}">
      <button *ngIf="!!layoutNode?.key"
        [formControlName]="layoutNode?.name"
        class="btn {{ layoutNode?.style || 'btn-default' }}"
        [type]="layoutNode?.type"
        [disabled]="layoutNode?.readonly">
        <span ng-if="layoutNode?.icon" class="{{layoutNode?.icon}}"></span>
        {{layoutNode?.title || layoutNode?.name}}
      </button>
      <button *ngIf="!layoutNode?.key"
        class="btn {{ layoutNode?.style || 'btn-default' }}"
        [type]="layoutNode?.type"
        [disabled]="layoutNode?.readonly">
        <span ng-if="layoutNode?.icon" class="{{layoutNode?.icon}}"></span>
        {{layoutNode?.title || layoutNode?.name}}
      </button>
    </div>
`,
})
export class ButtonComponent {
  @Input() formGroup: FormGroup; // parent FormGroup
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formOptions: any; // Global form defaults and options
}
