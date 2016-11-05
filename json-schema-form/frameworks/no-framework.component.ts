import {
  Component, ComponentFactoryResolver, ComponentRef, Input,
  AfterContentChecked, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'none-framework',
  template: `<div *ngIf="controlInitialized"><div #widgetContainer></div></div>`,
})
export class NoFrameworkComponent implements AfterContentChecked {
  private controlInitialized: boolean = false;
  @Input() layoutNode: any;
  @Input() formSettings: any;
  @Input() layoutIndex: number[];
  @Input() dataIndex: number[];
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
      for (let input of ['layoutNode', 'formSettings', 'layoutIndex', 'dataIndex']) {
        addedNode.instance[input] = this[input];
      }
    }
    this.controlInitialized = true;
  }
}
