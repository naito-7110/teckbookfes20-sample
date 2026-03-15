import { Fragment, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Injection from './injection'

describe('Injection', () => {
  describe('基本動作', () => {
    it('スロットなしの場合、null を返す', () => {
      const wrapper = mount(Injection)
      expect(wrapper.html()).toBe('')
    })

    it('単一の子要素に attrs が注入される', () => {
      const wrapper = mount(Injection, {
        attrs: { id: 'test-id', 'data-foo': 'bar' },
        slots: {
          default: () => h('div', 'content'),
        },
      })
      expect(wrapper.find('div').attributes('id')).toBe('test-id')
      expect(wrapper.find('div').attributes('data-foo')).toBe('bar')
    })

    it('複数の子要素がある場合、最初の非コメント要素のみに attrs が注入される', () => {
      const wrapper = mount(Injection, {
        attrs: {
          id: 'injected',
          class: 'injected-class',
          'data-test': 'value',
        },
        slots: {
          default: () => [
            h('span', 'first'),
            h('span', 'second'),
            h('span', 'third'),
          ],
        },
      })
      const spans = wrapper.findAll('span')
      // 最初の要素に全ての attrs が注入される
      expect(spans[0].attributes('id')).toBe('injected')
      expect(spans[0].attributes('class')).toBe('injected-class')
      expect(spans[0].attributes('data-test')).toBe('value')
      // 2番目以降には一切注入されない
      expect(spans[1].attributes('id')).toBeUndefined()
      expect(spans[1].attributes('class')).toBeUndefined()
      expect(spans[1].attributes('data-test')).toBeUndefined()
      expect(spans[2].attributes('id')).toBeUndefined()
    })
  })

  describe('attrs マージ', () => {
    it('class が正しくマージされる', () => {
      const wrapper = mount(Injection, {
        attrs: { class: 'parent-class' },
        slots: {
          default: () => h('div', { class: 'child-class' }, 'content'),
        },
      })
      const div = wrapper.find('div')
      expect(div.classes()).toContain('parent-class')
      expect(div.classes()).toContain('child-class')
    })

    it('style が正しくマージされる', () => {
      const wrapper = mount(Injection, {
        attrs: { style: { color: 'red' } },
        slots: {
          default: () =>
            h('div', { style: { backgroundColor: 'blue' } }, 'content'),
        },
      })
      const div = wrapper.find('div')
      expect(div.element.style.color).toBe('red')
      expect(div.element.style.backgroundColor).toBe('blue')
    })

    it('イベントハンドラがマージされる', async () => {
      const parentHandler = vi.fn()
      const childHandler = vi.fn()
      const wrapper = mount(Injection, {
        attrs: { onClick: parentHandler },
        slots: {
          default: () => h('button', { onClick: childHandler }, 'click me'),
        },
      })
      await wrapper.find('button').trigger('click')
      expect(parentHandler).toHaveBeenCalledTimes(1)
      expect(childHandler).toHaveBeenCalledTimes(1)
    })

    it('イベントハンドラは親→子の順で呼び出される', async () => {
      const callOrder: string[] = []
      const parentHandler = vi.fn(() => callOrder.push('parent'))
      const childHandler = vi.fn(() => callOrder.push('child'))

      const wrapper = mount(Injection, {
        attrs: { onClick: parentHandler },
        slots: {
          default: () => h('button', { onClick: childHandler }, 'click me'),
        },
      })
      await wrapper.find('button').trigger('click')

      expect(callOrder).toEqual(['parent', 'child'])
    })

    it('子要素の既存 props が保持される', () => {
      const wrapper = mount(Injection, {
        attrs: { 'data-injected': 'true' },
        slots: {
          default: () => h('input', { type: 'text', disabled: true }),
        },
      })
      const input = wrapper.find('input')
      expect(input.attributes('type')).toBe('text')
      expect(input.attributes('disabled')).toBe('')
      expect(input.attributes('data-injected')).toBe('true')
    })

    it('aria 属性が正しく渡される', () => {
      const wrapper = mount(Injection, {
        attrs: {
          'aria-label': 'test label',
          'aria-hidden': 'true',
          role: 'button',
        },
        slots: {
          default: () => h('div', 'content'),
        },
      })
      const div = wrapper.find('div')
      expect(div.attributes('aria-label')).toBe('test label')
      expect(div.attributes('aria-hidden')).toBe('true')
      expect(div.attributes('role')).toBe('button')
    })

    it('data 属性が正しく渡される', () => {
      const wrapper = mount(Injection, {
        attrs: { 'data-testid': 'my-test', 'data-custom': 'value' },
        slots: {
          default: () => h('div', 'content'),
        },
      })
      const div = wrapper.find('div')
      expect(div.attributes('data-testid')).toBe('my-test')
      expect(div.attributes('data-custom')).toBe('value')
    })
  })

  describe('属性の優先順位', () => {
    it('同名属性は子要素の値が優先される', () => {
      const wrapper = mount(Injection, {
        attrs: { 'data-value': 'parent' },
        slots: {
          default: () => h('div', { 'data-value': 'child' }, 'content'),
        },
      })
      expect(wrapper.find('div').attributes('data-value')).toBe('child')
    })

    it('子要素にない属性のみ親から注入される', () => {
      const wrapper = mount(Injection, {
        attrs: { 'data-parent': 'from-parent', 'data-shared': 'parent-value' },
        slots: {
          default: () =>
            h(
              'div',
              { 'data-child': 'from-child', 'data-shared': 'child-value' },
              'content',
            ),
        },
      })
      const div = wrapper.find('div')
      expect(div.attributes('data-parent')).toBe('from-parent')
      expect(div.attributes('data-child')).toBe('from-child')
      expect(div.attributes('data-shared')).toBe('child-value')
    })
  })

  describe('Fragment 対応', () => {
    it('Fragment でラップされた子要素が正しく処理される', () => {
      const wrapper = mount(Injection, {
        attrs: { id: 'fragment-injected' },
        slots: {
          default: () => h(Fragment, [h('div', 'first'), h('div', 'second')]),
        },
      })
      const divs = wrapper.findAll('div')
      expect(divs[0].attributes('id')).toBe('fragment-injected')
      expect(divs[1].attributes('id')).toBeUndefined()
    })
  })

  describe('ネストされたスロット', () => {
    it('配列でネストされた子要素が正しくフラット化される', () => {
      const wrapper = mount(Injection, {
        attrs: { id: 'nested-injected' },
        slots: {
          default: () => [[h('span', 'nested')]],
        },
      })
      expect(wrapper.find('span').attributes('id')).toBe('nested-injected')
    })

    it('深くネストされた構造でも最初の非コメント要素に attrs が注入される', () => {
      const wrapper = mount(Injection, {
        attrs: { id: 'deep-nested' },
        slots: {
          default: () => [[[h('div', 'deep')]], h('span', 'shallow')],
        },
      })
      const div = wrapper.find('div')
      const span = wrapper.find('span')
      expect(div.attributes('id')).toBe('deep-nested')
      expect(span.attributes('id')).toBeUndefined()
    })

    it('Injection がネストされた場合、末端の要素まで attrs が伝播する', () => {
      const wrapper = mount(Injection, {
        attrs: { id: 'outer', 'data-outer': 'true' },
        slots: {
          default: () =>
            h(
              Injection,
              { id: 'inner', 'data-inner': 'true' },
              { default: () => h('div', 'content') },
            ),
        },
      })
      const div = wrapper.find('div')
      // 内側の Injection の attrs が末端の div に注入される
      expect(div.attributes('id')).toBe('inner')
      expect(div.attributes('data-inner')).toBe('true')
    })

    it('ラッパーコンポーネントを経由した場合、attrs はルート要素のみに注入され孫要素には伝播しない', () => {
      const WrapperComponent = {
        inheritAttrs: true,
        template: '<section><slot /></section>',
      }
      const wrapper = mount(Injection, {
        attrs: { id: 'injected-to-wrapper', 'data-test': 'value' },
        slots: {
          default: () =>
            h(WrapperComponent, null, {
              default: () => h('span', 'nested content'),
            }),
        },
      })
      // attrs は WrapperComponent のルート要素 (section) に注入される
      const section = wrapper.find('section')
      expect(section.attributes('id')).toBe('injected-to-wrapper')
      expect(section.attributes('data-test')).toBe('value')
      // 孫要素 (span) には attrs が伝播しない
      const span = wrapper.find('span')
      expect(span.text()).toBe('nested content')
      expect(span.attributes('id')).toBeUndefined()
      expect(span.attributes('data-test')).toBeUndefined()
    })

    it('複数階層の Injection ネストでも各階層の attrs が正しく注入される', () => {
      const wrapper = mount(Injection, {
        attrs: { 'data-level': '1' },
        slots: {
          default: () =>
            h(
              Injection,
              { 'data-level': '2' },
              {
                default: () =>
                  h(
                    Injection,
                    { 'data-level': '3' },
                    { default: () => h('div', 'deepest') },
                  ),
              },
            ),
        },
      })
      const div = wrapper.find('div')
      // 最も内側の Injection の attrs が末端の div に注入される
      expect(div.attributes('data-level')).toBe('3')
      expect(div.text()).toBe('deepest')
    })
  })

  describe('Comment ノード対応', () => {
    it('Comment ノードはスキップされ、最初の実要素に attrs が注入される', () => {
      const TestComponent = {
        components: { Injection },
        template: `
          <Injection id="after-comment">
            <!-- this is a comment -->
            <div>content</div>
          </Injection>
        `,
      }
      const wrapper = mount(TestComponent)
      expect(wrapper.find('div').attributes('id')).toBe('after-comment')
    })
  })

  describe('ref の除外', () => {
    it('子要素の ref は除外される', () => {
      const myRef = ref(null)
      const wrapper = mount(Injection, {
        attrs: { id: 'ref-test' },
        slots: {
          default: () => h('div', { ref: myRef }, 'content'),
        },
      })
      expect(wrapper.find('div').attributes('id')).toBe('ref-test')
      expect(wrapper.find('div').attributes('ref')).toBeUndefined()
    })
  })

  describe('エッジケース', () => {
    it('空の attrs の場合、子要素はそのまま返される', () => {
      const wrapper = mount(Injection, {
        attrs: {},
        slots: {
          default: () => h('div', { id: 'original' }, 'content'),
        },
      })
      expect(wrapper.find('div').attributes('id')).toBe('original')
    })

    it('全て Comment ノードの場合、attrs は注入されない', () => {
      const TestComponent = {
        components: { Injection },
        template: `
          <Injection id="should-not-appear">
            <!-- comment 1 -->
            <!-- comment 2 -->
          </Injection>
        `,
      }
      const wrapper = mount(TestComponent)
      expect(wrapper.html()).not.toContain('id="should-not-appear"')
    })
  })
})
