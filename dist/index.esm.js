var get = require('lodash/get');
var set = require('lodash/set');
var uniq = require('lodash/uniq');

function accessor(key) {
  return {
    get: function get$1() {
      return get(this.$bus, key)
    },
    set: function set$1(value) {
      set(this.$bus, key, value);
    },
  }
}

function bindStore(vm, bus) {
  var options = bus.options;

  if (vm.$options.driver) {
    if (typeof vm.$options.computed === 'undefined') {
      vm.$options.computed = {};
    }
    if (typeof vm.$options.methods === 'undefined') {
      vm.$options.methods = {};
    }

    var config = vm.$options.driver;

    if (config.state) {
      config.state.forEach(function (key) {
        vm.$options.computed[key] = accessor(key);
      });
    }

    if (config.actions) {
      config.actions
        .filter(function (x) { return x; })
        .forEach(function (key) {
          vm.$options.methods[key] = options.actions[key].bind(vm.$bus);
        });
    }

    if (config.getters) {
      config.getters.forEach(function (key) {
        vm.$options.computed[key] = accessor(key);
      });
    }
  }
}


var Bus = function Bus(options) {
  this.options = options;
  this.modules = [];
  this.watchers = [];
  this.vm = null;
};

Bus.prototype._createVm = function _createVm (Vue) {
    var this$1 = this;

  var state = this.options.state ? this.options.state : this.options;
  this.modules.forEach(function (module) { return state[module.name] = module.state; });
  var vm = new Vue({ data: function () { return state; }, computed: this.options.getters });
  vm.actions = Object
    .keys(this.options.actions)
    .reduce(function (actions, name) {
        var obj;

        return Object.assign(actions, ( obj = {}, obj[name] = this$1.options.actions[name].bind(vm), obj));
    }, {});
  this.watchers.forEach(function (ref) {
      var name = ref.name;
      var callback = ref.callback;
      var options = ref.options;

      return vm.$watch(name, callback, options);
    });
  return vm
};

Bus.prototype.watch = function watch (name, callback, options) {
  this.watchers.push({ name: name, callback: callback, options: options });
};

Bus.prototype.addModules = function addModules (name, state) {
  this.modules.push({ name: name, state: state });
};

Bus.prototype.install = function install (Vue) {
  var bus = this;
  this.vm = this._createVm(Vue);

  var merge = function (to, from) {
      if ( to === void 0 ) to = [];

    var option = uniq(to.concat(from)).filter(function (x) { return x; });
    return (option.length > 0) ? option : undefined
  };

  Vue.config.optionMergeStrategies.driver = function (to, from) {
      if ( to === void 0 ) to = {};

    return {
      state: merge(to.state, from.state),
      actions: merge(to.actions, from.actions),
      getters: merge(to.getters, from.getters),
    }
  };

  Object.defineProperty(Vue.prototype, '$bus', { get: function () { return bus.vm; }, });

  Vue.mixin({
    beforeCreate: function beforeCreate() {
      bindStore(this, bus);
    }
  });
};

Bus.prototype.routerSync = function routerSync (router, stateName) {
    var this$1 = this;
    if ( stateName === void 0 ) stateName = 'route';

  this.addModules(stateName, {});

  router.afterEach(function (to, from) {
    var path = to.path;
      var query = to.query;
      var params = to.params;
      var fullPath = to.fullPath;
      var meta = to.meta;
    this$1.vm[stateName] = { path: path, query: query, params: params, fullPath: fullPath, meta: meta };
    this$1.vm[stateName].from = from;
  });

  this.watch(stateName, function (route, from) {
    router.push(route);
  }, { deep: true, sync: true });
};

export default Bus;
