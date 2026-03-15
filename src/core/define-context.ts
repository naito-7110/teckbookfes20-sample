import { inject, provide, type InjectionKey } from 'vue'
export function defineContext<ContextValue>(name: string) {
  const contextName = `${name}Context`

  const injectionKey: InjectionKey<ContextValue | null> = Symbol(contextName)

  const useContext = <T extends ContextValue | null | undefined>(
    fallback?: T,
  ) => {
    const context = inject(injectionKey, fallback)

    if (!context) {
      throw new Error(`${contextName} is not found`)
    }

    return context
  }

  const provideContext = (contextValue: ContextValue) => {
    provide(injectionKey, contextValue)
  }

  return {
    useContext,
    provideContext,
  } as const
}
