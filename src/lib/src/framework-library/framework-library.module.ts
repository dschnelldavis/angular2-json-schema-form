import { NgModule }                         from '@angular/core';
import { CommonModule }                     from '@angular/common';

import { WidgetLibraryModule }              from '../widget-library/widget-library.module';
import { MaterialDesignFrameworkModule }    from './material-design-framework/material-design-framework.module';

import { WidgetLibraryService }             from '../widget-library/widget-library.service';
import { FrameworkLibraryService }          from './framework-library.service';

import { FRAMEWORK_COMPONENTS }             from './index';

@NgModule({
  imports:         [ CommonModule, WidgetLibraryModule, MaterialDesignFrameworkModule ],
  declarations:    [ ...FRAMEWORK_COMPONENTS ],
  exports:         [ ...FRAMEWORK_COMPONENTS, MaterialDesignFrameworkModule ],
  entryComponents: [ ...FRAMEWORK_COMPONENTS ],
  providers:       [ WidgetLibraryService, FrameworkLibraryService ]
})
export class FrameworkLibraryModule { }
