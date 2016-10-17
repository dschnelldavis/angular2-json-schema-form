/**
 * Converts JSON Schema version 3 to JSON Schema version 4
 *
 * Based on geraintluff's JSON Schema compatibility function
 * https://github.com/geraintluff/json-schema-compatibility
 *
 * @param {object} originalSchema - JSON schema (version 3)
 * @return {object} - JSON schema (version 4)
 */
export function convertJsonSchema3to4(schema: any): any {
  let converted: boolean = false;

  let isArray = function (item: any): boolean {
    return Array.isArray(item) ||
      Object.prototype.toString.call(item) === '[object Array]';
  };

  let convertTypes = function (types, replace: boolean = false) {
    let newTypes: any[] = [];
    if (!isArray(types)) types = [types];
    for (let i = 0, l =  types.length; i < l; i++) {
      let type = types[i];
      if (typeof type === 'object') {
        newTypes.push(type);
        replace = true;
      } else {
        newTypes.push({ 'type': type });
      }
    }
    return replace && newTypes;
  };

  // convert multiple types to anyOf
  if (schema['type']) {
    if (typeof schema.type !== 'string') {
      converted = true;
      let anyOf = convertTypes(schema.type);
      if (anyOf) {
        schema.anyOf = anyOf;
        delete schema.type;
      }
    } else if (schema.type === 'any') {
      delete schema.type;
    }
  }

  // convert extends to allOf
  if (schema['extends']) {
    converted = true;
    schema.allOf = isArray(schema.extends) ?
      schema.extends : [schema.extends];
    delete schema.extends;
  }

  // convert disallow to not
  if (schema['disallow']) {
    converted = true;
    schema.not = (typeof schema.disallow === 'string') ?
      { 'type': schema.disallow } :
      { 'anyOf': convertTypes(schema.disallow, true) };
    delete schema.disallow;
  }

  // move required from individual items to required array
  if (schema['properties']) {
    let requiredArray = isArray(schema.required) ? schema.required : [];
    for (let key in schema.properties) {
      if (schema.properties.hasOwnProperty(key)) {
        if (schema.properties[key] &&
          typeof schema.properties[key].required === 'boolean'
        ) {
          if (schema.properties[key].required) {
            requiredArray.push(key);
            converted = true;
          }
          delete schema.properties[key].required;
        }
      }
    }
    if (requiredArray.length) schema.required = requiredArray;
  }

  // convert dependencies to arrays
  if (schema['dependencies']) {
    for (let key in schema.dependencies) {
      if (schema.dependencies.hasOwnProperty(key)) {
        if (typeof schema.dependencies[key] === 'string') {
          converted = true;
          schema.dependencies[key] = [schema.dependencies[key]];
        }
      }
    }
  }

  // delete boolean required key
  if (typeof schema.required === 'boolean') {
    converted = true;
    delete schema.required;
  }

  // convert divisibleBy to multipleOf
  if (schema['divisibleBy']) {
    converted = true;
    schema.multipleOf = schema.divisibleBy;
    delete schema.divisibleBy;
  }

  // convert sub schemas
  for (let key in schema) {
    if (schema.hasOwnProperty(key)) {
      if (
        key === 'properties' || key === 'patternProperties' ||
        key === 'dependencies'
      ) {
        for (let subKey in schema[key]) {
          if (schema[key].hasOwnProperty(subKey)) {
            schema[key][subKey] = convertJsonSchema3to4(schema[key][subKey]);
          }
        }
      } else if (key !== 'enum') {
        if (isArray(schema[key])) {
          for (let i = 0, l = schema[key].length; i < l; i++) {
            schema[key][i] = convertJsonSchema3to4(schema[key][i]);
          }
        } else if (typeof schema[key] === 'object') {
          schema[key] = convertJsonSchema3to4(schema[key]);
        }
      }

    }
  }

  if (converted === true) {

    // update or delete schema identifier
    if (schema['$schema']) {
      if (schema.$schema === 'http://json-schema.org/draft-03/schema#') {
        schema.$schema = 'http://json-schema.org/draft-04/schema#';
      } else {
        delete schema.$schema;
      }
    }

    // update id
    if (schema['id']) schema.id = schema.id + '-CONVERTED-TO-DRAFT-04';
  }

  return schema;
}
