import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { DemoModule } from './app/demo.module';
import { environment } from './environments/environment';

import 'hammerjs';

if (environment.production) { enableProdMode(); }

platformBrowserDynamic().bootstrapModule(DemoModule);
