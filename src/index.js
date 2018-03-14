import Vue from 'vue'
import { get, set } from './utils'

function accessor(key) {
  return {
    get() {
      return get(this.$bus, key)
    },
    set(value) {
      set(this.$bus, key, value)
    },
  }
}

function bindStore(vm, bus) {
  const { options } = bus

  if (vm.$options.driver) {
    if (typeof vm.$options.computed === 'undefined') {
      vm.$options.computed = {}
    }
    if (typeof vm.$options.methods === 'undefined') {
      vm.$options.methods = {}
    }

    const config = vm.$options.driver

    if (config.state) {
      config.state.forEach(key => {
        vm.$options.computed[key] = accessor(key)
      })
    }

    if (config.actions) {
      config.actions
        .filter(x => x)
        .forEach(key => {
          vm.$options.methods[key] = options.actions[key].bind(vm.$bus)
        })
    }

    if (config.getters) {
      config.getters.forEach(key => {
        vm.$options.computed[key] = accessor(key)
      })
    }
  }
}


export default class Bus {
  constructor(options) {
    this.options = options
    this.modules = []
    this.watchers = []
    this.vm = null
  }

  _createVm() {
    const state = this.options.state ? this.options.state : this.options
    this.modules.forEach(module => state[module.name] = module.state)
    const vm = new Vue({ data: () => state, computed: this.options.getters })
    vm.actions = Object
      .keys(this.options.actions)
      .reduce((actions, name) => Object.assign(actions, {
        [name]: this.options.actions[name].bind(vm)
      }), {})
    this.watchers.forEach(({ name, callback, options }) => vm.$watch(name, callback, options))
    return vm
  }

  watch(name, callback, options) {
    this.watchers.push({ name, callback, options })
  }

  addModules(name, state) {
    this.modules.push({ name, state })
  }

  install(Vue) {
    const bus = this
    this.vm = this._createVm()

    const merge = (to = [], from) => {
      const uniq = arr => [ ...new Set(arr) ]
      const option = uniq(to.concat(from)).filter(x => x)
      return (option.length > 0) ? option : undefined
    }

    Vue.config.optionMergeStrategies.driver = (to = {}, from) => {
      return {
        state: merge(to.state, from.state),
        actions: merge(to.actions, from.actions),
        getters: merge(to.getters, from.getters),
      }
    }

    Object.defineProperty(Vue.prototype, '$bus', { get: () => bus.vm, })

    Vue.mixin({
      beforeCreate() {
        bindStore(this, bus)
      }
    })
  }

  routerSync(router, stateName = 'route') {
    this.addModules(stateName, {})

    router.afterEach((to, from) => {
      const { path, query, params, fullPath, meta } = to
      this.vm[stateName] = { path, query, params, fullPath, meta }
      this.vm[stateName].from = from
    })

    this.watch(stateName, (route, from) => {
      router.push(route)
    }, { deep: true, sync: true })
  }
}
