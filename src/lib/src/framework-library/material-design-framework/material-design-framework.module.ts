import { NgModule }                         from '@angular/core';
import { CommonModule }                     from '@angular/common';
import { BrowserAnimationsModule }          from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MaterialModule, MdDatepickerModule, MdNativeDateModule
} from '@angular/material';

import { WidgetLibraryModule }              from '../../widget-library/widget-library.module';
import { JsonSchemaFormService }            from '../../json-schema-form.service';

import { MaterialAddReferenceComponent }    from './material-add-reference.component';
import { MaterialButtonComponent }          from './material-button.component';
import { MaterialButtonGroupComponent }     from './material-button-group.component';
import { MaterialCardComponent }            from './material-card.component';
import { MaterialCheckboxComponent }        from './material-checkbox.component';
import { MaterialCheckboxesComponent }      from './material-checkboxes.component';
import { MaterialDatepickerComponent }      from './material-datepicker.component';
import { MaterialFileComponent }            from './material-file.component';
import { MaterialInputComponent }           from './material-input.component';
import { MaterialNumberComponent }          from './material-number.component';
import { MaterialRadiosComponent }          from './material-radios.component';
import { MaterialSelectComponent }          from './material-select.component';
import { MaterialSliderComponent }          from './material-slider.component';
import { MaterialTabsComponent }            from './material-tabs.component';
import { MaterialTextareaComponent }        from './material-textarea.component';

import { MaterialDesignFrameworkComponent } from './material-design-framework.component';

const MATERIAL_DESIGN_COMPONENTS = [
  MaterialAddReferenceComponent, MaterialButtonComponent,
  MaterialButtonGroupComponent, MaterialCardComponent,
  MaterialCheckboxComponent, MaterialCheckboxesComponent,
  MaterialDatepickerComponent, MaterialFileComponent,
  MaterialInputComponent, MaterialNumberComponent,
  MaterialRadiosComponent, MaterialSelectComponent,
  MaterialSliderComponent, MaterialTabsComponent,
  MaterialTextareaComponent, MaterialDesignFrameworkComponent
];

@NgModule({
  imports: [
    CommonModule, BrowserAnimationsModule, FormsModule, ReactiveFormsModule,
    MaterialModule, MdDatepickerModule, MdNativeDateModule, WidgetLibraryModule
  ],
  declarations:    [ ...MATERIAL_DESIGN_COMPONENTS ],
  exports:         [ ...MATERIAL_DESIGN_COMPONENTS ],
  entryComponents: [ ...MATERIAL_DESIGN_COMPONENTS ],
  providers:       [ JsonSchemaFormService ]
})
export class MaterialDesignFrameworkModule { }
