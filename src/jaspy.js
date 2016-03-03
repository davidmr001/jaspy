/*
 * Copyright (C) 2016, Maximilian Koehl <mail@koehlma.de>
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
 * PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

window['jaspy'] = (function () {
    'use strict';


    var DEBUG = false;

    var CODE_FLAGS = {
        OPTIMIZED: 1 << 0,
        NEWLOCALS: 1 << 1,
        NESTED: 1 << 4,
        GENERATOR: 1 << 5,
        NOFREE: 1 << 6,

        VAR_ARGS: 1 << 2,
        VAR_KWARGS: 1 << 3,

        PYTHON: 1 << 10,
        NATIVE: 1 << 11
    };
    var BLOCK_TYPES = {
        BASE: 0,
        LOOP: 1,
        EXCEPT: 2,
        FINALLY: 3
    };

    var UNWIND_CAUSES = {
        RETURN: 0,
        EXCEPTION: 1,
        BREAK: 2,
        CONTINUE: 3
    };

    var COMPARE_OPS = {
        LT: 0, LE: 1, EQ: 2, NE: 3, GT: 4, GE: 5, IN: 6, NIN: 7, IS: 8, NIS: 9, EXC: 10
    };
    var COMPARE_SLOTS = (function () {
        var map = new Array(10);
        map[COMPARE_OPS.LT] = '__lt__';
        map[COMPARE_OPS.LE] = '__le__';
        map[COMPARE_OPS.EQ] = '__eq__';
        map[COMPARE_OPS.NE] = '__ne__';
        map[COMPARE_OPS.GT] = '__gt__';
        map[COMPARE_OPS.GE] = '__ge__';
        map[COMPARE_OPS.IN] = map[COMPARE_OPS.NIN] = '__contains__';
        return map;
    })();

    var OPCODES = {
        BEFORE_ASYNC_WITH: 52,
        BINARY_ADD: 23,
        BINARY_AND: 64,
        BINARY_FLOOR_DIVIDE: 26,
        BINARY_LSHIFT: 62,
        BINARY_MATRIX_MULTIPLY: 16,
        BINARY_MODULO: 22,
        BINARY_MULTIPLY: 20,
        BINARY_OR: 66,
        BINARY_POWER: 19,
        BINARY_RSHIFT: 63,
        BINARY_SUBSCR: 25,
        BINARY_SUBTRACT: 24,
        BINARY_TRUE_DIVIDE: 27,
        BINARY_XOR: 65,
        BREAK_LOOP: 80,
        BUILD_LIST: 103,
        BUILD_LIST_UNPACK: 149,
        BUILD_MAP: 105,
        BUILD_MAP_UNPACK: 150,
        BUILD_MAP_UNPACK_WITH_CALL: 151,
        BUILD_SET: 104,
        BUILD_SET_UNPACK: 153,
        BUILD_SLICE: 133,
        BUILD_TUPLE: 102,
        BUILD_TUPLE_UNPACK: 152,
        CALL_FUNCTION: 131,
        CALL_FUNCTION_KW: 141,
        CALL_FUNCTION_VAR: 140,
        CALL_FUNCTION_VAR_KW: 142,
        COMPARE_OP: 107,
        CONTINUE_LOOP: 119,
        DELETE_ATTR: 96,
        DELETE_DEREF: 138,
        DELETE_FAST: 126,
        DELETE_GLOBAL: 98,
        DELETE_NAME: 91,
        DELETE_SUBSCR: 61,
        DUP_TOP: 4,
        DUP_TOP_TWO: 5,
        END_FINALLY: 88,
        EXTENDED_ARG: 144,
        FOR_ITER: 93,
        GET_AITER: 50,
        GET_ANEXT: 51,
        GET_AWAITABLE: 73,
        GET_ITER: 68,
        GET_YIELD_FROM_ITER: 69,
        IMPORT_FROM: 109,
        IMPORT_NAME: 108,
        IMPORT_STAR: 84,
        INPLACE_ADD: 55,
        INPLACE_AND: 77,
        INPLACE_FLOOR_DIVIDE: 28,
        INPLACE_LSHIFT: 75,
        INPLACE_MATRIX_MULTIPLY: 17,
        INPLACE_MODULO: 59,
        INPLACE_MULTIPLY: 57,
        INPLACE_OR: 79,
        INPLACE_POWER: 67,
        INPLACE_RSHIFT: 76,
        INPLACE_SUBTRACT: 56,
        INPLACE_TRUE_DIVIDE: 29,
        INPLACE_XOR: 78,
        JUMP_ABSOLUTE: 113,
        JUMP_FORWARD: 110,
        JUMP_IF_FALSE_OR_POP: 111,
        JUMP_IF_TRUE_OR_POP: 112,
        LIST_APPEND: 145,
        LOAD_ATTR: 106,
        LOAD_BUILD_CLASS: 71,
        LOAD_CLASSDEREF: 148,
        LOAD_CLOSURE: 135,
        LOAD_CONST: 100,
        LOAD_DEREF: 136,
        LOAD_FAST: 124,
        LOAD_GLOBAL: 116,
        LOAD_NAME: 101,
        MAKE_CLOSURE: 134,
        MAKE_FUNCTION: 132,
        MAP_ADD: 147,
        NOP: 9,
        POP_BLOCK: 87,
        POP_EXCEPT: 89,
        POP_JUMP_IF_FALSE: 114,
        POP_JUMP_IF_TRUE: 115,
        POP_TOP: 1,
        PRINT_EXPR: 70,
        RAISE_VARARGS: 130,
        RETURN_VALUE: 83,
        ROT_THREE: 3,
        ROT_TWO: 2,
        SETUP_ASYNC_WITH: 154,
        SETUP_EXCEPT: 121,
        SETUP_FINALLY: 122,
        SETUP_LOOP: 120,
        SETUP_WITH: 143,
        SET_ADD: 146,
        STORE_ATTR: 95,
        STORE_DEREF: 137,
        STORE_FAST: 125,
        STORE_GLOBAL: 97,
        STORE_NAME: 90,
        STORE_SUBSCR: 60,
        UNARY_INVERT: 15,
        UNARY_NEGATIVE: 11,
        UNARY_NOT: 12,
        UNARY_POSITIVE: 10,
        UNPACK_EX: 94,
        UNPACK_SEQUENCE: 92,
        WITH_CLEANUP_FINISH: 82,
        WITH_CLEANUP_START: 81,
        YIELD_FROM: 72,
        YIELD_VALUE: 86
    };
    var OPCODES_EXTRA = (function () {
        var map = new Array(200);
        map[OPCODES.UNARY_POSITIVE] = '__pos__';
        map[OPCODES.UNARY_NEGATIVE] = '__neg__';
        map[OPCODES.UNARY_NOT] = '__not__';
        map[OPCODES.UNARY_INVERT] = '__invert__';
        map[OPCODES.GET_ITER] = '__iter__';
        map[OPCODES.GET_YIELD_FROM_ITER] = '__iter__';

        map[OPCODES.BINARY_POWER] = 'pow';
        map[OPCODES.BINARY_MULTIPLY] = 'mul';
        map[OPCODES.BINARY_MATRIX_MULTIPLY] = 'matmul';
        map[OPCODES.BINARY_FLOOR_DIVIDE] = 'floordiv';
        map[OPCODES.BINARY_TRUE_DIVIDE] = 'truediv';
        map[OPCODES.BINARY_MODULO] = 'mod';
        map[OPCODES.BINARY_ADD] = 'add';
        map[OPCODES.BINARY_SUBTRACT] = 'sub';
        map[OPCODES.BINARY_SUBSCR] = 'getitem';
        map[OPCODES.BINARY_LSHIFT] = 'lshift';
        map[OPCODES.BINARY_RSHIFT] = 'rshift';
        map[OPCODES.BINARY_AND] = 'and';
        map[OPCODES.BINARY_XOR] = 'xor';
        map[OPCODES.BINARY_OR] = 'or';

        map[OPCODES.INPLACE_POWER] = '__ipow__';
        map[OPCODES.INPLACE_MULTIPLY] = '__imul__';
        map[OPCODES.INPLACE_MATRIX_MULTIPLY] = '__imatmul__';
        map[OPCODES.INPLACE_FLOOR_DIVIDE] = '__ifloordiv__';
        map[OPCODES.INPLACE_TRUE_DIVIDE] = '__itruediv__';
        map[OPCODES.INPLACE_MODULO] = '__imod__';
        map[OPCODES.INPLACE_ADD] = '__iadd__';
        map[OPCODES.INPLACE_SUBTRACT] = '__isub__';
        map[OPCODES.INPLACE_LSHIFT] = '__ilshift__';
        map[OPCODES.INPLACE_RSHIFT] = '__irshift__';
        map[OPCODES.INPLACE_AND] = '__iand__';
        map[OPCODES.INPLACE_XOR] = '__ixor__';
        map[OPCODES.INPLACE_OR] = '__ior__';
        map[OPCODES.STORE_SUBSCR] = '__setitem__';
        map[OPCODES.DELETE_SUBSCR] = '__delitem__';

        map[OPCODES.SETUP_LOOP] = BLOCK_TYPES.LOOP;
        map[OPCODES.SETUP_EXCEPT] = BLOCK_TYPES.EXCEPT;
        map[OPCODES.SETUP_FINALLY] = BLOCK_TYPES.FINALLY;

        return map;
    })();
    var OPCODES_ARGUMENT = 90;

    var vm = null;

    function error(message) {
        throw new Error('[FATAL ERROR] ' + (message || 'fatal interpreter error'));
    }
    function assert(condition, message) {
        if (!condition) {
            error(message);
        }
    }
    function raise(exc_type, message) {
        if (exc_type) {
            throw new_exception(exc_type, message);
        } else {
            error(message);
        }
    }


    function get_mro(cls) {
        return cls.mro;
    }
    function compute_mro(cls) {
        var pending = cls.bases.map(get_mro), result = [cls];
        var index, head, good;
        while (pending.length != 0) {
            for (index = 0; index < pending.length; index++) {
                head = pending[index][0];
                good = true;
                pending.forEach(function (base_mro) {
                    base_mro.slice(1, base_mro.length).forEach(function (base_cls) {
                        good &= base_cls != head;
                    })
                });
                if (good) {
                    result.push(head);
                    break;
                }
            }
            if (!good) {
                raise(TypeError, 'unable to linearize class hierarchy');
            }
            for (index = 0; index < pending.length; index++) {
                pending[index] = pending[index].filter(function (base_cls) {
                    return base_cls != head;
                })
            }
            pending = pending.filter(function (base_mro) {
                return base_mro.length > 0;
            });
        }
        return result;
    }


    var object_id_counter = 0;

    function PyObject(cls, dict) {
        this.cls = cls;
        this.dict = dict || null;
        this.id = null;
    }
    PyObject.prototype.get_id = function () {
        if (this.id === null) {
            this.id = object_id_counter++;
        }
        return this.id;
    };
    PyObject.prototype.get_address = function () {
        return ('0000000000000' + this.get_id().toString(16)).substr(-13);
    };
    PyObject.prototype.is_instance_of = function (cls) {
        return this.cls.is_subclass_of(cls);
    };
    PyObject.prototype.call_method = function (name, args, kwargs) {
        var method = this.cls.lookup(name);
        if (method) {
            return vm.call_object(method, [this].concat(args || []), kwargs);
        } else {
            vm.return_value = null;
            vm.last_exception = METHOD_NOT_FOUND;
            return false;
        }
    };
    PyObject.prototype.setattr = function (name, value) {
        if (!this.dict) {
            raise(TypeError, 'object does not support attribute access');
        }
        this.dict.set(name, value);
    };
    PyObject.prototype.getattr = function (name) {
        if (!this.dict) {
            raise(TypeError, 'object does not support attribute access');
        }
        return this.dict.get(name)
    };
    PyObject.prototype.unpack = function (name) {
        var item = this['_' + name];
        if (!item) {
            raise(TypeError, 'unable to unpack ' + name + ' from object');
        }
        return item;
    };
    PyObject.prototype.pack = function (name, value) {
        this['_' + name] = value;
    };


    function PyType(name, bases, attributes, mcs) {
        var index, native;
        PyObject.call(this, mcs || py_type, attributes || new PyDict());
        this.name = name;
        this.bases = bases || [py_object];
        this.mro = compute_mro(this);
        this.native = null;
        for (index = 0; index < this.mro.length; index++) {
            native = this.mro[index].native;
            if (native === py_object) {
                continue;
            }
            if (this.native && this.native !== native && native) {
                raise(TypeError, 'invalid native type hierarchy');
            }
            this.native = native;
        }
        this.native = this.native || py_object;
    }
    PyType.prototype = new PyObject;
    PyType.prototype.is_subclass_of = function (cls) {
        var index;
        if (cls === this) {
            return true;
        } else {
            for (index = 0; index < this.mro.length; index++) {
                if (this.mro[index] === cls) {
                    return true;
                }
            }
        }
        return false;
    };
    PyType.prototype.lookup = function (name) {
        var index, value;
        for (index = 0; index < this.mro.length; index++) {
            value = this.mro[index].dict.get(name);
            if (value) {
                return value;
            }
        }
    };
    PyType.prototype.define = function (name, item) {
        this.dict.set(name, item);
    };
    PyType.prototype.define_method_old = function (name, func, signature, options) {
        options = options || {};
        options.name = options.name || name;
        options.qualname = options.qualname || (this.name + '.' + options.name);
        options.direct = false;
        var f = new_native(func, signature, options)
        this.define(name, f);
    };
    PyType.prototype.define_method = function (name, func, signature, options) {
        signature = signature || [];
        options = options || {};
        options.name = options.name || name;
        options.qualname = options.qualname || (this.name + '.' + options.name);
        options.direct = true;
        options.simple = !options.complex;
        this.define(name, new_native(func, ['self'].concat(signature), options));
    };
    PyType.prototype.define_property = function (name, getter, setter) {
        if (getter) {
            getter = new_native(getter, ['self'], {name: name, qualname: name, direct: true, simple: true});
        }
        if (setter) {
            setter = new_native(setter, ['self', 'value'], {name: name, qualname: name, direct: true, simple: true});
        }
        this.define(name, new PyProperty(getter, setter));
    };
    PyType.prototype.define_classmethod = function (name, func, signature, options) {
        options = options || {};
        options.name = options.name || name;
        options.qualname = options.qualname || (this.name + '.' + options.name);
        this.define(name, new_native(func, signature, options));
    };
    PyType.prototype.call_classmethod = function (vm, name, args, kwargs) {
        var method = this.lookup(name);
        if (method) {
            return vm.call_object(method, [this].concat(args || []), kwargs);
        } else {
            vm.return_value = null;
            vm.last_exception = METHOD_NOT_FOUND;
            return false;
        }
    };
    PyType.prototype.call_staticmethod = function (vm, name, args, kwargs) {
        var method = this.lookup(name);
        if (method) {
            return vm.call_object(method, args, kwargs);
        } else {
            vm.return_value = null;
            vm.last_exception = METHOD_NOT_FOUND;
            return false;
        }
    };
    PyType.prototype.create = function (args, kwargs) {
        var func_new = this.lookup('__new__');
        var func_init = this.lookup('__init__');
    }


    function PyDict(initializer, cls) {
        var name;
        PyObject.call(this, cls || py_dict);
        this.table = {};
        if (initializer) {
            for (name in initializer) {
                if (initializer.hasOwnProperty(name)) {
                    this.set(name, initializer[name]);
                }
            }
        }
    }
    PyDict.prototype = new PyObject;
    PyDict.prototype.get = function (str_key) {
        var current;
        if (str_key instanceof PyStr) {
            str_key = str_key.value;
        } else if (typeof str_key != 'string') {
            raise(TypeError, 'invalid primitive key type');
        }
        current = this.table[str_key];
        while (current) {
            if (current.key.value === str_key) {
                return current.value;
            }
            current = current.next;
        }
    };
    PyDict.prototype.set = function (str_key, value) {
        var current;
        if (typeof str_key == 'string') {
            str_key = new_str(str_key);
        } else if (!(str_key instanceof PyStr)) {
            raise(TypeError, 'invalid primitive key type');
        }
        current = this.table[str_key];
        while (current) {
            if (current.key.value === str_key.value) {
                current.value = value;
                return;
            }
            current = current.next;
        }
        this.table[str_key.value] = {key: str_key, value: value, next: this.table[str_key]}
    };
    PyDict.prototype.pop = function (str_key) {
        var current, value;
        if (str_key instanceof PyStr) {
            str_key = str_key.value;
        } else if (typeof str_key != 'string') {
            raise(TypeError, 'invalid primitive key type');
        }
        current = this.table[str_key];
        if (current) {
            if (current.key.value === str_key) {
                if (!(this.table[str_key] = current.next)) {
                    delete this.table[str_key];
                }
                return current.value;
            } else {
                while (current) {
                    if (current.next && current.next.key.value === str_key) {
                        value = current.next.value;
                        current.next = current.next.next;
                        return value;
                    }
                    current = current.next;
                }
            }
        }
    };


    function new_native_type(name, bases, attributes, mcs) {
        var type = new PyType(name, bases, attributes, mcs);
        type.native = type;
        return type;
    }


    var py_object = new_native_type('object', []);
    var py_type = new_native_type('type', [py_object]);
    var py_dict = new_native_type('dict', [py_object]);

    py_object.cls = py_type.cls = py_dict.cls = py_type;
    py_object.dict.cls = py_type.dict.cls = py_dict.dict.cls = py_dict;

    var py_int = new_native_type('int');
    var py_bool = new_native_type('bool', [py_int]);

    var py_float = new_native_type('float');

    var py_str = new_native_type('str');
    var py_bytes = new_native_type('bytes');

    var py_tuple = new_native_type('tuple');

    var py_code = new_native_type('code');

    var py_list = new_native_type('list');
    var py_set = new_native_type('set');

    var py_function = new_native_type('function');
    var py_method = new_native_type('method');
    var py_generator = new_native_type('generator');

    var py_frame = new_native_type('frame');
    var py_traceback = new_native_type('traceback');

    var py_cell = new_native_type('cell');

    var py_module = new_native_type('ModuleType');

    var py_classmethod = new_native_type('classmethod');
    var py_staticmethod = new_native_type('staticmethod');


    function PyInt(value, cls) {
        PyObject.call(this, cls || py_int);
        this.value = value;
    }
    PyInt.prototype = new PyObject;

    function PyFloat(value, cls) {
        PyObject.call(this, cls || py_float);
        this.value = value;
    }
    PyFloat.prototype = new PyObject;

    function PyStr(value, cls) {
        PyObject.call(this, cls || py_str);
        this.value = value;
    }
    PyStr.prototype = new PyObject;

    function PyBytes(value, cls) {
        PyObject.call(this, cls || py_bytes);
        this.value = value;
    }
    PyBytes.prototype = new PyObject;

    function PyTuple(value, cls) {
        PyObject.call(this, cls || py_tuple);
        this.value = value;
    }
    PyTuple.prototype = new PyObject;

    function PyCode(value, cls) {
        PyObject.call(this, cls || py_code);
        this.value = value;
    }
    PyCode.prototype = new PyObject;


    function PyList(initializer, size) {
        PyObject.call(this, py_list);
        this.array = new Array(4);
        if (initializer) {
            this.size = initializer.length;
        } else {
            this.size = size || 0;
        }
        this.grow();
        if (initializer) {
            for (var index = 0; index < initializer.length; index++) {
                this.array[index] = initializer[index];
            }
        }
    }
    PyList.prototype = new PyObject;
    PyList.prototype.check = function (index) {
        if (index < 0) {
            index = this.size - index;
        }
        if (index < 0 || index > this.size - 1) {
            raise(IndexError, 'index out of range');
        }
        return index;
    };
    PyList.prototype.grow = function () {
        while (this.array.length <= this.size) {
            var length = this.array.length * 2;
            while (length <= this.size) {
                length *= 2;
            }
            this.array.length = length;
        }
    };
    PyList.prototype.shrink = function () {
        if (this.array.length > 4 && this.array.length / 4 >= this.size) {
            var length = this.array.length / 2;
            while (length / 4 >= this.size && length > 4) {
                length /= 2;
            }
            this.array.length = length;
        }
    };
    PyList.prototype.get = function (index) {
        index = this.check(index);
        return this.array[index];
    };
    PyList.prototype.set = function (index, item) {
        index = this.check(index);
        return this.array[index] = item;
    };
    PyList.prototype.append = function (item) {
        this.size++;
        this.grow();
        this.array[this.size - 1] = item;
        return item;
    };
    PyList.prototype.pop = function (index) {
        index = this.check(index);
        this.size--;
        if (index == null) {
            index = this.size;
        }
        var item = this.array[index];
        for (; index < this.size; index++) {
            this.array[index] = this.array[index + 1];
        }
        this.array[index] = null;
        this.shrink();
        return item;
    };
    PyList.prototype.clear = function () {
        this.array = new Array(4);
        this.size = 0;
    };
    PyList.prototype.slice = function (start, stop, step) {
        var index, list = new PyList();
        if (start == undefined) {
            start = 0;
        } else if (start < 0) {
            start = this.size + start;
        }
        if (stop == undefined) {
            stop = this.size;
        } else if (stop < 0) {
            stop = this.size + stop;
        }
        step = step || 1;
        if (step > 0) {
            if (start < 0) {
                start = 0;
            }
            if (stop > this.size) {
                stop = this.size;
            }
            for (index = start; index < stop; index += step) {
                list.append(this.array[index]);
            }
        } else if (step < 0) {
            if (start >= this.size) {
                    start = this.size - 1;
            }
            if (stop < 0) {
                stop = 0;
            }
            for (index = start; index > stop; index += step) {
                list.append(this.array[index]);
            }
        } else {
            raise(ValueError, 'slice step cannot be zero')
        }
        return list;
    };
    PyList.prototype.concat = function (list_or_array) {
        var list, index, size;
        if (list_or_array instanceof PyList) {
            size = list_or_array.size;
            list_or_array = list_or_array.array;
        } else if (list_or_array instanceof Array) {
            size = list_or_array.length;
        } else {
            raise(TypeError, 'invalid type of "list_or_array" argument');
        }
        list = new PyList(null, this.size + size);
        for (index = 0; index < this.size; index++) {
            list.array[index] = this.array[index];
        }
        for (index = 0; index < size; index++) {
            list.array[index + this.size] = list_or_array[index];
        }
        return list;
    };
    PyList.prototype.copy = function () {
        return this.concat([]);
    };


    function PyCell(item) {
        PyObject.call(this, py_cell);
        this.item = item;
    }
    PyCell.prototype = new PyObject;
    PyCell.prototype.set = function (item) {
        this.item = item;
    }
    PyCell.prototype.get = function () {
        return this.item;
    }






    function PyModule(namespace) {
        PyObject.call(this, py_module, new PyDict(namespace));
    }
    PyModule.prototype = new PyObject;

    var py_native = new_native_type('native');

    function PyNative(value) {
        PyObject.call(this, py_native);
        this.value = value;
    }

    function PyMethod(self, func) {
        PyObject.call(this, py_method);
        this.self = self;
        this.func = func;
    }
    PyMethod.prototype = new PyObject;

    var py_property = new_native_type('property')

    function PyProperty(getter, setter) {
        PyObject.call(this, py_property, new PyDict({
            'fget': getter || None,
            'fset': setter || None
        }));
    }
    PyProperty.prototype = new PyObject;

    var None = new PyObject(new_native_type('NoneType'));
    var NotImplemented = new PyObject(new_native_type('NotImplemented'));
    var Ellipsis = new PyObject(new_native_type('Ellipsis'));

    var False = new PyInt(0, py_bool);
    var True = new PyInt(1, py_bool);


    function new_int(value) {
        return new PyInt(value);
    }
    function new_float(value) {
        return new PyFloat(value);
    }
    function new_str(value) {
        return new PyStr(value);
    }
    function new_bytes(value) {
        return new PyBytes(value);
    }
    function new_tuple(value) {
        return new PyTuple(value);
    }
    function new_list(array) {
        return new PyList(array);
    }

    function new_code(value) {
        return new PyCode(value);
    }


    function unpack_str(object, fallback) {
        if (object === None && fallback) {
            return fallback;
        }
        if (object instanceof PyStr) {
            return object.value;
        } else if (object instanceof PyInt) {
            return object.value.toString();
        } else if (object instanceof PyFloat) {
            return object.value.toString();
        } else {
            raise(TypeError, 'unable to unpack string value from object');
        }
    }

    function unpack_tuple(object, fallback) {
        if (object === None && fallback) {
            return fallback;
        }
        if (object instanceof PyTuple) {
            return object.value;
        } else {
            raise(TypeError, 'unable to unpack tuple value from object');
        }
    }

    function unpack_float(object, fallback) {
        if (object === None && fallback) {
            return fallback;
        }
        if (object instanceof PyFloat || object instanceof PyInt) {
            return object.value;
        } else {
            raise(TypeError, 'unable to unpack float value from object');
        }
    }


    var BaseException = new PyType('BaseException');
    var Exception = new PyType('Exception', [BaseException]);
    var ValueError = new PyType('ValueError', [Exception]);
    var ArithmeticError = new PyType('ArithmeticError', [Exception]);
    var LookupError = new PyType('LookupError', [Exception]);
    var RuntimeError = new PyType('RuntimeError', [Exception]);
    var BufferError = new PyType('BufferError', [Exception]);
    var AssertionError = new PyType('AssertionError', [Exception]);
    var AttributeError = new PyType('AttributeError', [Exception]);
    var EOFError = new PyType('EOFError', [Exception]);
    var FloatingPointError = new PyType('FloatingPointError', [ArithmeticError]);
    var GeneratorExit = new PyType('GeneratorExit', [BaseException]);
    var ImportError = new PyType('ImportError', [Exception]);
    var IndexError = new PyType('IndexError', [LookupError]);
    var KeyError = new PyType('KeyError', [Exception]);
    var KeyboardInterrupt = new PyType('KeyboardInterrupt', [BaseException]);
    var MemoryError = new PyType('MemoryError', [Exception]);
    var NameError = new PyType('NameError', [Exception]);
    var NotImplementedError = new PyType('NotImplementedError', [RuntimeError]);
    var OSError = new PyType('OSError', [Exception]);
    var OverflowError = new PyType('OverflowError', [Exception]);
    var RecursionError = new PyType('RecursionError', [RuntimeError]);
    var ReferenceError = new PyType('ReferenceError', [Exception]);
    var StopIteration = new PyType('StopIteration', [Exception]);
    var SyntaxError = new PyType('SyntaxError', [Exception]);
    var IndentationError = new PyType('IndentationError', [SyntaxError]);
    var TabError = new PyType('TabError', [IndentationError]);
    var SystemError = new PyType('SystemError', [Exception]);
    var SystemExit = new PyType('SystemExit', [BaseException]);
    var TypeError = new PyType('TypeError', [Exception]);
    var UnboundLocalError = new PyType('UnboundLocalError', [NameError]);
    var UnicodeError = new PyType('UnicodeError', [ValueError]);
    var UnicodeEncodeError = new PyType('UnicodeEncodeError', [UnicodeError]);
    var UnicodeDecodeError = new PyType('UnicodeDecodeError', [UnicodeError]);
    var UnicodeTranslateError = new PyType('UnicodeTranslateError', [UnicodeError]);
    var ZeroDivisionError = new PyType('ZeroDivisionError', [ArithmeticError]);
    var EnvironmentError = OSError;
    var IOError = OSError;

    var BlockingIOError = new PyType('BlockingIOError', [OSError]);
    var ChildProcessError = new PyType('ChildProcessError', [OSError]);
    var BrokenPipeError = new PyType('BrokenPipeError', [OSError]);
    var ConnectionError = new PyType('ConnectionError', [OSError]);
    var ConnectionAbortedError = new PyType('ConnectionAbortedError', [ConnectionError]);
    var ConnectionRefusedError = new PyType('ConnectionRefusedError', [ConnectionError]);
    var ConnectionResetError = new PyType('ConnectionResetError', [ConnectionError]);
    var FileExistsError = new PyType('FileExistsError', [OSError]);
    var FileNotFoundError = new PyType('FileNotFoundError', [OSError]);
    var InterruptedError = new PyType('InterruptedError', [OSError]);
    var IsADirectoryError = new PyType('IsADirectoryError', [OSError]);
    var NotADirectoryError = new PyType('NotADirectoryError', [OSError]);
    var PermissionError = new PyType('PermissionError', [OSError]);
    var ProcessLookupError = new PyType('ProcessLookupError', [OSError]);
    var TimeoutError = new PyType('TimeoutError', [OSError]);

    var MethodNotFoundError = new PyType('MethodNotFoundError', [Exception]);
    var METHOD_NOT_FOUND = {
        exc_type: MethodNotFoundError,
        exc_value: new_exception(MethodNotFoundError, 'method not found'),
        exc_tb: None
    };

    var JSError = new PyType('JSError', [Exception]);

    function pack_error(error) {
        return new PyObject(JSError, new PyDict({
            'args': new_tuple([new_str(error.name), new_str(error.message)])
        }));
    }

    function new_exception(cls, message) {
        var exc_value = new PyObject(cls, new PyDict());
        exc_value.dict.set('args', new_tuple([new_str(message)]));
        return exc_value;
    }





    function Code(options) {
        options = options || {};

        this.name = options.name || '<unknown>';
        this.filename = options.filename || '<unknown>';

        this.flags = options.flags || 0;

        this.argnames = options.argnames || [];

        this.argcount = options.argcount || 0;
        this.kwargcount = options.kwargcount || 0;
    }
    Code.prototype.parse_args = function (args, kwargs, defaults) {
        var index, name, result = {};

        args = args || [];
        kwargs = kwargs || {};

        for (index = 0; index < this.argcount; index++) {
            name = this.argnames[index];
            if (args[index]) {
                result[name] = args[index];
            } else if (name in kwargs) {
                result[name] = kwargs[name];
                delete kwargs[name];
            } else if (defaults && name in defaults) {
                result[name] = defaults[name];
            } else {
                raise(TypeError, 'missing required positional argument "' + name + '"');
            }
            if (name in kwargs) {
                raise(TypeError, 'got multiple values for argument "' + name + '"');
            }
        }
        for (; index < this.argcount + this.kwargcount; index++) {
            name = this.argnames[index];
            if (name in kwargs) {
                result[name] = kwargs[name];
                delete kwargs[name];
            } else if (defaults && name in defaults) {
                result[name] = defaults[name];
            } else {
                raise(TypeError, 'missing required keyword argument "' + name +'"');
            }
        }
        if ((this.flags & CODE_FLAGS.VAR_ARGS) != 0) {
            name = this.argnames[index++];
            result[name] = args.slice(this.argcount, args.length);
        } else if (args.length > this.argcount) {
            raise(TypeError, 'too many positional arguments given');
        }
        if ((this.flags & CODE_FLAGS.VAR_KWARGS) != 0) {
            name = this.argnames[index];
            result[name] = kwargs;
        } else {
            for (name in kwargs) {
                if (name in kwargs) {
                    raise(TypeError, 'too many keyword arguments given');
                }
            }
        }

        return result;
    };

    function PythonCode(bytecode, options) {
        this.bytecode = bytecode;

        options = options || {};
        options.flags = (options.flags || 0) | CODE_FLAGS.PYTHON;
        options.name = options.name || '<module>';
        options.argnames = options.varnames || [];

        Code.call(this, options);

        this.names = options.names || [];
        this.varnames = options.varnames || [];
        this.freevars = options.freevars || [];
        this.cellvars = options.cellvars || [];

        this.constants = options.constants || [];

        this.firstline = options.firstline || 1;
        this.lnotab = options.lnotab || '';
    }
    PythonCode.prototype = new Code;
    PythonCode.prototype.get_line_number = function (position) {
        var line_number = this.firstline, offset = 0;
        var index, offset_increment, line_increment;
        for (index = 0; index < this.lnotab.length; index++) {
            offset_increment = this.lnotab.charCodeAt(index++);
            line_increment = this.lnotab.charCodeAt(index);
            offset += offset_increment;
            if (offset > position) {
                break;
            }
            line_number += line_increment;
        }
        return line_number;
    };

    function NativeCode(func, options, signature) {
        this.func = func;

        options = options || {};
        options.flags = (options.flags || 0) | CODE_FLAGS.NATIVE;
        options.name = options.name || '<native>';
        this.direct = options.direct || false;

        if (signature) {
            options.argnames = options.argnames || signature;
            if (!options.argcount) {
                options.argcount = signature.length;
                if ((options.flags & CODE_FLAGS.VAR_ARGS) != 0) {
                    options.argcount--;
                }
                if ((options.flags & CODE_FLAGS.VAR_KWARGS) != 0) {
                    options.argcount--;
                }
                if (options.kwargcount) {
                    options.argcount -= options.kwargcount;
                }
            }
        }

        Code.call(this, options);

        this.simple = options.simple || false;
    }
    NativeCode.prototype = new Code;
    NativeCode.prototype.get_line_number = function (position) {
        return position;
    };


    function Frame(code, options) {
        this.code = code;

        options = options || {};

        this.back = options.back || null;

        this.globals = options.globals || (this.back ? this.back.globals : {});
        this.builtins = options.builtins || (this.back ? this.back.builtins : {});

        this.position = options.position || 0;

        if (this.code === undefined) return;

        this.args = this.code.parse_args(options.args, options.kwargs, options.defaults);
    }
    Frame.prototype.get_line_number = function () {
        return this.code.get_line_number(this.position);
    };

    function PythonFrame(code, options) {
        var index;

        options = options || {};

        Frame.call(this, code, options);

        this.locals = options.locals || this.args;

        this.namespace = options.namespace || null;

        this.stack = options.stack || [];
        this.blocks = options.blocks || [];
        if (!options.blocks) {
            this.push_block(BLOCK_TYPES.BASE, 0);
        }

        this.state = options.state || 0;

        this.closure = options.closure || [];

        this.cells = {};
        for (index = 0; index < this.code.cellvars.length; index++) {
            this.cells[this.code.cellvars[index]] = new PyCell();
        }
        for (index = 0; index < this.code.freevars.length; index++) {
            this.cells[this.code.freevars[index]] = this.closure[index];
        }

        this.unwind_cause = null;
    }
    PythonFrame.prototype = new Frame;
    PythonFrame.prototype.top_block = function () {
        return this.blocks[this.blocks.length - 1];
    };
    PythonFrame.prototype.push_block = function (type, delta) {
        this.blocks.push({
            type: type,
            position: this.position,
            delta: delta,
            active: false,
            level: this.stack.length
        });
    };
    PythonFrame.prototype.pop_block = function () {
        return this.blocks.pop();
    };
    PythonFrame.prototype.pop = function () {
        return this.stack.pop();
    };
    PythonFrame.prototype.popn = function (number) {
        return number > 0 ? this.stack.splice(this.stack.length - number, number) : [];
    };
    PythonFrame.prototype.top0 = function () {
        return this.stack[this.stack.length - 1];
    };
    PythonFrame.prototype.top1 = function () {
        return this.stack[this.stack.length - 2];
    };
    PythonFrame.prototype.topn = function (number) {
        return number > 0 ? this.stack.slice(this.stack.length - number, number) : [];
    };
    PythonFrame.prototype.push = function (item) {
        assert(item instanceof PyObject);
        this.stack.push(item);
    };
    PythonFrame.prototype.fetch = function () {
        var high, low, ext, argument = null;
        if (this.position >= this.code.bytecode.length) {
            error('bytecode overflow');
        }
        var opcode = this.code.bytecode.charCodeAt(this.position++);
        if(DEBUG) {
            console.log('opcode: ' + opcode + ' | ' + 'position: ' + (this.position + 1));
        }
        if (opcode >= OPCODES_ARGUMENT) {
            low = this.code.bytecode.charCodeAt(this.position++);
            high = this.code.bytecode.charCodeAt(this.position++);
            argument = high << 8 | low;
        }
        if (opcode === OPCODES.EXTENDED_ARG) {
            ext = this.fetch();
            opcode = ext.opcode;
            argument = argument << 16 | opcode.argument;
        }
        return {opcode: opcode, argument: argument};
    };
    PythonFrame.prototype.unwind = function (cause) {
        if (cause != undefined) {
            this.unwind_cause = cause;
        }
        while (this.blocks.length > 0) {
            var block = this.blocks[this.blocks.length - 1];
            if (block.active) {
                this.blocks.pop();
                continue;
            }
            if (block.type == BLOCK_TYPES.FINALLY) {
                this.position = block.position + block.delta;
                block.active = true;
                return;
            }
            switch (this.unwind_cause) {
                case UNWIND_CAUSES.BREAK:
                    if (block.type == BLOCK_TYPES.LOOP) {
                        this.position = block.position + block.delta;
                        this.blocks.pop();
                        return;
                    } else {
                        this.blocks.pop();
                    }
                    break;
                case UNWIND_CAUSES.CONTINUE:
                    if (block.type == BLOCK_TYPES.LOOP) {
                        this.position = block.position;
                        return;
                    } else {
                        this.blocks.pop();
                    }
                    break;
                case UNWIND_CAUSES.EXCEPTION:
                    if (block.type == BLOCK_TYPES.EXCEPT) {
                        this.position = block.position + block.delta;
                        block.active = true;
                        return;
                    } else if (block.type == BLOCK_TYPES.BASE) {
                        vm.frame = this.back;
                        return;
                    } else {
                        this.blocks.pop()
                    }
                    break;
                case UNWIND_CAUSES.RETURN:
                    if (block.type == BLOCK_TYPES.BASE) {
                        vm.frame = this.back;
                        return;
                    } else {
                        this.blocks.pop();
                    }
                    break;
                default:
                    error('unknown unwind cause ' + this.unwind_cause);
            }
        }
    };
    PythonFrame.prototype.raise = function () {
        this.push(vm.last_exception.exc_tb);
        this.push(vm.last_exception.exc_value);
        this.push(vm.last_exception.exc_type);
        this.unwind(UNWIND_CAUSES.EXCEPTION);
    };
    PythonFrame.prototype.step = function () {
        var top, value, low, high, mid, name, code, defaults, globals, index, slot, func;
        var head, right, left, kwargs, args, type, block, temp;
        var exc_type, exc_tb, exc_value;
        var instruction = this.fetch();
        if (DEBUG) {
            console.log('executing instruction', instruction);
        }
        switch (instruction.opcode) {
            case OPCODES.NOP:
                break;

            case OPCODES.POP_TOP:
                this.pop();
                break;
            case OPCODES.ROT_TWO:
                top = this.popn(2);
                this.push(top[1]);
                this.push(top[0]);
                break;
            case OPCODES.ROT_THREE:
                top = this.popn(3);
                this.push(top[2]);
                this.push(top[1]);
                this.push(top[0]);
                break;
            case OPCODES.DUP_TOP:
                this.push(this.top0());
                break;
            case OPCODES.DUP_TOP_TWO:
                this.push(this.top1());
                this.push(this.top1());
                break;

            case OPCODES.GET_YIELD_FROM_ITER:
                if (this.state === 0 && is_iterable(this.top0())) {
                    break;
                }
            case OPCODES.UNARY_POSITIVE:
            case OPCODES.UNARY_NEGATIVE:
            case OPCODES.UNARY_NOT:
            case OPCODES.UNARY_INVERT:
            case OPCODES.GET_ITER:
                switch (this.state) {
                    case 0:
                        if (this.pop().call_method(OPCODES_EXTRA[instruction.opcode])) {
                            this.state = 1;
                            this.position--;
                            break;
                        }
                    case 1:
                        this.state = 0;
                        if (vm.return_value === NotImplemented || vm.except(MethodNotFoundError)) {
                            vm.raise(TypeError, 'unsupported operand type');
                            this.raise();
                        } else if (vm.return_value) {
                            this.push(vm.return_value);
                        } else {
                            this.raise();
                        }
                        break;
                }
                break;

            case OPCODES.BINARY_POWER:
            case OPCODES.BINARY_MULTIPLY:
            case OPCODES.BINARY_MATRIX_MULTIPLY:
            case OPCODES.BINARY_FLOOR_DIVIDE:
            case OPCODES.BINARY_TRUE_DIVIDE:
            case OPCODES.BINARY_MODULO:
            case OPCODES.BINARY_ADD:
            case OPCODES.BINARY_SUBTRACT:
            case OPCODES.BINARY_SUBSCR:
            case OPCODES.BINARY_LSHIFT:
            case OPCODES.BINARY_RSHIFT:
            case OPCODES.BINARY_AND:
            case OPCODES.BINARY_XOR:
            case OPCODES.BINARY_OR:
                switch (this.state) {
                    case 0:
                        slot = OPCODES_EXTRA[instruction.opcode];
                        right = this.top0();
                        left = this.top1();
                        if (left.call_method('__' + slot + '__', [right])) {
                            this.state = 1;
                            this.position--;
                            break;
                        }
                    case 1:
                        this.state = 0;
                        if (vm.return_value === NotImplemented || vm.except(MethodNotFoundError)) {
                            slot = OPCODES_EXTRA[instruction.opcode];
                            right = this.pop();
                            left = this.pop();
                            if (right.call_method('__r' + slot + '__', [left])) {
                                this.state = 2;
                                this.position--;
                            }
                        } else if (vm.return_value) {
                            this.popn(2);
                            this.push(vm.return_value);
                            break;
                        } else {
                            this.popn(2);
                            this.raise();
                            break;
                        }
                    case 2:
                        this.state = 0;
                        if (vm.return_value === NotImplemented || vm.except(MethodNotFoundError)) {
                            vm.raise(TypeError, 'unsupported operand type');
                            this.raise();
                        } else if (vm.return_value) {
                            this.push(vm.return_value);
                        } else {
                            this.raise();
                        }
                        break;
                }
                break;

            case OPCODES.INPLACE_POWER:
            case OPCODES.INPLACE_MULTIPLY:
            case OPCODES.INPLACE_MATRIX_MULTIPLY:
            case OPCODES.INPLACE_FLOOR_DIVIDE:
            case OPCODES.INPLACE_TRUE_DIVIDE:
            case OPCODES.INPLACE_MODULO:
            case OPCODES.INPLACE_ADD:
            case OPCODES.INPLACE_SUBTRACT:
            case OPCODES.INPLACE_LSHIFT:
            case OPCODES.INPLACE_RSHIFT:
            case OPCODES.INPLACE_AND:
            case OPCODES.INPLACE_XOR:
            case OPCODES.INPLACE_OR:
            case OPCODES.DELETE_SUBSCR:
                switch (this.state) {
                    case 0:
                        slot = OPCODES_EXTRA[instruction.opcode];
                        right = this.pop();
                        left = this.pop();
                        console.log(right, left);
                        if (left.call_method(slot, [right])) {
                            this.state = 1;
                            this.position--;
                            break;
                        }
                    case 1:
                        this.state = 0;
                        if (vm.return_value === NotImplemented || vm.except(MethodNotFoundError)) {
                            vm.raise(TypeError, 'unsupported operand type');
                            this.raise();
                        } else if (vm.return_value) {
                            if (instruction.opcode == OPCODES.DELETE_SUBSCR) {
                                this.push(vm.return_value);
                            }
                        } else {
                            this.raise();
                        }
                        break;
                }
                break;

            case OPCODES.STORE_SUBSCR:
                switch (this.state) {
                    case 0:
                        name = this.pop();
                        left = this.pop();
                        right = this.pop();
                        if (left.call_method('__setitem__', [name, right])) {
                            this.state = 1;
                            this.position--;
                            break;
                        }
                    case 1:
                        this.state = 0;
                        if (vm.return_value === NotImplemented || vm.except(MethodNotFoundError)) {
                            vm.raise(TypeError, 'unsupported operand type');
                            this.raise();
                        } else if (!vm.return_value) {
                            this.raise();
                        }
                        break;
                }
                break;

            case OPCODES.PRINT_EXPR:
                console.log(this.pop());
                break;

            case OPCODES.BREAK_LOOP:
                this.unwind(UNWIND_CAUSES.BREAK);
                break;

            case OPCODES.CONTINUE_LOOP:
                this.unwind(UNWIND_CAUSES.CONTINUE);
                break;

            case OPCODES.SET_ADD:
                error('opcode not implemented');
                break;

            case OPCODES.LIST_APPEND:
                error('opcode not implemented');
                break;

            case OPCODES.MAP_ADD:
                error('opcode not implemented');
                break;

            case OPCODES.RETURN_VALUE:
                vm.return_value = this.pop();
                this.unwind(UNWIND_CAUSES.RETURN);
                break;

            case OPCODES.YIELD_VALUE:
                error('opcode not implemented');
                vm.return_value = this.pop();
                vm.frame = this.back;
                break;

            case OPCODES.YIELD_FROM:
                error('opcode not implemented');
                break;

            case OPCODES.POP_BLOCK:
                this.blocks.pop();
                break;

            case OPCODES.POP_EXCEPT:
                block = this.blocks.pop();
                assert(block.type === BLOCK_TYPES.EXCEPT);
                while (this.stack.length > block.level + 3) {
                    this.pop();
                }
                if (this.stack.length == block.level + 3) {
                    exc_type = this.pop();
                    exc_value = this.pop();
                    exc_tb = this.pop();
                    vm.raise(exc_type, exc_value, exc_tb);
                } else {
                    vm.return_value = None;
                }
                break;

            case OPCODES.END_FINALLY:
                this.unwind();
                break;

            case OPCODES.LOAD_BUILD_CLASS:
                this.push(build_class);
                break;

            case OPCODES.SETUP_WITH:
                error('opcode not implemented');
                break;

            case OPCODES.WITH_CLEANUP_START:
                error('opcode not implemented');
                break;

            case OPCODES.WITH_CLEANUP_FINISH:
                error('opcode not implemented');
                break;

            case OPCODES.STORE_FAST:
            case OPCODES.DELETE_FAST:
            case OPCODES.STORE_NAME:
            case OPCODES.DELETE_NAME:
                if (instruction.opcode === OPCODES.STORE_FAST){
                    name = this.code.varnames[instruction.argument];
                    instruction.opcode = OPCODES.STORE_NAME;
                } else if (instruction.opcode === OPCODES.DELETE_FAST) {
                    name = this.code.varnames[instruction.argument];
                    instruction.opcode = OPCODES.DELETE_NAME;
                } else {
                    name = this.code.names[instruction.argument];
                }
                if (this.namespace) {
                    switch (this.state) {
                        case 0:
                            if (instruction.opcode === OPCODES.STORE_NAME) {
                                slot = '__setitem__';
                                args = [new_str(name), this.pop()];
                            } else {
                                slot = '__delitem__';
                                args = [new_str(name)];
                            }
                            if (this.namespace.call_method(slot, args)) {
                                this.state = 1;
                                this.position -= 3;
                                break;
                            }
                        case 1:
                            this.state = 0;
                            if (vm.except(MethodNotFoundError)) {
                                vm.raise(TypeError, 'invalid namespace');
                                this.raise();
                            } else if (!vm.return_value) {
                                this.raise();
                            }
                            break;
                    }
                } else {
                    if (instruction.opcode === OPCODES.STORE_NAME) {
                        this.locals[name] = this.pop();
                    } else if (name in this.locals) {
                        delete this.locals[name];
                    } else {
                        vm.raise(NameError, 'name \'' + name + '\' is not defined');
                        this.raise();
                    }
                }
                break;

            case OPCODES.LOAD_FAST:
            case OPCODES.LOAD_NAME:
                if (instruction.opcode === OPCODES.LOAD_FAST) {
                    name = this.code.varnames[instruction.argument];
                } else {
                    name = this.code.names[instruction.argument];
                }
                if (this.namespace) {
                    switch (this.state) {
                        case 0:
                            if (this.namespace.call_method('__getitem__', [new_str(name)])) {
                                this.state = 1;
                                this.position -= 3;
                            }
                        case 1:
                            this.state = 0;
                            if (vm.return_value) {
                                this.push(vm.return_value);
                            } else if (vm.except(MethodNotFoundError) || vm.except(KeyError)) {
                                if (name in this.globals) {
                                    this.push(this.globals[name]);
                                } else if (name in this.builtins) {
                                    this.push(this.builtins[name]);
                                } else {
                                    vm.raise(NameError, 'name \'' + name + '\' is not defined');
                                    this.raise();
                                }
                            } else {
                                this.raise();
                            }
                            break;
                    }
                } else {
                    if (name in this.locals) {
                        this.push(this.locals[name]);
                    } else if (name in this.globals) {
                        this.push(this.globals[name]);
                    } else if (name in this.builtins) {
                        this.push(this.builtins[name]);
                    } else {
                        vm.raise(NameError, 'name \'' + name + '\' is not defined');
                        this.raise();
                    }
                }
                break;

            case OPCODES.STORE_GLOBAL:
                name = this.code.names[instruction.argument];
                this.globals[name] = this.pop();
                break;

            case OPCODES.DELETE_GLOBAL:
                name = this.code.names[instruction.argument];
                if (name in this.globals) {
                    delete this.globals[name];
                } else {
                    vm.raise(NameError, 'name \'' + name + '\' is not defined');
                    this.raise();
                }
                break;

            case OPCODES.LOAD_GLOBAL:
                name = this.code.names[instruction.argument];
                if (name in this.globals) {
                    this.push(this.globals[name]);
                } else if (name in this.builtins) {
                    this.push(this.builtins[name]);
                } else {
                    vm.raise(NameError, 'name \'' + name + '\' is not defined');
                    this.raise();
                }
                break;

            case OPCODES.STORE_ATTR:
            case OPCODES.DELETE_ATTR:
                name = this.code.names[instruction.argument];
                switch (this.state) {
                    case 0:
                        temp = this.pop();
                        if (instruction.opcode === OPCODES.STORE_ATTR) {
                            slot = '__setattr__';
                            args = [new_str(name), this.pop()];
                        } else {
                            slot = '__delattr__';
                            args = [new_str(name)];
                        }
                        if (temp.call_method(slot, args)) {
                            this.state = 1;
                            this.position -= 3;
                        }
                    case 1:
                        this.state = 0;
                        if (vm.except(MethodNotFoundError)) {
                            if (instruction.opcode === OPCODES.STORE_ATTR) {
                                vm.raise(TypeError, 'object does not support attribute assignment');
                            } else {
                                vm.raise(TypeError, 'object does not support attribute deletion');
                            }
                            this.raise();
                        } else if (!vm.return_value) {
                            this.raise();
                        }
                        break;
                }
                break;

            case OPCODES.LOAD_ATTR:
                name = this.code.names[instruction.argument];
                switch (this.state) {
                    case 0:
                        if (this.top0().call_method('__getattribute__', [new_str(name)])) {
                            this.state = 1;
                            this.position -= 3;
                            break;
                        }
                    case 1:
                        this.state = 0;
                        if (vm.return_value) {
                            this.pop();
                            this.push(vm.return_value);
                            break;
                        }
                        if (vm.except(AttributeError) || vm.except(MethodNotFoundError)) {
                            if (this.pop().call_method('__getattr__', [new_str(name)])) {
                                this.state = 2;
                                this.position -= 3;
                                break;
                            }
                        } else {
                            this.pop();
                            this.raise();
                            break;
                        }
                    case 2:
                        this.state = 0;
                        if (vm.except(MethodNotFoundError)) {
                            vm.raise(TypeError, 'object does not support attribute access');
                            this.raise();
                        } else if (vm.return_value) {
                            this.push(vm.return_value);
                        } else {
                            this.raise();
                        }
                        break;
                }
                break;

            case OPCODES.UNPACK_SEQUENCE:
                error('opcode not implemented');
                break;

            case OPCODES.UNPACK_EX:
                error('opcode not implemented');
                break;

            case OPCODES.BUILD_TUPLE:
                this.push(new_tuple(this.popn(instruction.argument)));
                break;

            case OPCODES.BUILD_LIST:
                this.push(new_list(this.popn(instruction.argument)));
                break;

            case OPCODES.BUILD_SET:
                error('opcode not implemented');
                break;

            case OPCODES.BUILD_MAP:
                this.push(new PyDict());
                break;

            case OPCODES.IMPORT_NAME:
                name = this.code.names[instruction.argument];
                this.popn(2)
                if (name in modules) {
                    this.push(new PyModule(modules[name].namespace));
                } else {
                    vm.raise(ImportError)
                    this.raise();
                }
                break;

            case OPCODES.IMPORT_STAR:
                error('opcode not implemented');
                break;

            case OPCODES.IMPORT_FROM:
                error('opcode not implemented');
                break;

            case OPCODES.JUMP_FORWARD:
                this.position += instruction.argument;
                break;

            case OPCODES.JUMP_ABSOLUTE:
                this.position = instruction.argument;
                break;

            case OPCODES.COMPARE_OP:
                switch (instruction.argument) {
                    case COMPARE_OPS.EXC:
                        exc_type = this.pop();
                        this.push(this.pop().is_subclass_of(exc_type) ? True : False);
                        break;
                    case COMPARE_OPS.LT:
                    case COMPARE_OPS.LE:
                    case COMPARE_OPS.GT:
                    case COMPARE_OPS.GE:
                    case COMPARE_OPS.EQ:
                    case COMPARE_OPS.NE:
                        switch (this.state) {
                            case 0:
                                slot = COMPARE_SLOTS[instruction.argument];
                                right = this.pop();
                                left = this.pop();
                                if (left.call_method(slot, [right])) {
                                    this.state = 1;
                                    this.position -= 3;
                                    break;
                                }
                            case 1:
                                if (vm.return_value === NotImplemented || vm.except(MethodNotFoundError)) {
                                    vm.raise(TypeError, 'unsupported boolean operator');
                                    this.raise();
                                } else if (vm.return_value) {
                                    this.push(vm.return_value);
                                } else {
                                    this.raise();
                                }
                                break;
                        }
                        break;

                    case COMPARE_OPS.IS:
                    case COMPARE_OPS.NIS:
                    default:
                        error('unsupported comparison operator');
                }
                break;

            case OPCODES.POP_JUMP_IF_TRUE:
                if (this.top0().cls === py_int) {
                    if (this.pop().value) {
                        this.position = instruction.argument;
                    }
                    break;
                }
                switch (this.state) {
                    case 0:
                        if (this.top0().call_method('__bool__')) {
                            this.state = 1;
                            this.position--;
                            break;
                        }
                    case 1:
                        this.state = 0;
                        if (vm.except(MethodNotFoundError)) {
                            if (this.top0().call_method('__len__')) {
                                this.state = 2;
                                this.position--;
                                break;
                            }
                        } else if (!vm.return_value) {
                            this.pop();
                            this.raise();
                            break;
                        }
                    case 2:
                        this.state = 0;
                        this.pop();
                        if (vm.except(MethodNotFoundError)) {
                            this.position = instruction.argument;
                        } else if (vm.return_value) {
                            if (vm.return_value instanceof PyInt) {
                                if (vm.return_value.value) {
                                    this.position = instruction.argument;
                                }
                            } else {
                                vm.raise(TypeError, 'invalid result type of boolean conversion');
                                this.raise();
                            }
                        } else {
                            this.raise();
                        }
                        break;
                }
                break;

            case OPCODES.POP_JUMP_IF_FALSE:
                if (this.top0().cls === py_bool || this.top0().cls === py_int) {
                    if (!this.pop().value) {
                        this.position = instruction.argument;
                    }
                    break;
                }
                switch (this.state) {
                    case 0:
                        if (this.top0().call_method('__bool__')) {
                            this.state = 1;
                            this.position--;
                            break;
                        }
                    case 1:
                        this.state = 0;
                        if (vm.except(MethodNotFoundError)) {
                            if (this.top0().call_method('__len__')) {
                                this.state = 2;
                                this.position--;
                                break;
                            }
                        } else if (!vm.return_value) {
                            this.pop();
                            this.raise();
                            break;
                        }
                    case 2:
                        this.state = 0;
                        this.pop();
                        if (!vm.except(MethodNotFoundError)) {
                            if (vm.return_value instanceof PyInt) {
                                if (!vm.return_value.value) {
                                    this.position = instruction.argument;
                                }
                            } else if (vm.return_value) {
                                vm.raise(TypeError, 'invalid result type of boolean conversion');
                                this.raise();
                            } else {
                                this.raise();
                            }
                        }
                        break;
                }
                break;

            case OPCODES.JUMP_IF_TRUE_OR_POP:
                if (this.top0().cls === py_int) {
                    if (this.top0().value) {
                        this.position = instruction.argument;
                    } else {
                        this.pop();
                    }
                    break;
                }
                switch (this.state) {
                    case 0:
                        if (this.top0().call_method('__bool__')) {
                            this.state = 1;
                            this.position--;
                            break;
                        }
                    case 1:
                        this.state = 0;
                        if (vm.except(MethodNotFoundError)) {
                            if (this.top0().call_method('__len__')) {
                                this.state = 2;
                                this.position--;
                                break;
                            }
                        } else if (!vm.return_value) {
                            this.pop();
                            this.raise();
                            break;
                        }
                    case 2:
                        this.state = 0;
                        if (vm.except(MethodNotFoundError)) {
                            this.position = instruction.argument;
                        } else if (vm.return_value) {
                            if (vm.return_value instanceof PyInt) {
                                if (vm.return_value.value) {
                                    this.position = instruction.argument;
                                } else {
                                    this.pop();
                                }
                            } else {
                                this.pop();
                                vm.raise(TypeError, 'invalid result type of boolean conversion');
                                this.raise();
                            }
                        } else {
                            this.pop();
                            this.raise();
                        }
                        break;
                }
                break;

            case OPCODES.JUMP_IF_FALSE_OR_POP:
                if (this.top0().cls === py_int) {
                    if (!this.top0().value) {
                        this.position = instruction.argument;
                    } else {
                        this.pop();
                    }
                    break;
                }
                switch (this.state) {
                    case 0:
                        if (this.top0().call_method('__bool__')) {
                            this.state = 1;
                            this.position--;
                            break;
                        }
                    case 1:
                        this.state = 0;
                        if (vm.except(MethodNotFoundError)) {
                            if (this.top0().call_method('__len__')) {
                                this.state = 2;
                                this.position--;
                                break;
                            }
                        } else if (!vm.return_value) {
                            this.pop();
                            this.raise();
                            break;
                        }
                    case 2:
                        this.state = 0;
                        if (!vm.except(MethodNotFoundError)) {
                            if (vm.return_value instanceof PyInt) {
                                if (!vm.return_value.value) {
                                    this.position = instruction.argument;
                                } else {
                                    this.pop();
                                }
                            } else if (vm.return_value) {
                                this.pop();
                                vm.raise(TypeError, 'invalid result type of boolean conversion');
                                this.raise();
                            } else {
                                this.pop();
                                this.raise();
                            }
                        }
                        break;
                }
                break;

            case OPCODES.FOR_ITER:
                switch (this.state) {
                    case 0:
                        if (this.top0().call_method('__next__')) {
                            this.state = 1;
                            this.position--;
                            break;
                        }
                    case 1:
                        this.state = 0
                        if (vm.except(MethodNotFoundError)) {
                            this.pop();
                            vm.raise(TypeError, 'object does not support iteration');
                            this.raise();
                        } else if (vm.except(StopIteration)) {
                            this.pop();
                            this.position += instruction.argument;
                        } else if (vm.return_value) {
                            this.push(vm.return_value);
                        } else {
                            this.pop();
                            this.raise();
                        }
                        break;
                }
                break;


            case OPCODES.SETUP_LOOP:
            case OPCODES.SETUP_EXCEPT:
            case OPCODES.SETUP_FINALLY:
                type = OPCODES_EXTRA[instruction.opcode];
                this.push_block(type, instruction.argument);
                break;

            case OPCODES.LOAD_CLOSURE:
                if (instruction.argument < this.code.cellvars.length) {
                    this.push(this.cells[this.code.cellvars[instruction.argument]]);
                } else {
                    this.push(this.cells[this.code.freevars[instruction.argument]]);
                }
                break;

            case OPCODES.LOAD_DEREF:
                if (instruction.argument < this.code.cellvars.length) {
                    this.push(this.cells[this.code.cellvars[instruction.argument]].get());
                } else {
                    this.push(this.cells[this.code.freevars[instruction.argument]].get());
                }
                break;

            case OPCODES.LOAD_CLASSDEREF:
                error('opcode not implemented');
                break;

            case OPCODES.STORE_DEREF:
                if (instruction.argument < this.code.cellvars.length) {
                    this.cells[this.code.cellvars[instruction.argument]].set(this.pop());
                } else {
                    error('load free variable closure not implemented');
                }
                break;

            case OPCODES.DELETE_DEREF:
                error('opcode not implemented');
                break;

            case OPCODES.RAISE_VARARGS:
                if (instruction.argument != 1) {
                    error('unsupported raise format');
                }
                exc_type = this.pop();
                vm.raise(exc_type, None, None);
                this.raise();
                break;

            case OPCODES.LOAD_CONST:
                this.push(this.code.constants[instruction.argument]);
                break;

            case OPCODES.CALL_FUNCTION:
                switch (this.state) {
                    case 0:
                        low = instruction.argument & 0xFF;
                        high = instruction.argument >> 8;
                        kwargs = {};
                        for (index = 0; index < high; index++) {
                            value = this.pop();
                            kwargs[this.pop().value] = value;
                        }
                        args = this.popn(low);
                        func = this.pop();
                        if (vm.call_object(func, args, kwargs)) {
                            this.state = 1;
                            this.position -= 3;
                            break;
                        }
                    case 1:
                        this.state = 0;
                        if (vm.return_value) {
                            this.push(vm.return_value);
                        } else {
                            this.raise();
                        }
                        break;
                }
                break;

            case OPCODES.CALL_FUNCTION_VAR:
                error('opcode is not supported');
                break;

            case OPCODES.CALL_FUNCTION_KW:
                error('opcode is not supported');
                break;

            case OPCODES.CALL_FUNCTION_VAR_KW:
                error('opcode is not supported');
                break;

            case OPCODES.MAKE_FUNCTION:
            case OPCODES.MAKE_CLOSURE:
                low = instruction.argument & 0xFF;
                mid = (instruction.argument >> 8) & 0xFF;
                high = (instruction.argument >> 16) & 0x7FFF;
                name = this.pop();
                code = this.pop();
                if (high) {
                    error('annotations not supported');
                }
                defaults = {};
                for (index = 0; index < mid; index++) {
                    value = this.pop();
                    defaults[this.pop().value] = value;
                }
                for (index = 0; index < low; index++) {
                    defaults[code.value.argnames[index]] = this.pop();
                }
                globals = this.globals;
                func = new PyObject(py_function, new PyDict());
                func.dict.set('__name__', new_str(name));
                func.dict.set('__code__', code);
                func.defaults = defaults;
                if (instruction.opcode == OPCODES.MAKE_CLOSURE) {
                    func.dict.set('__closure__', this.pop());
                }
                this.push(func);
                break;


                error('opcode is not supported');
                break;

            case OPCODES.BUILD_SLICE:
                error('opcode is not supported');
                break;

            default:
                error('unknown opcode ' + instruction.opcode);
                break;
        }
    };

    function NativeFrame(code, options) {
        options = options || {};

        Frame.call(this, code, options);

        this.store = options.store || {};
    }
    NativeFrame.prototype = new Frame;
    NativeFrame.prototype.step = function () {
        assert(!this.code.simple);
        try {
            var result = this.code.func(this, this.args);
        } catch (error) {
            if (error instanceof PyObject) {
                vm.raise(error.cls, error);
                vm.frame = this.back;
                return;
            }
            throw error;
        }
        if (result == undefined || result instanceof PyObject) {
            if (result instanceof PyObject) {
                vm.return_value = result;
            }
            vm.frame = this.back;
        } else {
            this.position = result;
            return true;
        }
    };


    function VM() {
        this.frame = null;

        this.return_value = None;
        this.last_exception = null;
    }
    VM.prototype.step = function () {
        this.frame.step();
    };
    VM.prototype.except = function (exc_type) {
        if (!this.return_value && this.last_exception.exc_type.is_subclass_of(exc_type)) {
            this.return_value = None;
            return true;
        }
        return false;
    };
    VM.prototype.raise = function (exc_type, exc_value, exc_tb) {
        if (typeof exc_value == 'string') {
            exc_value = new_exception(exc_type, exc_value);
        }
        if (this.return_value === null) {
            exc_value.dict.set('__context__', this.last_exception.exc_value);
        } else {
            this.return_value = null;
        }

        if (!exc_tb) {
            // TODO: create traceback
            //console.log('error in line: ' + this.frame.get_line_number());
            exc_tb = None;
            console.log(exc_value);
            exc_value.dict.set('__traceback__', exc_tb);
        }
        this.last_exception = {exc_type: exc_type, exc_value: exc_value, exc_tb: exc_tb};
    };
    VM.prototype.run = function (object, args, kwargs) {
        var old_frame = this.frame;
        var old_vm = vm;
        vm = this;
        jaspy.vm = this;
        if (object instanceof PythonCode) {
            object = new_code(object);
        }
        if (object instanceof Frame) {
            this.frame = object;
        } else if (object instanceof PyCode) {
            this.frame = new PythonFrame(object.value, {
                vm: this, builtins: builtins,
                globals: {
                    '__name__': new_str('__main__')
                }
            })
        } else {
            error('object is not runnable');
        }
        while (this.frame) {
            this.frame.step();
        }
        this.frame = old_frame;
        vm = old_vm;
        if (!this.return_value) {
            console.log(this.last_exception.exc_value.dict.get('args').value[0].value)
        }
    };
    VM.prototype.call_object = function (object, args, kwargs, defaults, closure) {
        var code, result, frame, vm = this;
        while (true) {
            if (object instanceof PythonCode) {
                this.frame = new PythonFrame(object, {
                    vm: vm, back: vm.frame, defaults: defaults,
                    args: args, kwargs: kwargs, closure: closure
                });
                return true;
            } else if (object instanceof NativeCode) {
                if (object.simple) {
                    try {
                        args = object.parse_args(args, kwargs, defaults);
                        if (object.direct) {
                            var unpacked_args = [];
                            for (var index = 0; index < object.argnames.length; index++) {
                                unpacked_args.push(args[object.argnames[index]]);
                            }
                            result = object.func.apply(null, unpacked_args);
                        } else {
                            result = object.func(args);
                        }
                        vm.return_value = result || None;
                    } catch (error) {
                        if (error instanceof PyObject) {
                            vm.raise(error.cls, error);
                            this.frame = this.frame.back;
                        } else {
                            throw error;
                        }
                    }
                    return false;
                } else {
                    this.frame = frame = new NativeFrame(object, {
                        vm: vm, back: vm.frame, defaults: defaults,
                        args: args, kwargs: kwargs
                    });
                    try {
                        result = object.func(vm.frame, vm.frame.args);
                        if (result == undefined || result instanceof PyObject) {
                            vm.return_value = result || None;
                            vm.frame = frame.back;
                            return false;
                        } else {
                            frame.position = result;
                            return true;
                        }
                    } catch (error) {
                        if (error instanceof PyObject) {
                            vm.raise(error.cls, error);
                            this.frame = this.frame.back;
                            return false;
                        } else {
                            throw error;
                        }
                    }
                }
            } else if (object.cls === py_function) {
                code = object.dict.get('__code__');
                closure = object.dict.get('__closure__');
                if (code.cls === py_code) {
                    defaults = object.defaults;
                    object = code.value;
                    if (closure instanceof PyTuple) {
                        closure = closure.value;
                    }
                } else {
                    this.raise(TypeError, 'invalid type of function code')
                }
            } else if (object instanceof PyMethod) {
                args = [object.self].concat(args);
                object = object.func;
            } else if (object instanceof PyObject) {
                result = object.call_method('__call__', args, kwargs);
                if (vm.except(MethodNotFoundError)) {
                    vm.raise(TypeError, 'object is not callable');
                }
                return result;
            } else {
                console.log(object, object instanceof NativeCode);
                error('invalid callable');
            }
        }
    };


    function new_native(func, signature, options) {
        var code = new NativeCode(func, options, signature);
        func = new PyObject(py_function, new PyDict());
        func.dict.set('__name__', new_str(options.name || '<unkown>'));
        func.dict.set('__qualname__', new_str(options.qualname || '<unkown>'));
        func.dict.set('__doc__', new_str(options.doc || ''));
        func.dict.set('__module__', options.module ? new_str(options.module) : None);
        func.dict.set('__code__', new_code(code));
        func.defaults = options.defaults;
        return func;
    }



    function is_iterable(object) {
        return object.cls.lookup('__next__') != undefined;
    }











    py_function.define_method('__get__', function (self, instance, owner) {
        return new PyMethod(instance, self);
    }, ['instance', 'owner']);



    py_type.define_method('__new__', function (mcs, name, bases, attributes) {
        if (!(mcs instanceof PyType)) {
            raise(TypeError, 'invalid type of "mcs" argument');
        }
        if (!(attributes instanceof PyDict)) {
            raise(TypeError, 'invalid type of "attributes" argument')
        }
        return new PyType(unpack_str(name), unpack_tuple(bases), attributes, mcs);
    }, ['name', 'bases', 'attributes']);
    py_type.define_method('__init__', function (cls, name, bases, attributes) {

    }, ['name', 'bases', 'attributes']);

    py_type.define_method_old('__call__', function (frame, args) {
        switch (frame.position) {
            case 0:
                if (args['cls'].call_classmethod(vm, '__new__', args['var_args'], args['var_kwargs'])) {
                    return 1;
                }
            case 1:
                if (!vm.return_value) {
                    return null;
                }
                frame.store['instance'] = vm.return_value;
                if (frame.store['instance'].call_method('__init__', args['var_args'], args['var_kwargs'])) {
                    return 2;
                }
            case 2:
                if (vm.return_value) {
                    return frame.store['instance'];
                }
        }
    }, ['cls', 'var_args', 'var_kwargs'], {
        flags: CODE_FLAGS.VAR_ARGS | CODE_FLAGS.VAR_KWARGS
    });
    py_type.define_method_old('__str__', function (args) {
        var module = args.cls.dict.get('__module__');
        if (module instanceof PyStr) {
            return new_str('<class \'' + module.value + '.' + args.cls.name + '\'>');
        } else {
            return new_str('<class \'' + args.cls.name + '\'>');
        }
    }, ['cls'], {simple: true});
    py_type.define_classmethod('__prepare__', function (args) {
        return new PyDict();
    }, ['mcs', 'bases'], {simple: true});


    py_object.define_method('__new__', function (cls, var_args, var_kwargs) {
        if (!(cls instanceof PyType)) {
            raise(TypeError, 'object.__new__(X): X is not a type object');
        }
        if (cls.native !== py_object) {
            raise(TypeError, 'object.__new__() is not safe, use ' + cls.native.name + '.__new__()');
        }
        return new PyObject(cls, new PyDict());
    }, ['var_args', 'var_kwargs'], {
        flags: CODE_FLAGS.VAR_ARGS | CODE_FLAGS.VAR_KWARGS,
    });

    py_object.define_method('__init__', function (self) {

    });

    py_object.define_method_old('__getattribute__', function (frame, args) {
        var value;
        switch (frame.position) {
            case 0:
                if (!(args.name instanceof PyStr)) {
                    raise(TypeError, 'invalid type of \'name\' argument');
                }
                value = args.self.dict.get(args.name);
                if (!value) {
                    value = args.self.cls.lookup(args.name);
                    if (value) {
                        if (value.call_method('__get__', [args['self'], args['self'].cls])) {
                            return 1;
                        }
                    } else {
                        raise(AttributeError, '\'' + args.self.cls.name + '\' has no attribute \'' + args.name.value + '\'');
                    }

                } else {
                    return value;
                }
            case 1:
                if (vm.except(MethodNotFoundError)) {
                    return value;
                } else if (vm.return_value) {
                    return vm.return_value
                } else {
                    return null;
                }
        }
    }, ['self', 'name']);
    py_object.define_method_old('__setattr__', function (frame, args) {
        switch (frame.position) {
            case 0:
                if (!(args['name'] instanceof PyStr)) {
                    raise(TypeError, 'invalid type of \'name\' argument');
                }
                if (!(args['self'].dict instanceof PyDict)) {
                    raise(TypeError, 'object does not support attribute assignment');
                }
                var value = args['self'].cls.lookup(args['name']);
                if (value && value.cls.lookup('__set__')) {
                    if (value.call_method('__set__', [args['self'], args['item']])) {
                        return 1;
                    }
                } else {
                    args['self'].dict.set(args['name'], args['item']);
                    return null;
                }
            case 1:
                return null;
        }
    }, ['self', 'name', 'item']);

    py_object.define_method('__str__', function (self) {
        var module = self.cls.dict.get('__module__');
        var address = ('0000000000000' + self.get_id().toString(16)).substr(-13);
        if (module instanceof PyStr) {
            return new_str('<' + module.value + '.' + self.cls.name + ' object at 0x' + address + '>');
        } else {
            return new_str('<' + self.cls.name + ' object at 0x' + address +'>');
        }
    });


    None.cls.define_method_old('__new__', function (args) {
        return None;
    }, ['self'], {simple: true});
    None.cls.define_method_old('__str__', function () {
        return new_str('None');
    }, ['self'], {simple: true});
    None.cls.define_method_old('__bool__', function () {
        return False;
    }, ['self'], {simple: true});



    //py_function.define_method_old('__str__', )


    var getattr = new_native(function (frame, args) {
        var slot;
        while (true) {
            switch (frame.position) {
                case 0:
                    slot = args.object.cls.lookup('__getattribute__');
                    if (vm.c(slot, [args.object, args.name])) {
                        return 1;
                    }
                case 1:
                    if (vm.except(AttributeError)) {
                        slot = args.object.cls.lookup('__getattr__');
                        if (vm.c(slot, [args.object, args.name])) {
                            return 2;
                        }
                    } else {
                        return -1;
                    }
                case 2:
                    if (args.fallback && vm.except(AttributeError)) {
                        vm.return_value = args.fallback;
                    }
                    return -1;
            }
        }
    }, ['object', 'name', 'fallback'], {
        name: 'getattr',
        module: 'builtins',
        defaults: {fallback: null}
    });

    var print = new_native(function (frame, args) {
        var slot, object;
        while (true) {
            switch (frame.position) {
                case 0:
                    frame.store.strings = [];
                    frame.store.index = 0;
                    if (args.objects.length) {
                        object = args.objects[0];
                        if (object.cls == py_str) {
                            vm.return_value = object;
                        } else {
                            if (object.call_method('__str__')) return 1;
                        }
                        frame.position = 1;
                    } else {
                        frame.position = 2;
                        break;
                    }
                case 1:
                    if (!vm.return_value) return -1;
                    frame.store.strings.push(unpack_str(vm.return_value));
                    frame.store.index++;
                    if (frame.store.index < args.objects.length) {
                        object = args.objects[frame.store.index];
                        if (object.cls == py_str) {
                            vm.return_value = object;
                        } else {
                            slot = object.cls.lookup('__str__');
                            if (vm.c(slot, [object])) return 1;
                        }
                        break;
                    }
                case 2:
                    if (args.sep.cls == py_str) {
                        vm.return_value = args.sep;
                    } else {
                        slot = args.sep.cls.lookup('__str__');
                        if (vm.c(slot, [args.sep])) return 3;
                    }
                case 3:
                    if (!vm.return_value) return -1;
                    if (!(vm.return_value.cls == py_str)) {
                        raise(TypeError, '__str__ should return a string');
                    }
                    console.log(frame.store.strings.join(vm.return_value.value));
                    return None;
            }
        }
    }, ['sep', 'end', 'file', 'flush', 'objects'], {
        name: 'print',
        module: 'builtins',
        flags: CODE_FLAGS.VAR_ARGS,
        kwargcount: 4,
        defaults: {sep: new_str(' '), end: new_str('\n'), file: None, flush: False}
    });


    py_int.define_method_old('__neg__', function (frame, args) {
        if (!args.self.is_instance_of(py_int)) {
            raise(TypeError, 'invalid operand type');
        }
        return new_int(-args.self.value)
    }, ['self']);
    py_int.define_method_old('__str__', function (frame, args) {
        if (!(args.self instanceof PyInt)) {
            raise(TypeError, 'invalid type');
        }
        return new_str(args.self.value.toString());
    }, ['self']);

    py_int.define_method_old('__lt__', function (args) {
        if (!(args.self instanceof PyInt)) {
            return NotImplemented;
        }
        if (!(args.other instanceof PyInt)) {
            return NotImplemented;
        }
        return new_int(args.self.value < args.other.value);
    }, ['self', 'other'], {simple: true});
    py_int.define_method_old('__le__', function (args) {
        if (!(args.self instanceof PyInt)) {
            return NotImplemented;
        }
        if (!(args.other instanceof PyInt)) {
            return NotImplemented;
        }
        return new_int(args.self.value <= args.other.value);
    }, ['self', 'other'], {simple: true});
    py_int.define_method_old('__eq__', function (args) {
        if (!(args.self instanceof PyInt)) {
            return NotImplemented;
        }
        if (!(args.other instanceof PyInt)) {
            return NotImplemented;
        }
        return new_int(args.self.value == args.other.value);
    }, ['self', 'other'], {simple: true});
    py_int.define_method_old('__ne__', function (args) {
        if (!(args.self instanceof PyInt)) {
            return NotImplemented;
        }
        if (!(args.other instanceof PyInt)) {
            return NotImplemented;
        }
        return new_int(args.self.value != args.other.value);
    }, ['self', 'other'], {simple: true});
    py_int.define_method_old('__gt__', function (args) {
        if (!(args.self instanceof PyInt)) {
            return NotImplemented;
        }
        if (!(args.other instanceof PyInt)) {
            return NotImplemented;
        }
        return new_int(args.self.value > args.other.value);
    }, ['self', 'other'], {simple: true});
    py_int.define_method_old('__ge__', function (args) {
        if (!(args.self instanceof PyInt)) {
            return NotImplemented;
        }
        if (!(args.other instanceof PyInt)) {
            return NotImplemented;
        }
        return new_int(args.self.value >= args.other.value);
    }, ['self', 'other'], {simple: true});

    py_int.define_method_old('__add__', function (args) {
        if (!(args.self instanceof PyInt)) {
            return NotImplemented;
        }
        if (!(args.other instanceof PyInt)) {
            return NotImplemented;
        }
        return new_int(args.self.value + args.other.value);
    }, ['self', 'other'], {simple: true});
    py_int.dict.set('__iadd__', py_int.dict.get('__add__'));

    py_int.define_method_old('__sub__', function (args) {
        if (!(args.self instanceof PyInt)) {
            return NotImplemented;
        }
        if (!(args.other instanceof PyInt)) {
            return NotImplemented;
        }
        return new_int(args.self.value - args.other.value);
    }, ['self', 'other'], {simple: true});
    py_int.dict.set('__isub__', py_int.dict.get('__sub__'));


    py_str.define_method_old('__add__', function (args) {
        if (!(args.self instanceof PyStr)) {
            return NotImplemented;
        }
        if (!(args.other instanceof PyStr)) {
            return NotImplemented;
        }
        return new_str(args.self.value + args.other.value);
    }, ['self', 'other'], {simple: true});
    py_str.define_method_old('__hash__', function (args) {
        return args.self;
    }, ['self'], {simple: true});

    py_dict.define_method_old('__setitem__', function (frame, args) {
        if (!(args['self'] instanceof PyDict)) {
            raise(TypeError, 'invalid type of \'self\' argument');
        }
        switch (frame.position) {
            case 0:
                if (args['key'].cls === py_str) {
                    vm.return_value = args['key'];
                } else if (args['key'].call_method('__hash__')) {
                    return 1;
                }
            case 1:
                if (!vm.return_value) {
                    return null;
                }
                if (vm.return_value instanceof PyStr) {
                    args['self'].set(vm.return_value, args['value']);
                } else if (vm.return_value instanceof PyInt) {
                    args['self'].set(new_str(vm.return_value.value.toString()), args['value']);
                } else {
                    raise(TypeError, 'invalid result type of key hash');
                }
                return None;
        }
    }, ['self', 'key', 'value']);


    function new_method(func, instance) {
        return None;
    }



    py_classmethod.define_method_old('__init__', function (args) {
        if (!(args['self'].dict instanceof PyDict)) {
            raise(TypeError, 'invalid type of \'self\' argument');
        }
        args['self'].dict.set('__func__', args['func']);
    }, ['self', 'func'], {simple: true});
    py_classmethod.define_method_old('__get__', function (args) {
        if (!(args['self'].dict instanceof PyDict)) {
            raise(TypeError, 'invalid type of \'self\' argument');
        }
        return new_method(self['args'].dict.get('__func__'), args['owner']);
    }, ['self', 'instance', 'owner'], {simple: true});


    py_staticmethod.define_method_old('__init__', function (args) {
        if (!(args['self'].dict instanceof PyDict)) {
            raise(TypeError, 'invalid type of \'self\' argument');
        }
        args['self'].dict.set('__func__', args['func']);
    }, ['self', 'func']);
    py_classmethod.define_method_old('__get__', function (args) {
        var func;
        if (!(args['self'].dict instanceof PyDict)) {
            raise(TypeError, 'invalid type of \'self\' argument');
        }
        func = self['args'].dict.get('__func__');
        if (func) {
            return func;
        } else {
            raise(TypeError, 'invalid type of \'self\' argument');
        }
    }, ['self', 'instance', 'owner'], {simple: true});


    var py_range_iterator = new PyType('range_iterator');

    function PyRangeIterator(start, stop, step) {
        PyObject.call(this, py_range_iterator);
        this.current = start.value;
        this.stop = stop.value;
        this.step = step.value;
    }
    PyRangeIterator.prototype = new PyObject;

    py_range_iterator.define_method_old('__next__', function (args) {
        var value;
        if (!(args['self'] instanceof PyRangeIterator)) {
            raise(TypeError, 'invalid type of \'self\' argument');
        }
        value = new_int(args['self'].current);
        if (args['self'].current > args['self'].stop && args['self'].step > 0) {
            raise(StopIteration);
        }
        if (args['self'].current < args['self'].stop && args['self'].step < 0) {
            raise(StopIteration);
        }
        args['self'].current += args['self'].step;
        return value;
    }, ['self'], {simple: true});

    var py_range = new PyType('range');
    py_range.define_method_old('__init__', function (args) {
        if (args['stop'] === None) {
            args['self'].setattr('start', new_int(0));
            args['self'].setattr('stop', args['start']);
        } else {
            args['self'].setattr('start', args['start']);
            args['stop'].setattr('stop', args['stop']);
        }
        if (args['step'] === None) {
            args['self'].setattr('step', new_int(1));
        } else {
            args['self'].setattr('step', args['step']);
        }
    }, ['self', 'start', 'stop', 'step'], {
        simple: true,
        defaults: {'stop': None, 'step': None}
    });
    py_range.define_method_old('__iter__', function (args) {
        return new PyRangeIterator(args['self'].getattr('start'), args['self'].getattr('stop'), args['self'].getattr('step'));
    }, ['self'], {simple: true});






    var build_class = new_native(function (frame, args) {
        var possible_meta_classes, index, good, bases;
        if (!(args['func'].cls == py_function)) {
            raise(TypeError, 'invalid type of \'func\' argument');
        }
        if (!(args['name'] instanceof PyStr)) {
            raise(TypeError, 'invalid type of \'name\' argument');
        }
        if (!(args['bases'] instanceof Array)) {
            raise(TypeError, 'invalid type of \'bases\' argument');
        }
        switch (frame.position) {
            case 0:
                if (args['metaclass'] === None && args['bases'].length == 0) {
                    frame.store.metaclass = py_type;
                } else if (!(args['metaclass'] instanceof PyType)) {
                    frame.store.metaclass = args['metaclass'];
                } else {
                    possible_meta_classes = [];
                    if (args['metaclass'] !== None) {
                        possible_meta_classes.push(args['metaclass']);
                    }
                    for (index = 0; index < args['bases'].length; index++) {
                        if (args['bases'].value[index] instanceof PyType) {
                            possible_meta_classes.push(args['bases'][index].cls)
                        } else {
                            raise(TypeError, 'invalid type of base');
                        }
                    }
                    for (index = 0; index < possible_meta_classes.length; index++) {
                        good = true;
                        possible_meta_classes.forEach(function (meta_class) {
                            if (!possible_meta_classes[index].is_subclass_of(meta_class)) {
                                good = false;
                            }
                        });
                        if (good) {
                            break;
                        }
                    }
                    if (good) {
                        frame.store.metaclass = possible_meta_classes[index];
                    } else {
                        raise(TypeError, 'unable to determine most derived metaclass');
                    }
                }
                if (frame.store.metaclass.call_classmethod(vm, '__prepare__', [new_tuple(args['bases'])], args['keywords'])) {
                    return 1;
                }
            case 1:
                if (!vm.return_value) {
                    return null;
                }
                frame.store.namespace = vm.return_value;
                assert(vm.call_object(args['func']));
                vm.frame.namespace = frame.store.namespace;
                return 2;
            case 2:
                if (!vm.return_value) {
                    return null;
                }
                if (args['bases'].length == 0) {
                    bases = [py_object];
                } else {
                    bases = args['bases'].array;
                }
                if (frame.store.metaclass.call_classmethod(vm, '__new__', [args['name'], new_tuple(bases), frame.store.namespace], args['keywords'])) {
                    return 3;
                }
            case 3:
                if (!vm.return_value) {
                    return null;
                }
                frame.store.cls = vm.return_value;
                if (vm.return_value.call_method('__init__', [args['name'], new_tuple(vm.return_value.bases), frame.store.namespace], args['keywords'])) {
                    return 4;
                }
            case 4:
                if (!vm.return_value) {
                    return null;
                }
                return frame.store.cls;
        }
    }, ['func', 'name', 'metaclass', 'bases', 'keywords'], {
        name: '__build_class__',
        flags: CODE_FLAGS.VAR_ARGS | CODE_FLAGS.VAR_KWARGS,
        kwargcount: 1,
        defaults: {'metaclass': None}
    });

    py_property.define_method_old('__get__', function (frame, args) {
        switch (frame.position) {
            case 0:
                if (vm.call_object(args.self.getattr('fget'), [args.instance])) {
                    return 1;
                }
            case 1:
                break;
        }
    }, ['self', 'instance', 'owner']);

    py_property.define_method_old('__set__', function (frame, args) {
        switch (frame.position) {
            case 0:
                if (vm.call_object(args.self.getattr('fset'), [args.instance, args.value])) {
                    return 1;
                }
            case 1:
                break;
        }
    }, ['self', 'instance', 'value']);

    py_module.define_method('__getattribute__', function (self, name) {
        var value = self.dict.get(name);
        if (!value) {
            raise(AttributeError, 'module has no attribute \'' + name + '\'');
        }
        console.log('module', value);
        return value;
    }, ['name']);

    var append_body = new PyType('test');

    append_body.define_method_old('__init__', function (args) {
        var div = document.createElement('div');
        div.innerHTML = 'hello';
        document.getElementsByTagName('body')[0].appendChild(div);
    }, ['self'], {simple: true});

    var builtins = {
        'object': py_object,
        'type': py_type,
        'dict': py_dict,
        'int': py_int,
        'float': py_float,
        'str': py_str,
        'bytes': py_bytes,
        'tuple': py_tuple,

        'None': None,
        NotImplemented: NotImplemented,
        'Ellipsis': Ellipsis,
        'False': False,
        'True': True,

        'BaseException': BaseException,
        'Exception': Exception,
        'ValueError': ValueError,
        'ArithmeticError': ArithmeticError,
        'LookupError': LookupError,
        'RuntimeError': RuntimeError,
        'BufferError': BufferError,
        'AssertionError': AssertionError,
        'AttributeError': AttributeError,
        'EOFError': EOFError,
        'FloatingPointError': FloatingPointError,
        'GeneratorExit': GeneratorExit,
        'ImportError': ImportError,
        'IndexError': IndexError,
        'KeyError': KeyError,
        'KeyboardInterrupt': KeyboardInterrupt,
        'MemoryError': MemoryError,
        'NameError': NameError,
        'NotImplementedError': NotImplementedError,
        'OSError': OSError,
        'OverflowError': OverflowError,
        'RecursionError': RecursionError,
        'ReferenceError': ReferenceError,
        'StopIteration': StopIteration,
        'SyntaxError': SyntaxError,
        'IndentationError': IndentationError,
        'TabError': TabError,
        'SystemError': SystemError,
        'SystemExit': SystemExit,
        TypeError: TypeError,
        'UnboundLocalError': UnboundLocalError,
        'UnicodeError': UnicodeError,
        'UnicodeEncodeError': UnicodeEncodeError,
        'UnicodeDecodeError': UnicodeDecodeError,
        'UnicodeTranslateError': UnicodeTranslateError,
        'ZeroDivisionError': ZeroDivisionError,
        'EnvironmentError': EnvironmentError,

        'BlockingIOError': BlockingIOError,
        'ChildProcessError': ChildProcessError,
        'BrokenPipeError': BrokenPipeError,
        'ConnectionError': ConnectionError,
        'ConnectionAbortedError': ConnectionAbortedError,
        'ConnectionRefusedError': ConnectionRefusedError,
        'ConnectionResetError': ConnectionResetError,
        'FileExistsError': FileExistsError,
        'FileNotFoundError': FileNotFoundError,
        'InterruptedError': InterruptedError,
        'IsADirectoryError': IsADirectoryError,
        'NotADirectoryError': NotADirectoryError,
        'PermissionError': PermissionError,
        'ProcessLookupError': ProcessLookupError,
        'TimeoutError': TimeoutError,

        '__build_class__': build_class,

        'range': py_range,
        'append_body': append_body,

        'print': print
    };


    var modules = {};
    var pending = {};

    function get_module(name) {
        return modules[name];
    }
    function get_namespace(name) {
        if (name in modules) {
            return modules[name].namespace;
        }
    }

    function Module(name, depends) {
        this.name = name;
        this.depends = depends || [];
        modules[this.name] = this;
    }



    function PythonModule(name, code, depends) {
        Module.call(this, name, depends);
        this.code = code;
    }

    function NativeModule(name, func, depends) {
        Module.call(this, name, depends);
        this.namespace = func.apply(null, [this].concat(this.depends.map(get_namespace)));
    }
    NativeModule.prototype.define_function = function (name, func, signature, options) {
        options = options || {};
        options.module = this.name;
        options.name = name;
        options.qualname = name;
        return new_native(func, signature, options);
    };
    NativeModule.prototype.define_type = function (name, bases, mcs) {
        return new PyType(name, bases, new PyDict(), mcs);
    };

    function define_module(name, code_or_func, depends) {
        if (code_or_func instanceof PyCode) {
            code_or_func = code_or_func.value
        }
        if (typeof code_or_func == 'function') {
            return new NativeModule(name, code_or_func, depends);
        } else if (code_or_func instanceof PythonCode) {
            return new PythonModule(name, code_or_func, depends);
        } else {
            throw new Error('invalid type of code or function');
        }
    }

    define_module('builtins', function (module) {
       return builtins;
    });

    define_module('js', function (module) {
        return {
            'JSError': JSError
        }
    });



    function main(name) {
        if (!vm) {
            vm = new VM();
        }
        vm.run(modules[name].code);
    }

    function Loader() {
        this.root = './';
        this.modules = {};
        this.pending = {};
    }
    Loader.prototype.error = function (name) {
        console.log(name);
    };
    Loader.prototype.success = function (name, source) {
        console.log(name, source);
    };
    Loader.prototype.load = function (name, success, error) {
        if (name in this.modules) {
            return this.module[name];
        }
        if (name in this.pending) {
            this.pending[name].push({success: success, error: error})
            return;
        }
        this.pending[name] = [{success: success, error: error}]
        var filename = this.root + name.split('.').join('/') + '.js';
        var request = new XMLHttpRequest();
        request.open('GET', filename, true);
        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    jaspy.loader.success(name, request.responseText);
                } else {
                    jaspy.loader.error(name);
                }
            }
        };
        request.send();
    };

    var loader = new Loader();


    return {
        'main': main,

        'loader': loader,

        'define_module': define_module,

        'unpack_str': unpack_str,
        'unpack_float': unpack_float,

        raise: raise,

        'builtins': builtins,

        'PyObject': PyObject,
        'PyType': PyType,
        'PyDict': PyDict,
        'PyInt': PyInt,
        'PyFloat': PyFloat,
        'PyStr': PyStr,
        'PyBytes': PyBytes,
        'PyTuple': PyTuple,
        'PyCode': PyCode,

        'py_object': py_object,
        'py_type': py_type,
        'py_dict': py_dict,
        'py_int': py_int,
        'py_bool': py_bool,
        'py_float': py_float,
        'py_str': py_str,
        'py_bytes': py_bytes,
        'py_tuple': py_tuple,
        'py_code': py_code,
        'py_list': py_list,
        'py_set': py_set,
        'py_function': py_function,
        'py_method': py_method,
        'py_generator': py_generator,
        'py_frame': py_frame,
        'py_traceback': py_traceback,
        'py_module': py_module,

        'new_int': new_int,
        'new_float': new_float,
        'new_str': new_str,
        'new_bytes': new_bytes,
        'new_tuple': new_tuple,
        'new_code': new_code,

        'None': None,
        'NotImplemented': NotImplemented,
        'Ellipsis': Ellipsis,
        'False': False,
        'True': True,





        'print': print,

        'PythonCode': PythonCode,
        'NativeCode': NativeCode,

        'VM': VM
    }
})();