import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WidgetLibraryService } from '../widget-library/widget-library.service';
import { FrameworkLibraryService } from './framework-library.service';

import { Bootstrap3FrameworkModule } from './bootstrap-3-framework/bootstrap-3-framework.module';
import { MaterialDesignFrameworkModule } from './material-design-framework/material-design-framework.module';

import { NoFrameworkComponent } from './no-framework.component';
import { Bootstrap4FrameworkModule } from './bootstrap-4-framework/bootstrap-4-framework.module';

@NgModule({
  imports:         [
    CommonModule,
    Bootstrap3FrameworkModule, MaterialDesignFrameworkModule, Bootstrap4FrameworkModule
  ],
  declarations:    [ NoFrameworkComponent ],
  exports:         [
    NoFrameworkComponent,
    Bootstrap3FrameworkModule, MaterialDesignFrameworkModule, Bootstrap4FrameworkModule
  ],
  entryComponents: [ NoFrameworkComponent ]
})
export class FrameworkLibraryModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: MaterialDesignFrameworkModule,
      providers: [ WidgetLibraryService, FrameworkLibraryService ]
    }
  }
}
