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
  @Input() options: any;
  @Input() index: number[];
  @Input() debug: boolean;
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
      for (let i of Object.keys(this.layoutNode).map(k => parseInt(k, 10))) {
        let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
          this.componentFactory.resolveComponentFactory(this.options.framework)
        );
        addedNode.instance.layoutNode = this.layoutNode[i];
        addedNode.instance.index = currentIndex.concat(i);
        for (let input of ['options', 'debug']) {
          addedNode.instance[input] = this[input];
        }
      }
    } else {
      let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.options.framework)
      );
      for (let input of ['layoutNode', 'options', 'index', 'debug']) {
        addedNode.instance[input] = this[input];
      }
    }
  }
}
