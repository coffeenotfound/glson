import {describe, it} from 'mocha';
import {expect} from 'chai';
import {BufferWritableMock} from 'stream-mock';
import {Writable} from 'stream';
import * as fs from 'fs';
import * as path from 'path';

import {JsonWriter, JsonStreamWriter} from "../src/JsonWriter";

describe('JsonWriter Unit Tests', () => {
	describe('Within root context', () => {
		it('beginning a nameless array should not throw', () => {
			let stream = new BufferWritableMock();
			let writer = new JsonStreamWriter(stream);
			
			expect(() => writer.beginArray()).not.throw();
		});
		it('beginning a nameless object should not throw', () => {
			let stream = new BufferWritableMock();
			let writer = new JsonStreamWriter(stream);
			
			expect(() => writer.beginObject()).not.throw();
		});
		it('beginning a named array should throw', () => {
			let stream = new BufferWritableMock();
			let writer = new JsonStreamWriter(stream);
			
			expect(() => writer.beginArray("foobar")).throw(/(cannot).*(begin).*(array)/i);
		});
		it('beginning a named object should throw', () => {
			let stream = new BufferWritableMock();
			let writer = new JsonStreamWriter(stream);
			
			expect(() => writer.beginObject("foobar")).throw(/(cannot).*(begin).*(object)/i);
		});
		it('adding a named member should throw', () => {
			let stream = new BufferWritableMock();
			let writer = new JsonStreamWriter(stream);
			
			expect(() => writer.member("foobar", 42)).throw(/(cannot).*(member)/i);
		});
		it('adding a nameless element should not throw', () => {
			let stream = new BufferWritableMock();
			let writer = new JsonStreamWriter(stream);
			
			expect(() => writer.element(42)).not.throw();
		});
	});
});

describe("JsonWriter Module Tests", () => {
	it("Writing to file should work properly", () => {
		let tempPath = path.join(__dirname, "temp/", "test1.json");
		let stream = fs.createWriteStream(tempPath);
		
		let writer = new JsonStreamWriter(stream);
		
		writer.beginArray();
			writer.element(20.0);
			writer.element("hello");
			writer.beginObject();
				writer.member("foo", "bar");
				writer.member("meaning", 42.0);
				writer.beginArray("array");
				writer.endArray();
				writer.beginObject("object");
					writer.member("inside", {of: "object", using: ["the", "stringifier"]});
				writer.endObject();
			writer.endObject();
		writer.endArray();
		
		stream.close();
	});
});
