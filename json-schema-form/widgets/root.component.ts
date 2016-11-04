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
  @Input() index: number[];
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
      let currentIndex = this.index || [];
      for (let i of Object.keys(this.layoutNode)) {
        let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
          this.componentFactory.resolveComponentFactory(this.formSettings.framework)
        );
        addedNode.instance.layoutNode = this.layoutNode[i];
        addedNode.instance.index = currentIndex.concat(+i);
        addedNode.instance.formSettings = this.formSettings;
      }
    } else {
      let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.formSettings.framework)
      );
      for (let input of ['layoutNode', 'formSettings', 'index']) {
        addedNode.instance[input] = this[input];
      }
    }
  }
}
