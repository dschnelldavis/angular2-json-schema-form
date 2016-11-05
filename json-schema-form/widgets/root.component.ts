import {
  Component, ComponentFactoryResolver, ComponentRef, Input, OnChanges,
  OnInit, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  moduleId: module.id,
  selector: 'root-widget',
  template: `<div #widgetContainer></div>`,
})
export class RootComponent implements OnChanges, OnInit {
  private layoutArray: any[];
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
  @Input() isFirstRoot: boolean;
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    private widgetContainer: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
  ) { }

  ngOnInit() {
    this.updateFormLayout();
  }

  ngOnChanges() {
    if (this.isFirstRoot) this.updateFormLayout();
  }

  private updateFormLayout() {
    this.widgetContainer.clear();
    if (Array.isArray(this.layoutNode)) {
      for (let i of Object.keys(this.layoutNode)) {
        let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
          this.componentFactory.resolveComponentFactory(this.formSettings.framework)
        );
        addedNode.instance.layoutNode = this.layoutNode[i];
        addedNode.instance.formSettings = this.formSettings;
        addedNode.instance.layoutIndex = (this.layoutIndex || []).concat(+i);
        addedNode.instance.dataIndex = this.dataIndex || [];
      }
    } else {
      let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.formSettings.framework)
      );
      for (let input of ['layoutNode', 'formSettings', 'layoutIndex', 'dataIndex']) {
        addedNode.instance[input] = this[input];
      }
    }
  }
}
