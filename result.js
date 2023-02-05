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

    /**
     * Creates a new Result object.
     * @param {"ok" | "err"} type
     * @param {*} val
     */
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

    /**
     * Creates an Ok Result contains the success value.
     * @param {*} T
     * @returns {Result}
     */
    static Ok(T) {
        return new Result("ok", T);
    }

    /**
     * Creates an Err Result contains the error value.
     * @param {*} E
     * @returns {Result}
     */
    static Err(E) {
        return new Result("err", E);
    }

    /**
     * Runs closure f returning an Err if an error occured otherwise an Ok.
     * @param {Function} f
     * @returns {Result}
     */
    static catch(f) {
        try {
            return Result.Ok(f());
        } catch (error) {
            return Result.Err(error);
        }
    }

    /**
     * Prints to the console Ok(T) (if Ok), or Err(E) (if Err).
     */
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

    /**
     * This method tests for self and other values to be equal.
     *
     * Throws an Error if other is not a Result.
     * @param {Result} other
     * @returns {boolean}
     */
    equals(other) {
        Result.#assertResult(other);
        if (this.is_ok() !== other.is_ok()) {
            return false;
        }
        if (this.is_ok()) {
            return this.unwrap() === other.unwrap();
        } else {
            return this.unwrap_err() === other.unwrap_err();
        }
    }

    /**
     * Returns true if the result is Ok.
     * @returns {boolean}
     */
    is_ok() {
        return this.#type === "ok";
    }

    /**
     * Returns true if the result is Ok and the value inside of it passes a test function.
     * @param {Function} f
     * @returns {boolean}
     */
    is_ok_and(f) {
        return this.is_ok() && f(this.#value);
    }

    /**
     * Returns true if the result is Err.
     * @returns {boolean}
     */
    is_err() {
        return this.#type === "err";
    }

    /**
     * Returns true if the result is Err and the value inside of it passes a test function.
     * @param {Function} f
     * @returns {boolean}
     */
    is_err_and(f) {
        return this.is_err() && f(this.#error);
    }

    #panic(msg, method_name, is_value = false) {
        const check = is_value ? this.#value : this.#error;
        if (check instanceof Error) {
            console.error(msg);
            throw check;
        } else {
            console.error(`${msg}:`, check);
            const tmp = new Error(`Unhandled ${method_name}.`);
            // removes #panic from the error stack
            tmp.stack = tmp.stack.split("\n").slice(1).join("\n");
            throw tmp;
        }
    }

    /**
     * Returns the contained Ok value.
     *
     * Throws an Error if the value is an Err, with an error message including the passed message,
     * and the content of the Err.
     * @param {String} msg
     * @returns
     */
    expect(msg) {
        if (this.is_err()) {
            this.#panic(`Panicked at '${msg}'`, "expect");
        }
        return this.#value;
    }

    /**
     * Returns the contained Ok value.
     *
     * Throws an Error if the value is an Err, with a default error message provided.
     * @returns
     */
    unwrap() {
        if (this.is_err()) {
            this.#panic(`Panicked while unwrapping a Result::Err`, "unwrap");
        }
        return this.#value;
    }

    /**
     * Returns the contained Ok value or a provided default.
     * @param {*} defaultValue
     * @returns
     */
    unwrap_or(defaultValue) {
        if (this.is_err()) return defaultValue;
        return this.#value;
    }

    /**
     * Returns the contained Ok value or computes it from a closure.
     * @param {Function} op
     * @returns
     */
    unwrap_or_else(op) {
        if (this.is_err()) return op(this.#error);
        return this.#value;
    }

    /**
     * Returns the contained Err value.
     *
     * Throws an Error if the value is an Ok, with an error message including the passed message,
     * and the content of the Ok.
     * @param {String} msg
     * @returns
     */
    expect_err(msg) {
        if (this.is_ok()) {
            this.#panic(`Panicked at '${msg}'`, "expect_err", true);
        }
        return this.#error;
    }

    /**
     * Returns the contained Err value.
     *
     * Throws an Error if the value is an Ok, with a default error message provided.
     * @returns
     */
    unwrap_err() {
        if (this.is_ok()) {
            this.#panic("Panicked while unwrapping a Result::Ok", "unwrap_err", true);
        }
        return this.#error;
    }

    /**
     * Returns res if the result is Ok, otherwise returns the Err value of self.
     *
     * Throws an Error if res is not a Result.
     * @param {Result} res
     * @returns {Result}
     */
    and(res) {
        Result.#assertResult(res);
        if (this.is_ok()) {
            return res;
        }
        return this;
    }

    /**
     * Calls op if the result is Ok, otherwise returns the Err value of self.
     * @param {Function} op
     * @returns
     */
    and_then(op) {
        if (this.is_ok()) {
            return op(this.#value);
        }
        return this;
    }

    /**
     * Returns res if the result is Err, otherwise returns the Ok value of self.
     *
     * Throws an Error if res is not a Result.
     * @param {Result} res
     * @returns {Result}
     */
    or(res) {
        Result.#assertResult(res);
        if (this.is_err()) {
            return res;
        }
        return this;
    }

    /**
     * Calls op if the result is Err, otherwise returns the Ok value of self.
     * @param {Function} op
     * @returns
     */
    or_else(op) {
        if (this.is_err()) {
            return op(this.#error);
        }
        return this;
    }

    /**
     * Returns true if the result is an Ok value containing the given value.
     * @param {*} x
     * @returns {boolean}
     */
    contains(x) {
        return this.is_ok() && this.#value === x;
    }

    /**
     * Returns true if the result is an Err value containing the given value.
     * @param {*} x
     * @returns {boolean}
     */
    contains_err(x) {
        return this.is_err() && this.#error === x;
    }

    /**
     * Maps from Result containing T to Result containing U by applying a function to a contained Ok value, leaving an Err value untouched.
     *
     * from Result<T, E> to Result<U, E>.
     * @param {Function} op
     * @returns {Result}
     */
    map(op) {
        if (this.is_err()) return this;
        return Result.Ok(op(this.#value));
    }

    /**
     * Returns the provided default (if Err), or applies a function to the contained value (if Ok).
     * @param {*} defaultValue
     * @param {Function} f
     * @returns
     */
    map_or(defaultValue, f) {
        if (this.is_ok()) return f(this.#value);
        return defaultValue;
    }

    /**
     * Maps a Result containing T to a type U by applying fallback
     * function defaultF to a contained Err value,
     * or function f to a contained Ok value.
     *
     * from Result<T, E> to U.
     * @param {Function} defaultF
     * @param {Function} f
     * @returns
     */
    map_or_else(defaultF, f) {
        if (this.is_ok()) return f(this.#value);
        return defaultF(this.#error);
    }

    /**
     * Maps from Result containing error E to Result containing error F
     * by applying a function to a contained Err value, leaving an Ok value untouched.
     *
     * from Result<T, E> to Result<T, F>.
     * @param {Function} op
     * @returns {Result}
     */
    map_err(op) {
        if (this.is_ok()) return this;
        return Result.Err(op(this.#error));
    }
}

const { Ok, Err } = Result;
const Rcatch = Result.catch;
export { Result, Ok, Err, Rcatch };
