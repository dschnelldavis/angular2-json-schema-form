import {
  Component, ComponentFactoryResolver, ComponentRef, Input, OnChanges,
  OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  moduleId: module.id,
  selector: 'select-component-widget',
  template: `<div #widgetContainer></div>`,
})
export class SelectComponentComponent implements OnChanges, OnInit {
  private newComponent: ComponentRef<any> = null;
  @Input() displayComponent: any;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    private widgetContainer: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
  ) { }

  ngOnInit() {
    this.updateComponent();
  }

  ngOnChanges() {
    this.updateComponent();
  }

  private updateComponent() {
    if (!this.newComponent && this.displayComponent) {
      this.newComponent = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.displayComponent)
      );
    }
    if (this.newComponent) {
      for (let input of ['layoutNode', 'formSettings', 'layoutIndex', 'dataIndex']) {
        this.newComponent.instance[input] = this[input];
      }
    }
  }
}
