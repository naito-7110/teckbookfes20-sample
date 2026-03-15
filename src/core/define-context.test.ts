import { describe, it, expect, vi } from 'vitest'
import { defineContext } from './define-context'
import * as vue from 'vue'

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof vue>('vue')
  return {
    ...actual,
    provide: vi.fn(),
    inject: vi.fn(),
  }
})

describe('defineContext', () => {
  it('useContext と provideContext 関数を返す', () => {
    const { useContext, provideContext } = defineContext<string>('Test')

    expect(typeof useContext).toBe('function')
    expect(typeof provideContext).toBe('function')
  })

  it('provideContext で渡した値を useContext で取得できる', () => {
    type User = { id: number; name: string }
    const { useContext, provideContext } = defineContext<User>('User')
    const testUser: User = { id: 1, name: 'Alice' }

    provideContext(testUser)
    expect(vue.provide).toHaveBeenCalledWith(expect.any(Symbol), testUser)

    vi.mocked(vue.inject).mockReturnValueOnce(testUser)
    expect(useContext()).toStrictEqual(testUser)
  })

  it('異なる name のコンテキストは独立している', () => {
    const contextA = defineContext<string>('ContextA')
    const contextB = defineContext<string>('ContextB')

    contextA.provideContext('value-a')
    contextB.provideContext('value-b')

    const calls = vi.mocked(vue.provide).mock.calls
    const symbolA = calls[calls.length - 2][0] as symbol
    const symbolB = calls[calls.length - 1][0] as symbol

    expect(symbolA).not.toBe(symbolB)
    expect(symbolA.toString()).toContain('ContextA')
    expect(symbolB.toString()).toContain('ContextB')
  })

  it('コンテキスト未提供時はエラーをスローする', () => {
    const { useContext } = defineContext<string>('MyService')

    vi.mocked(vue.inject).mockReturnValueOnce(undefined)

    expect(() => useContext()).toThrow('MyServiceContext is not found')
  })

  it('fallback を指定するとコンテキスト未提供時にその値が返される', () => {
    const { useContext } = defineContext<string>('Optional')
    const fallbackValue = 'default-value'

    vi.mocked(vue.inject).mockReturnValueOnce(fallbackValue)

    const result = useContext(fallbackValue)

    expect(vue.inject).toHaveBeenCalledWith(expect.any(Symbol), fallbackValue)
    expect(result).toBe(fallbackValue)
  })
})
