(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global.GooglyEyes = factory());
}(this, (function () { 'use strict';

    function noop() { }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, props) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : prop_values;
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    let SvelteElement;
    if (typeof HTMLElement === 'function') {
        SvelteElement = class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' });
            }
            connectedCallback() {
                // @ts-ignore todo: improve typings
                for (const key in this.$$.slotted) {
                    // @ts-ignore todo: improve typings
                    this.appendChild(this.$$.slotted[key]);
                }
            }
            attributeChangedCallback(attr, _oldValue, newValue) {
                this[attr] = newValue;
            }
            $destroy() {
                destroy_component(this, 1);
                this.$destroy = noop;
            }
            $on(type, callback) {
                // TODO should this delegate to addEventListener?
                const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
                callbacks.push(callback);
                return () => {
                    const index = callbacks.indexOf(callback);
                    if (index !== -1)
                        callbacks.splice(index, 1);
                };
            }
            $set() {
                // overridden by instance, if it has props
            }
        };
    }

    /* src\index.svelte generated by Svelte v3.15.0 */

    function create_fragment(ctx) {
    	let svg;
    	let mask;
    	let circle0;
    	let circle1;
    	let circle2;

    	return {
    		c() {
    			svg = svg_element("svg");
    			mask = svg_element("mask");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			this.c = noop;
    			attr(circle0, "fill", "white");
    			attr(circle0, "cx", "48");
    			attr(circle0, "cy", "48");
    			attr(circle0, "r", "46");
    			attr(mask, "id", "myMask");
    			attr(circle1, "fill", "#FFFF80");
    			attr(circle1, "stroke", "#000000");
    			attr(circle1, "stroke-miterlimit", "10");
    			attr(circle1, "cx", "48");
    			attr(circle1, "cy", "48");
    			attr(circle1, "r", "46");
    			attr(circle2, "cx", ctx.pupil_x);
    			attr(circle2, "cy", ctx.pupil_y);
    			attr(circle2, "r", "24");
    			attr(circle2, "mask", "url(#myMask)");
    			attr(svg, "y", "0px");
    			attr(svg, "version", "1.1");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr(svg, "x", "0px");
    			attr(svg, "id", "Layer_1");
    			attr(svg, "width", "96px");
    			attr(svg, "height", "96px");
    			attr(svg, "viewBox", "0 0 96 96");
    			attr(svg, "enable-background", "new 0 0 96 96");
    			attr(svg, "xml:space", "preserve");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, mask);
    			append(mask, circle0);
    			append(svg, circle1);
    			append(svg, circle2);
    		},
    		p(changed, ctx) {
    			if (changed.pupil_x) {
    				attr(circle2, "cx", ctx.pupil_x);
    			}

    			if (changed.pupil_y) {
    				attr(circle2, "cy", ctx.pupil_y);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    const pupil_x_min = 20;
    const pupil_x_max = 70;
    const pupil_y_min = 20;

    function instance($$self, $$props, $$invalidate) {
    	let pupil_x = 36;
    	const pupil_x_delta = pupil_x_max - pupil_x_min;
    	let pupil_y = 36;
    	const pupil_y_delta = pupil_x_max - pupil_x_min;

    	let { onTouchMove = function (event) {
    		set_pupil(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    	} } = $$props;

    	let { onMouseMove = function (event) {
    		set_pupil(event.clientX, event.clientY);
    	} } = $$props;

    	function set_pupil(x, y) {
    		$$invalidate("pupil_x", pupil_x = pupil_x_min + x / window.innerWidth * pupil_x_delta);
    		$$invalidate("pupil_y", pupil_y = pupil_y_min + y / window.innerHeight * pupil_y_delta);
    	}

    	onMount(function handleMount() {
    		let a = window.addEventListener("touchmove", onTouchMove);
    		let b = window.addEventListener("mousemove", onMouseMove);

    		return function handleUnmount() {
    			window.addEventListener(a);
    			window.addEventListener(b);
    		};
    	});

    	$$self.$set = $$props => {
    		if ("onTouchMove" in $$props) $$invalidate("onTouchMove", onTouchMove = $$props.onTouchMove);
    		if ("onMouseMove" in $$props) $$invalidate("onMouseMove", onMouseMove = $$props.onMouseMove);
    	};

    	return {
    		pupil_x,
    		pupil_y,
    		onTouchMove,
    		onMouseMove
    	};
    }

    class Src extends SvelteElement {
    	constructor(options) {
    		super();
    		init(this, { target: this.shadowRoot }, instance, create_fragment, safe_not_equal, { onTouchMove: 0, onMouseMove: 0 });

    		if (options) {
    			if (options.target) {
    				insert(options.target, this, options.anchor);
    			}

    			if (options.props) {
    				this.$set(options.props);
    				flush();
    			}
    		}
    	}

    	static get observedAttributes() {
    		return ["onTouchMove", "onMouseMove"];
    	}

    	get onTouchMove() {
    		return this.$$.ctx.onTouchMove;
    	}

    	set onTouchMove(onTouchMove) {
    		this.$set({ onTouchMove });
    		flush();
    	}

    	get onMouseMove() {
    		return this.$$.ctx.onMouseMove;
    	}

    	set onMouseMove(onMouseMove) {
    		this.$set({ onMouseMove });
    		flush();
    	}
    }

    customElements.define("googly-eyes", Src);

    return Src;

})));
