import {
  Component, ComponentFactoryResolver, ComponentRef, Input,
  AfterContentChecked, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'none-framework',
  template: `
  <div class="schema-form-{{layoutNode?.type}} {{options?.htmlClass}}">
    <label *ngIf="layoutNode?.dataPointer && !options?.notitle"
      class="{{layoutNode.labelHtmlClass}}"
      [attr.for]="layoutNode?.dataPointer">{{options?.title || layoutNode?.name}}</label>
    <div #widgetContainer></div>
  </div>`
})
export class NoFrameworkComponent implements AfterContentChecked {
  private controlInitialized: boolean = false;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() index: number[];
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    private widgetContainer: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
  ) { }

  ngAfterContentChecked() {
    if (
        this.widgetContainer && !this.widgetContainer.length &&
        this.layoutNode && this.layoutNode.widget
    ) {
      let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.layoutNode.widget)
      );
      for (let input of ['layoutNode', 'formSettings', 'index']) {
        addedNode.instance[input] = this[input];
      }
    }
    this.controlInitialized = true;
  }
}
