/**
 * 'convertSchemaToDraft6' function
 *
 * Converts Earlier JSON Schema versions (v1-v4) to JSON Schema version 6
 *
 * Partly based on geraintluff's JSON Schema 3 to 4 compatibility function
 * https://github.com/geraintluff/json-schema-compatibility
 * Also uses suggestions from AJV's JSON Schema 4 to 6 migration guide
 * https://github.com/epoberezkin/ajv/releases/tag/5.0.0
 *
 * @param {object} originalSchema - JSON schema (version 1, 2, 3, 4, or 6)
 * @return {object} - JSON schema (version 6)
 */
export function convertSchemaToDraft6(schema: any, version: number = null): any {

  if (typeof schema !== 'object') { return schema; }
  if (Array.isArray(schema)) {
    return [ ...schema.map(subSchema => convertSchemaToDraft6(subSchema, version)) ];
  }
  const newSchema = { ...schema };

  if (newSchema.$schema) {
    switch (newSchema.$schema) {
      case 'http://json-schema.org/draft-01/schema#': version = 1; break;
      case 'http://json-schema.org/draft-02/schema#': version = 2; break;
      case 'http://json-schema.org/draft-03/schema#': version = 3; break;
      case 'http://json-schema.org/draft-04/schema#': version = 4; break;
      case 'http://json-schema.org/draft-06/schema#': version = 6; break;
    }
  }

  if (newSchema.$ref && typeof newSchema.$ref === 'string') {

    // return regular $ref object
    if (Object.keys(newSchema).length === 1) { return newSchema; }

    // convert overloaded $ref object to allOf
    const refLink = newSchema.$ref;
    delete newSchema.$ref;
    return {
      'allOf': [
        { $ref: refLink },
        convertSchemaToDraft6(newSchema, version)
      ]
    };
  }

  // convert v1-v2 contentEncoding to media.binaryEncoding
  // Note: This is only used in JSON hyper-schema (not regular JSON schema)
  if (newSchema.contentEncoding) {
    newSchema.media = { binaryEncoding: newSchema.contentEncoding };
    delete newSchema.contentEncoding;
  }

  // convert v1-v3 extends to allOf
  if (newSchema.extends) {
    newSchema.allOf = Array.isArray(newSchema.extends) ?
      newSchema.extends.map(subSchema => convertSchemaToDraft6(subSchema, version)) :
      [ convertSchemaToDraft6(newSchema.extends, version) ];
    delete newSchema.extends;
  }

  // convert v1-v3 disallow to not
  if (newSchema.disallow) {
    if (typeof newSchema.disallow === 'string') {
      newSchema.not = { type: newSchema.disallow };
    } else if (Array.isArray(newSchema.disallow)) {
      newSchema.not = {
        anyOf: newSchema.disallow
          .map(type => typeof type === 'string' ? { type } : type)
      };
    }
    delete newSchema.disallow;
  }

  // delete v3 boolean required key
  if (typeof newSchema.required === 'boolean') {
    delete newSchema.required;
  }

  // delete v1-v2 boolean optional key
  if (typeof newSchema.optional === 'boolean') {
    delete newSchema.optional;
    if (!version) { version = 2; }
  }

  // convert v3 string dependencies to arrays
  if (newSchema.dependencies) {
    newSchema.dependencies = { ...newSchema.dependencies };
    Object.keys(newSchema.dependencies)
      .filter(key => typeof newSchema.dependencies[key] === 'string')
      .forEach(key => newSchema.dependencies[key] = [ newSchema.dependencies[key] ]);
  }

  // convert v2-v3 divisibleBy to multipleOf
  if (newSchema.divisibleBy) {
    newSchema.multipleOf = newSchema.divisibleBy;
    delete newSchema.divisibleBy;
  }

  // convert v1 maxDecimal to multipleOf
  if (newSchema.maxDecimal) {
    newSchema.multipleOf = 1 / Math.pow(10, newSchema.maxDecimal);
    delete newSchema.divisibleBy;
    if (!version || version === 2) { version = 1; }
  }

  // fix v3-v4 boolean exclusiveMinimum
  if (newSchema.minimum && newSchema.exclusiveMinimum === true) {
    newSchema.exclusiveMinimum = newSchema.minimum;
    delete newSchema.minimum;
  } else if (typeof newSchema.exclusiveMinimum !== 'number') {
    delete newSchema.exclusiveMinimum;
  }

  // convert v1-v2 boolean minimumCanEqual to exclusiveMinimum
  if (newSchema.minimum && newSchema.minimumCanEqual === false) {
    newSchema.exclusiveMinimum = newSchema.minimum;
    delete newSchema.minimum;
    if (!version) { version = 2; }
  } else if (newSchema.minimumCanEqual) {
    delete newSchema.minimumCanEqual;
    if (!version) { version = 2; }
  }

  // fix v3-v4 boolean exclusiveMaximum
  if (newSchema.maximum && newSchema.exclusiveMaximum === true) {
    newSchema.exclusiveMaximum = newSchema.maximum;
    delete newSchema.maximum;
  } else if (typeof newSchema.exclusiveMaximum !== 'number') {
    delete newSchema.exclusiveMaximum;
  }

  // convert v1-v2 boolean maximumCanEqual to exclusiveMaximum
  if (newSchema.maximum && newSchema.maximumCanEqual === false) {
    newSchema.exclusiveMaximum = newSchema.maximum;
    delete newSchema.maximum;
    if (!version) { version = 2; }
  } else if (newSchema.maximumCanEqual) {
    delete newSchema.maximumCanEqual;
    if (!version) { version = 2; }
  }

  // move v3 boolean required from individual items to required array
  // move v1-v2 boolean optional from individual items to required array
  // move v1-v2 requires from individual items to dependencies object
  if (newSchema.properties) {
    const requiredKeys = new Set(newSchema.required || []);

    // Look for v3 boolean required properties
    Object.keys(newSchema.properties)
      .filter(key => newSchema.properties[key].required === true)
      .forEach(key => requiredKeys.add(key));

    // Look for v1-v2 boolean optional properties
    if (version === 1 || version === 2 || Object.keys(newSchema.properties)
      .some(key => newSchema.properties[key].optional === true)
    ) {
      Object.keys(newSchema.properties)
        .filter(key => newSchema.properties[key].optional !== true)
        .forEach(key => requiredKeys.add(key));
      if (!version) { version = 2; }
    }
    if (requiredKeys.size) { newSchema.required = Array.from(requiredKeys); }

    // Look for v1-v2 requires items
    const dependencies = { ...newSchema.dependencies };
    Object.keys(newSchema.properties)
      .filter(key => newSchema.properties[key].requires)
      .forEach(key => dependencies[key] =
        typeof newSchema.properties[key].requires === 'string' ?
          [ newSchema.properties[key].requires ] :
          newSchema.properties[key].requires
      );
    if (Object.keys(dependencies).length) { newSchema.dependencies = dependencies; }

  // move incorrectly placed required list inside array object
  } else if (Array.isArray(newSchema.required) &&
    ((newSchema.items || {}).properties || (newSchema.additionalItems || {}).properties)
  ) {
    const getRequired = (object, key) => Array.isArray(object[key].required) ?
      Array.from(new Set([ ...object[key].required, ...object.required ])) :
      [ ...object.required ];
    // TODO: verify required keys exist before moving?
    if ((newSchema.items || {}).properties) {
      newSchema.items = { ...newSchema.items };
      newSchema.items.required = getRequired(newSchema, 'items');
      delete newSchema.required;
    } else { // (newSchema.additionalItems || {}).properties
      newSchema.additionalItems = { ...newSchema.additionalItems };
      newSchema.additionalItems.required = getRequired(newSchema, 'additionalItems');
      delete newSchema.required;
    }
  }

  // update or delete $schema identifier
  if (
    newSchema.$schema === 'http://json-schema.org/draft-01/schema#' ||
    newSchema.$schema === 'http://json-schema.org/draft-02/schema#' ||
    newSchema.$schema === 'http://json-schema.org/draft-03/schema#' ||
    newSchema.$schema === 'http://json-schema.org/draft-04/schema#'
  ) {
    newSchema.$schema = 'http://json-schema.org/draft-06/schema#';
  } else if (newSchema.$schema) {
    const description = 'Converted to draft 6 from ' + newSchema.$schema;
    if (newSchema.description) {
      newSchema.description += '\n' + description;
    } else {
      newSchema.description = description
    }
    delete newSchema.$schema;
  }

  // convert id to $id
  if (newSchema.id && !newSchema.$id) {
    newSchema.$id = newSchema.id + '-CONVERTED-TO-DRAFT-06';
    delete newSchema.id;
  }

  // convert sub schemas
  Object.keys(newSchema)
    .filter(key => typeof newSchema[key] === 'object')
    .forEach(key => {
      if (
        [ 'definitions', 'dependencies', 'properties', 'patternProperties' ]
          .includes(key) && !Array.isArray(newSchema[key])
      ) {
        const newKey = {};
        for (const subKey of Object.keys(newSchema[key])) {
          newKey[subKey] = convertSchemaToDraft6(newSchema[key][subKey], version);
        }
        newSchema[key] = newKey;
      } else if (
        [ 'items', 'additionalItems', 'additionalProperties',
          'allOf', 'anyOf', 'oneOf', 'not' ].includes(key)
      ) {
        newSchema[key] = convertSchemaToDraft6(newSchema[key], version);
      }
    });

  return newSchema;
}
