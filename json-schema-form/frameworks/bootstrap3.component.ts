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
export class Bootstrap3Component implements OnInit, AfterContentChecked, OnChanges {
  private controlInitialized: boolean = false;
  private displayWidget: boolean = true;
  private controlView: string;
  private htmlClass: string;
  private labelHtmlClass: string;
  private debugOutput: any = '';
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formGroup: FormGroup; // Angular 2 FormGroup object
  @Input() formOptions: any; // Global form defaults and options
  @Input() debug: boolean;
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    private widgetContainer: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
  ) { }

  private get control() {
    if (this.formGroup && this.formGroup.controls && this.formGroup.controls[this.layoutNode.name]) {
      return this.formGroup.controls[this.layoutNode.name];
    } else {
      return null;
    }
  }

  private get errorMessage() {
    if (this.control) {
      return Object.keys(this.control.errors).map(
        error => [error, Object.keys(this.control.errors[error]).map(
          errorParameter => errorParameter + ': ' + this.control.errors[error][errorParameter]
        ).join(', ')].filter(e => e).join(' - ')
      ).join('<br>');
    } else {
      return null;
    }
  }

  ngOnInit() {
    this.htmlClass = this.layoutNode.htmlClass || '';
    this.htmlClass += ' form-group  schema-form-' + this.layoutNode.type;
    if (this.formOptions.formDefaults.htmlClass) {
      this.htmlClass += ' ' + this.formOptions.formDefaults.htmlClass;
    }

    this.labelHtmlClass = this.layoutNode.labelHtmlClass || '';
    this.labelHtmlClass += ' control-label';
    if (this.formOptions.formDefaults.labelHtmlClass) {
      this.labelHtmlClass += ' ' + this.formOptions.formDefaults.labelHtmlClass;
    }

    this.layoutNode.fieldHtmlClass = this.layoutNode.fieldHtmlClass || '';
    if (this.formOptions.formDefaults.fieldHtmlClass) {
      this.layoutNode.fieldHtmlClass += ' ' + this.formOptions.formDefaults.fieldHtmlClass;
    }

    switch (this.layoutNode.type) {

      case 'array':
        this.controlView = 'array';
      break;

      case 'fieldset': case 'advancedfieldset': case 'authfieldset':
        if (this.layoutNode.type === 'advancedfieldset') {
          this.layoutNode.title = 'Advanced options';
        } else if (this.layoutNode.type === 'authfieldset') {
          this.layoutNode.title = 'Authentication settings';
        }
        this.controlView = 'fieldset';
      break;

      case 'help': case 'msg': case 'message':
        this.controlView = 'minimal';
      break;

      case 'section': case 'conditional':
        this.controlView = 'minimal';
        this.htmlClass += ' schema-form-section';
      break;

      case 'button': case 'submit':
        this.controlView = 'minimal';
        this.layoutNode.fieldHtmlClass += ' btn btn-info';
      break;

      case 'checkbox':
        this.controlView = 'checkbox';
        this.htmlClass += ' checkbox';
      break;

      default:
        this.layoutNode.fieldHtmlClass += ' form-control';
    }
  }

  ngAfterContentChecked() {
    if (
      !this.controlInitialized && this.displayWidget &&
      this.widgetContainer && !this.widgetContainer.length &&
      this.layoutNode && this.layoutNode.widget
    ) {
      let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
        this.componentFactory.resolveComponentFactory(this.layoutNode.widget)
      );
      addedNode.instance.formGroup = this.formGroup;
      addedNode.instance.layoutNode = this.layoutNode;
      addedNode.instance.formOptions = this.formOptions;
      this.controlInitialized = true;
    }

    if (this.debug && this.formGroup && this.formGroup.controls && this.formGroup.controls[this.layoutNode.name]) {
      let vars: any[] = [];
      // vars.push(this.formGroup.value[this.layoutNode.name]);
      vars.push(this.formGroup.controls[this.layoutNode.name].errors);
      this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
    }
  }

  ngOnChanges() {
  }
}
