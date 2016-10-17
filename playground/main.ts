import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { PlaygroundModule } from './playground.module';

const platform = platformBrowserDynamic();
platform.bootstrapModule(PlaygroundModule);
