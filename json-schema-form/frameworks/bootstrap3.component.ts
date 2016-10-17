import {
  Component, ComponentFactoryResolver, ComponentRef, Input, OnInit,
  AfterContentChecked, OnChanges, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  moduleId: module.id,
  selector: 'bootstrap3-framework',
  templateUrl: 'bootstrap3.component.html',
})
export class Bootstrap3Component implements OnInit, AfterContentChecked {
  private controlInitialized: boolean = false;
  private displayWidget: boolean = true;
  private controlView: string;
  private htmlClass: string;
  private labelHtmlClass: string;
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formGroup: FormGroup; // Angular 2 FormGroup object
  @Input() formOptions: any; // Global form defaults and options
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    private widgetContainer: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
  ) { }

  ngOnInit() {
    this.htmlClass = this.layoutNode.htmlClass || '';
    this.htmlClass += ' form-group  schema-form-' + this.layoutNode.type;
    if (this.layoutNode.type === 'checkbox') {
      this.htmlClass += ' checkbox';
      this.controlView = 'checkbox';
    }
    if (this.formOptions.formDefaults.htmlClass) {
      this.htmlClass += ' ' + this.formOptions.formDefaults.htmlClass;
    }

    this.labelHtmlClass = this.layoutNode.labelHtmlClass || '';
    this.labelHtmlClass += ' control-label';
    if (this.formOptions.formDefaults.labelHtmlClass) {
      this.labelHtmlClass += ' ' + this.formOptions.formDefaults.labelHtmlClass;
    }

    this.layoutNode.fieldHtmlClass = this.layoutNode.fieldHtmlClass || '';
    this.layoutNode.fieldHtmlClass += ' form-control';
    if (this.formOptions.formDefaults.fieldHtmlClass) {
      this.layoutNode.fieldHtmlClass +=
      ' ' + this.formOptions.formDefaults.fieldHtmlClass;
    }
  }

  ngAfterContentChecked() {
    if (
      this.widgetContainer && !this.widgetContainer.length &&
      this.layoutNode && this.layoutNode.widget
    ) {
      let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.layoutNode.widget)
      );
      addedNode.instance.formGroup = this.formGroup;
      addedNode.instance.layoutNode = this.layoutNode;
      addedNode.instance.formOptions = this.formOptions;
    }
    this.controlInitialized = true;
  }
}
