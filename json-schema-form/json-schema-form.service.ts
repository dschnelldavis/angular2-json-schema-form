import { Inject, Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormGroup } from '@angular/forms';

import * as _ from 'lodash';

import {
  buildFormGroup, getControl, hasOwn, isDefined, JsonPointer
} from './utilities/index';

@Injectable()
export class JsonSchemaFormService {
  public JsonFormCompatibility: boolean = false;
  public ReactJsonSchemaFormCompatibility: boolean = false;
  public AngularSchemaFormCompatibility: boolean = false;

  // Default global form options
  public globalOptions = {
    addSubmit: true, // Add a submit button if layout does not have one?
    debug: false, // Show debugging output?
    fieldsRequired: false, // Are there any required fields in the form?
    pristine: { errors: true, success: true },
    // supressPropertyTitles: false,
    setSchemaDefaults: true,
    // validateOnRender: false,
    formDefaults: { // Default options for individual form controls
      // addable: true, // Allow adding items to an array or $ref point?
      // orderable: true, // Allow reordering items within an array?
      // removable: true, // Allow removing items from an array or $ref point?
      // allowExponents: false, // Allow exponent entry in number fields?
      // disableErrorState: false, // Don't apply 'has-error' class when field fails validation?
      // disableSuccessState: false, // Don't apply 'has-success' class when field validates?
      feedback: true, // Show inline feedback icons?
      // notitle: false, // Hide title?
      // readonly: false, // Set control as read only?
    },
  };

  public initialValues: any = {}; // The initial data model (e.g. previously submitted data)
  public schema: any = {}; // The internal JSON Schema
  public layout: any[] = []; // The internal Form layout
  public formGroupTemplate: any = {}; // The template used to create formGroup
  public formGroup: any = null; // The Angular 2 formGroup, which powers the reactive form

  public framework: any = null; // The active framework component

  public arrayMap: Map<string, number> = new Map<string, number>(); // Maps arrays in data object and number of tuple values
  public dataMap: Map<string, any> = new Map<string, any>(); // Maps paths in data model to schema and formGroup paths
  public dataCircularRefMap: Map<string, string> = new Map<string, string>(); // Maps circular reference points in data model
  public schemaCircularRefMap: Map<string, string> = new Map<string, string>(); // Maps circular reference points in schema
  public layoutRefLibrary: any = {}; // Library of layout nodes for adding to form
  public schemaRefLibrary: any = {}; // Library of schemas for resolving schema $refs
  public templateRefLibrary: any = {}; // Library of formGroup templates for adding to form

  constructor() { }

  public initializeControl(ctx): boolean {
    ctx.formControl = this.getControl(ctx);
    ctx.boundControl = !!ctx.formControl;
    if (ctx.boundControl) {
      ctx.controlName = this.getControlName(ctx);
      ctx.controlValue = ctx.formControl.value;
      ctx.formControl.valueChanges.subscribe(v => ctx.controlValue = v);
      ctx.controlDisabled = ctx.formControl.disabled;
      // TODO: subscribe to status changes
      // TODO: emit / display error messages
      // ctx.formControl.statusChanges.subscribe(v => );
    } else {
      ctx.controlName = ctx.layoutNode.name;
      ctx.controlValue = ctx.layoutNode.value;
      const dataPointer = this.getDataPointer(ctx);
      if (dataPointer) {
        console.error(
          'warning: control "' + dataPointer +
          '" is not bound to the Angular 2 FormGroup.'
        );
      }
    }
    return ctx.boundControl;
  }

  public updateValue(ctx, event): void {
    ctx.controlValue = event.target.value;
    if (ctx.boundControl) {
      ctx.formControl.setValue(event.target.value);
      ctx.formControl.markAsDirty();
    }
    ctx.layoutNode.value = event.target.value;
  }

  public getControl(ctx): AbstractControl {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer ||
      ctx.layoutNode.type === '$ref') return null;
    return getControl(this.formGroup, this.getDataPointer(ctx));
  }

  public getControlValue(ctx): AbstractControl {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer ||
      ctx.layoutNode.type === '$ref') return null;
    const control = getControl(this.formGroup, this.getDataPointer(ctx));
    return control ? control.value : null;
  }

  public getControlGroup(ctx): FormArray | FormGroup {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer) return null;
    return getControl(this.formGroup, this.getDataPointer(ctx), true);
  }

  public getControlName(ctx): string {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex) return null;
    return JsonPointer.toKey(JsonPointer.toIndexedPointer(
      ctx.layoutNode.dataPointer, ctx.dataIndex, this.arrayMap
    ));
  }

  public getLayoutArray(ctx): any[] {
    return JsonPointer.get(
      this.layout, this.getLayoutPointer(ctx), 0, -1
    );
  }

  public getDataPointer(ctx): string {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex) return null;
    return JsonPointer.toIndexedPointer(ctx.layoutNode.dataPointer, ctx.dataIndex);
  }

  public getLayoutPointer(ctx): string {
    if (!ctx.layoutNode || !ctx.layoutNode.layoutPointer || !ctx.layoutIndex) return null;
    return JsonPointer.toIndexedPointer(ctx.layoutNode.layoutPointer, ctx.layoutIndex);
  }

  public isControlBound(ctx): boolean {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex) return false;
    const control = this.getControlGroup(ctx);
    if (!control) return false;
    return control.controls.hasOwnProperty(JsonPointer.toKey(this.getDataPointer(ctx)));
  }

  public addItem(ctx): boolean {
    if (!ctx.layoutNode || !ctx.layoutNode.$ref || !ctx.dataIndex ||
      !ctx.layoutNode.layoutPointer || !ctx.layoutIndex) return false;
    // Add new data key to formGroup
    const dataPointer = this.getDataPointer(ctx);
console.log(dataPointer);
console.log(this.templateRefLibrary);
console.log(ctx.layoutNode.$ref);
    const newFormGroup = buildFormGroup(JsonPointer.get(
      this.templateRefLibrary, [ctx.layoutNode.$ref]
    ));
console.log(newFormGroup);
    if (ctx.layoutNode.arrayItem) { // Add new array item
      (<FormArray>this.getControlGroup(ctx)).push(newFormGroup);
    } else { // Add new $ref item
      // TODO: Add $ref item to formGroup
    }
    // Add new display node to layout
    const layoutPointer = this.getLayoutPointer(ctx);
    const newLayoutNode = _.cloneDeep(JsonPointer.get(
      this.layoutRefLibrary, [ctx.layoutNode.$ref]
    ));
    if (ctx.layoutNode.circularReference) {
      JsonPointer.forEachDeep(newLayoutNode, (value, pointer) => {
        if (hasOwn(value, 'dataPointer')) {
          value.dataPointer = ctx.layoutNode.dataPointer + value.dataPointer;
        }
        if (hasOwn(value, 'layoutPointer')) {
          value.layoutPointer = ctx.layoutNode.layoutPointer + value.layoutPointer;
        }
      });
    }
    if (ctx.layoutNode.arrayItem) { // Add new array item
      JsonPointer.insert(this.layout, layoutPointer, newLayoutNode);
    } else { // Add new $ref item
      // TODO: Add $ref item to layout
    }
    return true;
  }

  public moveArrayItem(ctx, oldIndex: number, newIndex: number): boolean {
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex ||
      !ctx.layoutNode.layoutPointer || !ctx.layoutIndex ||
      !isDefined(oldIndex) || !isDefined(newIndex)) return false;
    // Move item in the formArray
    let formArray = this.getControlGroup(ctx);
    (<any>formArray.controls).splice(newIndex, 0, (<any>formArray.controls).splice(oldIndex, 1)[0]);
    formArray.updateValueAndValidity();
    (<any>formArray)._onCollectionChange();
    // Move layout item
    let layoutArray = this.getLayoutArray(ctx);
    layoutArray.splice(newIndex, 0, layoutArray.splice(oldIndex, 1)[0]);
    return true;
  }

  public removeItem(ctx): boolean { // TODO: Change to also remove circular reference items
    if (!ctx.layoutNode || !ctx.layoutNode.dataPointer || !ctx.dataIndex ||
      !ctx.layoutNode.layoutPointer || !ctx.layoutIndex) return false;
    // Remove data key from formGroup
    (<FormArray>this.getControlGroup(ctx)).removeAt(ctx.dataIndex[ctx.dataIndex.length - 1]);
    // Remove display node from layout
    let layoutPointer = this.getLayoutPointer(ctx);
    JsonPointer.remove(this.layout, layoutPointer);
    return true;
  }
}
