import {
  Component, ComponentFactoryResolver, ComponentRef, Input, OnInit,
  AfterContentChecked, ViewChild, ViewContainerRef
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { JsonPointer } from '../utilities/jsonpointer';

@Component({
  moduleId: module.id,
  selector: 'bootstrap3-framework',
  templateUrl: 'bootstrap3.component.html',
})
export class Bootstrap3Component implements OnInit, AfterContentChecked {
  private controlInitialized: boolean = false;
  private displayWidget: boolean = true;
  private formControl: any = null;
  private controlView: string;
  private htmlClass: string;
  private labelHtmlClass: string;
  private debugOutput: any = '';
  private errorMessage = '';
  @Input() layoutNode: any; // JSON Schema Form layout node
  @Input() formGroup: FormGroup; // Angular 2 FormGroup object
  @Input() formOptions: any; // Global form defaults and options
  @Input() debug: boolean;
  @ViewChild('widgetContainer', { read: ViewContainerRef })
    private widgetContainer: ViewContainerRef;

  constructor(
    private componentFactory: ComponentFactoryResolver,
  ) { }

  ngOnInit() {
    if ('pointer' in this.layoutNode) {
      let thisControl = JsonPointer.getFormControl(this.formGroup, this.layoutNode.pointer);
      if (thisControl) this.formControl = thisControl;
    }

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

    if ('isArrayItem' in this.layoutNode && this.layoutNode.isArrayItem === true) {
      this.controlView = 'array-item';
    } else {
      switch (this.layoutNode.type) {
        case 'array': case 'array-item': case '$ref':
          this.controlView = this.layoutNode.type;
        break;
        case 'fieldset': case 'advancedfieldset': case 'authfieldset':
          if (this.layoutNode.type === 'advancedfieldset') {
            this.layoutNode.title = 'Advanced options';
          } else if (this.layoutNode.type === 'authfieldset') {
            this.layoutNode.title = 'Authentication settings';
          }
          this.controlView = 'minimal';
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
        case 'checkboxes':
          this.layoutNode.htmlClass += ' checkbox';
        break;
        case 'radiobuttons':
          this.htmlClass += ' btn-group';
          this.layoutNode.labelHtmlClass += ' btn btn-default';
          this.layoutNode.fieldHtmlClass += ' sr-only';
        break;
        case 'radio': case 'radios':
          this.layoutNode.htmlClass += ' radio';
        break;
        case 'radios-inline':
          this.layoutNode.labelHtmlClass += ' radio-inline';
        break;
        default:
          this.layoutNode.fieldHtmlClass += ' form-control';
      }
    }
  }

  ngAfterContentChecked() {
    if (
      !this.controlInitialized && this.displayWidget &&
      this.widgetContainer && !this.widgetContainer.length &&
      this.layoutNode && this.layoutNode.widget
    ) {
      if (this.controlView === 'array' && 'items' in this.layoutNode) {
        for (let i = 0, l = this.layoutNode.items.length; i < l; i++) {
          if (this.layoutNode.items[i]) {
            let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
              this.componentFactory.resolveComponentFactory(this.formOptions.framework)
            );
            addedNode.instance.formGroup = this.formGroup;
            addedNode.instance.layoutNode = this.layoutNode.items[i];
            addedNode.instance.layoutNode.isArrayItem = true;
            addedNode.instance.formOptions = this.formOptions;
          }
        }
      } else if (this.controlView === 'array-item') {
        let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
          this.componentFactory.resolveComponentFactory(this.formOptions.framework)
        );
        addedNode.instance.formGroup = this.formGroup;
        addedNode.instance.layoutNode = this.layoutNode;
        if (this.layoutNode) {
          addedNode.instance.layoutNode.isArrayItem = false;
        }
        addedNode.instance.formOptions = this.formOptions;
      } else {
        let addedNode: ComponentRef<any> = this.widgetContainer.createComponent(
          this.componentFactory.resolveComponentFactory(this.layoutNode.widget)
        );
        addedNode.instance.formGroup = this.formGroup;
        addedNode.instance.layoutNode = this.layoutNode;
        addedNode.instance.formOptions = this.formOptions;
      }
      this.controlInitialized = true;

      if (this.formControl) {
        this.formControl.statusChanges.subscribe(value => {
          if (value === 'INVALID' && this.formControl.errors) {
            this.errorMessage = Object.keys(this.formControl.errors).map(
                error => [error, Object.keys(this.formControl.errors[error]).map(
                  errorParameter => errorParameter + ': ' +
                    this.formControl.errors[error][errorParameter]
                ).join(', ')].filter(e => e).join(' - ')
              ).join('<br>');
          } else {
            this.errorMessage = null;
          }
        });
      }
    }

    if (
      this.debug && this.formGroup && this.formGroup.controls &&
      this.formGroup.controls[this.layoutNode.name]
    ) {
      let vars: any[] = [];
      // vars.push(this.formGroup.value[this.layoutNode.name]);
      vars.push(this.formGroup.controls[this.layoutNode.name]['errors']);
      this.debugOutput = _.map(vars, thisVar => JSON.stringify(thisVar, null, 2)).join('\n');
    }
  }
}
