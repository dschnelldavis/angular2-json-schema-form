/**
 * 'convertSchemaToDraft6' function
 *
 * Converts a JSON Schema in version 1 through 4 format to version 6 format
 *
 * Originally based on geraintluff's JSON Schema 3 to 4 compatibility function
 *   https://github.com/geraintluff/json-schema-compatibility
 * Also uses suggestions from AJV's JSON Schema 4 to 6 migration guide
 *   https://github.com/epoberezkin/ajv/releases/tag/5.0.0
 * And additional details from the official JSON Schema documentation
 *   http://json-schema.org
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

  if (typeof newSchema.$schema === 'string' &&
    /http\:\/\/json\-schema\.org\/draft\-0\d\/schema\#/.test(newSchema.$schema)
  ) {
    version = newSchema.$schema[30];
  }

  // Convert v1-v2 contentEncoding to media.binaryEncoding
  // Note: This is only used in JSON hyper-schema (not regular JSON schema)
  if (newSchema.contentEncoding) {
    newSchema.media = { binaryEncoding: newSchema.contentEncoding };
    delete newSchema.contentEncoding;
  }

  // Convert v1-v3 extends to allOf
  if (newSchema.extends) {
    newSchema.allOf = Array.isArray(newSchema.extends) ?
      newSchema.extends.map(subSchema => convertSchemaToDraft6(subSchema, version)) :
      [ convertSchemaToDraft6(newSchema.extends, version) ];
    delete newSchema.extends;
  }

  // Convert v1-v3 disallow to not
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

  // Delete v3 boolean required key
  if (typeof newSchema.required === 'boolean') {
    delete newSchema.required;
  }

  // Delete v1-v2 boolean optional key
  if (typeof newSchema.optional === 'boolean') {
    delete newSchema.optional;
    if (!version) { version = 2; }
  }

  // Convert v3 string dependencies to arrays
  if (newSchema.dependencies) {
    newSchema.dependencies = { ...newSchema.dependencies };
    Object.keys(newSchema.dependencies)
      .filter(key => typeof newSchema.dependencies[key] === 'string')
      .forEach(key => newSchema.dependencies[key] = [ newSchema.dependencies[key] ]);
  }

  // Convert v2-v3 divisibleBy to multipleOf
  if (newSchema.divisibleBy) {
    newSchema.multipleOf = newSchema.divisibleBy;
    delete newSchema.divisibleBy;
  }

  // Convert v1 maxDecimal to multipleOf
  if (newSchema.maxDecimal) {
    newSchema.multipleOf = 1 / Math.pow(10, newSchema.maxDecimal);
    delete newSchema.divisibleBy;
    if (!version || version === 2) { version = 1; }
  }

  // Fix v3-v4 boolean exclusiveMinimum
  if (newSchema.minimum && newSchema.exclusiveMinimum === true) {
    newSchema.exclusiveMinimum = newSchema.minimum;
    delete newSchema.minimum;
  } else if (typeof newSchema.exclusiveMinimum !== 'number') {
    delete newSchema.exclusiveMinimum;
  }

  // Convert v1-v2 boolean minimumCanEqual to exclusiveMinimum
  if (newSchema.minimum && newSchema.minimumCanEqual === false) {
    newSchema.exclusiveMinimum = newSchema.minimum;
    delete newSchema.minimum;
    if (!version) { version = 2; }
  } else if (newSchema.minimumCanEqual) {
    delete newSchema.minimumCanEqual;
    if (!version) { version = 2; }
  }

  // Fix v3-v4 boolean exclusiveMaximum
  if (newSchema.maximum && newSchema.exclusiveMaximum === true) {
    newSchema.exclusiveMaximum = newSchema.maximum;
    delete newSchema.maximum;
  } else if (typeof newSchema.exclusiveMaximum !== 'number') {
    delete newSchema.exclusiveMaximum;
  }

  // Convert v1-v2 boolean maximumCanEqual to exclusiveMaximum
  if (newSchema.maximum && newSchema.maximumCanEqual === false) {
    newSchema.exclusiveMaximum = newSchema.maximum;
    delete newSchema.maximum;
    if (!version) { version = 2; }
  } else if (newSchema.maximumCanEqual) {
    delete newSchema.maximumCanEqual;
    if (!version) { version = 2; }
  }

  // Move v3 boolean required from individual items to required array
  // Move v1-v2 boolean optional from individual items to required array
  // Move v1-v2 requires from individual items to dependencies object
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
  }

  // Update or remove $schema identifier
  if (typeof newSchema.$schema === 'string' &&
    /http\:\/\/json\-schema\.org\/draft\-0[1-4]\/schema\#/.test(newSchema.$schema)
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

  // Convert id to $id
  if (newSchema.id && !newSchema.$id) {
    newSchema.$id = newSchema.id + '-CONVERTED-TO-DRAFT-06';
    delete newSchema.id;
  }

  // Convert sub schemas
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
