import {
  cloneVNode,
  defineComponent,
  Fragment,
  mergeProps,
  Comment,
  type VNode,
} from 'vue'

function flattenVNodes(children?: VNode[]): VNode[] {
  if (!children) return []

  return children.flatMap(child => {
    if (Array.isArray(child)) {
      return flattenVNodes(child)
    }

    if (child.type === Fragment) {
      return flattenVNodes(child.children as VNode[])
    }

    return [child as VNode]
  })
}

function findFirstNonCommentChildIndex(children: VNode[]) {
  return children.findIndex(child => child.type !== Comment)
}

function omitRef<T extends Record<string, unknown> | null | undefined>(
  props: T,
) {
  if (!props || !('ref' in props)) return props

  const { ref: _, ...rest } = props

  return rest as T
}

function mergeVNodeProps(vnode: VNode, attrs: Record<string, unknown>) {
  const props = omitRef(vnode.props as Record<string, unknown> | null)

  return props ? mergeProps(attrs, props) : attrs
}

const Injection = defineComponent({
  name: 'Injection',
  inheritAttrs: false,
  setup(_, { slots, attrs }) {
    return () => {
      if (!slots.default) return null

      const children = flattenVNodes(slots.default() ?? [])

      const firstNonCommentChildIndex = findFirstNonCommentChildIndex(children)

      if (firstNonCommentChildIndex === -1) return children

      const firstNonCommentChild = children[firstNonCommentChildIndex]
      const mergedProps = mergeVNodeProps(firstNonCommentChild, attrs)

      const cloned = cloneVNode(
        { ...firstNonCommentChild, props: {} },
        mergedProps,
      )

      if (children.length === 1) {
        return cloned
      }

      return children.map((child, index) => {
        return index === firstNonCommentChildIndex ? cloned : child
      })
    }
  },
})

export default Injection
