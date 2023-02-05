class Result {
    #type;
    #value;
    #error;

    static #valid_type(type) {
        if (typeof type === "string" || type instanceof String) {
            let tmp = type.toLowerCase();
            if (tmp === "ok" || tmp === "err") return true;
        }
        return false;
    }

    static #assertResult(x) {
        if (!(x instanceof Result)) throw new TypeError(`Expected res to be of type Result got '${x}'`);
    }

    constructor(type, val) {
        if (!Result.#valid_type(type))
            throw new TypeError(`Expected type 'ok' or 'err' got type '${type.toString()}'.`);
        this.#type = type.toLowerCase();
        if (this.is_err()) {
            this.#error = val;
            this.#value = null;
        } else {
            this.#value = val;
            this.#error = null;
        }
    }

    print() {
        switch (this.is_ok()) {
            case true:
                console.log("Ok(", { value: this.#value }, ")");
                break;
            case false:
                console.log("Err(", { error: this.#error }, ")");
                break;
        }
    }

    equals(res) {
        if (this.is_ok() !== res.is_ok()) {
            return false;
        }
        if (this.is_ok()) {
            return this.unwrap() === res.unwrap();
        } else {
            return this.unwrap_err() === res.unwrap_err();
        }
    }

    is_ok() {
        return this.#type === "ok";
    }

    is_ok_and(func) {
        return this.is_ok() && func(this.#value);
    }

    is_err() {
        return this.#type === "err";
    }

    is_err_and(func) {
        return this.is_err() && func(this.#error);
    }

    expect(msg) {
        if (this.is_err()) {
            throw new Error(`Panicked at '${msg}': "${this.#error}".`);
        }
        return this.#value;
    }

    unwrap() {
        if (this.is_err()) {
            throw new Error(`Panicked while unwrapping a Result::Err \`${this.#error}\`.`);
        }
        return this.#value;
    }

    unwrap_or(defval) {
        if (this.is_err()) return defval;
        return this.#value;
    }

    unwrap_or_else(op) {
        if (this.is_err()) return op(this.#error);
        return this.#value;
    }

    expect_err(msg) {
        if (this.is_ok()) {
            throw new Error(`Panicked at '${msg}': "${this.#value}".`);
        }
        return this.#error;
    }

    unwrap_err() {
        if (this.is_ok()) {
            throw new Error(`Panicked while unwrapping a Result::Ok \`${this.#value}\`.`);
        }
        return this.#error;
    }

    and(res) {
        Result.#assertResult(res);
        if (this.is_ok()) {
            return res;
        }
        return this;
    }

    and_then(op) {
        if (this.is_ok()) {
            return op(this.#value);
        }
        return this;
    }

    or(res) {
        Result.#assertResult(res);
        if (this.is_err()) {
            return res;
        }
        return this;
    }

    or_else(op) {
        if (this.is_err()) {
            return op(this.#error);
        }
        return this;
    }

    contains(x) {
        return this.is_ok() && this.#value === x;
    }

    contains_err(x) {
        return this.is_err() && this.#error === x;
    }

    map(op) {
        if (this.is_err()) return this;
        return new Result("ok", op(this.#value));
    }

    map_or(defval, func) {
        if (this.is_ok()) return func(this.#value);
        return defval;
    }

    map_or_else(deffun, func) {
        if (this.is_ok()) return func(this.#value);
        return deffun(this.#error);
    }

    map_err(op) {
        if (this.is_ok()) return this;
        return new Result("err", op(this.#error));
    }
}

const Ok = (x) => new Result("ok", x);
const Err = (x) => new Result("err", x);
