import { Inject, Injectable } from '@angular/core';

import { Framework } from './framework';

// Material Design Framework
// https://github.com/angular/material2
import { FlexLayoutRootComponent } from './material-design-framework/flex-layout-root.component';
import { FlexLayoutSectionComponent } from './material-design-framework/flex-layout-section.component';
import { MaterialAddReferenceComponent } from './material-design-framework/material-add-reference.component';
import { MaterialOneOfComponent } from './material-design-framework/material-one-of.component';
import { MaterialButtonComponent } from './material-design-framework/material-button.component';
import { MaterialButtonGroupComponent } from './material-design-framework/material-button-group.component';
import { MaterialCheckboxComponent } from './material-design-framework/material-checkbox.component';
import { MaterialCheckboxesComponent } from './material-design-framework/material-checkboxes.component';
import { MaterialChipListComponent } from './material-design-framework/material-chip-list.component';
import { MaterialDatepickerComponent } from './material-design-framework/material-datepicker.component';
import { MaterialFileComponent } from './material-design-framework/material-file.component';
import { MaterialInputComponent } from './material-design-framework/material-input.component';
import { MaterialNumberComponent } from './material-design-framework/material-number.component';
import { MaterialRadiosComponent } from './material-design-framework/material-radios.component';
import { MaterialSelectComponent } from './material-design-framework/material-select.component';
import { MaterialSliderComponent } from './material-design-framework/material-slider.component';
import { MaterialStepperComponent } from './material-design-framework/material-stepper.component';
import { MaterialTabsComponent } from './material-design-framework/material-tabs.component';
import { MaterialTextareaComponent } from './material-design-framework/material-textarea.component';
import { MaterialDesignFrameworkComponent } from './material-design-framework/material-design-framework.component';

@Injectable()
export class FrameworkMaterialDesign extends Framework {
  name = 'material-design'
  framework = MaterialDesignFrameworkComponent
  widgets = {
    'root':            FlexLayoutRootComponent,
    'section':         FlexLayoutSectionComponent,
    '$ref':            MaterialAddReferenceComponent,
    'button':          MaterialButtonComponent,
    'button-group':    MaterialButtonGroupComponent,
    'checkbox':        MaterialCheckboxComponent,
    'checkboxes':      MaterialCheckboxesComponent,
    'chip-list':       MaterialChipListComponent,
    'date':            MaterialDatepickerComponent,
    'file':            MaterialFileComponent,
    'number':          MaterialNumberComponent,
    'one-of':          MaterialOneOfComponent,
    'radios':          MaterialRadiosComponent,
    'select':          MaterialSelectComponent,
    'slider':          MaterialSliderComponent,
    'stepper':         MaterialStepperComponent,
    'tabs':            MaterialTabsComponent,
    'text':            MaterialInputComponent,
    'textarea':        MaterialTextareaComponent,
    'alt-date':        'date',
    'any-of':          'one-of',
    'card':            'section',
    'color':           'text',
    'expansion-panel': 'section',
    'hidden':          'none',
    'image':           'none',
    'integer':         'number',
    'radiobuttons':    'button-group',
    'range':           'slider',
    'submit':          'button',
    'tagsinput':       'chip-list',
    'wizard':          'stepper',
  }
  stylesheets = [
    '//fonts.googleapis.com/icon?family=Material+Icons',
    '//fonts.googleapis.com/css?family=Roboto:300,400,500,700',
  ]
}
