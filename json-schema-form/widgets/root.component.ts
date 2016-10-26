import {
  Component, ComponentFactoryResolver, ComponentRef, Input,
  OnChanges, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  moduleId: module.id,
  selector: 'root-widget',
  template: `<div #rootWidget></div>`,
})
export class RootComponent implements OnChanges {
  private layoutArray: any[];
  @Input() layoutNode: any; // JSON Schema Form layout array
  @Input() formGroup: FormGroup; // Angular 2 FormGroup object
  @Input() formOptions: any; // Global form defaults and options
  @Input() debug: boolean;
  @ViewChild('rootWidget', { read: ViewContainerRef })
    private rootWidget: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
  ) { }

  ngOnChanges() {
    this.layoutArray =
      Array.isArray(this.layoutNode) ? this.layoutNode : [this.layoutNode];
    this.rootWidget.clear();
    for (let i = 0, l = this.layoutArray.length; i < l; i++) {
      let addedNode: ComponentRef<any> = this.rootWidget.createComponent(
        this.componentFactory.resolveComponentFactory(this.formOptions.framework)
      );
      addedNode.instance.formGroup = this.formGroup;
      addedNode.instance.layoutNode = this.layoutArray[i];
      addedNode.instance.formOptions = this.formOptions;
      addedNode.instance.debug = this.debug || false;
    }
  }
}
