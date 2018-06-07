import { JsonValidators } from '.';
import { AbstractControl } from '@angular/forms';

describe('JsonValidators', () => {
    let control: AbstractControl;
    let controlValue: any;

    beforeEach(() => {
        controlValue = null;
        control = <any>{
            get value() {
                return controlValue;
            }
        };
    });

describe('required', () => {});
    describe('type', () => {});
    describe('enum', () => {});
    describe('const', () => {});
describe('minLength', () => {});
describe('maxLength', () => {});
describe('pattern', () => {});
    describe('format', () => {});
    describe('minimum', () => {});
    describe('exclusiveMinimum', () => {});
    describe('maximum', () => {});
    describe('exclusiveMaximum', () => {});
    describe('multipleOf', () => {});
    describe('minProperties', () => {});
    describe('maxProperties', () => {});
    describe('dependencies', () => {});

    describe('minItems', () => {
        describe('valid', () => {
            it('should be valid when minItems = null', () => {
                expect(JsonValidators.minItems(null)(control)).toBeNull();
            });
            it('should be valid when value = minItems', () => {
                controlValue = [1, 2, 3];
                expect(JsonValidators.minItems(3)(control)).toBeNull();
            });
            it('should be valid when value > minItems', () => {
                controlValue = [1, 2, 3, 4];
                expect(JsonValidators.minItems(3)(control)).toBeNull();
            });
        });
        describe('invalid', () => {
            it('should be invalid when value < minItems', () => {
                controlValue = [1, 2];
                expect(JsonValidators.minItems(3)(control)).toEqual({
                    minItems: {
                        minimumItems: 3,
                        currentItems: 2
                    }
                });
            });
            it('should be invalid when no items', () => {
                controlValue = [];
                expect(JsonValidators.minItems(3)(control)).toEqual({
                    minItems: {
                        minimumItems: 3,
                        currentItems: 0
                    }
                });
            });
        });
    });

    describe('maxItems', () => {
        describe('valid', () => {
            it('should be valid when maxItems = null', () => {
                expect(JsonValidators.maxItems(null)(control)).toBeNull();
            });
            it('should be valid when value < maxItems', () => {
                controlValue = [1, 2];
                expect(JsonValidators.maxItems(3)(control)).toBeNull();
            });
            it('should be valid when value = maxItems', () => {
                controlValue = [1, 2, 3];
                expect(JsonValidators.maxItems(3)(control)).toBeNull();
            });
        });
        describe('invalid', () => {
            it('should be invalid when value > maxItems', () => {
                controlValue = [1, 2, 3, 4];
                expect(JsonValidators.maxItems(3)(control)).toEqual({
                    maxItems: {
                        maximumItems: 3,
                        currentItems: 4
                    }
                });
            });
        });
    });

    describe('uniqueItems', () => {});
    describe('contains', () => {});
describe('nullValidator', () => {});
    describe('composeAnyOf', () => {});
    describe('composeOneOf', () => {});
    describe('composeAllOf', () => {});
    describe('composeNot', () => {});
describe('compose', () => {});
describe('composeAsync', () => {});
});
