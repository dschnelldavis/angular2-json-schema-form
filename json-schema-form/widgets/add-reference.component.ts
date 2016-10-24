import {
  Component, ComponentFactoryResolver, ComponentRef,
  Input, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/index';

@Component({
  selector: 'add-reference-widget',
  template: `
    <div #widgetContainer></div>
    <button
      [class]="layoutNode?.fieldHtmlClass"
      [disabled]="layoutNode?.readonly"
      (click)="addReferencedItem()">
      <span *ngIf="layoutNode?.icon" class="{{layoutNode?.icon}}"></span>
      {{layoutNode?.title}}
    </button>`,
})
export class AddReferenceComponent {
  private formControlGroup: any;
  @Input() formGroup: FormGroup;
  @Input() layoutNode: any;
  @Input() formOptions: any;
  @Input() debug: boolean;
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    private widgetContainer: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
  ) {}

  private addReferencedItem() {

  }
}
