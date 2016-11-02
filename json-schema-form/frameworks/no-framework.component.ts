import {
  Component, ComponentFactoryResolver, ComponentRef, Input,
  AfterContentChecked, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'none-framework',
  template: `
  <div class="schema-form-{{layoutNode?.type}} {{layoutNode?.htmlClass}}">
    <label *ngIf="layoutNode?.pointer && !layoutNode?.notitle"
      class="{{layoutNode.labelHtmlClass}}"
      [attr.for]="layoutNode?.pointer">{{layoutNode?.title || layoutNode?.name}}</label>
    <div #widgetContainer></div>
  </div>`
})
export class NoFrameworkComponent implements AfterContentChecked {
  private controlInitialized: boolean = false;
  @Input() layoutNode: any;
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;
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
      for (let input of ['layoutNode', 'formOptions', 'index', 'debug']) {
        addedNode.instance[input] = this[input];
      }
    }
    this.controlInitialized = true;
  }
}
