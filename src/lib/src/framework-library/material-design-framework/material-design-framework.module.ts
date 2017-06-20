import { NgModule }                         from '@angular/core';
import { CommonModule }                     from '@angular/common';
import { BrowserAnimationsModule }          from '@angular/platform-browser/animations';
import { FlexLayoutModule }                 from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MaterialModule, MdDatepickerModule, MdNativeDateModule
} from '@angular/material';

import { WidgetLibraryModule }              from '../../widget-library/widget-library.module';
import { JsonSchemaFormService }            from '../../json-schema-form.service';

import { MATERIAL_DESIGN_COMPONENTS }       from './index';

@NgModule({
  imports: [
    CommonModule, BrowserAnimationsModule, FlexLayoutModule,
    FormsModule, ReactiveFormsModule, MaterialModule,
    MdDatepickerModule, MdNativeDateModule, WidgetLibraryModule
  ],
  declarations:    [ ...MATERIAL_DESIGN_COMPONENTS ],
  exports:         [ ...MATERIAL_DESIGN_COMPONENTS ],
  entryComponents: [ ...MATERIAL_DESIGN_COMPONENTS ],
  providers:       [ JsonSchemaFormService ]
})
export class MaterialDesignFrameworkModule { }
