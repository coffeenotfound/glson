(function(FuseBox){FuseBox.$fuse$=FuseBox;
FuseBox.target = "server";
FuseBox.pkg("default", {}, function(___scope___){
___scope___.file("main.js", function(exports, require, module, __filename, __dirname){

"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./JsonWriter"));
__export(require("./JsonFormatError"));
//# sourceMappingURL=glson.es.js.map?tm=1566398911812
});
___scope___.file("JsonWriter.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const JsonFormatError_1 = require("./JsonFormatError");
const DEFAULT_STRINGIFY = (a) => JSON.stringify(a);
class JsonStreamWriter {
    constructor(stream, options) {
        this._syntaxStackTop = SyntaxState.IN_ROOT;
        this._syntaxStack = [this._syntaxStackTop];
        this._stream = stream;
        this._stringify = DEFAULT_STRINGIFY;
        this._open = stream.writable;
        this._flooded = stream.writable;
        this._firstInParent = true;
        // Evaluate options
        options = options || {};
        this._compactOutput = options.compact || true;
        // Register stream event handlers
        this._stream.addListener("drain", this._streamDrainCallback);
    }
    _streamDrainCallback() {
        // Reset flooded flag
        this._flooded = false;
    }
    beginArray(name) {
        let hasName = !!name;
        // Check for name
        switch (this._syntaxStackTop) {
            case SyntaxState.IN_ROOT:
            case SyntaxState.IN_ARRAY:
                {
                    if (hasName)
                        throw new JsonFormatError_1.JsonFormatError("Cannot begin a named array member in the root or an array");
                }
                break;
            case SyntaxState.IN_OBJECT:
                {
                    if (!hasName)
                        throw new JsonFormatError_1.JsonFormatError("Cannot begin a nameless array element in an object");
                }
                break;
        }
        if (this._compactOutput) {
            let chunk;
            if (this._firstInParent) {
                chunk = (hasName ? `"${name}":[` : "[");
            }
            else {
                chunk = (hasName ? `,"${name}":[` : ",[");
                this._firstInParent = false;
            }
            if (this._stream.write(chunk)) {
                this._flooded = true;
            }
        }
        else
            throw new JsonFormatError_1.JsonFormatError("Only compact output is implemented");
        // Push syntax state
        this._syntaxStack.push(this._syntaxStackTop = SyntaxState.IN_ARRAY);
        this._firstInParent = true;
        // Return self
        return this;
    }
    endArray() {
        // Check syntax state
        if (this._syntaxStackTop !== SyntaxState.IN_ARRAY) {
            throw new JsonFormatError_1.JsonFormatError("Cannot end an array outside of an array");
        }
        // Write output
        if (this._compactOutput) {
            if (this._stream.write(']')) {
                this._flooded = true;
            }
        }
        else
            throw new JsonFormatError_1.JsonFormatError("Only compact output is implemented");
        // Pop syntax state
        let stack = this._syntaxStack;
        stack.pop();
        this._syntaxStackTop = stack[stack.length - 1];
        this._firstInParent = false;
        // Return self
        return this;
    }
    beginObject(name) {
        let hasName = !!name;
        // Check for name
        switch (this._syntaxStackTop) {
            case SyntaxState.IN_ROOT:
            case SyntaxState.IN_ARRAY:
                {
                    if (hasName)
                        throw new JsonFormatError_1.JsonFormatError("Cannot begin a named object member in the root or an array");
                }
                break;
            case SyntaxState.IN_OBJECT:
                {
                    if (!hasName)
                        throw new JsonFormatError_1.JsonFormatError("Cannot begin a nameless object element in an object");
                }
                break;
        }
        if (this._compactOutput) {
            let chunk;
            if (this._firstInParent) {
                chunk = (hasName ? `"${name}":{` : "{");
            }
            else {
                chunk = (hasName ? `,"${name}":{` : ",{");
                this._firstInParent = false;
            }
            if (this._stream.write(chunk)) {
                this._flooded = true;
            }
        }
        else
            throw new JsonFormatError_1.JsonFormatError("Only compact output is implemented");
        // Push syntax state
        this._syntaxStack.push(this._syntaxStackTop = SyntaxState.IN_OBJECT);
        this._firstInParent = true;
        // Return self
        return this;
    }
    endObject() {
        // Check syntax state
        if (this._syntaxStackTop !== SyntaxState.IN_OBJECT) {
            throw new JsonFormatError_1.JsonFormatError("Cannot end an object outside of an object");
        }
        // Write output
        if (this._compactOutput) {
            if (this._stream.write('}')) {
                this._flooded = true;
            }
        }
        else
            throw new JsonFormatError_1.JsonFormatError("Only compact output is implemented");
        // Pop syntax state
        let stack = this._syntaxStack;
        stack.pop();
        this._syntaxStackTop = stack[stack.length - 1];
        this._firstInParent = false;
        // Return self
        return this;
    }
    element(value, replacer) {
        // Validate syntax state
        switch (this._syntaxStackTop) {
            case SyntaxState.IN_OBJECT: throw new JsonFormatError_1.JsonFormatError("Cannot put a nameless element in an object");
            case SyntaxState.IN_ROOT:
                if (!this._firstInParent) {
                    throw new JsonFormatError_1.JsonFormatError("Cannot put multiple lose elements in the root");
                }
                break;
            default:
        }
        // TODO: Implement replacer invocation
        let raw = this._stringify(value);
        this._emitElement(raw);
        // Return self
        return this;
    }
    elementRaw(rawValue) {
        // Validate syntax state
        switch (this._syntaxStackTop) {
            case SyntaxState.IN_OBJECT: throw new JsonFormatError_1.JsonFormatError("Cannot put a nameless raw element in an object");
            default:
        }
        this._emitElement(rawValue);
        // Return self
        return this;
    }
    _emitElement(rawValue) {
        if (this._compactOutput) {
            if (!this._firstInParent) {
                this._stream.write(',');
            }
            else
                this._firstInParent = false;
            if (!this._stream.write(rawValue)) {
                this._flooded = true;
            }
        }
        else
            throw new JsonFormatError_1.JsonFormatError("Only compact output is implemented");
    }
    member(name, value, replacer) {
        // Validate syntax state
        switch (this._syntaxStackTop) {
            case SyntaxState.IN_ROOT:
            case SyntaxState.IN_ARRAY: throw new JsonFormatError_1.JsonFormatError("Cannot put a named member in the root or an array");
            default:
        }
        // TODO: Implement replacer invocation
        let raw = this._stringify(value);
        this._emitMember(name, raw);
        // Return self
        return this;
    }
    memberRaw(name, rawValue) {
        // Validate syntax state
        switch (this._syntaxStackTop) {
            case SyntaxState.IN_ROOT:
            case SyntaxState.IN_ARRAY: throw new JsonFormatError_1.JsonFormatError("Cannot put a named member in the root or an array");
            default:
        }
        this._emitMember(name, rawValue);
        // Return self
        return this;
    }
    _emitMember(name, rawValue) {
        if (this._compactOutput) {
            let chunk = `"${name}":${rawValue}`;
            if (!this._firstInParent) {
                this._stream.write(',');
            }
            this._firstInParent = false;
            if (!this._stream.write(chunk)) {
                this._flooded = true;
            }
        }
        else
            throw new JsonFormatError_1.JsonFormatError("Only compact output is implemented");
    }
}
exports.JsonStreamWriter = JsonStreamWriter;
var SyntaxState;
(function (SyntaxState) {
    SyntaxState[SyntaxState["IN_ROOT"] = 0] = "IN_ROOT";
    SyntaxState[SyntaxState["IN_OBJECT"] = 1] = "IN_OBJECT";
    SyntaxState[SyntaxState["IN_ARRAY"] = 2] = "IN_ARRAY";
})(SyntaxState = exports.SyntaxState || (exports.SyntaxState = {}));
//# sourceMappingURL=glson.es.js.map?tm=1566398911812
});
___scope___.file("JsonFormatError.js", function(exports, require, module, __filename, __dirname){

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JsonFormatError extends Error {
}
exports.JsonFormatError = JsonFormatError;
//# sourceMappingURL=glson.es.js.map?tm=1566397103621
});
});
})
(FuseBox)
//# sourceMappingURL=glson.es.js.map