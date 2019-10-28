import {Writable} from "stream";
import {JsonFormatError} from "./JsonFormatError";

export type JsonValue = object | any[] | string | number | boolean | null;

export interface JsonWriter {
	beginObject(name?: string): JsonWriter;
	endObject(): JsonWriter;
	
	beginArray(name?: string): JsonWriter;
	endArray(): JsonWriter;
	
	element(value: JsonValue, replacer?: Replacer): JsonWriter;
	
	/** Note: This method is unsafe and may lead to malformed json. */
	elementRaw(rawValue: string): JsonWriter;
	
	member(name: string, value: JsonValue, replacer?: Replacer): JsonWriter;
	
	/**
	 * Note: This method is unsafe and may lead to malformed json.
	 * The given raw value must be a valid, well-formed json value.
	 * This method does not check for the correctness of the value.
	 */
	memberRaw(name: string, rawValue: string): JsonWriter;
	
	// flush(): Promise<void>;
	
	// hasError();
	// retrieveError();
	// barrier(): Promise<JsonWriter>;
	//
	// cork(): void;
	// uncork(): boolean;
	//
	// isOpen(): boolean;
	// close(): Promise<JsonWriter>;
	//
	// // TODO: Implement event handlers
	// listen(): void
	// unlisten(): boolean;
}

export type Stringify = (a: any) => string;

const DEFAULT_STRINGIFY: Stringify = (a: any) => JSON.stringify(a);

export type ReplaceFunction = (key: string, value: any) => any|undefined;
export type ReplaceWhitelist = string[];
export type Replacer = ReplaceWhitelist | ReplaceFunction;

export class JsonStreamWriter implements JsonWriter {
	protected _stream: Writable;
	protected _stringify: Stringify;
	
	protected _open: boolean;
	protected _flooded: boolean;
	protected _syntaxStackTop: SyntaxState = SyntaxState.IN_ROOT;
	protected _syntaxStack: SyntaxState[] = [this._syntaxStackTop];
	protected _firstInParent: boolean;
	
	/** Flag used to bypass any lookups into formatting options when using
	 * compact formatting for best performance. */
	protected _compactOutput: boolean;
	
	public constructor(stream: Writable, options?: JsonWriterOptions) {
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
	
	protected _streamDrainCallback(): void {
		// Reset flooded flag
		this._flooded = false;
	}
	
	public beginArray(name?: string): JsonWriter {
		let hasName = (name !== undefined);
		
		// Check for name
		switch(this._syntaxStackTop) {
			case SyntaxState.IN_ROOT: case SyntaxState.IN_ARRAY: {
				if(hasName) throw new JsonFormatError("Cannot begin a named array member in the root or an array");
			} break;
			
			case SyntaxState.IN_OBJECT: {
				if(!hasName) throw new JsonFormatError("Cannot begin a nameless array element in an object");
			} break;
		}
		
		if(this._compactOutput) {
			let chunk: string;
			if(this._firstInParent) {
				chunk = (hasName ? `"${name}":[` : "[")
			}
			else {
				chunk = (hasName ? `,"${name}":[` : ",[");
				this._firstInParent = false;
			}
			
			if(this._stream.write(chunk)) {
				this._flooded = true;
			}
		}
		else throw new JsonFormatError("Only compact output is implemented");
		
		// Push syntax state
		this._syntaxStack.push(this._syntaxStackTop = SyntaxState.IN_ARRAY);
		
		this._firstInParent = true;
		
		// Return self
		return this;
	}
	
	public endArray(): JsonWriter {
		// Check syntax state
		if(this._syntaxStackTop !== SyntaxState.IN_ARRAY) {
			throw new JsonFormatError("Cannot end an array outside of an array");
		}
		
		// Write output
		if(this._compactOutput) {
			if(this._stream.write(']')) {
				this._flooded = true;
			}
		}
		else throw new JsonFormatError("Only compact output is implemented");
		
		// Pop syntax state
		let stack = this._syntaxStack;
		stack.pop();
		this._syntaxStackTop = stack[stack.length-1];
		
		this._firstInParent = false;
		
		// Return self
		return this;
	}
	
	public beginObject(name?: string): JsonWriter {
		let hasName = (name !== undefined);
		
		// Check for name
		switch(this._syntaxStackTop) {
			case SyntaxState.IN_ROOT: case SyntaxState.IN_ARRAY: {
				if(hasName) throw new JsonFormatError("Cannot begin a named object member in the root or an array");
			} break;
			
			case SyntaxState.IN_OBJECT: {
				if(!hasName) throw new JsonFormatError("Cannot begin a nameless object element in an object");
			} break;
		}
		
		if(this._compactOutput) {
			let chunk: string;
			if(this._firstInParent) {
				chunk = (hasName ? `"${name}":{` : "{")
			}
			else {
				chunk = (hasName ? `,"${name}":{` : ",{");
				this._firstInParent = false;
			}
			
			if(this._stream.write(chunk)) {
				this._flooded = true;
			}
		}
		else throw new JsonFormatError("Only compact output is implemented");
		
		// Push syntax state
		this._syntaxStack.push(this._syntaxStackTop = SyntaxState.IN_OBJECT);
		
		this._firstInParent = true;
		
		// Return self
		return this;
	}
	
	public endObject(): JsonWriter {
		// Check syntax state
		if(this._syntaxStackTop !== SyntaxState.IN_OBJECT) {
			throw new JsonFormatError("Cannot end an object outside of an object");
		}
		
		// Write output
		if(this._compactOutput) {
			if(this._stream.write('}')) {
				this._flooded = true;
			}
		}
		else throw new JsonFormatError("Only compact output is implemented");
		
		// Pop syntax state
		let stack = this._syntaxStack;
		stack.pop();
		this._syntaxStackTop = stack[stack.length-1];
		
		this._firstInParent = false;
		
		// Return self
		return this;
	}
	
	public element(value: any, replacer?: Replacer): JsonWriter {
		// Validate syntax state
		switch(this._syntaxStackTop) {
			case SyntaxState.IN_OBJECT: throw new JsonFormatError("Cannot put a nameless element in an object");
			case SyntaxState.IN_ROOT: if(!this._firstInParent) {
				throw new JsonFormatError("Cannot put multiple lose elements in the root");
			} break;
			default:
		}
		
		// TODO: Implement replacer invocation
		let raw = this._stringify(value);
		
		this._emitElement(raw);
		
		// Return self
		return this;
	}
	
	public elementRaw(rawValue: string): JsonWriter {
		// Validate syntax state
		switch(this._syntaxStackTop) {
			case SyntaxState.IN_OBJECT: throw new JsonFormatError("Cannot put a nameless raw element in an object");
			default:
		}
		
		this._emitElement(rawValue);
		
		// Return self
		return this;
	}
	
	protected _emitElement(rawValue: string): void {
		if(this._compactOutput) {
			if(!this._firstInParent) {
				this._stream.write(',');
			}
			else this._firstInParent = false;
			
			if(!this._stream.write(rawValue)) {
				this._flooded = true;
			}
		}
		else throw new JsonFormatError("Only compact output is implemented");
	}
	
	public member(name: string, value: any, replacer?: Replacer): JsonWriter {
		// Validate syntax state
		switch(this._syntaxStackTop) {
			case SyntaxState.IN_ROOT: case SyntaxState.IN_ARRAY: throw new JsonFormatError("Cannot put a named member in the root or an array");
			default:
		}
		
		// TODO: Implement replacer invocation
		// if(replacer != null) {
		// 	if(typeof replacer === "array") {
		//		
		// 	}
		// 	else if(typeof replacer === "function") {
		//		
		// 	}
		// }
		
		let raw = this._stringify(value);
		this._emitMember(name, raw);
		
		// Return self
		return this;
	}
	
	public memberRaw(name: string, rawValue: string): JsonWriter {
		// Validate syntax state
		switch(this._syntaxStackTop) {
			case SyntaxState.IN_ROOT: case SyntaxState.IN_ARRAY: throw new JsonFormatError("Cannot put a named member in the root or an array");
			default:
		}
		
		this._emitMember(name, rawValue);
		
		// Return self
		return this;
	}
	
	protected _emitMember(name: string, rawValue: string) {
		if(this._compactOutput) {
			let chunk = `"${name}":${rawValue}`;
			
			if(!this._firstInParent) {
				this._stream.write(',');
			}
			this._firstInParent = false;
			
			if(!this._stream.write(chunk)) {
				this._flooded = true;
			}
		}
		else throw new JsonFormatError("Only compact output is implemented");
	}
	
	// public barrier(): Promise<JsonWriter> {
	//	
	// }
	
	// public flush(): Promise<void> {
	//	
	// }
}

export enum SyntaxState {
	IN_ROOT,
	IN_OBJECT,
	IN_ARRAY,
}

// TODO: Figure out type safe options pattern and implement
export type JsonWriterOptions = {
	stringify?: Stringify,
	compact?: boolean,
	formatting?: FormattingOptions,
}

export type FormattingOptions = {
	indent?: string,
	newline?: string,
}
