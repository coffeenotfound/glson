/// <reference types="node" />
import { Writable } from "stream";
export declare type JsonValue = object | any[] | string | number | boolean | null;
export interface JsonWriter {
    beginObject(name?: string): JsonWriter;
    endObject(): JsonWriter;
    beginArray(name?: string): JsonWriter;
    endArray(): JsonWriter;
    element(value: any, replacer?: Replacer): JsonWriter;
    /** Note: This method is unsafe and may lead to malformed json. */
    elementRaw(rawValue: string): JsonWriter;
    member(name: string, value: any, replacer?: Replacer): JsonWriter;
    /**
     * Note: This method is unsafe and may lead to malformed json.
     * The given raw value must be a valid, well-formed json value.
     * This method does not check for the correctness of the value.
     */
    memberRaw(name: string, rawValue: string): JsonWriter;
}
export declare type Stringify = (a: any) => string;
export declare type ReplaceFunction = (key: string, value: any) => any | undefined;
export declare type ReplaceWhitelist = string[];
export declare type Replacer = ReplaceWhitelist | ReplaceFunction;
export declare class JsonStreamWriter implements JsonWriter {
    protected _stream: Writable;
    protected _stringify: Stringify;
    protected _open: boolean;
    protected _flooded: boolean;
    protected _syntaxStackTop: SyntaxState;
    protected _syntaxStack: SyntaxState[];
    protected _firstInParent: boolean;
    /** Flag used to bypass any lookups into formatting options when using
     * compact formatting for best performance. */
    protected _compactOutput: boolean;
    constructor(stream: Writable, options?: JsonWriterOptions);
    protected _streamDrainCallback(): void;
    beginArray(name?: string): JsonWriter;
    endArray(): JsonWriter;
    beginObject(name?: string): JsonWriter;
    endObject(): JsonWriter;
    element(value: any, replacer?: Replacer): JsonWriter;
    elementRaw(rawValue: string): JsonWriter;
    protected _emitElement(rawValue: string): void;
    member(name: string, value: any, replacer?: Replacer): JsonWriter;
    memberRaw(name: string, rawValue: string): JsonWriter;
    protected _emitMember(name: string, rawValue: string): void;
}
export declare enum SyntaxState {
    IN_ROOT = 0,
    IN_OBJECT = 1,
    IN_ARRAY = 2
}
export declare type JsonWriterOptions = {
    stringify?: Stringify;
    compact?: boolean;
    formatting?: FormattingOptions;
};
export declare type FormattingOptions = {
    indent?: string;
};
