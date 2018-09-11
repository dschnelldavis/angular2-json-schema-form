import { Injectable } from '@angular/core';

import { Framework } from '../framework';

// SemanticUI Framework
// https://github.com/angular/material2
import { LayoutRootComponent } from './layout-root.component';
import { LayoutSectionComponent } from './layout-section.component';
import { SemanticUIAddReferenceComponent } from './semantic-ui-add-reference.component';
import { SemanticUIOneOfComponent } from './semantic-ui-one-of.component';
import { SemanticUIButtonComponent } from './semantic-ui-button.component';
import { SemanticUIButtonGroupComponent } from './semantic-ui-button-group.component';
import { SemanticUICheckboxComponent } from './semantic-ui-checkbox.component';
import { SemanticUICheckboxesComponent } from './semantic-ui-checkboxes.component';
import { SemanticUIChipListComponent } from './semantic-ui-chip-list.component';
import { SemanticUIDatepickerComponent } from './semantic-ui-datepicker.component';
import { SemanticUIFileComponent } from './semantic-ui-file.component';
import { SemanticUIInputComponent } from './semantic-ui-input.component';
import { SemanticUINumberComponent } from './semantic-ui-number.component';
import { SemanticUIRadiosComponent } from './semantic-ui-radios.component';
import { SemanticUISelectComponent } from './semantic-ui-select.component';
import { SemanticUISliderComponent } from './semantic-ui-slider.component';
import { SemanticUIStepperComponent } from './semantic-ui-stepper.component';
import { SemanticUITabsComponent } from './semantic-ui-tabs.component';
import { SemanticUITextareaComponent } from './semantic-ui-textarea.component';
import { SemanticUIFrameworkComponent } from './semantic-ui-framework.component';

@Injectable()
export class SemanticUIFramework extends Framework {
  name = 'semantic-ui';

  framework = SemanticUIFrameworkComponent;

  // scripts = [
  //   '~/jquery/dist/jquery.min.js',
  //   '~/semantic-ui/dist/semantic.min.js'
  // ];

  scripts = [
    '//ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js',
    '//ajax.googleapis.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js',
    '//maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js',
  ];

  stylesheets = [
    '//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.2/semantic.min.css',
    '//fonts.googleapis.com/icon?family=SemanticUI+Icons',
    '//fonts.googleapis.com/css?family=Roboto:300,400,500,700'
  ];

  widgets = {
    'root':            LayoutRootComponent,
    'section':         LayoutSectionComponent,
    '$ref':            SemanticUIAddReferenceComponent,
    'button':          SemanticUIButtonComponent,
    'button-group':    SemanticUIButtonGroupComponent,
    'checkbox':        SemanticUICheckboxComponent,
    'checkboxes':      SemanticUICheckboxesComponent,
    'chip-list':       SemanticUIChipListComponent,
    'date':            SemanticUIDatepickerComponent,
    'file':            SemanticUIFileComponent,
    'number':          SemanticUINumberComponent,
    'one-of':          SemanticUIOneOfComponent,
    'radios':          SemanticUIRadiosComponent,
    'select':          SemanticUISelectComponent,
    'slider':          SemanticUISliderComponent,
    'stepper':         SemanticUIStepperComponent,
    'tabs':            SemanticUITabsComponent,
    'text':            SemanticUIInputComponent,
    'textarea':        SemanticUITextareaComponent,
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
  };
}
