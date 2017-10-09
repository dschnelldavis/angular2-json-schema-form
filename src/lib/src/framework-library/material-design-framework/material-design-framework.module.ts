import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatButtonModule, MatButtonToggleModule, MatCheckboxModule, MatDatepickerModule,
  MatInputModule, MatNativeDateModule, MatRadioModule, MatSelectModule,
  MatSliderModule, MatSlideToggleModule, MatStepperModule, MatTabsModule,
  MATERIAL_COMPATIBILITY_MODE
} from '@angular/material';

import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { JsonSchemaFormService } from '../../json-schema-form.service';

import { MATERIAL_DESIGN_COMPONENTS } from './index';

@NgModule({
  imports: [
    CommonModule, FlexLayoutModule, FormsModule, ReactiveFormsModule,
    MatButtonModule, MatButtonToggleModule, MatCheckboxModule, MatDatepickerModule,
    MatInputModule, MatNativeDateModule, MatRadioModule, MatSelectModule,
    MatSliderModule, MatSlideToggleModule, MatStepperModule, MatTabsModule,
    WidgetLibraryModule
  ],
  declarations:    [ ...MATERIAL_DESIGN_COMPONENTS ],
  exports:         [ ...MATERIAL_DESIGN_COMPONENTS ],
  entryComponents: [ ...MATERIAL_DESIGN_COMPONENTS ],
  providers:       [
    { provide: MATERIAL_COMPATIBILITY_MODE, useValue: true },
    JsonSchemaFormService
  ]
})
export class MaterialDesignFrameworkModule { }
