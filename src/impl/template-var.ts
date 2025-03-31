import { DEFAULT_TEMPLATE_VAR_PREFIX } from '../constants'
import { lazyContext } from '../context-helpers/internal-context'
import { CodeError } from '../errors'

export function TemplateVarImpl<T>(variableName: string, prefix = DEFAULT_TEMPLATE_VAR_PREFIX): T {
  const key = prefix + variableName
  if (!Object.hasOwn(lazyContext.value.templateVars, key)) {
    throw new CodeError(`Template variable ${key} not found in test context!`)
  }
  return lazyContext.value.templateVars[prefix + variableName] as T
}
