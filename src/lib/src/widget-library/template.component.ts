import {
  Component, ComponentFactoryResolver, ComponentRef,
  OnChanges, OnInit, ViewChild, ViewContainerRef
} from '@angular/core';

import { JsonSchemaFormService } from '../json-schema-form.service';
import { Widget } from './widget';

@Component({
  selector: 'template-widget',
  template: `<div #widgetContainer></div>`,
})
export class TemplateComponent extends Widget implements OnInit, OnChanges {
  newComponent: ComponentRef<any> = null;
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    widgetContainer: ViewContainerRef;

    constructor(jsf: JsonSchemaFormService, protected componentFactory: ComponentFactoryResolver) {
      super(jsf);
    }

  ngOnInit() {
    this.updateComponent();
  }

  ngOnChanges() {
    this.updateComponent();
  }

  protected updateComponent() {
    this.createComponent();
    if (this.newComponent) {
      for (let input of ['layoutNode', 'layoutIndex', 'dataIndex']) {
        this.newComponent.instance[input] = this[input];
      }
    }
  }

  protected createComponent(): void {
    if (!this.newComponent && this.layoutNode.options.template) {
      this.newComponent = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.layoutNode.options.template)
      );
    }
  }
}
