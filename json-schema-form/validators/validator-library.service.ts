import { Injectable } from '@angular/core';

@Injectable()
export class ValidatorLibraryService {

  private defaultValidator: string = 'null';
  private validators: { [type: string]: any } = {

  };

  public setDefaultValidator(type: string) {
    if (!this.hasValidator(type)) return false;
    this.defaultValidator = type;
    return true;
  }

  public hasValidator(type: string) {
    if (!type || typeof type !== 'string') return false;
    return this.validators.hasOwnProperty(type);
  }

  public registerValidator(type: string, validator: any) {
    if (!type || !validator || typeof type !== 'string') return false;
    this.validators[type] = validator;
    return true;
  }

  public getValidator(type: string): any {
    if (this.hasValidator(type)) return this.validators[type];
    if (type === 'all') return this.validators;
    return null;
  }
}
